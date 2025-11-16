/**
 * Type definitions for Role-Based Access Control (RBAC) system
 */

// ========================================
// Role Types
// ========================================

export type UserRole = 'owner' | 'manager' | 'staff' | 'viewer';

export interface Role {
  id: string;
  name: UserRole;
  description: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

// ========================================
// Permission Types
// ========================================

export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'bulk_edit';

export type PermissionResource =
  | 'products'
  | 'orders'
  | 'customers'
  | 'users'
  | 'settings'
  | 'reports'
  | '*';

export interface Permission {
  id: string;
  name: string;
  resource: PermissionResource;
  action: PermissionAction;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface PermissionCheck {
  resource: PermissionResource;
  action: PermissionAction;
}

// ========================================
// User Role Assignment Types
// ========================================

export interface UserRoleAssignment {
  id: string;
  user_id: string;
  role_id: string;
  assigned_by: string | null;
  assigned_at: string;
  expires_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserRoleWithDetails extends UserRoleAssignment {
  role: Role;
  user?: {
    id: string;
    email: string;
    created_at: string;
  };
}

// ========================================
// Role-Permission Mapping Types
// ========================================

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  created_at: string;
}

export interface RolePermissionWithDetails extends RolePermission {
  role: Role;
  permission: Permission;
}

// ========================================
// User Role Info Types
// ========================================

export interface UserRoleInfo {
  role: UserRole | null;
  roleId: string | null;
  userId: string;
  expiresAt?: Date | null;
}

// ========================================
// RBAC Context Types
// ========================================

export interface RBACContextType {
  userRole: UserRole | null;
  roleInfo: UserRoleInfo | null;
  permissions: PermissionCheck[];
  loading: boolean;
  error: Error | null;
  hasRole: (role: UserRole) => boolean;
  hasMinimumRole: (role: UserRole) => Promise<boolean>;
  hasPermission: (resource: PermissionResource, action: PermissionAction) => Promise<boolean>;
  isOwner: boolean;
  isManager: boolean;
  isStaff: boolean;
  isViewer: boolean;
  isAdmin: boolean;
  refetch: () => Promise<void>;
}

// ========================================
// API Request/Response Types
// ========================================

export interface AssignRoleRequest {
  userId: string;
  roleId: string;
  expiresAt?: string | null;
}

export interface AssignRoleResponse {
  id: string;
  user_id: string;
  role_id: string;
  assigned_by: string;
  assigned_at: string;
  expires_at: string | null;
}

export interface RemoveRoleRequest {
  userRoleId: string;
}

export interface RemoveRoleResponse {
  message: string;
}

export interface GetUserRolesResponse extends UserRoleWithDetails {}

// ========================================
// Permission Matrix Types
// ========================================

export type PermissionMatrix = {
  [K in PermissionResource]: {
    [A in PermissionAction]?: UserRole[];
  };
};

// ========================================
// RBAC Middleware Types
// ========================================

export interface RBACOptions {
  requiredRole?: UserRole;
  requiredPermission?: PermissionCheck;
  onUnauthorized?: (reason: string) => Response;
}

// ========================================
// Component Prop Types
// ========================================

export interface PermissionGateProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  minimumRole?: UserRole;
  permission?: PermissionCheck;
  fallback?: React.ReactNode;
  hideOnUnauthorized?: boolean;
  loadingComponent?: React.ReactNode;
}

export interface PermissionDisableProps {
  children: React.ReactNode;
  permission: PermissionCheck;
  disabledClassName?: string;
  disabledTitle?: string;
}

export interface RoleSwitchProps {
  owner?: React.ReactNode;
  manager?: React.ReactNode;
  staff?: React.ReactNode;
  viewer?: React.ReactNode;
  fallback?: React.ReactNode;
}

// ========================================
// Helper Types
// ========================================

export interface RoleHierarchy {
  role: UserRole;
  level: number;
  inheritsFrom?: UserRole[];
}

export const ROLE_HIERARCHY: Record<UserRole, RoleHierarchy> = {
  owner: {
    role: 'owner',
    level: 1,
  },
  manager: {
    role: 'manager',
    level: 2,
    inheritsFrom: ['owner'],
  },
  staff: {
    role: 'staff',
    level: 3,
    inheritsFrom: ['owner', 'manager'],
  },
  viewer: {
    role: 'viewer',
    level: 4,
    inheritsFrom: ['owner', 'manager', 'staff'],
  },
};

// ========================================
// Permission Constants
// ========================================

export const PERMISSION_ACTIONS: PermissionAction[] = [
  'create',
  'read',
  'update',
  'delete',
  'bulk_edit',
];

export const PERMISSION_RESOURCES: PermissionResource[] = [
  'products',
  'orders',
  'customers',
  'users',
  'settings',
  'reports',
  '*',
];

// ========================================
// Default Permission Matrix
// ========================================

export const DEFAULT_PERMISSION_MATRIX: PermissionMatrix = {
  products: {
    create: ['owner', 'manager', 'staff'],
    read: ['owner', 'manager', 'staff', 'viewer'],
    update: ['owner', 'manager', 'staff'],
    delete: ['owner', 'manager'],
    bulk_edit: ['owner', 'manager'],
  },
  orders: {
    create: ['owner', 'manager', 'staff'],
    read: ['owner', 'manager', 'staff', 'viewer'],
    update: ['owner', 'manager', 'staff'],
    delete: ['owner', 'manager'],
    bulk_edit: ['owner', 'manager'],
  },
  customers: {
    create: ['owner', 'manager', 'staff'],
    read: ['owner', 'manager', 'staff', 'viewer'],
    update: ['owner', 'manager', 'staff'],
    delete: ['owner', 'manager'],
    bulk_edit: ['owner', 'manager'],
  },
  users: {
    create: ['owner'],
    read: ['owner'],
    update: ['owner'],
    delete: ['owner'],
    bulk_edit: ['owner'],
  },
  settings: {
    read: ['owner', 'manager', 'staff', 'viewer'],
    update: ['owner', 'manager'],
  },
  reports: {
    read: ['owner', 'manager', 'staff', 'viewer'],
  },
  '*': {
    '*': ['owner'],
  },
};

// ========================================
// Utility Types
// ========================================

export type PermissionString = `${PermissionResource}:${PermissionAction}`;

export type RolePermissionMap = Map<UserRole, Set<PermissionString>>;

// ========================================
// Database View Types
// ========================================

export interface UserPermissionsView {
  user_id: string;
  role_name: UserRole;
  permission_name: string;
  resource: PermissionResource;
  action: PermissionAction;
}

// ========================================
// Error Types
// ========================================

export class RBACError extends Error {
  constructor(
    message: string,
    public code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'INVALID_ROLE' | 'INVALID_PERMISSION',
    public statusCode: number = 403
  ) {
    super(message);
    this.name = 'RBACError';
  }
}

export class UnauthorizedError extends RBACError {
  constructor(message: string = 'Authentication required') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class ForbiddenError extends RBACError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'FORBIDDEN', 403);
  }
}

export class InvalidRoleError extends RBACError {
  constructor(message: string = 'Invalid role specified') {
    super(message, 'INVALID_ROLE', 400);
  }
}

export class InvalidPermissionError extends RBACError {
  constructor(message: string = 'Invalid permission specified') {
    super(message, 'INVALID_PERMISSION', 400);
  }
}
