"""
Module: app/ai/agent/orchestrator.py

AgentOrchestrator — the central AI pipeline coordinator.

Workflow:
  1. Detect language (reuses LanguageDetector)
  2. Classify intent + extract entities (reuses IntentClassifier, EntityExtractor)
  3. Check confidence (ConfidenceChecker)
  4. Extract / update profile (reuses BeneficiaryProfileExtractor + PII guardrail)
  5. Detect missing fields (MissingFieldDetector)
  6. Route by intent (router.py)
  7. Execute deterministic services (eligibility, recommendation, finance, documents, partners)
  8. Generate response (template-based + optional LLM formatting)
  9. Apply safety filter

CRITICAL RULE:
  The LLM does NOT make eligibility decisions.
  All eligibility/financial results come from deterministic services.
  The LLM only formats the explanation text.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from app.schemas.chat import BeneficiaryProfile, IntentEnum
from app.schemas.conversation import (
    ConversationMessage, ConversationState, WorkflowState,
    ChatRequest, ChatResponse, ApplicationGuidanceResponse, ApplicationGuidanceStep
)
from app.ai.nlp.language_detection import LanguageDetector
from app.ai.nlp.intent import IntentClassifier
from app.ai.nlp.profile_extractor import BeneficiaryProfileExtractor
from app.ai.nlp.missing_fields import MissingFieldDetector
from app.ai.guardrails.confidence import ConfidenceChecker
from app.ai.guardrails.safety import SafetyFilter
from app.ai.agent.router import route_intent
from app.ai.agent.prompts import get_language_name, build_system_prompt, RECOMMENDATION_TEMPLATE
from app.ai.agent.state import AgentSessionState
from app.ai.recommendation.explanation import SchemeExplainer
from app.integrations.llm.provider import get_llm_provider
from app.services.eligibility_service import get_registry


# ── Multilingual greeting templates ──────────────────────────────────────

_GREETINGS: Dict[str, str] = {
    "en-IN": (
        "Hello! I'm your AI Government Scheme Assistant. "
        "I can help you find eligible schemes, check loan options, "
        "understand required documents, and guide your application. "
        "How can I help you today?"
    ),
    "ta-IN": (
        "வணக்கம்! நான் உங்கள் AI அரசு திட்ட உதவியாளர். "
        "நான் உங்களுக்கு தகுதியான திட்டங்களை கண்டறியவும், "
        "கடன் விருப்பங்களை சரிபார்க்கவும் உதவலாம். "
        "இன்று நான் எப்படி உதவலாம்?"
    ),
    "hi-IN": (
        "नमस्ते! मैं आपका AI सरकारी योजना सहायक हूँ। "
        "मैं आपको उपयुक्त योजनाएं खोजने, ऋण विकल्प जांचने और "
        "आवेदन प्रक्रिया में मार्गदर्शन करने में मदद कर सकता हूँ। "
        "आज मैं आपकी कैसे मदद कर सकता हूँ?"
    ),
    "te-IN": (
        "నమస్కారం! నేను మీ AI ప్రభుత్వ పథకాల సహాయకుడిని. "
        "నేను మీకు అర్హమైన పథకాలు కనుగొనడంలో సహాయం చేయగలను. "
        "ఈరోజు నేను మీకు ఎలా సహాయపడగలను?"
    ),
}

_ESCALATION: Dict[str, str] = {
    "en-IN": "I understand you'd like to speak with a human officer. Please call the PM Jan Sewa Helpline at 1800-180-1111 (toll-free) or visit your nearest Common Service Centre (CSC).",
    "ta-IN": "நீங்கள் ஒரு அதிகாரியிடம் பேச விரும்புகிறீர்கள் என புரிகிறது. PM Jan Sewa Helpline: 1800-180-1111 (இலவசம்) அல்லது அருகில் உள்ள CSC மையத்தை தொடர்பு கொள்ளுங்கள்.",
    "hi-IN": "मैं समझता हूँ कि आप एक अधिकारी से बात करना चाहते हैं। PM Jan Sewa Helpline: 1800-180-1111 (टोल-फ्री) पर कॉल करें।",
}


class AgentOrchestrator:
    """
    Main AI pipeline orchestrator. Coordinates all AI + deterministic services.
    """

    @classmethod
    def run(
        cls,
        request: ChatRequest,
        conversation_state: Optional[ConversationState] = None,
    ) -> tuple[ChatResponse, ConversationState]:
        """
        Run the full AI pipeline for a single user turn.

        Args:
            request:            ChatRequest (text + optional conversation_id).
            conversation_state: Existing conversation state or None (new conversation).

        Returns:
            (ChatResponse, updated ConversationState)
        """
        text = request.text.strip()

        # ── Initialize or restore state ────────────────────────────────
        if conversation_state is None:
            conversation_id = str(uuid.uuid4())
            session_id = str(uuid.uuid4())
            state = AgentSessionState(
                conversation_id=conversation_id,
                session_id=session_id,
            )
            conv = cls._new_conversation(conversation_id, session_id)
        else:
            conv = conversation_state
            state = cls._restore_state(conv)

        state.turn_count += 1

        # ── Step 1: Language Detection ─────────────────────────────────
        lang, lang_conf, is_mixed, script = LanguageDetector.detect(text)
        if request.language_hint and lang_conf < 0.75:
            lang = request.language_hint
        state.detected_language = lang
        state.language_confidence = lang_conf

        # ── Step 2: Intent + Entity Classification ─────────────────────
        intent, intent_conf, entities = IntentClassifier.classify(text, language_hint=lang)
        state.current_intent = intent
        state.intent_confidence = intent_conf
        state.entities.update(entities)

        # ── Step 3: Confidence Check ───────────────────────────────────
        conf_result = ConfidenceChecker.check(
            language_confidence=lang_conf,
            intent_confidence=intent_conf,
            language=lang,
            intent=intent,
        )
        if not conf_result.is_confident:
            state.response_text = conf_result.clarification_question or "Could you please clarify?"
            state.confidence_warning = f"Low {conf_result.low_confidence_reason} confidence"
            return cls._build_response(state, conv, text)

        # ── Step 4: Profile Extraction (merge with existing) ───────────
        extract_result = BeneficiaryProfileExtractor.extract(text)
        state.pii_detected = extract_result.pii_detected
        state.profile = cls._merge_profiles(state.profile, extract_result.profile)

        # ── Step 5: Route by Intent ────────────────────────────────────
        target_state = route_intent(intent)

        # Handle escalation immediately
        if target_state == WorkflowState.ESCALATED:
            state.workflow_state = WorkflowState.ESCALATED
            state.response_text = SafetyFilter.filter(
                _ESCALATION.get(lang, _ESCALATION["en-IN"])
            )
            return cls._build_response(state, conv, text)

        # Handle polite closings / affirmations (e.g., "thank you", "thanks", "okay thank you")
        cleaned_lower = text.lower().strip()
        polite_phrases = [
            "thank you", "thanks", "thankyou", "okay thank you", "ok thank you", "thanks a lot",
            "thank you so much", "nandri", "dhanyawad", "shukriya", "got it", "okay got it",
            "ok got it", "great", "nice", "awesome", "perfect", "bye", "goodbye", "நன்றி", "धन्यवाद"
        ]
        if any(p in cleaned_lower for p in polite_phrases):
            state.workflow_state = WorkflowState.COMPLETED
            state.response_text = "You are very welcome! If you need any more assistance with government schemes or loan applications in the future, feel free to ask anytime."
            return cls._build_response(state, conv, text)

        # Handle simple greetings ONLY if no profile fields were extracted
        is_simple_greeting = cleaned_lower in ["hi", "hello", "hey", "help", "namaste", "vanakkam", "வணக்கம்", "नमस्ते"]
        has_profile_data = any(v is not None for v in state.profile.model_dump().values())

        if is_simple_greeting and not has_profile_data:
            state.workflow_state = WorkflowState.START
            state.response_text = _GREETINGS.get(lang, _GREETINGS["en-IN"])
            return cls._build_response(state, conv, text)

        # ── Step 6: Financial Calculation ─────────────────────────────
        if intent == IntentEnum.FINANCIAL_CALCULATION:
            fin_result = cls._handle_financial(state, entities)
            if fin_result:
                state.financial_calculation = fin_result
                state.workflow_state = WorkflowState.FINANCIAL_CALC
                state.response_text = cls._format_financial_response(fin_result, lang)
                return cls._build_response(state, conv, text)

        # ── Step 7: Document Query ─────────────────────────────────────
        if intent == IntentEnum.DOCUMENT_REQUIREMENTS:
            doc_result = cls._handle_documents(state, entities)
            if doc_result:
                state.document_guidance = doc_result
                state.workflow_state = WorkflowState.DOCUMENT_GUIDANCE
                state.response_text = cls._format_document_response(doc_result, lang)
                return cls._build_response(state, conv, text)

        # ── Step 8: Partner Search ─────────────────────────────────────
        if intent == IntentEnum.PARTNER_SEARCH:
            partners = cls._handle_partners(state)
            if partners is not None:
                state.partner_results = partners
                state.workflow_state = WorkflowState.PARTNER_SEARCH
                state.response_text = cls._format_partner_response(partners, lang)
                return cls._build_response(state, conv, text)

        # ── Step 9: Application Guidance for Scheme ────────────
        from app.ai.nlp.entity_extraction import EntityExtractor
        explicit_scheme = EntityExtractor.resolve_scheme_id(text)

        is_app_query = intent == IntentEnum.APPLICATION_GUIDANCE or any(
            phrase in cleaned_lower for phrase in ["how to apply", "how can i apply", "application process", "apply for", "application procedure", "steps to apply"]
        )

        if is_app_query:
            # 1. Explicit scheme mention in current query ALWAYS overrides prior context
            if explicit_scheme:
                resolved_scheme_id = explicit_scheme
            # 2. Otherwise use current entities or unambiguous active scheme from context
            else:
                resolved_scheme_id = entities.get("scheme_name") or state.selected_scheme_id

            if resolved_scheme_id:
                state.selected_scheme_id = resolved_scheme_id
                state.workflow_state = WorkflowState.APPLICATION_GUIDANCE
                state.response_text = cls._format_application_guidance(resolved_scheme_id, state, lang)
                return cls._build_response(state, conv, text)
            else:
                # ONLY ask for clarification if resolved_scheme_id == None and no active scheme
                state.workflow_state = WorkflowState.APPLICATION_GUIDANCE
                state.response_text = "To apply for government schemes, you can visit the official online portal or submit an application at your nearest nodal bank branch or CSC center. Please specify which scheme you would like step-by-step guidance for."
                return cls._build_response(state, conv, text)

        # ── Step 9.5: Direct Scheme Description / Information Query ───
        is_desc_query = any(
            phrase in cleaned_lower for phrase in ["describe", "tell me about", "what is", "details", "explain", "info about", "about", "overview"]
        )
        if explicit_scheme and (is_desc_query or intent in [IntentEnum.SCHEME_DISCOVERY, IntentEnum.ELIGIBILITY_EXPLANATION]):
            state.selected_scheme_id = explicit_scheme
            state.workflow_state = WorkflowState.RECOMMENDATION_SHOWN
            state.response_text = cls._format_scheme_details(explicit_scheme, state, lang)
            return cls._build_response(state, conv, text)

        # ── Step 10: Eligibility + Recommendation Matching ───────────
        from app.ai.recommendation.matcher import SchemeMatcher
        from app.ai.recommendation.ranker import SchemeRanker

        matched = SchemeMatcher.match(state.profile)
        ranked = SchemeRanker.rank(matched, top_n=5)
        state.recommendations = [s.model_dump() for s in ranked]
        state.workflow_state = WorkflowState.RECOMMENDATION_SHOWN

        if ranked and not state.selected_scheme_id:
            state.selected_scheme_id = ranked[0].scheme_id

        # ── Step 11: Missing Field Question ──────────────────────────
        missing_result = MissingFieldDetector.detect(
            profile=state.profile,
            language=lang,
        )
        state.missing_fields = missing_result.missing_fields
        if not missing_result.complete:
            state.next_question = missing_result.next_question

        # Format initial recommendation text
        rec_text = cls._format_recommendations(ranked, lang, state)
        if not missing_result.complete and missing_result.next_question:
            rec_text += f"\n\nTip for better matches: {missing_result.next_question}"

        state.response_text = rec_text
        return cls._build_response(state, conv, text)

    # ── Private helpers ───────────────────────────────────────────────────

    @staticmethod
    def _new_conversation(conversation_id: str, session_id: str) -> ConversationState:
        from datetime import datetime
        return ConversationState(
            conversation_id=conversation_id,
            session_id=session_id,
        )

    @staticmethod
    def _restore_state(conv: ConversationState) -> AgentSessionState:
        return AgentSessionState(
            conversation_id=conv.conversation_id,
            session_id=conv.session_id,
            detected_language=conv.detected_language,
            profile=conv.profile,
            missing_fields=conv.missing_fields,
            workflow_state=conv.workflow_state,
            recommendations=conv.recommendations,
            selected_scheme_id=conv.selected_scheme_id,
            financial_calculation=conv.financial_calculation,
            partner_results=conv.partner_results,
            document_guidance=conv.document_guidance,
            entities=conv.entities,
            turn_count=conv.turn_count,
        )

    @staticmethod
    def _merge_profiles(existing: BeneficiaryProfile, new: BeneficiaryProfile) -> BeneficiaryProfile:
        """Merge new extracted fields into existing profile (existing wins if both present)."""
        existing_dict = existing.model_dump()
        new_dict = new.model_dump()
        merged = {k: (new_dict[k] if new_dict[k] is not None else existing_dict[k]) for k in existing_dict}
        return BeneficiaryProfile(**merged)

    @staticmethod
    def _handle_financial(state: AgentSessionState, entities: Dict) -> Optional[Dict]:
        """Run EMI calculation if enough data is available."""
        from app.ai.agent.tools import tool_calculate_emi
        loan = state.profile.loan_required or entities.get("amount")
        if not loan:
            return None
        try:
            return tool_calculate_emi(
                loan_amount=float(loan),
                annual_interest_rate=7.0,  # Default rate
                tenure_years=5.0,
            )
        except Exception:
            return None

    @staticmethod
    def _handle_documents(state: AgentSessionState, entities: Dict) -> Optional[Dict]:
        from app.ai.agent.tools import tool_get_documents
        scheme_id = state.selected_scheme_id or entities.get("scheme_name", "")
        if not scheme_id:
            return None
        try:
            return tool_get_documents(scheme_id=scheme_id.upper(), profile=state.profile)
        except Exception:
            return None

    @staticmethod
    def _handle_partners(state: AgentSessionState) -> Optional[List[Dict]]:
        from app.ai.agent.tools import tool_find_partners
        try:
            return tool_find_partners(
                state=state.profile.state,
                district=state.profile.district,
                scheme_id=state.selected_scheme_id,
            )
        except Exception:
            return None

    @staticmethod
    def _format_financial_response(fin: Dict, lang: str) -> str:
        emi = fin.get("monthly_emi", 0)
        total = fin.get("total_repayment", 0)
        interest = fin.get("total_interest", 0)
        return (
            f"Financial & EMI Calculation Summary:\n\n"
            f"• Monthly EMI: ₹{emi:,.0f}\n"
            f"• Total Interest: ₹{interest:,.0f}\n"
            f"• Total Repayment: ₹{total:,.0f}\n"
            f"• Loan Tenure: {fin.get('tenure_years')} years\n\n"
            f"_{fin.get('disclaimer', '')}_"
        )

    @staticmethod
    def _format_document_response(doc: Dict, lang: str) -> str:
        required = [d["name"] for d in doc.get("required_documents", [])]
        optional = [d["name"] for d in doc.get("optional_documents", [])]
        lines = [f"Required Documents for **{doc.get('scheme_name', '')}**:"]
        if required:
            lines.append("\n**Primary Documents:**")
            lines.extend(f"• {d}" for d in required)
        if optional:
            lines.append("\n**Additional Supporting Documents:**")
            lines.extend(f"• {d}" for d in optional)
        if doc.get("note"):
            lines.append(f"\n_{doc['note']}_")
        return "\n".join(lines)

    @staticmethod
    def _format_partner_response(partners: List[Dict], lang: str) -> str:
        if not partners:
            return "No channel partners found for your location. Please contact the nearest bank branch or CSC."
        lines = ["Nearby Authorized Channel Partners:"]
        for p in partners[:3]:
            lines.append(f"\n• **{p['name']}** ({p['partner_type']})")
            if p.get("district"):
                lines.append(f"  Location: {p['district']}, {p['state']}")
            if p.get("contact_phone"):
                lines.append(f"  Phone: {p['contact_phone']}")
        return "\n".join(lines)

    @staticmethod
    def _format_profile_building(next_q: Optional[str], profile: BeneficiaryProfile, lang: str, user_text: str) -> str:
        ack = _GREETINGS.get(lang, "").split(".")[0] + "." if not profile.occupation else "Understood. "
        return f"{ack}\n\n{next_q}" if next_q else "Could you tell me more about your requirements?"

    @staticmethod
    def _format_recommendations(ranked: list, lang: str, state: AgentSessionState) -> str:
        if not ranked:
            return (
                "Based on the details provided, we are analyzing available government schemes. "
                "You can specify your age, occupation, location, or loan requirement for tailor-made recommendations."
            )
        lines = ["Top matching government scheme options for your requirements:\n"]
        for i, s in enumerate(ranked[:3], 1):
            lines.append(f"**{i}. {s.scheme_name}**")
            if s.benefit_summary:
                lines.append(f"{s.benefit_summary}\n")
            else:
                lines.append("\n")
        return "\n".join(lines)

    @staticmethod
    def _format_application_guidance(scheme_id: str, state: AgentSessionState, lang: str) -> str:
        from app.ai.agent.tools import tool_get_application_process
        try:
            process_data = tool_get_application_process(scheme_id)

            # Strict Validation: tool_result.scheme_id MUST equal requested scheme_id
            if process_data.get("scheme_id", "").upper() != scheme_id.upper():
                raise ValueError(f"Scheme ID mismatch: requested '{scheme_id}', got '{process_data.get('scheme_id')}'")

            lines = [f"To apply for **{process_data['scheme_name']}**:\n"]
            for idx, step in enumerate(process_data["steps"], 1):
                lines.append(f"{idx}. {step}")

            lines.append("\n**Documents you may need:**")
            for doc in process_data.get("required_documents", []):
                lines.append(f"• {doc}")

            lines.append(f"\n**Application route:**\n{process_data.get('application_route', 'Branch Application / Online Portal')}")
            lines.append(f"\n**Official source:**\n{process_data.get('application_url', 'https://myscheme.gov.in')}")
            lines.append("\n_Final approval is subject to the concerned institution/authority._")
            return "\n".join(lines)
        except Exception:
            return "To apply for government schemes, you can visit the official online portal or submit an application at your nearest nodal bank branch or CSC center. Please specify which scheme you would like step-by-step guidance for."

    @classmethod
    def _format_scheme_details(cls, scheme_id: str, state: AgentSessionState, lang: str) -> str:
        registry = get_registry()
        rules = registry.get(scheme_id)

        SCHEME_DETAILS_DB = {
            "PM_KISAN": {
                "name": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
                "ministry": "Ministry of Agriculture & Farmers Welfare",
                "description": "Direct income support of ₹6,000 per year provided to landholding farmer families across India to meet agricultural inputs and domestic needs.",
                "financial": "₹6,000 per year directly credited in 3 equal instalments of ₹2,000 every 4 months via Direct Benefit Transfer (DBT).",
                "eligibility": "• Occupation: Landholding farmer families engaged in agriculture.\n• Age: 18 years and above.\n• Exclusion: Institutional landholders and high-income taxpaying individuals.",
                "documents": "• Aadhaar Card\n• Land Ownership Records (Khasra / Khatauni)\n• Bank Account Passbook with IFSC\n• Mobile Number",
                "url": "https://pmkisan.gov.in"
            },
            "PMEGP": {
                "name": "Prime Minister's Employment Generation Programme (PMEGP)",
                "ministry": "Ministry of MSME / KVIC",
                "description": "Credit-linked subsidy scheme for generating self-employment by establishing new micro-enterprises in manufacturing and service sectors.",
                "financial": "Up to ₹25 Lakhs (Manufacturing) and ₹10 Lakhs (Services) with 15%–35% margin money subsidy.",
                "eligibility": "• Age: 18 years and above.\n• Education: At least 8th pass for projects above ₹10 Lakhs (Manufacturing) or ₹5 Lakhs (Services).\n• Applicable for new micro-enterprises only.",
                "documents": "• Aadhaar & PAN Card\n• Detailed Project Report (DPR)\n• Educational Qualification Certificate\n• Caste/Category Certificate (if applicable)\n• Bank Account Details",
                "url": "https://www.kviconline.gov.in/pmegpeportal"
            },
            "MUDRA_SHISHU": {
                "name": "Pradhan Mantri MUDRA Yojana - Shishu Category",
                "ministry": "Ministry of Finance / SIDBI",
                "description": "Collateral-free micro-credit for non-corporate, non-farm small/micro enterprises in early startup stages.",
                "financial": "Collateral-free micro-loan up to ₹50,000 with zero processing fees.",
                "eligibility": "• Profile: Indian citizens starting a small business or self-employment venture.\n• Age: 18 to 65 years.\n• Collateral: None required.",
                "documents": "• Aadhaar & PAN Card\n• Business Proposal / Address Proof\n• Bank Account Details\n• Passport Photographs",
                "url": "https://mudra.org.in"
            },
            "MUDRA_KISHOR": {
                "name": "Pradhan Mantri MUDRA Yojana - Kishor Category",
                "ministry": "Ministry of Finance / SIDBI",
                "description": "Collateral-free micro-credit for growing non-corporate, non-farm micro enterprises.",
                "financial": "Collateral-free loan from ₹50,001 up to ₹5,00,000 with competitive interest rates.",
                "eligibility": "• Profile: Existing or growing micro business owners.\n• Age: 18 to 65 years.\n• Collateral: None required.",
                "documents": "• Aadhaar & PAN Card\n• Bank Statements (last 6 months)\n• Proof of Business Establishment\n• Passport Photographs",
                "url": "https://mudra.org.in"
            },
            "STAND_UP_INDIA": {
                "name": "Stand-Up India Scheme",
                "ministry": "Ministry of Finance / SIDBI",
                "description": "Bank loan facility between ₹10 Lakh and ₹1 Crore to SC/ST and Women entrepreneurs setting up greenfield enterprises.",
                "financial": "Composite bank loan of ₹10 Lakh to ₹1 Crore covering up to 75% of project cost.",
                "eligibility": "• Profile: SC/ST and/or Female entrepreneurs aged 18+.\n• Unit: Setting up a greenfield (new) manufacturing, trading, or service enterprise.",
                "documents": "• Aadhaar & PAN Card\n• Caste / Category Certificate\n• Business Plan / DPR\n• Bank Account Details",
                "url": "https://www.standupmitra.in"
            },
            "PMAY_GRAMIN": {
                "name": "Pradhan Mantri Awas Yojana - Gramin (PMAY-G)",
                "ministry": "Ministry of Rural Development",
                "description": "Housing scheme providing financial assistance to homeless families and those living in kutcha or dilapidated houses in rural areas.",
                "financial": "₹1.20 Lakh in plains and ₹1.30 Lakh in hilly/NE/difficult areas for pucca house construction.",
                "eligibility": "• Income: Household annual income up to ₹3 Lakhs.\n• Requirement: Must not own a pucca house anywhere in India.",
                "documents": "• Aadhaar Card\n• Income / EWS Certificate\n• Job Card Number (MGNREGA)\n• Bank Account Details",
                "url": "https://pmayg.nic.in"
            },
            "PMFBY": {
                "name": "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
                "ministry": "Ministry of Agriculture & Farmers Welfare",
                "description": "Comprehensive crop insurance scheme protecting farmers against crop loss due to non-preventable natural risks.",
                "financial": "Full sum insured coverage with low premium: 2% for Kharif, 1.5% for Rabi, and 5% for commercial crops.",
                "eligibility": "• Occupation: All farmers growing notified crops in notified areas.",
                "documents": "• Aadhaar Card\n• Land Ownership / Tenancy Records (Khasra/Pahani)\n• Bank Passbook with IFSC\n• Sowing Certificate",
                "url": "https://pmfby.gov.in"
            },
            "KALIA_ODISHA": {
                "name": "KALIA Scheme (Odisha State)",
                "ministry": "Department of Agriculture & Farmers Empowerment, Govt. of Odisha",
                "description": "Direct financial support for small/marginal farmers, landless agricultural laborers, and vulnerable households in Odisha.",
                "financial": "₹10,000/year for farmers + ₹12,500 for landless agricultural units + ₹10,000 annual livelihood support.",
                "eligibility": "• Residence: Resident of Odisha state.\n• Occupation: Farmer or landless agricultural laborer.",
                "documents": "• Aadhaar Card\n• Odisha Resident Certificate\n• Bank Account Details",
                "url": "https://kalia.odisha.gov.in"
            },
            "TN_KUDIGAARAM": {
                "name": "Tamil Nadu CM's Comprehensive Health Insurance Scheme (CMCHIS)",
                "ministry": "Department of Health & Family Welfare, Govt. of Tamil Nadu",
                "description": "Free cashless health insurance cover for low-income families in Tamil Nadu for secondary and tertiary hospitalization.",
                "financial": "Cashless hospitalisation coverage up to ₹5,00,000 per family per year.",
                "eligibility": "• Residence: Resident of Tamil Nadu.\n• Income: Annual family income below ₹72,000.",
                "documents": "• Aadhaar Card\n• Smart Ration Card (Family Card)\n• Income Certificate",
                "url": "https://www.cmchistn.com"
            },
            "NRLM_SHG_LOAN": {
                "name": "DAY-NRLM Self Help Group Bank Linkage",
                "ministry": "Ministry of Rural Development",
                "description": "Subsidized credit linkage for women-led Self Help Groups (SHGs) in rural areas to promote micro-enterprises.",
                "financial": "Revolving Fund ₹20K–₹30K + Community Investment Fund + Subsidized loan at 3%–7% effective interest rate.",
                "eligibility": "• Gender: Female SHG members.\n• Location: Rural poor households.",
                "documents": "• Aadhaar Card\n• SHG Member Resolution Copy\n• SHG Bank Passbook",
                "url": "https://aajeevika.gov.in"
            }
        }

        info = SCHEME_DETAILS_DB.get(scheme_id.upper())
        if not info and rules:
            info = {
                "name": rules.scheme_name,
                "ministry": rules.ministry,
                "description": rules.description,
                "financial": rules.benefit_summary,
                "eligibility": "\n".join(f"• {c.description}" for c in rules.conditions if c.description),
                "documents": "• Aadhaar Card\n• Income Certificate\n• Bank Passbook\n• Address Proof",
                "url": rules.application_url
            }

        if info:
            return (
                f"**{info['name']}**\n\n"
                f"**Ministry / Authority:** {info['ministry']}\n\n"
                f"**Overview & Purpose:**\n{info['description']}\n\n"
                f"**Financial Assistance:**\n{info['financial']}\n\n"
                f"**Eligibility Criteria:**\n{info['eligibility']}\n\n"
                f"**Required Documents:**\n{info['documents']}\n\n"
                f"**Official Application Portal:**\n{info['url']}"
            )

        return f"Could not find detailed information for scheme '{scheme_id}'. Please visit the official portal or nearest CSC center."

    @classmethod
    def _build_response(
        cls,
        state: AgentSessionState,
        conv: ConversationState,
        user_text: str,
    ) -> tuple[ChatResponse, ConversationState]:
        """Finalize response and update conversation state."""
        from datetime import datetime
        from app.integrations.llm.provider import get_llm_provider, NoOpLLMProvider

        # If LLM provider (NVIDIA / Gemini / OpenAI) is active, refine draft response using LLM
        llm = get_llm_provider()
        if not isinstance(llm, NoOpLLMProvider) and state.response_text:
            try:
                system_prompt = (
                    "You are Sahaya AI, an official Government Scheme Assistant. "
                    "Write a clean, elegant, neat response explaining the matching government schemes to the user. "
                    "STRICT FORMATTING RULES:\n"
                    "1. DO NOT use ANY emojis anywhere in the response (strictly NO emojis like ✅, ⚠️, ❌, 💡, 💰, 📄, 🏦, 📋, 🌐, etc.).\n"
                    "2. Present each scheme with its bold name on its own line, followed by a clear, neat summary paragraph.\n"
                    "3. Separate each scheme with a blank line so it is visually neat and easy to read.\n"
                    "4. If asking for missing profile details (e.g. gender or income), place it as a clean tip on a new paragraph at the end.\n"
                    "5. RELEVANCE DIRECTIVE: Always ensure recommendations match the user's query directly. If the user asks for business/loan schemes, focus on PMEGP, MUDRA, and Stand-Up India, and do NOT mention unrelated agricultural schemes like PM-KISAN unless the user asks for farming."
                )
                user_prompt = (
                    f"User Request: '{user_text}'\n"
                    f"Profile Context: Category={state.profile.category}, Income={state.profile.annual_income}, Location={state.profile.district} {state.profile.state}\n"
                    f"Matched Schemes Info:\n{state.response_text}\n\n"
                    f"Please format this cleanly with line breaks and double spacing between schemes, without any emojis."
                )
                llm_response = llm.generate(prompt=user_prompt, system_prompt=system_prompt)
                if llm_response and len(llm_response) > 20:
                    state.response_text = llm_response
            except Exception:
                pass

        # Apply safety filter
        safe_response = SafetyFilter.filter(state.response_text)

        # Update conversation state
        conv.detected_language = state.detected_language
        conv.current_intent = state.current_intent
        conv.workflow_state = state.workflow_state
        conv.profile = state.profile
        conv.missing_fields = state.missing_fields
        conv.recommendations = state.recommendations
        conv.selected_scheme_id = state.selected_scheme_id
        conv.financial_calculation = state.financial_calculation
        conv.partner_results = state.partner_results
        conv.document_guidance = state.document_guidance
        conv.entities = state.entities
        conv.turn_count = state.turn_count
        conv.updated_at = datetime.utcnow()

        # Append messages
        conv.messages.append(ConversationMessage(role="user", text=user_text, language=state.detected_language))
        conv.messages.append(ConversationMessage(role="assistant", text=safe_response))

        response = ChatResponse(
            conversation_id=state.conversation_id,
            session_id=state.session_id,
            response_text=safe_response,
            detected_language=state.detected_language,
            intent=state.current_intent.value if state.current_intent else None,
            workflow_state=state.workflow_state.value,
            profile=state.profile,
            missing_fields=state.missing_fields,
            next_question=state.next_question,
            recommendations=state.recommendations,
            financial_calculation=state.financial_calculation,
            documents=state.document_guidance,
            partners=state.partner_results,
            confidence_warning=state.confidence_warning,
            pii_detected=state.pii_detected,
            turn_count=state.turn_count,
        )
        return response, conv
