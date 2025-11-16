import { NextRequest, NextResponse } from 'next/server';
import { brandingService } from '@/lib/tenant/branding-service';

/**
 * GET /api/tenants/:tenantId/branding - Get tenant branding
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const { tenantId } = params;

    const branding = await brandingService.getBranding(tenantId);

    return NextResponse.json({
      success: true,
      branding,
    });
  } catch (error: any) {
    console.error('Error fetching branding:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch branding' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/tenants/:tenantId/branding - Update tenant branding
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const { tenantId } = params;
    const body = await req.json();

    await brandingService.updateBranding(tenantId, body);

    return NextResponse.json({
      success: true,
      message: 'Branding updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating branding:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update branding' },
      { status: 500 }
    );
  }
}
