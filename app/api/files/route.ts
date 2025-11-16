/**
 * Files API Route
 * GET /api/files - List files
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const userId = searchParams.get('userId');
    const path = searchParams.get('path') || '/';
    const search = searchParams.get('search');
    const mimeType = searchParams.get('mimeType');
    const tags = searchParams.get('tags')?.split(',');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const includeDeleted = searchParams.get('includeDeleted') === 'true';

    // Build query
    let query = supabase
      .from('files')
      .select('*', { count: 'exact' });

    // Apply filters
    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (path) {
      query = query.eq('folder_path', path);
    }

    if (!includeDeleted) {
      query = query.eq('is_deleted', false);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (mimeType) {
      query = query.like('mime_type', `${mimeType}%`);
    }

    if (tags && tags.length > 0) {
      query = query.contains('tags', tags);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: files, error, count } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      files,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error: any) {
    console.error('Files list error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch files' },
      { status: 500 }
    );
  }
}
