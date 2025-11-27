import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { status: 'unhealthy', error: 'Health check failed' },
      { status: 500 }
    );
  }
}

export async function HEAD() {
  try {
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);
    return new NextResponse(null, { status: 500 });
  }
}
