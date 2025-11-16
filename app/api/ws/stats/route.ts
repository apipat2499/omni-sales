import { NextRequest, NextResponse } from 'next/server';
import { wsManager } from '@/lib/websocket/server';

/**
 * WebSocket Statistics API
 * Returns current WebSocket connection statistics
 * Requires admin authentication
 */

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check here
    // const session = await getSession(request);
    // if (!session || session.role !== 'admin') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const stats = wsManager.getStats();

    return NextResponse.json({
      timestamp: Date.now(),
      statistics: stats,
      uptime: process.uptime(),
    });
  } catch (error) {
    console.error('[WebSocket Stats] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
