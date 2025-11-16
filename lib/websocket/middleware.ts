import { NextRequest, NextResponse } from 'next/server';

/**
 * WebSocket Middleware
 * Handles CORS, rate limiting, and security for WebSocket connections
 */

/**
 * CORS Configuration for WebSocket
 */
export const websocketCorsConfig = {
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001',
  ],
  allowedMethods: ['GET', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Upgrade',
    'Connection',
    'Sec-WebSocket-Key',
    'Sec-WebSocket-Version',
    'Sec-WebSocket-Extensions',
  ],
};

/**
 * Handle CORS for WebSocket requests
 */
export function handleWebSocketCors(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin');
  const isAllowed =
    !origin ||
    websocketCorsConfig.allowedOrigins.includes('*') ||
    websocketCorsConfig.allowedOrigins.includes(origin);

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': isAllowed ? origin || '*' : 'null',
        'Access-Control-Allow-Methods': websocketCorsConfig.allowedMethods.join(', '),
        'Access-Control-Allow-Headers': websocketCorsConfig.allowedHeaders.join(', '),
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  if (!isAllowed) {
    return new NextResponse(
      JSON.stringify({ error: 'CORS policy: Origin not allowed' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return null;
}

/**
 * Rate Limiter for WebSocket connections
 */
class WebSocketRateLimiter {
  private connections: Map<string, { count: number; resetAt: number }> = new Map();
  private readonly maxConnections: number;
  private readonly windowMs: number;

  constructor(maxConnections: number = 10, windowMs: number = 60000) {
    this.maxConnections = maxConnections;
    this.windowMs = windowMs;

    // Cleanup old entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check if IP can connect
   */
  canConnect(ip: string): boolean {
    const now = Date.now();
    const record = this.connections.get(ip);

    if (!record || record.resetAt < now) {
      this.connections.set(ip, {
        count: 1,
        resetAt: now + this.windowMs,
      });
      return true;
    }

    if (record.count >= this.maxConnections) {
      return false;
    }

    record.count++;
    return true;
  }

  /**
   * Remove connection count for IP
   */
  removeConnection(ip: string): void {
    const record = this.connections.get(ip);
    if (record && record.count > 0) {
      record.count--;
    }
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [ip, record] of this.connections.entries()) {
      if (record.resetAt < now) {
        this.connections.delete(ip);
      }
    }
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalTracked: number;
    activeIPs: string[];
  } {
    const now = Date.now();
    const activeIPs = Array.from(this.connections.entries())
      .filter(([_, record]) => record.resetAt >= now && record.count > 0)
      .map(([ip]) => ip);

    return {
      totalTracked: this.connections.size,
      activeIPs,
    };
  }
}

// Export singleton instance
export const wsRateLimiter = new WebSocketRateLimiter(10, 60000);

/**
 * Extract IP address from request
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  const cloudflare = request.headers.get('cf-connecting-ip');

  if (cloudflare) return cloudflare;
  if (real) return real;
  if (forwarded) return forwarded.split(',')[0].trim();

  return 'unknown';
}

/**
 * Validate WebSocket upgrade request
 */
export function validateWebSocketUpgrade(request: NextRequest): {
  valid: boolean;
  error?: string;
} {
  const upgrade = request.headers.get('upgrade');
  const connection = request.headers.get('connection');
  const wsKey = request.headers.get('sec-websocket-key');
  const wsVersion = request.headers.get('sec-websocket-version');

  if (upgrade?.toLowerCase() !== 'websocket') {
    return { valid: false, error: 'Invalid upgrade header' };
  }

  if (!connection?.toLowerCase().includes('upgrade')) {
    return { valid: false, error: 'Invalid connection header' };
  }

  if (!wsKey) {
    return { valid: false, error: 'Missing Sec-WebSocket-Key' };
  }

  if (wsVersion !== '13') {
    return { valid: false, error: 'Unsupported WebSocket version' };
  }

  return { valid: true };
}

/**
 * Security headers for WebSocket responses
 */
export function getWebSocketSecurityHeaders(origin?: string): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    ...(origin && {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
    }),
  };
}
