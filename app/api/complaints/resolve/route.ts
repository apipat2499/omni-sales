import { NextRequest, NextResponse } from 'next/server';
import { resolveComplaint, getComplaintResolution } from '@/lib/complaints/service';

export async function GET(req: NextRequest) {
  try {
    const complaintId = req.nextUrl.searchParams.get('complaintId');

    if (!complaintId) {
      return NextResponse.json({ error: 'Missing complaintId' }, { status: 400 });
    }

    const resolution = await getComplaintResolution(complaintId);

    return NextResponse.json({
      data: resolution,
    });
  } catch (error) {
    console.error('Error fetching resolution:', error);
    return NextResponse.json({ error: 'Failed to fetch resolution' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { complaintId, resolutionType, resolutionDescription, compensationOffered, compensationType, refundAmount, replacementOffered, storeCreditAmount, actionsTaken, resolvedById } = body;

    if (!complaintId || !resolutionType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const resolution = await resolveComplaint(complaintId, {
      resolutionType,
      resolutionDescription,
      compensationOffered,
      compensationType,
      refundAmount,
      replacementOffered,
      storeCreditAmount,
      actionsTaken,
      resolvedById,
    });

    if (!resolution) {
      return NextResponse.json({ error: 'Failed to resolve complaint' }, { status: 500 });
    }

    return NextResponse.json(resolution, { status: 201 });
  } catch (error) {
    console.error('Error resolving complaint:', error);
    return NextResponse.json({ error: 'Failed to resolve complaint' }, { status: 500 });
  }
}
