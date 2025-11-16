/**
 * Sentry Configuration
 * Environment-specific settings for Sentry error monitoring
 */

export interface SentryConfig {
  dsn: string;
  environment: string;
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
  enabled: boolean;
}

/**
 * Get Sentry configuration from environment variables
 */
export function getSentryConfig(): SentryConfig {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',

    // Trace sampling rates
    tracesSampleRate: parseFloat(
      process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ||
      (isProduction ? '0.1' : '1.0')
    ),

    // Session replay sampling rates
    replaysSessionSampleRate: parseFloat(
      process.env.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE ||
      (isProduction ? '0.1' : '0.0')
    ),

    replaysOnErrorSampleRate: parseFloat(
      process.env.NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE ||
      (isProduction ? '1.0' : '0.0')
    ),

    // Disable in development by default (can be overridden)
    enabled: process.env.NEXT_PUBLIC_SENTRY_ENABLED === 'true' || isProduction,
  };
}

/**
 * Check if Sentry is properly configured
 */
export function isSentryConfigured(): boolean {
  const config = getSentryConfig();
  return config.enabled && !!config.dsn;
}

/**
 * Environment identifiers for Sentry
 */
export const SENTRY_ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
} as const;

/**
 * Default ignored errors - common errors that don't need reporting
 */
export const IGNORED_ERRORS = [
  // Browser extensions
  /chrome-extension:\/\//i,
  /moz-extension:\/\//i,

  // Network errors that are expected
  /NetworkError/i,
  /Failed to fetch/i,
  /Network request failed/i,

  // Cancelled requests
  /AbortError/i,
  /The user aborted a request/i,

  // Common non-critical errors
  /ResizeObserver loop limit exceeded/i,
  /ResizeObserver loop completed with undelivered notifications/i,

  // Third-party script errors
  /Script error\./i,
];

/**
 * URLs to ignore when reporting errors
 */
export const IGNORED_URLS = [
  // Browser extensions
  /^chrome-extension:\/\//,
  /^moz-extension:\/\//,

  // Third-party scripts
  /googletagmanager\.com/,
  /google-analytics\.com/,
  /hotjar\.com/,
];
