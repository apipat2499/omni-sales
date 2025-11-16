/**
 * GET /api/marketplace/shops
 * List all connected marketplace shops
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const marketplace_type = searchParams.get('marketplace_type');
    const is_active = searchParams.get('is_active');

    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase
      .from('marketplace_connections')
      .select('*')
      .order('created_at', { ascending: false });

    if (marketplace_type) {
      query = query.eq('marketplace_type', marketplace_type);
    }

    if (is_active !== null) {
      query = query.eq('is_active', is_active === 'true');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching marketplace connections:', error);
      return NextResponse.json(
        { error: 'Failed to fetch marketplace connections' },
        { status: 500 }
      );
    }

    // Remove sensitive data before sending
    const sanitizedData = data.map((connection) => ({
      id: connection.id,
      marketplace_type: connection.marketplace_type,
      shop_id: connection.shop_id,
      shop_name: connection.shop_name,
      is_active: connection.is_active,
      last_sync_at: connection.last_sync_at,
      created_at: connection.created_at,
      updated_at: connection.updated_at,
    }));

    return NextResponse.json({
      success: true,
      shops: sanitizedData,
      total: sanitizedData.length,
    });
  } catch (error) {
    console.error('Error in marketplace shops API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('id');

    if (!connectionId) {
      return NextResponse.json(
        { error: 'Connection ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('marketplace_connections')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', connectionId);

    if (error) {
      console.error('Error deactivating marketplace connection:', error);
      return NextResponse.json(
        { error: 'Failed to deactivate marketplace connection' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Marketplace connection deactivated successfully',
    });
  } catch (error) {
    console.error('Error in marketplace shops DELETE API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
