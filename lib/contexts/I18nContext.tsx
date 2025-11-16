'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Language } from '@/lib/utils/i18n';
import { getCurrentLanguage, setLanguage } from '@/lib/utils/i18n';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

/**
 * I18n provider for the application
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('th');
  const [isReady, setIsReady] = useState(false);

  // Initialize language on client
  useEffect(() => {
    const lang = getCurrentLanguage();
    setLanguageState(lang);
    setIsReady(true);
  }, []);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    const newLang = language === 'th' ? 'en' : 'th';
    changeLanguage(newLang);
  };

  if (!isReady) {
    return <>{children}</>;
  }

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage: changeLanguage,
        toggleLanguage,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

/**
 * Hook for accessing i18n context
 */
export function useI18nContext() {
  const context = useContext(I18nContext);

  if (context === undefined) {
    throw new Error('useI18nContext must be used within I18nProvider');
  }

  return context;
}
