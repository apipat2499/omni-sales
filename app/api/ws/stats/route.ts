import { NextRequest, NextResponse } from 'next/server';
import { wsManager } from '@/lib/websocket/server';
import { apiRequireRoles } from '@/lib/middleware/authMiddleware';

/**
 * WebSocket Statistics API
 * Returns current WebSocket connection statistics
 * Requires admin authentication
 */

export async function GET(request: NextRequest) {
  // Require admin role
  const { user, error } = apiRequireRoles(request, ['admin', 'super_admin']);
  if (error) return error;

  try {

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
