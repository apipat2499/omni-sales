/**
 * AI Chatbot Security Utilities
 * Content filtering, PII masking, and security checks
 */

import { getCache, setCache } from '../../cache/cache-manager';

/**
 * PII (Personal Identifiable Information) Masking
 */
export function maskPII(text: string): { maskedText: string; hasPII: boolean } {
  let maskedText = text;
  let hasPII = false;

  // Email masking
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  if (emailRegex.test(text)) {
    maskedText = maskedText.replace(emailRegex, '[EMAIL_REDACTED]');
    hasPII = true;
  }

  // Phone number masking (Thai format and international)
  const phoneRegex = /\b(0\d{1,2}[-\s]?\d{3,4}[-\s]?\d{4}|\+\d{1,3}[-\s]?\d{1,14})\b/g;
  if (phoneRegex.test(text)) {
    maskedText = maskedText.replace(phoneRegex, '[PHONE_REDACTED]');
    hasPII = true;
  }

  // Credit card masking
  const cardRegex = /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g;
  if (cardRegex.test(text)) {
    maskedText = maskedText.replace(cardRegex, '[CARD_REDACTED]');
    hasPII = true;
  }

  // Thai ID card masking (13 digits)
  const thaiIdRegex = /\b\d{1}[-\s]?\d{4}[-\s]?\d{5}[-\s]?\d{2}[-\s]?\d{1}\b/g;
  if (thaiIdRegex.test(text)) {
    maskedText = maskedText.replace(thaiIdRegex, '[ID_REDACTED]');
    hasPII = true;
  }

  // Passport number masking
  const passportRegex = /\b[A-Z]{1,2}\d{6,9}\b/g;
  if (passportRegex.test(text)) {
    maskedText = maskedText.replace(passportRegex, '[PASSPORT_REDACTED]');
    hasPII = true;
  }

  // Address patterns (basic - can be enhanced)
  const addressKeywords = ['street', 'road', 'avenue', 'soi', 'moo', 'ถนน', 'ซอย', 'หมู่'];
  const hasAddress = addressKeywords.some(keyword =>
    text.toLowerCase().includes(keyword.toLowerCase())
  );

  if (hasAddress) {
    // Don't mask addresses but flag as PII
    hasPII = true;
  }

  return { maskedText, hasPII };
}

/**
 * Content filtering - detect inappropriate or harmful content
 */
export function filterContent(text: string): {
  isAppropriate: boolean;
  reason?: string;
  severity: 'low' | 'medium' | 'high';
} {
  const lowerText = text.toLowerCase();

  // Profanity list (basic example - expand as needed)
  const profanityPatterns = [
    /\b(fuck|shit|damn|bastard|bitch|asshole)\w*/gi,
    /\b(เหี้ย|ควย|สัส|เชี่ย)\w*/gi, // Thai profanity examples
  ];

  // Spam patterns
  const spamPatterns = [
    /click here now/gi,
    /limited time offer/gi,
    /act now/gi,
    /\b(viagra|cialis|lottery|casino)\b/gi,
  ];

  // Threat patterns
  const threatPatterns = [
    /\b(kill|murder|bomb|attack|threat)\b/gi,
    /\b(ฆ่า|ทำร้าย|ข่มขู่)\b/gi, // Thai threats
  ];

  // Check for profanity
  for (const pattern of profanityPatterns) {
    if (pattern.test(text)) {
      return {
        isAppropriate: false,
        reason: 'Contains profanity or offensive language',
        severity: 'medium',
      };
    }
  }

  // Check for spam
  for (const pattern of spamPatterns) {
    if (pattern.test(text)) {
      return {
        isAppropriate: false,
        reason: 'Detected as spam',
        severity: 'low',
      };
    }
  }

  // Check for threats
  for (const pattern of threatPatterns) {
    if (pattern.test(text)) {
      return {
        isAppropriate: false,
        reason: 'Contains threatening language',
        severity: 'high',
      };
    }
  }

  // Check for excessive caps (possible shouting)
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (capsRatio > 0.7 && text.length > 20) {
    return {
      isAppropriate: true, // Still appropriate but flagged
      reason: 'Excessive capitalization detected',
      severity: 'low',
    };
  }

  // Check for excessive repetition
  const repetitionPattern = /(.)\1{5,}/;
  if (repetitionPattern.test(text)) {
    return {
      isAppropriate: false,
      reason: 'Excessive character repetition',
      severity: 'low',
    };
  }

  return {
    isAppropriate: true,
    severity: 'low',
  };
}

/**
 * Rate limiting with Redis/Memory cache
 */
export async function checkRateLimit(
  identifier: string,
  maxRequests: number = 20,
  windowSeconds: number = 60
): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: number;
}> {
  const key = `ratelimit:chatbot:${identifier}`;
  const now = Math.floor(Date.now() / 1000);

  try {
    // Try to get from cache
    const cached = await getCache(key);

    if (cached) {
      const data = cached as { count: number; resetAt: number };

      // Check if window has expired
      if (now >= data.resetAt) {
        // Reset counter
        const resetAt = now + windowSeconds;
        await setCache(key, { count: 1, resetAt }, windowSeconds);
        return {
          allowed: true,
          remaining: maxRequests - 1,
          resetAt,
        };
      }

      // Check if limit exceeded
      if (data.count >= maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: data.resetAt,
        };
      }

      // Increment counter
      data.count++;
      await setCache(key, data, data.resetAt - now);

      return {
        allowed: true,
        remaining: maxRequests - data.count,
        resetAt: data.resetAt,
      };
    } else {
      // First request in window
      const resetAt = now + windowSeconds;
      await setCache(key, { count: 1, resetAt }, windowSeconds);

      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetAt,
      };
    }
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Fail open - allow request if there's an error
    return {
      allowed: true,
      remaining: maxRequests,
      resetAt: now + windowSeconds,
    };
  }
}

/**
 * IP-based rate limiting (stricter for public endpoints)
 */
export async function checkIPRateLimit(
  ip: string,
  maxRequests: number = 100,
  windowSeconds: number = 3600
): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: number;
}> {
  return checkRateLimit(`ip:${ip}`, maxRequests, windowSeconds);
}

/**
 * Validate message content
 */
export function validateMessage(message: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check length
  if (message.length === 0) {
    errors.push('Message cannot be empty');
  }

  if (message.length > 2000) {
    errors.push('Message too long (maximum 2000 characters)');
  }

  // Check for only whitespace
  if (message.trim().length === 0) {
    errors.push('Message cannot contain only whitespace');
  }

  // Check for excessive URLs
  const urlCount = (message.match(/https?:\/\//g) || []).length;
  if (urlCount > 3) {
    errors.push('Too many URLs in message');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize user input
 */
export function sanitizeInput(text: string): string {
  // Remove HTML tags
  let sanitized = text.replace(/<[^>]*>/g, '');

  // Remove script tags
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Check for injection attempts
 */
export function detectInjection(text: string): {
  isSafe: boolean;
  threats: string[];
} {
  const threats: string[] = [];

  // SQL injection patterns
  const sqlPatterns = [
    /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/gi,
    /UNION\s+SELECT/gi,
    /DROP\s+TABLE/gi,
    /--\s*$/,
    /;.*--/,
  ];

  for (const pattern of sqlPatterns) {
    if (pattern.test(text)) {
      threats.push('Possible SQL injection attempt');
      break;
    }
  }

  // XSS patterns
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /onerror\s*=/gi,
    /onclick\s*=/gi,
  ];

  for (const pattern of xssPatterns) {
    if (pattern.test(text)) {
      threats.push('Possible XSS attempt');
      break;
    }
  }

  // Command injection
  const cmdPatterns = [
    /;\s*(ls|cat|rm|wget|curl|bash|sh)\s/gi,
    /\|\s*(ls|cat|rm|wget|curl|bash|sh)\s/gi,
  ];

  for (const pattern of cmdPatterns) {
    if (pattern.test(text)) {
      threats.push('Possible command injection attempt');
      break;
    }
  }

  return {
    isSafe: threats.length === 0,
    threats,
  };
}

/**
 * Complete security check for message
 */
export async function performSecurityCheck(
  message: string,
  userId: string,
  ip?: string
): Promise<{
  allowed: boolean;
  sanitizedMessage: string;
  warnings: string[];
  rateLimitInfo?: any;
}> {
  const warnings: string[] = [];

  // Validate message
  const validation = validateMessage(message);
  if (!validation.valid) {
    return {
      allowed: false,
      sanitizedMessage: message,
      warnings: validation.errors,
    };
  }

  // Sanitize input
  const sanitized = sanitizeInput(message);

  // Check for injection attempts
  const injectionCheck = detectInjection(sanitized);
  if (!injectionCheck.isSafe) {
    return {
      allowed: false,
      sanitizedMessage: sanitized,
      warnings: injectionCheck.threats,
    };
  }

  // Content filtering
  const contentCheck = filterContent(sanitized);
  if (!contentCheck.isAppropriate) {
    warnings.push(contentCheck.reason || 'Inappropriate content detected');
    if (contentCheck.severity === 'high') {
      return {
        allowed: false,
        sanitizedMessage: sanitized,
        warnings,
      };
    }
  }

  // Rate limiting
  const rateLimit = await checkRateLimit(userId);
  if (!rateLimit.allowed) {
    return {
      allowed: false,
      sanitizedMessage: sanitized,
      warnings: ['Rate limit exceeded. Please try again later.'],
      rateLimitInfo: rateLimit,
    };
  }

  // IP rate limiting (if IP provided)
  if (ip) {
    const ipRateLimit = await checkIPRateLimit(ip);
    if (!ipRateLimit.allowed) {
      return {
        allowed: false,
        sanitizedMessage: sanitized,
        warnings: ['Too many requests from this IP address.'],
        rateLimitInfo: ipRateLimit,
      };
    }
  }

  return {
    allowed: true,
    sanitizedMessage: sanitized,
    warnings,
    rateLimitInfo: rateLimit,
  };
}
