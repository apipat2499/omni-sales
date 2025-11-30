import { SupabaseClient, User } from '@supabase/supabase-js';

export type UserRole = 'owner' | 'manager' | 'staff' | 'viewer' | null;

export interface UserRoleInfo {
  role: UserRole;
  roleId: string | null;
  userId: string;
  expiresAt?: Date | null;
}

// Cache flag to skip RBAC queries if tables don't exist
let rbacTablesAvailable: boolean | null = null;

// Promise cache to deduplicate in-flight requests
const pendingRoleRequests = new Map<string, Promise<UserRoleInfo | null>>();

/**
 * Internal function that performs the actual role query
 */
async function _getRoleFromSessionInternal(
  supabase: SupabaseClient,
  currentUser: User
): Promise<UserRoleInfo | null> {
  try {
    // Check if RBAC is enabled via environment variable
    const rbacEnabled = process.env.NEXT_PUBLIC_ENABLE_RBAC === 'true';
    if (!rbacEnabled) {
      // RBAC disabled - skip all queries
      return {
        role: null,
        roleId: null,
        userId: currentUser.id,
      };
    }

    // Skip RBAC queries if we know tables don't exist
    if (rbacTablesAvailable === false) {
      return {
        role: null,
        roleId: null,
        userId: currentUser.id,
      };
    }

    // Query user_roles to get the user's highest priority role
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        id,
        role_id,
        expires_at,
        roles (
          id,
          name
        )
      `)
      .eq('user_id', currentUser.id)
      .or('expires_at.is.null,expires_at.gt.now()')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // Handle table not found error (404) gracefully
      if (error.code === 'PGRST116' || error.code === 'PGRST204' || error.code === 'PGRST205') {
        // Cache that RBAC tables are not available
        rbacTablesAvailable = false;
        console.warn('RBAC tables not found - running in demo mode (cached)');
        return {
          role: null,
          roleId: null,
          userId: currentUser.id,
        };
      }
      console.warn('No role found for user:', currentUser.id, error);
      return {
        role: null,
        roleId: null,
        userId: currentUser.id,
      };
    }

    if (!data) {
      return {
        role: null,
        roleId: null,
        userId: currentUser.id,
      };
    }

    // Cache that RBAC tables are available
    rbacTablesAvailable = true;

    const roleName = (data.roles as any)?.name as UserRole;

    return {
      role: roleName,
      roleId: data.role_id,
      userId: currentUser.id,
      expiresAt: data.expires_at ? new Date(data.expires_at) : null,
    };
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

/**
 * Get the user's role from their session
 * @param supabase - Supabase client instance
 * @param user - Optional user object (if not provided, will fetch from session)
 * @returns UserRoleInfo object containing role and metadata
 */
export async function getRoleFromSession(
  supabase: SupabaseClient,
  user?: User | null
): Promise<UserRoleInfo | null> {
  try {
    // Get user from session if not provided
    let currentUser = user;
    if (!currentUser) {
      const { data: { user: sessionUser } } = await supabase.auth.getUser();
      currentUser = sessionUser;
    }

    if (!currentUser) {
      return null;
    }

    const userId = currentUser.id;

    // Check if there's already a pending request for this user
    const existingRequest = pendingRoleRequests.get(userId);
    if (existingRequest) {
      console.log('[getRoleFromSession] Reusing existing request for user:', userId);
      return existingRequest;
    }

    // Create new request and cache it
    const request = _getRoleFromSessionInternal(supabase, currentUser)
      .finally(() => {
        // Clean up the cache after request completes
        pendingRoleRequests.delete(userId);
      });

    pendingRoleRequests.set(userId, request);
    return request;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

/**
 * Get user's highest priority role
 * Roles are prioritized: owner > manager > staff > viewer
 */
export async function getUserHighestRole(
  supabase: SupabaseClient,
  userId: string
): Promise<UserRoleInfo | null> {
  try {
    const { data, error } = await supabase
      .rpc('get_user_role', { user_id: userId });

    if (error || !data || data.length === 0) {
      return null;
    }

    const roleData = data[0];
    return {
      role: roleData.role_name as UserRole,
      roleId: roleData.role_id,
      userId,
    };
  } catch (error) {
    console.error('Error getting highest user role:', error);
    return null;
  }
}

/**
 * Check if user has a specific role
 */
export async function hasRole(
  supabase: SupabaseClient,
  userId: string,
  requiredRole: UserRole
): Promise<boolean> {
  const roleInfo = await getUserHighestRole(supabase, userId);
  return roleInfo?.role === requiredRole;
}

/**
 * Check if user has any of the specified roles
 */
export async function hasAnyRole(
  supabase: SupabaseClient,
  userId: string,
  roles: UserRole[]
): Promise<boolean> {
  const roleInfo = await getUserHighestRole(supabase, userId);
  if (!roleInfo?.role) return false;
  return roles.includes(roleInfo.role);
}

/**
 * Get role hierarchy level (lower number = higher priority)
 */
export function getRoleLevel(role: UserRole): number {
  const roleLevels: Record<string, number> = {
    owner: 1,
    manager: 2,
    staff: 3,
    viewer: 4,
  };
  return role ? roleLevels[role] || 999 : 999;
}

/**
 * Check if user's role is at least the required level
 * Returns true if user's role has equal or higher priority
 */
export async function hasMinimumRole(
  supabase: SupabaseClient,
  userId: string,
  minimumRole: UserRole
): Promise<boolean> {
  const roleInfo = await getUserHighestRole(supabase, userId);
  if (!roleInfo?.role || !minimumRole) return false;

  return getRoleLevel(roleInfo.role) <= getRoleLevel(minimumRole);
}
