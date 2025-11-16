import { useState, useCallback, useEffect } from 'react';
import {
  t,
  tp,
  getCurrentLanguage,
  setLanguage,
  formatDate,
  formatDateTime,
  formatTime,
  formatNumber,
  formatCurrency,
  getCurrencySymbol,
  getAvailableLanguages,
  isRTL,
  type Language,
} from '@/lib/utils/i18n';

/**
 * Hook for using internationalization in React components
 */
export function useI18n() {
  const [language, setLanguageState] = useState<Language>(() => getCurrentLanguage());

  useEffect(() => {
    // Sync state with localStorage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'language' && (e.newValue === 'th' || e.newValue === 'en')) {
        setLanguageState(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const changeLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
    setLanguageState(lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    const newLang = language === 'th' ? 'en' : 'th';
    changeLanguage(newLang);
  }, [language, changeLanguage]);

  const translate = useCallback(
    (key: string): string => {
      return t(key, language);
    },
    [language]
  );

  const translatePlural = useCallback(
    (key: string, count: number): string => {
      return tp(key, count, language);
    },
    [language]
  );

  const date = useCallback(
    (date: Date, format: 'short' | 'long' = 'short'): string => {
      return formatDate(date, format, language);
    },
    [language]
  );

  const datetime = useCallback(
    (date: Date): string => {
      return formatDateTime(date, language);
    },
    [language]
  );

  const time = useCallback(
    (date: Date): string => {
      return formatTime(date, language);
    },
    [language]
  );

  const number = useCallback(
    (num: number): string => {
      return formatNumber(num, language);
    },
    [language]
  );

  const currency = useCallback(
    (amount: number): string => {
      return formatCurrency(amount, language);
    },
    [language]
  );

  const currencySymbol = getCurrencySymbol(language);
  const availableLanguages = getAvailableLanguages();
  const isRightToLeft = isRTL(language);

  return {
    // Current language
    language,

    // Translation functions
    t: translate,
    tp: translatePlural,

    // Formatting functions
    date,
    datetime,
    time,
    number,
    currency,

    // Language management
    changeLanguage,
    toggleLanguage,

    // Utilities
    currencySymbol,
    availableLanguages,
    isRightToLeft,
  };
}

/**
 * Hook for getting specific translation keys
 * Useful for destructuring commonly used translations
 */
export function useTranslations() {
  const i18n = useI18n();

  return {
    // Common
    save: i18n.t('common.save'),
    cancel: i18n.t('common.cancel'),
    delete: i18n.t('common.delete'),
    edit: i18n.t('common.edit'),
    add: i18n.t('common.add'),
    search: i18n.t('common.search'),
    close: i18n.t('common.close'),
    back: i18n.t('common.back'),
    loading: i18n.t('common.loading'),
    error: i18n.t('common.error'),
    success: i18n.t('common.success'),

    // Orders
    orders: i18n.t('orders.title'),
    newOrder: i18n.t('orders.newOrder'),
    addItem: i18n.t('orders.addItem'),
    itemName: i18n.t('orders.itemName'),
    price: i18n.t('common.price'),
    quantity: i18n.t('common.quantity'),
    discount: i18n.t('common.discount'),
    orderTotal: i18n.t('orders.orderTotal'),

    // Messages
    confirmDelete: i18n.t('messages.confirmDelete'),
    deleteSuccess: i18n.t('messages.deleteSuccess'),
    noResults: i18n.t('messages.noResults'),

    // Utilities
    i18n,
  };
}

/**
 * Hook for formatting data consistently
 */
export function useFormatter() {
  const i18n = useI18n();

  return {
    date: i18n.date,
    datetime: i18n.datetime,
    time: i18n.time,
    number: i18n.number,
    currency: i18n.currency,
  };
}

/**
 * Hook for language switcher
 */
export function useLanguageSwitcher() {
  const i18n = useI18n();

  return {
    currentLanguage: i18n.language,
    availableLanguages: i18n.availableLanguages,
    changeLanguage: i18n.changeLanguage,
    toggleLanguage: i18n.toggleLanguage,
  };
}
