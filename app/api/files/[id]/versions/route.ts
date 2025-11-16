/**
 * File Versions API Route
 * GET /api/files/:id/versions - Get file version history
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    // Get file versions
    const { data: versions, error } = await supabase
      .from('file_versions')
      .select('*')
      .eq('file_id', id)
      .order('version_number', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      versions,
    });
  } catch (error: any) {
    console.error('Get versions error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch versions' },
      { status: 500 }
    );
  }
}
