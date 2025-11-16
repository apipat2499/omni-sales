'use client';

/**
 * CustomerManagementPage Component
 *
 * Main dashboard for managing customers
 * Features: List view, search, filtering, bulk actions, new customer form
 */

import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Mail,
  MessageSquare,
  Tag,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Calendar,
} from 'lucide-react';
import { useCustomerManagement } from '@/lib/hooks/useCustomerManagement';
import { ExtendedCustomer, CustomerSegment, CustomerFilters } from '@/lib/utils/customer-management';
import CustomerList from './CustomerList';
import CustomerDetailView from './CustomerDetailView';
import CustomerForm from './CustomerForm';
import { useI18n } from '@/lib/hooks/useI18n';

type ViewMode = 'list' | 'detail' | 'create' | 'edit';

const ITEMS_PER_PAGE_OPTIONS = [25, 50, 100];

export default function CustomerManagementPage() {
  const { t } = useI18n();

  // Customer management hook
  const {
    filteredCustomers,
    selectedCustomer,
    isLoading,
    filters,
    setFilters,
    sortOptions,
    setSortOptions,
    clearFilters,
    selectCustomer,
    createNewCustomer,
    updateExistingCustomer,
    removeCustomer,
    selectedCustomerIds,
    setSelectedCustomerIds,
    selectAllCustomers,
    deselectAllCustomers,
    bulkOperation,
    exportToCSV,
    statistics,
    availableTags,
    searchQuery,
    setSearchQuery,
  } = useCustomerManagement({ autoLoadOrders: true });

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Bulk action state
  const [bulkActionType, setBulkActionType] = useState<string>('');
  const [bulkActionValue, setBulkActionValue] = useState<any>('');

  // Paginated customers
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredCustomers.slice(start, end);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  // Handler functions
  const handleCreateCustomer = () => {
    setViewMode('create');
  };

  const handleEditCustomer = (customer: ExtendedCustomer) => {
    selectCustomer(customer.id);
    setViewMode('edit');
  };

  const handleViewCustomer = (customer: ExtendedCustomer) => {
    selectCustomer(customer.id);
    setViewMode('detail');
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (confirm(t('customer.deleteConfirm'))) {
      try {
        await removeCustomer(customerId);
      } catch (error) {
        console.error('Failed to delete customer:', error);
        alert(t('customer.deleteError'));
      }
    }
  };

  const handleSaveCustomer = async (data: Partial<ExtendedCustomer>) => {
    try {
      if (viewMode === 'create') {
        await createNewCustomer(data);
      } else if (viewMode === 'edit' && selectedCustomer) {
        await updateExistingCustomer(selectedCustomer.id, data);
      }
      setViewMode('list');
      selectCustomer(null);
    } catch (error) {
      console.error('Failed to save customer:', error);
      throw error;
    }
  };

  const handleCancelForm = () => {
    setViewMode('list');
    selectCustomer(null);
  };

  const handleBackToList = () => {
    setViewMode('list');
    selectCustomer(null);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilters({ ...filters, search: query });
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilters: Partial<CustomerFilters>) => {
    setFilters({ ...filters, ...newFilters });
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    clearFilters();
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleExport = () => {
    const csv = exportToCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleBulkAction = async () => {
    if (!bulkActionType || selectedCustomerIds.length === 0) return;

    try {
      const result = await bulkOperation({
        operation: bulkActionType as any,
        value: bulkActionValue,
        customerIds: selectedCustomerIds,
      });

      alert(`${t('customer.bulkSuccess')}: ${result.success}, ${t('customer.bulkFailed')}: ${result.failed}`);

      setShowBulkActions(false);
      deselectAllCustomers();
      setBulkActionType('');
      setBulkActionValue('');
    } catch (error) {
      console.error('Bulk operation failed:', error);
      alert(t('customer.bulkError'));
    }
  };

  // Render functions
  const renderStatistics = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('customer.stats.total')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.total}</p>
          </div>
          <Users className="h-8 w-8 text-blue-500" />
        </div>
        <div className="mt-2 flex items-center text-sm">
          <span className="text-green-600 dark:text-green-400 flex items-center">
            <TrendingUp className="h-4 w-4 mr-1" />
            {statistics.active} {t('customer.stats.active')}
          </span>
          <span className="mx-2 text-gray-400">|</span>
          <span className="text-red-600 dark:text-red-400">
            {statistics.inactive} {t('customer.stats.inactive')}
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('customer.stats.totalValue')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${statistics.totalLifetimeValue.toLocaleString()}
            </p>
          </div>
          <DollarSign className="h-8 w-8 text-green-500" />
        </div>
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {t('customer.stats.avgValue')}: ${statistics.averageLifetimeValue.toFixed(2)}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('customer.stats.totalOrders')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {statistics.totalOrders.toLocaleString()}
            </p>
          </div>
          <ShoppingCart className="h-8 w-8 text-purple-500" />
        </div>
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {t('customer.stats.avgOrders')}: {statistics.averageOrders.toFixed(1)}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('customer.stats.bySegment')}</p>
            <div className="flex gap-2 mt-1">
              <span className="px-2 py-1 text-xs rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100">
                VIP: {statistics.bySegment.VIP || 0}
              </span>
              <span className="px-2 py-1 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100">
                Regular: {statistics.bySegment.Regular || 0}
              </span>
            </div>
          </div>
          <Tag className="h-8 w-8 text-orange-500" />
        </div>
      </div>
    </div>
  );

  const renderHeader = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-blue-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('customer.title')}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {filteredCustomers.length} {t('customer.customers')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
              showFilters
                ? 'bg-blue-50 dark:bg-blue-900 border-blue-500 text-blue-700 dark:text-blue-100'
                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            } transition-colors`}
          >
            <Filter className="h-4 w-4" />
            {t('common.filter')}
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            {t('common.export')}
          </button>

          <button
            onClick={handleCreateCustomer}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            {t('customer.create')}
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="mt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={t('customer.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>
    </div>
  );

  const renderFilters = () => {
    if (!showFilters) return null;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('customer.filters')}
          </h3>
          <button
            onClick={handleClearFilters}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            {t('common.clearAll')}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Segment filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('customer.segment')}
            </label>
            <select
              value={filters.segment || 'all'}
              onChange={(e) => handleFilterChange({ segment: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">{t('common.all')}</option>
              <option value="VIP">VIP</option>
              <option value="Regular">Regular</option>
              <option value="Occasional">Occasional</option>
              <option value="New">New</option>
              <option value="At Risk">At Risk</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Status filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('common.status')}
            </label>
            <select
              value={filters.status || 'all'}
              onChange={(e) => handleFilterChange({ status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">{t('common.all')}</option>
              <option value="active">{t('customer.active')}</option>
              <option value="inactive">{t('customer.inactive')}</option>
            </select>
          </div>

          {/* Min Lifetime Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('customer.minLifetimeValue')}
            </label>
            <input
              type="number"
              value={filters.minLifetimeValue || ''}
              onChange={(e) =>
                handleFilterChange({ minLifetimeValue: e.target.value ? Number(e.target.value) : undefined })
              }
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Max Lifetime Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('customer.maxLifetimeValue')}
            </label>
            <input
              type="number"
              value={filters.maxLifetimeValue || ''}
              onChange={(e) =>
                handleFilterChange({ maxLifetimeValue: e.target.value ? Number(e.target.value) : undefined })
              }
              placeholder="∞"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderBulkActions = () => {
    if (selectedCustomerIds.length === 0) return null;

    return (
      <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {selectedCustomerIds.length} {t('customer.selected')}
            </span>

            <button
              onClick={() => setShowBulkActions(!showBulkActions)}
              className="px-3 py-1 text-sm bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600"
            >
              {t('customer.bulkActions')}
            </button>

            <button
              onClick={deselectAllCustomers}
              className="px-3 py-1 text-sm border border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-800"
            >
              {t('common.clearSelection')}
            </button>
          </div>
        </div>

        {showBulkActions && (
          <div className="mt-4 flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                {t('customer.bulkAction')}
              </label>
              <select
                value={bulkActionType}
                onChange={(e) => {
                  setBulkActionType(e.target.value);
                  setBulkActionValue('');
                }}
                className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">{t('customer.selectAction')}</option>
                <option value="addTag">{t('customer.addTag')}</option>
                <option value="removeTag">{t('customer.removeTag')}</option>
                <option value="updateSegment">{t('customer.updateSegment')}</option>
                <option value="updateStatus">{t('customer.updateStatus')}</option>
              </select>
            </div>

            {bulkActionType === 'addTag' || bulkActionType === 'removeTag' ? (
              <div className="flex-1">
                <label className="block text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                  {t('customer.tag')}
                </label>
                <input
                  type="text"
                  value={bulkActionValue}
                  onChange={(e) => setBulkActionValue(e.target.value)}
                  placeholder={t('customer.enterTag')}
                  className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            ) : bulkActionType === 'updateSegment' ? (
              <div className="flex-1">
                <label className="block text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                  {t('customer.segment')}
                </label>
                <select
                  value={bulkActionValue}
                  onChange={(e) => setBulkActionValue(e.target.value)}
                  className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">{t('customer.selectSegment')}</option>
                  <option value="VIP">VIP</option>
                  <option value="Regular">Regular</option>
                  <option value="Occasional">Occasional</option>
                </select>
              </div>
            ) : bulkActionType === 'updateStatus' ? (
              <div className="flex-1">
                <label className="block text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                  {t('common.status')}
                </label>
                <select
                  value={bulkActionValue}
                  onChange={(e) => setBulkActionValue(e.target.value === 'active')}
                  className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">{t('customer.selectStatus')}</option>
                  <option value="active">{t('customer.active')}</option>
                  <option value="inactive">{t('customer.inactive')}</option>
                </select>
              </div>
            ) : null}

            <button
              onClick={handleBulkAction}
              disabled={!bulkActionType || !bulkActionValue}
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('customer.apply')}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mt-6 p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t('customer.itemsPerPage')}:
            </span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t('customer.page')} {currentPage} {t('common.of')} {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            {t('customer.showing')} {(currentPage - 1) * itemsPerPage + 1}-
            {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} {t('common.of')}{' '}
            {filteredCustomers.length}
          </div>
        </div>
      </div>
    );
  };

  const renderLoading = () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
      </div>
    </div>
  );

  // Main render
  if (viewMode === 'detail' && selectedCustomer) {
    return <CustomerDetailView customer={selectedCustomer} onBack={handleBackToList} />;
  }

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <CustomerForm
        customer={viewMode === 'edit' ? selectedCustomer : undefined}
        onSave={handleSaveCustomer}
        onCancel={handleCancelForm}
      />
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {renderStatistics()}
      {renderHeader()}
      {renderFilters()}
      {renderBulkActions()}

      {isLoading ? (
        renderLoading()
      ) : (
        <>
          <CustomerList
            customers={paginatedCustomers}
            selectedIds={selectedCustomerIds}
            onSelectIds={setSelectedCustomerIds}
            onView={handleViewCustomer}
            onEdit={handleEditCustomer}
            onDelete={handleDeleteCustomer}
            sortOptions={sortOptions}
            onSort={setSortOptions}
          />
          {renderPagination()}
        </>
      )}
    </div>
  );
}
