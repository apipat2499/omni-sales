'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { UserRole, UserRoleInfo, getRoleFromSession, hasMinimumRole } from '@/lib/auth/getRoleFromSession';
import { checkPermission, Permission, Resource, getUserPermissions, PermissionCheck } from '@/lib/auth/checkPermission';

export interface UseUserRoleResult {
  role: UserRole;
  roleInfo: UserRoleInfo | null;
  loading: boolean;
  error: Error | null;
  hasRole: (role: UserRole) => boolean;
  hasMinRole: (role: UserRole) => Promise<boolean>;
  hasPermission: (resource: Resource, action: Permission) => Promise<boolean>;
  permissions: PermissionCheck[];
  isOwner: boolean;
  isManager: boolean;
  isStaff: boolean;
  isViewer: boolean;
  isAdmin: boolean;
  refetch: () => Promise<void>;
}

/**
 * Hook to get current user's role and permissions
 *
 * @returns UseUserRoleResult object with role info and helper functions
 *
 * @example
 * const { role, isOwner, hasPermission } = useUserRole();
 *
 * if (isOwner) {
 *   // Show owner-only UI
 * }
 *
 * const canDelete = await hasPermission('products', 'delete');
 */
export function useUserRole(): UseUserRoleResult {
  const { user } = useAuth();
  const [roleInfo, setRoleInfo] = useState<UserRoleInfo | null>(null);
  const [permissions, setPermissions] = useState<PermissionCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRole = useCallback(async () => {
    if (!user || !supabase) {
      setRoleInfo(null);
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch user role
      const roleData = await getRoleFromSession(supabase, user);
      setRoleInfo(roleData);

      // Fetch user permissions
      if (roleData?.userId) {
        const userPerms = await getUserPermissions(supabase, roleData.userId);
        setPermissions(userPerms);
      }
    } catch (err) {
      console.error('Error fetching user role:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  // Helper function to check if user has a specific role
  const hasRole = useCallback(
    (role: UserRole): boolean => {
      return roleInfo?.role === role;
    },
    [roleInfo]
  );

  // Helper function to check if user has minimum role level
  const hasMinRole = useCallback(
    async (minimumRole: UserRole): Promise<boolean> => {
      if (!user || !supabase || !roleInfo?.userId) return false;
      return hasMinimumRole(supabase, roleInfo.userId, minimumRole);
    },
    [user, roleInfo]
  );

  // Helper function to check if user has a specific permission
  const hasPermissionCheck = useCallback(
    async (resource: Resource, action: Permission): Promise<boolean> => {
      if (!user || !supabase || !roleInfo?.userId) return false;
      return checkPermission(supabase, roleInfo.userId, resource, action);
    },
    [user, roleInfo]
  );

  return {
    role: roleInfo?.role || null,
    roleInfo,
    loading,
    error,
    hasRole,
    hasMinRole,
    hasPermission: hasPermissionCheck,
    permissions,
    isOwner: roleInfo?.role === 'owner',
    isManager: roleInfo?.role === 'manager',
    isStaff: roleInfo?.role === 'staff',
    isViewer: roleInfo?.role === 'viewer',
    isAdmin: roleInfo?.role === 'owner' || roleInfo?.role === 'manager',
    refetch: fetchRole,
  };
}

/**
 * Hook to check if user has a specific permission (optimized for single permission check)
 *
 * @param resource - Resource to check
 * @param action - Action to check
 * @returns Object with hasPermission boolean and loading state
 *
 * @example
 * const { hasPermission, loading } = usePermission('products', 'delete');
 *
 * if (hasPermission) {
 *   // Show delete button
 * }
 */
export function usePermission(resource: Resource, action: Permission) {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPerm = async () => {
      if (!user || !supabase) {
        setHasPermission(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await checkPermission(supabase, user.id, resource, action);
        setHasPermission(result);
      } catch (error) {
        console.error('Error checking permission:', error);
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    };

    checkPerm();
  }, [user, resource, action]);

  return { hasPermission, loading };
}

/**
 * Hook to check if user has a minimum role level
 *
 * @param minimumRole - Minimum role required
 * @returns Object with hasRole boolean and loading state
 *
 * @example
 * const { hasRole, loading } = useMinimumRole('manager');
 *
 * if (hasRole) {
 *   // Show manager-level features
 * }
 */
export function useMinimumRole(minimumRole: UserRole) {
  const { user } = useAuth();
  const [hasRole, setHasRole] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      if (!user || !supabase || !minimumRole) {
        setHasRole(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await hasMinimumRole(supabase, user.id, minimumRole);
        setHasRole(result);
      } catch (error) {
        console.error('Error checking role:', error);
        setHasRole(false);
      } finally {
        setLoading(false);
      }
    };

    checkRole();
  }, [user, minimumRole]);

  return { hasRole, loading };
}
