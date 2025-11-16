/**
 * SearchResults Component
 *
 * Displays search results with:
 * - Results grouping by entity type
 * - Result highlighting
 * - Result preview
 * - Sorting options
 * - Filter chips
 * - Pagination
 * - Empty states
 */

'use client';

import React, { useState, useMemo } from 'react';
import { useI18n } from '@/lib/hooks/useI18n';
import type { SearchResult, EntityType, SearchFilter } from '@/lib/utils/search-engine';
import type { OrderItem, Product, Order } from '@/types';
import type { OrderTemplate } from '@/lib/utils/order-templates';

// ============================================
// TYPES
// ============================================

export interface SearchResultsProps {
  results: SearchResult<any>[];
  isSearching: boolean;
  query: string;
  filters: SearchFilter[];
  onRemoveFilter?: (filterId: string) => void;
  onClearFilters?: () => void;
  onResultClick?: (result: SearchResult<any>) => void;
  onResultAction?: (result: SearchResult<any>, action: string) => void;
  groupByType?: boolean;
  showScore?: boolean;
  itemsPerPage?: number;
}

type SortOption = 'relevance' | 'name-asc' | 'name-desc' | 'date-new' | 'date-old' | 'price-asc' | 'price-desc';

interface GroupedResults {
  [key: string]: SearchResult<any>[];
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getEntityName(result: SearchResult<any>): string {
  switch (result.type) {
    case 'item':
      return (result.entity as OrderItem).productName || 'Unnamed Item';
    case 'product':
      return (result.entity as Product).name || 'Unnamed Product';
    case 'order':
      return (result.entity as Order).id || 'Unnamed Order';
    case 'template':
      return (result.entity as OrderTemplate).name || 'Unnamed Template';
    default:
      return 'Unknown';
  }
}

function getEntityDate(result: SearchResult<any>): Date | null {
  const entity = result.entity;
  if ('createdAt' in entity && entity.createdAt) {
    return new Date(entity.createdAt);
  }
  return null;
}

function getEntityPrice(result: SearchResult<any>): number | null {
  const entity = result.entity;
  if ('price' in entity && typeof entity.price === 'number') {
    return entity.price;
  }
  if ('totalPrice' in entity && typeof entity.totalPrice === 'number') {
    return entity.totalPrice;
  }
  if ('total' in entity && typeof entity.total === 'number') {
    return entity.total;
  }
  return null;
}

function getTypeLabel(type: EntityType): string {
  const labels: Record<EntityType, string> = {
    item: 'search.types.item',
    product: 'search.types.product',
    order: 'search.types.order',
    template: 'search.types.template',
  };
  return labels[type] || type;
}

function getTypeIcon(type: EntityType): string {
  const icons: Record<EntityType, string> = {
    item: '📦',
    product: '🏷️',
    order: '🛒',
    template: '📋',
  };
  return icons[type] || '📄';
}

// ============================================
// COMPONENT
// ============================================

export function SearchResults({
  results,
  isSearching,
  query,
  filters,
  onRemoveFilter,
  onClearFilters,
  onResultClick,
  onResultAction,
  groupByType = true,
  showScore = true,
  itemsPerPage = 20,
}: SearchResultsProps) {
  const { t } = useI18n();

  // State
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedGroups, setExpandedGroups] = useState<Set<EntityType>>(
    new Set(['item', 'product', 'order', 'template'])
  );

  // Sort results
  const sortedResults = useMemo(() => {
    const sorted = [...results];

    switch (sortBy) {
      case 'name-asc':
        sorted.sort((a, b) => getEntityName(a).localeCompare(getEntityName(b)));
        break;
      case 'name-desc':
        sorted.sort((a, b) => getEntityName(b).localeCompare(getEntityName(a)));
        break;
      case 'date-new':
        sorted.sort((a, b) => {
          const dateA = getEntityDate(a);
          const dateB = getEntityDate(b);
          if (!dateA || !dateB) return 0;
          return dateB.getTime() - dateA.getTime();
        });
        break;
      case 'date-old':
        sorted.sort((a, b) => {
          const dateA = getEntityDate(a);
          const dateB = getEntityDate(b);
          if (!dateA || !dateB) return 0;
          return dateA.getTime() - dateB.getTime();
        });
        break;
      case 'price-asc':
        sorted.sort((a, b) => {
          const priceA = getEntityPrice(a) || 0;
          const priceB = getEntityPrice(b) || 0;
          return priceA - priceB;
        });
        break;
      case 'price-desc':
        sorted.sort((a, b) => {
          const priceA = getEntityPrice(a) || 0;
          const priceB = getEntityPrice(b) || 0;
          return priceB - priceA;
        });
        break;
      case 'relevance':
      default:
        // Already sorted by relevance from search engine
        break;
    }

    return sorted;
  }, [results, sortBy]);

  // Group results by type
  const groupedResults = useMemo(() => {
    if (!groupByType) return { all: sortedResults };

    const grouped: GroupedResults = {
      item: [],
      product: [],
      order: [],
      template: [],
    };

    sortedResults.forEach((result) => {
      grouped[result.type]?.push(result);
    });

    return grouped;
  }, [sortedResults, groupByType]);

  // Pagination
  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedResults.slice(startIndex, endIndex);
  }, [sortedResults, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedResults.length / itemsPerPage);

  // Toggle group expansion
  const toggleGroup = (type: EntityType) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Render loading state
  if (isSearching) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('search.searching')}</p>
        </div>
      </div>
    );
  }

  // Render empty state
  if (!query && results.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="w-16 h-16 mx-auto text-gray-400 mb-4"
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
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {t('search.emptyState.title')}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {t('search.emptyState.description')}
        </p>
      </div>
    );
  }

  // Render no results
  if (query && results.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="w-16 h-16 mx-auto text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {t('search.noResults.title', { query })}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {t('search.noResults.suggestion')}
        </p>
        {filters.length > 0 && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {t('search.clearFilters')}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with result count and sorting */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('search.resultCount', {
              count: results.length,
              start: (currentPage - 1) * itemsPerPage + 1,
              end: Math.min(currentPage * itemsPerPage, results.length),
            })}
          </p>
        </div>

        {/* Sort dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">
            {t('search.sortBy')}:
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
          >
            <option value="relevance">{t('search.sort.relevance')}</option>
            <option value="name-asc">{t('search.sort.nameAsc')}</option>
            <option value="name-desc">{t('search.sort.nameDesc')}</option>
            <option value="date-new">{t('search.sort.dateNew')}</option>
            <option value="date-old">{t('search.sort.dateOld')}</option>
            <option value="price-asc">{t('search.sort.priceAsc')}</option>
            <option value="price-desc">{t('search.sort.priceDesc')}</option>
          </select>
        </div>
      </div>

      {/* Active filters */}
      {filters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {t('search.activeFilters')}:
          </span>
          {filters.map((filter) => (
            <div
              key={filter.id}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm"
            >
              <span>
                {filter.field} {filter.operator} {filter.value}
              </span>
              {onRemoveFilter && (
                <button
                  onClick={() => onRemoveFilter(filter.id)}
                  className="hover:text-blue-900 dark:hover:text-blue-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          {onClearFilters && (
            <button
              onClick={onClearFilters}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white underline"
            >
              {t('search.clearAll')}
            </button>
          )}
        </div>
      )}

      {/* Results */}
      {groupByType ? (
        // Grouped view
        <div className="space-y-6">
          {Object.entries(groupedResults).map(([type, typeResults]) => {
            if (typeResults.length === 0) return null;

            const entityType = type as EntityType;
            const isExpanded = expandedGroups.has(entityType);

            return (
              <div key={type} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(entityType)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getTypeIcon(entityType)}</span>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t(getTypeLabel(entityType))}
                    </h3>
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium">
                      {typeResults.length}
                    </span>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Group results */}
                {isExpanded && (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {typeResults.map((result, index) => (
                      <ResultCard
                        key={`${result.type}-${index}`}
                        result={result}
                        showScore={showScore}
                        onClick={onResultClick}
                        onAction={onResultAction}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        // Flat list view
        <div className="divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
          {paginatedResults.map((result, index) => (
            <ResultCard
              key={`${result.type}-${index}`}
              result={result}
              showScore={showScore}
              onClick={onResultClick}
              onAction={onResultAction}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {t('common.previous')}
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-2 border rounded-md transition-colors ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {t('common.next')}
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================
// RESULT CARD COMPONENT
// ============================================

interface ResultCardProps {
  result: SearchResult<any>;
  showScore: boolean;
  onClick?: (result: SearchResult<any>) => void;
  onAction?: (result: SearchResult<any>, action: string) => void;
}

function ResultCard({ result, showScore, onClick, onAction }: ResultCardProps) {
  const { t, formatCurrency, formatDate } = useI18n();

  const name = getEntityName(result);
  const date = getEntityDate(result);
  const price = getEntityPrice(result);

  // Extract preview data based on type
  const getPreviewData = () => {
    switch (result.type) {
      case 'item': {
        const item = result.entity as OrderItem;
        return {
          quantity: item.quantity,
          price: item.price,
          discount: item.discount,
        };
      }
      case 'product': {
        const product = result.entity as Product;
        return {
          sku: product.sku,
          stock: product.stock,
          category: product.category,
        };
      }
      case 'order': {
        const order = result.entity as Order;
        return {
          status: order.status,
          total: order.total,
          itemCount: order.items?.length,
        };
      }
      case 'template': {
        const template = result.entity as OrderTemplate;
        return {
          itemCount: template.itemCount,
          tags: template.tags,
        };
      }
      default:
        return {};
    }
  };

  const previewData = getPreviewData();

  return (
    <div
      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={() => onClick?.(result)}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{getTypeIcon(result.type)}</span>
            <h4 className="font-medium text-gray-900 dark:text-white truncate">
              {name}
            </h4>
            {showScore && (
              <span className="flex-shrink-0 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded text-xs font-medium">
                {result.score}%
              </span>
            )}
          </div>

          {/* Matched fields */}
          {result.matchedFields.length > 0 && (
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {t('search.matchedFields')}:
              </span>
              {result.matchedFields.map((field) => (
                <span
                  key={field}
                  className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                >
                  {field}
                </span>
              ))}
            </div>
          )}

          {/* Highlights */}
          {Object.keys(result.highlights).length > 0 && (
            <div className="mb-2 space-y-1">
              {Object.entries(result.highlights).slice(0, 2).map(([field, highlight]) => (
                <div key={field} className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">{field}:</span>{' '}
                  <span dangerouslySetInnerHTML={{ __html: highlight }} />
                </div>
              ))}
            </div>
          )}

          {/* Preview data */}
          <div className="flex items-center gap-4 flex-wrap text-sm text-gray-600 dark:text-gray-400">
            {Object.entries(previewData).map(([key, value]) => (
              <div key={key}>
                <span className="font-medium capitalize">{key}:</span>{' '}
                {Array.isArray(value) ? value.join(', ') : value}
              </div>
            ))}
            {date && (
              <div>
                <span className="font-medium">{t('common.date')}:</span>{' '}
                {formatDate(date)}
              </div>
            )}
            {price !== null && (
              <div>
                <span className="font-medium">{t('common.price')}:</span>{' '}
                {formatCurrency(price)}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {onAction && (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction(result, 'view');
              }}
              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
              title={t('common.view')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction(result, 'copy');
              }}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              title={t('search.copyId')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
