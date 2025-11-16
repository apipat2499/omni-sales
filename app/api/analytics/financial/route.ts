import { NextRequest, NextResponse } from 'next/server';
import { getFinancialAnalytics, recordFinancialAnalytics } from '@/lib/analytics/service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const date = req.nextUrl.searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const analytics = await getFinancialAnalytics(userId, date);

    return NextResponse.json({
      data: analytics,
    });
  } catch (error) {
    console.error('Error fetching financial analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch financial analytics' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, analyticsDate, periodType, totalRevenue, totalCost, grossProfit, operatingExpenses, netProfit, grossMargin, operatingMargin, netMargin, revenueBySource, expenseByCategory, cashFlowData } = body;

    if (!userId || !analyticsDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const analytics = await recordFinancialAnalytics(userId, {
      analyticsDate,
      periodType,
      totalRevenue,
      totalCost,
      grossProfit,
      operatingExpenses,
      netProfit,
      grossMargin,
      operatingMargin,
      netMargin,
      revenueBySource,
      expenseByCategory,
      cashFlowData,
    });

    if (!analytics) {
      return NextResponse.json({ error: 'Failed to record analytics' }, { status: 500 });
    }

    return NextResponse.json(analytics, { status: 201 });
  } catch (error) {
    console.error('Error recording financial analytics:', error);
    return NextResponse.json({ error: 'Failed to record financial analytics' }, { status: 500 });
  }
}
