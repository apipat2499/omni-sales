'use client';

/**
 * Comprehensive Audit Trail Viewer Component
 * Displays audit logs with filtering, sorting, pagination, and detailed views
 */

import { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Filter,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Copy,
  Settings,
  BarChart3,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { format } from 'date-fns';
import { useI18n } from '@/lib/hooks/useI18n';
import type { AuditLog } from '@/lib/utils/audit-logging';
import {
  useAuditTrailViewer,
  getChangesCount,
  getChangedFields,
  formatValue,
} from '@/lib/hooks/useAuditTrailViewer';

interface AuditTrailViewerProps {
  className?: string;
  compact?: boolean;
}

export default function AuditTrailViewer({
  className = '',
  compact = false,
}: AuditTrailViewerProps) {
  const i18n = useI18n();
  const {
    logs,
    statistics,
    filters,
    updateFilters,
    clearFilters,
    sortField,
    sortDirection,
    handleSort,
    pagination,
    totalPages,
    goToPage,
    nextPage,
    previousPage,
    setItemsPerPage,
    exportToCSV,
    exportToJSON,
    refreshLogs,
    availableActions,
    availableEntityTypes,
  } = useAuditTrailViewer();

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [showStatistics, setShowStatistics] = useState(!compact);
  const [copiedLog, setCopiedLog] = useState(false);

  // Handle copy to clipboard
  const handleCopyLog = (log: AuditLog) => {
    const logText = JSON.stringify(log, null, 2);
    navigator.clipboard.writeText(logText);
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 2000);
  };

  // Render detail modal
  const renderDetailModal = () => {
    if (!selectedLog) return null;

    const changedFields = getChangedFields(selectedLog);

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setSelectedLog(null)}
          />

          {/* Modal */}
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {i18n.t('audit.details')}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedLog.action} - {selectedLog.entityId}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyLog(selectedLog)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title={i18n.t('audit.copyToClipboard')}
                >
                  {copiedLog ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </button>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    {i18n.t('audit.details')}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {i18n.t('audit.timestamp')}:
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {format(selectedLog.timestamp, 'MMM dd, yyyy HH:mm:ss')}
                      </span>
                    </div>
                    <div className="flex items-start justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {i18n.t('audit.action')}:
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedLog.action}
                      </span>
                    </div>
                    <div className="flex items-start justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {i18n.t('audit.entityId')}:
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedLog.entityId}
                      </span>
                    </div>
                    <div className="flex items-start justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {i18n.t('audit.user')}:
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedLog.userId || i18n.t('audit.system')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    {i18n.t('audit.status')}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {selectedLog.status === 'success' ? (
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      )}
                      <span
                        className={`text-sm font-semibold ${
                          selectedLog.status === 'success'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {selectedLog.status === 'success'
                          ? i18n.t('audit.success')
                          : i18n.t('audit.failed')}
                      </span>
                    </div>
                    {selectedLog.status === 'failed' && (
                      <div className="mt-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {i18n.t('audit.errorReason')}:
                        </span>
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                          {selectedLog.description}
                        </p>
                      </div>
                    )}
                    {selectedLog.status === 'success' && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {selectedLog.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Changes Section */}
              {changedFields.length > 0 ? (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    {i18n.t('audit.changesSummary')} ({changedFields.length}{' '}
                    {i18n.t('audit.changesCount').toLowerCase()})
                  </h3>

                  {/* Before/After Comparison */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase">
                        {i18n.t('audit.before')}
                      </h4>
                      <pre className="text-xs text-gray-900 dark:text-white overflow-x-auto bg-white dark:bg-gray-800 p-2 rounded">
                        {JSON.stringify(selectedLog.changes?.before || {}, null, 2)}
                      </pre>
                    </div>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase">
                        {i18n.t('audit.after')}
                      </h4>
                      <pre className="text-xs text-gray-900 dark:text-white overflow-x-auto bg-white dark:bg-gray-800 p-2 rounded">
                        {JSON.stringify(selectedLog.changes?.after || {}, null, 2)}
                      </pre>
                    </div>
                  </div>

                  {/* Changed Fields Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 dark:bg-gray-800">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                            {i18n.t('audit.fieldName')}
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                            {i18n.t('audit.oldValue')}
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                            {i18n.t('audit.newValue')}
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                            {i18n.t('audit.dataType')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {changedFields.map((change) => (
                          <tr
                            key={change.field}
                            className="hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">
                              {change.field}
                            </td>
                            <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                              {formatValue(change.oldValue)}
                            </td>
                            <td className="px-3 py-2 text-gray-900 dark:text-white font-medium">
                              {formatValue(change.newValue)}
                            </td>
                            <td className="px-3 py-2 text-gray-500 dark:text-gray-500 text-xs">
                              {change.dataType}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {i18n.t('audit.noChanges')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render statistics dashboard
  const renderStatistics = () => {
    if (!showStatistics) return null;

    return (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {i18n.t('audit.statistics')}
            </h3>
          </div>
          <button
            onClick={() => setShowStatistics(false)}
            className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            {i18n.t('audit.hideStatistics')}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Logs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              {i18n.t('audit.totalLogs')}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {statistics.totalLogs}
            </p>
          </div>

          {/* Success Count */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-900">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              {i18n.t('audit.successCount')}
            </p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {statistics.successCount}
            </p>
          </div>

          {/* Failure Count */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-red-200 dark:border-red-900">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              {i18n.t('audit.failureCount')}
            </p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {statistics.failureCount}
            </p>
          </div>

          {/* Success Rate */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-200 dark:border-blue-900">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              {i18n.t('audit.successRate')}
            </p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {statistics.successRate.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Action Breakdown */}
        {Object.keys(statistics.actionCounts).length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {i18n.t('audit.mostCommonActions')}
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(statistics.actionCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([action, count]) => (
                  <div
                    key={action}
                    className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700"
                  >
                    <span className="text-xs font-medium text-gray-900 dark:text-white">
                      {action}
                    </span>
                    <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">
                      ({count})
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render filter bar
  const renderFilters = () => {
    if (!showFilters) return null;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {i18n.t('audit.filters')}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearFilters}
              className="text-xs px-3 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
            >
              {i18n.t('audit.clearFilters')}
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ChevronUp className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Date From */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              {i18n.t('audit.from')}
            </label>
            <input
              type="date"
              value={filters.dateFrom ? format(filters.dateFrom, 'yyyy-MM-dd') : ''}
              onChange={(e) =>
                updateFilters({
                  dateFrom: e.target.value ? new Date(e.target.value) : null,
                })
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              {i18n.t('audit.to')}
            </label>
            <input
              type="date"
              value={filters.dateTo ? format(filters.dateTo, 'yyyy-MM-dd') : ''}
              onChange={(e) =>
                updateFilters({
                  dateTo: e.target.value ? new Date(e.target.value) : null,
                })
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              {i18n.t('audit.actionType')}
            </label>
            <select
              multiple
              value={filters.actions}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                updateFilters({ actions: selected as any });
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              size={3}
            >
              {availableActions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>

          {/* Entity Type Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              {i18n.t('audit.entityType')}
            </label>
            <select
              multiple
              value={filters.entityTypes}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                updateFilters({ entityTypes: selected });
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              size={3}
            >
              {availableEntityTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              {i18n.t('audit.status')}
            </label>
            <select
              multiple
              value={filters.statuses}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                updateFilters({ statuses: selected as any });
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              size={2}
            >
              <option value="success">{i18n.t('audit.success')}</option>
              <option value="failed">{i18n.t('audit.failed')}</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              {i18n.t('audit.searchDetails')}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={filters.searchText}
                onChange={(e) => updateFilters({ searchText: e.target.value })}
                placeholder={i18n.t('common.search')}
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Get sort icon for column
  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
    ) : (
      <ArrowDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {i18n.t('audit.title')}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshLogs}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-5 w-5" />
          </button>

          {!showStatistics && (
            <button
              onClick={() => setShowStatistics(true)}
              className="text-sm px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {i18n.t('audit.showStatistics')}
            </button>
          )}

          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Download className="h-4 w-4" />
              {i18n.t('audit.export')}
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={exportToCSV}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
              >
                {i18n.t('audit.exportCSV')}
              </button>
              <button
                onClick={exportToJSON}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
              >
                {i18n.t('audit.exportJSON')}
              </button>
            </div>
          </div>

          {!showFilters && (
            <button
              onClick={() => setShowFilters(true)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Filter className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Statistics Dashboard */}
      {renderStatistics()}

      {/* Filters */}
      {renderFilters()}

      {/* Audit Logs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  onClick={() => handleSort('timestamp')}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <div className="flex items-center gap-2">
                    {i18n.t('audit.timestamp')}
                    {getSortIcon('timestamp')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('action')}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <div className="flex items-center gap-2">
                    {i18n.t('audit.action')}
                    {getSortIcon('action')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('entityType')}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <div className="flex items-center gap-2">
                    {i18n.t('audit.entityType')}
                    {getSortIcon('entityType')}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {i18n.t('audit.entityId')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {i18n.t('audit.user')}
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <div className="flex items-center gap-2">
                    {i18n.t('audit.status')}
                    {getSortIcon('status')}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {i18n.t('audit.changes')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <p className="text-gray-600 dark:text-gray-400">
                      {i18n.t('audit.noLogs')}
                    </p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const changesCount = getChangesCount(log);
                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          {format(log.timestamp, 'MMM dd, HH:mm:ss')}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs font-medium">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {log.entityId.split('_')[0] || 'unknown'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 font-mono">
                        {log.entityId.length > 20
                          ? `${log.entityId.substring(0, 20)}...`
                          : log.entityId}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {log.userId || (
                          <span className="text-gray-500 dark:text-gray-400 italic">
                            {i18n.t('audit.system')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-1">
                          {log.status === 'success' ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                              <span className="text-green-600 dark:text-green-400 font-medium">
                                {i18n.t('audit.success')}
                              </span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                              <span className="text-red-600 dark:text-red-400 font-medium">
                                {i18n.t('audit.failed')}
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {changesCount > 0 ? (
                          <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded text-xs">
                            {changesCount} {i18n.t('audit.changes').toLowerCase()}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {logs.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  {i18n.t('audit.itemsPerPage')}:
                </label>
                <select
                  value={pagination.itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={250}>250</option>
                </select>
              </div>

              <div className="text-sm text-gray-700 dark:text-gray-300">
                {i18n.t('audit.page')} {pagination.currentPage} {i18n.t('audit.of')}{' '}
                {totalPages}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={previousPage}
                disabled={pagination.currentPage === 1}
                className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={pagination.currentPage}
                  onChange={(e) => {
                    const page = Number(e.target.value);
                    if (page >= 1 && page <= totalPages) {
                      goToPage(page);
                    }
                  }}
                  className="w-16 px-2 py-1 text-sm text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <button
                onClick={nextPage}
                disabled={pagination.currentPage === totalPages}
                className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {renderDetailModal()}
    </div>
  );
}
