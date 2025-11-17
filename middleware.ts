import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { applySecurityHeaders } from './lib/middleware/security-headers';
import { corsMiddleware } from './lib/middleware/cors';
import { generateRequestID } from './lib/security/edge-security';
import { tenantMiddleware } from './lib/middleware/tenant-middleware';

/**
 * Production Security Hardening Middleware
 * Implements multiple security layers:
 * - Tenant detection and context
 * - Authentication check
 * - Security headers (CSP, HSTS, etc.)
 * - CORS protection
 * - Request ID tracking
 * - Rate limiting (via API routes)
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const startTime = Date.now();

  // Generate request ID for tracking
  const requestId = generateRequestID();

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/api/health', '/api/status', '/onboard'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Apply tenant detection first (before auth check)
  // This sets the tenant context for the request
  const tenantResponse = await tenantMiddleware(req);
  if (tenantResponse.status !== 200 && tenantResponse.status !== 304) {
    // Tenant middleware returned a redirect or error
    return tenantResponse;
  }

  // API routes that require CORS handling
  const isAPIRoute = pathname.startsWith('/api/');

  // Check if user has auth token in cookies
  const authToken = req.cookies.get('sb-access-token') ||
                    req.cookies.get('supabase-auth-token') ||
                    req.cookies.get('sb-localhost-auth-token');

  const hasSession = !!authToken;

  // Authentication check
  if (!hasSession && !isPublicRoute) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users away from login page
  if (hasSession && pathname === '/login') {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  // Create base response
  let response = NextResponse.next();

  // Apply CORS for API routes
  if (isAPIRoute) {
    const cors = corsMiddleware();
    const corsResponse = await cors(req);

    // If CORS returns a response (e.g., preflight), return it
    if (corsResponse.status === 204 || corsResponse.status === 403) {
      return corsResponse;
    }

    response = corsResponse;
  }

  // Apply security headers
  response = applySecurityHeaders(response);

  // Add request tracking headers
  response.headers.set('X-Request-ID', requestId);

  // Add response time
  const responseTime = Date.now() - startTime;
  response.headers.set('X-Response-Time', `${responseTime}ms`);

  // Security headers for specific content types
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    response.headers.set('X-Content-Type-Options', 'nosniff');
  }

  // Log security events (in production, this would go to a proper logging service)
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_SECURITY_LOGGING === 'true') {
    console.log('[Security Middleware]', {
      requestId,
      pathname,
      method: req.method,
      hasSession,
      responseTime: `${responseTime}ms`,
      userAgent: req.headers.get('user-agent')?.substring(0, 100),
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - _next/data (data files)
     * - favicon.ico (favicon file)
     * - public folder (images, etc.)
     * - monitoring endpoints (Sentry)
     */
    '/((?!_next/static|_next/image|_next/data|favicon.ico|monitoring|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)',
  ],
};
