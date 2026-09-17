import re
from typing import Dict, Tuple, Optional
from langdetect import detect_langs, DetectorFactory
from app.core.config import settings

# Enforce deterministic results for langdetect
DetectorFactory.seed = 0

# Unicode Script Ranges for Major Indian Languages & Scripts
UNICODE_SCRIPTS = {
    "ta-IN": (0x0B80, 0x0BFF),  # Tamil
    "hi-IN": (0x0900, 0x097F),  # Devanagari (Hindi / Marathi)
    "bn-IN": (0x0980, 0x09FF),  # Bengali
    "te-IN": (0x0C00, 0x0C7F),  # Telugu
    "kn-IN": (0x0C80, 0x0CF3),  # Kannada
    "ml-IN": (0x0D00, 0x0D7F),  # Malayalam
}

# Phonetic Romanized Indic keywords (for Hinglish, Tanglish, Teluglish, etc.)
ROMANIZED_MARKERS = {
    "hi-IN": {
        "mujhe", "chahiye", "yojana", "kaise", "milega", "kya", "hai", "karo", 
        "aavedan", "scheme", "batao", "kare", "sarkar", "paisa", "rupaye"
    },
    "ta-IN": {
        "sollu", "venum", "pathi", "enakkul", "enakku", "irukku", "thanga", 
        "tharuvaanga", "panam", "thittam"
    },
    "te-IN": {
        "kavali", "cheppandi", "padhakam", "elaga", "yela", "undhi", "padhakaalu"
    },
    "kn-IN": {
        "beku", "yojane", "bagge", "heli", "siguthe", "ide"
    },
    "ml-IN": {
        "venam", "parayoo", "padhathi", "patthi", "undo"
    },
    "bn-IN": {
        "chai", "jonno", "pabo", "jante", "bhalo", "prakalpa"
    }
}


class LanguageDetector:
    """
    Multilingual Language & Code-Mixing Detection Engine tailored for Indian Government Scheme Matching.
    Supports English, Tamil, Hindi, Telugu, Kannada, Malayalam, Bengali, and Marathi.
    """

    @staticmethod
    def detect_script_distribution(text: str) -> Tuple[Dict[str, int], int, int]:
        """
        Calculates character count per Indic script and Latin script.
        Returns: (script_counts, total_indic_chars, latin_chars)
        """
        script_counts = {lang: 0 for lang in UNICODE_SCRIPTS}
        latin_chars = 0
        total_indic_chars = 0

        for char in text:
            cp = ord(char)
            # Latin A-Z, a-z
            if (65 <= cp <= 90) or (97 <= cp <= 122):
                latin_chars += 1
                continue
            
            for lang, (start, end) in UNICODE_SCRIPTS.items():
                if start <= cp <= end:
                    script_counts[lang] += 1
                    total_indic_chars += 1
                    break

        return script_counts, total_indic_chars, latin_chars

    @staticmethod
    def disambiguate_devanagari(text: str) -> str:
        """
        Disambiguates Devanagari script between Hindi (hi-IN) and Marathi (mr-IN).
        """
        # 1. Check for Marathi unique characters (e.g. ळ, ॲ, ऑ)
        marathi_chars = {'ळ', 'ॲ', 'ऑ'}
        for char in text:
            if char in marathi_chars:
                return "mr-IN"

        # 2. Check vocabulary tokens
        words = set(re.findall(r'[\u0900-\u097F]+', text))
        marathi_words = {
            'आहे', 'नाही', 'आणि', 'मध्ये', 'करणार', 'काय', 'मला', 'तुम्हाला', 
            'पाहिजे', 'कसे', 'होते', 'केले', 'आहोत', 'नाहीत', 'साठी'
        }
        hindi_words = {
            'चाहिए', 'मुझे', 'की', 'का', 'के', 'है', 'हूँ', 'और', 'था', 'थी', 
            'करें', 'जानकारी', 'विवरण', 'किसान', 'सम्मान', 'निधि', 'आवेदन'
        }

        marathi_matches = len(words.intersection(marathi_words))
        hindi_matches = len(words.intersection(hindi_words))

        if marathi_matches > hindi_matches:
            return "mr-IN"
        
        return "hi-IN"

    @classmethod
    def detect_romanized_indic(cls, text: str) -> Optional[Tuple[str, float]]:
        """
        Detects Romanized code-mixed text (e.g., Hinglish, Tanglish).
        """
        words = set(re.findall(r'\b[a-zA-Z]+\b', text.lower()))
        if not words:
            return None

        best_lang = None
        max_matches = 0

        for lang, markers in ROMANIZED_MARKERS.items():
            matches = len(words.intersection(markers))
            if matches > max_matches:
                max_matches = matches
                best_lang = lang

        if best_lang and max_matches >= 1:
            confidence = min(0.65 + (max_matches * 0.15), 0.92)
            return best_lang, round(confidence, 2)

        return None

    @classmethod
    def detect(cls, text: str) -> Tuple[str, float, bool, Optional[str]]:
        """
        Main detection entrypoint.
        Returns: (language_code, confidence_score, is_code_mixed, primary_script)
        """
        cleaned_text = text.strip()
        if not cleaned_text:
            return settings.DEFAULT_LANGUAGE, 0.0, False, "None"

        script_counts, total_indic_chars, latin_chars = cls.detect_script_distribution(cleaned_text)

        # Case 1: Indic Script Detected (Native or Code-Mixed with Latin)
        if total_indic_chars > 0:
            dominant_lang = max(script_counts, key=script_counts.get)
            dominant_count = script_counts[dominant_lang]

            if dominant_count > 0:
                # Disambiguate Devanagari script for Hindi vs Marathi
                if dominant_lang == "hi-IN":
                    dominant_lang = cls.disambiguate_devanagari(cleaned_text)

                is_code_mixed = latin_chars > 0
                script_name = dominant_lang.split("-")[0].upper()

                # Calculate confidence based on script dominance and length
                total_script_chars = total_indic_chars + latin_chars
                indic_ratio = dominant_count / total_script_chars if total_script_chars > 0 else 1.0

                if is_code_mixed:
                    # High confidence for primary Indic intent even when code-mixed with English
                    confidence = round(min(0.85 + (indic_ratio * 0.12), 0.98), 2)
                else:
                    confidence = round(min(0.90 + (indic_ratio * 0.10), 0.99), 2)

                return dominant_lang, confidence, is_code_mixed, script_name

        # Case 2: Pure Latin / Romanized text
        if latin_chars > 0:
            # Check for Romanized Indic code-mixing (Hinglish/Tanglish etc.)
            romanized_res = cls.detect_romanized_indic(cleaned_text)
            if romanized_res:
                lang, conf = romanized_res
                return lang, conf, True, "LATIN"

            # Fallback to langdetect for standard English or Latin-script text
            try:
                predictions = detect_langs(cleaned_text)
                if predictions:
                    top_pred = predictions[0]
                    iso_code = top_pred.lang
                    bcp_code = settings.SUPPORTED_LANGUAGES.get(iso_code, settings.DEFAULT_LANGUAGE)
                    conf = round(float(top_pred.prob), 2)
                    return bcp_code, conf, False, "LATIN"
            except Exception:
                pass

            return settings.DEFAULT_LANGUAGE, 0.85, False, "LATIN"

        # Case 3: Default Fallback
        return settings.DEFAULT_LANGUAGE, 0.50, False, "UNKNOWN"
