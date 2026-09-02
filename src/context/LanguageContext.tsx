import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, SUPPORTED_LANGUAGES, type LanguageOption, type TranslationKey } from '../i18n/translations';
import { getLocalizedSchemeData, getLocalizedFAQsData, getLocalizedPartnersData } from '../i18n/schemesI18n';
import type { Scheme, Partner } from '../types';
import { faqs, partners } from '../data/schemes';

interface FAQItem {
  q: string;
  a: string;
}

interface LanguageContextType {
  language: string;
  setLanguage: (code: string) => void;
  currentLanguage: LanguageOption;
  languages: LanguageOption[];
  isRTL: boolean;
  t: (key: TranslationKey, fallback?: string) => string;
  getLocalizedScheme: (scheme: Scheme) => Scheme;
  getLocalizedSchemes: (schemes: Scheme[]) => Scheme[];
  getLocalizedFAQs: () => FAQItem[];
  getLocalizedPartners: (customPartners?: Partner[]) => Partner[];
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const STORAGE_KEY = 'sahaya_ui_language';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED_LANGUAGES.some(l => l.code === saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'en';
  });

  const isRTL = language === 'ur' || language === 'ks';

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRTL]);

  const setLanguage = (code: string) => {
    if (SUPPORTED_LANGUAGES.some(l => l.code === code)) {
      setLanguageState(code);
      try {
        localStorage.setItem(STORAGE_KEY, code);
      } catch {
        // ignore
      }
    }
  };

  const currentLanguage =
    SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  const t = (key: TranslationKey, fallback?: string): string => {
    const langDict = (translations as Record<string, Record<string, string>>)[language];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    const defaultDict = translations.en as Record<string, string>;
    if (defaultDict && defaultDict[key]) {
      return defaultDict[key];
    }
    return fallback || (key as string);
  };

  const getLocalizedScheme = (scheme: Scheme): Scheme => {
    return getLocalizedSchemeData(scheme, language);
  };

  const getLocalizedSchemes = (schemesList: Scheme[]): Scheme[] => {
    return schemesList.map(s => getLocalizedSchemeData(s, language));
  };

  const getLocalizedFAQs = (): FAQItem[] => {
    return getLocalizedFAQsData(language);
  };

  const getLocalizedPartners = (customPartners?: Partner[]): Partner[] => {
    return getLocalizedPartnersData(customPartners || partners, language);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        currentLanguage,
        languages: SUPPORTED_LANGUAGES,
        isRTL,
        t,
        getLocalizedScheme,
        getLocalizedSchemes,
        getLocalizedFAQs,
        getLocalizedPartners,
      }}
    >
      <div dir={isRTL ? 'rtl' : 'ltr'} className={`w-full min-h-full ${isRTL ? 'rtl-layout' : 'ltr-layout'}`}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
