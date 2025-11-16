/**
 * Sentry Client-side Configuration
 * This file configures Sentry for the browser/client side
 */

import * as Sentry from '@sentry/nextjs';
import { getCommonSentryOptions } from './lib/sentry/init';

const sentryOptions = getCommonSentryOptions();

Sentry.init({
  ...sentryOptions,

  // Integrations specific to client-side
  integrations: [
    // Capture user interactions
    Sentry.browserTracingIntegration({
      tracePropagationTargets: [
        'localhost',
        /^https:\/\/[^/]*\.vercel\.app/,
        /^\//,
      ],
      // Track navigation
      enableLongTask: true,
      enableInp: true,
    }),

    // Session replay
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),

    // Breadcrumbs for console messages
    Sentry.breadcrumbsIntegration({
      console: true,
      dom: true,
      fetch: true,
      history: true,
      sentry: true,
      xhr: true,
    }),
  ],

  // Track components
  tracePropagationTargets: [
    'localhost',
    /^https:\/\/[^/]*\.vercel\.app/,
    /^\//,
  ],
});

// Capture unhandled promise rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    Sentry.captureException(event.reason, {
      tags: {
        type: 'unhandled_rejection',
      },
    });
  });

  // Capture global errors
  window.addEventListener('error', (event) => {
    Sentry.captureException(event.error, {
      tags: {
        type: 'global_error',
      },
    });
  });
}
