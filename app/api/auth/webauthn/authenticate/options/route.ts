/**
 * POST /api/auth/webauthn/authenticate/options
 * Generate authentication options for WebAuthn login
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
    const body = await req.json();
    const { email } = body;

    let userId: string | null = null;
    let userCredentials = [];

    // If email provided, get user's credentials
    if (email) {
      // Get user by email
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const user = users.find(u => u.email === email);

      if (user) {
        userId = user.id;

        // Get user's credentials
        const { data: credentials } = await supabase
          .from('user_credentials')
          .select('*')
          .eq('user_id', user.id);

        userCredentials = credentials || [];
      }
    }

    // Generate authentication options
    const options = await WebAuthnManager.generateAuthenticationOptions(
      userCredentials
    );

    // Store challenge in database
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minute expiry

    await supabase
      .from('webauthn_challenges')
      .insert({
        user_id: userId,
        challenge: options.challenge,
        type: 'authentication',
        expires_at: expiresAt.toISOString(),
      });

    return NextResponse.json(options);
  } catch (error) {
    console.error('Authentication options error:', error);
    return NextResponse.json(
      { error: 'Failed to generate authentication options' },
      { status: 500 }
    );
  }
}
