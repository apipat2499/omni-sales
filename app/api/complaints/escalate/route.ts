import { NextRequest, NextResponse } from 'next/server';
import { escalateComplaint, getComplaintEscalations } from '@/lib/complaints/service';

export async function GET(req: NextRequest) {
  try {
    const complaintId = req.nextUrl.searchParams.get('complaintId');

    if (!complaintId) {
      return NextResponse.json({ error: 'Missing complaintId' }, { status: 400 });
    }

    const escalations = await getComplaintEscalations(complaintId);

    return NextResponse.json({
      data: escalations,
      total: escalations.length,
    });
  } catch (error) {
    console.error('Error fetching escalations:', error);
    return NextResponse.json({ error: 'Failed to fetch escalations' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { complaintId, escalationLevel, escalatedFromId, escalatedToId, escalationReason, notes } = body;

    if (!complaintId || !escalatedToId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const escalation = await escalateComplaint(complaintId, {
      escalationLevel,
      escalatedFromId,
      escalatedToId,
      escalationReason,
      notes,
    });

    if (!escalation) {
      return NextResponse.json({ error: 'Failed to escalate complaint' }, { status: 500 });
    }

    return NextResponse.json(escalation, { status: 201 });
  } catch (error) {
    console.error('Error escalating complaint:', error);
    return NextResponse.json({ error: 'Failed to escalate complaint' }, { status: 500 });
  }
}
