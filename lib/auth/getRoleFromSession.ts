import { SupabaseClient, User } from '@supabase/supabase-js';

export type UserRole = 'owner' | 'manager' | 'staff' | 'viewer' | null;

export interface UserRoleInfo {
  role: UserRole;
  roleId: string | null;
  userId: string;
  expiresAt?: Date | null;
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

    if (error || !data) {
      console.warn('No role found for user:', currentUser.id);
      return {
        role: null,
        roleId: null,
        userId: currentUser.id,
      };
    }

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
