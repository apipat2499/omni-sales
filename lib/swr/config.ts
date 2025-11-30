import type { SWRConfiguration } from 'swr';

/**
 * Global SWR configuration
 *
 * This configuration is applied to all SWR hooks unless overridden
 */
export const swrConfig: SWRConfiguration = {
  // Revalidation
  revalidateOnFocus: true, // Revalidate when window regains focus
  revalidateOnReconnect: true, // Revalidate when reconnecting to network
  revalidateIfStale: true, // Revalidate if data is stale
  revalidateOnMount: true, // Revalidate on mount if stale

  // Deduplication
  dedupingInterval: 2000, // Deduplicate requests within 2 seconds

  // Retry
  errorRetryCount: 3, // Retry failed requests 3 times
  errorRetryInterval: 5000, // Wait 5 seconds between retries
  shouldRetryOnError: true,

  // Performance
  suspense: false, // Set to true if using React Suspense
  loadingTimeout: 3000, // Show loading state after 3 seconds
  focusThrottleInterval: 5000, // Throttle revalidation on focus to once per 5 seconds

  // Polling (disabled by default)
  refreshInterval: 0, // Set to a number (in ms) to enable polling

  // Error handling
  onError: (error, key) => {
    console.error(`SWR Error [${key}]:`, error);
  },

  // Success handling
  onSuccess: (data, key) => {
    // Can be used for analytics or logging
    // console.log(`SWR Success [${key}]:`, data);
  },
};

/**
 * SWR configuration for real-time data (orders, products)
 * More aggressive revalidation for data that changes frequently
 */
export const swrRealtimeConfig: SWRConfiguration = {
  ...swrConfig,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  refreshInterval: 0, // Real-time updates handled by Supabase Realtime
  dedupingInterval: 1000, // Shorter deduplication for real-time data
};

/**
 * SWR configuration for static/semi-static data
 * Less aggressive revalidation for data that rarely changes
 */
export const swrStaticConfig: SWRConfiguration = {
  ...swrConfig,
  revalidateOnFocus: false,
  revalidateIfStale: false,
  dedupingInterval: 60000, // 1 minute
  refreshInterval: 300000, // Refresh every 5 minutes
};
