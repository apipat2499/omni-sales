import { NextRequest, NextResponse } from 'next/server';
import { createLead, updateLead, getLeads, scoreLead } from '@/lib/crm/service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const status = req.nextUrl.searchParams.get('status');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const leads = await getLeads(userId, status || undefined);

    return NextResponse.json({
      data: leads,
      total: leads.length,
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, leadId, action, leadData, scoreData } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    if (action === 'create') {
      const lead = await createLead(userId, leadData);
      return NextResponse.json(lead, { status: 201 });
    } else if (action === 'update' && leadId) {
      const lead = await updateLead(userId, leadId, leadData);
      return NextResponse.json(lead, { status: 200 });
    } else if (action === 'score' && leadId) {
      const score = await scoreLead(userId, leadId, scoreData);
      return NextResponse.json(score, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error managing lead:', error);
    return NextResponse.json({ error: 'Failed to manage lead' }, { status: 500 });
  }
}
