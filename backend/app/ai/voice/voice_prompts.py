"""
Module: app/ai/voice/voice_prompts.py

Multilingual voice greeting and response templates.
Used for TTS synthesis in the voice pipeline.
"""

from __future__ import annotations

from typing import Dict, Optional


VOICE_GREETINGS: Dict[str, str] = {
    "en-IN": "Hello! Welcome to the Government Scheme Assistant. I can help you find schemes you qualify for. Please tell me about yourself — your occupation, income, and what kind of assistance you need.",
    "ta-IN": "வணக்கம்! அரசு திட்ட உதவியாளருக்கு வரவேற்கிறோம். நான் உங்களுக்கு தகுதியான திட்டங்களை கண்டறிய உதவலாம். உங்கள் தொழில், வருமானம் பற்றி கூறுங்கள்.",
    "hi-IN": "नमस्ते! सरकारी योजना सहायक में आपका स्वागत है। मैं आपको उपयुक्त योजनाएं खोजने में मदद कर सकता हूँ। कृपया अपने बारे में बताएं।",
    "te-IN": "నమస్కారం! ప్రభుత్వ పథకాల సహాయకుడికి స్వాగతం. నేను మీకు అర్హమైన పథకాలు కనుగొనడంలో సహాయపడగలను.",
    "kn-IN": "ನಮಸ್ಕಾರ! ಸರ್ಕಾರಿ ಯೋಜನೆ ಸಹಾಯಕಕ್ಕೆ ಸ್ವಾಗತ.",
    "ml-IN": "ഹലോ! സർക്കാർ പദ്ധതി സഹായിയിലേക്ക് സ്വാഗതം.",
    "bn-IN": "হ্যালো! সরকারি প্রকল্প সহায়কে স্বাগতম।",
    "mr-IN": "नमस्कार! सरकारी योजना सहाय्यकात आपले स्वागत आहे.",
}

VOICE_SILENCE_PROMPT: Dict[str, str] = {
    "en-IN": "I'm listening. Please go ahead.",
    "ta-IN": "நான் கேட்கிறேன். தொடரவும்.",
    "hi-IN": "मैं सुन रहा हूँ। कृपया जारी रखें।",
    "te-IN": "నేను వింటున్నాను. దయచేసి కొనసాగించండి.",
}

VOICE_ERROR_PROMPT: Dict[str, str] = {
    "en-IN": "I'm sorry, I didn't catch that. Could you please repeat?",
    "ta-IN": "மன்னிக்கவும், எனக்கு புரியவில்லை. மீண்டும் சொல்ல முடியுமா?",
    "hi-IN": "माफ़ करें, मुझे समझ नहीं आया। क्या आप दोबारा बोल सकते हैं?",
    "te-IN": "క్షమించండి, నాకు అర్థం కాలేదు. మళ్ళీ చెప్పగలరా?",
}

VOICE_SESSION_END: Dict[str, str] = {
    "en-IN": "Thank you for using the Government Scheme Assistant. Goodbye and best of luck with your application!",
    "ta-IN": "அரசு திட்ட உதவியாளரை பயன்படுத்தியதற்கு நன்றி. வணக்கம்!",
    "hi-IN": "सरकारी योजना सहायक का उपयोग करने के लिए धन्यवाद। अलविदा!",
    "te-IN": "ప్రభుత్వ పథకాల సహాయకుడిని ఉపయోగించినందుకు ధన్యవాదాలు. వీడ్కోలు!",
}


def get_voice_prompt(prompt_dict: Dict[str, str], language: str) -> str:
    """Get a voice prompt in the specified language with English fallback."""
    return prompt_dict.get(language, prompt_dict.get("en-IN", ""))
