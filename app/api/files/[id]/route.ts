/**
 * Individual File API Route
 * GET /api/files/:id - Get file metadata
 * DELETE /api/files/:id - Delete file
 * PATCH /api/files/:id - Update file metadata
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

    const { data: file, error } = await supabase
      .from('files')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Update last accessed timestamp
    await supabase
      .from('files')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('id', id);

    return NextResponse.json({
      success: true,
      file,
    });
  } catch (error: any) {
    console.error('Get file error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch file' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';

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

    if (permanent) {
      // Permanently delete file from storage
      const storageManager = getStorageManager();
      const deleteResult = await storageManager.delete(file.storage_path);

      if (!deleteResult.success) {
        return NextResponse.json(
          { error: deleteResult.error || 'Failed to delete file from storage' },
          { status: 500 }
        );
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', id);

      if (dbError) {
        throw dbError;
      }

      // Update storage usage
      await updateStorageUsage(file.user_id, file.tenant_id, -file.size_bytes);

      return NextResponse.json({
        success: true,
        message: 'File permanently deleted',
      });
    } else {
      // Soft delete (mark as deleted)
      const { error: updateError } = await supabase
        .from('files')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json({
        success: true,
        message: 'File moved to trash',
      });
    }
  } catch (error: any) {
    console.error('Delete file error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete file' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();

    const { name, description, tags, labels, isPublic } = body;

    // Build update object
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (tags !== undefined) updates.tags = tags;
    if (labels !== undefined) updates.labels = labels;
    if (isPublic !== undefined) updates.is_public = isPublic;

    const { data: file, error } = await supabase
      .from('files')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      file,
    });
  } catch (error: any) {
    console.error('Update file error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update file' },
      { status: 500 }
    );
  }
}

async function updateStorageUsage(userId: string, tenantId: string, sizeDelta: number) {
  const { data: usage } = await supabase
    .from('file_storage_usage')
    .select('*')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .single();

  if (usage) {
    await supabase
      .from('file_storage_usage')
      .update({
        total_size_bytes: Math.max(0, usage.total_size_bytes + sizeDelta),
        total_files: Math.max(0, usage.total_files + (sizeDelta < 0 ? -1 : 0)),
      })
      .eq('user_id', userId)
      .eq('tenant_id', tenantId);
  }
}
