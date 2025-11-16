import { NextRequest, NextResponse } from 'next/server';
import { getComplaints, createComplaint, getComplaintStatistics } from '@/lib/complaints/service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const status = req.nextUrl.searchParams.get('status');
    const priority = req.nextUrl.searchParams.get('priority');
    const includeStats = req.nextUrl.searchParams.get('includeStats');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const complaints = await getComplaints(userId, status || undefined, priority || undefined);
    let stats = null;

    if (includeStats === 'true') {
      stats = await getComplaintStatistics(userId);
    }

    return NextResponse.json({
      data: complaints,
      stats: stats,
      total: complaints.length,
    });
  } catch (error) {
    console.error('Error fetching complaints:', error);
    return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, customerId, orderId, complaintCategoryId, complaintType, subject, description, priority, severity, tags, attachments } = body;

    if (!userId || !customerId || !complaintCategoryId || !complaintType || !subject || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const complaint = await createComplaint(userId, {
      customerId,
      orderId,
      complaintCategoryId,
      complaintType,
      subject,
      description,
      priority,
      severity,
      tags,
      attachments,
    });

    if (!complaint) {
      return NextResponse.json({ error: 'Failed to create complaint' }, { status: 500 });
    }

    return NextResponse.json(complaint, { status: 201 });
  } catch (error) {
    console.error('Error creating complaint:', error);
    return NextResponse.json({ error: 'Failed to create complaint' }, { status: 500 });
  }
}
