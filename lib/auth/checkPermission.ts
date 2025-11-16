import { SupabaseClient } from '@supabase/supabase-js';

export type Permission = 'create' | 'read' | 'update' | 'delete' | 'bulk_edit';
export type Resource = 'products' | 'orders' | 'customers' | 'users' | 'settings' | 'reports' | '*';

export interface PermissionCheck {
  resource: Resource;
  action: Permission;
}

/**
 * Check if a user has a specific permission
 * @param supabase - Supabase client instance
 * @param userId - User ID to check permissions for
 * @param resource - Resource to check (e.g., 'products', 'orders')
 * @param action - Action to check (e.g., 'create', 'read', 'update', 'delete')
 * @returns boolean indicating if user has the permission
 */
export async function checkPermission(
  supabase: SupabaseClient,
  userId: string,
  resource: Resource,
  action: Permission
): Promise<boolean> {
  try {
    // Use the has_permission function from the database
    const { data, error } = await supabase
      .rpc('has_permission', {
        user_id: userId,
        required_permission: `${resource}:${action}`,
      });

    if (error) {
      console.error('Error checking permission:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Check if user has all specified permissions
 */
export async function checkAllPermissions(
  supabase: SupabaseClient,
  userId: string,
  permissions: PermissionCheck[]
): Promise<boolean> {
  try {
    const checks = await Promise.all(
      permissions.map(({ resource, action }) =>
        checkPermission(supabase, userId, resource, action)
      )
    );

    return checks.every((result) => result === true);
  } catch (error) {
    console.error('Error checking multiple permissions:', error);
    return false;
  }
}

/**
 * Check if user has any of the specified permissions
 */
export async function checkAnyPermission(
  supabase: SupabaseClient,
  userId: string,
  permissions: PermissionCheck[]
): Promise<boolean> {
  try {
    const checks = await Promise.all(
      permissions.map(({ resource, action }) =>
        checkPermission(supabase, userId, resource, action)
      )
    );

    return checks.some((result) => result === true);
  } catch (error) {
    console.error('Error checking multiple permissions:', error);
    return false;
  }
}

/**
 * Get all permissions for a user
 */
export async function getUserPermissions(
  supabase: SupabaseClient,
  userId: string
): Promise<PermissionCheck[]> {
  try {
    const { data, error } = await supabase
      .from('user_permissions_view')
      .select('resource, action')
      .eq('user_id', userId);

    if (error || !data) {
      console.error('Error fetching user permissions:', error);
      return [];
    }

    return data.map((perm) => ({
      resource: perm.resource as Resource,
      action: perm.action as Permission,
    }));
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return [];
  }
}

/**
 * Check if user can perform bulk operations
 */
export async function canBulkEdit(
  supabase: SupabaseClient,
  userId: string,
  resource: Resource
): Promise<boolean> {
  return checkPermission(supabase, userId, resource, 'bulk_edit');
}

/**
 * Check if user is an admin (owner or manager)
 */
export async function isAdmin(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        roles (
          name
        )
      `)
      .eq('user_id', userId)
      .or('expires_at.is.null,expires_at.gt.now()')
      .single();

    if (error || !data) {
      return false;
    }

    const roleName = (data.roles as any)?.name;
    return roleName === 'owner' || roleName === 'manager';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Check if user is an owner
 */
export async function isOwner(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        roles (
          name
        )
      `)
      .eq('user_id', userId)
      .or('expires_at.is.null,expires_at.gt.now()')
      .single();

    if (error || !data) {
      return false;
    }

    const roleName = (data.roles as any)?.name;
    return roleName === 'owner';
  } catch (error) {
    console.error('Error checking owner status:', error);
    return false;
  }
}
