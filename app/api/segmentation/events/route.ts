import { NextRequest, NextResponse } from 'next/server';
import { recordBehaviorEvent } from '@/lib/segmentation/service';

export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      customerId,
      eventType,
      eventCategory,
      productId,
      productName,
      productCategory,
      eventValue,
      eventProperties,
      pageUrl,
      referrerUrl,
      ipAddress,
      userAgent,
      deviceType,
      browser,
      os,
      location,
      sessionId,
    } = await req.json();

    if (!userId || !customerId || !eventType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const success = await recordBehaviorEvent(userId, {
      customerId,
      eventType,
      eventCategory,
      productId,
      productName,
      productCategory,
      eventValue,
      eventProperties,
      pageUrl,
      referrerUrl,
      ipAddress,
      userAgent,
      deviceType,
      browser,
      os,
      location,
      sessionId,
    });

    if (!success) {
      return NextResponse.json({ error: 'Failed to record event' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Event recorded' }, { status: 201 });
  } catch (error) {
    console.error('Error recording event:', error);
    return NextResponse.json({ error: 'Failed to record event' }, { status: 500 });
  }
}
