/**
 * Custom hook for Audit Trail Viewer logic
 * Handles filtering, sorting, pagination, search, and export functionality
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import type { AuditLog, AuditAction } from '@/lib/utils/audit-logging';
import { getAuditLogs } from '@/lib/utils/audit-logging';

export type SortField = 'timestamp' | 'action' | 'entityType' | 'status';
export type SortDirection = 'asc' | 'desc';

export interface AuditFilters {
  dateFrom: Date | null;
  dateTo: Date | null;
  actions: AuditAction[];
  entityTypes: string[];
  statuses: ('success' | 'failed')[];
  searchText: string;
  userId?: string;
}

export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
}

export interface AuditStatistics {
  totalLogs: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  actionCounts: Record<string, number>;
  entityTypeCounts: Record<string, number>;
  totalItemsModified: number;
}

const DEFAULT_ITEMS_PER_PAGE = 25;

export function useAuditTrailViewer() {
  // State management
  const [filters, setFilters] = useState<AuditFilters>({
    dateFrom: null,
    dateTo: null,
    actions: [],
    entityTypes: [],
    statuses: [],
    searchText: '',
  });

  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    itemsPerPage: DEFAULT_ITEMS_PER_PAGE,
  });

  const [searchDebounce, setSearchDebounce] = useState('');
  const [allLogs, setAllLogs] = useState<AuditLog[]>([]);

  // Load audit logs
  useEffect(() => {
    const logs = getAuditLogs();
    setAllLogs(logs);
  }, []);

  // Debounce search text
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(filters.searchText);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters.searchText]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    let result = [...allLogs];

    // Date range filter
    if (filters.dateFrom) {
      result = result.filter((log) => log.timestamp >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      const endOfDay = new Date(filters.dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      result = result.filter((log) => log.timestamp <= endOfDay);
    }

    // Action filter
    if (filters.actions.length > 0) {
      result = result.filter((log) => filters.actions.includes(log.action));
    }

    // Entity type filter (extract from entityId or description)
    if (filters.entityTypes.length > 0) {
      result = result.filter((log) => {
        const entityType = extractEntityType(log);
        return filters.entityTypes.includes(entityType);
      });
    }

    // Status filter
    if (filters.statuses.length > 0) {
      result = result.filter((log) => filters.statuses.includes(log.status));
    }

    // User filter
    if (filters.userId) {
      result = result.filter((log) => log.userId === filters.userId);
    }

    // Search filter (debounced)
    if (searchDebounce) {
      const searchLower = searchDebounce.toLowerCase();
      result = result.filter((log) => {
        return (
          log.action.toLowerCase().includes(searchLower) ||
          log.entityId.toLowerCase().includes(searchLower) ||
          log.description.toLowerCase().includes(searchLower) ||
          (log.userId?.toLowerCase().includes(searchLower) ?? false) ||
          extractEntityType(log).toLowerCase().includes(searchLower)
        );
      });
    }

    return result;
  }, [allLogs, filters, searchDebounce]);

  // Sort logs
  const sortedLogs = useMemo(() => {
    const result = [...filteredLogs];

    result.sort((a, b) => {
      let compareValue = 0;

      switch (sortField) {
        case 'timestamp':
          compareValue = a.timestamp.getTime() - b.timestamp.getTime();
          break;
        case 'action':
          compareValue = a.action.localeCompare(b.action);
          break;
        case 'entityType':
          compareValue = extractEntityType(a).localeCompare(extractEntityType(b));
          break;
        case 'status':
          compareValue = a.status.localeCompare(b.status);
          break;
      }

      return sortDirection === 'asc' ? compareValue : -compareValue;
    });

    return result;
  }, [filteredLogs, sortField, sortDirection]);

  // Paginate logs
  const paginatedLogs = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    return sortedLogs.slice(startIndex, endIndex);
  }, [sortedLogs, pagination]);

  // Calculate statistics
  const statistics: AuditStatistics = useMemo(() => {
    const successCount = filteredLogs.filter((log) => log.status === 'success').length;
    const failureCount = filteredLogs.filter((log) => log.status === 'failed').length;

    const actionCounts: Record<string, number> = {};
    const entityTypeCounts: Record<string, number> = {};
    let totalItemsModified = 0;

    filteredLogs.forEach((log) => {
      // Count actions
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;

      // Count entity types
      const entityType = extractEntityType(log);
      entityTypeCounts[entityType] = (entityTypeCounts[entityType] || 0) + 1;

      // Count items modified
      if (log.changes) {
        const changesCount = Object.keys(log.changes.after || {}).length;
        totalItemsModified += changesCount;
      }
    });

    return {
      totalLogs: filteredLogs.length,
      successCount,
      failureCount,
      successRate: filteredLogs.length > 0 ? (successCount / filteredLogs.length) * 100 : 0,
      actionCounts,
      entityTypeCounts,
      totalItemsModified,
    };
  }, [filteredLogs]);

  // Total pages
  const totalPages = Math.ceil(sortedLogs.length / pagination.itemsPerPage);

  // Filter update functions
  const updateFilters = useCallback((newFilters: Partial<AuditFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, currentPage: 1 })); // Reset to first page
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      dateFrom: null,
      dateTo: null,
      actions: [],
      entityTypes: [],
      statuses: [],
      searchText: '',
    });
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, []);

  // Sorting functions
  const handleSort = useCallback((field: SortField) => {
    setSortField((prevField) => {
      if (prevField === field) {
        // Toggle direction if same field
        setSortDirection((prevDir) => (prevDir === 'asc' ? 'desc' : 'asc'));
      } else {
        // Default to descending for new field
        setSortDirection('desc');
      }
      return field;
    });
  }, []);

  // Pagination functions
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: page }));
    }
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (pagination.currentPage < totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: prev.currentPage + 1 }));
    }
  }, [pagination.currentPage, totalPages]);

  const previousPage = useCallback(() => {
    if (pagination.currentPage > 1) {
      setPagination((prev) => ({ ...prev, currentPage: prev.currentPage - 1 }));
    }
  }, [pagination.currentPage]);

  const setItemsPerPage = useCallback((items: number) => {
    setPagination({ currentPage: 1, itemsPerPage: items });
  }, []);

  // Export functions
  const exportToCSV = useCallback(() => {
    const headers = ['Timestamp', 'Action', 'Entity Type', 'Entity ID', 'User', 'Status', 'Description'];
    const rows = sortedLogs.map((log) => [
      format(log.timestamp, 'yyyy-MM-dd HH:mm:ss'),
      log.action,
      extractEntityType(log),
      log.entityId,
      log.userId || 'System',
      log.status,
      log.description.replace(/,/g, ';'), // Escape commas
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const filename = `audit_logs_${dateStr}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [sortedLogs]);

  const exportToJSON = useCallback(() => {
    const exportData = sortedLogs.map((log) => ({
      ...log,
      timestamp: format(log.timestamp, 'yyyy-MM-dd HH:mm:ss'),
      entityType: extractEntityType(log),
    }));

    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const filename = `audit_logs_${dateStr}.json`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [sortedLogs]);

  // Refresh logs
  const refreshLogs = useCallback(() => {
    const logs = getAuditLogs();
    setAllLogs(logs);
  }, []);

  // Get unique values for filters
  const availableActions = useMemo(() => {
    const actions = new Set(allLogs.map((log) => log.action));
    return Array.from(actions).sort();
  }, [allLogs]);

  const availableEntityTypes = useMemo(() => {
    const types = new Set(allLogs.map((log) => extractEntityType(log)));
    return Array.from(types).sort();
  }, [allLogs]);

  const availableUsers = useMemo(() => {
    const users = new Set(allLogs.map((log) => log.userId).filter(Boolean));
    return Array.from(users).sort();
  }, [allLogs]);

  return {
    // Data
    logs: paginatedLogs,
    allLogs: sortedLogs,
    statistics,

    // Filters
    filters,
    updateFilters,
    clearFilters,

    // Sorting
    sortField,
    sortDirection,
    handleSort,

    // Pagination
    pagination,
    totalPages,
    goToPage,
    nextPage,
    previousPage,
    setItemsPerPage,

    // Export
    exportToCSV,
    exportToJSON,

    // Refresh
    refreshLogs,

    // Available options
    availableActions,
    availableEntityTypes,
    availableUsers,
  };
}

/**
 * Extract entity type from audit log
 * Tries to parse from entityId or description
 */
function extractEntityType(log: AuditLog): string {
  // Try to extract from entityId (e.g., "order_123" -> "order")
  const match = log.entityId.match(/^([a-z]+)_/i);
  if (match) {
    return match[1];
  }

  // Try to extract from description
  const descLower = log.description.toLowerCase();
  if (descLower.includes('order')) return 'order';
  if (descLower.includes('item')) return 'item';
  if (descLower.includes('product')) return 'product';
  if (descLower.includes('customer')) return 'customer';
  if (descLower.includes('user')) return 'user';
  if (descLower.includes('setting')) return 'setting';
  if (descLower.includes('inventory')) return 'inventory';
  if (descLower.includes('payment')) return 'payment';

  return 'unknown';
}

/**
 * Get count of changed fields in a log entry
 */
export function getChangesCount(log: AuditLog): number {
  if (!log.changes) return 0;

  const beforeKeys = Object.keys(log.changes.before || {});
  const afterKeys = Object.keys(log.changes.after || {});
  const allKeys = new Set([...beforeKeys, ...afterKeys]);

  let changedCount = 0;
  allKeys.forEach((key) => {
    const beforeValue = log.changes?.before?.[key];
    const afterValue = log.changes?.after?.[key];
    if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
      changedCount++;
    }
  });

  return changedCount;
}

/**
 * Get list of changed fields with before/after values
 */
export function getChangedFields(log: AuditLog): Array<{
  field: string;
  oldValue: any;
  newValue: any;
  dataType: string;
}> {
  if (!log.changes) return [];

  const beforeKeys = Object.keys(log.changes.before || {});
  const afterKeys = Object.keys(log.changes.after || {});
  const allKeys = new Set([...beforeKeys, ...afterKeys]);

  const changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
    dataType: string;
  }> = [];

  allKeys.forEach((key) => {
    const beforeValue = log.changes?.before?.[key];
    const afterValue = log.changes?.after?.[key];

    if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
      changes.push({
        field: key,
        oldValue: beforeValue,
        newValue: afterValue,
        dataType: typeof afterValue !== 'undefined' ? typeof afterValue : typeof beforeValue,
      });
    }
  });

  return changes.sort((a, b) => a.field.localeCompare(b.field));
}

/**
 * Format value for display
 */
export function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return '-';
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}
