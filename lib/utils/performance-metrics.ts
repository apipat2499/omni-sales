/**
 * Performance Metrics Utility
 * Comprehensive performance monitoring with localStorage persistence
 */

export interface PerformanceMetric {
  id: string;
  type: 'render' | 'api' | 'memory' | 'interaction' | 'page-load';
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
  memoryUsage?: MemoryInfo;
}

export interface MemoryInfo {
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
  percentUsed: number;
}

export interface PerformanceThresholds {
  render: {
    warning: number;
    critical: number;
  };
  api: {
    warning: number;
    critical: number;
  };
  memory: {
    warning: number; // percentage
    critical: number; // percentage
  };
}

export interface PerformanceAnalysis {
  totalMetrics: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  p50: number;
  p75: number;
  p95: number;
  p99: number;
  slowOperations: PerformanceMetric[];
  memoryTrend: 'increasing' | 'stable' | 'decreasing' | 'unknown';
  recommendations: string[];
}

export interface HistoricalData {
  metrics: PerformanceMetric[];
  lastCleanup: number;
  totalRecorded: number;
}

// Default performance thresholds
export const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  render: {
    warning: 16, // One frame at 60fps
    critical: 100,
  },
  api: {
    warning: 1000, // 1 second
    critical: 3000, // 3 seconds
  },
  memory: {
    warning: 70, // 70% of heap
    critical: 90, // 90% of heap
  },
};

const STORAGE_KEY = 'omni-sales-performance-metrics';
const MAX_STORED_METRICS = 1000;
const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get current memory usage information
 */
export function getMemoryUsage(): MemoryInfo | undefined {
  if (typeof window === 'undefined' || !performance.memory) {
    return undefined;
  }

  const memory = performance.memory;
  return {
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
    totalJSHeapSize: memory.totalJSHeapSize,
    usedJSHeapSize: memory.usedJSHeapSize,
    percentUsed: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
  };
}

/**
 * Generate unique ID for metrics
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Record a render time metric
 */
export function recordRenderTime(
  componentName: string,
  duration: number,
  metadata?: Record<string, any>
): PerformanceMetric {
  const metric: PerformanceMetric = {
    id: generateId(),
    type: 'render',
    name: componentName,
    duration,
    timestamp: Date.now(),
    metadata,
    memoryUsage: getMemoryUsage(),
  };

  storeMetric(metric);
  checkThreshold(metric);

  return metric;
}

/**
 * Record an API call time metric
 */
export function recordAPICallTime(
  endpoint: string,
  duration: number,
  metadata?: Record<string, any>
): PerformanceMetric {
  const metric: PerformanceMetric = {
    id: generateId(),
    type: 'api',
    name: endpoint,
    duration,
    timestamp: Date.now(),
    metadata,
  };

  storeMetric(metric);
  checkThreshold(metric);

  return metric;
}

/**
 * Record a memory snapshot
 */
export function recordMemorySnapshot(label: string): PerformanceMetric | null {
  const memoryUsage = getMemoryUsage();
  if (!memoryUsage) {
    return null;
  }

  const metric: PerformanceMetric = {
    id: generateId(),
    type: 'memory',
    name: label,
    duration: memoryUsage.percentUsed,
    timestamp: Date.now(),
    memoryUsage,
  };

  storeMetric(metric);
  checkThreshold(metric);

  return metric;
}

/**
 * Record a user interaction time
 */
export function recordInteractionTime(
  interactionName: string,
  duration: number,
  metadata?: Record<string, any>
): PerformanceMetric {
  const metric: PerformanceMetric = {
    id: generateId(),
    type: 'interaction',
    name: interactionName,
    duration,
    timestamp: Date.now(),
    metadata,
  };

  storeMetric(metric);

  return metric;
}

/**
 * Store metric to localStorage
 */
function storeMetric(metric: PerformanceMetric): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const data = getHistoricalData();
    data.metrics.push(metric);
    data.totalRecorded++;

    // Cleanup old metrics if needed
    if (data.metrics.length > MAX_STORED_METRICS) {
      data.metrics = data.metrics.slice(-MAX_STORED_METRICS);
    }

    // Auto cleanup old data
    if (Date.now() - data.lastCleanup > CLEANUP_INTERVAL) {
      cleanupOldMetrics(data);
      data.lastCleanup = Date.now();
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to store performance metric:', error);
  }
}

/**
 * Get historical data from localStorage
 */
export function getHistoricalData(): HistoricalData {
  if (typeof window === 'undefined') {
    return {
      metrics: [],
      lastCleanup: Date.now(),
      totalRecorded: 0,
    };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to load historical performance data:', error);
  }

  return {
    metrics: [],
    lastCleanup: Date.now(),
    totalRecorded: 0,
  };
}

/**
 * Cleanup metrics older than specified days
 */
function cleanupOldMetrics(data: HistoricalData, daysToKeep: number = 7): void {
  const cutoffTime = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
  data.metrics = data.metrics.filter((m) => m.timestamp > cutoffTime);
}

/**
 * Clear all stored metrics
 */
export function clearMetrics(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear performance metrics:', error);
  }
}

/**
 * Check if metric exceeds thresholds
 */
function checkThreshold(
  metric: PerformanceMetric,
  thresholds: PerformanceThresholds = DEFAULT_THRESHOLDS
): void {
  if (metric.type === 'render') {
    if (metric.duration > thresholds.render.critical) {
      console.error(
        `[Performance Critical] ${metric.name} render took ${metric.duration.toFixed(2)}ms (threshold: ${thresholds.render.critical}ms)`
      );
    } else if (metric.duration > thresholds.render.warning) {
      console.warn(
        `[Performance Warning] ${metric.name} render took ${metric.duration.toFixed(2)}ms (threshold: ${thresholds.render.warning}ms)`
      );
    }
  } else if (metric.type === 'api') {
    if (metric.duration > thresholds.api.critical) {
      console.error(
        `[Performance Critical] API ${metric.name} took ${metric.duration.toFixed(2)}ms (threshold: ${thresholds.api.critical}ms)`
      );
    } else if (metric.duration > thresholds.api.warning) {
      console.warn(
        `[Performance Warning] API ${metric.name} took ${metric.duration.toFixed(2)}ms (threshold: ${thresholds.api.warning}ms)`
      );
    }
  } else if (metric.type === 'memory' && metric.memoryUsage) {
    if (metric.memoryUsage.percentUsed > thresholds.memory.critical) {
      console.error(
        `[Performance Critical] Memory usage at ${metric.memoryUsage.percentUsed.toFixed(1)}% (threshold: ${thresholds.memory.critical}%)`
      );
    } else if (metric.memoryUsage.percentUsed > thresholds.memory.warning) {
      console.warn(
        `[Performance Warning] Memory usage at ${metric.memoryUsage.percentUsed.toFixed(1)}% (threshold: ${thresholds.memory.warning}%)`
      );
    }
  }
}

/**
 * Calculate percentile
 */
function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Analyze performance metrics
 */
export function analyzePerformance(
  metrics: PerformanceMetric[],
  type?: PerformanceMetric['type'],
  thresholds: PerformanceThresholds = DEFAULT_THRESHOLDS
): PerformanceAnalysis {
  const filteredMetrics = type
    ? metrics.filter((m) => m.type === type)
    : metrics;

  if (filteredMetrics.length === 0) {
    return {
      totalMetrics: 0,
      avgDuration: 0,
      minDuration: 0,
      maxDuration: 0,
      p50: 0,
      p75: 0,
      p95: 0,
      p99: 0,
      slowOperations: [],
      memoryTrend: 'unknown',
      recommendations: [],
    };
  }

  const durations = filteredMetrics.map((m) => m.duration);
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

  // Find slow operations
  const threshold = type === 'render'
    ? thresholds.render.warning
    : type === 'api'
    ? thresholds.api.warning
    : Infinity;

  const slowOperations = filteredMetrics
    .filter((m) => m.duration > threshold)
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 10);

  // Analyze memory trend
  const memoryMetrics = filteredMetrics
    .filter((m) => m.memoryUsage)
    .slice(-20);

  let memoryTrend: 'increasing' | 'stable' | 'decreasing' | 'unknown' = 'unknown';
  if (memoryMetrics.length >= 10) {
    const firstHalf = memoryMetrics
      .slice(0, Math.floor(memoryMetrics.length / 2))
      .reduce((sum, m) => sum + (m.memoryUsage?.percentUsed || 0), 0) /
      Math.floor(memoryMetrics.length / 2);

    const secondHalf = memoryMetrics
      .slice(Math.floor(memoryMetrics.length / 2))
      .reduce((sum, m) => sum + (m.memoryUsage?.percentUsed || 0), 0) /
      Math.ceil(memoryMetrics.length / 2);

    if (secondHalf - firstHalf > 5) {
      memoryTrend = 'increasing';
    } else if (firstHalf - secondHalf > 5) {
      memoryTrend = 'decreasing';
    } else {
      memoryTrend = 'stable';
    }
  }

  // Generate recommendations
  const recommendations: string[] = [];

  if (avgDuration > threshold && type === 'render') {
    recommendations.push(
      'Average render time exceeds threshold. Consider using React.memo() or useMemo().'
    );
  }

  if (slowOperations.length > 5 && type === 'render') {
    recommendations.push(
      `${slowOperations.length} components have slow renders. Review component structure.`
    );
  }

  if (memoryTrend === 'increasing') {
    recommendations.push(
      'Memory usage is increasing. Check for memory leaks or large data structures.'
    );
  }

  const p95Value = percentile(durations, 95);
  if (p95Value > threshold * 2) {
    recommendations.push(
      'P95 latency is high. Investigate outliers and optimize critical paths.'
    );
  }

  if (type === 'api' && avgDuration > thresholds.api.warning) {
    recommendations.push(
      'API calls are slow. Consider implementing caching or optimizing queries.'
    );
  }

  return {
    totalMetrics: filteredMetrics.length,
    avgDuration,
    minDuration: Math.min(...durations),
    maxDuration: Math.max(...durations),
    p50: percentile(durations, 50),
    p75: percentile(durations, 75),
    p95: percentile(durations, 95),
    p99: percentile(durations, 99),
    slowOperations,
    memoryTrend,
    recommendations,
  };
}

/**
 * Get metrics grouped by name
 */
export function getMetricsByName(
  metrics: PerformanceMetric[],
  type?: PerformanceMetric['type']
): Map<string, PerformanceMetric[]> {
  const filtered = type ? metrics.filter((m) => m.type === type) : metrics;
  const grouped = new Map<string, PerformanceMetric[]>();

  filtered.forEach((metric) => {
    if (!grouped.has(metric.name)) {
      grouped.set(metric.name, []);
    }
    grouped.get(metric.name)!.push(metric);
  });

  return grouped;
}

/**
 * Get metrics for a time range
 */
export function getMetricsInTimeRange(
  metrics: PerformanceMetric[],
  startTime: number,
  endTime: number
): PerformanceMetric[] {
  return metrics.filter(
    (m) => m.timestamp >= startTime && m.timestamp <= endTime
  );
}

/**
 * Export metrics as JSON
 */
export function exportMetrics(metrics: PerformanceMetric[]): string {
  return JSON.stringify(
    {
      exportDate: new Date().toISOString(),
      totalMetrics: metrics.length,
      metrics,
    },
    null,
    2
  );
}

/**
 * Get performance summary for dashboard
 */
export function getPerformanceSummary() {
  const data = getHistoricalData();
  const now = Date.now();
  const last24h = getMetricsInTimeRange(data.metrics, now - 24 * 60 * 60 * 1000, now);
  const lastHour = getMetricsInTimeRange(data.metrics, now - 60 * 60 * 1000, now);

  return {
    total: data.totalRecorded,
    last24h: last24h.length,
    lastHour: lastHour.length,
    renderMetrics: analyzePerformance(data.metrics, 'render'),
    apiMetrics: analyzePerformance(data.metrics, 'api'),
    memoryMetrics: analyzePerformance(data.metrics, 'memory'),
    currentMemory: getMemoryUsage(),
  };
}
