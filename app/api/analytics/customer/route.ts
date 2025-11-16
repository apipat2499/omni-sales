import { NextRequest, NextResponse } from 'next/server';
import { getCustomerAnalytics, recordCustomerAnalytics } from '@/lib/analytics/service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const date = req.nextUrl.searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const analytics = await getCustomerAnalytics(userId, date);

    return NextResponse.json({
      data: analytics,
    });
  } catch (error) {
    console.error('Error fetching customer analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch customer analytics' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, analyticsDate, totalCustomers, newCustomers, returningCustomers, activeCustomers, customerRetentionRate, averageCustomerLifetimeValue, totalCustomerSpend, customerAcquisitionCost, churnRate, customersBySegment, customersByLocation, repeatPurchaseRate } = body;

    if (!userId || !analyticsDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const analytics = await recordCustomerAnalytics(userId, {
      analyticsDate,
      totalCustomers,
      newCustomers,
      returningCustomers,
      activeCustomers,
      customerRetentionRate,
      averageCustomerLifetimeValue,
      totalCustomerSpend,
      customerAcquisitionCost,
      churnRate,
      customersBySegment,
      customersByLocation,
      repeatPurchaseRate,
    });

    if (!analytics) {
      return NextResponse.json({ error: 'Failed to record analytics' }, { status: 500 });
    }

    return NextResponse.json(analytics, { status: 201 });
  } catch (error) {
    console.error('Error recording customer analytics:', error);
    return NextResponse.json({ error: 'Failed to record customer analytics' }, { status: 500 });
  }
}
