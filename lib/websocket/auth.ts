import { WebSocketAuthToken, UserRole } from './types';

/**
 * WebSocket Authentication Utilities
 */

/**
 * Generate WebSocket authentication token
 */
export function generateWebSocketToken(
  userId: string,
  role: UserRole,
  sessionId?: string,
  expiresIn: number = 24 * 60 * 60 * 1000 // 24 hours default
): WebSocketAuthToken {
  return {
    userId,
    role,
    sessionId: sessionId || generateSessionId(),
    expiresAt: Date.now() + expiresIn,
  };
}

/**
 * Generate unique session ID
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Verify WebSocket token
 */
export function verifyWebSocketToken(token: WebSocketAuthToken): {
  valid: boolean;
  error?: string;
} {
  // Check required fields
  if (!token.userId || !token.role || !token.sessionId) {
    return { valid: false, error: 'Missing required fields' };
  }

  // Check expiration
  if (token.expiresAt && token.expiresAt < Date.now()) {
    return { valid: false, error: 'Token expired' };
  }

  // Check valid role
  const validRoles: UserRole[] = ['admin', 'manager', 'staff', 'customer', 'guest'];
  if (!validRoles.includes(token.role)) {
    return { valid: false, error: 'Invalid role' };
  }

  return { valid: true };
}

/**
 * Refresh WebSocket token
 */
export function refreshWebSocketToken(
  oldToken: WebSocketAuthToken,
  expiresIn: number = 24 * 60 * 60 * 1000
): WebSocketAuthToken {
  return {
    ...oldToken,
    expiresAt: Date.now() + expiresIn,
  };
}

/**
 * Create token for guest user
 */
export function createGuestToken(): WebSocketAuthToken {
  return {
    userId: `guest_${Date.now()}`,
    role: 'guest',
    sessionId: generateSessionId(),
    expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour for guests
  };
}

/**
 * Extract user info from token
 */
export function extractUserInfo(token: WebSocketAuthToken): {
  userId: string;
  role: UserRole;
  isGuest: boolean;
} {
  return {
    userId: token.userId,
    role: token.role,
    isGuest: token.role === 'guest' || token.userId.startsWith('guest_'),
  };
}
