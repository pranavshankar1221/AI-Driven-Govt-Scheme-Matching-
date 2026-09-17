import re
from typing import Tuple, Dict, Any
from app.schemas.chat import IntentEnum
from app.ai.nlp.entity_extraction import EntityExtractor


# Multilingual Keyword and Phrasal Token Matrices for Intent Classification
INTENT_PATTERNS = {
    IntentEnum.HUMAN_ASSISTANCE: [
        "talk to human", "talk to agent", "human agent", "talk to officer", "officer", "executive",
        "representative", "talk to person", "helpline", "human support", "contact agent",
        "மனித உதவி", "அதிகாரி", "பேச வேண்டும்", "அதிகாரி உதவி",
        "अधिकारी", "एजेंट", "इंसान", "बात करनी है", "कॉल करें", "हेल्पलाइन", "ఏజెంట్"
    ],
    IntentEnum.ELIGIBILITY_CHECK: [
        "eligible", "eligibility", "qualify", "qualification", "can i apply", "am i eligible",
        "eligible hu", "eligible dhaan", "தகுதி", "விண்ணப்பிக்க முடியுமா", "தகுதியா",
        "पात्रता", "योग्य", "पात्र", "अर्हता"
    ],
    IntentEnum.DOCUMENT_REQUIREMENTS: [
        "document", "documents", "aadhaar", "pan", "certificate", "proof", "required docs", "papers",
        "சான்றிதழ்", "ஆவணங்கள்", "தேவையான சான்றுகள்", "दस्तावेज़", "कागजात", "प्रमाण पत्र", "పత్రాలు"
    ],
    IntentEnum.FINANCIAL_CALCULATION: [
        "calculate emi", "calculate", "calculator", "emi", "interest", "rate", "subsidy amount", "percentage",
        "வட்டி கணக்கு", "வட்டி விகிதம்", "கணக்கிடு", "गणना", "ब्याज", "ईएमआई", "లెక్కింపు"
    ],
    IntentEnum.APPLICATION_STATUS: [
        "status", "track", "application number", "reference id", "check status", "progress",
        "விண்ணப்ப நிலை", "நிலைமை", "स्थिति", "ट्रैक", "आवेदन स्थिति", "స్టేటస్"
    ],
    IntentEnum.APPLICATION_GUIDANCE: [
        "apply online", "how to apply", "how do i apply", "how do i apply for", "application process", "procedure", "steps to apply", "form fill",
        "where to apply", "how can i apply for", "apply procedure", "online application steps",
        "விண்ணப்பிப்பது எப்படி", "வழிமுறைகள்", "आवेदन कैसे करें", "प्रक्रिया", "चरण", "அப்ளை"
    ],
    IntentEnum.PARTNER_SEARCH: [
        "partner", "csc", "center", "centre", "bank", "branch", "jan seva", "near me", "location", "kendra",
        "அருகில் உள்ள", "வங்கி கிளை", "மையம்", "केंद्र", "बैंक", "जन सेवा", "కేంద్రం"
    ],
    IntentEnum.SCHEME_DETAILS: [
        "details and features", "details", "information", "benefits", "features", "tell me about", "what is", "about scheme",
        "விவரங்கள்", "நன்மைகள்", "விவரம்", "जानकारी", "विवरण", "लाभ", "వివరాలు"
    ],
    IntentEnum.BUSINESS_ASSISTANCE: [
        "business loan", "business", "loan", "loans", "loan scheme", "startup", "msme", "mudra", "pmegp", "commercial", "trade", "tailoring loan", "need loan", "apply for loan", "apply for a loan",
        "வியாபாரம்", "தொழில் கடன்", "வணிக கடன்", "தொழில்", "व्यापार", "बिजनेस", "लोन", "ऋण", "రుణం"
    ],
    IntentEnum.EDUCATION_ASSISTANCE: [
        "scholarship schemes", "scholarships", "scholarship", "students", "student", "education", "college", "school", "tuition", "fee", "study",
        "கல்வி", "உதவித்தொகை", "மாணவர்", "छात्रवृत्ति", "शिक्षा", "छात्र", "చదువు", "స్కాలర్‌శిప్"
    ],
    IntentEnum.SCHEME_DISCOVERY: [
        "scheme", "schemes", "yojana", "padhakam", "thittam", "yojane", "options", "available", "list", "need to apply", "want to apply",
        "திட்டங்கள்", "திட்டம்", "திட்டங்களை", "योजनाएं", "योजना", "పథకాలు", "ಯೋಜನೆಗಳು"
    ],
    IntentEnum.GENERAL_HELP: [
        "help", "hello", "hi", "hey", "who are you", "what can you do", "support",
        "வணக்கம்", "உதவி", "नमस्ते", "सहायता", "హలో"
    ]
}


class IntentClassifier:
    """
    Multilingual Intent Classification Engine for Government Scheme Assistant.
    Supports English, Tamil, Hindi, Telugu, Kannada, Malayalam, Bengali, Marathi,
    and code-mixed Indian language inputs.
    """

    @classmethod
    def classify(cls, text: str, language_hint: str = None) -> Tuple[IntentEnum, float, Dict[str, Any]]:
        cleaned_text = text.lower().strip()
        if not cleaned_text:
            return IntentEnum.GENERAL_HELP, 0.50, {}

        # Extract entities using EntityExtractor
        entities = EntityExtractor.extract_entities(text)

        # Calculate scores per intent
        scores: Dict[IntentEnum, float] = {intent: 0.0 for intent in IntentEnum}
        words = set(re.findall(r'\w+', cleaned_text))

        for intent, patterns in INTENT_PATTERNS.items():
            for pattern in patterns:
                pattern_clean = pattern.lower()
                # Exact phrase match
                if " " in pattern_clean and pattern_clean in cleaned_text:
                    scores[intent] += 4.5
                # Word match
                elif pattern_clean in words:
                    scores[intent] += 2.5
                # Substring match for non-ASCII Indic scripts (e.g. Tamil/Devanagari suffixes)
                elif any(ord(c) > 127 for c in pattern_clean) and pattern_clean in cleaned_text:
                    scores[intent] += 2.5

        # Heuristic boost for loan / business / scheme requests
        if any(w in cleaned_text for w in ["calculate", "emi", "calculator"]) and "loan" in cleaned_text:
            scores[IntentEnum.FINANCIAL_CALCULATION] += 5.0
        elif any(w in cleaned_text for w in ["loan", "business", "start", "trade", "tailor", "shop"]):
            scores[IntentEnum.BUSINESS_ASSISTANCE] += 3.5

        if any(w in cleaned_text for w in ["scheme", "schemes", "yojana", "option", "apply for a"]):
            if "scholarship" not in cleaned_text and "details" not in cleaned_text:
                scores[IntentEnum.SCHEME_DISCOVERY] += 2.5

        # Contextual Heuristics Boost
        if "amount" in entities or "category" in entities:
            if "business_loan" == entities.get("category"):
                scores[IntentEnum.BUSINESS_ASSISTANCE] += 1.5
            elif "education_scholarship" == entities.get("category"):
                scores[IntentEnum.EDUCATION_ASSISTANCE] += 1.5

        if "document_type" in entities:
            scores[IntentEnum.DOCUMENT_REQUIREMENTS] += 2.0

        if "scheme_name" in entities and scores[IntentEnum.ELIGIBILITY_CHECK] > 0:
            scores[IntentEnum.ELIGIBILITY_CHECK] += 2.0

        best_intent = max(scores, key=scores.get)
        max_score = scores[best_intent]

        if max_score == 0.0:
            # Fallback based on text length or general help
            if "scheme" in cleaned_text or "yojana" in cleaned_text or "திட்ட" in cleaned_text:
                return IntentEnum.SCHEME_DISCOVERY, 0.70, entities
            return IntentEnum.GENERAL_HELP, 0.65, entities

        # Normalize confidence between 0.70 and 0.98
        confidence = round(min(0.70 + (max_score * 0.08), 0.98), 2)
        return best_intent, confidence, entities
