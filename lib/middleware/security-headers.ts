import { NextRequest, NextResponse } from 'next/server';

/**
 * Security Headers Configuration
 * Implements comprehensive HTTP security headers for production deployment
 */

export interface SecurityHeadersConfig {
  // Content Security Policy
  contentSecurityPolicy?: string;
  // Strict Transport Security (HSTS)
  strictTransportSecurity?: string;
  // X-Content-Type-Options
  xContentTypeOptions?: string;
  // X-Frame-Options
  xFrameOptions?: string;
  // X-XSS-Protection
  xXSSProtection?: string;
  // Referrer-Policy
  referrerPolicy?: string;
  // Permissions-Policy
  permissionsPolicy?: string;
  // X-DNS-Prefetch-Control
  xDNSPrefetchControl?: string;
  // X-Download-Options
  xDownloadOptions?: string;
  // Expect-CT (deprecated but still useful)
  expectCT?: string;
  // Custom headers
  customHeaders?: Record<string, string>;
}

/**
 * Generate Content Security Policy
 */
function generateCSP(nonce?: string): string {
  const isDev = process.env.NODE_ENV === 'development';

  // Base CSP directives
  const directives = {
    // Default fallback
    'default-src': ["'self'"],

    // Scripts
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for Next.js runtime
      "'unsafe-eval'", // Required for Next.js and some React features
      nonce ? `'nonce-${nonce}'` : '',
      // External script sources
      'https://cdn.jsdelivr.net',
      'https://unpkg.com',
      'https://js.stripe.com',
      'https://maps.googleapis.com',
      'https://*.sentry.io',
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
    ].filter(Boolean),

    // Styles
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for styled-components and CSS-in-JS
      'https://fonts.googleapis.com',
      'https://cdn.jsdelivr.net',
    ],

    // Images
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https:',
      'https://*.supabase.co',
      'https://*.googleapis.com',
      'https://*.stripe.com',
    ],

    // Fonts
    'font-src': [
      "'self'",
      'data:',
      'https://fonts.gstatic.com',
      'https://cdn.jsdelivr.net',
    ],

    // Connections (AJAX, WebSocket, EventSource)
    'connect-src': [
      "'self'",
      'https://*.supabase.co',
      'wss://*.supabase.co',
      'https://*.stripe.com',
      'https://maps.googleapis.com',
      'https://*.sentry.io',
      'https://www.google-analytics.com',
      'https://*.vercel.app',
      'wss://*.vercel.app',
      isDev ? 'ws://localhost:*' : '',
      isDev ? 'http://localhost:*' : '',
    ].filter(Boolean),

    // Frames
    'frame-src': [
      "'self'",
      'https://js.stripe.com',
      'https://hooks.stripe.com',
    ],

    // Objects (Flash, Java, etc.)
    'object-src': ["'none'"],

    // Media
    'media-src': ["'self'", 'https://*.supabase.co'],

    // Workers
    'worker-src': ["'self'", 'blob:'],

    // Manifests
    'manifest-src': ["'self'"],

    // Base URI
    'base-uri': ["'self'"],

    // Form actions
    'form-action': ["'self'"],

    // Frame ancestors (clickjacking protection)
    'frame-ancestors': ["'none'"],

    // Upgrade insecure requests (only in production)
    ...(isDev ? {} : { 'upgrade-insecure-requests': [] }),
  };

  // Convert to CSP string
  return Object.entries(directives)
    .map(([key, values]) => {
      if (Array.isArray(values) && values.length > 0) {
        return `${key} ${values.join(' ')}`;
      } else if (Array.isArray(values) && values.length === 0) {
        return key;
      }
      return '';
    })
    .filter(Boolean)
    .join('; ');
}

/**
 * Default Security Headers Configuration
 */
const DEFAULT_SECURITY_HEADERS: SecurityHeadersConfig = {
  // Content Security Policy
  contentSecurityPolicy: generateCSP(),

  // Strict Transport Security (HSTS)
  // Force HTTPS for 1 year, include subdomains, allow preloading
  strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',

  // Prevent MIME type sniffing
  xContentTypeOptions: 'nosniff',

  // Prevent clickjacking
  xFrameOptions: 'DENY',

  // XSS Protection (legacy, but still useful for older browsers)
  xXSSProtection: '1; mode=block',

  // Referrer Policy
  referrerPolicy: 'strict-origin-when-cross-origin',

  // Permissions Policy (formerly Feature Policy)
  // Removed deprecated features: ambient-light-sensor, battery, document-domain,
  // execution-while-not-rendered, execution-while-out-of-viewport, navigation-override
  permissionsPolicy: [
    'accelerometer=()',
    'autoplay=()',
    'camera=()',
    'display-capture=()',
    'encrypted-media=()',
    'fullscreen=(self)',
    'geolocation=()',
    'gyroscope=()',
    'magnetometer=()',
    'microphone=()',
    'midi=()',
    'payment=(self)',
    'picture-in-picture=()',
    'screen-wake-lock=()',
    'usb=()',
    'web-share=()',
    'xr-spatial-tracking=()',
  ].join(', '),

  // DNS Prefetch Control
  xDNSPrefetchControl: 'on',

  // Download Options (IE only, but harmless)
  xDownloadOptions: 'noopen',

  // Expect-CT (Certificate Transparency)
  expectCT: 'max-age=86400, enforce',
};

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(
  response: NextResponse,
  config: Partial<SecurityHeadersConfig> = {},
  nonce?: string
): NextResponse {
  const finalConfig: SecurityHeadersConfig = {
    ...DEFAULT_SECURITY_HEADERS,
    ...config,
  };

  // Regenerate CSP with nonce if provided
  if (nonce && !config.contentSecurityPolicy) {
    finalConfig.contentSecurityPolicy = generateCSP(nonce);
  }

  // Apply headers
  if (finalConfig.contentSecurityPolicy) {
    response.headers.set('Content-Security-Policy', finalConfig.contentSecurityPolicy);
  }

  if (finalConfig.strictTransportSecurity && process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', finalConfig.strictTransportSecurity);
  }

  if (finalConfig.xContentTypeOptions) {
    response.headers.set('X-Content-Type-Options', finalConfig.xContentTypeOptions);
  }

  if (finalConfig.xFrameOptions) {
    response.headers.set('X-Frame-Options', finalConfig.xFrameOptions);
  }

  if (finalConfig.xXSSProtection) {
    response.headers.set('X-XSS-Protection', finalConfig.xXSSProtection);
  }

  if (finalConfig.referrerPolicy) {
    response.headers.set('Referrer-Policy', finalConfig.referrerPolicy);
  }

  if (finalConfig.permissionsPolicy) {
    response.headers.set('Permissions-Policy', finalConfig.permissionsPolicy);
  }

  if (finalConfig.xDNSPrefetchControl) {
    response.headers.set('X-DNS-Prefetch-Control', finalConfig.xDNSPrefetchControl);
  }

  if (finalConfig.xDownloadOptions) {
    response.headers.set('X-Download-Options', finalConfig.xDownloadOptions);
  }

  if (finalConfig.expectCT && process.env.NODE_ENV === 'production') {
    response.headers.set('Expect-CT', finalConfig.expectCT);
  }

  // Apply custom headers
  if (finalConfig.customHeaders) {
    Object.entries(finalConfig.customHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  return response;
}

/**
 * Security Headers Middleware
 */
export function securityHeadersMiddleware(config: Partial<SecurityHeadersConfig> = {}) {
  return async function securityHeaders(
    request: NextRequest,
    handler?: (req: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    // Generate nonce for CSP
    const nonce = generateNonce();

    // Execute handler or continue
    let response: NextResponse;
    if (handler) {
      response = await handler(request);
    } else {
      response = NextResponse.next();
    }

    // Apply security headers
    response = applySecurityHeaders(response, config, nonce);

    // Add nonce to request for use in components
    response.headers.set('X-Nonce', nonce);

    return response;
  };
}

/**
 * Generate cryptographic nonce for CSP
 */
export function generateNonce(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '');
  }
  // Fallback for environments without crypto.randomUUID
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

/**
 * Helper to get nonce from response headers
 */
export function getNonceFromResponse(response: NextResponse): string | null {
  return response.headers.get('X-Nonce');
}

/**
 * Additional security headers for API routes
 */
export const API_SECURITY_HEADERS = {
  // Prevent caching of sensitive data
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Surrogate-Control': 'no-store',

  // Content type
  'Content-Type': 'application/json; charset=utf-8',

  // Prevent MIME sniffing
  'X-Content-Type-Options': 'nosniff',

  // Additional security
  'X-Permitted-Cross-Domain-Policies': 'none',
};

/**
 * Apply API security headers
 */
export function applyAPISecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(API_SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

// Export default
export default securityHeadersMiddleware;
