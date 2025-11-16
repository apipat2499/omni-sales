/**
 * Input Validation & Sanitization
 * Provides comprehensive input validation and sanitization utilities
 * to prevent XSS, SQL injection, and other injection attacks
 */

/**
 * HTML Entity Encoding
 * Escapes HTML special characters to prevent XSS attacks
 */
export function escapeHTML(input: string): string {
  if (typeof input !== 'string') {
    return String(input);
  }

  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };

  return input.replace(/[&<>"'`=\/]/g, (char) => htmlEntities[char] || char);
}

/**
 * Decode HTML entities
 */
export function decodeHTML(input: string): string {
  if (typeof input !== 'string') {
    return String(input);
  }

  const htmlEntities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#x60;': '`',
    '&#x3D;': '=',
  };

  return input.replace(/&[#\w]+;/g, (entity) => htmlEntities[entity] || entity);
}

/**
 * Strip HTML tags from input
 */
export function stripHTML(input: string): string {
  if (typeof input !== 'string') {
    return String(input);
  }

  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/**
 * Sanitize string input
 * Removes dangerous characters and patterns
 */
export function sanitizeString(input: string, options: {
  allowHTML?: boolean;
  maxLength?: number;
  trim?: boolean;
} = {}): string {
  if (typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Trim whitespace
  if (options.trim !== false) {
    sanitized = sanitized.trim();
  }

  // Remove HTML if not allowed
  if (!options.allowHTML) {
    sanitized = stripHTML(sanitized);
  }

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove control characters (except newlines and tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Limit length
  if (options.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }

  return sanitized;
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') {
    return '';
  }

  // Remove whitespace and convert to lowercase
  const sanitized = email.trim().toLowerCase();

  // Basic email validation pattern
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(sanitized)) {
    throw new Error('Invalid email format');
  }

  return sanitized;
}

/**
 * Sanitize URL
 */
export function sanitizeURL(url: string, options: {
  allowedProtocols?: string[];
  requireProtocol?: boolean;
} = {}): string {
  if (typeof url !== 'string') {
    return '';
  }

  const sanitized = url.trim();

  // Default allowed protocols
  const allowedProtocols = options.allowedProtocols || ['http', 'https'];

  try {
    const parsedURL = new URL(sanitized);

    // Check protocol
    const protocol = parsedURL.protocol.replace(':', '');
    if (!allowedProtocols.includes(protocol)) {
      throw new Error(`Protocol ${protocol} not allowed`);
    }

    return parsedURL.toString();
  } catch (error) {
    // If URL parsing fails and protocol is not required, return empty
    if (options.requireProtocol === false) {
      return sanitized;
    }
    throw new Error('Invalid URL format');
  }
}

/**
 * Sanitize phone number
 */
export function sanitizePhoneNumber(phone: string): string {
  if (typeof phone !== 'string') {
    return '';
  }

  // Remove all non-digit characters except + (for country code)
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(input: string | number, options: {
  min?: number;
  max?: number;
  decimals?: number;
  allowNegative?: boolean;
} = {}): number {
  const num = typeof input === 'string' ? parseFloat(input) : input;

  if (isNaN(num)) {
    throw new Error('Invalid number format');
  }

  let sanitized = num;

  // Check negative
  if (options.allowNegative === false && sanitized < 0) {
    throw new Error('Negative numbers not allowed');
  }

  // Apply min/max constraints
  if (options.min !== undefined && sanitized < options.min) {
    sanitized = options.min;
  }

  if (options.max !== undefined && sanitized > options.max) {
    sanitized = options.max;
  }

  // Round to specified decimals
  if (options.decimals !== undefined) {
    const factor = Math.pow(10, options.decimals);
    sanitized = Math.round(sanitized * factor) / factor;
  }

  return sanitized;
}

/**
 * Sanitize object (recursive)
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  options: {
    allowHTML?: boolean;
    maxStringLength?: number;
  } = {}
): T {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const sanitized: any = Array.isArray(obj) ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value, {
        allowHTML: options.allowHTML,
        maxLength: options.maxStringLength,
      });
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, options);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * SQL Injection Prevention
 * Validates that parameterized queries are being used
 */
export function validateSQLParameter(param: any): boolean {
  if (typeof param !== 'string') {
    return true;
  }

  // Check for common SQL injection patterns
  const sqlInjectionPatterns = [
    /(\bOR\b|\bAND\b)\s+[\'\"]?\d+[\'\"]?\s*=\s*[\'\"]?\d+/i,
    /UNION\s+SELECT/i,
    /DROP\s+TABLE/i,
    /INSERT\s+INTO/i,
    /DELETE\s+FROM/i,
    /UPDATE\s+\w+\s+SET/i,
    /EXEC\s*\(/i,
    /EXECUTE\s*\(/i,
    /--/,
    /\/\*/,
    /xp_/i,
    /sp_/i,
  ];

  return !sqlInjectionPatterns.some(pattern => pattern.test(param));
}

/**
 * Validate and sanitize JSON input
 */
export function sanitizeJSON(input: string, options: {
  maxDepth?: number;
  maxSize?: number;
} = {}): any {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }

  // Check size
  if (options.maxSize && input.length > options.maxSize) {
    throw new Error(`JSON input exceeds maximum size of ${options.maxSize} bytes`);
  }

  let parsed: any;
  try {
    parsed = JSON.parse(input);
  } catch (error) {
    throw new Error('Invalid JSON format');
  }

  // Check depth
  if (options.maxDepth) {
    const checkDepth = (obj: any, depth: number = 0): boolean => {
      if (depth > options.maxDepth!) {
        return false;
      }

      if (typeof obj === 'object' && obj !== null) {
        return Object.values(obj).every(value => checkDepth(value, depth + 1));
      }

      return true;
    };

    if (!checkDepth(parsed)) {
      throw new Error(`JSON exceeds maximum depth of ${options.maxDepth}`);
    }
  }

  return parsed;
}

/**
 * Path Traversal Prevention
 * Validates file paths to prevent directory traversal attacks
 */
export function sanitizeFilePath(path: string, options: {
  allowedExtensions?: string[];
  basePath?: string;
} = {}): string {
  if (typeof path !== 'string') {
    throw new Error('Path must be a string');
  }

  // Remove null bytes
  const sanitized = path.replace(/\0/g, '');

  // Check for path traversal attempts
  if (sanitized.includes('..') || sanitized.includes('~')) {
    throw new Error('Path traversal detected');
  }

  // Check for absolute paths (if base path is required)
  if (options.basePath && !sanitized.startsWith(options.basePath)) {
    throw new Error('Path must be within base directory');
  }

  // Check file extension
  if (options.allowedExtensions) {
    const ext = sanitized.split('.').pop()?.toLowerCase();
    if (!ext || !options.allowedExtensions.includes(ext)) {
      throw new Error(`File extension .${ext} not allowed`);
    }
  }

  return sanitized;
}

/**
 * Command Injection Prevention
 * Sanitizes shell command arguments
 */
export function sanitizeShellArgument(arg: string): string {
  if (typeof arg !== 'string') {
    return '';
  }

  // Remove or escape dangerous characters
  return arg
    .replace(/[;&|`$(){}[\]<>]/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'");
}

/**
 * Request Size Validation
 */
export function validateRequestSize(
  contentLength: number | null,
  maxSize: number = 10 * 1024 * 1024 // 10MB default
): void {
  if (contentLength === null) {
    throw new Error('Content-Length header missing');
  }

  if (contentLength > maxSize) {
    throw new Error(`Request size ${contentLength} exceeds maximum allowed size ${maxSize}`);
  }
}

/**
 * Header Injection Prevention
 */
export function sanitizeHeaderValue(value: string): string {
  if (typeof value !== 'string') {
    return '';
  }

  // Remove newlines and carriage returns to prevent header injection
  return value.replace(/[\r\n]/g, '');
}

/**
 * LDAP Injection Prevention
 */
export function sanitizeLDAPInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Escape LDAP special characters
  const ldapSpecialChars: Record<string, string> = {
    '\\': '\\5c',
    '*': '\\2a',
    '(': '\\28',
    ')': '\\29',
    '\0': '\\00',
  };

  return input.replace(/[\\*\(\)\0]/g, (char) => ldapSpecialChars[char] || char);
}

/**
 * NoSQL Injection Prevention
 */
export function sanitizeNoSQLInput(input: any): any {
  if (typeof input === 'string') {
    // Check for MongoDB operators
    if (input.startsWith('$')) {
      throw new Error('NoSQL operators not allowed in user input');
    }
    return input;
  }

  if (typeof input === 'object' && input !== null) {
    // Check for operator injection in objects
    for (const key of Object.keys(input)) {
      if (key.startsWith('$')) {
        throw new Error('NoSQL operators not allowed in user input');
      }
    }
  }

  return input;
}

/**
 * Comprehensive input sanitizer
 * Applies multiple sanitization techniques based on data type
 */
export function sanitizeInput(input: any, type: 'string' | 'email' | 'url' | 'number' | 'phone' | 'html' | 'json' = 'string'): any {
  switch (type) {
    case 'email':
      return sanitizeEmail(input);
    case 'url':
      return sanitizeURL(input);
    case 'number':
      return sanitizeNumber(input);
    case 'phone':
      return sanitizePhoneNumber(input);
    case 'html':
      return escapeHTML(input);
    case 'json':
      return sanitizeJSON(input);
    case 'string':
    default:
      return sanitizeString(input);
  }
}

// Export all functions
export default {
  escapeHTML,
  decodeHTML,
  stripHTML,
  sanitizeString,
  sanitizeEmail,
  sanitizeURL,
  sanitizePhoneNumber,
  sanitizeNumber,
  sanitizeObject,
  validateSQLParameter,
  sanitizeJSON,
  sanitizeFilePath,
  sanitizeShellArgument,
  validateRequestSize,
  sanitizeHeaderValue,
  sanitizeLDAPInput,
  sanitizeNoSQLInput,
  sanitizeInput,
};
