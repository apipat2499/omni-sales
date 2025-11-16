import { NextRequest, NextResponse } from 'next/server';

/**
 * CORS Configuration
 * Implements strict Cross-Origin Resource Sharing policies for production security
 */

export interface CORSConfig {
  // Allowed origins (whitelist)
  allowedOrigins: string[];
  // Allowed HTTP methods
  allowedMethods: string[];
  // Allowed headers
  allowedHeaders: string[];
  // Exposed headers
  exposedHeaders: string[];
  // Allow credentials (cookies, auth headers)
  allowCredentials: boolean;
  // Max age for preflight cache (in seconds)
  maxAge: number;
  // Enable development mode (allows localhost)
  devMode?: boolean;
}

// Default CORS configuration
const DEFAULT_CORS_CONFIG: CORSConfig = {
  allowedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || 'https://omni-sales.com',
    process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : '',
  ].filter(Boolean),
  allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token',
    'X-Request-ID',
    'X-API-Key',
    'Accept',
    'Accept-Language',
    'Origin',
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-Request-ID',
    'X-Response-Time',
  ],
  allowCredentials: true,
  maxAge: 86400, // 24 hours
  devMode: process.env.NODE_ENV === 'development',
};

/**
 * Check if origin is allowed based on configuration
 */
function isOriginAllowed(origin: string | null, config: CORSConfig): boolean {
  if (!origin) {
    // Allow requests with no origin (same-origin, mobile apps, curl)
    return true;
  }

  // In development mode, allow localhost
  if (config.devMode) {
    if (
      origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1') ||
      origin.startsWith('https://localhost')
    ) {
      return true;
    }
  }

  // Check against whitelist
  return config.allowedOrigins.some((allowedOrigin) => {
    // Support wildcard subdomains (e.g., *.example.com)
    if (allowedOrigin.startsWith('*.')) {
      const domain = allowedOrigin.slice(2);
      return origin.endsWith(domain);
    }
    return origin === allowedOrigin;
  });
}

/**
 * Set CORS headers on response
 */
function setCORSHeaders(
  response: NextResponse,
  origin: string | null,
  config: CORSConfig
): NextResponse {
  // Set allowed origin
  if (origin && isOriginAllowed(origin, config)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  } else if (config.allowedOrigins.length === 1 && !origin) {
    // If only one origin is configured and no origin header, use it
    response.headers.set('Access-Control-Allow-Origin', config.allowedOrigins[0]);
  }

  // Set credentials
  if (config.allowCredentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  // Set allowed methods
  response.headers.set('Access-Control-Allow-Methods', config.allowedMethods.join(', '));

  // Set allowed headers
  response.headers.set('Access-Control-Allow-Headers', config.allowedHeaders.join(', '));

  // Set exposed headers
  if (config.exposedHeaders.length > 0) {
    response.headers.set('Access-Control-Expose-Headers', config.exposedHeaders.join(', '));
  }

  // Set max age for preflight
  response.headers.set('Access-Control-Max-Age', config.maxAge.toString());

  // Vary header for cache control
  response.headers.set('Vary', 'Origin');

  return response;
}

/**
 * CORS Middleware
 * Handles CORS headers and preflight requests
 */
export function corsMiddleware(config: Partial<CORSConfig> = {}) {
  const finalConfig: CORSConfig = {
    ...DEFAULT_CORS_CONFIG,
    ...config,
  };

  return async function cors(
    request: NextRequest,
    handler?: (req: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    const origin = request.headers.get('origin');
    const method = request.method;

    // Check if origin is allowed
    if (origin && !isOriginAllowed(origin, finalConfig)) {
      console.warn(`[CORS] Blocked request from unauthorized origin: ${origin}`);
      return new NextResponse(JSON.stringify({ error: 'CORS policy violation' }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Handle preflight requests (OPTIONS)
    if (method === 'OPTIONS') {
      const preflightResponse = new NextResponse(null, {
        status: 204,
        headers: {
          'Content-Length': '0',
        },
      });
      return setCORSHeaders(preflightResponse, origin, finalConfig);
    }

    // Handle regular requests
    let response: NextResponse;
    if (handler) {
      response = await handler(request);
    } else {
      response = NextResponse.next();
    }

    return setCORSHeaders(response, origin, finalConfig);
  };
}

/**
 * Simple CORS handler for API routes
 */
export async function handleCORS(request: NextRequest): Promise<NextResponse | null> {
  const origin = request.headers.get('origin');
  const method = request.method;

  // Handle preflight
  if (method === 'OPTIONS') {
    const response = new NextResponse(null, {
      status: 204,
      headers: {
        'Content-Length': '0',
      },
    });
    return setCORSHeaders(response, origin, DEFAULT_CORS_CONFIG);
  }

  return null;
}

/**
 * Apply CORS headers to an existing response
 */
export function applyCORSHeaders(
  response: NextResponse,
  origin: string | null,
  config: Partial<CORSConfig> = {}
): NextResponse {
  const finalConfig: CORSConfig = {
    ...DEFAULT_CORS_CONFIG,
    ...config,
  };
  return setCORSHeaders(response, origin, finalConfig);
}

// Export default configuration
export default corsMiddleware;
