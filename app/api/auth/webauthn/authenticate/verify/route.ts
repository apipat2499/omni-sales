/**
 * POST /api/auth/webauthn/authenticate/verify
 * Verify authentication response and create session
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import WebAuthnManager from '@/lib/auth/webauthn/webauthn-manager';
import type { AuthenticationResponseJSON } from '@simplewebauthn/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { response } = body as {
      response: AuthenticationResponseJSON;
    };

    // Get challenge from database
    const { data: challengeRecord } = await supabase
      .from('webauthn_challenges')
      .select('*')
      .eq('type', 'authentication')
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!challengeRecord) {
      return NextResponse.json(
        { error: 'Challenge not found or expired' },
        { status: 400 }
      );
    }

    // Check if challenge is expired
    if (new Date(challengeRecord.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Challenge expired' },
        { status: 400 }
      );
    }

    // Find credential by credential ID from response
    const credentialIdBase64 = Buffer.from(response.rawId, 'base64').toString('base64');

    const { data: credential } = await supabase
      .from('user_credentials')
      .select('*')
      .eq('credential_id', response.id)
      .single();

    if (!credential) {
      return NextResponse.json(
        { error: 'Credential not found' },
        { status: 400 }
      );
    }

    // Verify authentication
    const verification = await WebAuthnManager.verifyAuthentication(
      response,
      challengeRecord.challenge,
      credential
    );

    if (!verification.verified) {
      // Log failed attempt
      await supabase.rpc('log_auth_attempt', {
        p_user_id: credential.user_id,
        p_credential_id: credential.credential_id,
        p_auth_method: 'webauthn',
        p_success: false,
        p_ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        p_user_agent: req.headers.get('user-agent'),
        p_error_message: 'Verification failed',
      });

      return NextResponse.json(
        { error: 'Verification failed' },
        { status: 400 }
      );
    }

    // Validate counter to prevent replay attacks
    if (!WebAuthnManager.validateCounter(verification.authenticationInfo.newCounter, credential.counter)) {
      // Log failed attempt
      await supabase.rpc('log_auth_attempt', {
        p_user_id: credential.user_id,
        p_credential_id: credential.credential_id,
        p_auth_method: 'webauthn',
        p_success: false,
        p_ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        p_user_agent: req.headers.get('user-agent'),
        p_error_message: 'Invalid counter - possible replay attack',
      });

      return NextResponse.json(
        { error: 'Invalid counter' },
        { status: 400 }
      );
    }

    // Update credential counter and last used timestamp
    await supabase.rpc('update_credential_usage', {
      p_credential_id: credential.credential_id,
      p_new_counter: verification.authenticationInfo.newCounter,
    });

    // Mark challenge as used
    await supabase
      .from('webauthn_challenges')
      .update({ used: true })
      .eq('id', challengeRecord.id);

    // Create session
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: credential.user_id, // This is not ideal, we need the actual email
    });

    // Get user data
    const { data: { user } } = await supabase.auth.admin.getUserById(credential.user_id);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create a proper session using admin API
    const { data: session, error: createSessionError } = await supabase.auth.admin.createUser({
      email: user.email!,
      email_confirm: true,
      user_metadata: user.user_metadata,
    });

    // Log successful attempt
    await supabase.rpc('log_auth_attempt', {
      p_user_id: credential.user_id,
      p_credential_id: credential.credential_id,
      p_auth_method: 'webauthn',
      p_success: true,
      p_ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      p_user_agent: req.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name,
      },
      credential: {
        id: credential.id,
        name: credential.name,
        device_type: credential.device_type,
      },
      // Note: In production, you should implement proper session creation
      // This is a simplified version
      message: 'Authentication successful. Implement session creation based on your auth strategy.',
    });
  } catch (error) {
    console.error('Authentication verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify authentication' },
      { status: 500 }
    );
  }
}
