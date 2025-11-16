import { useEffect, useState } from "react";

const SUPPORTED_LANGUAGES = ["en", "th", "zh", "vi", "id", "es", "fr", "de", "ja", "ko"];
const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  th: "ไทย",
  zh: "中文",
  vi: "Tiếng Việt",
  id: "Bahasa Indonesia",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  ja: "日本語",
  ko: "한국어",
};

export function useLanguage() {
  const [language, setLanguage] = useState<string>("en");
  const [loading, setLoading] = useState(true);

  // Initialize language from localStorage or browser preference
  useEffect(() => {
    const savedLanguage = localStorage.getItem("preferred-language");
    if (savedLanguage && SUPPORTED_LANGUAGES.includes(savedLanguage)) {
      setLanguage(savedLanguage);
    } else {
      const browserLang = navigator.language.split("-")[0];
      const detectedLang = SUPPORTED_LANGUAGES.includes(browserLang)
        ? browserLang
        : "en";
      setLanguage(detectedLang);
      localStorage.setItem("preferred-language", detectedLang);
    }
    setLoading(false);
  }, []);

  const changeLanguage = (newLanguage: string) => {
    if (SUPPORTED_LANGUAGES.includes(newLanguage)) {
      setLanguage(newLanguage);
      localStorage.setItem("preferred-language", newLanguage);

      // Update HTML lang attribute
      document.documentElement.lang = newLanguage;

      // Dispatch event for global listeners
      window.dispatchEvent(
        new CustomEvent("languagechange", { detail: { language: newLanguage } })
      );
    }
  };

  return {
    language,
    changeLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    languageNames: LANGUAGE_NAMES,
    loading,
  };
}

// Translation helper
export function useTranslation(namespace: string = "common") {
  const { language } = useLanguage();
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const response = await fetch(`/locales/${language}/${namespace}.json`);
        const data = await response.json();
        setTranslations(data);
      } catch (error) {
        console.error(`Failed to load translations for ${language}/${namespace}:`, error);
        // Fallback to English
        if (language !== "en") {
          try {
            const fallbackResponse = await fetch(`/locales/en/${namespace}.json`);
            const fallbackData = await fallbackResponse.json();
            setTranslations(fallbackData);
          } catch (fallbackError) {
            console.error("Failed to load fallback translations:", fallbackError);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();
  }, [language, namespace]);

  const t = (key: string, defaultValue: string = key): string => {
    return translations[key] || defaultValue;
  };

  return { t, language, isLoading };
}

export default useLanguage;
