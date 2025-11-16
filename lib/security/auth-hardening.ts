/**
 * Authentication Hardening
 * Implements security enhancements for authentication including
 * session management, token rotation, IP tracking, and suspicious activity detection
 */

import { createHash } from 'crypto';

// ============================================
// Session Configuration
// ============================================

export interface SessionConfig {
  // Session timeout in milliseconds
  timeout: number;
  // Absolute timeout (max session lifetime)
  absoluteTimeout: number;
  // Enable sliding expiration
  slidingExpiration: boolean;
  // Require fresh login for sensitive operations
  requireFreshLogin: boolean;
  // Fresh login timeout (in milliseconds)
  freshLoginTimeout: number;
}

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  timeout: 30 * 60 * 1000, // 30 minutes
  absoluteTimeout: 24 * 60 * 60 * 1000, // 24 hours
  slidingExpiration: true,
  requireFreshLogin: true,
  freshLoginTimeout: 5 * 60 * 1000, // 5 minutes
};

/**
 * Session data structure
 */
export interface Session {
  id: string;
  userId: string;
  createdAt: Date;
  lastActivityAt: Date;
  lastFreshLoginAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

/**
 * Check if session is valid
 */
export function isSessionValid(
  session: Session,
  config: SessionConfig = DEFAULT_SESSION_CONFIG
): { valid: boolean; reason?: string } {
  const now = Date.now();

  // Check absolute timeout
  const sessionAge = now - session.createdAt.getTime();
  if (sessionAge > config.absoluteTimeout) {
    return { valid: false, reason: 'Session exceeded maximum lifetime' };
  }

  // Check idle timeout
  const idleTime = now - session.lastActivityAt.getTime();
  if (idleTime > config.timeout) {
    return { valid: false, reason: 'Session timed out due to inactivity' };
  }

  return { valid: true };
}

/**
 * Check if fresh login is required
 */
export function requiresFreshLogin(
  session: Session,
  config: SessionConfig = DEFAULT_SESSION_CONFIG
): boolean {
  if (!config.requireFreshLogin || !session.lastFreshLoginAt) {
    return false;
  }

  const timeSinceFreshLogin = Date.now() - session.lastFreshLoginAt.getTime();
  return timeSinceFreshLogin > config.freshLoginTimeout;
}

// ============================================
// Refresh Token Rotation
// ============================================

export interface RefreshToken {
  token: string;
  userId: string;
  family: string; // Token family for rotation detection
  expiresAt: Date;
  createdAt: Date;
  usedAt?: Date;
  replacedBy?: string;
  revokedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Generate token family ID
 */
export function generateTokenFamily(): string {
  return createHash('sha256')
    .update(`${Date.now()}-${Math.random()}`)
    .digest('hex')
    .substring(0, 32);
}

/**
 * Validate refresh token rotation
 * Detects token reuse attacks
 */
export function validateTokenRotation(
  currentToken: RefreshToken,
  attemptedToken: RefreshToken
): { valid: boolean; reason?: string; action?: 'revoke_family' } {
  // Check if token is expired
  if (currentToken.expiresAt < new Date()) {
    return { valid: false, reason: 'Token expired' };
  }

  // Check if token is revoked
  if (currentToken.revokedAt) {
    return { valid: false, reason: 'Token revoked' };
  }

  // Check if token was already used (potential token reuse attack)
  if (currentToken.usedAt) {
    console.warn('[Auth] Potential token reuse attack detected');
    return {
      valid: false,
      reason: 'Token already used',
      action: 'revoke_family', // Revoke entire token family
    };
  }

  // Verify token family matches
  if (currentToken.family !== attemptedToken.family) {
    return { valid: false, reason: 'Token family mismatch' };
  }

  return { valid: true };
}

// ============================================
// IP Address Tracking
// ============================================

export interface IPTrackingConfig {
  enabled: boolean;
  // Require reauth if IP changes
  requireReauthOnIPChange: boolean;
  // Store IP hash instead of raw IP (privacy)
  hashIP: boolean;
  // Allow IP changes within same subnet
  allowSubnetChange: boolean;
}

export const DEFAULT_IP_TRACKING_CONFIG: IPTrackingConfig = {
  enabled: true,
  requireReauthOnIPChange: false,
  hashIP: true,
  allowSubnetChange: true,
};

/**
 * Hash IP address for privacy
 */
export function hashIPAddress(ip: string, salt: string = ''): string {
  return createHash('sha256')
    .update(ip + salt)
    .digest('hex');
}

/**
 * Get IP subnet (first 3 octets for IPv4)
 */
export function getIPSubnet(ip: string): string {
  const parts = ip.split('.');
  if (parts.length === 4) {
    return parts.slice(0, 3).join('.');
  }
  // For IPv6, return first 64 bits
  const ipv6Parts = ip.split(':');
  if (ipv6Parts.length >= 4) {
    return ipv6Parts.slice(0, 4).join(':');
  }
  return ip;
}

/**
 * Validate IP address change
 */
export function validateIPChange(
  currentIP: string,
  newIP: string,
  config: IPTrackingConfig = DEFAULT_IP_TRACKING_CONFIG
): { valid: boolean; reason?: string } {
  if (!config.enabled) {
    return { valid: true };
  }

  // Hash IPs if configured
  const currentIPValue = config.hashIP ? hashIPAddress(currentIP) : currentIP;
  const newIPValue = config.hashIP ? hashIPAddress(newIP) : newIP;

  // Check exact match
  if (currentIPValue === newIPValue) {
    return { valid: true };
  }

  // Check subnet match if allowed
  if (config.allowSubnetChange) {
    const currentSubnet = getIPSubnet(currentIP);
    const newSubnet = getIPSubnet(newIP);

    if (currentSubnet === newSubnet) {
      return { valid: true };
    }
  }

  // IP changed
  if (config.requireReauthOnIPChange) {
    return { valid: false, reason: 'IP address changed, reauthentication required' };
  }

  // Log warning but allow
  console.warn('[Auth] IP address changed', { currentIP, newIP });
  return { valid: true };
}

// ============================================
// Suspicious Login Detection
// ============================================

export interface LoginAttempt {
  userId?: string;
  email?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
  reason?: string;
}

export interface SuspiciousActivityConfig {
  // Max failed attempts before lockout
  maxFailedAttempts: number;
  // Lockout duration in milliseconds
  lockoutDuration: number;
  // Time window for counting failed attempts
  failedAttemptWindow: number;
  // Detect unusual locations
  detectUnusualLocation: boolean;
  // Detect unusual devices
  detectUnusualDevice: boolean;
  // Require MFA for suspicious logins
  requireMFAOnSuspicious: boolean;
}

export const DEFAULT_SUSPICIOUS_ACTIVITY_CONFIG: SuspiciousActivityConfig = {
  maxFailedAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  failedAttemptWindow: 30 * 60 * 1000, // 30 minutes
  detectUnusualLocation: true,
  detectUnusualDevice: true,
  requireMFAOnSuspicious: true,
};

/**
 * Check for suspicious login activity
 */
export function detectSuspiciousActivity(
  attempt: LoginAttempt,
  recentAttempts: LoginAttempt[],
  config: SuspiciousActivityConfig = DEFAULT_SUSPICIOUS_ACTIVITY_CONFIG
): {
  suspicious: boolean;
  reason?: string;
  action?: 'lockout' | 'require_mfa' | 'notify';
  lockoutUntil?: Date;
} {
  // Count recent failed attempts
  const now = Date.now();
  const windowStart = now - config.failedAttemptWindow;

  const recentFailedAttempts = recentAttempts.filter(
    a => !a.success && a.timestamp.getTime() >= windowStart
  );

  // Check for too many failed attempts
  if (recentFailedAttempts.length >= config.maxFailedAttempts) {
    const lockoutUntil = new Date(now + config.lockoutDuration);
    return {
      suspicious: true,
      reason: 'Too many failed login attempts',
      action: 'lockout',
      lockoutUntil,
    };
  }

  // Check for rapid-fire attempts (potential brute force)
  const veryRecentAttempts = recentAttempts.filter(
    a => now - a.timestamp.getTime() < 60000 // Last minute
  );

  if (veryRecentAttempts.length >= 10) {
    return {
      suspicious: true,
      reason: 'Rapid login attempts detected',
      action: 'lockout',
      lockoutUntil: new Date(now + config.lockoutDuration),
    };
  }

  // Detect unusual location (different IP)
  if (config.detectUnusualLocation) {
    const successfulAttempts = recentAttempts.filter(a => a.success);
    const knownIPs = new Set(successfulAttempts.map(a => a.ipAddress));

    if (knownIPs.size > 0 && !knownIPs.has(attempt.ipAddress)) {
      return {
        suspicious: true,
        reason: 'Login from unusual location',
        action: config.requireMFAOnSuspicious ? 'require_mfa' : 'notify',
      };
    }
  }

  // Detect unusual device (different user agent)
  if (config.detectUnusualDevice) {
    const successfulAttempts = recentAttempts.filter(a => a.success);
    const knownDevices = new Set(successfulAttempts.map(a => a.userAgent));

    if (knownDevices.size > 0 && !knownDevices.has(attempt.userAgent)) {
      return {
        suspicious: true,
        reason: 'Login from unusual device',
        action: config.requireMFAOnSuspicious ? 'require_mfa' : 'notify',
      };
    }
  }

  return { suspicious: false };
}

// ============================================
// Password Hardening
// ============================================

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventCommonPasswords: boolean;
  preventUserInfo: boolean; // Prevent password containing username/email
  maxAge?: number; // Force password change after X days
  preventReuse: number; // Number of previous passwords to check
}

export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  preventUserInfo: true,
  preventReuse: 5,
};

// Common weak passwords (subset)
const COMMON_PASSWORDS = new Set([
  'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey',
  'letmein', 'trustno1', 'dragon', 'baseball', 'iloveyou', 'master',
  'sunshine', 'ashley', 'bailey', 'passw0rd', 'shadow', 'password1',
]);

/**
 * Validate password strength
 */
export function validatePasswordStrength(
  password: string,
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY,
  userInfo?: { email?: string; username?: string; name?: string }
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check minimum length
  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters long`);
  }

  // Check uppercase
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check lowercase
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check numbers
  if (policy.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check special characters
  if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check common passwords
  if (policy.preventCommonPasswords && COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push('Password is too common');
  }

  // Check user info
  if (policy.preventUserInfo && userInfo) {
    const lowerPassword = password.toLowerCase();
    const checks = [
      userInfo.email?.toLowerCase().split('@')[0],
      userInfo.username?.toLowerCase(),
      userInfo.name?.toLowerCase(),
    ].filter(Boolean);

    for (const check of checks) {
      if (check && lowerPassword.includes(check)) {
        errors.push('Password cannot contain your personal information');
        break;
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate password strength score (0-100)
 */
export function calculatePasswordStrength(password: string): number {
  let score = 0;

  // Length
  score += Math.min(password.length * 4, 40);

  // Character variety
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/\d/.test(password)) score += 10;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 15;

  // Patterns (subtract points)
  if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated characters
  if (/^[0-9]+$/.test(password)) score -= 20; // All numbers
  if (/^[a-zA-Z]+$/.test(password)) score -= 10; // All letters

  return Math.max(0, Math.min(100, score));
}

// ============================================
// Secure Cookie Settings
// ============================================

export interface SecureCookieConfig {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  path: string;
  maxAge?: number;
  domain?: string;
}

export const DEFAULT_COOKIE_CONFIG: SecureCookieConfig = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: 24 * 60 * 60, // 24 hours
};

/**
 * Generate secure cookie options
 */
export function getSecureCookieOptions(
  config: Partial<SecureCookieConfig> = {}
): SecureCookieConfig {
  return {
    ...DEFAULT_COOKIE_CONFIG,
    ...config,
  };
}

// Export all
export default {
  // Session Management
  DEFAULT_SESSION_CONFIG,
  isSessionValid,
  requiresFreshLogin,

  // Token Rotation
  generateTokenFamily,
  validateTokenRotation,

  // IP Tracking
  DEFAULT_IP_TRACKING_CONFIG,
  hashIPAddress,
  getIPSubnet,
  validateIPChange,

  // Suspicious Activity
  DEFAULT_SUSPICIOUS_ACTIVITY_CONFIG,
  detectSuspiciousActivity,

  // Password Policy
  DEFAULT_PASSWORD_POLICY,
  validatePasswordStrength,
  calculatePasswordStrength,

  // Cookies
  DEFAULT_COOKIE_CONFIG,
  getSecureCookieOptions,
};
