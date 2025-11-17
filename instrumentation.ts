/**
 * Next.js Instrumentation
 * This file runs before any other code in the application
 * Perfect for initializing monitoring tools like Sentry and WebSocket server
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side instrumentation
    await import('./sentry.server.config');

    // Initialize WebSocket manager (actual server initialized in server.js)
    console.log('[Instrumentation] WebSocket manager loaded');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime instrumentation (use separate edge config)
    await import('./sentry.edge.config');
  }
}
