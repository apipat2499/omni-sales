import { NextRequest, NextResponse } from 'next/server';
import { createHash, createHmac, randomBytes } from 'crypto';

/**
 * API Security Module
 * Provides CSRF protection, request signing, API key management,
 * and request ID tracking for audit
 */

// ============================================
// CSRF Protection
// ============================================

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'X-CSRF-Token';

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Verify CSRF token
 */
export function verifyCSRFToken(tokenFromRequest: string | null, tokenFromCookie: string | null): boolean {
  if (!tokenFromRequest || !tokenFromCookie) {
    return false;
  }

  // Use timing-safe comparison to prevent timing attacks
  return timingSafeEqual(tokenFromRequest, tokenFromCookie);
}

/**
 * Timing-safe string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * CSRF Protection Middleware
 */
export function csrfProtection(options: {
  ignoreMethods?: string[];
  cookieName?: string;
  headerName?: string;
} = {}) {
  const ignoreMethods = options.ignoreMethods || ['GET', 'HEAD', 'OPTIONS'];
  const cookieName = options.cookieName || CSRF_COOKIE_NAME;
  const headerName = options.headerName || CSRF_HEADER_NAME;

  return async function csrf(
    request: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    const method = request.method;

    // Skip CSRF check for safe methods
    if (ignoreMethods.includes(method)) {
      const response = await handler(request);

      // Generate and set CSRF token for safe methods
      const token = generateCSRFToken();
      response.cookies.set(cookieName, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24, // 24 hours
      });

      return response;
    }

    // Verify CSRF token for unsafe methods
    const tokenFromHeader = request.headers.get(headerName);
    const tokenFromCookie = request.cookies.get(cookieName)?.value;

    if (!verifyCSRFToken(tokenFromHeader, tokenFromCookie)) {
      console.warn('[CSRF] Token validation failed');
      return NextResponse.json(
        { error: 'CSRF token validation failed' },
        { status: 403 }
      );
    }

    return handler(request);
  };
}

// ============================================
// Request Signing
// ============================================

/**
 * Generate request signature
 */
export function generateRequestSignature(
  method: string,
  url: string,
  body: string | null,
  timestamp: number,
  secret: string
): string {
  const message = `${method}:${url}:${body || ''}:${timestamp}`;
  return createHmac('sha256', secret)
    .update(message)
    .digest('hex');
}

/**
 * Verify request signature
 */
export function verifyRequestSignature(
  signature: string,
  method: string,
  url: string,
  body: string | null,
  timestamp: number,
  secret: string,
  maxAge: number = 300000 // 5 minutes
): boolean {
  // Check timestamp freshness
  const now = Date.now();
  if (Math.abs(now - timestamp) > maxAge) {
    console.warn('[Request Signing] Timestamp too old or in the future');
    return false;
  }

  // Verify signature
  const expectedSignature = generateRequestSignature(method, url, body, timestamp, secret);
  return timingSafeEqual(signature, expectedSignature);
}

/**
 * Request Signing Middleware
 */
export function requestSigningMiddleware(options: {
  secret?: string;
  maxAge?: number;
  headerName?: string;
  timestampHeaderName?: string;
} = {}) {
  const secret = options.secret || process.env.REQUEST_SIGNING_SECRET || 'change-me-in-production';
  const maxAge = options.maxAge || 300000; // 5 minutes
  const headerName = options.headerName || 'X-Request-Signature';
  const timestampHeaderName = options.timestampHeaderName || 'X-Request-Timestamp';

  return async function requestSigning(
    request: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    // Only apply to API routes
    if (!request.nextUrl.pathname.startsWith('/api/')) {
      return handler(request);
    }

    // Skip for certain routes (e.g., health checks)
    const skipRoutes = ['/api/health', '/api/status'];
    if (skipRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
      return handler(request);
    }

    const signature = request.headers.get(headerName);
    const timestamp = request.headers.get(timestampHeaderName);

    if (!signature || !timestamp) {
      console.warn('[Request Signing] Missing signature or timestamp');
      return NextResponse.json(
        { error: 'Request signature required' },
        { status: 401 }
      );
    }

    // Get request body if present
    let body: string | null = null;
    if (request.body) {
      const clonedRequest = request.clone();
      try {
        body = await clonedRequest.text();
      } catch (error) {
        console.error('[Request Signing] Failed to read request body:', error);
      }
    }

    // Verify signature
    const isValid = verifyRequestSignature(
      signature,
      request.method,
      request.nextUrl.toString(),
      body,
      parseInt(timestamp),
      secret,
      maxAge
    );

    if (!isValid) {
      console.warn('[Request Signing] Invalid signature');
      return NextResponse.json(
        { error: 'Invalid request signature' },
        { status: 403 }
      );
    }

    return handler(request);
  };
}

// ============================================
// API Key Management
// ============================================

export interface APIKey {
  id: string;
  key: string;
  name: string;
  userId: string;
  permissions: string[];
  rateLimit?: number;
  expiresAt?: Date;
  createdAt: Date;
  lastUsedAt?: Date;
}

/**
 * Generate API key
 */
export function generateAPIKey(prefix: string = 'sk'): string {
  const key = randomBytes(32).toString('hex');
  return `${prefix}_${key}`;
}

/**
 * Hash API key for storage
 */
export function hashAPIKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Verify API key
 */
export function verifyAPIKey(
  providedKey: string,
  storedHash: string
): boolean {
  const providedHash = hashAPIKey(providedKey);
  return timingSafeEqual(providedHash, storedHash);
}

/**
 * API Key Authentication Middleware
 */
export function apiKeyAuthMiddleware(options: {
  headerName?: string;
  getAPIKey?: (hash: string) => Promise<APIKey | null>;
  requiredPermissions?: string[];
} = {}) {
  const headerName = options.headerName || 'X-API-Key';

  return async function apiKeyAuth(
    request: NextRequest,
    handler: (req: NextRequest, apiKey?: APIKey) => Promise<NextResponse>
  ): Promise<NextResponse> {
    const apiKey = request.headers.get(headerName);

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key required' },
        { status: 401 }
      );
    }

    // Validate API key format
    if (!apiKey.match(/^[a-z]{2}_[a-f0-9]{64}$/)) {
      return NextResponse.json(
        { error: 'Invalid API key format' },
        { status: 401 }
      );
    }

    // If getAPIKey function is provided, verify against database
    if (options.getAPIKey) {
      const keyHash = hashAPIKey(apiKey);
      const storedKey = await options.getAPIKey(keyHash);

      if (!storedKey) {
        return NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401 }
        );
      }

      // Check expiration
      if (storedKey.expiresAt && storedKey.expiresAt < new Date()) {
        return NextResponse.json(
          { error: 'API key expired' },
          { status: 401 }
        );
      }

      // Check permissions
      if (options.requiredPermissions) {
        const hasPermission = options.requiredPermissions.every(perm =>
          storedKey.permissions.includes(perm)
        );

        if (!hasPermission) {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          );
        }
      }

      // Update last used timestamp (async, don't wait)
      // This would be implemented in the database layer

      return handler(request, storedKey);
    }

    return handler(request);
  };
}

// ============================================
// Request ID Tracking
// ============================================

/**
 * Generate unique request ID
 */
export function generateRequestID(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = randomBytes(8).toString('hex');
  return `${timestamp}-${randomPart}`;
}

/**
 * Request ID Middleware
 */
export function requestIDMiddleware(options: {
  headerName?: string;
  generateIfMissing?: boolean;
} = {}) {
  const headerName = options.headerName || 'X-Request-ID';
  const generateIfMissing = options.generateIfMissing !== false;

  return async function requestID(
    request: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    // Get or generate request ID
    let requestId = request.headers.get(headerName);

    if (!requestId && generateIfMissing) {
      requestId = generateRequestID();
    }

    // Execute handler
    const response = await handler(request);

    // Add request ID to response headers
    if (requestId) {
      response.headers.set(headerName, requestId);
    }

    return response;
  };
}

// ============================================
// IP Whitelisting/Blacklisting
// ============================================

export interface IPFilterConfig {
  whitelist?: string[];
  blacklist?: string[];
  mode?: 'whitelist' | 'blacklist' | 'both';
}

/**
 * Get client IP from request
 */
export function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  return cfConnectingIp || realIp || forwardedFor?.split(',')[0].trim() || 'unknown';
}

/**
 * Check if IP matches pattern (supports CIDR)
 */
function isIPMatch(ip: string, pattern: string): boolean {
  // Simple exact match
  if (ip === pattern) {
    return true;
  }

  // Wildcard match (e.g., 192.168.*.*)
  const regex = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '\\d+') + '$');
  return regex.test(ip);
}

/**
 * IP Filter Middleware
 */
export function ipFilterMiddleware(config: IPFilterConfig) {
  return async function ipFilter(
    request: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    const clientIP = getClientIP(request);

    // Whitelist mode
    if (config.mode === 'whitelist' && config.whitelist) {
      const isAllowed = config.whitelist.some(pattern => isIPMatch(clientIP, pattern));
      if (!isAllowed) {
        console.warn(`[IP Filter] Blocked IP: ${clientIP} (not in whitelist)`);
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // Blacklist mode
    if ((config.mode === 'blacklist' || config.mode === 'both') && config.blacklist) {
      const isBlocked = config.blacklist.some(pattern => isIPMatch(clientIP, pattern));
      if (isBlocked) {
        console.warn(`[IP Filter] Blocked IP: ${clientIP} (in blacklist)`);
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    return handler(request);
  };
}

// ============================================
// Audit Logging
// ============================================

export interface AuditLogEntry {
  requestId: string;
  timestamp: Date;
  method: string;
  url: string;
  userAgent?: string;
  ip: string;
  userId?: string;
  statusCode?: number;
  duration?: number;
  error?: string;
}

/**
 * Create audit log entry
 */
export function createAuditLog(
  request: NextRequest,
  response?: NextResponse,
  startTime?: number
): AuditLogEntry {
  const requestId = request.headers.get('X-Request-ID') || generateRequestID();
  const clientIP = getClientIP(request);

  return {
    requestId,
    timestamp: new Date(),
    method: request.method,
    url: request.nextUrl.toString(),
    userAgent: request.headers.get('user-agent') || undefined,
    ip: clientIP,
    statusCode: response?.status,
    duration: startTime ? Date.now() - startTime : undefined,
  };
}

/**
 * Audit Logging Middleware
 */
export function auditLoggingMiddleware(options: {
  logFunction?: (entry: AuditLogEntry) => Promise<void>;
  includeBody?: boolean;
} = {}) {
  return async function auditLogging(
    request: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    const startTime = Date.now();

    try {
      const response = await handler(request);
      const auditLog = createAuditLog(request, response, startTime);

      // Log to custom function or console
      if (options.logFunction) {
        await options.logFunction(auditLog);
      } else {
        console.log('[Audit]', JSON.stringify(auditLog));
      }

      return response;
    } catch (error) {
      const auditLog = createAuditLog(request, undefined, startTime);
      auditLog.error = error instanceof Error ? error.message : String(error);

      if (options.logFunction) {
        await options.logFunction(auditLog);
      } else {
        console.error('[Audit Error]', JSON.stringify(auditLog));
      }

      throw error;
    }
  };
}

// Export all
export default {
  // CSRF
  generateCSRFToken,
  verifyCSRFToken,
  csrfProtection,

  // Request Signing
  generateRequestSignature,
  verifyRequestSignature,
  requestSigningMiddleware,

  // API Keys
  generateAPIKey,
  hashAPIKey,
  verifyAPIKey,
  apiKeyAuthMiddleware,

  // Request ID
  generateRequestID,
  requestIDMiddleware,

  // IP Filtering
  getClientIP,
  ipFilterMiddleware,

  // Audit Logging
  createAuditLog,
  auditLoggingMiddleware,
};
