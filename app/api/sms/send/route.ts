import { NextRequest, NextResponse } from 'next/server';
import { queueSMS, logSMS } from '@/lib/sms/service';

export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      recipientPhone,
      recipientName,
      content,
      templateId,
      variables,
      scheduledFor,
      relatedOrderId,
    } = await req.json();

    if (!userId || !recipientPhone || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Queue SMS
    const queued = await queueSMS(userId, {
      recipientPhone,
      recipientName,
      content,
      templateId,
      variables,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      relatedOrderId,
    });

    if (!queued) {
      return NextResponse.json({ error: 'Failed to queue SMS' }, { status: 500 });
    }

    // Log SMS attempt
    await logSMS(userId, {
      recipientPhone,
      recipientName,
      content,
      status: 'queued',
      segmentsUsed: Math.ceil(content.length / 160),
      relatedOrderId,
    });

    return NextResponse.json({ success: true, message: 'SMS queued for sending' }, { status: 201 });
  } catch (error) {
    console.error('Error sending SMS:', error);
    return NextResponse.json({ error: 'Failed to send SMS' }, { status: 500 });
  }
}
