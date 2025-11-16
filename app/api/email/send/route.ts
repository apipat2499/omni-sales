import { NextRequest, NextResponse } from 'next/server';
import { queueEmail, logEmail } from '@/lib/email/service';

export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      recipientEmail,
      recipientName,
      subjectLine,
      htmlContent,
      plainTextContent,
      templateId,
      variables,
      scheduledFor,
      relatedOrderId,
    } = await req.json();

    if (!userId || !recipientEmail || !subjectLine || !htmlContent) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Queue the email
    const queued = await queueEmail(userId, {
      recipientEmail,
      recipientName,
      templateId,
      subjectLine,
      htmlContent,
      plainTextContent,
      variables,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      relatedOrderId,
    });

    if (!queued) {
      return NextResponse.json({ error: 'Failed to queue email' }, { status: 500 });
    }

    // Log the email attempt
    await logEmail(userId, {
      recipientEmail,
      recipientName,
      subjectLine,
      emailBody: htmlContent,
      status: 'queued',
      relatedOrderId,
    });

    return NextResponse.json({ success: true, message: 'Email queued for sending' }, { status: 201 });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
