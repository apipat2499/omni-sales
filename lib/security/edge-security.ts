/**
 * Edge Runtime Compatible Security Utilities
 * Uses Web Crypto API instead of Node.js crypto module
 */

/**
 * Generate unique request ID using Web Crypto API
 * Edge Runtime compatible
 */
export function generateRequestID(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
  return `${timestamp}-${randomPart}`;
}
