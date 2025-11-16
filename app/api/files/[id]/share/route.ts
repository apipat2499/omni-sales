/**
 * File Share API Route
 * POST /api/files/:id/share - Create share link
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getStorageManager } from '@/lib/storage/storage-manager';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();

    const {
      expiresIn = 3600, // Default 1 hour
      maxDownloads,
      password,
      allowedEmails,
      canDownload = true,
      canPreview = true,
      userId,
      tenantId,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get file metadata
    const { data: file, error: fetchError } = await supabase
      .from('files')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Generate unique share token
    const shareToken = crypto.randomBytes(32).toString('hex');

    // Calculate expiry date
    const expiresAt = expiresIn > 0
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : null;

    // Hash password if provided
    let passwordHash: string | null = null;
    if (password) {
      passwordHash = crypto
        .createHash('sha256')
        .update(password)
        .digest('hex');
    }

    // Create share record
    const { data: share, error: shareError } = await supabase
      .from('file_shares')
      .insert({
        file_id: id,
        tenant_id: tenantId || null,
        share_token: shareToken,
        share_type: 'link',
        password_hash: passwordHash,
        allowed_emails: allowedEmails || null,
        max_downloads: maxDownloads || null,
        can_download: canDownload,
        can_preview: canPreview,
        expires_at: expiresAt,
        is_active: true,
        created_by: userId,
      })
      .select()
      .single();

    if (shareError) {
      throw shareError;
    }

    // Generate share URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/share/${shareToken}`;

    // Create signed URL from storage provider
    const storageManager = getStorageManager();
    const signedUrlResult = await storageManager.createShareLink(file.storage_path, {
      expiresIn: expiresIn > 0 ? expiresIn : 86400, // Default to 24 hours if no expiry
      download: canDownload,
    });

    return NextResponse.json({
      success: true,
      share: {
        id: share.id,
        shareUrl,
        shareToken,
        expiresAt: share.expires_at,
        maxDownloads: share.max_downloads,
        downloadCount: share.download_count,
        canDownload: share.can_download,
        canPreview: share.can_preview,
        isActive: share.is_active,
        directUrl: signedUrlResult.url,
      },
    });
  } catch (error: any) {
    console.error('Share file error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create share link' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    // Get all shares for this file
    const { data: shares, error } = await supabase
      .from('file_shares')
      .select('*')
      .eq('file_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      shares,
    });
  } catch (error: any) {
    console.error('Get shares error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch shares' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get('shareId');

    if (!shareId) {
      return NextResponse.json(
        { error: 'Share ID is required' },
        { status: 400 }
      );
    }

    // Delete or deactivate share
    const { error } = await supabase
      .from('file_shares')
      .update({ is_active: false })
      .eq('id', shareId)
      .eq('file_id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Share link deactivated',
    });
  } catch (error: any) {
    console.error('Delete share error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete share' },
      { status: 500 }
    );
  }
}
