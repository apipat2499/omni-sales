'use client';

import { ReactNode } from 'react';
import { useUserRole, usePermission, useMinimumRole } from '@/lib/hooks/useUserRole';
import { UserRole } from '@/lib/auth/getRoleFromSession';
import { Permission, Resource } from '@/lib/auth/checkPermission';

interface PermissionGateProps {
  children: ReactNode;
  /** Require a specific role */
  requiredRole?: UserRole;
  /** Require minimum role level (e.g., 'manager' allows manager, owner) */
  minimumRole?: UserRole;
  /** Require specific permission */
  permission?: {
    resource: Resource;
    action: Permission;
  };
  /** Fallback UI when user doesn't have permission */
  fallback?: ReactNode;
  /** Whether to hide content (vs showing fallback) when unauthorized */
  hideOnUnauthorized?: boolean;
  /** Loading component */
  loadingComponent?: ReactNode;
}

/**
 * Component to conditionally render content based on user role or permissions
 *
 * @example
 * // Require specific role
 * <PermissionGate requiredRole="owner">
 *   <button>Delete All</button>
 * </PermissionGate>
 *
 * @example
 * // Require minimum role level
 * <PermissionGate minimumRole="manager" fallback={<p>Access Denied</p>}>
 *   <AdminPanel />
 * </PermissionGate>
 *
 * @example
 * // Require specific permission
 * <PermissionGate
 *   permission={{ resource: 'products', action: 'delete' }}
 *   hideOnUnauthorized
 * >
 *   <button>Delete Product</button>
 * </PermissionGate>
 */
export function PermissionGate({
  children,
  requiredRole,
  minimumRole,
  permission,
  fallback = null,
  hideOnUnauthorized = false,
  loadingComponent = null,
}: PermissionGateProps) {
  const { role, loading: roleLoading } = useUserRole();

  // If checking minimum role
  if (minimumRole) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { hasRole, loading } = useMinimumRole(minimumRole);

    if (loading || roleLoading) {
      return <>{loadingComponent}</>;
    }

    if (!hasRole) {
      return hideOnUnauthorized ? null : <>{fallback}</>;
    }

    return <>{children}</>;
  }

  // If checking specific role
  if (requiredRole) {
    if (roleLoading) {
      return <>{loadingComponent}</>;
    }

    if (role !== requiredRole) {
      return hideOnUnauthorized ? null : <>{fallback}</>;
    }

    return <>{children}</>;
  }

  // If checking permission
  if (permission) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { hasPermission, loading } = usePermission(
      permission.resource,
      permission.action
    );

    if (loading || roleLoading) {
      return <>{loadingComponent}</>;
    }

    if (!hasPermission) {
      return hideOnUnauthorized ? null : <>{fallback}</>;
    }

    return <>{children}</>;
  }

  // No restrictions specified, render children
  return <>{children}</>;
}

/**
 * Component to show content only to owners
 */
export function OwnerOnly({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGate requiredRole="owner" fallback={fallback} hideOnUnauthorized={!fallback}>
      {children}
    </PermissionGate>
  );
}

/**
 * Component to show content only to admins (owner or manager)
 */
export function AdminOnly({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGate minimumRole="manager" fallback={fallback} hideOnUnauthorized={!fallback}>
      {children}
    </PermissionGate>
  );
}

/**
 * Component to show content only to staff and above
 */
export function StaffOnly({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGate minimumRole="staff" fallback={fallback} hideOnUnauthorized={!fallback}>
      {children}
    </PermissionGate>
  );
}

/**
 * Higher-order component to disable elements based on permissions
 */
interface PermissionDisableProps {
  children: ReactNode;
  permission: {
    resource: Resource;
    action: Permission;
  };
  disabledClassName?: string;
  disabledTitle?: string;
}

export function PermissionDisable({
  children,
  permission,
  disabledClassName = 'opacity-50 cursor-not-allowed pointer-events-none',
  disabledTitle = 'You do not have permission to perform this action',
}: PermissionDisableProps) {
  const { hasPermission, loading } = usePermission(
    permission.resource,
    permission.action
  );

  if (loading) {
    return <>{children}</>;
  }

  if (!hasPermission) {
    return (
      <div className={disabledClassName} title={disabledTitle}>
        {children}
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Component to show different content based on role
 */
interface RoleSwitchProps {
  owner?: ReactNode;
  manager?: ReactNode;
  staff?: ReactNode;
  viewer?: ReactNode;
  fallback?: ReactNode;
}

export function RoleSwitch({
  owner,
  manager,
  staff,
  viewer,
  fallback = null,
}: RoleSwitchProps) {
  const { role, loading } = useUserRole();

  if (loading) {
    return null;
  }

  switch (role) {
    case 'owner':
      return <>{owner || fallback}</>;
    case 'manager':
      return <>{manager || fallback}</>;
    case 'staff':
      return <>{staff || fallback}</>;
    case 'viewer':
      return <>{viewer || fallback}</>;
    default:
      return <>{fallback}</>;
  }
}
