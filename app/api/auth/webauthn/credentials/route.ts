/**
 * GET /api/auth/webauthn/credentials
 * List user's WebAuthn credentials
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    // Get user from session
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify session
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's credentials
    const { data: credentials, error } = await supabase
      .from('user_credentials')
      .select('id, credential_id, device_type, name, created_at, last_used_at, transports')
      .eq('user_id', user.id)
      .order('last_used_at', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Failed to fetch credentials:', error);
      return NextResponse.json(
        { error: 'Failed to fetch credentials' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      credentials: credentials || [],
    });
  } catch (error) {
    console.error('Credentials fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credentials' },
      { status: 500 }
    );
  }
}
