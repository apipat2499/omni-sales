import { useState, useCallback } from 'react';

export interface RetryConfig {
  maxAttempts?: number;          // Maximum number of attempts (default: 3)
  initialDelay?: number;         // Initial delay in ms (default: 1000)
  maxDelay?: number;             // Maximum delay in ms (default: 10000)
  backoffMultiplier?: number;    // Exponential backoff multiplier (default: 2)
  shouldRetry?: (error: any) => boolean; // Function to determine if should retry
}

export interface RetryState {
  isLoading: boolean;
  error: Error | null;
  attempt: number;
  isRetrying: boolean;
}

/**
 * Hook for retrying async operations with exponential backoff
 */
export function useRetry<T>(
  config: RetryConfig = {}
) {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    shouldRetry = () => true,
  } = config;

  const [state, setState] = useState<RetryState>({
    isLoading: false,
    error: null,
    attempt: 0,
    isRetrying: false,
  });

  const calculateDelay = useCallback(
    (attempt: number): number => {
      const exponentialDelay = initialDelay * Math.pow(backoffMultiplier, attempt - 1);
      return Math.min(exponentialDelay, maxDelay);
    },
    [initialDelay, backoffMultiplier, maxDelay]
  );

  const execute = useCallback(
    async (fn: () => Promise<T>): Promise<T | null> => {
      setState({
        isLoading: true,
        error: null,
        attempt: 0,
        isRetrying: false,
      });

      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          setState((prev) => ({
            ...prev,
            attempt,
            isRetrying: attempt > 1,
          }));

          const result = await fn();
          setState({
            isLoading: false,
            error: null,
            attempt,
            isRetrying: false,
          });
          return result;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));

          if (attempt < maxAttempts && shouldRetry(error)) {
            const delay = calculateDelay(attempt);
            await new Promise((resolve) => setTimeout(resolve, delay));
          } else {
            setState({
              isLoading: false,
              error: lastError,
              attempt,
              isRetrying: false,
            });
            return null;
          }
        }
      }

      setState({
        isLoading: false,
        error: lastError,
        attempt: maxAttempts,
        isRetrying: false,
      });
      return null;
    },
    [maxAttempts, calculateDelay, shouldRetry]
  );

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      attempt: 0,
      isRetrying: false,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

/**
 * Retry with specific strategies for common error types
 */
export function shouldRetryOnNetworkError(error: any): boolean {
  if (!error) return true;

  // Network errors
  if (error.name === 'NetworkError' || error.message?.includes('network')) {
    return true;
  }

  // Timeout errors
  if (error.code === 'ECONNABORTED' || error.name === 'AbortError') {
    return true;
  }

  // Server errors (5xx)
  if (error.status >= 500) {
    return true;
  }

  return false;
}

/**
 * Retry everything except client errors
 */
export function shouldRetryExceptClientError(error: any): boolean {
  if (!error) return true;

  // Don't retry 4xx errors (except 408, 429, 503 which are retriable)
  if (error.status >= 400 && error.status < 500) {
    if (error.status !== 408 && error.status !== 429) {
      return false;
    }
  }

  return true;
}
