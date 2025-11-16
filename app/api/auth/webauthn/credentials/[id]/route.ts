/**
 * DELETE /api/auth/webauthn/credentials/[id]
 * Remove a WebAuthn credential
 *
 * PATCH /api/auth/webauthn/credentials/[id]
 * Rename a WebAuthn credential
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const credentialId = params.id;

    // Check if credential belongs to user
    const { data: credential } = await supabase
      .from('user_credentials')
      .select('*')
      .eq('id', credentialId)
      .eq('user_id', user.id)
      .single();

    if (!credential) {
      return NextResponse.json(
        { error: 'Credential not found' },
        { status: 404 }
      );
    }

    // Check if this is the last credential (prevent lockout)
    const { data: credentials } = await supabase
      .from('user_credentials')
      .select('id')
      .eq('user_id', user.id);

    if (credentials && credentials.length <= 1) {
      return NextResponse.json(
        { error: 'Cannot remove last credential. Add another authentication method first.' },
        { status: 400 }
      );
    }

    // Delete credential
    const { error: deleteError } = await supabase
      .from('user_credentials')
      .delete()
      .eq('id', credentialId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Failed to delete credential:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete credential' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Credential removed successfully',
    });
  } catch (error) {
    console.error('Credential deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete credential' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const credentialId = params.id;
    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Invalid name' },
        { status: 400 }
      );
    }

    // Update credential name
    const { data: credential, error: updateError } = await supabase
      .from('user_credentials')
      .update({ name })
      .eq('id', credentialId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError || !credential) {
      console.error('Failed to update credential:', updateError);
      return NextResponse.json(
        { error: 'Failed to update credential' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      credential,
    });
  } catch (error) {
    console.error('Credential update error:', error);
    return NextResponse.json(
      { error: 'Failed to update credential' },
      { status: 500 }
    );
  }
}
