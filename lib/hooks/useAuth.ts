/**
 * useAuth Hook - Authentication State Management
 *
 * This hook provides comprehensive authentication functionality including:
 * - Login/logout/register functions
 * - Session persistence
 * - Password reset
 * - Authentication state management
 * - Permission checking
 */

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import {
  User,
  UserRegistration,
  UserCredentials,
  UserUpdate,
  AuthError,
  PermissionAction,
  UserRole,
  PermissionCategory,
} from '@/types';
import {
  login as authLogin,
  logout as authLogout,
  register as authRegister,
  getCurrentUser,
  updateUser as authUpdateUser,
  requestPasswordReset,
  resetPassword as authResetPassword,
  saveSession,
  loadSession,
  clearSession,
  initializeDemoUsers,
} from '@/lib/utils/auth';
import { hasPermission, hasRole, canAccess, getUserPermissions } from '@/lib/utils/rbac';
import { useToast } from './useToast';

// ============================================
// Types
// ============================================

interface AuthContextType {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Authentication functions
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  confirmPasswordReset: (token: string, newPassword: string) => Promise<void>;
  updateProfile: (updates: UserUpdate) => Promise<void>;
  refreshSession: () => Promise<void>;

  // Permission checking
  canAccess: (resource: PermissionCategory, action: string) => boolean;
  hasPermission: (permission: PermissionAction) => boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  getAllPermissions: () => PermissionAction[];

  // Utilities
  clearError: () => void;
  initDemo: () => Promise<void>;
}

// ============================================
// Context
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// Hook
// ============================================

/**
 * useAuth hook for accessing authentication state and functions
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

// ============================================
// Provider
// ============================================

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider component to wrap the app
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const { toast } = useToast();

  // ============================================
  // Session Management
  // ============================================

  /**
   * Load session on mount
   */
  useEffect(() => {
    const loadUserSession = async () => {
      try {
        setIsLoading(true);

        const session = loadSession();
        if (session) {
          setUser(session.user);
          setSessionToken(session.token);
        }
      } catch (err) {
        console.error('Failed to load session:', err);
        clearSession();
      } finally {
        setIsLoading(false);
      }
    };

    loadUserSession();
  }, []);

  /**
   * Save session when user changes
   */
  useEffect(() => {
    if (user && sessionToken) {
      saveSession(sessionToken, user);
    }
  }, [user, sessionToken]);

  // ============================================
  // Authentication Functions
  // ============================================

  /**
   * Login user
   */
  const login = useCallback(
    async (email: string, password: string, rememberMe: boolean = false) => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await authLogin({ email, password });

        if (!result.success || !result.response) {
          throw new Error(result.error?.message || 'Login failed');
        }

        const { user: loggedInUser, token } = result.response;

        setUser(loggedInUser);
        setSessionToken(token);

        if (rememberMe) {
          saveSession(token, loggedInUser);
        }

        toast({
          title: 'Login successful',
          description: `Welcome back, ${loggedInUser.name}!`,
          variant: 'success',
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Login failed';
        setError(errorMessage);

        toast({
          title: 'Login failed',
          description: errorMessage,
          variant: 'destructive',
        });

        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  /**
   * Logout user
   */
  const logout = useCallback(() => {
    try {
      if (sessionToken) {
        authLogout(sessionToken);
      }

      setUser(null);
      setSessionToken(null);
      clearSession();

      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out',
        variant: 'default',
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, [sessionToken, toast]);

  /**
   * Register new user
   */
  const register = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await authRegister({ email, password, name });

        if (!result.success || !result.user) {
          throw new Error(result.error?.message || 'Registration failed');
        }

        // Auto-login after registration
        await login(email, password, true);

        toast({
          title: 'Registration successful',
          description: 'Your account has been created',
          variant: 'success',
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Registration failed';
        setError(errorMessage);

        toast({
          title: 'Registration failed',
          description: errorMessage,
          variant: 'destructive',
        });

        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [login, toast]
  );

  /**
   * Request password reset
   */
  const resetPasswordRequest = useCallback(
    async (email: string) => {
      try {
        setIsLoading(true);
        setError(null);

        const result = requestPasswordReset(email);

        if (!result.success) {
          throw new Error(result.error || 'Password reset request failed');
        }

        toast({
          title: 'Password reset requested',
          description: 'Check your email for password reset instructions',
          variant: 'success',
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Password reset request failed';
        setError(errorMessage);

        toast({
          title: 'Request failed',
          description: errorMessage,
          variant: 'destructive',
        });

        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  /**
   * Confirm password reset with token
   */
  const confirmPasswordReset = useCallback(
    async (token: string, newPassword: string) => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await authResetPassword(token, newPassword);

        if (!result.success) {
          throw new Error(result.error?.message || 'Password reset failed');
        }

        toast({
          title: 'Password reset successful',
          description: 'Your password has been updated',
          variant: 'success',
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Password reset failed';
        setError(errorMessage);

        toast({
          title: 'Reset failed',
          description: errorMessage,
          variant: 'destructive',
        });

        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  /**
   * Update user profile
   */
  const updateProfile = useCallback(
    async (updates: UserUpdate) => {
      try {
        if (!user) {
          throw new Error('No user logged in');
        }

        setIsLoading(true);
        setError(null);

        const result = await authUpdateUser(user.id, updates);

        if (!result.success || !result.user) {
          throw new Error(result.error || 'Profile update failed');
        }

        setUser(result.user);

        toast({
          title: 'Profile updated',
          description: 'Your profile has been successfully updated',
          variant: 'success',
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Profile update failed';
        setError(errorMessage);

        toast({
          title: 'Update failed',
          description: errorMessage,
          variant: 'destructive',
        });

        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [user, toast]
  );

  /**
   * Refresh session
   */
  const refreshSession = useCallback(async () => {
    try {
      if (!sessionToken) return;

      const currentUser = getCurrentUser(sessionToken);
      if (currentUser) {
        setUser(currentUser);
      } else {
        // Session invalid, logout
        logout();
      }
    } catch (err) {
      console.error('Session refresh error:', err);
      logout();
    }
  }, [sessionToken, logout]);

  // ============================================
  // Permission Checking
  // ============================================

  /**
   * Check if user can access a resource with specific action
   */
  const checkCanAccess = useCallback(
    (resource: PermissionCategory, action: string): boolean => {
      if (!user) return false;
      return canAccess(user, resource, action as any);
    },
    [user]
  );

  /**
   * Check if user has specific permission
   */
  const checkHasPermission = useCallback(
    (permission: PermissionAction): boolean => {
      if (!user) return false;
      return hasPermission(user, permission);
    },
    [user]
  );

  /**
   * Check if user has specific role
   */
  const checkHasRole = useCallback(
    (role: UserRole): boolean => {
      if (!user) return false;
      return hasRole(user, role);
    },
    [user]
  );

  /**
   * Check if user has any of the specified roles
   */
  const checkHasAnyRole = useCallback(
    (roles: UserRole[]): boolean => {
      if (!user) return false;
      return roles.some(role => hasRole(user, role));
    },
    [user]
  );

  /**
   * Get all permissions for current user
   */
  const getAllPermissions = useCallback((): PermissionAction[] => {
    if (!user) return [];
    return getUserPermissions(user);
  }, [user]);

  // ============================================
  // Utilities
  // ============================================

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Initialize demo users
   */
  const initDemo = useCallback(async () => {
    try {
      await initializeDemoUsers();
      toast({
        title: 'Demo initialized',
        description: 'Demo users have been created',
        variant: 'success',
      });
    } catch (err) {
      console.error('Demo initialization error:', err);
      toast({
        title: 'Initialization failed',
        description: 'Failed to create demo users',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // ============================================
  // Context Value
  // ============================================

  const value: AuthContextType = {
    // State
    user,
    isAuthenticated: !!user,
    isLoading,
    error,

    // Authentication functions
    login,
    logout,
    register,
    resetPassword: resetPasswordRequest,
    confirmPasswordReset,
    updateProfile,
    refreshSession,

    // Permission checking
    canAccess: checkCanAccess,
    hasPermission: checkHasPermission,
    hasRole: checkHasRole,
    hasAnyRole: checkHasAnyRole,
    getAllPermissions,

    // Utilities
    clearError,
    initDemo,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================
// Utility Hooks
// ============================================

/**
 * Hook for checking if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}

/**
 * Hook for getting current user
 */
export function useCurrentUser(): User | null {
  const { user } = useAuth();
  return user;
}

/**
 * Hook for permission checking
 */
export function usePermission(permission: PermissionAction): boolean {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
}

/**
 * Hook for role checking
 */
export function useRole(role: UserRole): boolean {
  const { hasRole } = useAuth();
  return hasRole(role);
}

/**
 * Hook for checking multiple permissions
 */
export function usePermissions(permissions: PermissionAction[]): {
  hasAll: boolean;
  hasAny: boolean;
  permissions: Record<PermissionAction, boolean>;
} {
  const { hasPermission } = useAuth();

  const permissionMap = permissions.reduce((acc, perm) => {
    acc[perm] = hasPermission(perm);
    return acc;
  }, {} as Record<PermissionAction, boolean>);

  const hasAll = permissions.every(perm => permissionMap[perm]);
  const hasAny = permissions.some(perm => permissionMap[perm]);

  return {
    hasAll,
    hasAny,
    permissions: permissionMap,
  };
}

/**
 * Hook for protecting routes/components
 */
export function useRequireAuth(
  requiredPermissions?: PermissionAction[],
  requiredRoles?: UserRole[]
): {
  isAllowed: boolean;
  isLoading: boolean;
  user: User | null;
} {
  const { user, isLoading, hasPermission, hasRole } = useAuth();

  let isAllowed = !!user;

  if (user && requiredPermissions && requiredPermissions.length > 0) {
    isAllowed = requiredPermissions.every(perm => hasPermission(perm));
  }

  if (user && requiredRoles && requiredRoles.length > 0) {
    isAllowed = isAllowed && requiredRoles.some(role => hasRole(role));
  }

  return {
    isAllowed,
    isLoading,
    user,
  };
}

/**
 * Hook for logout functionality
 */
export function useLogout(): () => void {
  const { logout } = useAuth();
  return logout;
}

/**
 * Hook for user preferences
 */
export function useUserPreferences() {
  const { user, updateProfile } = useAuth();

  const updatePreferences = useCallback(
    async (preferences: Partial<User['preferences']>) => {
      await updateProfile({ preferences });
    },
    [updateProfile]
  );

  return {
    preferences: user?.preferences,
    updatePreferences,
  };
}
