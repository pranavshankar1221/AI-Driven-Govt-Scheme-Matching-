import re
from typing import Tuple, Optional
from app.schemas.chat import BeneficiaryProfile, ProfileExtractResponse
from app.utils.currency import normalize_indian_currency
from app.ai.guardrails.validation import PIIGuardrail


INDIAN_STATES = {
    "tamil nadu": ["tamil nadu", "tamilnadu", "tn", "தமிழ்நாடு", "தமிழ் நாடு"],
    "maharashtra": ["maharashtra", "महाराष्ट्र"],
    "uttar pradesh": ["uttar pradesh", "up", "उत्तर प्रदेश"],
    "karnataka": ["karnataka", "ಕರ್ನಾಟಕ"],
    "kerala": ["kerala", "கேரளா", "കേരളം"],
    "telangana": ["telangana", "தெலுங்கானா", "తెలంగాణ"],
    "andhra pradesh": ["andhra pradesh", "ap", "आंध्र प्रदेश", "ఆంధ్ర ప్రదేశ్"],
    "west bengal": ["west bengal", "wb", "पश्चिम बंगाल"],
    "gujarat": ["gujarat", "गुजरात"],
    "rajasthan": ["rajasthan", "राजस्थान"],
    "madhya pradesh": ["madhya pradesh", "mp", "मध्य प्रदेश"],
    "bihar": ["bihar", "बिहार"],
    "punjab": ["punjab", "पंजाब"]
}

INDIAN_DISTRICTS = {
    "salem": ["salem", "சேலம்", "सलेम"],
    "coimbatore": ["coimbatore", "கோவை", "கோயம்புத்தூர்"],
    "chennai": ["chennai", "சென்னை"],
    "madurai": ["madurai", "மதுரை"],
    "pune": ["pune", "पुणे"],
    "mumbai": ["mumbai", "मुंबई"],
    "bengaluru": ["bengaluru", "bangalore", "பெங்களூரு"],
    "hyderabad": ["hyderabad", "ஹைதராபாத்"],
    "lucknow": ["lucknow", "लखनऊ"],
    "varanasi": ["varanasi", "वाराणसी"],
    "jaipur": ["jaipur", "जयपुर"]
}


class BeneficiaryProfileExtractor:
    """
    Multilingual Beneficiary Profile Extractor for Government Scheme Assistance.
    Extracts strictly defined 12 profile fields, normalizes Indian currency values,
    and enforces privacy guardrails against PII.
    """

    @classmethod
    def extract(cls, text: str) -> ProfileExtractResponse:
        if not text or not text.strip():
            return ProfileExtractResponse(
                profile=BeneficiaryProfile(),
                pii_detected=False
            )

        # 1. PII Redaction & Detection
        sanitized_text, pii_detected = PIIGuardrail.sanitize_text(text)
        cleaned_text = sanitized_text.lower().strip()

        age: Optional[int] = None
        gender: Optional[str] = None
        state: Optional[str] = None
        district: Optional[str] = None
        annual_income: Optional[int] = None
        category: Optional[str] = None
        education: Optional[str] = None
        occupation: Optional[str] = None
        purpose: Optional[str] = None
        activity: Optional[str] = None
        project_cost: Optional[int] = None
        loan_required: Optional[int] = None

        # 1. Extract Age
        age_match = re.search(
            r'(?:^|\s|[.,])(\d{1,2})\s*(?:years?\s*old|years|yr|yrs|வயது|வயசு|साल|वर्ष|आयु)(?:$|\s|[.,])',
            cleaned_text
        )
        if not age_match:
            age_match = re.search(r'(?:age|வயது|उम्र)\s*[:=-]?\s*(\d{1,2})', cleaned_text)
        if age_match:
            try:
                parsed_age = int(age_match.group(1))
                if 14 <= parsed_age <= 100:
                    age = parsed_age
            except ValueError:
                pass

        # 2. Extract Gender
        if any(w in cleaned_text for w in ["female", "woman", "girl", "பெண்", "महिला", "स्त्री"]):
            gender = "female"
        elif any(w in cleaned_text for w in ["male", "man", "boy", "ஆண்", "पुरुष"]):
            gender = "male"

        # 3. Extract State
        for st_name, aliases in INDIAN_STATES.items():
            if any(alias in cleaned_text for alias in aliases):
                state = st_name.title()
                break

        # 4. Extract District
        for dist_name, aliases in INDIAN_DISTRICTS.items():
            if any(alias in cleaned_text for alias in aliases):
                district = dist_name.title()
                break

        # 5. Extract Category (SC, ST, OBC, General)
        if re.search(r'(?:sc|scheduled caste|ஆதி திராவிடர்)', cleaned_text):
            category = "SC"
        elif re.search(r'(?:st|scheduled tribe|பழங்குடியினர்)', cleaned_text):
            category = "ST"
        elif re.search(r'(?:obc|bc|mbc|other backward class)', cleaned_text):
            category = "OBC"
        elif re.search(r'(?:general|open category)', cleaned_text):
            category = "General"

        # 6. Extract Education
        if re.search(r'(?:graduate|btech|be|degree|பட்டதாரி|डिग्री)', cleaned_text):
            education = "Graduate"
        elif re.search(r'(?:12th|hsc|higher secondary|பிளஸ் டூ)', cleaned_text):
            education = "12th Pass"
        elif re.search(r'(?:10th|ssl|matric|பத்தாம் வகுப்பு)', cleaned_text):
            education = "10th Pass"
        elif re.search(r'(?:diploma)', cleaned_text):
            education = "Diploma"

        # 7. Extract Occupation & Activity
        if any(w in cleaned_text for w in ["farmer", "farming", "agriculture", "விவசாயி", "किसान", "खेती"]):
            occupation = "farmer"
            if "dairy" in cleaned_text:
                activity = "dairy farming"
            else:
                activity = "agriculture"
        elif any(w in cleaned_text for w in ["weaver", "weaving", "நெசவாளர்", "बुनकर"]):
            occupation = "weaver"
            activity = "handloom weaving"
        elif any(w in cleaned_text for w in ["shopkeeper", "retailer", "trader", "வியாபாரி", "दुकानदार"]):
            occupation = "shopkeeper"
            activity = "retail trade"
        elif any(w in cleaned_text for w in ["entrepreneur", "business", "startup", "தொழில்", "व्यापार"]):
            occupation = "entrepreneur"

        # 8. Extract Financial Figures (Income, Loan Required, Project Cost)
        # Split text into segments around commas/periods/clauses
        segments = re.split(r'[,.\n]+', cleaned_text)
        for seg in segments:
            norm = normalize_indian_currency(seg)
            if norm:
                if any(w in seg for w in ["income", "earning", "வருமானம்", "आय", "salary"]):
                    annual_income = norm
                elif any(w in seg for w in ["loan", "kadan", "கடன்கள்", "கடன்", "ऋण", "लोन"]):
                    loan_required = norm
                elif any(w in seg for w in ["project cost", "total cost", "cost", "செலவு", "लागत"]):
                    project_cost = norm

        # Fallback if loan_required or income wasn't partitioned in clause
        if not loan_required and not annual_income:
            norm = normalize_indian_currency(cleaned_text)
            if norm:
                if any(w in cleaned_text for w in ["income", "வருமானம்", "आय"]):
                    annual_income = norm
                else:
                    loan_required = norm

        # 9. Extract Purpose
        if "dairy" in cleaned_text or "farming" in cleaned_text:
            purpose = "dairy farming"
        else:
            purpose_match = re.search(r'(?:for|purpose of|தேவை|உதவி)\s+([a-z0-9\s\u0900-\u0D7F]{4,30})', cleaned_text)
            if purpose_match:
                extracted_purpose = purpose_match.group(1).strip()
                if not any(k in extracted_purpose for k in ["loan", "lakh", "rs", "rupees", "வருமானம்"]):
                    purpose = extracted_purpose
            elif activity:
                purpose = activity

        profile = BeneficiaryProfile(
            age=age,
            gender=gender,
            state=state,
            district=district,
            annual_income=annual_income,
            category=category,
            education=education,
            occupation=occupation,
            purpose=purpose,
            activity=activity,
            project_cost=project_cost,
            loan_required=loan_required
        )

        return ProfileExtractResponse(
            profile=profile,
            pii_detected=pii_detected
        )
