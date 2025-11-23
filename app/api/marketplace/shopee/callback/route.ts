/**
 * GET /api/marketplace/shopee/callback
 * Handles OAuth callback from Shopee
 * Receives auth code and exchanges it for access token
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createShopeeClient } from '@/lib/integrations/marketplace/shopee/client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const shopIdStr = searchParams.get('shop_id');

    // Check for required parameters
    if (!code || !shopIdStr) {
      return NextResponse.redirect(
        new URL('/marketplace?error=missing_code_or_shop_id', request.url)
      );
    }

    const shopId = parseInt(shopIdStr, 10);

    // Get Shopee credentials from environment
    const partnerId = process.env.SHOPEE_PARTNER_ID;
    const partnerKey = process.env.SHOPEE_PARTNER_KEY;

    if (!partnerId || !partnerKey) {
      return NextResponse.redirect(
        new URL('/marketplace?error=missing_shopee_credentials', request.url)
      );
    }

    // Create Shopee client
    const shopeeClient = createShopeeClient({
      partnerId: parseInt(partnerId, 10),
      partnerKey: partnerKey,
      shopId: shopId,
      accessToken: '', // Will get this from OAuth
    });

    // Exchange code for access token
    let authResponse;
    try {
      authResponse = await shopeeClient.getAccessToken(code, shopId);
    } catch (error: any) {
      console.error('Error exchanging code for token:', error);

      // Handle specific Shopee API errors
      if (error.message?.includes('error_invalid_code')) {
        return NextResponse.redirect(
          new URL('/marketplace?error=code_expired&message=Authorization code has expired. Please try again.', request.url)
        );
      }

      return NextResponse.redirect(
        new URL(`/marketplace?error=token_exchange_failed&message=${encodeURIComponent(error.message || 'Unknown error')}`, request.url)
      );
    }

    // Get shop info (optional - for display name)
    const shopName = `Shopee Shop ${shopId}`;

    // Save to database
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if connection already exists
    const { data: existingConnection } = await supabase
      .from('marketplace_connections')
      .select('id')
      .eq('marketplace_type', 'shopee')
      .eq('shop_id', shopIdStr)
      .single();

    const connectionData = {
      marketplace_type: 'shopee',
      shop_id: shopIdStr,
      shop_name: shopName,
      access_token: authResponse.access_token,
      refresh_token: authResponse.refresh_token,
      credentials: {
        partner_id: parseInt(partnerId, 10),
        partner_key: partnerKey,
        expire_in: authResponse.expire_in,
        authorized_at: new Date().toISOString(),
      },
      is_active: true,
    };

    if (existingConnection) {
      // Update existing connection
      const { error } = await supabase
        .from('marketplace_connections')
        .update({
          ...connectionData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingConnection.id);

      if (error) {
        console.error('Error updating marketplace connection:', error);
        return NextResponse.redirect(
          new URL('/marketplace?error=database_error', request.url)
        );
      }
    } else {
      // Create new connection
      const { error } = await supabase
        .from('marketplace_connections')
        .insert(connectionData);

      if (error) {
        console.error('Error creating marketplace connection:', error);
        return NextResponse.redirect(
          new URL('/marketplace?error=database_error', request.url)
        );
      }
    }

    // Success - redirect to marketplace page
    return NextResponse.redirect(
      new URL('/marketplace?success=shopee_connected&shop_id=' + shopIdStr, request.url)
    );
  } catch (error) {
    console.error('Error in Shopee callback:', error);
    return NextResponse.redirect(
      new URL('/marketplace?error=callback_failed', request.url)
    );
  }
}
