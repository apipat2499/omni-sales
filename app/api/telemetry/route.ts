import { NextResponse } from 'next/server';
import { logServerTelemetry } from '@/lib/telemetry';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    logServerTelemetry({
      type: body?.type || 'client_event',
      level: body?.level || 'info',
      message: body?.message || 'Client telemetry event',
      context: body?.context,
      source: 'client',
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to process telemetry event', error);
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
