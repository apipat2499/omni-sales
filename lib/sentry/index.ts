/**
 * Sentry Integration - Main Export File
 * Re-exports all Sentry utilities for easy importing
 */

// Configuration
export {
  getSentryConfig,
  isSentryConfigured,
  SENTRY_ENVIRONMENTS,
  IGNORED_ERRORS,
  IGNORED_URLS,
  type SentryConfig,
} from './config';

// Initialization and core utilities
export {
  getCommonSentryOptions,
  setSentryUser,
  clearSentryUser,
  setSentryTags,
  setSentryContext,
  addSentryBreadcrumb,
  captureException,
  captureMessage,
} from './init';

// Middleware for API routes
export {
  withSentry,
  apiErrorHandler,
  createErrorResponse,
  createAPIRoute,
} from './middleware';

// Breadcrumbs tracking
export {
  trackUserAction,
  trackAPICall,
  trackNavigation,
  trackDataOperation,
  trackAuth,
  trackStateChange,
  trackPerformance,
} from './breadcrumbs';

// Re-export Sentry SDK for advanced usage
export * as Sentry from '@sentry/nextjs';
