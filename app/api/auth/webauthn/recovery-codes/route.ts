/**
 * POST /api/auth/webauthn/recovery-codes
 * Generate new recovery codes for account recovery
 *
 * GET /api/auth/webauthn/recovery-codes
 * Check if user has recovery codes
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

    const body = await req.json();
    const { regenerate = false } = body;

    // If regenerating, mark old codes as used
    if (regenerate) {
      await supabase
        .from('recovery_codes')
        .update({ used: true, used_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('used', false);
    }

    // Generate new recovery codes
    const codes = WebAuthnManager.generateRecoveryCodes(10);

    // Hash and store codes
    const hashedCodes = await Promise.all(
      codes.map(async (code) => ({
        user_id: user.id,
        code_hash: await WebAuthnManager.hashRecoveryCode(code),
        used: false,
      }))
    );

    const { error: insertError } = await supabase
      .from('recovery_codes')
      .insert(hashedCodes);

    if (insertError) {
      console.error('Failed to store recovery codes:', insertError);
      return NextResponse.json(
        { error: 'Failed to generate recovery codes' },
        { status: 500 }
      );
    }

    // Return unhashed codes to user (only time they'll see them)
    return NextResponse.json({
      codes,
      generated_at: new Date().toISOString(),
      message: 'Store these codes in a safe place. You will not be able to see them again.',
    });
  } catch (error) {
    console.error('Recovery codes generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate recovery codes' },
      { status: 500 }
    );
  }
}

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

    // Count unused recovery codes
    const { data: codes, error } = await supabase
      .from('recovery_codes')
      .select('id, created_at')
      .eq('user_id', user.id)
      .eq('used', false);

    if (error) {
      console.error('Failed to fetch recovery codes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch recovery codes' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      has_codes: codes && codes.length > 0,
      count: codes?.length || 0,
      created_at: codes && codes.length > 0 ? codes[0].created_at : null,
    });
  } catch (error) {
    console.error('Recovery codes fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recovery codes' },
      { status: 500 }
    );
  }
}
