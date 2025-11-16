/**
 * Role-Based Access Control (RBAC) utilities
 *
 * This module provides comprehensive RBAC functionality including:
 * - Role definitions and permissions
 * - Permission checking logic
 * - Role hierarchy
 * - Permission caching
 * - Dynamic permission assignment
 */

import {
  User,
  Role,
  Permission,
  UserRole,
  PermissionAction,
  PermissionCategory,
  PermissionCheckResult,
  RoleAssignment,
} from '@/types';

// ============================================
// Permission Definitions
// ============================================

/**
 * All available permissions in the system
 */
export const ALL_PERMISSIONS: Permission[] = [
  // Order permissions
  {
    id: 'perm_order_create',
    name: 'order.create',
    category: 'order',
    description: 'Create new orders',
  },
  {
    id: 'perm_order_read',
    name: 'order.read',
    category: 'order',
    description: 'View orders',
  },
  {
    id: 'perm_order_update',
    name: 'order.update',
    category: 'order',
    description: 'Update existing orders',
  },
  {
    id: 'perm_order_delete',
    name: 'order.delete',
    category: 'order',
    description: 'Delete orders',
  },
  {
    id: 'perm_order_bulk',
    name: 'order.bulk-update',
    category: 'order',
    description: 'Perform bulk order operations',
  },

  // Product permissions
  {
    id: 'perm_product_create',
    name: 'product.create',
    category: 'product',
    description: 'Create new products',
  },
  {
    id: 'perm_product_read',
    name: 'product.read',
    category: 'product',
    description: 'View products',
  },
  {
    id: 'perm_product_update',
    name: 'product.update',
    category: 'product',
    description: 'Update existing products',
  },
  {
    id: 'perm_product_delete',
    name: 'product.delete',
    category: 'product',
    description: 'Delete products',
  },
  {
    id: 'perm_product_bulk',
    name: 'product.bulk-update',
    category: 'product',
    description: 'Perform bulk product operations',
  },

  // Inventory permissions
  {
    id: 'perm_inventory_read',
    name: 'inventory.read',
    category: 'inventory',
    description: 'View inventory levels',
  },
  {
    id: 'perm_inventory_update',
    name: 'inventory.update',
    category: 'inventory',
    description: 'Update inventory levels',
  },
  {
    id: 'perm_inventory_adjust',
    name: 'inventory.adjust',
    category: 'inventory',
    description: 'Adjust inventory with reasons',
  },
  {
    id: 'perm_inventory_forecast',
    name: 'inventory.forecast',
    category: 'inventory',
    description: 'View inventory forecasts',
  },

  // Analytics permissions
  {
    id: 'perm_analytics_read',
    name: 'analytics.read',
    category: 'analytics',
    description: 'View analytics and reports',
  },
  {
    id: 'perm_analytics_export',
    name: 'analytics.export',
    category: 'analytics',
    description: 'Export analytics data',
  },
  {
    id: 'perm_analytics_custom',
    name: 'analytics.custom-reports',
    category: 'analytics',
    description: 'Create custom reports',
  },

  // User permissions
  {
    id: 'perm_user_create',
    name: 'user.create',
    category: 'user',
    description: 'Create new users',
  },
  {
    id: 'perm_user_read',
    name: 'user.read',
    category: 'user',
    description: 'View user information',
  },
  {
    id: 'perm_user_update',
    name: 'user.update',
    category: 'user',
    description: 'Update user information',
  },
  {
    id: 'perm_user_delete',
    name: 'user.delete',
    category: 'user',
    description: 'Delete users',
  },
  {
    id: 'perm_user_manage_roles',
    name: 'user.manage-roles',
    category: 'user',
    description: 'Manage user roles and permissions',
  },

  // System permissions
  {
    id: 'perm_system_settings',
    name: 'system.settings',
    category: 'system',
    description: 'Manage system settings',
  },
  {
    id: 'perm_system_webhooks',
    name: 'system.webhooks',
    category: 'system',
    description: 'Manage webhooks',
  },
  {
    id: 'perm_system_api_keys',
    name: 'system.api-keys',
    category: 'system',
    description: 'Manage API keys',
  },
  {
    id: 'perm_audit_read',
    name: 'audit.read',
    category: 'system',
    description: 'View audit logs',
  },
  {
    id: 'perm_audit_export',
    name: 'audit.export',
    category: 'system',
    description: 'Export audit logs',
  },
];

// ============================================
// Role Definitions
// ============================================

/**
 * Get permission by name
 */
function getPermission(name: PermissionAction): Permission {
  return ALL_PERMISSIONS.find(p => p.name === name)!;
}

/**
 * Default role definitions with permissions
 */
export const DEFAULT_ROLES: Role[] = [
  {
    id: 'role_super_admin',
    name: 'super_admin',
    displayName: 'Super Admin',
    description: 'Full system access with all permissions',
    priority: 1,
    isSystem: true,
    permissions: ALL_PERMISSIONS, // All permissions
  },
  {
    id: 'role_admin',
    name: 'admin',
    displayName: 'Admin',
    description: 'Administrative access to manage orders, products, and users (except super admins)',
    priority: 2,
    isSystem: true,
    permissions: [
      // Order permissions
      getPermission('order.create'),
      getPermission('order.read'),
      getPermission('order.update'),
      getPermission('order.delete'),
      getPermission('order.bulk-update'),
      // Product permissions
      getPermission('product.create'),
      getPermission('product.read'),
      getPermission('product.update'),
      getPermission('product.delete'),
      getPermission('product.bulk-update'),
      // Inventory permissions
      getPermission('inventory.read'),
      getPermission('inventory.update'),
      getPermission('inventory.adjust'),
      getPermission('inventory.forecast'),
      // Analytics permissions
      getPermission('analytics.read'),
      getPermission('analytics.export'),
      getPermission('analytics.custom-reports'),
      // User permissions (limited)
      getPermission('user.create'),
      getPermission('user.read'),
      getPermission('user.update'),
      getPermission('user.delete'),
      // Audit permissions
      getPermission('audit.read'),
      getPermission('audit.export'),
    ],
  },
  {
    id: 'role_manager',
    name: 'manager',
    displayName: 'Manager',
    description: 'Manage orders, inventory, and view analytics for their team',
    priority: 3,
    isSystem: true,
    permissions: [
      // Order permissions
      getPermission('order.create'),
      getPermission('order.read'),
      getPermission('order.update'),
      getPermission('order.delete'),
      getPermission('order.bulk-update'),
      // Product permissions (limited)
      getPermission('product.read'),
      getPermission('product.update'),
      // Inventory permissions
      getPermission('inventory.read'),
      getPermission('inventory.update'),
      getPermission('inventory.adjust'),
      getPermission('inventory.forecast'),
      // Analytics permissions
      getPermission('analytics.read'),
      getPermission('analytics.export'),
    ],
  },
  {
    id: 'role_staff',
    name: 'staff',
    displayName: 'Staff',
    description: 'Create and view orders, add items to orders',
    priority: 4,
    isSystem: true,
    permissions: [
      // Order permissions (limited)
      getPermission('order.create'),
      getPermission('order.read'),
      getPermission('order.update'),
      // Product permissions (read-only)
      getPermission('product.read'),
      // Inventory permissions (read-only)
      getPermission('inventory.read'),
    ],
  },
  {
    id: 'role_customer',
    name: 'customer',
    displayName: 'Customer',
    description: 'View own orders (read-only access)',
    priority: 5,
    isSystem: true,
    permissions: [
      // Order permissions (read-only, own orders)
      getPermission('order.read'),
    ],
  },
];

// ============================================
// Permission Checking
// ============================================

/**
 * Check if user has a specific permission
 */
export function hasPermission(user: User, permission: PermissionAction): boolean {
  // Check direct permissions
  if (user.permissions.some(p => p.name === permission)) {
    return true;
  }

  // Check role permissions
  for (const role of user.roles) {
    if (role.permissions.some(p => p.name === permission)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(user: User, permissions: PermissionAction[]): boolean {
  return permissions.some(permission => hasPermission(user, permission));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(user: User, permissions: PermissionAction[]): boolean {
  return permissions.every(permission => hasPermission(user, permission));
}

/**
 * Check if user has a specific role
 */
export function hasRole(user: User, roleName: UserRole): boolean {
  return user.roles.some(role => role.name === roleName);
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(user: User, roleNames: UserRole[]): boolean {
  return roleNames.some(roleName => hasRole(user, roleName));
}

/**
 * Get user's highest priority role
 */
export function getHighestRole(user: User): Role | null {
  if (user.roles.length === 0) return null;

  return user.roles.reduce((highest, current) => {
    return current.priority < highest.priority ? current : highest;
  });
}

/**
 * Check if user can access a resource with a specific action
 */
export function canAccess(
  user: User,
  resource: PermissionCategory,
  action: 'create' | 'read' | 'update' | 'delete' | 'bulk-update'
): boolean {
  const permission = `${resource}.${action}` as PermissionAction;
  return hasPermission(user, permission);
}

/**
 * Get detailed permission check result
 */
export function checkPermission(
  user: User,
  requiredPermissions: PermissionAction[]
): PermissionCheckResult {
  const userPermissions = getUserPermissions(user);
  const missingPermissions = requiredPermissions.filter(
    perm => !userPermissions.includes(perm)
  );

  const allowed = missingPermissions.length === 0;

  return {
    allowed,
    reason: allowed
      ? undefined
      : `Missing permissions: ${missingPermissions.join(', ')}`,
    requiredPermissions,
    userPermissions,
  };
}

/**
 * Get all permissions for a user (from roles and direct permissions)
 */
export function getUserPermissions(user: User): PermissionAction[] {
  const permissions = new Set<PermissionAction>();

  // Add direct permissions
  user.permissions.forEach(p => permissions.add(p.name));

  // Add role permissions
  user.roles.forEach(role => {
    role.permissions.forEach(p => permissions.add(p.name));
  });

  return Array.from(permissions);
}

/**
 * Get available actions for a resource
 */
export function getAvailableActions(
  user: User,
  resource: PermissionCategory
): string[] {
  const actions = ['create', 'read', 'update', 'delete', 'bulk-update'];
  return actions.filter(action => canAccess(user, resource, action as any));
}

// ============================================
// Permission Helpers by Category
// ============================================

/**
 * Order permission helpers
 */
export const OrderPermissions = {
  canCreate: (user: User) => hasPermission(user, 'order.create'),
  canRead: (user: User) => hasPermission(user, 'order.read'),
  canUpdate: (user: User) => hasPermission(user, 'order.update'),
  canDelete: (user: User) => hasPermission(user, 'order.delete'),
  canBulkUpdate: (user: User) => hasPermission(user, 'order.bulk-update'),
};

/**
 * Product permission helpers
 */
export const ProductPermissions = {
  canCreate: (user: User) => hasPermission(user, 'product.create'),
  canRead: (user: User) => hasPermission(user, 'product.read'),
  canUpdate: (user: User) => hasPermission(user, 'product.update'),
  canDelete: (user: User) => hasPermission(user, 'product.delete'),
  canBulkUpdate: (user: User) => hasPermission(user, 'product.bulk-update'),
};

/**
 * Inventory permission helpers
 */
export const InventoryPermissions = {
  canRead: (user: User) => hasPermission(user, 'inventory.read'),
  canUpdate: (user: User) => hasPermission(user, 'inventory.update'),
  canAdjust: (user: User) => hasPermission(user, 'inventory.adjust'),
  canForecast: (user: User) => hasPermission(user, 'inventory.forecast'),
};

/**
 * Analytics permission helpers
 */
export const AnalyticsPermissions = {
  canRead: (user: User) => hasPermission(user, 'analytics.read'),
  canExport: (user: User) => hasPermission(user, 'analytics.export'),
  canCreateCustomReports: (user: User) => hasPermission(user, 'analytics.custom-reports'),
};

/**
 * User permission helpers
 */
export const UserPermissions = {
  canCreate: (user: User) => hasPermission(user, 'user.create'),
  canRead: (user: User) => hasPermission(user, 'user.read'),
  canUpdate: (user: User) => hasPermission(user, 'user.update'),
  canDelete: (user: User) => hasPermission(user, 'user.delete'),
  canManageRoles: (user: User) => hasPermission(user, 'user.manage-roles'),
};

/**
 * System permission helpers
 */
export const SystemPermissions = {
  canAccessSettings: (user: User) => hasPermission(user, 'system.settings'),
  canManageWebhooks: (user: User) => hasPermission(user, 'system.webhooks'),
  canManageApiKeys: (user: User) => hasPermission(user, 'system.api-keys'),
  canReadAudit: (user: User) => hasPermission(user, 'audit.read'),
  canExportAudit: (user: User) => hasPermission(user, 'audit.export'),
};

// ============================================
// Role Management
// ============================================

/**
 * Get all available roles
 */
export function getAllRoles(): Role[] {
  return [...DEFAULT_ROLES];
}

/**
 * Get role by name
 */
export function getRoleByName(roleName: UserRole): Role | null {
  return DEFAULT_ROLES.find(r => r.name === roleName) || null;
}

/**
 * Get role by ID
 */
export function getRoleById(roleId: string): Role | null {
  return DEFAULT_ROLES.find(r => r.id === roleId) || null;
}

/**
 * Get default role by name (throws if not found)
 */
export function getDefaultRoleByName(roleName: UserRole): Role {
  const role = getRoleByName(roleName);
  if (!role) {
    throw new Error(`Role not found: ${roleName}`);
  }
  return role;
}

/**
 * Check if a role can be assigned to a user by another user
 */
export function canAssignRole(assignerUser: User, targetRole: Role): boolean {
  // Super admin can assign any role
  if (hasRole(assignerUser, 'super_admin')) {
    return true;
  }

  // Admin can assign roles with lower priority (higher number)
  if (hasRole(assignerUser, 'admin')) {
    const assignerRole = getHighestRole(assignerUser);
    if (!assignerRole) return false;

    // Cannot assign super_admin or admin roles
    return targetRole.priority > assignerRole.priority;
  }

  // Others cannot assign roles
  return false;
}

/**
 * Get roles that a user can assign
 */
export function getAssignableRoles(assignerUser: User): Role[] {
  if (hasRole(assignerUser, 'super_admin')) {
    return getAllRoles();
  }

  if (hasRole(assignerUser, 'admin')) {
    const assignerRole = getHighestRole(assignerUser);
    if (!assignerRole) return [];

    return getAllRoles().filter(role => role.priority > assignerRole.priority);
  }

  return [];
}

// ============================================
// Permission Caching
// ============================================

interface PermissionCache {
  userId: string;
  permissions: PermissionAction[];
  timestamp: number;
}

const permissionCache: PermissionCache[] = [];
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached permissions for user
 */
export function getCachedPermissions(userId: string): PermissionAction[] | null {
  const cached = permissionCache.find(c => c.userId === userId);

  if (!cached) return null;

  // Check if cache is expired
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    // Remove expired cache
    const index = permissionCache.findIndex(c => c.userId === userId);
    if (index !== -1) {
      permissionCache.splice(index, 1);
    }
    return null;
  }

  return cached.permissions;
}

/**
 * Cache permissions for user
 */
export function cachePermissions(userId: string, permissions: PermissionAction[]): void {
  // Remove existing cache
  const index = permissionCache.findIndex(c => c.userId === userId);
  if (index !== -1) {
    permissionCache.splice(index, 1);
  }

  // Add new cache
  permissionCache.push({
    userId,
    permissions,
    timestamp: Date.now(),
  });
}

/**
 * Clear permission cache for user
 */
export function clearPermissionCache(userId: string): void {
  const index = permissionCache.findIndex(c => c.userId === userId);
  if (index !== -1) {
    permissionCache.splice(index, 1);
  }
}

/**
 * Clear all permission caches
 */
export function clearAllPermissionCaches(): void {
  permissionCache.length = 0;
}

// ============================================
// Permission Groups
// ============================================

/**
 * Get permissions grouped by category
 */
export function getPermissionsByCategory(): Record<PermissionCategory, Permission[]> {
  const grouped: Record<PermissionCategory, Permission[]> = {
    order: [],
    product: [],
    inventory: [],
    analytics: [],
    user: [],
    system: [],
  };

  ALL_PERMISSIONS.forEach(permission => {
    grouped[permission.category].push(permission);
  });

  return grouped;
}

/**
 * Get permissions for a specific category
 */
export function getPermissionsForCategory(category: PermissionCategory): Permission[] {
  return ALL_PERMISSIONS.filter(p => p.category === category);
}

// ============================================
// Role Comparison
// ============================================

/**
 * Compare two roles by priority
 */
export function compareRoles(role1: Role, role2: Role): number {
  return role1.priority - role2.priority;
}

/**
 * Check if role1 has higher priority than role2
 */
export function isHigherRole(role1: Role, role2: Role): boolean {
  return role1.priority < role2.priority;
}

/**
 * Check if user1 has higher role than user2
 */
export function hasHigherRole(user1: User, user2: User): boolean {
  const role1 = getHighestRole(user1);
  const role2 = getHighestRole(user2);

  if (!role1 || !role2) return false;

  return isHigherRole(role1, role2);
}

// ============================================
// Utility Functions
// ============================================

/**
 * Format permission name for display
 */
export function formatPermissionName(permission: PermissionAction): string {
  const [category, action] = permission.split('.');
  const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
  const actionName = action
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return `${categoryName}: ${actionName}`;
}

/**
 * Format role name for display
 */
export function formatRoleName(role: UserRole): string {
  return role
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get role description
 */
export function getRoleDescription(roleName: UserRole): string {
  const role = getRoleByName(roleName);
  return role?.description || '';
}

/**
 * Get permission count for role
 */
export function getRolePermissionCount(role: Role): number {
  return role.permissions.length;
}

/**
 * Check if role is system role
 */
export function isSystemRole(role: Role): boolean {
  return role.isSystem;
}

/**
 * Get role color for UI
 */
export function getRoleColor(roleName: UserRole): string {
  const colors: Record<UserRole, string> = {
    super_admin: '#ef4444', // red
    admin: '#f59e0b', // amber
    manager: '#3b82f6', // blue
    staff: '#10b981', // green
    customer: '#6b7280', // gray
  };

  return colors[roleName] || '#6b7280';
}

/**
 * Get role badge variant for UI
 */
export function getRoleBadgeVariant(roleName: UserRole): string {
  const variants: Record<UserRole, string> = {
    super_admin: 'destructive',
    admin: 'warning',
    manager: 'default',
    staff: 'success',
    customer: 'secondary',
  };

  return variants[roleName] || 'secondary';
}
