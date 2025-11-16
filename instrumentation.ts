/**
 * Next.js Instrumentation
 * This file runs before any other code in the application
 * Perfect for initializing monitoring tools like Sentry
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side instrumentation
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime instrumentation
    await import('./sentry.server.config');
  }
}
