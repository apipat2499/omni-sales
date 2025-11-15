import { NextRequest, NextResponse } from 'next/server';
import { getOperationalAnalytics, recordOperationalAnalytics } from '@/lib/analytics/service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const date = req.nextUrl.searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const analytics = await getOperationalAnalytics(userId, date);

    return NextResponse.json({
      data: analytics,
    });
  } catch (error) {
    console.error('Error fetching operational analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch operational analytics' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, analyticsDate, orderFulfillmentRate, averageFulfillmentTime, shippingOnTimeRate, inventoryAccuracy, stockOutIncidents, warehouseUtilization, averageComplaintResolutionTime, complaintRate, returnRate, customerSatisfactionScore, npsScore } = body;

    if (!userId || !analyticsDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const analytics = await recordOperationalAnalytics(userId, {
      analyticsDate,
      orderFulfillmentRate,
      averageFulfillmentTime,
      shippingOnTimeRate,
      inventoryAccuracy,
      stockOutIncidents,
      warehouseUtilization,
      averageComplaintResolutionTime,
      complaintRate,
      returnRate,
      customerSatisfactionScore,
      npsScore,
    });

    if (!analytics) {
      return NextResponse.json({ error: 'Failed to record analytics' }, { status: 500 });
    }

    return NextResponse.json(analytics, { status: 201 });
  } catch (error) {
    console.error('Error recording operational analytics:', error);
    return NextResponse.json({ error: 'Failed to record operational analytics' }, { status: 500 });
  }
}
