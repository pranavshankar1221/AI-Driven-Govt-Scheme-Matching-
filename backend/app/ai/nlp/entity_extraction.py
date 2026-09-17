import re
from typing import Dict, Any


class EntityExtractor:
    """
    Multilingual Entity Extractor for Government Scheme Assistant.
    Extracts key information like monetary amounts, scheme names, target categories,
    occupations, locations, and document types from input text.
    """

    SCHEME_ALIAS_MAP = {
        "mudra loan - kishor category": "MUDRA_KISHOR",
        "mudra kishor": "MUDRA_KISHOR",
        "mudra loan kishor": "MUDRA_KISHOR",
        "kishor category": "MUDRA_KISHOR",
        "kishor loan": "MUDRA_KISHOR",
        "mudra loan - shishu category": "MUDRA_SHISHU",
        "mudra shishu": "MUDRA_SHISHU",
        "mudra loan shishu": "MUDRA_SHISHU",
        "shishu category": "MUDRA_SHISHU",
        "shishu loan": "MUDRA_SHISHU",
        "mudra loan": "MUDRA_KISHOR",
        "mudra yojana": "MUDRA_KISHOR",
        "mudra": "MUDRA_KISHOR",
        "stand-up india": "STAND_UP_INDIA",
        "stand up india": "STAND_UP_INDIA",
        "standup india": "STAND_UP_INDIA",
        "standup": "STAND_UP_INDIA",
        "pm-kisan": "PM_KISAN",
        "pm kisan": "PM_KISAN",
        "pmkisan": "PM_KISAN",
        "kisan samman": "PM_KISAN",
        "pmegp": "PMEGP",
        "pmegp loan": "PMEGP",
        "pmay-g": "PMAY_GRAMIN",
        "pmay gramin": "PMAY_GRAMIN",
        "pmay-gramin": "PMAY_GRAMIN",
        "pmay": "PMAY_GRAMIN",
        "pmfby": "PMFBY",
        "nrlm": "NRLM_SHG_LOAN",
        "day-nrlm": "NRLM_SHG_LOAN",
        "kalia": "KALIA_ODISHA",
        "cmchistn": "TN_KUDIGAARAM",
    }

    KNOWN_SCHEMES = [
        "pm kisan", "pm-kisan", "mudra", "pmegp", "pmay", "stand up india", "stand-up india",
        "startup india", "sukanya samriddhi", "ayushman bharat", "pmis",
        "kisan credit card", "kcc", "pension scheme", "scholarship"
    ]

    DOCUMENT_KEYWORDS = {
        "aadhaar": ["aadhaar", "adhar", "ஆதார்", "आधार"],
        "pan": ["pan", "pan card", "பான்"],
        "income_certificate": ["income certificate", "வருமான சான்றிதழ்", "आय प्रमाण पत्र"],
        "ration_card": ["ration card", "ரேஷன் கார்டு", "राशन कार्ड"],
        "caste_certificate": ["caste certificate", "சாதி சான்றிதழ்", "जाति प्रमाण पत्र"]
    }

    OCCUPATION_MAP = {
        "farmer": ["farmer", "farmers", "agriculture", "விவசாயி", "किसान", "రైతు", "ರೈತ"],
        "student": ["student", "students", "education", "மாணவர்", "छात्र", "విద్యార్థి"],
        "entrepreneur": ["business", "startup", "msme", "வியாபாரம்", "व्यापार", "தொழில்"],
        "woman": ["women", "woman", "girl", "பெண்", "महिला", "స్త్రీ"],
        "senior_citizen": ["senior citizen", "pension", "முதியோர்", "वरिष्ठ नागरिक"]
    }

    @classmethod
    def resolve_scheme_id(cls, text: str) -> str | None:
        """
        Resolves explicit scheme mentions in user prompt text to canonical scheme_id.
        Returns canonical scheme_id string if found, otherwise None.
        """
        cleaned = text.lower().strip()
        for alias, scheme_id in cls.SCHEME_ALIAS_MAP.items():
            if alias in cleaned:
                return scheme_id
        return None

    @classmethod
    def extract_entities(cls, text: str) -> Dict[str, Any]:
        entities: Dict[str, Any] = {}
        cleaned_text = text.lower().strip()

        # 1. Extract Amount / Money figures
        # Regex for patterns like "500000", "5 lakh", "Rs. 50,000", "500000 ரூபாய்"
        amount_match = re.search(
            r'(?:rs\.?|inr|₹)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(lakh|lakhs|k|thousand|crore|ரூபாய்|रुपये)?',
            cleaned_text
        )
        if amount_match:
            val = amount_match.group(1).replace(",", "")
            unit = amount_match.group(2)
            if unit:
                if unit in ["lakh", "lakhs", "ரூபாய்", "रुपये"]:
                    try:
                        num = float(val)
                        if num < 100 and unit in ["lakh", "lakhs"]:
                            val = str(int(num * 100000))
                    except ValueError:
                        pass
                elif unit == "k":
                    try:
                        val = str(int(float(val) * 1000))
                    except ValueError:
                        pass
            if val and len(val) >= 3:
                entities["amount"] = val

        # 2. Extract Canonical Scheme Name
        resolved = cls.resolve_scheme_id(text)
        if resolved:
            entities["scheme_name"] = resolved
        else:
            for scheme in cls.KNOWN_SCHEMES:
                if scheme in cleaned_text:
                    entities["scheme_name"] = scheme.upper()
                    break

        # 3. Extract Occupation
        for occ, keywords in cls.OCCUPATION_MAP.items():
            if any(kw in cleaned_text for kw in keywords):
                entities["occupation"] = occ
                break

        # 4. Extract Document Type
        for doc_type, keywords in cls.DOCUMENT_KEYWORDS.items():
            if any(kw in cleaned_text for kw in keywords):
                entities["document_type"] = doc_type
                break

        # 5. CategoryHeuristics
        if "loan" in cleaned_text or "business" in cleaned_text or "व्यापार" in cleaned_text or "வியாபாரம்" in cleaned_text:
            entities["category"] = "business_loan"
            if "occupation" not in entities:
                entities["occupation"] = "entrepreneur"
        elif "scholarship" in cleaned_text or "education" in cleaned_text or "கல்வி" in cleaned_text:
            entities["category"] = "education_scholarship"
            if "occupation" not in entities:
                entities["occupation"] = "student"

        return entities
