import { NextResponse } from 'next/server';
import { getTenantHealthReport } from '@/lib/tenant/tenant-health';

export async function GET() {
  try {
    const report = await getTenantHealthReport();
    return NextResponse.json({
      success: true,
      ...report,
    });
  } catch (error: any) {
    console.error('Failed to load tenant health:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load tenant health' },
      { status: 500 }
    );
  }
}
