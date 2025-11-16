/**
 * POST /api/auth/webauthn/register/options
 * Generate registration options for WebAuthn credential enrollment
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import WebAuthnManager from '@/lib/auth/webauthn/webauthn-manager';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
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

    // Get existing credentials
    const { data: existingCredentials } = await supabase
      .from('user_credentials')
      .select('*')
      .eq('user_id', user.id);

    // Generate registration options
    const options = await WebAuthnManager.generateRegistrationOptions(
      user.id,
      user.email || user.id,
      user.user_metadata?.name || user.email || 'User',
      existingCredentials || []
    );

    // Store challenge in database
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minute expiry

    await supabase
      .from('webauthn_challenges')
      .insert({
        user_id: user.id,
        challenge: options.challenge,
        type: 'registration',
        expires_at: expiresAt.toISOString(),
      });

    return NextResponse.json(options);
  } catch (error) {
    console.error('Registration options error:', error);
    return NextResponse.json(
      { error: 'Failed to generate registration options' },
      { status: 500 }
    );
  }
}
