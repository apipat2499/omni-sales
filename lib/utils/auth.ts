/**
 * Authentication utilities for user authentication and session management
 *
 * This module provides comprehensive authentication functionality including:
 * - User registration and login
 * - Password hashing and validation
 * - JWT token generation and validation
 * - Session management
 * - Password reset functionality
 * - Rate limiting for security
 */

import {
  User,
  UserRegistration,
  UserCredentials,
  LoginResponse,
  AuthTokenPayload,
  AuthSession,
  PasswordResetToken,
  UserUpdate,
  AuthError,
  AuthErrorType,
  RateLimitTracker,
  AuthAuditLog,
  Role,
  Permission,
  UserRole,
  PermissionAction,
} from '@/types';
import { getDefaultRoleByName } from './rbac';

// ============================================
// Constants
// ============================================

const TOKEN_EXPIRY_HOURS = 24;
const PASSWORD_MIN_LENGTH = 8;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;
const PASSWORD_RESET_EXPIRY_HOURS = 1;

const STORAGE_KEYS = {
  SESSION_TOKEN: 'omni_sales_auth_token',
  USER_PROFILE: 'omni_sales_user_profile',
  USER_PREFERENCES: 'omni_sales_user_preferences',
  LAST_LOGIN: 'omni_sales_last_login',
} as const;

// ============================================
// In-Memory Storage (for demo purposes)
// In production, use a database
// ============================================

let users: User[] = [];
let rateLimitTrackers: RateLimitTracker[] = [];
let passwordResetTokens: PasswordResetToken[] = [];
let authAuditLogs: AuthAuditLog[] = [];
let sessions: AuthSession[] = [];

// ============================================
// Password Utilities
// ============================================

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
} {
  const errors: string[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Calculate strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (errors.length === 0) {
    if (password.length >= 12) {
      strength = 'strong';
    } else {
      strength = 'medium';
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
}

/**
 * Hash password using PBKDF2-like algorithm
 * Note: In production, use bcrypt or similar
 */
export async function hashPassword(password: string): Promise<string> {
  // Generate salt
  const salt = generateRandomString(16);

  // Simple hash for demo (use bcrypt in production)
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);

  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return `${salt}:${hashHex}`;
    } catch (error) {
      // Fallback for environments without crypto.subtle
      return `${salt}:${btoa(password + salt)}`;
    }
  } else {
    // Server-side or fallback
    return `${salt}:${btoa(password + salt)}`;
  }
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, storedHash] = hash.split(':');

  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);

  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex === storedHash;
    } catch (error) {
      // Fallback
      return btoa(password + salt) === storedHash;
    }
  } else {
    // Server-side or fallback
    return btoa(password + salt) === storedHash;
  }
}

// ============================================
// Token Utilities
// ============================================

/**
 * Generate JWT-like token
 */
export function generateToken(user: User): string {
  const payload: AuthTokenPayload = {
    iss: 'omni-sales',
    sub: user.id,
    email: user.email,
    roles: user.roles.map(r => r.name),
    permissions: user.permissions.map(p => p.name),
    iat: Date.now(),
    exp: Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
    aud: 'omni-sales-app',
  };

  // Simple token encoding (use proper JWT library in production)
  const tokenData = JSON.stringify(payload);
  return btoa(tokenData);
}

/**
 * Decode and validate token
 */
export function validateToken(token: string): {
  isValid: boolean;
  payload?: AuthTokenPayload;
  error?: string;
} {
  try {
    const tokenData = atob(token);
    const payload: AuthTokenPayload = JSON.parse(tokenData);

    // Check expiry
    if (payload.exp < Date.now()) {
      return {
        isValid: false,
        error: 'Token expired',
      };
    }

    // Check issuer
    if (payload.iss !== 'omni-sales') {
      return {
        isValid: false,
        error: 'Invalid token issuer',
      };
    }

    // Check audience
    if (payload.aud !== 'omni-sales-app') {
      return {
        isValid: false,
        error: 'Invalid token audience',
      };
    }

    return {
      isValid: true,
      payload,
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid token format',
    };
  }
}

/**
 * Refresh token (generate new token with extended expiry)
 */
export function refreshToken(oldToken: string): {
  success: boolean;
  token?: string;
  error?: string;
} {
  const validation = validateToken(oldToken);

  if (!validation.isValid || !validation.payload) {
    return {
      success: false,
      error: validation.error || 'Invalid token',
    };
  }

  // Find user
  const user = users.find(u => u.id === validation.payload!.sub);
  if (!user) {
    return {
      success: false,
      error: 'User not found',
    };
  }

  // Generate new token
  const newToken = generateToken(user);

  return {
    success: true,
    token: newToken,
  };
}

// ============================================
// Rate Limiting
// ============================================

/**
 * Check if email is rate limited
 */
export function checkRateLimit(email: string): {
  allowed: boolean;
  remainingAttempts?: number;
  lockedUntil?: Date;
} {
  const tracker = rateLimitTrackers.find(t => t.email === email);

  if (!tracker) {
    return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS };
  }

  // Check if locked
  if (tracker.lockedUntil && tracker.lockedUntil > new Date()) {
    return {
      allowed: false,
      lockedUntil: tracker.lockedUntil,
    };
  }

  // Reset if lockout expired
  if (tracker.lockedUntil && tracker.lockedUntil <= new Date()) {
    tracker.attempts = 0;
    tracker.lockedUntil = undefined;
  }

  // Check attempts
  if (tracker.attempts >= MAX_LOGIN_ATTEMPTS) {
    const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
    tracker.lockedUntil = lockedUntil;

    return {
      allowed: false,
      lockedUntil,
    };
  }

  return {
    allowed: true,
    remainingAttempts: MAX_LOGIN_ATTEMPTS - tracker.attempts,
  };
}

/**
 * Record failed login attempt
 */
export function recordFailedAttempt(email: string): void {
  let tracker = rateLimitTrackers.find(t => t.email === email);

  if (!tracker) {
    tracker = {
      email,
      attempts: 0,
      lastAttempt: new Date(),
    };
    rateLimitTrackers.push(tracker);
  }

  tracker.attempts++;
  tracker.lastAttempt = new Date();
}

/**
 * Reset rate limit for email
 */
export function resetRateLimit(email: string): void {
  const index = rateLimitTrackers.findIndex(t => t.email === email);
  if (index !== -1) {
    rateLimitTrackers.splice(index, 1);
  }
}

// ============================================
// Audit Logging
// ============================================

/**
 * Log authentication event
 */
export function logAuthEvent(log: Omit<AuthAuditLog, 'id' | 'timestamp'>): void {
  const auditLog: AuthAuditLog = {
    id: generateId(),
    ...log,
    timestamp: new Date(),
  };

  authAuditLogs.push(auditLog);

  // Keep only last 1000 logs
  if (authAuditLogs.length > 1000) {
    authAuditLogs = authAuditLogs.slice(-1000);
  }
}

/**
 * Get audit logs for user
 */
export function getAuditLogs(userId?: string, limit: number = 100): AuthAuditLog[] {
  let logs = [...authAuditLogs];

  if (userId) {
    logs = logs.filter(log => log.userId === userId);
  }

  return logs.slice(-limit).reverse();
}

// ============================================
// User Management
// ============================================

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Register new user
 */
export async function register(
  registration: UserRegistration
): Promise<{ success: boolean; user?: User; error?: AuthError }> {
  try {
    // Validate email
    if (!validateEmail(registration.email)) {
      return {
        success: false,
        error: {
          type: 'invalid_credentials',
          message: 'Invalid email format',
        },
      };
    }

    // Check if email exists
    if (users.some(u => u.email === registration.email)) {
      logAuthEvent({
        email: registration.email,
        action: 'register',
        success: false,
        errorType: 'email_already_exists',
      });

      return {
        success: false,
        error: {
          type: 'email_already_exists',
          message: 'Email already registered',
        },
      };
    }

    // Validate password
    const passwordValidation = validatePasswordStrength(registration.password);
    if (!passwordValidation.isValid) {
      return {
        success: false,
        error: {
          type: 'weak_password',
          message: passwordValidation.errors.join(', '),
          details: { errors: passwordValidation.errors },
        },
      };
    }

    // Hash password
    const passwordHash = await hashPassword(registration.password);

    // Get default role (staff)
    const defaultRole = getDefaultRoleByName('staff');

    // Create user
    const user: User = {
      id: generateId(),
      email: registration.email,
      name: registration.name,
      passwordHash,
      roles: [defaultRole],
      permissions: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      preferences: {
        theme: 'auto',
        language: 'th',
        notifications: true,
        emailDigest: 'weekly',
      },
    };

    users.push(user);

    // Log success
    logAuthEvent({
      userId: user.id,
      email: user.email,
      action: 'register',
      success: true,
    });

    return {
      success: true,
      user,
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: {
        type: 'invalid_credentials',
        message: 'Registration failed',
      },
    };
  }
}

/**
 * Login user
 */
export async function login(
  credentials: UserCredentials
): Promise<{ success: boolean; response?: LoginResponse; error?: AuthError }> {
  try {
    // Check rate limit
    const rateLimit = checkRateLimit(credentials.email);
    if (!rateLimit.allowed) {
      logAuthEvent({
        email: credentials.email,
        action: 'login',
        success: false,
        errorType: 'rate_limit_exceeded',
      });

      return {
        success: false,
        error: {
          type: 'rate_limit_exceeded',
          message: `Too many login attempts. Please try again after ${rateLimit.lockedUntil?.toLocaleTimeString()}`,
          details: { lockedUntil: rateLimit.lockedUntil },
        },
      };
    }

    // Find user
    const user = users.find(u => u.email === credentials.email);
    if (!user) {
      recordFailedAttempt(credentials.email);
      logAuthEvent({
        email: credentials.email,
        action: 'login',
        success: false,
        errorType: 'user_not_found',
      });

      return {
        success: false,
        error: {
          type: 'invalid_credentials',
          message: 'Invalid email or password',
        },
      };
    }

    // Check if active
    if (!user.isActive) {
      logAuthEvent({
        userId: user.id,
        email: credentials.email,
        action: 'login',
        success: false,
        errorType: 'user_inactive',
      });

      return {
        success: false,
        error: {
          type: 'user_inactive',
          message: 'Account is inactive. Please contact support.',
        },
      };
    }

    // Verify password
    const isPasswordValid = await verifyPassword(credentials.password, user.passwordHash);
    if (!isPasswordValid) {
      recordFailedAttempt(credentials.email);
      logAuthEvent({
        userId: user.id,
        email: credentials.email,
        action: 'login',
        success: false,
        errorType: 'invalid_credentials',
      });

      return {
        success: false,
        error: {
          type: 'invalid_credentials',
          message: 'Invalid email or password',
        },
      };
    }

    // Reset rate limit on successful login
    resetRateLimit(credentials.email);

    // Update last login
    user.lastLogin = new Date();
    user.updatedAt = new Date();

    // Generate token
    const token = generateToken(user);

    // Create session
    const session: AuthSession = {
      user,
      token,
      expiresAt: new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000),
    };
    sessions.push(session);

    // Log success
    logAuthEvent({
      userId: user.id,
      email: user.email,
      action: 'login',
      success: true,
    });

    return {
      success: true,
      response: {
        user,
        token,
      },
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: {
        type: 'invalid_credentials',
        message: 'Login failed',
      },
    };
  }
}

/**
 * Logout user
 */
export function logout(token: string): void {
  // Remove session
  const sessionIndex = sessions.findIndex(s => s.token === token);
  if (sessionIndex !== -1) {
    const session = sessions[sessionIndex];
    sessions.splice(sessionIndex, 1);

    // Log logout
    logAuthEvent({
      userId: session.user.id,
      email: session.user.email,
      action: 'logout',
      success: true,
    });
  }

  // Clear localStorage
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    localStorage.removeItem(STORAGE_KEYS.LAST_LOGIN);
  }
}

/**
 * Get current user from token
 */
export function getCurrentUser(token: string): User | null {
  const validation = validateToken(token);

  if (!validation.isValid || !validation.payload) {
    return null;
  }

  const user = users.find(u => u.id === validation.payload!.sub);
  return user || null;
}

/**
 * Update user profile
 */
export async function updateUser(
  userId: string,
  updates: UserUpdate
): Promise<{ success: boolean; user?: User; error?: string }> {
  const user = users.find(u => u.id === userId);

  if (!user) {
    return {
      success: false,
      error: 'User not found',
    };
  }

  // Update fields
  if (updates.name !== undefined) {
    user.name = updates.name;
  }

  if (updates.email !== undefined) {
    // Check if email is already taken
    if (users.some(u => u.id !== userId && u.email === updates.email)) {
      return {
        success: false,
        error: 'Email already in use',
      };
    }
    user.email = updates.email;
  }

  if (updates.isActive !== undefined) {
    user.isActive = updates.isActive;
  }

  if (updates.preferences) {
    user.preferences = {
      ...user.preferences,
      ...updates.preferences,
    };
  }

  user.updatedAt = new Date();

  return {
    success: true,
    user,
  };
}

// ============================================
// Password Reset
// ============================================

/**
 * Request password reset
 */
export function requestPasswordReset(
  email: string
): { success: boolean; error?: string } {
  const user = users.find(u => u.email === email);

  if (!user) {
    // Don't reveal if email exists
    return { success: true };
  }

  // Generate reset token
  const token: PasswordResetToken = {
    token: generateRandomString(32),
    userId: user.id,
    email: user.email,
    expiresAt: new Date(Date.now() + PASSWORD_RESET_EXPIRY_HOURS * 60 * 60 * 1000),
    createdAt: new Date(),
  };

  passwordResetTokens.push(token);

  // Log event
  logAuthEvent({
    userId: user.id,
    email: user.email,
    action: 'password_reset',
    success: true,
  });

  // In production, send email with reset link
  console.log('Password reset token:', token.token);

  return { success: true };
}

/**
 * Reset password with token
 */
export async function resetPassword(
  resetToken: string,
  newPassword: string
): Promise<{ success: boolean; error?: AuthError }> {
  // Find token
  const token = passwordResetTokens.find(t => t.token === resetToken);

  if (!token) {
    return {
      success: false,
      error: {
        type: 'token_invalid',
        message: 'Invalid reset token',
      },
    };
  }

  // Check expiry
  if (token.expiresAt < new Date()) {
    return {
      success: false,
      error: {
        type: 'token_expired',
        message: 'Reset token has expired',
      },
    };
  }

  // Validate new password
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.isValid) {
    return {
      success: false,
      error: {
        type: 'weak_password',
        message: passwordValidation.errors.join(', '),
        details: { errors: passwordValidation.errors },
      },
    };
  }

  // Find user
  const user = users.find(u => u.id === token.userId);
  if (!user) {
    return {
      success: false,
      error: {
        type: 'user_not_found',
        message: 'User not found',
      },
    };
  }

  // Update password
  user.passwordHash = await hashPassword(newPassword);
  user.updatedAt = new Date();

  // Remove token
  const tokenIndex = passwordResetTokens.findIndex(t => t.token === resetToken);
  if (tokenIndex !== -1) {
    passwordResetTokens.splice(tokenIndex, 1);
  }

  // Log event
  logAuthEvent({
    userId: user.id,
    email: user.email,
    action: 'password_change',
    success: true,
  });

  return { success: true };
}

// ============================================
// Session Management
// ============================================

/**
 * Save session to localStorage
 */
export function saveSession(token: string, user: User): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, token);

    // Save non-sensitive user data
    const userProfile = {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles.map(r => r.name),
      isActive: user.isActive,
    };

    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(userProfile));
    localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(user.preferences));
    localStorage.setItem(STORAGE_KEYS.LAST_LOGIN, new Date().toISOString());
  } catch (error) {
    console.error('Failed to save session:', error);
  }
}

/**
 * Load session from localStorage
 */
export function loadSession(): { token: string; user: User } | null {
  if (typeof window === 'undefined') return null;

  try {
    const token = localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);
    if (!token) return null;

    const user = getCurrentUser(token);
    if (!user) return null;

    return { token, user };
  } catch (error) {
    console.error('Failed to load session:', error);
    return null;
  }
}

/**
 * Clear session from localStorage
 */
export function clearSession(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    localStorage.removeItem(STORAGE_KEYS.LAST_LOGIN);
  } catch (error) {
    console.error('Failed to clear session:', error);
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Generate random ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate random string
 */
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ============================================
// Demo/Testing Functions
// ============================================

/**
 * Initialize with demo users (for testing)
 */
export async function initializeDemoUsers(): Promise<void> {
  // Clear existing users
  users = [];

  // Create demo users for each role
  const demoUsers = [
    {
      email: 'superadmin@omni-sales.com',
      password: 'SuperAdmin123!',
      name: 'Super Admin',
      role: 'super_admin' as UserRole,
    },
    {
      email: 'admin@omni-sales.com',
      password: 'Admin123!',
      name: 'Admin User',
      role: 'admin' as UserRole,
    },
    {
      email: 'manager@omni-sales.com',
      password: 'Manager123!',
      name: 'Manager User',
      role: 'manager' as UserRole,
    },
    {
      email: 'staff@omni-sales.com',
      password: 'Staff123!',
      name: 'Staff User',
      role: 'staff' as UserRole,
    },
    {
      email: 'customer@omni-sales.com',
      password: 'Customer123!',
      name: 'Customer User',
      role: 'customer' as UserRole,
    },
  ];

  for (const demoUser of demoUsers) {
    const passwordHash = await hashPassword(demoUser.password);
    const role = getDefaultRoleByName(demoUser.role);

    const user: User = {
      id: generateId(),
      email: demoUser.email,
      name: demoUser.name,
      passwordHash,
      roles: [role],
      permissions: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      preferences: {
        theme: 'auto',
        language: 'th',
        notifications: true,
        emailDigest: 'weekly',
      },
    };

    users.push(user);
  }

  console.log('Demo users initialized');
}

/**
 * Get all users (for admin purposes)
 */
export function getAllUsers(): User[] {
  return users.map(u => ({
    ...u,
    passwordHash: '***', // Don't expose password hash
  }));
}

/**
 * Get user by ID
 */
export function getUserById(userId: string): User | null {
  return users.find(u => u.id === userId) || null;
}

/**
 * Get user by email
 */
export function getUserByEmail(email: string): User | null {
  return users.find(u => u.email === email) || null;
}
