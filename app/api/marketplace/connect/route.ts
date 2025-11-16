/**
 * POST /api/marketplace/connect
 * Connect a new marketplace shop
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { marketplace_type, shop_id, shop_name, access_token, refresh_token, credentials } = body;

    // Validate required fields
    if (!marketplace_type || !shop_id || !shop_name || !access_token || !credentials) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate marketplace type
    if (!['shopee', 'lazada'].includes(marketplace_type)) {
      return NextResponse.json(
        { error: 'Invalid marketplace type. Must be shopee or lazada' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if connection already exists
    const { data: existingConnection } = await supabase
      .from('marketplace_connections')
      .select('id')
      .eq('marketplace_type', marketplace_type)
      .eq('shop_id', shop_id)
      .single();

    if (existingConnection) {
      // Update existing connection
      const { data, error } = await supabase
        .from('marketplace_connections')
        .update({
          shop_name,
          access_token,
          refresh_token,
          credentials,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingConnection.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating marketplace connection:', error);
        return NextResponse.json(
          { error: 'Failed to update marketplace connection' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Marketplace connection updated successfully',
        connection: data,
      });
    }

    // Create new connection
    const { data, error } = await supabase
      .from('marketplace_connections')
      .insert({
        marketplace_type,
        shop_id,
        shop_name,
        access_token,
        refresh_token,
        credentials,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating marketplace connection:', error);
      return NextResponse.json(
        { error: 'Failed to create marketplace connection' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Marketplace connection created successfully',
      connection: data,
    });
  } catch (error) {
    console.error('Error in marketplace connect API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
