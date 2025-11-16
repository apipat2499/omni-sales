/**
 * File Download API Route
 * GET /api/files/:id/download - Download a file
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getStorageManager } from '@/lib/storage/storage-manager';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const shareToken = searchParams.get('token');

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

    // If share token provided, verify it
    if (shareToken) {
      const { data: share, error: shareError } = await supabase
        .from('file_shares')
        .select('*')
        .eq('share_token', shareToken)
        .eq('file_id', id)
        .single();

      if (shareError || !share || !share.is_active) {
        return NextResponse.json(
          { error: 'Invalid or expired share link' },
          { status: 403 }
        );
      }

      // Check expiry
      if (share.expires_at && new Date(share.expires_at) < new Date()) {
        return NextResponse.json(
          { error: 'Share link has expired' },
          { status: 403 }
        );
      }

      // Check max downloads
      if (
        share.max_downloads &&
        share.download_count >= share.max_downloads
      ) {
        return NextResponse.json(
          { error: 'Download limit reached' },
          { status: 403 }
        );
      }

      // Record download
      await supabase.from('file_downloads').insert({
        file_id: id,
        file_share_id: share.id,
        tenant_id: file.tenant_id,
        downloaded_by: null, // Anonymous
        download_method: 'share_link',
        file_size_bytes: file.size_bytes,
      });
    } else {
      // Record direct download
      await supabase.from('file_downloads').insert({
        file_id: id,
        tenant_id: file.tenant_id,
        download_method: 'direct',
        file_size_bytes: file.size_bytes,
      });
    }

    // Update last accessed timestamp
    await supabase
      .from('files')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('id', id);

    // Download from storage
    const storageManager = getStorageManager();
    const fileBlob = await storageManager.download(file.storage_path);

    if (!fileBlob) {
      return NextResponse.json(
        { error: 'Failed to download file from storage' },
        { status: 500 }
      );
    }

    // Return file as response
    return new NextResponse(fileBlob, {
      headers: {
        'Content-Type': file.mime_type,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(
          file.name
        )}"`,
        'Content-Length': file.size_bytes.toString(),
      },
    });
  } catch (error: any) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: error.message || 'Download failed' },
      { status: 500 }
    );
  }
}
