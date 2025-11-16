/**
 * SearchExample Component
 *
 * Example usage of the Advanced Search System
 * Demonstrates integration of SearchBar, SearchResults, and useSearchEngine
 */

'use client';

import React, { useState } from 'react';
import { SearchBar } from './SearchBar';
import { SearchResults } from './SearchResults';
import { useSearchEngine } from '@/lib/hooks/useSearchEngine';
import { useI18n } from '@/lib/hooks/useI18n';
import type { OrderItem, Product, Order } from '@/types';
import type { OrderTemplate } from '@/lib/utils/order-templates';
import type { SearchResult, SearchScope } from '@/lib/utils/search-engine';

// ============================================
// TYPES
// ============================================

interface SearchExampleProps {
  items?: OrderItem[];
  products?: Product[];
  orders?: Order[];
  templates?: OrderTemplate[];
}

// ============================================
// COMPONENT
// ============================================

export function SearchExample({
  items = [],
  products = [],
  orders = [],
  templates = [],
}: SearchExampleProps) {
  const { t } = useI18n();

  // State
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Use search engine hook
  const {
    query,
    scope,
    results,
    isSearching,
    filters,
    setQuery,
    setScope,
    search,
    clearResults,
    addFilter,
    removeFilter,
    clearFilters,
    saveSearch,
    loadSavedSearch,
    deleteSavedSearch,
    getSavedSearches,
    getSearchHistory,
    clearHistory,
    getResultCount,
    getResultsByType,
    getStatistics,
  } = useSearchEngine(
    {
      items,
      products,
      orders,
      templates,
    },
    {
      autoSearch: false,
      debounceMs: 300,
      cacheResults: true,
      trackHistory: true,
    }
  );

  // Get saved searches and history
  const savedSearches = getSavedSearches();
  const searchHistory = getSearchHistory();
  const statistics = getStatistics();

  // Handle search
  const handleSearch = (searchQuery: string, searchScope?: SearchScope) => {
    search(searchQuery, searchScope);
  };

  // Handle result click
  const handleResultClick = (result: SearchResult<any>) => {
    console.log('Result clicked:', result);
    // You can navigate to the entity details page here
  };

  // Handle result action
  const handleResultAction = (result: SearchResult<any>, action: string) => {
    if (action === 'view') {
      console.log('View result:', result);
      // Navigate to details page
    } else if (action === 'copy') {
      // Copy entity ID to clipboard
      const id = result.entity.id;
      if (id) {
        navigator.clipboard.writeText(id);
        console.log('Copied ID:', id);
      }
    }
  };

  // Handle save search
  const handleSaveSearch = () => {
    const name = prompt(t('search.saveName'));
    if (name) {
      saveSearch(name, []);
      alert(t('messages.savingSuccess'));
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('search.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('search.emptyState.description')}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {t('search.history')}
          </button>
          <button
            onClick={() => setShowSavedSearches(!showSavedSearches)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {t('search.savedSearches')} ({savedSearches.length})
          </button>
          {query && results.length > 0 && (
            <button
              onClick={handleSaveSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {t('search.saveSearch')}
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <SearchBar
        value={query}
        onChange={setQuery}
        onSearch={handleSearch}
        scope={scope}
        onScopeChange={setScope}
        showQuickFilters={true}
        showSuggestions={true}
        savedSearches={savedSearches}
        searchHistory={searchHistory}
        onLoadSavedSearch={loadSavedSearch}
      />

      {/* Statistics */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t('common.total')}
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {getResultCount()}
            </p>
          </div>
          {Object.entries(getResultsByType()).map(([type, count]) => (
            <div
              key={type}
              className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t(`search.types.${type}`)}
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {count}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Saved Searches Panel */}
      {showSavedSearches && savedSearches.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('search.savedSearches')}
            </h2>
            <button
              onClick={() => setShowSavedSearches(false)}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-2">
            {savedSearches.map((savedSearch) => (
              <div
                key={savedSearch.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">
                    {savedSearch.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {savedSearch.query}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {t('search.saved')}: {savedSearch.useCount} {t('search.popular')}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => loadSavedSearch(savedSearch.id)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    {t('search.loadSearch')}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(t('messages.confirmDelete'))) {
                        deleteSavedSearch(savedSearch.id);
                      }
                    }}
                    className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  >
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search History Panel */}
      {showHistory && searchHistory.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('search.history')}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={clearHistory}
                className="text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                {t('bulk.clearHistory')}
              </button>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {searchHistory.slice(0, 10).map((entry) => (
              <button
                key={entry.id}
                onClick={() => {
                  setQuery(entry.query);
                  setScope(entry.scope);
                  search(entry.query, entry.scope);
                }}
                className="w-full text-left p-3 bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {entry.query}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {entry.resultCount} {t('search.noResults.title').split(' ')[0]}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-500 ml-4">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      <SearchResults
        results={results}
        isSearching={isSearching}
        query={query}
        filters={filters}
        onRemoveFilter={removeFilter}
        onClearFilters={clearFilters}
        onResultClick={handleResultClick}
        onResultAction={handleResultAction}
        groupByType={true}
        showScore={true}
        itemsPerPage={20}
      />

      {/* Search Statistics (Hidden by default) */}
      {/* Uncomment to show statistics
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Searches</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {statistics.totalSearches}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Results</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {statistics.averageResultCount.toFixed(1)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Saved Searches</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {statistics.savedSearchCount}
            </p>
          </div>
        </div>
      </div>
      */}
    </div>
  );
}
