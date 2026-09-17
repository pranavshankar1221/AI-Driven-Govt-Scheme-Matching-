"""
Module: app/ai/agent/tools.py

Callable tool wrappers used by the orchestrator.

Each tool is a thin wrapper that calls a deterministic service.
The orchestrator decides WHICH tool to call — tools don't decide.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from app.schemas.chat import BeneficiaryProfile


def tool_check_eligibility(
    profile: BeneficiaryProfile,
    scheme_ids: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Run deterministic eligibility engine."""
    from app.services.eligibility_service import check_eligibility
    result = check_eligibility(profile=profile, scheme_ids=scheme_ids)
    return result.model_dump()


def tool_get_recommendations(
    profile: BeneficiaryProfile,
    scheme_ids: Optional[List[str]] = None,
    top_n: Optional[int] = 5,
) -> List[Dict[str, Any]]:
    """Run scheme matcher + ranker."""
    from app.services.recommendation_service import get_recommendations
    result = get_recommendations(profile=profile, scheme_ids=scheme_ids, top_n=top_n)
    return [s.model_dump() for s in result.ranked_schemes]


def tool_calculate_emi(
    loan_amount: float,
    annual_interest_rate: float,
    tenure_years: float,
    applicant_contribution: Optional[float] = None,
    subsidy_amount: Optional[float] = None,
) -> Dict[str, Any]:
    """Run deterministic EMI calculation."""
    from app.services.finance_service import calculate_emi
    from app.schemas.finance import EMICalculationRequest
    req = EMICalculationRequest(
        loan_amount=loan_amount,
        annual_interest_rate=annual_interest_rate,
        tenure_years=tenure_years,
        applicant_contribution=applicant_contribution,
        subsidy_amount=subsidy_amount,
    )
    result = calculate_emi(req)
    return result.model_dump()


def tool_get_documents(
    scheme_id: str,
    profile: Optional[BeneficiaryProfile] = None,
) -> Dict[str, Any]:
    """Get document requirements for a scheme."""
    from app.services.document_service import get_document_requirements
    result = get_document_requirements(scheme_id=scheme_id, profile=profile)
    return result.model_dump()


def tool_find_partners(
    state: Optional[str] = None,
    district: Optional[str] = None,
    scheme_id: Optional[str] = None,
    category: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Find channel partners by location and scheme."""
    from app.services.partner_service import find_partners
    from app.schemas.partner import PartnerSearchRequest
    req = PartnerSearchRequest(
        state=state,
        district=district,
        scheme_id=scheme_id,
        category=category,
    )
    result = find_partners(req)
    return [p.model_dump() for p in result.partners]


def tool_send_scheme_sms(
    session_id: str,
    phone_number: str,
    scheme_id: str,
    consent: bool = True,
    include_options: Optional[dict] = None,
) -> Dict[str, Any]:
    """Send verified scheme information SMS to beneficiary's phone number."""
    from app.services.sms_service import send_verified_scheme_sms
    return send_verified_scheme_sms(
        session_id=session_id,
        phone_number=phone_number,
        scheme_id=scheme_id,
        consent=consent,
        include_options=include_options,
    )


def tool_get_application_process(scheme_id: str) -> Dict[str, Any]:
    """
    Retrieve verified application process details for a specific scheme.
    Enforces strict scheme-ID matching validation.
    """
    from app.services.eligibility_service import get_registry
    registry = get_registry()
    rules = registry.get(scheme_id)
    if not rules:
        raise ValueError(f"Scheme ID '{scheme_id}' not found in verified registry.")

    # Strict Validation: tool_result.scheme_id MUST equal scheme_id
    result_scheme_id = rules.scheme_id
    if result_scheme_id.upper() != scheme_id.upper():
        raise ValueError(f"Scheme ID mismatch: requested '{scheme_id}', got '{result_scheme_id}'")

    docs = ["Aadhaar Card", "PAN Card", "Bank Passbook / Statements", "Income Certificate / Proof"]
    if rules.scheme_id == "MUDRA_KISHOR":
        steps = [
            "Prepare business proposal / project report detailing funding requirement between Rs. 50,001 and Rs. 5 Lakh.",
            "Gather required KYC documents, business address proof, and bank statements.",
            "Visit nearest commercial bank, RRB, MFI, or apply online via UdyamiMitra portal.",
            "Submit MUDRA Kishor application form along with business proof and documents.",
            "Bank conducts credit assessment and field verification.",
            "Upon sanction, MUDRA loan amount and RuPay card are issued."
        ]
        channel = "Commercial Banks, Regional Rural Banks, MFIs & UdyamiMitra Portal"
        route = "Branch Application / UdyamiMitra Online Portal"
    elif rules.scheme_id == "MUDRA_SHISHU":
        steps = [
            "Fill Shishu loan application form (no processing fee for Shishu category up to Rs. 50,000).",
            "Submit Aadhaar, PAN, bank account details, and business activity proof.",
            "Visit nearest participating bank or MFI branch.",
            "Bank verifies business activity and dispenses micro-credit.",
            "Receive MUDRA RuPay card for working capital withdrawals."
        ]
        channel = "Participating Commercial Banks & MFIs"
        route = "Direct Bank Branch Application"
    elif rules.scheme_id == "STAND_UP_INDIA":
        steps = [
            "Confirm eligibility as SC/ST or Woman entrepreneur setting up a greenfield enterprise.",
            "Prepare detailed project report (DPR) for loan requirement between Rs. 10 Lakh and Rs. 1 Crore.",
            "Register on Stand-Up Mitra portal (standupmitra.in) or visit nearest bank branch.",
            "Submit application with category certificate, business proof, and DPR.",
            "Bank evaluates creditworthiness and grants in-principle approval.",
            "Loan disbursement in tranches following EDP training and site verification."
        ]
        channel = "Stand-Up Mitra Portal & Scheduled Commercial Banks"
        route = "Stand-Up Mitra Portal / Bank Branch"
    elif rules.scheme_id == "PMEGP":
        steps = [
            "Register online on KVIC PMEGP Portal (kviconline.gov.in).",
            "Fill online application form and upload Aadhaar, EDP certificate, and Project Report.",
            "Submit application to District Industries Centre (DIC) or KVIC regional office.",
            "Attend Task Force Committee interview and bank appraisal.",
            "Complete mandatory Entrepreneurship Development Programme (EDP) training.",
            "Bank sanctions loan and releases margin money subsidy to lock-in account."
        ]
        channel = "KVIC Online Portal, DIC & Nodal Banks"
        route = "Online Portal (kviconline.gov.in)"
    elif rules.scheme_id == "PM_KISAN":
        steps = [
            "Visit PM-KISAN Portal (pmkisan.gov.in) or nearest CSC Jan Seva Kendra.",
            "Submit Aadhaar number, landholding land record (Khasra/Khatauni), and bank account details.",
            "State Nodal Officer verifies land ownership and Aadhaar e-KYC.",
            "Upon approval, direct benefit transfer of Rs. 2,000 per installment is credited to bank account."
        ]
        channel = "PM-KISAN Portal & CSC Jan Seva Kendras"
        route = "Online Portal (pmkisan.gov.in) / CSC"
    else:
        steps = [
            f"Confirm eligibility criteria for {rules.scheme_name}.",
            "Gather required identity, income, and category documents.",
            "Visit the official portal or nearest implementing bank branch.",
            "Submit completed application form with supporting documents.",
            "Undergo verification by the authorized officer.",
            "Track application status online using reference ID."
        ]
        channel = "Official Implementing Portal & Nodal Banks"
        route = "Online Portal / Branch Application"

    return {
        "scheme_id": rules.scheme_id,
        "scheme_name": rules.scheme_name,
        "ministry": rules.ministry,
        "steps": steps,
        "required_documents": docs,
        "application_channel": channel,
        "application_route": route,
        "implementing_agency": rules.ministry,
        "application_url": rules.application_url or "https://myscheme.gov.in",
        "important_conditions": "Final approval is subject to verification by the concerned institution/authority."
    }

