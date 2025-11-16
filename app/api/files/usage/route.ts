/**
 * Storage Usage API Route
 * GET /api/files/usage - Get storage usage and quota information
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

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get storage usage
    const { data: usage, error } = await supabase
      .from('file_storage_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId || null)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned"
      throw error;
    }

    // If no usage record exists, create one
    if (!usage) {
      const defaultQuota = parseInt(process.env.STORAGE_QUOTA_PER_USER || '10737418240'); // 10GB
      const { data: newUsage, error: createError } = await supabase
        .from('file_storage_usage')
        .insert({
          tenant_id: tenantId || null,
          user_id: userId,
          total_files: 0,
          total_size_bytes: 0,
          quota_bytes: defaultQuota,
          quota_files: 10000,
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      return NextResponse.json({
        success: true,
        usage: newUsage,
        percentUsed: 0,
        remaining: defaultQuota,
      });
    }

    const percentUsed = (usage.total_size_bytes / usage.quota_bytes) * 100;
    const remaining = usage.quota_bytes - usage.total_size_bytes;

    return NextResponse.json({
      success: true,
      usage,
      percentUsed: Math.round(percentUsed * 100) / 100,
      remaining,
      breakdown: {
        documents: {
          count: usage.documents_count,
          size: usage.documents_size_bytes,
        },
        images: {
          count: usage.images_count,
          size: usage.images_size_bytes,
        },
        videos: {
          count: usage.videos_count,
          size: usage.videos_size_bytes,
        },
        archives: {
          count: usage.archives_count,
          size: usage.archives_size_bytes,
        },
        other: {
          count: usage.other_count,
          size: usage.other_size_bytes,
        },
      },
    });
  } catch (error: any) {
    console.error('Get usage error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch storage usage' },
      { status: 500 }
    );
  }
}
