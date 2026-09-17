"""
Module: app/ai/nlp/missing_fields.py

Missing Information Detector for the beneficiary profile.

After profile extraction, detects which fields are required by the
relevant scheme rules but are absent in the current profile.

Returns a structured result including:
- whether the profile is complete for eligibility
- which fields are missing
- a multilingual next question to ask the user

NO LLM used — purely structural + template-based.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional

from app.schemas.chat import BeneficiaryProfile
from app.ai.eligibility.rules import SchemeEligibilityRules
from app.ai.eligibility.validator import validate_profile_completeness
from app.services.eligibility_service import get_registry


# ── Multilingual question templates ──────────────────────────────────────

# Maps field_name → {language_code: question_text}
FIELD_QUESTIONS: Dict[str, Dict[str, str]] = {
    "age": {
        "en-IN": "How old are you? (Please share your age in years)",
        "ta-IN": "உங்கள் வயது என்ன?",
        "hi-IN": "आपकी उम्र कितनी है?",
        "te-IN": "మీ వయస్సు ఎంత?",
        "kn-IN": "ನಿಮ್ಮ ವಯಸ್ಸು ಎಷ್ಟು?",
        "ml-IN": "നിങ്ങളുടെ പ്രായം എത്ര?",
        "bn-IN": "আপনার বয়স কত?",
        "mr-IN": "तुमचे वय किती आहे?",
    },
    "annual_income": {
        "en-IN": "What is your approximate annual family income? (e.g., 3 lakh, 50,000)",
        "ta-IN": "உங்கள் குடும்பத்தின் வருடாந்திர வருமானம் என்ன?",
        "hi-IN": "आपकी वार्षिक पारिवारिक आय कितनी है?",
        "te-IN": "మీ వార్షిక కుటుంబ ఆదాయం ఎంత?",
        "kn-IN": "ನಿಮ್ಮ ವಾರ್ಷಿಕ ಕುಟುಂಬ ಆದಾಯ ಎಷ್ಟು?",
        "ml-IN": "നിങ്ങളുടെ വാർഷിക കുടുംബ വരുമാനം എത്ര?",
        "bn-IN": "আপনার বার্ষিক পারিবারিক আয় কত?",
        "mr-IN": "तुमचे वार्षिक कौटुंबिक उत्पन्न किती आहे?",
    },
    "occupation": {
        "en-IN": "What is your occupation? (e.g., farmer, entrepreneur, weaver, student)",
        "ta-IN": "உங்கள் தொழில் என்ன? (எ.கா. விவசாயி, தொழிலதிபர், நெசவாளர்)",
        "hi-IN": "आपका पेशा क्या है? (जैसे किसान, उद्यमी, बुनकर)",
        "te-IN": "మీ వృత్తి ఏమిటి? (రైతు, వ్యాపారి, నేత కార్మికుడు)",
        "kn-IN": "ನಿಮ್ಮ ವೃತ್ತಿ ಏನು? (ರೈತ, ಉದ್ಯಮಿ)",
        "ml-IN": "നിങ്ങളുടെ തൊഴിൽ എന്താണ്? (കർഷകൻ, സംരംഭകൻ)",
        "bn-IN": "আপনার পেশা কী? (কৃষক, উদ্যোক্তা)",
        "mr-IN": "तुमचा व्यवसाय काय आहे? (शेतकरी, उद्योजक)",
    },
    "gender": {
        "en-IN": "Could you share your gender? (male / female / other)",
        "ta-IN": "உங்கள் பாலினம் என்ன? (ஆண் / பெண்)",
        "hi-IN": "आपका लिंग क्या है? (पुरुष / महिला)",
        "te-IN": "మీ లింగం ఏమిటి? (పురుషుడు / స్త్రీ)",
        "kn-IN": "ನಿಮ್ಮ ಲಿಂಗ ಯಾವುದು? (ಪುರುಷ / ಮಹಿಳೆ)",
        "ml-IN": "നിങ്ങളുടെ ലിംഗം? (പുരുഷൻ / സ്ത്രീ)",
        "bn-IN": "আপনার লিঙ্গ? (পুরুষ / মহিলা)",
        "mr-IN": "तुमचे लिंग? (पुरुष / महिला)",
    },
    "state": {
        "en-IN": "Which state do you live in? (e.g., Tamil Nadu, Maharashtra)",
        "ta-IN": "நீங்கள் எந்த மாநிலத்தில் வசிக்கிறீர்கள்?",
        "hi-IN": "आप किस राज्य में रहते हैं?",
        "te-IN": "మీరు ఏ రాష్ట్రంలో నివసిస్తున్నారు?",
        "kn-IN": "ನೀವು ಯಾವ ರಾಜ್ಯದಲ್ಲಿ ವಾಸಿಸುತ್ತೀರಿ?",
        "ml-IN": "നിങ്ങൾ ഏത് സംസ്ഥാനത്ത് താമസിക്കുന്നു?",
        "bn-IN": "আপনি কোন রাজ্যে থাকেন?",
        "mr-IN": "तुम्ही कोणत्या राज्यात राहता?",
    },
    "category": {
        "en-IN": "What is your social category? (General / OBC / SC / ST)",
        "ta-IN": "உங்கள் சமூக பிரிவு என்ன? (General / OBC / SC / ST)",
        "hi-IN": "आपकी सामाजिक श्रेणी क्या है? (सामान्य / OBC / SC / ST)",
        "te-IN": "మీ సామాజిక వర్గం ఏమిటి? (General / OBC / SC / ST)",
        "kn-IN": "ನಿಮ್ಮ ಸಾಮಾಜಿಕ ವರ್ಗ ಯಾವುದು?",
        "ml-IN": "നിങ്ങളുടെ സാമൂഹ്യ വിഭാഗം?",
        "bn-IN": "আপনার সামাজিক বিভাগ কী?",
        "mr-IN": "तुमची सामाजिक श्रेणी कोणती?",
    },
    "education": {
        "en-IN": "What is your highest educational qualification? (e.g., 10th Pass, Graduate, Diploma)",
        "ta-IN": "உங்கள் கல்வித் தகுதி என்ன?",
        "hi-IN": "आपकी उच्चतम शैक्षणिक योग्यता क्या है?",
        "te-IN": "మీ అత్యధిక విద్యా అర్హత ఏమిటి?",
        "kn-IN": "ನಿಮ್ಮ ಅತ್ಯಧಿಕ ಶಿಕ್ಷಣ ಅರ್ಹತೆ?",
        "ml-IN": "നിങ്ങളുടെ ഉയർന്ന വിദ്യാഭ്യാസ യോഗ്യത?",
        "bn-IN": "আপনার সর্বোচ্চ শিক্ষাগত যোগ্যতা?",
        "mr-IN": "तुमची सर्वोच्च शैक्षणिक पात्रता?",
    },
    "loan_required": {
        "en-IN": "How much loan amount do you require? (e.g., 2 lakh, 50,000)",
        "ta-IN": "உங்களுக்கு எவ்வளவு கடன் தேவை?",
        "hi-IN": "आपको कितने ऋण की आवश्यकता है?",
        "te-IN": "మీకు ఎంత రుణం అవసరం?",
        "kn-IN": "ನಿಮಗೆ ಎಷ್ಟು ಸಾಲ ಬೇಕು?",
        "ml-IN": "നിങ്ങൾക്ക് എത്ര വായ്പ ആവശ്യമുണ്ട്?",
        "bn-IN": "আপনার কত লোনের প্রয়োজন?",
        "mr-IN": "तुम्हाला किती कर्ज हवे आहे?",
    },
    "project_cost": {
        "en-IN": "What is the total estimated cost of your project? (e.g., 5 lakh)",
        "ta-IN": "உங்கள் திட்டத்தின் மொத்த செலவு என்ன?",
        "hi-IN": "आपकी परियोजना की कुल अनुमानित लागत क्या है?",
        "te-IN": "మీ ప్రాజెక్ట్ యొక్క మొత్తం అంచనా వ్యయం ఎంత?",
        "kn-IN": "ನಿಮ್ಮ ಯೋಜನೆಯ ಒಟ್ಟು ಅಂದಾಜು ವೆಚ್ಚ ಎಷ್ಟು?",
        "ml-IN": "നിങ്ങളുടെ പ്രോജക്ടിന്റെ ആകെ ചെലവ് എത്ര?",
        "bn-IN": "আপনার প্রকল্পের মোট আনুমানিক ব্যয় কত?",
        "mr-IN": "तुमच्या प्रकल्पाची एकूण अंदाजित किंमत किती?",
    },
    "district": {
        "en-IN": "Which district are you from?",
        "ta-IN": "நீங்கள் எந்த மாவட்டத்தைச் சேர்ந்தவர்?",
        "hi-IN": "आप किस जिले से हैं?",
        "te-IN": "మీరు ఏ జిల్లా నుండి వచ్చారు?",
        "kn-IN": "ನೀವು ಯಾವ ಜಿಲ್ಲೆಯಿಂದ?",
        "ml-IN": "നിങ്ങൾ ഏത് ജില്ലയിൽ നിന്ന്?",
        "bn-IN": "আপনি কোন জেলা থেকে?",
        "mr-IN": "तुम्ही कोणत्या जिल्ह्यातून आहात?",
    },
}

DEFAULT_QUESTION: Dict[str, str] = {
    "en-IN": "Could you provide more details about yourself to check eligibility?",
    "ta-IN": "தகுதி சரிபார்க்க உங்களைப் பற்றி மேலும் விவரங்கள் தர முடியுமா?",
    "hi-IN": "पात्रता जांचने के लिए कृपया अपने बारे में अधिक जानकारी दें।",
    "te-IN": "అర్హత తనిఖీ చేయడానికి మీ గురించి మరింత వివరాలు అందించగలరా?",
}


@dataclass
class MissingFieldResult:
    """Result of the missing field detection."""
    complete: bool
    missing_fields: List[str] = field(default_factory=list)
    next_question: Optional[str] = None
    next_question_field: Optional[str] = None


class MissingFieldDetector:
    """
    Detects which profile fields are required for eligibility but absent.
    Generates multilingual next questions.

    Does NOT use LLM — purely structural + template-based.
    """

    # Priority order for asking questions (ask most impactful first)
    FIELD_PRIORITY: List[str] = [
        "occupation", "annual_income", "age", "gender",
        "state", "category", "education", "loan_required",
        "project_cost", "district",
    ]

    @classmethod
    def detect(
        cls,
        profile: BeneficiaryProfile,
        scheme_rules_list: Optional[List[SchemeEligibilityRules]] = None,
        language: str = "en-IN",
    ) -> MissingFieldResult:
        """
        Detect missing fields and return the next question to ask.

        Args:
            profile:           Current beneficiary profile.
            scheme_rules_list: Scheme rules to check against. If None, loads all.
            language:          Detected user language for question generation.

        Returns:
            MissingFieldResult with complete flag, missing field names, next question.
        """
        if scheme_rules_list is None:
            registry = get_registry()
            scheme_rules_list = registry.all()

        if not scheme_rules_list:
            return MissingFieldResult(complete=True, missing_fields=[])

        # Collect all required fields across all schemes (union)
        all_missing: set = set()
        for rules in scheme_rules_list:
            result = validate_profile_completeness(profile, rules)
            all_missing.update(result.missing_required_fields)

        if not all_missing:
            return MissingFieldResult(complete=True, missing_fields=[])

        # Sort by priority
        missing_sorted = cls._sort_by_priority(list(all_missing))

        # Generate the next question for the highest-priority missing field
        next_field = missing_sorted[0]
        next_q = cls._get_question(next_field, language)

        return MissingFieldResult(
            complete=False,
            missing_fields=missing_sorted,
            next_question=next_q,
            next_question_field=next_field,
        )

    @classmethod
    def _sort_by_priority(cls, fields: List[str]) -> List[str]:
        """Sort fields by the FIELD_PRIORITY order."""
        priority_map = {f: i for i, f in enumerate(cls.FIELD_PRIORITY)}
        return sorted(fields, key=lambda f: priority_map.get(f, 999))

    @staticmethod
    def _get_question(field_name: str, language: str) -> str:
        """Get the localized next question for a field."""
        templates = FIELD_QUESTIONS.get(field_name, {})
        # Try exact match, then base language, then English fallback
        if language in templates:
            return templates[language]
        base = language.split("-")[0] + "-IN"
        if base in templates:
            return templates[base]
        return templates.get("en-IN", DEFAULT_QUESTION.get(language, DEFAULT_QUESTION["en-IN"]))
