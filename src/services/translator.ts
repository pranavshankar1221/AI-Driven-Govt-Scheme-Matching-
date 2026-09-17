export interface LanguageChoice {
  code: string;
  name: string;
  native: string;
  speechLocale: string;
}

export const SUPPORTED_VOICE_LANGUAGES: LanguageChoice[] = [
  { code: 'en', name: 'English', native: 'English', speechLocale: 'en-IN' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', speechLocale: 'hi-IN' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', speechLocale: 'ta-IN' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', speechLocale: 'te-IN' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', speechLocale: 'bn-IN' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', speechLocale: 'mr-IN' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', speechLocale: 'gu-IN' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', speechLocale: 'kn-IN' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', speechLocale: 'ml-IN' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', speechLocale: 'pa-IN' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ', speechLocale: 'or-IN' },
  { code: 'ur', name: 'Urdu', native: 'اردو', speechLocale: 'ur-IN' },
];

/**
 * Detect primary Indic script language of a given text string
 */
export function detectScriptLanguage(text: string): string {
  if (!text) return 'en';
  if (/[\u0900-\u097F]/.test(text)) return 'hi'; // Devanagari (Hindi / Marathi)
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta'; // Tamil
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te'; // Telugu
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kn'; // Kannada
  if (/[\u0D00-\u0DFF]/.test(text)) return 'ml'; // Malayalam
  if (/[\u0980-\u09FF]/.test(text)) return 'bn'; // Bengali
  if (/[\u0A80-\u0AFF]/.test(text)) return 'gu'; // Gujarati
  if (/[\u0A00-\u0A7F]/.test(text)) return 'pa'; // Punjabi
  if (/[\u0B00-\u0B7F]/.test(text)) return 'or'; // Odia
  if (/[\u0600-\u06FF]/.test(text)) return 'ur'; // Urdu
  return 'en';
}

/**
 * Common phrase dictionary for instant local translation
 */
const INDIC_PHRASES: Record<string, Record<string, string>> = {
  hi: {
    "Hello! I'm your Sahaya AI Assistant. I can help you discover government schemes, verify eligibility, calculate financial assistance, identify required documents, locate authorized channel partners, and guide your application.": "नमस्ते! मैं आपका सहाय AI सहायक हूँ। मैं सरकारी योजनाओं की खोज करने, पात्रता सत्यापित करने, वित्तीय सहायता की गणना करने, आवश्यक दस्तावेजों की पहचान करने और अधिकृत बैंक भागीदारों का पता लगाने में आपकी सहायता कर सकता हूँ।",
    "Hello! I'm your Sahaya AI Assistant.": "नमस्ते! मैं आपका सहाय AI सहायक हूँ।",
    "Based on your profile": "आपकी प्रोफाइल के आधार पर",
    "Likely Eligible": "संभावित रूप से पात्र",
    "Needs Review": "समीक्षा की आवश्यकता है",
    "Required Documents": "आवश्यक दस्तावेज",
    "Financial Assistance": "वित्तीय सहायता",
    "Authorized Partners": "अधिकृत चैनल पार्टनर",
    "Annual Income": "वार्षिक आय",
    "Location": "स्थान",
  },
  ta: {
    "Hello! I'm your Sahaya AI Assistant. I can help you discover government schemes, verify eligibility, calculate financial assistance, identify required documents, locate authorized channel partners, and guide your application.": "வணக்கம்! நான் உங்கள் சகாயா AI உதவியாளர். அரசு நலத்திட்டங்களைக் கண்டறியவும், தகுதியைச் சரிபார்க்கவும், நிதி உதவியைக் கணக்கிடவும், தேவையான ஆவணங்களை அறியவும், வங்கிக் கூட்டாளர்களைக் கண்டறியவும் நான் உங்களுக்கு உதவுவேன்.",
    "Hello! I'm your Sahaya AI Assistant.": "வணக்கம்! நான் உங்கள் சகாயா AI உதவியாளர்.",
    "Based on your profile": "உங்கள் சுயவிவரத்தின் அடிப்படையில்",
    "Likely Eligible": "தகுதியுடையவர்",
    "Needs Review": "பரிசீலனை தேவை",
    "Required Documents": "தேவையான ஆவணங்கள்",
    "Financial Assistance": "நிதி உதவி",
    "Authorized Partners": "அங்கீகரிக்கப்பட்ட வங்கி கூட்டாளர்கள்",
    "Annual Income": "ஆண்டு வருமானம்",
    "Location": "இருப்பிடம்",
  },
  te: {
    "Hello! I'm your Sahaya AI Assistant. I can help you discover government schemes, verify eligibility, calculate financial assistance, identify required documents, locate authorized channel partners, and guide your application.": "నమస్కారం! నేను మీ సహాయ AI అసిస్టెంట్‌ని. ప్రభుత్వ పథకాలను కనుగొనడంలో, అర్హతను తనిఖీ చేయడంలో, ఆర్థిక సహాయాన్ని లెక్కించడంలో మరియు అవసరమైన పత్రాలను గుర్తించడంలో నేను మీకు సహాయం చేస్తాను.",
    "Hello! I'm your Sahaya AI Assistant.": "నమస్కారం! నేను మీ సహాయ AI అసిస్టెంట్‌ని.",
    "Based on your profile": "మీ ప్రొఫైల్ ఆధారంగా",
    "Likely Eligible": "అర్హత ఉంది",
    "Needs Review": "సమీక్ష అవసరం",
    "Required Documents": "అవసరమైన పత్రాలు",
    "Financial Assistance": "ఆర్థిక సహాయం",
    "Authorized Partners": "అధికారిక బ్యాంకింగ్ భాగస్వాములు",
    "Annual Income": "వార్షిక ఆదాయం",
    "Location": "ప్రాంతం",
  },
  mr: {
    "Hello! I'm your Sahaya AI Assistant.": "नमस्कार! मी तुमचा सहाय AI सहाय्यक आहे.",
    "Based on your profile": "तुमच्या प्रोफाइलच्या आधारे",
    "Likely Eligible": "पात्र असण्याची शक्यता",
    "Needs Review": "पुनरावलोकनाची गरज",
    "Required Documents": "आवश्यक कागदपत्रे",
  },
  bn: {
    "Hello! I'm your Sahaya AI Assistant.": "হ্যালো! আমি আপনার সহায় AI সহকারী।",
  },
  gu: {
    "Hello! I'm your Sahaya AI Assistant.": "નમસ્તે! હું તમારો સહાય AI સહાયક છું.",
  },
  kn: {
    "Hello! I'm your Sahaya AI Assistant.": "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಸಹಾಯ AI ಸಹಾಯಕ.",
  },
  ml: {
    "Hello! I'm your Sahaya AI Assistant.": "നമസ്കാരം! ഞാൻ നിങ്ങളുടെ സഹായ AI അസിസ്റ്റന്റാണ്.",
  },
};

/**
 * Cache for API translations to avoid duplicate network calls
 */
const translationCache: Record<string, string> = {};

/**
 * Translate text into target language with MyMemory API + local dictionary fallback
 */
export async function translateText(text: string, targetLang: string): Promise<string> {
  if (!text || targetLang === 'en') return text;

  const cacheKey = `${targetLang}:${text.slice(0, 100)}`;
  if (translationCache[cacheKey]) {
    return translationCache[cacheKey];
  }

  // 1. Direct dictionary match for static/welcome phrases
  const dict = INDIC_PHRASES[targetLang];
  if (dict && dict[text]) {
    translationCache[cacheKey] = dict[text];
    return dict[text];
  }

  // 2. Perform MyMemory API translation for dynamic chat responses
  try {
    const cleanText = text.replace(/[#*`_~]/g, '').slice(0, 450);
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=en|${targetLang}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (
        data.responseData?.translatedText &&
        !data.responseData.translatedText.includes('MYMEMORY WARNING') &&
        data.responseData.translatedText !== cleanText
      ) {
        const translated = data.responseData.translatedText;
        translationCache[cacheKey] = translated;
        return translated;
      }
    }
  } catch {
    // API network fallback
  }

  // 3. Phrase replacement fallback
  if (dict) {
    let formatted = text;
    for (const [enPhrase, targetPhrase] of Object.entries(dict)) {
      formatted = formatted.replace(new RegExp(enPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), targetPhrase);
    }
    translationCache[cacheKey] = formatted;
    return formatted;
  }

  return text;
}
