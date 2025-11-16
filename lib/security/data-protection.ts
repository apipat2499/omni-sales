/**
 * Data Protection Module
 * Implements field-level encryption, data masking, and secure data handling
 * for PII and sensitive information
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

// ============================================
// Field-Level Encryption
// ============================================

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Derive encryption key from password/secret
 */
function deriveKey(secret: string, salt: Buffer): Buffer {
  return scryptSync(secret, salt, KEY_LENGTH);
}

/**
 * Encrypt data
 */
export function encrypt(
  data: string,
  secret: string = process.env.ENCRYPTION_SECRET || 'change-me-in-production'
): string {
  try {
    // Generate salt and IV
    const salt = randomBytes(SALT_LENGTH);
    const iv = randomBytes(IV_LENGTH);

    // Derive key
    const key = deriveKey(secret, salt);

    // Create cipher
    const cipher = createCipheriv(ALGORITHM, key, iv);

    // Encrypt
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get auth tag
    const tag = cipher.getAuthTag();

    // Combine: salt + iv + tag + encrypted
    const combined = Buffer.concat([
      salt,
      iv,
      tag,
      Buffer.from(encrypted, 'hex'),
    ]);

    return combined.toString('base64');
  } catch (error) {
    console.error('[Encryption] Failed to encrypt data:', error);
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypt data
 */
export function decrypt(
  encryptedData: string,
  secret: string = process.env.ENCRYPTION_SECRET || 'change-me-in-production'
): string {
  try {
    // Decode from base64
    const combined = Buffer.from(encryptedData, 'base64');

    // Extract components
    const salt = combined.subarray(0, SALT_LENGTH);
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = combined.subarray(
      SALT_LENGTH + IV_LENGTH,
      SALT_LENGTH + IV_LENGTH + TAG_LENGTH
    );
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

    // Derive key
    const key = deriveKey(secret, salt);

    // Create decipher
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    // Decrypt
    let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('[Decryption] Failed to decrypt data:', error);
    throw new Error('Decryption failed');
  }
}

/**
 * Encrypt object fields
 */
export function encryptFields<T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[],
  secret?: string
): T {
  const encrypted = { ...obj };

  for (const field of fields) {
    if (encrypted[field] && typeof encrypted[field] === 'string') {
      encrypted[field] = encrypt(encrypted[field] as string, secret) as any;
    }
  }

  return encrypted;
}

/**
 * Decrypt object fields
 */
export function decryptFields<T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[],
  secret?: string
): T {
  const decrypted = { ...obj };

  for (const field of fields) {
    if (decrypted[field] && typeof decrypted[field] === 'string') {
      try {
        decrypted[field] = decrypt(decrypted[field] as string, secret) as any;
      } catch (error) {
        console.warn(`[Decryption] Failed to decrypt field: ${String(field)}`);
        // Keep original value if decryption fails
      }
    }
  }

  return decrypted;
}

// ============================================
// Data Masking
// ============================================

/**
 * Mask email address
 * example@domain.com -> e****e@domain.com
 */
export function maskEmail(email: string, options: {
  showFirst?: number;
  showLast?: number;
  maskChar?: string;
} = {}): string {
  if (!email || !email.includes('@')) {
    return email;
  }

  const { showFirst = 1, showLast = 1, maskChar = '*' } = options;
  const [localPart, domain] = email.split('@');

  if (localPart.length <= showFirst + showLast) {
    return `${maskChar.repeat(3)}@${domain}`;
  }

  const maskedLocal =
    localPart.substring(0, showFirst) +
    maskChar.repeat(Math.max(localPart.length - showFirst - showLast, 3)) +
    localPart.substring(localPart.length - showLast);

  return `${maskedLocal}@${domain}`;
}

/**
 * Mask phone number
 * +1234567890 -> +123***7890
 */
export function maskPhone(phone: string, options: {
  showFirst?: number;
  showLast?: number;
  maskChar?: string;
} = {}): string {
  if (!phone) {
    return phone;
  }

  const { showFirst = 3, showLast = 4, maskChar = '*' } = options;
  const digits = phone.replace(/\D/g, '');

  if (digits.length <= showFirst + showLast) {
    return maskChar.repeat(digits.length);
  }

  const prefix = phone.startsWith('+') ? '+' : '';
  const maskedDigits =
    digits.substring(0, showFirst) +
    maskChar.repeat(digits.length - showFirst - showLast) +
    digits.substring(digits.length - showLast);

  return prefix + maskedDigits;
}

/**
 * Mask credit card number
 * 1234567890123456 -> ************3456
 */
export function maskCreditCard(cardNumber: string, options: {
  showLast?: number;
  maskChar?: string;
  groupSize?: number;
} = {}): string {
  if (!cardNumber) {
    return cardNumber;
  }

  const { showLast = 4, maskChar = '*', groupSize = 4 } = options;
  const digits = cardNumber.replace(/\D/g, '');

  if (digits.length <= showLast) {
    return maskChar.repeat(digits.length);
  }

  const masked =
    maskChar.repeat(digits.length - showLast) +
    digits.substring(digits.length - showLast);

  // Group digits if specified
  if (groupSize > 0) {
    return masked.match(new RegExp(`.{1,${groupSize}}`, 'g'))?.join(' ') || masked;
  }

  return masked;
}

/**
 * Mask string (generic)
 */
export function maskString(str: string, options: {
  showFirst?: number;
  showLast?: number;
  maskChar?: string;
  minLength?: number;
} = {}): string {
  if (!str) {
    return str;
  }

  const { showFirst = 2, showLast = 2, maskChar = '*', minLength = 4 } = options;

  if (str.length < minLength) {
    return maskChar.repeat(str.length);
  }

  if (str.length <= showFirst + showLast) {
    return maskChar.repeat(Math.max(str.length, 4));
  }

  return (
    str.substring(0, showFirst) +
    maskChar.repeat(str.length - showFirst - showLast) +
    str.substring(str.length - showLast)
  );
}

/**
 * Mask IP address
 * 192.168.1.100 -> 192.168.*.*
 */
export function maskIP(ip: string, options: {
  showOctets?: number;
  maskChar?: string;
} = {}): string {
  if (!ip) {
    return ip;
  }

  const { showOctets = 2, maskChar = '*' } = options;

  // IPv4
  if (ip.includes('.')) {
    const octets = ip.split('.');
    return octets
      .map((octet, index) => (index < showOctets ? octet : maskChar))
      .join('.');
  }

  // IPv6
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return parts
      .map((part, index) => (index < showOctets ? part : maskChar))
      .join(':');
  }

  return ip;
}

/**
 * Mask object fields
 */
export function maskFields<T extends Record<string, any>>(
  obj: T,
  fieldConfigs: Record<
    keyof T,
    'email' | 'phone' | 'card' | 'string' | 'ip' | ((value: any) => any)
  >
): T {
  const masked = { ...obj };

  for (const [field, config] of Object.entries(fieldConfigs)) {
    const value = masked[field as keyof T];

    if (value === null || value === undefined) {
      continue;
    }

    if (typeof config === 'function') {
      masked[field as keyof T] = config(value);
    } else {
      switch (config) {
        case 'email':
          masked[field as keyof T] = maskEmail(String(value)) as any;
          break;
        case 'phone':
          masked[field as keyof T] = maskPhone(String(value)) as any;
          break;
        case 'card':
          masked[field as keyof T] = maskCreditCard(String(value)) as any;
          break;
        case 'ip':
          masked[field as keyof T] = maskIP(String(value)) as any;
          break;
        case 'string':
        default:
          masked[field as keyof T] = maskString(String(value)) as any;
          break;
      }
    }
  }

  return masked;
}

// ============================================
// Log Sanitization
// ============================================

/**
 * Sensitive field patterns to redact in logs
 */
const SENSITIVE_PATTERNS = [
  /password/i,
  /passwd/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /auth/i,
  /credential/i,
  /private[_-]?key/i,
  /ssn/i,
  /credit[_-]?card/i,
  /cvv/i,
  /pin/i,
];

/**
 * Check if field name is sensitive
 */
function isSensitiveField(fieldName: string): boolean {
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(fieldName));
}

/**
 * Sanitize data for logging
 * Removes or masks sensitive information
 */
export function sanitizeForLogging<T extends Record<string, any>>(
  data: T,
  options: {
    redact?: boolean; // Completely remove sensitive fields
    mask?: boolean; // Mask sensitive fields
    customSensitiveFields?: string[];
  } = {}
): T {
  const { redact = false, mask = true, customSensitiveFields = [] } = options;

  const sanitized = { ...data };

  for (const [key, value] of Object.entries(sanitized)) {
    const isSensitive =
      isSensitiveField(key) || customSensitiveFields.includes(key);

    if (isSensitive) {
      if (redact) {
        delete sanitized[key as keyof T];
      } else if (mask) {
        if (typeof value === 'string') {
          sanitized[key as keyof T] = '[REDACTED]' as any;
        } else {
          sanitized[key as keyof T] = '[REDACTED]' as any;
        }
      }
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key as keyof T] = sanitizeForLogging(value, options) as any;
    } else if (Array.isArray(value)) {
      sanitized[key as keyof T] = value.map(item =>
        typeof item === 'object' && item !== null
          ? sanitizeForLogging(item, options)
          : item
      ) as any;
    }
  }

  return sanitized;
}

// ============================================
// PII Detection
// ============================================

/**
 * Detect potential PII in text
 */
export function detectPII(text: string): {
  hasPII: boolean;
  types: string[];
} {
  const types: string[] = [];

  // Email
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) {
    types.push('email');
  }

  // Phone (US format)
  if (/(\+1[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/.test(text)) {
    types.push('phone');
  }

  // Credit card (basic pattern)
  if (/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/.test(text)) {
    types.push('credit_card');
  }

  // SSN (US format)
  if (/\b\d{3}-\d{2}-\d{4}\b/.test(text)) {
    types.push('ssn');
  }

  // IP address
  if (/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/.test(text)) {
    types.push('ip_address');
  }

  return {
    hasPII: types.length > 0,
    types,
  };
}

/**
 * Redact PII from text
 */
export function redactPII(text: string, options: {
  replaceWith?: string;
} = {}): string {
  const { replaceWith = '[REDACTED]' } = options;

  let redacted = text;

  // Redact email
  redacted = redacted.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    replaceWith
  );

  // Redact phone
  redacted = redacted.replace(
    /(\+1[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g,
    replaceWith
  );

  // Redact credit card
  redacted = redacted.replace(
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    replaceWith
  );

  // Redact SSN
  redacted = redacted.replace(/\b\d{3}-\d{2}-\d{4}\b/g, replaceWith);

  return redacted;
}

// ============================================
// Password Hashing Verification
// ============================================

/**
 * Verify password hash algorithm is secure
 */
export function isSecureHashAlgorithm(algorithm: string): boolean {
  const secureAlgorithms = [
    'bcrypt',
    'scrypt',
    'argon2',
    'pbkdf2',
  ];

  return secureAlgorithms.some(algo =>
    algorithm.toLowerCase().includes(algo)
  );
}

/**
 * Validate password hash format
 */
export function validatePasswordHash(hash: string): {
  valid: boolean;
  algorithm?: string;
  secure?: boolean;
} {
  // bcrypt format: $2a$10$...
  if (/^\$2[aby]\$\d{2}\$/.test(hash)) {
    return { valid: true, algorithm: 'bcrypt', secure: true };
  }

  // scrypt format (Node.js): scrypt:...
  if (hash.startsWith('scrypt:')) {
    return { valid: true, algorithm: 'scrypt', secure: true };
  }

  // argon2 format: $argon2...
  if (/^\$argon2[id]{0,2}\$/.test(hash)) {
    return { valid: true, algorithm: 'argon2', secure: true };
  }

  // pbkdf2 format (custom): pbkdf2:...
  if (hash.startsWith('pbkdf2:')) {
    return { valid: true, algorithm: 'pbkdf2', secure: true };
  }

  // MD5/SHA1 (insecure)
  if (/^[a-f0-9]{32}$/i.test(hash)) {
    return { valid: false, algorithm: 'md5', secure: false };
  }

  if (/^[a-f0-9]{40}$/i.test(hash)) {
    return { valid: false, algorithm: 'sha1', secure: false };
  }

  return { valid: false };
}

// ============================================
// Secure Data Comparison
// ============================================

/**
 * Constant-time buffer comparison
 */
export function constantTimeCompare(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }

  return result === 0;
}

// Export all
export default {
  // Encryption
  encrypt,
  decrypt,
  encryptFields,
  decryptFields,

  // Masking
  maskEmail,
  maskPhone,
  maskCreditCard,
  maskString,
  maskIP,
  maskFields,

  // Log Sanitization
  sanitizeForLogging,

  // PII Detection
  detectPII,
  redactPII,

  // Password Hash Verification
  isSecureHashAlgorithm,
  validatePasswordHash,

  // Secure Comparison
  constantTimeCompare,
};
