import { NextRequest, NextResponse } from 'next/server';
import { createOpportunity, updateOpportunity, getOpportunitiesByCustomer, getSalesPipeline } from '@/lib/crm/service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const customerId = req.nextUrl.searchParams.get('customerId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    if (customerId) {
      const opportunities = await getOpportunitiesByCustomer(userId, customerId);
      return NextResponse.json({
        data: opportunities,
        total: opportunities.length,
      });
    } else {
      const pipeline = await getSalesPipeline(userId);
      return NextResponse.json({
        data: pipeline,
      });
    }
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    return NextResponse.json({ error: 'Failed to fetch opportunities' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, opportunityId, action, opportunityData } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    if (action === 'create') {
      const opportunity = await createOpportunity(userId, opportunityData);
      return NextResponse.json(opportunity, { status: 201 });
    } else if (action === 'update' && opportunityId) {
      const opportunity = await updateOpportunity(userId, opportunityId, opportunityData);
      return NextResponse.json(opportunity, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error managing opportunity:', error);
    return NextResponse.json({ error: 'Failed to manage opportunity' }, { status: 500 });
  }
}
