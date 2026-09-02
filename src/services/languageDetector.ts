import type { DetectedLanguage } from '../types/ai';

/* ==========================================================================
   Indic Language Transliteration & Heuristic Word Dictionaries
   ========================================================================== */

/**
 * Common Romanized / Tanglish words and suffixes
 */
const TAMIL_ROMANIZED_KEYWORDS = new Set([
  'enakku', 'enaku', 'unaku', 'unakku', 'engalukku', 'namma', 'neenga',
  'avan', 'aval', 'enna', 'edhu', 'eppadi', 'epdi', 'enga', 'engae', 'yenga',
  'eppo', 'yaaru', 'ethana', 'venum', 'vendum', 'panna', 'pannum', 'seyya',
  'seiya', 'irukku', 'iruku', 'irukken', 'iruken', 'irukom', 'kudunga',
  'thanga', 'kodunga', 'kadan', 'vaanga', 'solunga', 'parkka', 'paaka',
  'varum', 'mudiyuma', 'mudiyum', 'theriyum', 'theriyala', 'podanum',
  'thozhil', 'thozil', 'thodanga', 'aarambikka', 'udavi', 'udhavi',
  'thevai', 'panam', 'kaasu', 'kaas', 'aatkal', 'magalir', 'veedu',
  'manai', 'vivasayam', 'kadai', 'vanganum', 'kedaikuma', 'kedaikkum',
  'iruka', 'irukkadha', 'nalla', 'romba', 'konjam', 'periya', 'chinna',
]);

/**
 * Common Romanized / Hinglish words
 */
const HINDI_ROMANIZED_KEYWORDS = new Set([
  'mujhe', 'humko', 'humein', 'mera', 'meri', 'mere', 'tumhe', 'aapko',
  'aapka', 'kya', 'kaise', 'kahan', 'kidhar', 'kab', 'kaun', 'kitna',
  'kitne', 'chahiye', 'hai', 'hain', 'hoga', 'hogi', 'tha', 'thi', 'the',
  'karna', 'karo', 'karein', 'hona', 'dena', 'do', 'de', 'milega', 'milegi',
  'sakta', 'sakti', 'raha', 'rahi', 'ke', 'ki', 'ka', 'ko', 'se', 'mein',
  'par', 'liye', 'aur', 'bhi', 'nahi', 'nahin', 'mat', 'madad', 'yojana',
  'paisa', 'paise', 'rupaye', 'rupya', 'kist', 'byaj', 'karz', 'vyapar',
  'dukan', 'ghar', 'kheti', 'mahila', 'batao', 'bataye', 'chahiye',
]);

/**
 * Common Romanized / Tenglish words
 */
const TELUGU_ROMANIZED_KEYWORDS = new Set([
  'naaku', 'naku', 'maaku', 'maku', 'meeku', 'kaavali', 'kavali', 'ela',
  'eppudu', 'ekkadiki', 'ekkada', 'chesukovali', 'cheyali', 'undhi', 'undi',
  'unnadi', 'sahayam', 'sahayamu', 'dabbulu', 'appu', 'vundhi', 'cheyandi',
  'ivvandi', 'kavalanukuntunnanu',
]);

/**
 * Common Romanized / Kanglish words
 */
const KANNADA_ROMANIZED_KEYWORDS = new Set([
  'nanage', 'namage', 'nimge', 'beku', 'bekagide', 'hege', 'yelli', 'elli',
  'yaavaga', 'madodu', 'madabeku', 'sahaya', 'duddu', 'hana', 'saala', 'ide',
  'kodtira', 'heli', 'beku',
]);

/**
 * Common Romanized / Manglish words
 */
const MALAYALAM_ROMANIZED_KEYWORDS = new Set([
  'enikku', 'eniku', 'njangalkku', 'venam', 'sahayam', 'enganeyanu',
  'evide', 'eppol', 'cheyyanam', 'cheyyan', 'paisa', 'kadam', 'und',
  'undo', 'tharam', 'parayamo',
]);

/**
 * Common English stopwords and domain vocabulary
 */
const ENGLISH_KEYWORDS = new Set([
  'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she', 'they',
  'want', 'need', 'require', 'help', 'find', 'finding', 'search', 'scheme',
  'schemes', 'business', 'loan', 'loans', 'start', 'starting', 'for', 'to',
  'in', 'is', 'are', 'am', 'government', 'govt', 'state', 'central',
  'apply', 'applying', 'application', 'eligible', 'eligibility', 'check',
  'how', 'what', 'where', 'can', 'give', 'tell', 'please', 'document',
  'documents', 'subsidy', 'money', 'interest', 'calculator', 'bank',
  'partner', 'nearest', 'new', 'get', 'the', 'a', 'an', 'lakh', 'lakhs',
  'crore', 'tailoring', 'housing', 'shop', 'vendor',
]);

/* ==========================================================================
   Unicode Character Ranges
   ========================================================================== */

const TAMIL_UNICODE_REGEX = /[\u0B80-\u0BFF]/;
const HINDI_UNICODE_REGEX = /[\u0900-\u097F]/;
const TELUGU_UNICODE_REGEX = /[\u0C00-\u0C7F]/;
const KANNADA_UNICODE_REGEX = /[\u0C80-\u0CFF]/;
const MALAYALAM_UNICODE_REGEX = /[\u0D00-\u0D7F]/;
const LATIN_LETTER_REGEX = /[a-zA-Z]/;

/* ==========================================================================
   Language Detector Implementation
   ========================================================================== */

/**
 * Normalizes input text into searchable tokens
 */
function tokenizeText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length > 0);
}

/**
 * Detects the natural language and code-mixing profile of an input string
 * Supports native Indic Unicode scripts and Latin-script transliterations
 * 
 * @param text The user message string to analyze
 * @returns DetectedLanguage metadata containing primary/secondary language and mixing state
 */
export function detectLanguage(text: string): DetectedLanguage {
  // 1. Handle empty or whitespace-only strings
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      primary: 'English',
      displayName: 'English',
      confidence: 0.0,
      isMixed: false,
    };
  }

  // 2. Count Unicode native script characters
  let tamilChars = 0;
  let hindiChars = 0;
  let teluguChars = 0;
  let kannadaChars = 0;
  let malayalamChars = 0;
  let latinChars = 0;

  for (const char of trimmed) {
    if (TAMIL_UNICODE_REGEX.test(char)) tamilChars++;
    else if (HINDI_UNICODE_REGEX.test(char)) hindiChars++;
    else if (TELUGU_UNICODE_REGEX.test(char)) teluguChars++;
    else if (KANNADA_UNICODE_REGEX.test(char)) kannadaChars++;
    else if (MALAYALAM_UNICODE_REGEX.test(char)) malayalamChars++;
    else if (LATIN_LETTER_REGEX.test(char)) latinChars++;
  }

  const totalIndicChars = tamilChars + hindiChars + teluguChars + kannadaChars + malayalamChars;

  // 3. Analyze tokens for Romanized Indic & English keywords
  const tokens = tokenizeText(trimmed);
  let tamilWordScore = 0;
  let hindiWordScore = 0;
  let teluguWordScore = 0;
  let kannadaWordScore = 0;
  let malayalamWordScore = 0;
  let englishWordScore = 0;

  for (const token of tokens) {
    // Strip hyphens or location suffix (e.g. 'coimbatore-la' -> 'la')
    const parts = token.split('-');
    const baseToken = parts[0];
    const suffix = parts.length > 1 ? parts[1] : '';

    if (TAMIL_ROMANIZED_KEYWORDS.has(baseToken) || TAMIL_ROMANIZED_KEYWORDS.has(token) || suffix === 'la') {
      tamilWordScore += 1;
    }
    if (HINDI_ROMANIZED_KEYWORDS.has(baseToken) || HINDI_ROMANIZED_KEYWORDS.has(token)) {
      hindiWordScore += 1;
    }
    if (TELUGU_ROMANIZED_KEYWORDS.has(baseToken) || TELUGU_ROMANIZED_KEYWORDS.has(token)) {
      teluguWordScore += 1;
    }
    if (KANNADA_ROMANIZED_KEYWORDS.has(baseToken) || KANNADA_ROMANIZED_KEYWORDS.has(token)) {
      kannadaWordScore += 1;
    }
    if (MALAYALAM_ROMANIZED_KEYWORDS.has(baseToken) || MALAYALAM_ROMANIZED_KEYWORDS.has(token)) {
      malayalamWordScore += 1;
    }
    if (ENGLISH_KEYWORDS.has(baseToken) || ENGLISH_KEYWORDS.has(token)) {
      englishWordScore += 1;
    }
  }

  // 4. Decision Engine

  // Case A: Pure or predominant Native Unicode Scripts
  if (totalIndicChars > 0) {
    const hasEnglishWords = latinChars > 2 || englishWordScore > 0;

    if (tamilChars >= hindiChars && tamilChars >= teluguChars && tamilChars >= kannadaChars && tamilChars >= malayalamChars) {
      if (hasEnglishWords) {
        return {
          primary: 'Tamil',
          secondary: 'English',
          displayName: 'Tamil + English',
          confidence: 0.95,
          isMixed: true,
        };
      }
      return {
        primary: 'Tamil',
        displayName: 'Tamil',
        confidence: 0.98,
        isMixed: false,
      };
    }

    if (hindiChars > 0) {
      if (hasEnglishWords) {
        return {
          primary: 'Hindi',
          secondary: 'English',
          displayName: 'Hindi + English',
          confidence: 0.95,
          isMixed: true,
        };
      }
      return {
        primary: 'Hindi',
        displayName: 'Hindi',
        confidence: 0.98,
        isMixed: false,
      };
    }

    if (teluguChars > 0) {
      return {
        primary: 'Telugu',
        secondary: hasEnglishWords ? 'English' : undefined,
        displayName: hasEnglishWords ? 'Telugu + English' : 'Telugu',
        confidence: 0.96,
        isMixed: hasEnglishWords,
      };
    }

    if (kannadaChars > 0) {
      return {
        primary: 'Kannada',
        secondary: hasEnglishWords ? 'English' : undefined,
        displayName: hasEnglishWords ? 'Kannada + English' : 'Kannada',
        confidence: 0.96,
        isMixed: hasEnglishWords,
      };
    }

    if (malayalamChars > 0) {
      return {
        primary: 'Malayalam',
        secondary: hasEnglishWords ? 'English' : undefined,
        displayName: hasEnglishWords ? 'Malayalam + English' : 'Malayalam',
        confidence: 0.96,
        isMixed: hasEnglishWords,
      };
    }
  }

  // Case B: Romanized / Code-Mixed Latin Script
  if (tamilWordScore > 0 && tamilWordScore >= hindiWordScore && tamilWordScore >= teluguWordScore) {
    return {
      primary: 'Tamil',
      secondary: 'English',
      displayName: 'Tamil + English',
      confidence: Math.min(0.96, 0.70 + tamilWordScore * 0.08),
      isMixed: true,
    };
  }

  if (hindiWordScore > 0 && hindiWordScore >= teluguWordScore) {
    return {
      primary: 'Hindi',
      secondary: 'English',
      displayName: 'Hindi + English',
      confidence: Math.min(0.96, 0.70 + hindiWordScore * 0.08),
      isMixed: true,
    };
  }

  if (teluguWordScore > 0) {
    return {
      primary: 'Telugu',
      secondary: 'English',
      displayName: 'Telugu + English',
      confidence: Math.min(0.94, 0.70 + teluguWordScore * 0.08),
      isMixed: true,
    };
  }

  if (kannadaWordScore > 0) {
    return {
      primary: 'Kannada',
      secondary: 'English',
      displayName: 'Kannada + English',
      confidence: Math.min(0.94, 0.70 + kannadaWordScore * 0.08),
      isMixed: true,
    };
  }

  if (malayalamWordScore > 0) {
    return {
      primary: 'Malayalam',
      secondary: 'English',
      displayName: 'Malayalam + English',
      confidence: Math.min(0.94, 0.70 + malayalamWordScore * 0.08),
      isMixed: true,
    };
  }

  // Case C: Pure English / Default Fallback
  const englishConfidence = tokens.length > 0 ? (englishWordScore > 0 ? 0.96 : 0.85) : 0.50;
  return {
    primary: 'English',
    displayName: 'English',
    confidence: englishConfidence,
    isMixed: false,
  };
}

export default detectLanguage;
