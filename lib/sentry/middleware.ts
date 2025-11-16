/**
 * Sentry API Middleware
 * Wraps API routes with error capturing and context tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { captureException, addSentryBreadcrumb, setSentryContext } from './init';

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Extract user information from request
 */
function extractUserFromRequest(req: NextRequest): any {
  // Try to extract user from various auth methods
  const authHeader = req.headers.get('authorization');
  const cookies = req.cookies;

  // You can customize this based on your auth implementation
  return {
    authToken: authHeader ? authHeader.substring(0, 20) + '...' : undefined,
    hasSession: !!(cookies.get('sb-access-token') || cookies.get('supabase-auth-token')),
  };
}

/**
 * Wrapper for Next.js API routes with Sentry error capturing
 */
export function withSentry<T = any>(
  handler: (req: NextRequest) => Promise<NextResponse<T>>
): (req: NextRequest) => Promise<NextResponse<T>> {
  return async (req: NextRequest) => {
    const requestId = generateRequestId();
    const startTime = Date.now();

    try {
      // Add request context to Sentry
      const userInfo = extractUserFromRequest(req);

      Sentry.setTags({
        request_id: requestId,
        method: req.method || 'UNKNOWN',
        url: req.url,
      });

      setSentryContext('request', {
        id: requestId,
        method: req.method,
        url: req.url,
        headers: Object.fromEntries(req.headers.entries()),
        userInfo,
      });

      // Add breadcrumb for API call
      addSentryBreadcrumb({
        message: `API Request: ${req.method} ${req.url}`,
        category: 'api',
        level: 'info',
        data: {
          request_id: requestId,
          method: req.method,
          url: req.url,
        },
      });

      // Execute the handler
      const response = await handler(req);

      // Add success breadcrumb
      const duration = Date.now() - startTime;
      addSentryBreadcrumb({
        message: `API Response: ${response.status}`,
        category: 'api',
        level: 'info',
        data: {
          request_id: requestId,
          status: response.status,
          duration_ms: duration,
        },
      });

      // Add custom header with request ID
      response.headers.set('X-Request-ID', requestId);

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Capture the error in Sentry
      captureException(error as Error, {
        tags: {
          request_id: requestId,
          api_route: 'true',
          method: req.method || 'UNKNOWN',
        },
        extra: {
          url: req.url,
          method: req.method,
          duration_ms: duration,
          headers: Object.fromEntries(req.headers.entries()),
        },
      });

      // Add error breadcrumb
      addSentryBreadcrumb({
        message: `API Error: ${(error as Error).message}`,
        category: 'api',
        level: 'error',
        data: {
          request_id: requestId,
          error: (error as Error).message,
          duration_ms: duration,
        },
      });

      // Return error response
      return NextResponse.json(
        {
          error: 'Internal Server Error',
          message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'An error occurred',
          request_id: requestId,
        },
        {
          status: 500,
          headers: {
            'X-Request-ID': requestId,
          },
        }
      );
    }
  };
}

/**
 * Middleware for API route handlers (alternative approach)
 */
export function apiErrorHandler(
  handler: (req: NextRequest, context?: any) => Promise<Response>
) {
  return async (req: NextRequest, context?: any): Promise<Response> => {
    const requestId = generateRequestId();

    try {
      // Set up Sentry context
      Sentry.setTag('request_id', requestId);
      Sentry.setTag('api_handler', 'true');

      // Execute handler
      const response = await handler(req, context);

      // Add request ID to response
      const newResponse = new Response(response.body, response);
      newResponse.headers.set('X-Request-ID', requestId);

      return newResponse;
    } catch (error) {
      // Capture error
      captureException(error as Error, {
        tags: {
          request_id: requestId,
          handler_type: 'api',
        },
        extra: {
          url: req.url,
          method: req.method,
        },
      });

      // Rethrow to let Next.js handle it
      throw error;
    }
  };
}

/**
 * Helper to create error response with Sentry context
 */
export function createErrorResponse(
  error: Error,
  status: number = 500,
  requestId?: string
): NextResponse {
  const id = requestId || generateRequestId();

  captureException(error, {
    tags: {
      request_id: id,
      status_code: status.toString(),
    },
  });

  return NextResponse.json(
    {
      error: error.message,
      request_id: id,
    },
    {
      status,
      headers: {
        'X-Request-ID': id,
      },
    }
  );
}

/**
 * Type-safe API route wrapper with automatic error handling
 */
export function createAPIRoute<TResponse = any>(
  handler: (req: NextRequest) => Promise<TResponse>
) {
  return withSentry(async (req: NextRequest) => {
    const result = await handler(req);
    return NextResponse.json(result);
  });
}
