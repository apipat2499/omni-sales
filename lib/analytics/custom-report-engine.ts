/**
 * Custom Report Engine
 * Dynamic query builder with caching and export capabilities
 */

import { supabase } from '@/lib/supabase/client';

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const reportCache = new Map<string, { data: any; timestamp: number }>();

// Type definitions
export interface Dimension {
  field: string;
  label: string;
  type: 'string' | 'date' | 'number' | 'boolean';
  granularity?: 'day' | 'week' | 'month' | 'quarter' | 'year'; // For date fields
}

export interface Metric {
  field: string;
  label: string;
  aggregation: 'sum' | 'avg' | 'count' | 'count_distinct' | 'min' | 'max';
  format?: 'currency' | 'percentage' | 'number';
}

export interface Filter {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' | 'between';
  value: any;
  value2?: any; // For 'between' operator
}

export interface Sort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface Grouping {
  field: string;
}

export interface ReportConfig {
  dimensions: Dimension[];
  metrics: Metric[];
  filters?: Filter[];
  sorting?: Sort[];
  grouping?: Grouping[];
  dateRange?: {
    start: string;
    end: string;
  };
  limit?: number;
  offset?: number;
}

export interface ReportResult {
  data: any[];
  metadata: {
    rowCount: number;
    executionTime: number;
    cached: boolean;
    generatedAt: string;
  };
}

/**
 * Execute a custom report
 */
export async function executeReport(
  config: ReportConfig,
  userId: string,
  useCache: boolean = true
): Promise<ReportResult> {
  const startTime = Date.now();

  // Generate cache key
  const cacheKey = generateCacheKey(config, userId);

  // Check cache
  if (useCache) {
    const cached = getFromCache(cacheKey);
    if (cached) {
      return {
        data: cached.data,
        metadata: {
          rowCount: cached.data.length,
          executionTime: Date.now() - startTime,
          cached: true,
          generatedAt: new Date().toISOString(),
        },
      };
    }
  }

  // Build and execute query
  const data = await buildAndExecuteQuery(config, userId);

  // Apply sorting
  const sortedData = applySorting(data, config.sorting || []);

  // Apply pagination
  const paginatedData = applyPagination(
    sortedData,
    config.limit,
    config.offset
  );

  // Cache results
  if (useCache) {
    setCache(cacheKey, paginatedData);
  }

  const executionTime = Date.now() - startTime;

  return {
    data: paginatedData,
    metadata: {
      rowCount: paginatedData.length,
      executionTime,
      cached: false,
      generatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Build and execute database query
 */
async function buildAndExecuteQuery(
  config: ReportConfig,
  userId: string
): Promise<any[]> {
  const { dimensions, metrics, filters, dateRange } = config;

  // Determine primary table based on metrics and dimensions
  const primaryTable = determinePrimaryTable(dimensions, metrics);

  // Build base query
  let query = supabase.from(primaryTable).select('*');

  // Apply date range filter
  if (dateRange) {
    query = query
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end);
  }

  // Apply filters
  if (filters && filters.length > 0) {
    query = applyFilters(query, filters);
  }

  // Execute query
  const { data, error } = await query;

  if (error) {
    console.error('Query execution error:', error);
    throw new Error(`Failed to execute query: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Process and aggregate data
  const processedData = processData(data, config);

  return processedData;
}

/**
 * Determine primary table based on dimensions and metrics
 */
function determinePrimaryTable(
  dimensions: Dimension[],
  metrics: Metric[]
): string {
  const allFields = [
    ...dimensions.map((d) => d.field),
    ...metrics.map((m) => m.field),
  ];

  // Order-related fields
  if (
    allFields.some((f) =>
      ['revenue', 'orders', 'total', 'status', 'channel'].includes(f)
    )
  ) {
    return 'orders';
  }

  // Product-related fields
  if (
    allFields.some((f) =>
      ['product_name', 'category', 'units_sold', 'stock'].includes(f)
    )
  ) {
    return 'products';
  }

  // Customer-related fields
  if (
    allFields.some((f) =>
      ['customer_name', 'email', 'phone', 'segment'].includes(f)
    )
  ) {
    return 'customers';
  }

  // Default to orders
  return 'orders';
}

/**
 * Apply filters to query
 */
function applyFilters(query: any, filters: Filter[]): any {
  let filteredQuery = query;

  filters.forEach((filter) => {
    switch (filter.operator) {
      case 'equals':
        filteredQuery = filteredQuery.eq(filter.field, filter.value);
        break;
      case 'not_equals':
        filteredQuery = filteredQuery.neq(filter.field, filter.value);
        break;
      case 'contains':
        filteredQuery = filteredQuery.ilike(filter.field, `%${filter.value}%`);
        break;
      case 'gt':
        filteredQuery = filteredQuery.gt(filter.field, filter.value);
        break;
      case 'gte':
        filteredQuery = filteredQuery.gte(filter.field, filter.value);
        break;
      case 'lt':
        filteredQuery = filteredQuery.lt(filter.field, filter.value);
        break;
      case 'lte':
        filteredQuery = filteredQuery.lte(filter.field, filter.value);
        break;
      case 'in':
        filteredQuery = filteredQuery.in(filter.field, filter.value);
        break;
      case 'not_in':
        filteredQuery = filteredQuery.not(filter.field, 'in', filter.value);
        break;
      case 'between':
        filteredQuery = filteredQuery
          .gte(filter.field, filter.value)
          .lte(filter.field, filter.value2);
        break;
    }
  });

  return filteredQuery;
}

/**
 * Process and aggregate data based on configuration
 */
function processData(rawData: any[], config: ReportConfig): any[] {
  const { dimensions, metrics, grouping } = config;

  // If no grouping, aggregate all data
  if (!grouping || grouping.length === 0) {
    return [aggregateData(rawData, metrics)];
  }

  // Group data
  const grouped = groupData(rawData, grouping);

  // Aggregate each group
  const results = Object.entries(grouped).map(([key, rows]) => {
    const aggregated = aggregateData(rows as any[], metrics);

    // Add dimension values
    const dimensionValues: any = {};
    grouping.forEach((g) => {
      dimensionValues[g.field] = (rows as any[])[0][g.field];
    });

    return {
      ...dimensionValues,
      ...aggregated,
    };
  });

  return results;
}

/**
 * Group data by specified fields
 */
function groupData(data: any[], grouping: Grouping[]): Record<string, any[]> {
  const grouped: Record<string, any[]> = {};

  data.forEach((row) => {
    const key = grouping.map((g) => row[g.field]).join('|');

    if (!grouped[key]) {
      grouped[key] = [];
    }

    grouped[key].push(row);
  });

  return grouped;
}

/**
 * Aggregate metrics for a dataset
 */
function aggregateData(data: any[], metrics: Metric[]): any {
  const result: any = {};

  metrics.forEach((metric) => {
    const values = data
      .map((row) => {
        const value = extractFieldValue(row, metric.field);
        return typeof value === 'number' ? value : parseFloat(value) || 0;
      })
      .filter((v) => !isNaN(v));

    switch (metric.aggregation) {
      case 'sum':
        result[metric.field] = values.reduce((a, b) => a + b, 0);
        break;
      case 'avg':
        result[metric.field] =
          values.length > 0
            ? values.reduce((a, b) => a + b, 0) / values.length
            : 0;
        break;
      case 'count':
        result[metric.field] = data.length;
        break;
      case 'count_distinct':
        result[metric.field] = new Set(
          data.map((row) => extractFieldValue(row, metric.field))
        ).size;
        break;
      case 'min':
        result[metric.field] =
          values.length > 0 ? Math.min(...values) : 0;
        break;
      case 'max':
        result[metric.field] =
          values.length > 0 ? Math.max(...values) : 0;
        break;
    }

    // Apply formatting
    if (metric.format === 'currency') {
      result[`${metric.field}_formatted`] = formatCurrency(result[metric.field]);
    } else if (metric.format === 'percentage') {
      result[`${metric.field}_formatted`] = formatPercentage(result[metric.field]);
    }
  });

  return result;
}

/**
 * Extract field value from row (supports nested fields)
 */
function extractFieldValue(row: any, field: string): any {
  // Handle special computed fields
  if (field === 'revenue') {
    return row.total || row.amount || 0;
  }
  if (field === 'orders') {
    return 1; // Count each row as 1 order
  }
  if (field === 'avg_order_value') {
    return row.total || row.amount || 0;
  }
  if (field === 'profit') {
    const revenue = row.total || row.amount || 0;
    const cost = row.cost || revenue * 0.6; // 60% assumed cost
    return revenue - cost;
  }
  if (field === 'profit_margin') {
    const revenue = row.total || row.amount || 0;
    const cost = row.cost || revenue * 0.6;
    const profit = revenue - cost;
    return revenue > 0 ? (profit / revenue) * 100 : 0;
  }

  // Handle nested fields (e.g., "customer.name")
  if (field.includes('.')) {
    const parts = field.split('.');
    let value = row;
    for (const part of parts) {
      value = value?.[part];
      if (value === undefined) break;
    }
    return value;
  }

  return row[field];
}

/**
 * Apply sorting to data
 */
function applySorting(data: any[], sorting: Sort[]): any[] {
  if (!sorting || sorting.length === 0) {
    return data;
  }

  const sorted = [...data];

  sorted.sort((a, b) => {
    for (const sort of sorting) {
      const aVal = a[sort.field];
      const bVal = b[sort.field];

      let comparison = 0;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal);
      } else {
        comparison = (aVal || 0) - (bVal || 0);
      }

      if (comparison !== 0) {
        return sort.direction === 'asc' ? comparison : -comparison;
      }
    }

    return 0;
  });

  return sorted;
}

/**
 * Apply pagination to data
 */
function applyPagination(
  data: any[],
  limit?: number,
  offset?: number
): any[] {
  if (!limit) {
    return data;
  }

  const start = offset || 0;
  const end = start + limit;

  return data.slice(start, end);
}

/**
 * Generate cache key
 */
function generateCacheKey(config: ReportConfig, userId: string): string {
  return `${userId}:${JSON.stringify(config)}`;
}

/**
 * Get from cache
 */
function getFromCache(key: string): any | null {
  const cached = reportCache.get(key);

  if (!cached) {
    return null;
  }

  // Check if cache is still valid
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    reportCache.delete(key);
    return null;
  }

  return cached.data;
}

/**
 * Set cache
 */
function setCache(key: string, data: any): void {
  reportCache.set(key, {
    data,
    timestamp: Date.now(),
  });

  // Clean up old cache entries (simple LRU)
  if (reportCache.size > 100) {
    const firstKey = reportCache.keys().next().value;
    reportCache.delete(firstKey);
  }
}

/**
 * Clear cache
 */
export function clearReportCache(userId?: string): void {
  if (userId) {
    // Clear specific user's cache
    Array.from(reportCache.keys()).forEach((key) => {
      if (key.startsWith(`${userId}:`)) {
        reportCache.delete(key);
      }
    });
  } else {
    // Clear all cache
    reportCache.clear();
  }
}

/**
 * Format currency
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

/**
 * Format percentage
 */
function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

/**
 * Export report to CSV
 */
export function exportToCSV(data: any[], filename: string = 'report.csv'): void {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  // Get headers
  const headers = Object.keys(data[0]);

  // Build CSV content
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((header) => {
        const value = row[header];
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    ),
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Export report to JSON
 */
export function exportToJSON(data: any[], filename: string = 'report.json'): void {
  const jsonContent = JSON.stringify(data, null, 2);

  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Prepare data for Excel export (to be used with a library like xlsx)
 */
export function prepareForExcel(data: any[]): any[] {
  if (data.length === 0) {
    return [];
  }

  // Remove _formatted fields for Excel
  return data.map((row) => {
    const cleaned: any = {};
    Object.keys(row).forEach((key) => {
      if (!key.endsWith('_formatted')) {
        cleaned[key] = row[key];
      }
    });
    return cleaned;
  });
}

/**
 * Get available dimensions for report builder
 */
export function getAvailableDimensions(): Dimension[] {
  return [
    { field: 'date', label: 'Date', type: 'date', granularity: 'day' },
    { field: 'category', label: 'Category', type: 'string' },
    { field: 'channel', label: 'Channel', type: 'string' },
    { field: 'status', label: 'Status', type: 'string' },
    { field: 'product_name', label: 'Product', type: 'string' },
    { field: 'customer_name', label: 'Customer', type: 'string' },
    { field: 'region', label: 'Region', type: 'string' },
    { field: 'payment_method', label: 'Payment Method', type: 'string' },
  ];
}

/**
 * Get available metrics for report builder
 */
export function getAvailableMetrics(): Metric[] {
  return [
    { field: 'revenue', label: 'Revenue', aggregation: 'sum', format: 'currency' },
    { field: 'orders', label: 'Orders', aggregation: 'count' },
    { field: 'avg_order_value', label: 'Avg Order Value', aggregation: 'avg', format: 'currency' },
    { field: 'profit', label: 'Profit', aggregation: 'sum', format: 'currency' },
    { field: 'profit_margin', label: 'Profit Margin', aggregation: 'avg', format: 'percentage' },
    { field: 'units_sold', label: 'Units Sold', aggregation: 'sum' },
    { field: 'unique_customers', label: 'Unique Customers', aggregation: 'count_distinct' },
    { field: 'new_customers', label: 'New Customers', aggregation: 'count' },
  ];
}
