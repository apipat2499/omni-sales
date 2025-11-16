/**
 * Cache Metrics Tracking
 * Monitors cache performance and provides insights
 */

export type CacheOperation = 'hit' | 'miss' | 'set' | 'delete' | 'invalidate' | 'error';

export interface CacheMetric {
  operation: CacheOperation;
  key: string;
  timestamp: number;
  duration: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  invalidations: number;
  errors: number;
  totalOperations: number;
  hitRate: number;
  averageLatency: number;
  latencyP95: number;
  latencyP99: number;
}

// In-memory metrics storage
class MetricsStore {
  private metrics: CacheMetric[] = [];
  private maxMetrics = 10000; // Keep last 10k metrics
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    invalidations: 0,
    errors: 0,
  };
  private latencies: number[] = [];
  private maxLatencies = 1000; // Keep last 1k latencies

  track(operation: CacheOperation, key: string, duration: number): void {
    const metric: CacheMetric = {
      operation,
      key,
      timestamp: Date.now(),
      duration,
    };

    // Add to metrics array
    this.metrics.push(metric);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Update stats
    this.stats[operation === 'invalidate' ? 'invalidations' : operation]++;

    // Track latency
    this.latencies.push(duration);
    if (this.latencies.length > this.maxLatencies) {
      this.latencies.shift();
    }
  }

  getStats(timeWindow?: number): CacheStats {
    const now = Date.now();
    const windowStart = timeWindow ? now - timeWindow : 0;

    // Filter metrics by time window if specified
    const relevantMetrics = timeWindow
      ? this.metrics.filter(m => m.timestamp >= windowStart)
      : this.metrics;

    // Calculate stats from relevant metrics
    const stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      invalidations: 0,
      errors: 0,
    };

    for (const metric of relevantMetrics) {
      if (metric.operation === 'invalidate') {
        stats.invalidations++;
      } else {
        stats[metric.operation]++;
      }
    }

    const totalOperations = stats.hits + stats.misses;
    const hitRate = totalOperations > 0 ? stats.hits / totalOperations : 0;

    // Calculate latency percentiles
    const sortedLatencies = [...this.latencies].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedLatencies.length * 0.95);
    const p99Index = Math.floor(sortedLatencies.length * 0.99);

    const averageLatency =
      this.latencies.length > 0
        ? this.latencies.reduce((sum, lat) => sum + lat, 0) / this.latencies.length
        : 0;

    return {
      ...stats,
      totalOperations: stats.hits + stats.misses,
      hitRate,
      averageLatency,
      latencyP95: sortedLatencies[p95Index] || 0,
      latencyP99: sortedLatencies[p99Index] || 0,
    };
  }

  getRecentMetrics(limit = 100): CacheMetric[] {
    return this.metrics.slice(-limit);
  }

  getMetricsByOperation(operation: CacheOperation, limit = 100): CacheMetric[] {
    return this.metrics.filter(m => m.operation === operation).slice(-limit);
  }

  getSlowestOperations(limit = 10): CacheMetric[] {
    return [...this.metrics].sort((a, b) => b.duration - a.duration).slice(0, limit);
  }

  getKeyStats(key: string): {
    hits: number;
    misses: number;
    sets: number;
    lastAccess: number | null;
  } {
    const keyMetrics = this.metrics.filter(m => m.key === key);

    return {
      hits: keyMetrics.filter(m => m.operation === 'hit').length,
      misses: keyMetrics.filter(m => m.operation === 'miss').length,
      sets: keyMetrics.filter(m => m.operation === 'set').length,
      lastAccess: keyMetrics.length > 0 ? keyMetrics[keyMetrics.length - 1].timestamp : null,
    };
  }

  getTopKeys(limit = 10): Array<{ key: string; accessCount: number }> {
    const keyCounts = new Map<string, number>();

    for (const metric of this.metrics) {
      if (metric.operation === 'hit' || metric.operation === 'miss') {
        keyCounts.set(metric.key, (keyCounts.get(metric.key) || 0) + 1);
      }
    }

    return Array.from(keyCounts.entries())
      .map(([key, accessCount]) => ({ key, accessCount }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit);
  }

  reset(): void {
    this.metrics = [];
    this.latencies = [];
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      invalidations: 0,
      errors: 0,
    };
  }
}

// Singleton metrics store
const metricsStore = new MetricsStore();

/**
 * Track a cache operation
 */
export function trackCacheOperation(
  operation: CacheOperation,
  key: string,
  duration: number
): void {
  metricsStore.track(operation, key, duration);

  // Log slow operations (> 100ms)
  if (duration > 100) {
    console.warn(`Slow cache ${operation}: ${key} took ${duration}ms`);
  }
}

/**
 * Get cache statistics
 * @param timeWindow Time window in milliseconds (optional)
 */
export function getCacheStats(timeWindow?: number): CacheStats {
  return metricsStore.getStats(timeWindow);
}

/**
 * Get recent cache metrics
 */
export function getRecentMetrics(limit = 100): CacheMetric[] {
  return metricsStore.getRecentMetrics(limit);
}

/**
 * Get metrics by operation type
 */
export function getMetricsByOperation(operation: CacheOperation, limit = 100): CacheMetric[] {
  return metricsStore.getMetricsByOperation(operation, limit);
}

/**
 * Get slowest cache operations
 */
export function getSlowestOperations(limit = 10): CacheMetric[] {
  return metricsStore.getSlowestOperations(limit);
}

/**
 * Get statistics for a specific key
 */
export function getKeyStats(key: string): {
  hits: number;
  misses: number;
  sets: number;
  lastAccess: number | null;
} {
  return metricsStore.getKeyStats(key);
}

/**
 * Get most frequently accessed keys
 */
export function getTopKeys(limit = 10): Array<{ key: string; accessCount: number }> {
  return metricsStore.getTopKeys(limit);
}

/**
 * Reset all metrics
 */
export function resetMetrics(): void {
  metricsStore.reset();
}

/**
 * Log cache stats to console
 */
export function logCacheStats(timeWindow?: number): void {
  const stats = getCacheStats(timeWindow);
  const windowDesc = timeWindow ? `last ${timeWindow / 1000}s` : 'all time';

  console.log(`\n=== Cache Statistics (${windowDesc}) ===`);
  console.log(`Total Operations: ${stats.totalOperations}`);
  console.log(`Hits: ${stats.hits} (${(stats.hitRate * 100).toFixed(2)}%)`);
  console.log(`Misses: ${stats.misses}`);
  console.log(`Sets: ${stats.sets}`);
  console.log(`Deletes: ${stats.deletes}`);
  console.log(`Invalidations: ${stats.invalidations}`);
  console.log(`Errors: ${stats.errors}`);
  console.log(`Average Latency: ${stats.averageLatency.toFixed(2)}ms`);
  console.log(`P95 Latency: ${stats.latencyP95.toFixed(2)}ms`);
  console.log(`P99 Latency: ${stats.latencyP99.toFixed(2)}ms`);
  console.log('===================================\n');
}

/**
 * Monitor cache performance and log slow queries
 */
export function monitorCachePerformance(enabled = true): void {
  if (!enabled) return;

  // Log stats every 5 minutes
  setInterval(() => {
    const stats = getCacheStats(5 * 60 * 1000); // Last 5 minutes

    if (stats.totalOperations > 0) {
      console.log('Cache Performance Report:');
      console.log(`  Hit Rate: ${(stats.hitRate * 100).toFixed(2)}%`);
      console.log(`  Avg Latency: ${stats.averageLatency.toFixed(2)}ms`);

      if (stats.hitRate < 0.5) {
        console.warn('  ⚠️ Low cache hit rate detected');
      }

      if (stats.averageLatency > 50) {
        console.warn('  ⚠️ High average latency detected');
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Export metrics for monitoring systems
 */
export function exportMetrics(): {
  stats: CacheStats;
  topKeys: Array<{ key: string; accessCount: number }>;
  slowestOps: CacheMetric[];
} {
  return {
    stats: getCacheStats(),
    topKeys: getTopKeys(20),
    slowestOps: getSlowestOperations(20),
  };
}
