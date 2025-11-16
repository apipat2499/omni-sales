/**
 * useRBAC Hook - Role-Based Access Control
 *
 * This hook provides permission checking functionality including:
 * - Permission checking hooks
 * - Role-based access control
 * - Feature flags based on permissions
 * - Role management
 */

import { useState, useCallback, useMemo } from 'react';
import {
  User,
  Role,
  Permission,
  UserRole,
  PermissionAction,
  PermissionCategory,
  PermissionCheckResult,
} from '@/types';
import {
  hasPermission,
  hasRole,
  hasAnyRole,
  hasAllPermissions,
  canAccess,
  getAvailableActions,
  getUserPermissions,
  getAllRoles,
  getRoleByName,
  getPermissionsByCategory,
  getAssignableRoles,
  canAssignRole,
  OrderPermissions,
  ProductPermissions,
  InventoryPermissions,
  AnalyticsPermissions,
  UserPermissions,
  SystemPermissions,
  checkPermission,
  getCachedPermissions,
  cachePermissions,
  clearPermissionCache,
} from '@/lib/utils/rbac';
import { useAuth } from './useAuth';
import { useToast } from './useToast';

// ============================================
// Main Hook
// ============================================

/**
 * Main RBAC hook
 */
export function useRBAC() {
  const { user } = useAuth();
  const { toast } = useToast();

  // ============================================
  // Permission Checking
  // ============================================

  /**
   * Check if user can create a resource
   */
  const canCreate = useCallback(
    (resource: PermissionCategory): boolean => {
      if (!user) return false;
      return canAccess(user, resource, 'create');
    },
    [user]
  );

  /**
   * Check if user can read a resource
   */
  const canRead = useCallback(
    (resource: PermissionCategory): boolean => {
      if (!user) return false;
      return canAccess(user, resource, 'read');
    },
    [user]
  );

  /**
   * Check if user can update a resource
   */
  const canUpdate = useCallback(
    (resource: PermissionCategory): boolean => {
      if (!user) return false;
      return canAccess(user, resource, 'update');
    },
    [user]
  );

  /**
   * Check if user can delete a resource
   */
  const canDelete = useCallback(
    (resource: PermissionCategory): boolean => {
      if (!user) return false;
      return canAccess(user, resource, 'delete');
    },
    [user]
  );

  /**
   * Get available actions for a resource
   */
  const getActions = useCallback(
    (resource: PermissionCategory): string[] => {
      if (!user) return [];
      return getAvailableActions(user, resource);
    },
    [user]
  );

  /**
   * Check detailed permission
   */
  const checkDetailedPermission = useCallback(
    (requiredPermissions: PermissionAction[]): PermissionCheckResult => {
      if (!user) {
        return {
          allowed: false,
          reason: 'User not authenticated',
          requiredPermissions,
          userPermissions: [],
        };
      }

      return checkPermission(user, requiredPermissions);
    },
    [user]
  );

  // ============================================
  // Role Management
  // ============================================

  /**
   * Get all available roles
   */
  const roles = useMemo(() => getAllRoles(), []);

  /**
   * Get user's permissions
   */
  const permissions = useMemo(() => {
    if (!user) return [];

    // Check cache first
    const cached = getCachedPermissions(user.id);
    if (cached) return cached;

    // Get fresh permissions
    const userPerms = getUserPermissions(user);

    // Cache for next time
    cachePermissions(user.id, userPerms);

    return userPerms;
  }, [user]);

  /**
   * Get roles that current user can assign
   */
  const assignableRoles = useMemo(() => {
    if (!user) return [];
    return getAssignableRoles(user);
  }, [user]);

  /**
   * Check if current user can assign a role
   */
  const canAssignRoleToUser = useCallback(
    (targetRole: Role): boolean => {
      if (!user) return false;
      return canAssignRole(user, targetRole);
    },
    [user]
  );

  /**
   * Assign role to user (placeholder - implement with actual API)
   */
  const assignRole = useCallback(
    async (userId: string, roleId: string): Promise<void> => {
      try {
        if (!user) {
          throw new Error('Not authenticated');
        }

        // Get target role
        const targetRole = roles.find(r => r.id === roleId);
        if (!targetRole) {
          throw new Error('Role not found');
        }

        // Check permission
        if (!canAssignRole(user, targetRole)) {
          throw new Error('Insufficient permissions to assign this role');
        }

        // TODO: Implement actual role assignment with API
        console.log('Assigning role:', roleId, 'to user:', userId);

        // Clear permission cache for the user
        clearPermissionCache(userId);

        toast({
          title: 'Role assigned',
          description: `Role ${targetRole.displayName} has been assigned`,
          variant: 'success',
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to assign role';
        toast({
          title: 'Assignment failed',
          description: errorMessage,
          variant: 'destructive',
        });
        throw err;
      }
    },
    [user, roles, toast]
  );

  /**
   * Remove role from user (placeholder - implement with actual API)
   */
  const removeRole = useCallback(
    async (userId: string, roleId: string): Promise<void> => {
      try {
        if (!user) {
          throw new Error('Not authenticated');
        }

        // TODO: Implement actual role removal with API
        console.log('Removing role:', roleId, 'from user:', userId);

        // Clear permission cache for the user
        clearPermissionCache(userId);

        toast({
          title: 'Role removed',
          description: 'Role has been removed from user',
          variant: 'success',
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to remove role';
        toast({
          title: 'Removal failed',
          description: errorMessage,
          variant: 'destructive',
        });
        throw err;
      }
    },
    [user, toast]
  );

  /**
   * Update permission for role (placeholder - implement with actual API)
   */
  const updatePermission = useCallback(
    async (roleId: string, permission: PermissionAction, grant: boolean): Promise<void> => {
      try {
        if (!user) {
          throw new Error('Not authenticated');
        }

        // Check if user can manage roles
        if (!UserPermissions.canManageRoles(user)) {
          throw new Error('Insufficient permissions to modify role permissions');
        }

        // TODO: Implement actual permission update with API
        console.log(
          'Updating permission:',
          permission,
          'for role:',
          roleId,
          'grant:',
          grant
        );

        toast({
          title: 'Permission updated',
          description: `Permission ${permission} has been ${grant ? 'granted' : 'revoked'}`,
          variant: 'success',
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update permission';
        toast({
          title: 'Update failed',
          description: errorMessage,
          variant: 'destructive',
        });
        throw err;
      }
    },
    [user, toast]
  );

  // ============================================
  // Return Values
  // ============================================

  return {
    // User info
    user,
    roles,
    permissions,
    assignableRoles,

    // Permission checking
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    getAvailableActions: getActions,
    checkPermission: checkDetailedPermission,

    // Role management
    assignRole,
    removeRole,
    updatePermission,
    canAssignRole: canAssignRoleToUser,

    // Permission helpers
    hasPermission: (permission: PermissionAction) =>
      user ? hasPermission(user, permission) : false,
    hasRole: (role: UserRole) => (user ? hasRole(user, role) : false),
    hasAnyRole: (roleNames: UserRole[]) => (user ? hasAnyRole(user, roleNames) : false),
  };
}

// ============================================
// Resource-Specific Hooks
// ============================================

/**
 * Hook for order permissions
 */
export function useOrderPermissions() {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) {
      return {
        canCreate: false,
        canRead: false,
        canUpdate: false,
        canDelete: false,
        canBulkUpdate: false,
      };
    }

    return {
      canCreate: OrderPermissions.canCreate(user),
      canRead: OrderPermissions.canRead(user),
      canUpdate: OrderPermissions.canUpdate(user),
      canDelete: OrderPermissions.canDelete(user),
      canBulkUpdate: OrderPermissions.canBulkUpdate(user),
    };
  }, [user]);
}

/**
 * Hook for product permissions
 */
export function useProductPermissions() {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) {
      return {
        canCreate: false,
        canRead: false,
        canUpdate: false,
        canDelete: false,
        canBulkUpdate: false,
      };
    }

    return {
      canCreate: ProductPermissions.canCreate(user),
      canRead: ProductPermissions.canRead(user),
      canUpdate: ProductPermissions.canUpdate(user),
      canDelete: ProductPermissions.canDelete(user),
      canBulkUpdate: ProductPermissions.canBulkUpdate(user),
    };
  }, [user]);
}

/**
 * Hook for inventory permissions
 */
export function useInventoryPermissions() {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) {
      return {
        canRead: false,
        canUpdate: false,
        canAdjust: false,
        canForecast: false,
      };
    }

    return {
      canRead: InventoryPermissions.canRead(user),
      canUpdate: InventoryPermissions.canUpdate(user),
      canAdjust: InventoryPermissions.canAdjust(user),
      canForecast: InventoryPermissions.canForecast(user),
    };
  }, [user]);
}

/**
 * Hook for analytics permissions
 */
export function useAnalyticsPermissions() {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) {
      return {
        canRead: false,
        canExport: false,
        canCreateCustomReports: false,
      };
    }

    return {
      canRead: AnalyticsPermissions.canRead(user),
      canExport: AnalyticsPermissions.canExport(user),
      canCreateCustomReports: AnalyticsPermissions.canCreateCustomReports(user),
    };
  }, [user]);
}

/**
 * Hook for user management permissions
 */
export function useUserManagementPermissions() {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) {
      return {
        canCreate: false,
        canRead: false,
        canUpdate: false,
        canDelete: false,
        canManageRoles: false,
      };
    }

    return {
      canCreate: UserPermissions.canCreate(user),
      canRead: UserPermissions.canRead(user),
      canUpdate: UserPermissions.canUpdate(user),
      canDelete: UserPermissions.canDelete(user),
      canManageRoles: UserPermissions.canManageRoles(user),
    };
  }, [user]);
}

/**
 * Hook for system permissions
 */
export function useSystemPermissions() {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) {
      return {
        canAccessSettings: false,
        canManageWebhooks: false,
        canManageApiKeys: false,
        canReadAudit: false,
        canExportAudit: false,
      };
    }

    return {
      canAccessSettings: SystemPermissions.canAccessSettings(user),
      canManageWebhooks: SystemPermissions.canManageWebhooks(user),
      canManageApiKeys: SystemPermissions.canManageApiKeys(user),
      canReadAudit: SystemPermissions.canReadAudit(user),
      canExportAudit: SystemPermissions.canExportAudit(user),
    };
  }, [user]);
}

// ============================================
// Feature Flag Hooks
// ============================================

/**
 * Hook for checking if a feature is enabled for the user
 */
export function useFeatureFlag(feature: string): boolean {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) return false;

    // Map features to required permissions
    const featurePermissions: Record<string, PermissionAction[]> = {
      bulk_operations: ['order.bulk-update', 'product.bulk-update'],
      advanced_analytics: ['analytics.custom-reports'],
      user_management: ['user.manage-roles'],
      system_settings: ['system.settings'],
      api_access: ['system.api-keys'],
      audit_logs: ['audit.read'],
      inventory_forecast: ['inventory.forecast'],
    };

    const requiredPermissions = featurePermissions[feature];
    if (!requiredPermissions) return false;

    return requiredPermissions.some(perm => hasPermission(user, perm));
  }, [user, feature]);
}

/**
 * Hook for getting enabled features for current user
 */
export function useEnabledFeatures(): string[] {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) return [];

    const features: string[] = [];

    // Check each feature
    if (hasPermission(user, 'order.bulk-update') || hasPermission(user, 'product.bulk-update')) {
      features.push('bulk_operations');
    }

    if (hasPermission(user, 'analytics.custom-reports')) {
      features.push('advanced_analytics');
    }

    if (hasPermission(user, 'user.manage-roles')) {
      features.push('user_management');
    }

    if (hasPermission(user, 'system.settings')) {
      features.push('system_settings');
    }

    if (hasPermission(user, 'system.api-keys')) {
      features.push('api_access');
    }

    if (hasPermission(user, 'audit.read')) {
      features.push('audit_logs');
    }

    if (hasPermission(user, 'inventory.forecast')) {
      features.push('inventory_forecast');
    }

    return features;
  }, [user]);
}

// ============================================
// Permission Group Hooks
// ============================================

/**
 * Hook for getting permissions grouped by category
 */
export function usePermissionsByCategory() {
  return useMemo(() => getPermissionsByCategory(), []);
}

/**
 * Hook for checking if user is admin or higher
 */
export function useIsAdmin(): boolean {
  const { user } = useAuth();
  return useMemo(() => {
    if (!user) return false;
    return hasAnyRole(user, ['super_admin', 'admin']);
  }, [user]);
}

/**
 * Hook for checking if user is super admin
 */
export function useIsSuperAdmin(): boolean {
  const { user } = useAuth();
  return useMemo(() => {
    if (!user) return false;
    return hasRole(user, 'super_admin');
  }, [user]);
}
