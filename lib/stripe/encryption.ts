import crypto from 'crypto';

/**
 * Encryption utilities for sensitive data
 * PCI compliance considerations for storing payment-related data
 */

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Validate encryption key
 */
const validateEncryptionKey = (): Buffer => {
  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }

  // Key must be 32 bytes (256 bits) for AES-256
  const keyBuffer = Buffer.from(ENCRYPTION_KEY, 'hex');

  if (keyBuffer.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
  }

  return keyBuffer;
};

/**
 * Generate a secure encryption key
 * Use this to generate a new key for ENCRYPTION_KEY environment variable
 */
export const generateEncryptionKey = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Encrypt sensitive data
 * @param text - Plain text to encrypt
 * @returns Encrypted string in format: iv:authTag:encryptedData
 */
export const encrypt = (text: string): string => {
  try {
    const key = validateEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return iv:authTag:encrypted format
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt sensitive data
 * @param encryptedText - Encrypted string in format: iv:authTag:encryptedData
 * @returns Decrypted plain text
 */
export const decrypt = (encryptedText: string): string => {
  try {
    const key = validateEncryptionKey();
    const parts = encryptedText.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const [ivHex, authTagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Hash sensitive data (one-way)
 * Use for data that needs to be compared but never decrypted
 */
export const hash = (text: string): string => {
  return crypto.createHash('sha256').update(text).digest('hex');
};

/**
 * Mask sensitive data for display (e.g., credit card numbers)
 * @param text - Text to mask
 * @param visibleChars - Number of characters to show at the end
 * @returns Masked string
 */
export const maskSensitiveData = (
  text: string,
  visibleChars: number = 4
): string => {
  if (text.length <= visibleChars) {
    return '*'.repeat(text.length);
  }

  const masked = '*'.repeat(text.length - visibleChars);
  const visible = text.slice(-visibleChars);

  return masked + visible;
};

/**
 * Sanitize error messages to prevent leaking sensitive information
 */
export const sanitizeErrorMessage = (error: any): string => {
  const message = error?.message || 'An error occurred';

  // Remove sensitive patterns
  const sanitized = message
    .replace(/sk_live_[a-zA-Z0-9]+/g, 'sk_live_***')
    .replace(/sk_test_[a-zA-Z0-9]+/g, 'sk_test_***')
    .replace(/pk_live_[a-zA-Z0-9]+/g, 'pk_live_***')
    .replace(/pk_test_[a-zA-Z0-9]+/g, 'pk_test_***')
    .replace(/\b\d{13,19}\b/g, '****') // Card numbers
    .replace(/\b\d{3,4}\b/g, '***'); // CVV

  return sanitized;
};

/**
 * Validate that data is encrypted
 */
export const isEncrypted = (text: string): boolean => {
  const parts = text.split(':');
  return parts.length === 3 &&
         parts[0].length === IV_LENGTH * 2 &&
         parts[1].length === AUTH_TAG_LENGTH * 2;
};

/**
 * Generate a random idempotency key
 */
export const generateIdempotencyKey = (): string => {
  return crypto.randomBytes(16).toString('hex');
};
