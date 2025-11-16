import { useEffect, useRef, useCallback } from 'react';

export interface PerformanceMetrics {
  renderTime: number;
  componentName: string;
  timestamp: Date;
  memoryUsage?: {
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
  };
}

export interface PerformanceReport {
  metrics: PerformanceMetrics[];
  averageRenderTime: number;
  maxRenderTime: number;
  minRenderTime: number;
  totalRenders: number;
  slowRenders: number;
  slowRenderThreshold: number;
}

/**
 * Performance monitoring hook for measuring component render times
 */
export function usePerformanceMonitoring(
  componentName: string,
  threshold: number = 100 // milliseconds
) {
  const renderStartRef = useRef<number>(0);
  const metricsRef = useRef<PerformanceMetrics[]>([]);

  // Mark render start
  renderStartRef.current = performance.now();

  // Mark render end and log
  useEffect(() => {
    const renderEnd = performance.now();
    const renderTime = renderEnd - renderStartRef.current;

    const metric: PerformanceMetrics = {
      renderTime,
      componentName,
      timestamp: new Date(),
    };

    // Add memory usage if available
    if (performance.memory) {
      metric.memoryUsage = {
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        usedJSHeapSize: performance.memory.usedJSHeapSize,
      };
    }

    metricsRef.current.push(metric);

    // Log slow renders
    if (renderTime > threshold) {
      console.warn(
        `[Performance] ${componentName} took ${renderTime.toFixed(2)}ms to render (threshold: ${threshold}ms)`
      );
    }

    // Keep only last 100 metrics
    if (metricsRef.current.length > 100) {
      metricsRef.current.shift();
    }
  });

  const getReport = useCallback((): PerformanceReport => {
    const metrics = metricsRef.current;
    const renderTimes = metrics.map((m) => m.renderTime);

    if (renderTimes.length === 0) {
      return {
        metrics: [],
        averageRenderTime: 0,
        maxRenderTime: 0,
        minRenderTime: 0,
        totalRenders: 0,
        slowRenders: 0,
        slowRenderThreshold: threshold,
      };
    }

    const slowRenders = renderTimes.filter((time) => time > threshold).length;

    return {
      metrics,
      averageRenderTime:
        renderTimes.reduce((a, b) => a + b) / renderTimes.length,
      maxRenderTime: Math.max(...renderTimes),
      minRenderTime: Math.min(...renderTimes),
      totalRenders: metrics.length,
      slowRenders,
      slowRenderThreshold: threshold,
    };
  }, [threshold]);

  const reset = useCallback(() => {
    metricsRef.current = [];
  }, []);

  return {
    getReport,
    reset,
    getMetrics: () => metricsRef.current,
  };
}

/**
 * Hook for measuring async operation performance
 */
export function useAsyncPerformance(operationName: string) {
  const operationsRef = useRef<
    Array<{
      name: string;
      startTime: number;
      endTime: number;
      duration: number;
      success: boolean;
    }>
  >([]);

  const startOperation = useCallback(() => {
    const startTime = performance.now();

    return async <T,>(
      operation: () => Promise<T>
    ): Promise<{ result: T; duration: number }> => {
      try {
        const result = await operation();
        const endTime = performance.now();
        const duration = endTime - startTime;

        operationsRef.current.push({
          name: operationName,
          startTime,
          endTime,
          duration,
          success: true,
        });

        if (duration > 1000) {
          console.warn(
            `[Performance] ${operationName} took ${duration.toFixed(2)}ms`
          );
        }

        return { result, duration };
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;

        operationsRef.current.push({
          name: operationName,
          startTime,
          endTime,
          duration,
          success: false,
        });

        throw error;
      }
    };
  }, [operationName]);

  const getReport = useCallback(() => {
    const operations = operationsRef.current;
    const durations = operations.map((op) => op.duration);

    if (durations.length === 0) {
      return {
        operationName,
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        averageDuration: 0,
        maxDuration: 0,
        minDuration: 0,
        operations: [],
      };
    }

    return {
      operationName,
      totalOperations: operations.length,
      successfulOperations: operations.filter((op) => op.success).length,
      failedOperations: operations.filter((op) => !op.success).length,
      averageDuration: durations.reduce((a, b) => a + b) / durations.length,
      maxDuration: Math.max(...durations),
      minDuration: Math.min(...durations),
      operations,
    };
  }, [operationName]);

  const reset = useCallback(() => {
    operationsRef.current = [];
  }, []);

  return {
    startOperation,
    getReport,
    reset,
    getOperations: () => operationsRef.current,
  };
}

/**
 * Hook for measuring page load performance
 */
export function usePageLoadPerformance() {
  const metricsRef = useRef<PerformanceMetrics | null>(null);

  useEffect(() => {
    // Wait for page load to complete
    window.addEventListener('load', () => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      if (perfData) {
        metricsRef.current = {
          renderTime: perfData.loadEventEnd - perfData.loadEventStart,
          componentName: 'page-load',
          timestamp: new Date(),
          memoryUsage: performance.memory
            ? {
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                usedJSHeapSize: performance.memory.usedJSHeapSize,
              }
            : undefined,
        };

        console.log('[Performance] Page load metrics:', {
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
          totalTime: perfData.loadEventEnd - perfData.fetchStart,
        });
      }
    });
  }, []);

  const getMetrics = useCallback(() => {
    return metricsRef.current;
  }, []);

  return { getMetrics };
}

/**
 * Global performance monitor for multiple components
 */
export class GlobalPerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics[]> = new Map();

  record(metric: PerformanceMetrics) {
    if (!this.metrics.has(metric.componentName)) {
      this.metrics.set(metric.componentName, []);
    }

    this.metrics.get(metric.componentName)!.push(metric);

    // Keep max 1000 metrics per component
    const componentMetrics = this.metrics.get(metric.componentName)!;
    if (componentMetrics.length > 1000) {
      componentMetrics.shift();
    }
  }

  getReport(componentName?: string) {
    if (componentName) {
      const metrics = this.metrics.get(componentName) || [];
      const renderTimes = metrics.map((m) => m.renderTime);

      if (renderTimes.length === 0) {
        return null;
      }

      return {
        componentName,
        metrics,
        averageRenderTime:
          renderTimes.reduce((a, b) => a + b) / renderTimes.length,
        maxRenderTime: Math.max(...renderTimes),
        minRenderTime: Math.min(...renderTimes),
        totalRenders: metrics.length,
      };
    }

    // Return all components
    const reports: Record<string, any> = {};
    this.metrics.forEach((metrics, componentName) => {
      const renderTimes = metrics.map((m) => m.renderTime);
      reports[componentName] = {
        averageRenderTime:
          renderTimes.reduce((a, b) => a + b) / renderTimes.length,
        maxRenderTime: Math.max(...renderTimes),
        minRenderTime: Math.min(...renderTimes),
        totalRenders: metrics.length,
      };
    });

    return reports;
  }

  clear(componentName?: string) {
    if (componentName) {
      this.metrics.delete(componentName);
    } else {
      this.metrics.clear();
    }
  }

  exportReport() {
    return JSON.stringify(
      Object.fromEntries(
        Array.from(this.metrics.entries()).map(([name, metrics]) => [
          name,
          {
            totalRenders: metrics.length,
            averageTime: metrics.reduce((a, b) => a + b.renderTime, 0) / metrics.length,
            metrics: metrics.slice(-10), // Last 10 metrics
          },
        ])
      ),
      null,
      2
    );
  }
}

// Global instance
export const globalPerformanceMonitor = new GlobalPerformanceMonitor();
