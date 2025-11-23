/**
 * GET /api/marketplace/shopee/auth
 * Generate Shopee authorization URL for OAuth flow
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const partnerId = process.env.SHOPEE_PARTNER_ID;
    const partnerKey = process.env.SHOPEE_PARTNER_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (!partnerId || !partnerKey) {
      return NextResponse.json(
        { error: 'Shopee credentials not configured. Please set SHOPEE_PARTNER_ID and SHOPEE_PARTNER_KEY in .env' },
        { status: 500 }
      );
    }

    // Redirect URL where Shopee will send the auth code
    const redirectUri = `${appUrl}/api/marketplace/shopee/callback`;

    // Generate authorization URL
    const authUrl = `https://partner.shopeemobile.com/api/v2/shop/auth_partner?partner_id=${partnerId}&redirect=${encodeURIComponent(redirectUri)}`;

    return NextResponse.json({
      success: true,
      authUrl,
      redirectUri,
      instructions: {
        step1: 'User will be redirected to Shopee to authorize',
        step2: 'Shopee will redirect back to callback URL with auth code',
        step3: 'Callback endpoint will exchange code for access token',
        note: 'Auth code expires in 5-10 minutes - must be used immediately'
      }
    });
  } catch (error) {
    console.error('Error generating Shopee auth URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate authorization URL' },
      { status: 500 }
    );
  }
}
