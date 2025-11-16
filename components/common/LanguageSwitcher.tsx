'use client';

import { Globe } from 'lucide-react';
import { useLanguageSwitcher } from '@/lib/hooks/useI18n';
import type { Language } from '@/lib/utils/i18n';

interface LanguageSwitcherProps {
  showLabel?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * Language switcher component
 */
export default function LanguageSwitcher({
  showLabel = false,
  compact = true,
  className = '',
}: LanguageSwitcherProps) {
  const { currentLanguage, availableLanguages, changeLanguage } = useLanguageSwitcher();

  if (compact && availableLanguages.length > 0) {
    // Compact toggle button for 2 languages
    const otherLang = availableLanguages.find((l) => l.code !== currentLanguage);

    return (
      <button
        onClick={() => changeLanguage(otherLang?.code || 'th')}
        title={`Switch to ${otherLang?.name || 'Thai'}`}
        className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${className}`}
      >
        <Globe className="h-4 w-4" />
        <span className="font-medium text-sm">{currentLanguage.toUpperCase()}</span>
      </button>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {showLabel && <span className="text-sm font-medium dark:text-white">Language:</span>}
      <div className="flex gap-2">
        {availableLanguages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentLanguage === lang.code
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {lang.name}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Minimal language indicator
 */
export function LanguageIndicator() {
  const { currentLanguage } = useLanguageSwitcher();

  return (
    <div className="text-xs font-semibold px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
      {currentLanguage === 'th' ? '🇹🇭 TH' : '🇺🇸 EN'}
    </div>
  );
}

/**
 * Language selector dropdown
 */
export function LanguageDropdown() {
  const { currentLanguage, availableLanguages, changeLanguage } = useLanguageSwitcher();

  return (
    <select
      value={currentLanguage}
      onChange={(e) => changeLanguage(e.target.value as Language)}
      className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm font-medium cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
    >
      {availableLanguages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.name}
        </option>
      ))}
    </select>
  );
}
