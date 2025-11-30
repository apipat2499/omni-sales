'use client';

import { useState } from 'react';
import { Search, X, Sparkles } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  fuzzy?: boolean;
  onFuzzyToggle?: (enabled: boolean) => void;
  className?: string;
  resultsCount?: number;
  totalCount?: number;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  fuzzy = true,
  onFuzzyToggle,
  className = '',
  resultsCount,
  totalCount,
}: SearchInputProps) {
  const [isFuzzyEnabled, setIsFuzzyEnabled] = useState(fuzzy);

  const handleClear = () => {
    onChange('');
  };

  const handleFuzzyToggle = () => {
    const newValue = !isFuzzyEnabled;
    setIsFuzzyEnabled(newValue);
    onFuzzyToggle?.(newValue);
  };

  const showResults = resultsCount !== undefined && totalCount !== undefined && value.trim();

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-24 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        />

        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {/* Fuzzy Search Toggle */}
          {onFuzzyToggle && (
            <button
              onClick={handleFuzzyToggle}
              title={isFuzzyEnabled ? 'Fuzzy search enabled' : 'Fuzzy search disabled'}
              className={`p-1.5 rounded transition-colors ${
                isFuzzyEnabled
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <Sparkles className="h-4 w-4" />
            </button>
          )}

          {/* Clear Button */}
          {value && (
            <button
              onClick={handleClear}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
      {showResults && (
        <div className="mt-1.5 text-sm text-gray-600 dark:text-gray-400">
          {resultsCount === totalCount ? (
            <span>Showing all {totalCount} results</span>
          ) : (
            <span>
              Showing {resultsCount} of {totalCount} results
              {isFuzzyEnabled && <span className="text-blue-600 dark:text-blue-400 ml-1">(fuzzy)</span>}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
