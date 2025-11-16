/**
 * POST /api/auth/webauthn/register/verify
 * Verify registration response and store credential
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import WebAuthnManager from '@/lib/auth/webauthn/webauthn-manager';
import type { RegistrationResponseJSON } from '@simplewebauthn/types';

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

    const body = await req.json();
    const { response, deviceType, credentialName } = body as {
      response: RegistrationResponseJSON;
      deviceType: 'platform' | 'cross-platform';
      credentialName?: string;
    };

    // Get challenge from database
    const { data: challengeRecord } = await supabase
      .from('webauthn_challenges')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'registration')
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

    // Verify registration
    const verification = await WebAuthnManager.verifyRegistration(
      response,
      challengeRecord.challenge
    );

    if (!verification.verified) {
      return NextResponse.json(
        { error: 'Verification failed' },
        { status: 400 }
      );
    }

    // Prepare credential data
    const credentialData = WebAuthnManager.prepareCredentialForStorage(
      user.id,
      verification,
      deviceType,
      credentialName || WebAuthnManager.getDeviceName(deviceType)
    );

    // Store credential in database
    const { data: credential, error: insertError } = await supabase
      .from('user_credentials')
      .insert(credentialData)
      .select()
      .single();

    if (insertError) {
      console.error('Failed to store credential:', insertError);
      return NextResponse.json(
        { error: 'Failed to store credential' },
        { status: 500 }
      );
    }

    // Mark challenge as used
    await supabase
      .from('webauthn_challenges')
      .update({ used: true })
      .eq('id', challengeRecord.id);

    // Log the registration
    await supabase.rpc('log_auth_attempt', {
      p_user_id: user.id,
      p_credential_id: credential.credential_id,
      p_auth_method: 'webauthn',
      p_success: true,
      p_ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      p_user_agent: req.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      credential,
    });
  } catch (error) {
    console.error('Registration verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify registration' },
      { status: 500 }
    );
  }
}
