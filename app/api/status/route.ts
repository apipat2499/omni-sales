import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json(
      {
        status: 'ok',
        service: 'omni-sales',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.VERSION || '1.0.0',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Status check failed:', error);
    return NextResponse.json(
      { status: 'error', error: 'Status check failed' },
      { status: 500 }
    );
  }
}
