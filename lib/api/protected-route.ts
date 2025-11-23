import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAuth, apiRequireRoles } from '@/lib/middleware/authMiddleware';
import { withRateLimit, RateLimitConfig } from '@/lib/middleware/rateLimit';

/**
 * Wrapper for protected API routes that require authentication
 * Handles auth checking and rate limiting
 */
export async function withProtection(
  req: NextRequest,
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>,
  options?: {
    requireRole?: string[];
    rateLimit?: Partial<RateLimitConfig>;
  }
): Promise<NextResponse> {
  // Check authentication
  const { user, error } = apiRequireAuth(req);
  if (error) return error;

  // Check role if required
  if (options?.requireRole) {
    const { error: roleError } = apiRequireRoles(req, options.requireRole as any);
    if (roleError) return roleError;
  }

  // Execute handler with user ID
  return handler(req, user!.id);
}

/**
 * Simple auth check that returns user or error response
 */
export function checkAuth(req: NextRequest) {
  return apiRequireAuth(req);
}

/**
 * Simple role check that returns error if not authorized
 */
export function checkRole(req: NextRequest, roles: string[]) {
  return apiRequireRoles(req, roles as any);
}

/**
 * Wrap a handler with auth protection
 */
export function protectedHandler(
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>,
  options?: { requireRole?: string[] }
) {
  return async (req: NextRequest) => {
    return withProtection(req, handler, options);
  };
}
