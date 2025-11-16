/**
 * Sentry Initialization Utilities
 * Shared initialization logic for both client and server
 */

import * as Sentry from '@sentry/nextjs';
import {
  getSentryConfig,
  isSentryConfigured,
  IGNORED_ERRORS,
  IGNORED_URLS,
} from './config';

/**
 * Common Sentry initialization options
 */
export function getCommonSentryOptions(): Sentry.BrowserOptions {
  const config = getSentryConfig();

  if (!isSentryConfigured()) {
    console.warn('Sentry is not configured. Error monitoring will be disabled.');
  }

  return {
    dsn: config.dsn,
    environment: config.environment,
    enabled: config.enabled,

    // Performance Monitoring
    tracesSampleRate: config.tracesSampleRate,

    // Session Replay
    replaysSessionSampleRate: config.replaysSessionSampleRate,
    replaysOnErrorSampleRate: config.replaysOnErrorSampleRate,

    // Ignore common errors
    ignoreErrors: IGNORED_ERRORS,
    denyUrls: IGNORED_URLS,

    // Automatically attach stack traces to messages
    attachStacktrace: true,

    // Send client reports
    sendClientReports: true,

    // Maximum breadcrumbs to keep
    maxBreadcrumbs: 50,

    // Normalize URLs
    normalizeDepth: 5,

    // Before send hook to filter/modify events
    beforeSend(event, hint) {
      // Don't send events if Sentry is disabled
      if (!config.enabled) {
        return null;
      }

      // Filter out development errors if needed
      if (config.environment === 'development') {
        console.log('Sentry Event (dev):', event);
      }

      return event;
    },

    // Before breadcrumb hook to filter/modify breadcrumbs
    beforeBreadcrumb(breadcrumb) {
      // Filter out console breadcrumbs in production
      if (config.environment === 'production' && breadcrumb.category === 'console') {
        return null;
      }

      return breadcrumb;
    },
  };
}

/**
 * Set user context for Sentry
 */
export function setSentryUser(user: {
  id: string;
  email?: string;
  username?: string;
}) {
  if (!isSentryConfigured()) return;

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
}

/**
 * Clear user context from Sentry
 */
export function clearSentryUser() {
  if (!isSentryConfigured()) return;

  Sentry.setUser(null);
}

/**
 * Set custom tags for Sentry
 */
export function setSentryTags(tags: Record<string, string | number | boolean>) {
  if (!isSentryConfigured()) return;

  Sentry.setTags(tags);
}

/**
 * Set custom context for Sentry
 */
export function setSentryContext(name: string, context: Record<string, any>) {
  if (!isSentryConfigured()) return;

  Sentry.setContext(name, context);
}

/**
 * Add a breadcrumb to Sentry
 */
export function addSentryBreadcrumb(breadcrumb: {
  message: string;
  category?: string;
  level?: Sentry.SeverityLevel;
  data?: Record<string, any>;
}) {
  if (!isSentryConfigured()) return;

  Sentry.addBreadcrumb({
    message: breadcrumb.message,
    category: breadcrumb.category || 'custom',
    level: breadcrumb.level || 'info',
    data: breadcrumb.data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Capture an exception in Sentry
 */
export function captureException(
  error: Error,
  context?: {
    tags?: Record<string, string | number | boolean>;
    extra?: Record<string, any>;
    level?: Sentry.SeverityLevel;
  }
) {
  if (!isSentryConfigured()) {
    console.error('Exception (Sentry disabled):', error, context);
    return;
  }

  Sentry.captureException(error, {
    tags: context?.tags,
    extra: context?.extra,
    level: context?.level || 'error',
  });
}

/**
 * Capture a message in Sentry
 */
export function captureMessage(
  message: string,
  context?: {
    tags?: Record<string, string | number | boolean>;
    extra?: Record<string, any>;
    level?: Sentry.SeverityLevel;
  }
) {
  if (!isSentryConfigured()) {
    console.log('Message (Sentry disabled):', message, context);
    return;
  }

  Sentry.captureMessage(message, {
    tags: context?.tags,
    extra: context?.extra,
    level: context?.level || 'info',
  });
}
