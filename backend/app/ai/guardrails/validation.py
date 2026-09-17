import re
from typing import Tuple


class PIIGuardrail:
    """
    Privacy & Safety Guardrail to detect and redact sensitive PII including:
    - Aadhaar numbers (12 digits)
    - PAN card numbers (10 alphanumeric chars)
    - OTP / Verification PIN codes (4-6 digits)
    - Bank Account numbers (9-18 digits)
    """

    # Aadhaar pattern (e.g. 1234 5678 9012 or 123456789012)
    AADHAAR_PATTERN = r'\b[2-9]\d{3}\s?\d{4}\s?\d{4}\b'

    # PAN card pattern (e.g. ABCDE1234F)
    PAN_PATTERN = r'\b[A-Z]{5}[0-9]{4}[A-Z]\b'

    # OTP pattern (e.g. OTP 123456 or code: 9876)
    OTP_PATTERN = r'\b(?:otp|one time password|pin|code)\s*[:=-]?\s*(\d{4,6})\b'

    # Bank Account pattern (e.g. Acc 12345678901234)
    BANK_ACC_PATTERN = r'\b(?:account|acc|acct|a/c)\s*(?:no|number)?\s*[:=-]?\s*(\d{9,18})\b'

    @classmethod
    def sanitize_text(cls, text: str) -> Tuple[str, bool]:
        """
        Scans text for sensitive PII, redacts detected PII sequences, and returns:
        (sanitized_text, pii_detected_bool)
        """
        if not text:
            return text, False

        sanitized = text
        pii_found = False

        # Check Aadhaar
        if re.search(cls.AADHAAR_PATTERN, sanitized):
            sanitized = re.sub(cls.AADHAAR_PATTERN, "[REDACTED_AADHAAR]", sanitized)
            pii_found = True

        # Check PAN
        if re.search(cls.PAN_PATTERN, sanitized, re.IGNORECASE):
            sanitized = re.sub(cls.PAN_PATTERN, "[REDACTED_PAN]", sanitized, flags=re.IGNORECASE)
            pii_found = True

        # Check OTP
        if re.search(cls.OTP_PATTERN, sanitized, re.IGNORECASE):
            sanitized = re.sub(cls.OTP_PATTERN, "[REDACTED_OTP]", sanitized, flags=re.IGNORECASE)
            pii_found = True

        # Check Bank Account
        if re.search(cls.BANK_ACC_PATTERN, sanitized, re.IGNORECASE):
            sanitized = re.sub(cls.BANK_ACC_PATTERN, "[REDACTED_BANK_ACC]", sanitized, flags=re.IGNORECASE)
            pii_found = True

        return sanitized, pii_found
