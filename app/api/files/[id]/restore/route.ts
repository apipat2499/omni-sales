/**
 * File Restore API Route
 * POST /api/files/:id/restore - Restore a previous version
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

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();
    const { versionNumber, userId } = body;

    if (!versionNumber || !userId) {
      return NextResponse.json(
        { error: 'Version number and user ID are required' },
        { status: 400 }
      );
    }

    // Get the file
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('*')
      .eq('id', id)
      .single();

    if (fileError || !file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Get the version to restore
    const { data: version, error: versionError } = await supabase
      .from('file_versions')
      .select('*')
      .eq('file_id', id)
      .eq('version_number', versionNumber)
      .single();

    if (versionError || !version) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      );
    }

    // Copy the old version to a new file in storage
    const storageManager = getStorageManager();
    const timestamp = Date.now();
    const newPath = `${file.storage_path}_restored_${timestamp}`;

    const copyResult = await storageManager.copy(version.storage_path, newPath);

    if (!copyResult.success) {
      return NextResponse.json(
        { error: copyResult.error || 'Failed to restore version' },
        { status: 500 }
      );
    }

    // Get current max version number
    const { data: maxVersionData } = await supabase
      .from('file_versions')
      .select('version_number')
      .eq('file_id', id)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    const newVersionNumber = (maxVersionData?.version_number || 0) + 1;

    // Update file metadata
    const { data: updatedFile, error: updateError } = await supabase
      .from('files')
      .update({
        storage_path: newPath,
        size_bytes: version.size_bytes,
        mime_type: version.mime_type,
        md5_hash: version.md5_hash,
        sha256_hash: version.sha256_hash,
        version_number: newVersionNumber,
        is_latest_version: true,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Create new version record
    await supabase.from('file_versions').insert({
      file_id: id,
      tenant_id: file.tenant_id,
      version_number: newVersionNumber,
      storage_path: newPath,
      name: version.name,
      size_bytes: version.size_bytes,
      mime_type: version.mime_type,
      md5_hash: version.md5_hash,
      sha256_hash: version.sha256_hash,
      change_description: `Restored from version ${versionNumber}`,
      created_by: userId,
    });

    return NextResponse.json({
      success: true,
      file: updatedFile,
      message: `File restored to version ${versionNumber}`,
    });
  } catch (error: any) {
    console.error('Restore version error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to restore version' },
      { status: 500 }
    );
  }
}
