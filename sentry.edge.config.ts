/**
 * Sentry Edge Runtime Configuration
 * This file configures Sentry for Edge Runtime (middleware, edge functions)
 */

import * as Sentry from '@sentry/nextjs';
import { getCommonSentryOptions } from './lib/sentry/init';

const sentryOptions = getCommonSentryOptions();

Sentry.init({
  ...sentryOptions,

  // Edge runtime has limited integrations
  integrations: [],

  // Edge-specific options
  tracePropagationTargets: [
    'localhost',
    /^https:\/\/[^/]*\.vercel\.app/,
    /^https:\/\/[^/]*\.supabase\.co/,
    /^\//,
  ],
});
