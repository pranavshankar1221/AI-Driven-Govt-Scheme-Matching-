import re
from typing import Optional


WORD_TO_NUM = {
    "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
    "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
    "एक": 1, "दो": 2, "तीन": 3, "चार": 4, "पांच": 5,
    "ஒன்று": 1, "இரண்டு": 2, "மூன்று": 3, "நான்கு": 4, "ஐந்து": 5
}


def normalize_indian_currency(text: str) -> Optional[int]:
    """
    Normalizes Indian currency expressions to integer value (INR).
    Examples:
        "4 lakh" -> 400000
        "₹4L" -> 400000
        "four lakhs" -> 400000
        "50k" -> 50000
        "1.5 crore" -> 15000000
        "400000" -> 400000
    """
    if not text:
        return None

    cleaned = str(text).lower().strip()
    cleaned = cleaned.replace("₹", "").replace("rs.", "").replace("rs", "").replace("inr", "").replace(",", "").strip()

    # Regex 1: Lakhs ("4 lakh", "4.5 lakhs", "four lakhs", "4l", "4 லட்சம்", "4 लाख")
    match_lakh = re.search(r'(\d+(?:\.\d+)?|[a-z\u0900-\u0D7F]+)\s*(?:lakhs?|lakh|l|லட்சம்|லாபம்|लाख)(?=\s|$|[.,\s])', cleaned)
    if match_lakh:
        val_str = match_lakh.group(1)
        val = WORD_TO_NUM.get(val_str, None)
        if val is None:
            try:
                val = float(val_str)
            except ValueError:
                val = None
        if val is not None:
            if val >= 10000:
                return int(val)
            return int(val * 100000)

    # Regex 2: Crore ("1 crore", "1.5 cr", "1cr", "1 கோடி", "1 करोड")
    match_cr = re.search(r'(\d+(?:\.\d+)?|[a-z\u0900-\u0D7F]+)\s*(?:crores?|crore|cr|கோடி|करोड)(?=\s|$|[.,\s])', cleaned)
    if match_cr:
        val_str = match_cr.group(1)
        val = WORD_TO_NUM.get(val_str, None)
        if val is None:
            try:
                val = float(val_str)
            except ValueError:
                val = None
        if val is not None:
            if val >= 1000000:
                return int(val)
            return int(val * 10000000)

    # Regex 3: Thousand / K ("50k", "50 thousand", "50 ஆயிரம்", "50 हजार")
    match_k = re.search(r'(\d+(?:\.\d+)?|[a-z\u0900-\u0D7F]+)\s*(?:k|thousands?|thousand|ஆயிரம்|हजार)(?=\s|$|[.,\s])', cleaned)
    if match_k:
        val_str = match_k.group(1)
        val = WORD_TO_NUM.get(val_str, None)
        if val is None:
            try:
                val = float(val_str)
            except ValueError:
                val = None
        if val is not None:
            if val >= 1000:
                return int(val)
            return int(val * 1000)

    # Direct raw number extraction (e.g., "400000", "50000")
    raw_num_match = re.search(r'\b\d{4,10}\b', cleaned)
    if raw_num_match:
        try:
            return int(raw_num_match.group(0))
        except ValueError:
            pass

    return None
