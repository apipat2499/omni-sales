import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { applySecurityHeaders } from './lib/middleware/security-headers';
import { corsMiddleware } from './lib/middleware/cors';
import { generateRequestID } from './lib/security/edge-security';
import { tenantMiddleware } from './lib/middleware/tenant-middleware';
import { logServerTelemetry } from './lib/telemetry';

const redirectCounters = new Map<string, { count: number; windowStart: number }>();
const REDIRECT_WINDOW = 60000;
const REDIRECT_THRESHOLD = 20;

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

function recordRedirectSpike(reason: string, metadata: Record<string, any>) {
  const now = Date.now();
  const existing = redirectCounters.get(reason) ?? { count: 0, windowStart: now };

  if (now - existing.windowStart > REDIRECT_WINDOW) {
    existing.count = 0;
    existing.windowStart = now;
  }

  existing.count += 1;
  redirectCounters.set(reason, existing);

  if (existing.count >= REDIRECT_THRESHOLD) {
    logServerTelemetry({
      type: 'middleware_redirect_spike',
      level: 'warning',
      message: `Redirect spike detected for ${reason}`,
      context: { ...metadata, count: existing.count },
      source: 'middleware',
    });
    existing.count = 0;
    existing.windowStart = now;
  }
}
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const startTime = Date.now();

  // Generate request ID for tracking
  const requestId = generateRequestID();

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/login',
    '/api/health',
    '/api/status',
    '/onboard',
    '/dashboard', // Allow demo access
    '/products', // Allow demo access
    '/orders', // Allow demo access
    '/customers', // Allow demo access
  ];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Skip tenant detection for demo/public routes
  const skipTenantPaths = ['/dashboard', '/products', '/orders', '/customers', '/login', '/'];
  const skipTenant = skipTenantPaths.some(path =>
    pathname === path || pathname.startsWith(path + '/')
  );

  if (!skipTenant) {
    // Apply tenant detection first (before auth check)
    // This sets the tenant context for the request
    const tenantResponse = await tenantMiddleware(req);
    if (tenantResponse.status !== 200 && tenantResponse.status !== 304) {
      // Tenant middleware returned a redirect or error
      return tenantResponse;
    }
  }

  // API routes that require CORS handling
  const isAPIRoute = pathname.startsWith('/api/');

  // Check if user has auth token in cookies
  const authToken = req.cookies.get('sb-access-token') ||
                    req.cookies.get('supabase-auth-token') ||
                    req.cookies.get('sb-localhost-auth-token');

  const hasSession = !!authToken;

  // Authentication check - skip for public routes
  if (!hasSession && !isPublicRoute && !isAPIRoute) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    recordRedirectSpike('unauthenticated_access', { pathname, requestId });
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users away from login page
  if (hasSession && pathname === '/login') {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    recordRedirectSpike('login_loop', { pathname, requestId });
    return NextResponse.redirect(redirectUrl);
  }

  // Admin-only routes - defer to client-side RouteGuard
  // NOTE: Admin role checking is handled by client-side RouteGuard (AdminGuard)
  // This is more efficient and avoids database queries in middleware
  const adminRoutes = [
    '/admin',
    '/analytics',
    '/marketing',
    '/billing',
    '/bundles',
    '/reports',
  ];

  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

  // Just ensure user is authenticated for admin routes
  // Actual admin permission check happens in client-side RouteGuard
  if (isAdminRoute && !hasSession) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    recordRedirectSpike('unauthenticated_admin_access', { pathname, requestId });
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
