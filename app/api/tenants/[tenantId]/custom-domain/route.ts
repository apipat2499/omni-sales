import { NextRequest, NextResponse } from 'next/server';
import { tenantManager } from '@/lib/tenant/tenant-manager';

/**
 * POST /api/tenants/:tenantId/custom-domain - Setup custom domain
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const { tenantId } = params;
    const body = await req.json();
    const { customDomain } = body;

    if (!customDomain) {
      return NextResponse.json(
        { error: 'Custom domain is required' },
        { status: 400 }
      );
    }

    // Validate domain format
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/;
    if (!domainRegex.test(customDomain.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid domain format' },
        { status: 400 }
      );
    }

    // Setup custom domain
    const result = await tenantManager.setupCustomDomain(tenantId, customDomain);

    return NextResponse.json({
      success: true,
      message: 'Custom domain setup initiated',
      verificationToken: result.verificationToken,
      dnsRecords: result.dnsRecords,
      instructions: 'Please add the DNS records to your domain provider and verify the domain.',
    });
  } catch (error: any) {
    console.error('Error setting up custom domain:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to setup custom domain' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/tenants/:tenantId/custom-domain - Verify custom domain
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const { tenantId } = params;

    const verified = await tenantManager.verifyCustomDomain(tenantId);

    if (verified) {
      return NextResponse.json({
        success: true,
        message: 'Custom domain verified successfully',
        verified: true,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Domain verification failed. Please check your DNS records.',
        verified: false,
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error verifying custom domain:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify custom domain' },
      { status: 500 }
    );
  }
}
