/**
 * POST /api/auth/webauthn/recovery-codes/verify
 * Verify recovery code and create session
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
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and code are required' },
        { status: 400 }
      );
    }

    // Get user by email
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or code' },
        { status: 401 }
      );
    }

    // Get user's unused recovery codes
    const { data: recoveryCodes } = await supabase
      .from('recovery_codes')
      .select('*')
      .eq('user_id', user.id)
      .eq('used', false);

    if (!recoveryCodes || recoveryCodes.length === 0) {
      return NextResponse.json(
        { error: 'No recovery codes available' },
        { status: 401 }
      );
    }

    // Verify code against all unused codes
    let matchedCode = null;
    for (const recoveryCode of recoveryCodes) {
      const isValid = await WebAuthnManager.verifyRecoveryCode(
        code,
        recoveryCode.code_hash
      );

      if (isValid) {
        matchedCode = recoveryCode;
        break;
      }
    }

    if (!matchedCode) {
      // Log failed attempt
      await supabase.rpc('log_auth_attempt', {
        p_user_id: user.id,
        p_credential_id: null,
        p_auth_method: 'recovery_code',
        p_success: false,
        p_ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        p_user_agent: req.headers.get('user-agent'),
        p_error_message: 'Invalid recovery code',
      });

      return NextResponse.json(
        { error: 'Invalid recovery code' },
        { status: 401 }
      );
    }

    // Mark code as used
    await supabase
      .from('recovery_codes')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('id', matchedCode.id);

    // Log successful attempt
    await supabase.rpc('log_auth_attempt', {
      p_user_id: user.id,
      p_credential_id: null,
      p_auth_method: 'recovery_code',
      p_success: true,
      p_ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      p_user_agent: req.headers.get('user-agent'),
    });

    // Count remaining codes
    const { data: remainingCodes } = await supabase
      .from('recovery_codes')
      .select('id')
      .eq('user_id', user.id)
      .eq('used', false);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name,
      },
      remaining_codes: remainingCodes?.length || 0,
      message: 'Authentication successful. Implement session creation based on your auth strategy.',
    });
  } catch (error) {
    console.error('Recovery code verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify recovery code' },
      { status: 500 }
    );
  }
}
