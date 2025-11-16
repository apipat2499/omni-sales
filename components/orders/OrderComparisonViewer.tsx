'use client';

import { useState } from 'react';
import { Download, Plus, X, ChevronDown, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react';
import { useOrderComparison } from '@/lib/hooks/useOrderComparison';
import { useI18n } from '@/lib/hooks/useI18n';
import type { OrderItem } from '@/types';

interface OrderComparisonViewerProps {
  onOrderSelect?: (order: OrderItem[], index: number) => void;
  showAddButton?: boolean;
  className?: string;
}

export default function OrderComparisonViewer({
  onOrderSelect,
  showAddButton = true,
  className = '',
}: OrderComparisonViewerProps) {
  const i18n = useI18n();
  const {
    selectedOrders,
    currentComparison,
    isLoading,
    error,
    addOrderToComparison,
    removeOrderFromComparison,
    clearOrders,
    performComparison,
    downloadComparison,
    clearError,
  } = useOrderComparison();

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    summary: true,
    differences: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (selectedOrders.length === 0) {
    return (
      <div className={`rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-8 text-center ${className}`}>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {i18n.t('comparison.select')}
        </p>
        {showAddButton && (
          <button
            onClick={() => onOrderSelect?.([], 0)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            {i18n.t('comparison.compare')}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-lg flex items-start justify-between">
          <div className="text-sm text-red-800 dark:text-red-300">{error}</div>
          <button
            onClick={clearError}
            className="text-red-600 dark:text-red-400 hover:text-red-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Selected Orders */}
      <div className="space-y-2">
        <h3 className="font-semibold dark:text-white">{i18n.t('orders.orders')}</h3>
        <div className="space-y-2">
          {selectedOrders.map((order, index) => (
            <div
              key={index}
              className="p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 flex items-center justify-between"
            >
              <div>
                <span className="font-medium dark:text-white">Order {index + 1}</span>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {order.length} items • ฿{order.reduce((sum, item) => sum + item.quantity * item.price, 0).toFixed(2)}
                </div>
              </div>
              <button
                onClick={() => removeOrderFromComparison(index)}
                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={performComparison}
            disabled={selectedOrders.length < 2 || isLoading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? i18n.t('common.loading') : i18n.t('comparison.compare')}
          </button>
          <button
            onClick={clearOrders}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors dark:text-white"
          >
            {i18n.t('common.cancel')}
          </button>
        </div>
      </div>

      {/* Comparison Results */}
      {currentComparison && (
        <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
          {/* Summary Section */}
          <ComparisonSection
            title={i18n.t('common.status')}
            expanded={expandedSections.summary}
            onToggle={() => toggleSection('summary')}
          >
            <ComparisonSummary comparison={currentComparison} i18n={i18n} />
          </ComparisonSection>

          {/* Differences Section */}
          {currentComparison.comparison.itemDifferences.length > 0 && (
            <ComparisonSection
              title={`${i18n.t('comparison.differences')} (${currentComparison.comparison.itemDifferences.length})`}
              expanded={expandedSections.differences}
              onToggle={() => toggleSection('differences')}
            >
              <DifferencesList
                differences={currentComparison.comparison.itemDifferences}
                i18n={i18n}
              />
            </ComparisonSection>
          )}

          {/* Export Button */}
          <div className="flex gap-2">
            <button
              onClick={() => downloadComparison('text')}
              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <Download className="h-4 w-4" />
              {i18n.t('common.export')} (TXT)
            </button>
            <button
              onClick={() => downloadComparison('json')}
              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <Download className="h-4 w-4" />
              {i18n.t('common.export')} (JSON)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Comparison summary component
 */
function ComparisonSummary({ comparison, i18n }: { comparison: any; i18n: any }) {
  const summary = comparison;

  return (
    <div className="space-y-2 text-sm">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
          <div className="text-xs text-gray-600 dark:text-gray-400">Similarity</div>
          <div className="text-lg font-bold text-blue-600 dark:text-blue-300">
            {summary.comparison.similarity}%
          </div>
        </div>

        <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded">
          <div className="text-xs text-gray-600 dark:text-gray-400">Difference</div>
          <div className="text-lg font-bold text-red-600 dark:text-red-300">
            ฿{summary.comparison.totalDifference.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-center">
          <div className="text-gray-600 dark:text-gray-400">Common</div>
          <div className="font-semibold dark:text-white">{summary.comparison.commonItems.length}</div>
        </div>

        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-center">
          <div className="text-gray-600 dark:text-gray-400">Only A</div>
          <div className="font-semibold dark:text-white">{summary.comparison.uniqueToA.length}</div>
        </div>

        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-center">
          <div className="text-gray-600 dark:text-gray-400">Only B</div>
          <div className="font-semibold dark:text-white">{summary.comparison.uniqueToB.length}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Differences list component
 */
function DifferencesList({ differences, i18n }: { differences: any[]; i18n: any }) {
  return (
    <div className="space-y-2">
      {differences.map((diff, idx) => (
        <div key={idx} className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
          <div className="font-medium dark:text-white flex items-center gap-2">
            {diff.productName}
            {diff.quantityDifference > 0 && (
              <TrendingUp className="h-3 w-3 text-green-600" />
            )}
            {diff.quantityDifference < 0 && (
              <TrendingDown className="h-3 w-3 text-red-600" />
            )}
          </div>

          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 mt-1">
            {diff.quantityDifference !== 0 && (
              <div>
                Qty: {diff.quantityDifference > 0 ? '+' : ''}{diff.quantityDifference}
              </div>
            )}
            {diff.priceDifference !== 0 && (
              <div>
                Price: {diff.priceDifference > 0 ? '+' : ''}฿{diff.priceDifference.toFixed(2)}
              </div>
            )}
            {diff.discountDifference !== 0 && (
              <div>
                Discount: {diff.discountDifference > 0 ? '+' : ''}฿{diff.discountDifference.toFixed(2)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Collapsible section component
 */
function ComparisonSection({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-between"
      >
        <span className="font-medium dark:text-white">{title}</span>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {expanded && <div className="p-3">{children}</div>}
    </div>
  );
}
