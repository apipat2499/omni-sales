import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { getRoleFromSession, hasMinimumRole, UserRole } from './getRoleFromSession';
import { checkPermission, Permission, Resource } from './checkPermission';

export interface RBACOptions {
  requiredRole?: UserRole;
  requiredPermission?: {
    resource: Resource;
    action: Permission;
  };
  onUnauthorized?: (reason: string) => NextResponse;
}

/**
 * Middleware to protect API routes with role-based access control
 *
 * @param request - Next.js request object
 * @param options - RBAC options (role or permission requirements)
 * @returns NextResponse or null if authorized
 *
 * @example
 * // Require minimum role of manager
 * const authCheck = await withRBAC(request, { requiredRole: 'manager' });
 * if (authCheck) return authCheck;
 *
 * @example
 * // Require specific permission
 * const authCheck = await withRBAC(request, {
 *   requiredPermission: { resource: 'products', action: 'delete' }
 * });
 * if (authCheck) return authCheck;
 */
export async function withRBAC(
  request: NextRequest,
  options: RBACOptions = {}
): Promise<NextResponse | null> {
  try {
    const response = NextResponse.next();
    const supabase = createMiddlewareClient({ req: request, res: response });

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return options.onUnauthorized
        ? options.onUnauthorized('Not authenticated')
        : NextResponse.json(
            { error: 'Unauthorized', message: 'Authentication required' },
            { status: 401 }
          );
    }

    // Check role requirement if specified
    if (options.requiredRole) {
      const hasRole = await hasMinimumRole(supabase, user.id, options.requiredRole);

      if (!hasRole) {
        return options.onUnauthorized
          ? options.onUnauthorized(`Requires minimum role: ${options.requiredRole}`)
          : NextResponse.json(
              {
                error: 'Forbidden',
                message: `This action requires minimum role: ${options.requiredRole}`,
              },
              { status: 403 }
            );
      }
    }

    // Check permission requirement if specified
    if (options.requiredPermission) {
      const { resource, action } = options.requiredPermission;
      const hasPermission = await checkPermission(supabase, user.id, resource, action);

      if (!hasPermission) {
        return options.onUnauthorized
          ? options.onUnauthorized(`Missing permission: ${resource}:${action}`)
          : NextResponse.json(
              {
                error: 'Forbidden',
                message: `You don't have permission to ${action} ${resource}`,
              },
              { status: 403 }
            );
      }
    }

    // Authorization successful
    return null;
  } catch (error) {
    console.error('RBAC middleware error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Authorization check failed' },
      { status: 500 }
    );
  }
}

/**
 * Create a middleware function that requires a specific role
 */
export function requireRole(role: UserRole) {
  return async (request: NextRequest) => {
    return withRBAC(request, { requiredRole: role });
  };
}

/**
 * Create a middleware function that requires a specific permission
 */
export function requirePermission(resource: Resource, action: Permission) {
  return async (request: NextRequest) => {
    return withRBAC(request, {
      requiredPermission: { resource, action },
    });
  };
}

/**
 * Middleware for owner-only routes
 */
export const requireOwner = requireRole('owner');

/**
 * Middleware for manager-level routes (manager or owner)
 */
export const requireManager = requireRole('manager');

/**
 * Middleware for staff-level routes (staff, manager, or owner)
 */
export const requireStaff = requireRole('staff');

/**
 * Helper to get user from request
 */
export async function getUserFromRequest(request: NextRequest) {
  try {
    const response = NextResponse.next();
    const supabase = createMiddlewareClient({ req: request, res: response });
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error getting user from request:', error);
    return null;
  }
}

/**
 * Helper to get user role from request
 */
export async function getUserRoleFromRequest(request: NextRequest) {
  try {
    const response = NextResponse.next();
    const supabase = createMiddlewareClient({ req: request, res: response });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    return getRoleFromSession(supabase, user);
  } catch (error) {
    console.error('Error getting user role from request:', error);
    return null;
  }
}
