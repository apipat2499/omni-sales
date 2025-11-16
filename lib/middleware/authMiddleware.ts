/**
 * Authentication Middleware
 *
 * Provides route protection and authentication checking for:
 * - Session validation
 * - Permission checking
 * - Role-based access control
 * - Redirect handling
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  User,
  UserRole,
  PermissionAction,
  AuthTokenPayload,
} from '@/types';
import { validateToken, getCurrentUser } from '@/lib/utils/auth';
import { hasPermission, hasRole, hasAnyRole } from '@/lib/utils/rbac';

// ============================================
// Types
// ============================================

export interface AuthMiddlewareConfig {
  requireAuth?: boolean;
  requiredPermissions?: PermissionAction[];
  requiredRoles?: UserRole[];
  requireAllPermissions?: boolean; // Default: false (requires any)
  redirectTo?: string;
}

export interface AuthCheckResult {
  isAuthenticated: boolean;
  user: User | null;
  hasAccess: boolean;
  reason?: string;
}

// ============================================
// Constants
// ============================================

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/_next',
  '/static',
  '/favicon.ico',
  '/api/auth/login',
  '/api/auth/register',
];

const DEFAULT_REDIRECT = '/login';
const AUTHENTICATED_REDIRECT = '/dashboard';

// ============================================
// Token Management
// ============================================

/**
 * Get token from request
 */
export function getTokenFromRequest(request: NextRequest): string | null {
  // Try to get from Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try to get from cookie
  const token = request.cookies.get('auth_token')?.value;
  if (token) {
    return token;
  }

  return null;
}

/**
 * Validate request authentication
 */
export function validateRequestAuth(request: NextRequest): {
  isValid: boolean;
  user: User | null;
  payload: AuthTokenPayload | null;
  error?: string;
} {
  const token = getTokenFromRequest(request);

  if (!token) {
    return {
      isValid: false,
      user: null,
      payload: null,
      error: 'No authentication token provided',
    };
  }

  // Validate token
  const validation = validateToken(token);

  if (!validation.isValid || !validation.payload) {
    return {
      isValid: false,
      user: null,
      payload: null,
      error: validation.error || 'Invalid token',
    };
  }

  // Get user
  const user = getCurrentUser(token);

  if (!user) {
    return {
      isValid: false,
      user: null,
      payload: validation.payload,
      error: 'User not found',
    };
  }

  // Check if user is active
  if (!user.isActive) {
    return {
      isValid: false,
      user,
      payload: validation.payload,
      error: 'User account is inactive',
    };
  }

  return {
    isValid: true,
    user,
    payload: validation.payload,
  };
}

// ============================================
// Permission Checking
// ============================================

/**
 * Check if user has required permissions
 */
export function checkUserPermissions(
  user: User,
  requiredPermissions: PermissionAction[],
  requireAll: boolean = false
): {
  hasAccess: boolean;
  missingPermissions: PermissionAction[];
} {
  const missingPermissions: PermissionAction[] = [];

  for (const permission of requiredPermissions) {
    if (!hasPermission(user, permission)) {
      missingPermissions.push(permission);
    }
  }

  const hasAccess = requireAll
    ? missingPermissions.length === 0
    : missingPermissions.length < requiredPermissions.length;

  return {
    hasAccess,
    missingPermissions,
  };
}

/**
 * Check if user has required roles
 */
export function checkUserRoles(
  user: User,
  requiredRoles: UserRole[]
): {
  hasAccess: boolean;
  userRoles: UserRole[];
} {
  const userRoles = user.roles.map(r => r.name);
  const hasAccess = hasAnyRole(user, requiredRoles);

  return {
    hasAccess,
    userRoles,
  };
}

// ============================================
// Middleware Functions
// ============================================

/**
 * Check if path is public
 */
export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(path => pathname.startsWith(path));
}

/**
 * Perform auth check
 */
export function performAuthCheck(
  request: NextRequest,
  config: AuthMiddlewareConfig = {}
): AuthCheckResult {
  // Check if auth is required
  if (!config.requireAuth) {
    return {
      isAuthenticated: false,
      user: null,
      hasAccess: true,
    };
  }

  // Validate authentication
  const authValidation = validateRequestAuth(request);

  if (!authValidation.isValid || !authValidation.user) {
    return {
      isAuthenticated: false,
      user: null,
      hasAccess: false,
      reason: authValidation.error || 'Not authenticated',
    };
  }

  const user = authValidation.user;

  // Check permissions
  if (config.requiredPermissions && config.requiredPermissions.length > 0) {
    const permissionCheck = checkUserPermissions(
      user,
      config.requiredPermissions,
      config.requireAllPermissions
    );

    if (!permissionCheck.hasAccess) {
      return {
        isAuthenticated: true,
        user,
        hasAccess: false,
        reason: `Missing permissions: ${permissionCheck.missingPermissions.join(', ')}`,
      };
    }
  }

  // Check roles
  if (config.requiredRoles && config.requiredRoles.length > 0) {
    const roleCheck = checkUserRoles(user, config.requiredRoles);

    if (!roleCheck.hasAccess) {
      return {
        isAuthenticated: true,
        user,
        hasAccess: false,
        reason: `Missing required roles: ${config.requiredRoles.join(', ')}`,
      };
    }
  }

  return {
    isAuthenticated: true,
    user,
    hasAccess: true,
  };
}

/**
 * Create auth middleware response
 */
export function createAuthResponse(
  checkResult: AuthCheckResult,
  config: AuthMiddlewareConfig,
  request: NextRequest
): NextResponse | null {
  // If access is granted, continue
  if (checkResult.hasAccess) {
    return null; // Continue to next middleware/route
  }

  // If not authenticated, redirect to login
  if (!checkResult.isAuthenticated) {
    const loginUrl = new URL(config.redirectTo || DEFAULT_REDIRECT, request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated but no access, show 403
  return new NextResponse(
    JSON.stringify({
      error: 'Forbidden',
      message: checkResult.reason || 'You do not have permission to access this resource',
    }),
    {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

// ============================================
// Middleware Factory
// ============================================

/**
 * Create auth middleware with config
 */
export function createAuthMiddleware(config: AuthMiddlewareConfig = {}) {
  return (request: NextRequest): NextResponse | null => {
    const { pathname } = request.nextUrl;

    // Allow public paths
    if (isPublicPath(pathname)) {
      return null;
    }

    // Perform auth check
    const checkResult = performAuthCheck(request, config);

    // Create response based on check result
    return createAuthResponse(checkResult, config, request);
  };
}

/**
 * Require authentication middleware
 */
export function requireAuth(redirectTo?: string) {
  return createAuthMiddleware({
    requireAuth: true,
    redirectTo,
  });
}

/**
 * Require specific permissions
 */
export function requirePermissions(
  permissions: PermissionAction[],
  requireAll: boolean = false,
  redirectTo?: string
) {
  return createAuthMiddleware({
    requireAuth: true,
    requiredPermissions: permissions,
    requireAllPermissions: requireAll,
    redirectTo,
  });
}

/**
 * Require specific roles
 */
export function requireRoles(roles: UserRole[], redirectTo?: string) {
  return createAuthMiddleware({
    requireAuth: true,
    requiredRoles: roles,
    redirectTo,
  });
}

/**
 * Require admin role
 */
export function requireAdmin(redirectTo?: string) {
  return requireRoles(['admin', 'super_admin'], redirectTo);
}

/**
 * Require super admin role
 */
export function requireSuperAdmin(redirectTo?: string) {
  return requireRoles(['super_admin'], redirectTo);
}

// ============================================
// API Route Helpers
// ============================================

/**
 * Get authenticated user from API request
 */
export function getAuthenticatedUser(request: NextRequest): User | null {
  const validation = validateRequestAuth(request);
  return validation.user;
}

/**
 * Require auth for API route
 */
export function apiRequireAuth(request: NextRequest): {
  user: User | null;
  error?: NextResponse;
} {
  const validation = validateRequestAuth(request);

  if (!validation.isValid || !validation.user) {
    return {
      user: null,
      error: new NextResponse(
        JSON.stringify({
          error: 'Unauthorized',
          message: validation.error || 'Authentication required',
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      ),
    };
  }

  return {
    user: validation.user,
  };
}

/**
 * Require permissions for API route
 */
export function apiRequirePermissions(
  request: NextRequest,
  permissions: PermissionAction[],
  requireAll: boolean = false
): {
  user: User | null;
  error?: NextResponse;
} {
  const { user, error } = apiRequireAuth(request);

  if (error || !user) {
    return { user: null, error };
  }

  const permissionCheck = checkUserPermissions(user, permissions, requireAll);

  if (!permissionCheck.hasAccess) {
    return {
      user: null,
      error: new NextResponse(
        JSON.stringify({
          error: 'Forbidden',
          message: `Missing permissions: ${permissionCheck.missingPermissions.join(', ')}`,
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      ),
    };
  }

  return { user };
}

/**
 * Require roles for API route
 */
export function apiRequireRoles(
  request: NextRequest,
  roles: UserRole[]
): {
  user: User | null;
  error?: NextResponse;
} {
  const { user, error } = apiRequireAuth(request);

  if (error || !user) {
    return { user: null, error };
  }

  const roleCheck = checkUserRoles(user, roles);

  if (!roleCheck.hasAccess) {
    return {
      user: null,
      error: new NextResponse(
        JSON.stringify({
          error: 'Forbidden',
          message: `Missing required roles: ${roles.join(', ')}`,
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      ),
    };
  }

  return { user };
}

// ============================================
// Route Protection Examples
// ============================================

/**
 * Example usage in middleware.ts:
 *
 * import { requireAuth, requirePermissions } from '@/lib/middleware/authMiddleware';
 *
 * export function middleware(request: NextRequest) {
 *   // Protect all routes under /dashboard
 *   if (request.nextUrl.pathname.startsWith('/dashboard')) {
 *     return requireAuth()(request);
 *   }
 *
 *   // Protect admin routes
 *   if (request.nextUrl.pathname.startsWith('/admin')) {
 *     return requireAdmin()(request);
 *   }
 *
 *   // Protect specific routes with permissions
 *   if (request.nextUrl.pathname.startsWith('/orders')) {
 *     return requirePermissions(['order.read'])(request);
 *   }
 * }
 */

/**
 * Example usage in API routes:
 *
 * import { apiRequireAuth, apiRequirePermissions } from '@/lib/middleware/authMiddleware';
 *
 * export async function GET(request: NextRequest) {
 *   const { user, error } = apiRequireAuth(request);
 *   if (error) return error;
 *
 *   // User is authenticated, continue with request
 *   return NextResponse.json({ user });
 * }
 *
 * export async function POST(request: NextRequest) {
 *   const { user, error } = apiRequirePermissions(request, ['order.create']);
 *   if (error) return error;
 *
 *   // User has required permission, continue with request
 *   return NextResponse.json({ success: true });
 * }
 */
