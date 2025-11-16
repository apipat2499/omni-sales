import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Singleton instance
let supabaseClient: SupabaseClient | null = null;

/**
 * Initialize and get Supabase client with lazy loading
 * Gracefully handles missing environment variables
 */
export function getSupabaseClient(): SupabaseClient | null {
  // Return existing instance if available
  if (supabaseClient) {
    return supabaseClient;
  }

  // Get environment variables
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Graceful fallback when credentials are not set
  if (!url || !key) {
    if (typeof window !== 'undefined') {
      console.warn('Supabase credentials not configured. Running in offline mode.');
    }
    return null;
  }

  // Validate URL format
  try {
    new URL(url);
  } catch (error) {
    console.error('Invalid Supabase URL format:', error);
    return null;
  }

  // Create client with enhanced configuration
  try {
    supabaseClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-application-name': 'omni-sales',
        },
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });

    return supabaseClient;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
}

/**
 * Check if Supabase is available and configured
 */
export function isSupabaseAvailable(): boolean {
  return getSupabaseClient() !== null;
}

/**
 * Reset the Supabase client instance (useful for testing)
 */
export function resetSupabaseClient(): void {
  supabaseClient = null;
}

/**
 * Lazy-loaded export for backward compatibility
 * Returns a proxy that delegates to the actual client
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get: (target, prop) => {
    const client = getSupabaseClient();
    if (!client) {
      // Return undefined for any property access when client is not available
      return undefined;
    }
    return (client as any)[prop];
  },
});

// Export the client getter as default
export default getSupabaseClient;
