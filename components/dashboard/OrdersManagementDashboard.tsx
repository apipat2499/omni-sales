'use client';

/**
 * Comprehensive Order Management Dashboard
 * Integrates all order management features including filtering, bulk operations,
 * templates, stock management, analytics, reporting, and keyboard shortcuts
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Filter,
  Package,
  TrendingUp,
  FileText,
  Keyboard,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Download,
  X,
  AlertTriangle,
  CheckCircle,
  ShoppingCart,
  DollarSign,
  Archive,
  Star,
  Grid,
  List,
} from 'lucide-react';
import type { OrderItem } from '@/types';
import { useI18n } from '@/lib/hooks/useI18n';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { useStockManagement } from '@/lib/hooks/useStockManagement';
import { useOrderTemplates } from '@/lib/hooks/useOrderTemplates';
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts';
import AdvancedFilterPanel from '@/components/filters/AdvancedFilterPanel';
import BulkOperationPanel from '@/components/bulk/BulkOperationPanel';
import ReportGenerator from '@/components/reporting/ReportGenerator';

interface OrdersManagementDashboardProps {
  orderId?: string;
  initialItems?: OrderItem[];
  onItemsChange?: (items: OrderItem[]) => void;
  className?: string;
}

type SortField = 'productName' | 'quantity' | 'price' | 'discount' | 'totalPrice';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

export default function OrdersManagementDashboard({
  orderId = 'default-order',
  initialItems = [],
  onItemsChange,
  className = '',
}: OrdersManagementDashboardProps) {
  const i18n = useI18n();

  // State management
  const [items, setItems] = useState<OrderItem[]>(initialItems);
  const [filteredItems, setFilteredItems] = useState<OrderItem[]>(initialItems);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('productName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [activeTab, setActiveTab] = useState<
    'overview' | 'filter' | 'bulk' | 'templates' | 'analytics' | 'reports'
  >('overview');
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showBulkPanel, setShowBulkPanel] = useState(false);

  // Hooks
  const analytics = useAnalytics(
    items.map((item) => ({
      items: [item],
      date: new Date(),
    }))
  );

  const { alerts, lowStockProducts, outOfStockProducts } = useStockManagement();
  const { templates, getStats: getTemplateStats } = useOrderTemplates();
  const shortcuts = useKeyboardShortcuts();

  // Update items when initialItems change
  useEffect(() => {
    setItems(initialItems);
    setFilteredItems(initialItems);
  }, [initialItems]);

  // Notify parent of changes
  useEffect(() => {
    onItemsChange?.(items);
  }, [items, onItemsChange]);

  /**
   * Handle filter changes from AdvancedFilterPanel
   */
  const handleFilteredItemsChange = useCallback((newFilteredItems: OrderItem[]) => {
    setFilteredItems(newFilteredItems);
    setCurrentPage(1); // Reset to first page
  }, []);

  /**
   * Search and filter items
   */
  const searchedItems = useMemo(() => {
    if (!searchQuery.trim()) return filteredItems;

    const query = searchQuery.toLowerCase();
    return filteredItems.filter(
      (item) =>
        item.productName.toLowerCase().includes(query) ||
        item.productId.toLowerCase().includes(query)
    );
  }, [filteredItems, searchQuery]);

  /**
   * Sort items
   */
  const sortedItems = useMemo(() => {
    const sorted = [...searchedItems];
    sorted.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      // Handle totalPrice calculation
      if (sortField === 'totalPrice') {
        aVal = (a.price * a.quantity) - (a.discount || 0);
        bVal = (b.price * b.quantity) - (b.discount || 0);
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [searchedItems, sortField, sortDirection]);

  /**
   * Paginate items
   */
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return sortedItems.slice(start, end);
  }, [sortedItems, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);

  /**
   * Calculate quick stats
   */
  const stats = useMemo(() => {
    const totalItems = items.length;
    const totalPrice = items.reduce(
      (sum, item) => sum + item.price * item.quantity - (item.discount || 0),
      0
    );
    const lowStockCount = lowStockProducts.length;
    const pendingOperations = 0; // Would come from operation queue

    return {
      totalItems,
      totalPrice,
      lowStockCount,
      pendingOperations,
    };
  }, [items, lowStockProducts]);

  /**
   * Handle sort
   */
  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDirection('asc');
      }
    },
    [sortField]
  );

  /**
   * Toggle item selection
   */
  const toggleItemSelection = useCallback((itemId: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  /**
   * Select all items
   */
  const selectAllItems = useCallback(() => {
    setSelectedItems(new Set(paginatedItems.map((item) => item.id!).filter(Boolean)));
  }, [paginatedItems]);

  /**
   * Deselect all items
   */
  const deselectAllItems = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  /**
   * Export data
   */
  const handleExport = useCallback(
    (format: 'csv' | 'json') => {
      const exportData = sortedItems.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount || 0,
        totalPrice: item.price * item.quantity - (item.discount || 0),
      }));

      let content: string;
      let mimeType: string;
      let filename: string;

      if (format === 'csv') {
        const headers = Object.keys(exportData[0] || {}).join(',');
        const rows = exportData.map((row) => Object.values(row).join(','));
        content = [headers, ...rows].join('\n');
        mimeType = 'text/csv';
        filename = `orders-${new Date().toISOString().split('T')[0]}.csv`;
      } else {
        content = JSON.stringify(exportData, null, 2);
        mimeType = 'application/json';
        filename = `orders-${new Date().toISOString().split('T')[0]}.json`;
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [sortedItems]
  );

  /**
   * Register keyboard shortcuts
   */
  useEffect(() => {
    shortcuts.registerHandler('new-item', () => {
      // Handle new item
      setActiveTab('overview');
    });

    shortcuts.registerHandler('save', () => {
      // Handle save
      onItemsChange?.(items);
    });

    shortcuts.registerHandler('search', () => {
      document.getElementById('search-input')?.focus();
    });
  }, [shortcuts, items, onItemsChange]);

  /**
   * Render recent templates
   */
  const recentTemplates = useMemo(() => {
    const stats = getTemplateStats();
    return stats.recentlyUsed.slice(0, 5);
  }, [getTemplateStats]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {i18n.t('orders.title')}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {i18n.t('orders.subtitle') || 'Manage your orders efficiently'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowShortcutsModal(true)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Keyboard shortcuts"
          >
            <Keyboard className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            <Download className="h-4 w-4" />
            {i18n.t('common.export')}
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
          label={i18n.t('common.totalItems') || 'Total Items'}
          value={stats.totalItems.toString()}
          bgColor="bg-blue-50 dark:bg-blue-900/20"
        />
        <StatCard
          icon={<DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />}
          label={i18n.t('common.totalPrice') || 'Total Price'}
          value={i18n.currency(stats.totalPrice)}
          bgColor="bg-green-50 dark:bg-green-900/20"
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />}
          label="Low Stock Items"
          value={stats.lowStockCount.toString()}
          bgColor="bg-yellow-50 dark:bg-yellow-900/20"
        />
        <StatCard
          icon={<Archive className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
          label="Pending Operations"
          value={stats.pendingOperations.toString()}
          bgColor="bg-purple-50 dark:bg-purple-900/20"
        />
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 overflow-x-auto" aria-label="Tabs">
          {[
            { key: 'overview', label: 'Overview', icon: List },
            { key: 'filter', label: 'Filter', icon: Filter },
            { key: 'bulk', label: 'Bulk Ops', icon: Package },
            { key: 'templates', label: 'Templates', icon: Star },
            { key: 'analytics', label: 'Analytics', icon: TrendingUp },
            { key: 'reports', label: 'Reports', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Search and Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={i18n.t('common.search') || 'Search items...'}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilterPanel(!showFilterPanel)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    showFilterPanel
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  {i18n.t('common.filter')}
                </button>

                <button
                  onClick={() => setShowBulkPanel(!showBulkPanel)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    showBulkPanel
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Package className="h-4 w-4" />
                  Bulk
                </button>

                <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${
                      viewMode === 'list'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${
                      viewMode === 'grid'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Panel */}
            {showFilterPanel && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <AdvancedFilterPanel
                  items={items}
                  onItemsChange={handleFilteredItemsChange}
                  compact
                />
              </div>
            )}

            {/* Bulk Panel */}
            {showBulkPanel && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <BulkOperationPanel
                  orderId={orderId}
                  items={items}
                  onOperationComplete={() => {
                    // Refresh items
                    onItemsChange?.(items);
                  }}
                />
              </div>
            )}

            {/* Selection Controls */}
            {selectedItems.size > 0 && (
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {selectedItems.size} {i18n.t('common.selected') || 'selected'}
                </span>
                <button
                  onClick={deselectAllItems}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {i18n.t('common.clearSelection') || 'Clear selection'}
                </button>
              </div>
            )}

            {/* Items Table/Grid */}
            {viewMode === 'list' ? (
              <OrdersTable
                items={paginatedItems}
                selectedItems={selectedItems}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
                onToggleSelection={toggleItemSelection}
                onSelectAll={selectAllItems}
                onDeselectAll={deselectAllItems}
                i18n={i18n}
              />
            ) : (
              <OrdersGrid items={paginatedItems} i18n={i18n} />
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(value) => {
                  setItemsPerPage(value);
                  setCurrentPage(1);
                }}
                i18n={i18n}
              />
            )}

            {/* Empty State */}
            {sortedItems.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {i18n.t('orders.noItems') || 'No items found'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {searchQuery
                    ? 'Try adjusting your search or filters'
                    : 'Add items to get started'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Filter Tab */}
        {activeTab === 'filter' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <AdvancedFilterPanel items={items} onItemsChange={handleFilteredItemsChange} />
          </div>
        )}

        {/* Bulk Operations Tab */}
        {activeTab === 'bulk' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <BulkOperationPanel
              orderId={orderId}
              items={items}
              onOperationComplete={() => onItemsChange?.(items)}
            />
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recent Templates
              </h3>
              {recentTemplates.length > 0 ? (
                <div className="grid gap-3">
                  {recentTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {template.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {template.items.length} items • Last used{' '}
                          {i18n.date(template.lastUsed || template.createdAt)}
                        </p>
                      </div>
                      <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Apply
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-600 dark:text-gray-400 py-8">
                  No templates available
                </p>
              )}
            </div>

            {/* Stock Alerts */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Stock Alerts
              </h3>
              <div className="space-y-3">
                {alerts.slice(0, 5).map((alert, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 p-3 rounded-lg ${
                      alert.type === 'out-of-stock'
                        ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                        : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                    }`}
                  >
                    <AlertTriangle
                      className={`h-5 w-5 flex-shrink-0 ${
                        alert.type === 'out-of-stock'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-yellow-600 dark:text-yellow-400'
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {alert.productName || alert.productId}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{alert.message}</p>
                    </div>
                  </div>
                ))}
                {alerts.length === 0 && (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm">All stock levels are healthy</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Sales Overview
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <MetricCard
                  label="Revenue"
                  value={i18n.currency(analytics.salesStats.totalRevenue)}
                />
                <MetricCard
                  label="Avg Order Value"
                  value={i18n.currency(analytics.salesStats.averageOrderValue)}
                />
                <MetricCard label="Total Orders" value={analytics.salesStats.totalOrders} />
                <MetricCard label="Total Items" value={analytics.salesStats.totalItems} />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Top Products
              </h3>
              <div className="space-y-3">
                {analytics.topProducts.slice(0, 5).map((product, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {product.productName}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {product.totalQuantity} units sold
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">
                        {i18n.currency(product.totalRevenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <ReportGenerator items={items} showList />
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <KeyboardShortcutsModal
          shortcuts={shortcuts.shortcuts}
          onClose={() => setShowShortcutsModal(false)}
          i18n={i18n}
        />
      )}
    </div>
  );
}

/**
 * Stat Card Component
 */
function StatCard({
  icon,
  label,
  value,
  bgColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bgColor: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-lg ${bgColor}`}>{icon}</div>
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Metric Card Component
 */
function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

/**
 * Orders Table Component
 */
function OrdersTable({
  items,
  selectedItems,
  sortField,
  sortDirection,
  onSort,
  onToggleSelection,
  onSelectAll,
  onDeselectAll,
  i18n,
}: {
  items: OrderItem[];
  selectedItems: Set<string>;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  onToggleSelection: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  i18n: any;
}) {
  const allSelected = items.length > 0 && items.every((item) => selectedItems.has(item.id!));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left w-12">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={allSelected ? onDeselectAll : onSelectAll}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
              </th>
              <SortableHeader
                label={i18n.t('common.product') || 'Product'}
                field="productName"
                currentField={sortField}
                direction={sortDirection}
                onSort={onSort}
              />
              <SortableHeader
                label={i18n.t('common.quantity') || 'Quantity'}
                field="quantity"
                currentField={sortField}
                direction={sortDirection}
                onSort={onSort}
              />
              <SortableHeader
                label={i18n.t('common.price') || 'Price'}
                field="price"
                currentField={sortField}
                direction={sortDirection}
                onSort={onSort}
              />
              <SortableHeader
                label={i18n.t('common.discount') || 'Discount'}
                field="discount"
                currentField={sortField}
                direction={sortDirection}
                onSort={onSort}
              />
              <SortableHeader
                label="Total"
                field="totalPrice"
                currentField={sortField}
                direction={sortDirection}
                onSort={onSort}
              />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {items.map((item) => (
              <tr
                key={item.id}
                className={`hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors ${
                  selectedItems.has(item.id!)
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : ''
                }`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id!)}
                    onChange={() => onToggleSelection(item.id!)}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                  {item.productName}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                  {item.quantity}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                  {i18n.currency(item.price)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                  {item.discount ? i18n.currency(item.discount) : '-'}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                  {i18n.currency(item.price * item.quantity - (item.discount || 0))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Sortable Table Header
 */
function SortableHeader({
  label,
  field,
  currentField,
  direction,
  onSort,
}: {
  label: string;
  field: SortField;
  currentField: SortField;
  direction: SortDirection;
  onSort: (field: SortField) => void;
}) {
  const isActive = currentField === field;

  return (
    <th className="px-4 py-3 text-left">
      <button
        onClick={() => onSort(field)}
        className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        {label}
        <ArrowUpDown
          className={`h-3 w-3 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}
        />
      </button>
    </th>
  );
}

/**
 * Orders Grid Component
 */
function OrdersGrid({ items, i18n }: { items: OrderItem[]; i18n: any }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
        >
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
            {item.productName}
          </h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Quantity:</span>
              <span className="font-medium text-gray-900 dark:text-white">{item.quantity}</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Price:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {i18n.currency(item.price)}
              </span>
            </div>
            {item.discount && item.discount > 0 && (
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Discount:</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  -{i18n.currency(item.discount)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-gray-900 dark:text-white font-semibold pt-2 border-t border-gray-200 dark:border-gray-700">
              <span>Total:</span>
              <span>{i18n.currency(item.price * item.quantity - (item.discount || 0))}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Pagination Component
 */
function Pagination({
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  i18n,
}: {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (value: number) => void;
  i18n: any;
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-700 dark:text-gray-300">
          {i18n.t('common.itemsPerPage') || 'Items per page'}:
        </label>
        <select
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="text-sm text-gray-700 dark:text-gray-300">
          {i18n.t('common.page') || 'Page'} {currentPage} {i18n.t('common.of') || 'of'}{' '}
          {totalPages}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Keyboard Shortcuts Modal
 */
function KeyboardShortcutsModal({
  shortcuts,
  onClose,
  i18n,
}: {
  shortcuts: any[];
  onClose: () => void;
  i18n: any;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          <div className="space-y-4">
            {shortcuts
              .filter((s) => s.enabled)
              .map((shortcut) => (
                <div
                  key={shortcut.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {shortcut.description}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {shortcut.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {shortcut.ctrl && (
                      <kbd className="px-2 py-1 text-xs font-semibold bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">
                        Ctrl
                      </kbd>
                    )}
                    {shortcut.shift && (
                      <kbd className="px-2 py-1 text-xs font-semibold bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">
                        Shift
                      </kbd>
                    )}
                    {shortcut.alt && (
                      <kbd className="px-2 py-1 text-xs font-semibold bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">
                        Alt
                      </kbd>
                    )}
                    <kbd className="px-2 py-1 text-xs font-semibold bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">
                      {shortcut.key.toUpperCase()}
                    </kbd>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
