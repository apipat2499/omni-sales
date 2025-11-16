/**
 * Performance Monitoring Hook
 * Enhanced hook for component performance tracking with re-render detection
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  recordRenderTime,
  recordAPICallTime,
  recordMemorySnapshot,
  recordInteractionTime,
  getMemoryUsage,
  getHistoricalData,
  analyzePerformance,
  type PerformanceMetric,
  type PerformanceAnalysis,
} from '@/lib/utils/performance-metrics';

export interface UsePerformanceMonitoringOptions {
  componentName: string;
  threshold?: number;
  trackMemory?: boolean;
  trackRerenders?: boolean;
  enabled?: boolean;
}

export interface PerformanceStats {
  currentRenderTime: number;
  averageRenderTime: number;
  totalRenders: number;
  slowRenders: number;
  rerenderCount: number;
  memoryUsage?: {
    current: number;
    average: number;
    trend: 'increasing' | 'stable' | 'decreasing' | 'unknown';
  };
}

/**
 * Hook for monitoring component performance
 */
export function usePerformanceMonitoring(
  options: UsePerformanceMonitoringOptions
) {
  const {
    componentName,
    threshold = 16,
    trackMemory = true,
    trackRerenders = true,
    enabled = true,
  } = options;

  const renderStartRef = useRef<number>(performance.now());
  const renderCountRef = useRef<number>(0);
  const rerenderCountRef = useRef<number>(0);
  const prevPropsRef = useRef<any>(null);
  const metricsRef = useRef<PerformanceMetric[]>([]);
  const mountTimeRef = useRef<number>(Date.now());

  const [stats, setStats] = useState<PerformanceStats>({
    currentRenderTime: 0,
    averageRenderTime: 0,
    totalRenders: 0,
    slowRenders: 0,
    rerenderCount: 0,
  });

  // Track re-renders
  useEffect(() => {
    if (!enabled) return;

    renderCountRef.current++;

    if (renderCountRef.current > 1 && trackRerenders) {
      rerenderCountRef.current++;
    }
  });

  // Measure render time
  useEffect(() => {
    if (!enabled) return;

    const renderEnd = performance.now();
    const renderTime = renderEnd - renderStartRef.current;

    // Record the metric
    const metric = recordRenderTime(componentName, renderTime, {
      renderCount: renderCountRef.current,
      rerenderCount: rerenderCountRef.current,
    });

    metricsRef.current.push(metric);

    // Keep only last 50 metrics in memory
    if (metricsRef.current.length > 50) {
      metricsRef.current.shift();
    }

    // Record memory if enabled
    if (trackMemory && renderCountRef.current % 5 === 0) {
      recordMemorySnapshot(`${componentName}-memory`);
    }

    // Update stats
    updateStats(renderTime);

    // Reset render start for next render
    renderStartRef.current = performance.now();
  });

  const updateStats = useCallback((currentRenderTime: number) => {
    const allMetrics = metricsRef.current;
    const renderTimes = allMetrics.map((m) => m.duration);
    const avgRenderTime =
      renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length || 0;

    const slowRenders = renderTimes.filter((t) => t > threshold).length;

    let memoryUsage;
    if (trackMemory) {
      const memoryMetrics = allMetrics
        .filter((m) => m.memoryUsage)
        .slice(-10);

      if (memoryMetrics.length > 0) {
        const currentMemory = getMemoryUsage();
        const avgMemory =
          memoryMetrics.reduce(
            (sum, m) => sum + (m.memoryUsage?.percentUsed || 0),
            0
          ) / memoryMetrics.length;

        // Determine trend
        let trend: 'increasing' | 'stable' | 'decreasing' | 'unknown' =
          'unknown';
        if (memoryMetrics.length >= 5) {
          const firstHalf =
            memoryMetrics
              .slice(0, Math.floor(memoryMetrics.length / 2))
              .reduce((sum, m) => sum + (m.memoryUsage?.percentUsed || 0), 0) /
            Math.floor(memoryMetrics.length / 2);
          const secondHalf =
            memoryMetrics
              .slice(Math.floor(memoryMetrics.length / 2))
              .reduce((sum, m) => sum + (m.memoryUsage?.percentUsed || 0), 0) /
            Math.ceil(memoryMetrics.length / 2);

          if (secondHalf - firstHalf > 2) {
            trend = 'increasing';
          } else if (firstHalf - secondHalf > 2) {
            trend = 'decreasing';
          } else {
            trend = 'stable';
          }
        }

        memoryUsage = {
          current: currentMemory?.percentUsed || 0,
          average: avgMemory,
          trend,
        };
      }
    }

    setStats({
      currentRenderTime,
      averageRenderTime: avgRenderTime,
      totalRenders: renderCountRef.current,
      slowRenders,
      rerenderCount: rerenderCountRef.current,
      memoryUsage,
    });
  }, [threshold, trackMemory]);

  const getReport = useCallback((): PerformanceAnalysis => {
    const data = getHistoricalData();
    const componentMetrics = data.metrics.filter(
      (m) => m.name === componentName && m.type === 'render'
    );
    return analyzePerformance(componentMetrics, 'render');
  }, [componentName]);

  const compareWithHistorical = useCallback(() => {
    const data = getHistoricalData();
    const now = Date.now();
    const sessionStart = mountTimeRef.current;

    const currentSession = data.metrics.filter(
      (m) =>
        m.name === componentName &&
        m.type === 'render' &&
        m.timestamp >= sessionStart
    );

    const previousSession = data.metrics.filter(
      (m) =>
        m.name === componentName &&
        m.type === 'render' &&
        m.timestamp < sessionStart &&
        m.timestamp >= sessionStart - 24 * 60 * 60 * 1000 // Last 24h before this session
    );

    const currentAvg =
      currentSession.reduce((sum, m) => sum + m.duration, 0) /
        currentSession.length || 0;
    const previousAvg =
      previousSession.reduce((sum, m) => sum + m.duration, 0) /
        previousSession.length || 0;

    const improvement = previousAvg > 0
      ? ((previousAvg - currentAvg) / previousAvg) * 100
      : 0;

    return {
      currentAverage: currentAvg,
      previousAverage: previousAvg,
      improvement,
      trend: improvement > 5 ? 'improving' : improvement < -5 ? 'degrading' : 'stable',
      currentSample: currentSession.length,
      previousSample: previousSession.length,
    };
  }, [componentName]);

  const reset = useCallback(() => {
    renderCountRef.current = 0;
    rerenderCountRef.current = 0;
    metricsRef.current = [];
    setStats({
      currentRenderTime: 0,
      averageRenderTime: 0,
      totalRenders: 0,
      slowRenders: 0,
      rerenderCount: 0,
    });
  }, []);

  return {
    stats,
    getReport,
    compareWithHistorical,
    reset,
    isSlowRender: stats.currentRenderTime > threshold,
  };
}

/**
 * Hook for tracking API call performance
 */
export function useAPIPerformance(operationName: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [lastDuration, setLastDuration] = useState<number>(0);
  const [callCount, setCallCount] = useState(0);

  const measureAPI = useCallback(
    async <T,>(apiCall: () => Promise<T>): Promise<T> => {
      setIsLoading(true);
      const startTime = performance.now();

      try {
        const result = await apiCall();
        const duration = performance.now() - startTime;

        recordAPICallTime(operationName, duration, {
          success: true,
          callNumber: callCount + 1,
        });

        setLastDuration(duration);
        setCallCount((c) => c + 1);

        return result;
      } catch (error) {
        const duration = performance.now() - startTime;

        recordAPICallTime(operationName, duration, {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          callNumber: callCount + 1,
        });

        setLastDuration(duration);
        setCallCount((c) => c + 1);

        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [operationName, callCount]
  );

  const getReport = useCallback(() => {
    const data = getHistoricalData();
    const apiMetrics = data.metrics.filter(
      (m) => m.name === operationName && m.type === 'api'
    );
    return analyzePerformance(apiMetrics, 'api');
  }, [operationName]);

  return {
    measureAPI,
    isLoading,
    lastDuration,
    callCount,
    getReport,
  };
}

/**
 * Hook for monitoring memory usage
 */
export function useMemoryMonitoring(interval: number = 5000) {
  const [memoryInfo, setMemoryInfo] = useState(getMemoryUsage());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !performance.memory) {
      return;
    }

    intervalRef.current = setInterval(() => {
      const info = getMemoryUsage();
      setMemoryInfo(info);

      if (info) {
        recordMemorySnapshot('periodic-snapshot');
      }
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [interval]);

  const forceGarbageCollection = useCallback(() => {
    if (typeof window !== 'undefined' && 'gc' in window) {
      (window as any).gc();
      setTimeout(() => {
        setMemoryInfo(getMemoryUsage());
      }, 100);
    } else {
      console.warn('Garbage collection not available. Run Chrome with --expose-gc flag.');
    }
  }, []);

  return {
    memoryInfo,
    forceGarbageCollection,
    isHighUsage: memoryInfo && memoryInfo.percentUsed > 70,
    isCriticalUsage: memoryInfo && memoryInfo.percentUsed > 90,
  };
}

/**
 * Hook for tracking user interactions
 */
export function useInteractionTracking() {
  const trackInteraction = useCallback(
    (interactionName: string, callback: () => void) => {
      const startTime = performance.now();

      return () => {
        callback();
        const duration = performance.now() - startTime;
        recordInteractionTime(interactionName, duration);
      };
    },
    []
  );

  const trackAsyncInteraction = useCallback(
    async (interactionName: string, callback: () => Promise<void>) => {
      const startTime = performance.now();

      try {
        await callback();
        const duration = performance.now() - startTime;
        recordInteractionTime(interactionName, duration, { success: true });
      } catch (error) {
        const duration = performance.now() - startTime;
        recordInteractionTime(interactionName, duration, {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    },
    []
  );

  return {
    trackInteraction,
    trackAsyncInteraction,
  };
}

/**
 * Hook for comparing performance across time periods
 */
export function usePerformanceComparison(
  metricName: string,
  type: PerformanceMetric['type']
) {
  const [comparison, setComparison] = useState<{
    current: PerformanceAnalysis;
    previous: PerformanceAnalysis;
    percentChange: number;
  } | null>(null);

  useEffect(() => {
    const data = getHistoricalData();
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;

    const currentMetrics = data.metrics.filter(
      (m) =>
        m.name === metricName &&
        m.type === type &&
        m.timestamp >= oneDayAgo &&
        m.timestamp <= now
    );

    const previousMetrics = data.metrics.filter(
      (m) =>
        m.name === metricName &&
        m.type === type &&
        m.timestamp >= twoDaysAgo &&
        m.timestamp < oneDayAgo
    );

    const current = analyzePerformance(currentMetrics, type);
    const previous = analyzePerformance(previousMetrics, type);

    const percentChange =
      previous.avgDuration > 0
        ? ((current.avgDuration - previous.avgDuration) / previous.avgDuration) *
          100
        : 0;

    setComparison({
      current,
      previous,
      percentChange,
    });
  }, [metricName, type]);

  return comparison;
}
