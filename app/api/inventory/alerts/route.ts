import { NextRequest, NextResponse } from 'next/server';
import { checkLowStockAlerts } from '@/lib/inventory/service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    const alerts = await checkLowStockAlerts(userId);
    return NextResponse.json({ data: alerts, total: alerts.length });
  } catch (error) {
    console.error('Error checking alerts:', error);
    return NextResponse.json({ error: 'Failed to check alerts' }, { status: 500 });
  }
}
