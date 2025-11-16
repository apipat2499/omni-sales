import { NextRequest } from 'next/server';

/**
 * WebSocket API Route Handler
 *
 * This route handles WebSocket upgrade requests.
 * The actual WebSocket server is initialized in the instrumentation hook.
 */

export async function GET(request: NextRequest) {
  // Check if this is a WebSocket upgrade request
  const upgrade = request.headers.get('upgrade');

  if (upgrade?.toLowerCase() === 'websocket') {
    // In Next.js, WebSocket upgrades are handled by the custom server
    // This route is just for documentation and health checks
    return new Response(
      JSON.stringify({
        error: 'WebSocket upgrade must be handled by custom server',
        message: 'Please connect directly to the WebSocket server',
      }),
      {
        status: 426, // Upgrade Required
        headers: {
          'Content-Type': 'application/json',
          'Upgrade': 'websocket',
        },
      }
    );
  }

  // Return info about the WebSocket endpoint
  return new Response(
    JSON.stringify({
      message: 'WebSocket API endpoint',
      status: 'ready',
      endpoints: {
        websocket: '/api/ws',
        info: '/api/ws/info',
        stats: '/api/ws/stats',
      },
      usage: {
        connect: 'ws://localhost:3000/api/ws',
        authenticate: 'Send {"type":"auth","data":{"userId":"...","role":"...","sessionId":"...","expiresAt":...}}',
        subscribe: 'Send {"type":"subscribe","data":{"namespace":"orders|customers|products|inventory|payments|system"}}',
      },
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

export const dynamic = 'force-dynamic';
