/**
 * SearchBar Component
 *
 * Advanced search input with:
 * - Autocomplete suggestions
 * - Quick filters dropdown
 * - Search modifiers help
 * - Recent/saved search suggestions
 * - Mobile-responsive design
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from '@/lib/hooks/useI18n';
import type { SearchScope } from '@/lib/utils/search-engine';
import type { SavedSearch, SearchHistoryEntry } from '@/lib/hooks/useSearchEngine';

// ============================================
// TYPES
// ============================================

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string, scope?: SearchScope) => void;
  scope: SearchScope;
  onScopeChange: (scope: SearchScope) => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  showQuickFilters?: boolean;
  showSuggestions?: boolean;
  savedSearches?: SavedSearch[];
  searchHistory?: SearchHistoryEntry[];
  onLoadSavedSearch?: (searchId: string) => void;
}

interface Suggestion {
  type: 'saved' | 'history' | 'modifier' | 'popular';
  label: string;
  value: string;
  description?: string;
  icon?: string;
}

const SEARCH_SCOPES: Array<{ value: SearchScope; label: string }> = [
  { value: 'all', label: 'search.scope.all' },
  { value: 'items', label: 'search.scope.items' },
  { value: 'products', label: 'search.scope.products' },
  { value: 'orders', label: 'search.scope.orders' },
  { value: 'templates', label: 'search.scope.templates' },
];

const POPULAR_TERMS = [
  'status:completed',
  'quantity:>100',
  'price:<1000',
  'tag:urgent',
  'date:today',
];

const SEARCH_MODIFIERS = [
  { syntax: 'name:product', description: 'Search only product name' },
  { syntax: 'quantity:>100', description: 'Quantity greater than 100' },
  { syntax: 'price:<1000', description: 'Price less than 1000' },
  { syntax: 'status:completed', description: 'Status equals completed' },
  { syntax: 'tag:bulk', description: 'Items with bulk tag' },
  { syntax: 'date:2024-11-16', description: 'Exact date' },
  { syntax: 'date:>2024-11-01', description: 'Date after' },
  { syntax: '"exact phrase"', description: 'Exact phrase matching' },
  { syntax: 'AND / OR / NOT', description: 'Logical operators' },
  { syntax: '-term', description: 'Exclude term' },
  { syntax: '*', description: 'Wildcard matching' },
];

// ============================================
// COMPONENT
// ============================================

export function SearchBar({
  value,
  onChange,
  onSearch,
  scope,
  onScopeChange,
  placeholder,
  disabled = false,
  autoFocus = false,
  showQuickFilters = true,
  showSuggestions = true,
  savedSearches = [],
  searchHistory = [],
  onLoadSavedSearch,
}: SearchBarProps) {
  const { t } = useI18n();

  // State
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false);
  const [showModifiersHelp, setShowModifiersHelp] = useState(false);
  const [showScopeDropdown, setShowScopeDropdown] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const modifiersRef = useRef<HTMLDivElement>(null);
  const scopeRef = useRef<HTMLDivElement>(null);

  // Auto-focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Generate suggestions based on input
  useEffect(() => {
    if (!showSuggestions || !value) {
      setSuggestions([]);
      return;
    }

    const newSuggestions: Suggestion[] = [];
    const lowerValue = value.toLowerCase();

    // Add saved searches
    savedSearches
      .filter((s) => s.query.toLowerCase().includes(lowerValue))
      .slice(0, 3)
      .forEach((s) => {
        newSuggestions.push({
          type: 'saved',
          label: s.name,
          value: s.query,
          description: `${s.useCount} uses`,
          icon: '⭐',
        });
      });

    // Add recent searches
    searchHistory
      .filter((h) => h.query.toLowerCase().includes(lowerValue))
      .slice(0, 3)
      .forEach((h) => {
        newSuggestions.push({
          type: 'history',
          label: h.query,
          value: h.query,
          description: `${h.resultCount} results`,
          icon: '🕐',
        });
      });

    // Add popular terms
    POPULAR_TERMS
      .filter((term) => term.toLowerCase().includes(lowerValue))
      .slice(0, 3)
      .forEach((term) => {
        newSuggestions.push({
          type: 'popular',
          label: term,
          value: term,
          description: 'Popular search',
          icon: '🔥',
        });
      });

    setSuggestions(newSuggestions);
  }, [value, savedSearches, searchHistory, showSuggestions]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestionsDropdown(false);
      }

      if (
        modifiersRef.current &&
        !modifiersRef.current.contains(event.target as Node)
      ) {
        setShowModifiersHelp(false);
      }

      if (
        scopeRef.current &&
        !scopeRef.current.contains(event.target as Node)
      ) {
        setShowScopeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setShowSuggestionsDropdown(true);
    setSelectedSuggestionIndex(-1);
  };

  // Handle input focus
  const handleFocus = () => {
    setIsFocused(true);
    if (suggestions.length > 0) {
      setShowSuggestionsDropdown(true);
    }
  };

  // Handle input blur
  const handleBlur = () => {
    setIsFocused(false);
    // Delay to allow click events on suggestions
    setTimeout(() => {
      setShowSuggestionsDropdown(false);
    }, 200);
  };

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < suggestions.length) {
        const suggestion = suggestions[selectedSuggestionIndex];
        handleSelectSuggestion(suggestion);
      } else {
        onSearch(value, scope);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Escape') {
      setShowSuggestionsDropdown(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: Suggestion) => {
    onChange(suggestion.value);
    setShowSuggestionsDropdown(false);
    setSelectedSuggestionIndex(-1);

    // If it's a saved search, load it
    if (suggestion.type === 'saved' && onLoadSavedSearch) {
      const savedSearch = savedSearches.find((s) => s.query === suggestion.value);
      if (savedSearch) {
        onLoadSavedSearch(savedSearch.id);
      }
    } else {
      // Otherwise just search
      onSearch(suggestion.value, scope);
    }
  };

  // Handle search button click
  const handleSearchClick = () => {
    onSearch(value, scope);
  };

  // Handle clear
  const handleClear = () => {
    onChange('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle scope change
  const handleScopeChange = (newScope: SearchScope) => {
    onScopeChange(newScope);
    setShowScopeDropdown(false);
  };

  return (
    <div className="relative w-full">
      {/* Main Search Input Container */}
      <div
        className={`
          flex items-center bg-white dark:bg-gray-800 border rounded-lg
          transition-all duration-200
          ${isFocused ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900' : 'border-gray-300 dark:border-gray-600'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {/* Scope Selector */}
        {showQuickFilters && (
          <div className="relative" ref={scopeRef}>
            <button
              type="button"
              onClick={() => setShowScopeDropdown(!showScopeDropdown)}
              disabled={disabled}
              className="
                px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300
                hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-lg
                flex items-center gap-1 border-r border-gray-300 dark:border-gray-600
                transition-colors
              "
            >
              <span>{t(SEARCH_SCOPES.find((s) => s.value === scope)?.label || 'search.scope.all')}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Scope Dropdown */}
            {showScopeDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-[150px]">
                {SEARCH_SCOPES.map((scopeOption) => (
                  <button
                    key={scopeOption.value}
                    onClick={() => handleScopeChange(scopeOption.value)}
                    className={`
                      w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700
                      transition-colors
                      ${scope === scopeOption.value ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'}
                    `}
                  >
                    {t(scopeOption.label)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search Icon */}
        <div className="pl-3 pr-2">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder || t('search.placeholder')}
          className="
            flex-1 py-2 bg-transparent outline-none
            text-gray-900 dark:text-white placeholder-gray-400
            disabled:cursor-not-allowed
          "
        />

        {/* Clear Button */}
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="px-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Modifiers Help Button */}
        <div className="relative" ref={modifiersRef}>
          <button
            type="button"
            onClick={() => setShowModifiersHelp(!showModifiersHelp)}
            disabled={disabled}
            className="px-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            title={t('search.modifiersHelp')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>

          {/* Modifiers Help Dropdown */}
          {showModifiersHelp && (
            <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 w-80 max-h-96 overflow-y-auto">
              <div className="p-4">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">
                  {t('search.modifiers')}
                </h3>
                <div className="space-y-2">
                  {SEARCH_MODIFIERS.map((modifier, index) => (
                    <div key={index} className="text-xs">
                      <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400 rounded font-mono">
                        {modifier.syntax}
                      </code>
                      <p className="text-gray-600 dark:text-gray-400 mt-1 ml-2">
                        {modifier.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search Button */}
        <button
          type="button"
          onClick={handleSearchClick}
          disabled={disabled || !value}
          className="
            px-4 py-2 bg-blue-600 text-white rounded-r-lg
            hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600
            transition-colors font-medium text-sm
            disabled:cursor-not-allowed
          "
        >
          {t('common.search')}
        </button>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestionsDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
        >
          <div className="p-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.type}-${index}`}
                onClick={() => handleSelectSuggestion(suggestion)}
                className={`
                  w-full text-left px-3 py-2 rounded-md text-sm
                  transition-colors flex items-center gap-2
                  ${
                    index === selectedSuggestionIndex
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }
                `}
              >
                <span className="text-lg">{suggestion.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{suggestion.label}</div>
                  {suggestion.description && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {suggestion.description}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
