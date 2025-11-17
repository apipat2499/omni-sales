import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Create Supabase client for Server Components
 * This is for use in Next.js App Router server components and route handlers
 */
export function createClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn('Supabase credentials not configured');
    return null;
  }

  try {
    return createSupabaseClient(url, key, {
      auth: {
        persistSession: false,
      },
    });
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    return null;
  }
}

/**
 * Create Supabase client with auth for Server Components
 */
export async function createServerClient(): Promise<SupabaseClient | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  const cookieStore = await cookies();
  const authToken = cookieStore.get('sb-access-token')?.value ||
                    cookieStore.get('supabase-auth-token')?.value;

  const client = createSupabaseClient(url, key, {
    auth: {
      persistSession: false,
    },
  });

  if (authToken) {
    // Set the auth token if available
    client.auth.setSession({
      access_token: authToken,
      refresh_token: '',
    });
  }

  return client;
}
