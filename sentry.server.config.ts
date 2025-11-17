/**
 * Sentry Server-side Configuration
 * This file configures Sentry for the Node.js/server side ONLY
 * For Edge Runtime, use sentry.edge.config.ts
 */

import * as Sentry from '@sentry/nextjs';
import { getCommonSentryOptions } from './lib/sentry/init';

const sentryOptions = getCommonSentryOptions();

// Only initialize if we're in Node.js runtime
if (typeof process !== 'undefined' && process.versions?.node) {
  Sentry.init({
    ...sentryOptions,

    // Integrations specific to server-side
    integrations: [
      // HTTP integration for Node.js
      Sentry.httpIntegration(),

      // Node profiling
      Sentry.nodeProfilingIntegration(),
    ],

    // Server-specific options
    includeLocalVariables: true,

    // Track database queries and external HTTP requests
    tracePropagationTargets: [
      'localhost',
      /^https:\/\/[^/]*\.vercel\.app/,
      /^https:\/\/[^/]*\.supabase\.co/,
      /^\//,
    ],
  });

  // Capture unhandled promise rejections on server
  process.on('unhandledRejection', (reason: Error | any) => {
    Sentry.captureException(reason, {
      tags: {
        type: 'unhandled_rejection',
        context: 'server',
      },
    });
  });

  // Capture uncaught exceptions on server
  process.on('uncaughtException', (error: Error) => {
    Sentry.captureException(error, {
      tags: {
        type: 'uncaught_exception',
        context: 'server',
      },
    });
  });
}
