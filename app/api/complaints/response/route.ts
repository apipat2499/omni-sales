import { NextRequest, NextResponse } from 'next/server';
import { addComplaintResponse, getComplaintResponses } from '@/lib/complaints/service';

export async function GET(req: NextRequest) {
  try {
    const complaintId = req.nextUrl.searchParams.get('complaintId');

    if (!complaintId) {
      return NextResponse.json({ error: 'Missing complaintId' }, { status: 400 });
    }

    const responses = await getComplaintResponses(complaintId);

    return NextResponse.json({
      data: responses,
      total: responses.length,
    });
  } catch (error) {
    console.error('Error fetching responses:', error);
    return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { complaintId, responderId, responderType, message, attachments, isInternal, responseType } = body;

    if (!complaintId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const response = await addComplaintResponse(complaintId, {
      responderId,
      responderType,
      message,
      attachments,
      isInternal,
      responseType,
    });

    if (!response) {
      return NextResponse.json({ error: 'Failed to add response' }, { status: 500 });
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error adding response:', error);
    return NextResponse.json({ error: 'Failed to add response' }, { status: 500 });
  }
}
