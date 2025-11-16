/**
 * Security Configuration Manager
 * Central configuration for all security settings with environment validation
 */

export interface SecurityConfig {
  // Environment
  environment: 'development' | 'production' | 'test';
  isProduction: boolean;
  isDevelopment: boolean;

  // SSL/TLS
  ssl: {
    enabled: boolean;
    enforceHTTPS: boolean;
    hstsEnabled: boolean;
    hstsMaxAge: number;
  };

  // CORS
  cors: {
    enabled: boolean;
    allowedOrigins: string[];
    allowCredentials: boolean;
  };

  // CSRF
  csrf: {
    enabled: boolean;
    cookieName: string;
    headerName: string;
  };

  // Rate Limiting
  rateLimit: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
    store: 'memory' | 'redis';
  };

  // Session
  session: {
    timeout: number;
    absoluteTimeout: number;
    slidingExpiration: boolean;
    requireFreshLogin: boolean;
    freshLoginTimeout: number;
  };

  // Password Policy
  password: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    preventCommonPasswords: boolean;
    maxAge?: number;
    preventReuse: number;
  };

  // Encryption
  encryption: {
    algorithm: string;
    secretConfigured: boolean;
  };

  // Cookies
  cookies: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    maxAge: number;
  };

  // API Security
  api: {
    requestSigningEnabled: boolean;
    apiKeyAuthEnabled: boolean;
    requestIdTracking: boolean;
    auditLogging: boolean;
  };

  // IP Tracking
  ipTracking: {
    enabled: boolean;
    requireReauthOnChange: boolean;
    hashIP: boolean;
  };

  // Suspicious Activity Detection
  suspiciousActivity: {
    enabled: boolean;
    maxFailedAttempts: number;
    lockoutDuration: number;
    requireMFAOnSuspicious: boolean;
  };

  // Data Protection
  dataProtection: {
    maskPIIInLogs: boolean;
    encryptPIIAtRest: boolean;
    piiFields: string[];
  };
}

/**
 * Validate required environment variables
 */
function validateEnvironment(): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required in production
  if (process.env.NODE_ENV === 'production') {
    // Database
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      errors.push('NEXT_PUBLIC_SUPABASE_URL is required in production');
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required in production');
    }

    // Encryption
    if (!process.env.ENCRYPTION_SECRET || process.env.ENCRYPTION_SECRET === 'change-me-in-production') {
      errors.push('ENCRYPTION_SECRET must be set to a secure value in production');
    }

    // Request signing
    if (!process.env.REQUEST_SIGNING_SECRET || process.env.REQUEST_SIGNING_SECRET === 'change-me-in-production') {
      warnings.push('REQUEST_SIGNING_SECRET should be set for enhanced API security');
    }

    // App URL
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      warnings.push('NEXT_PUBLIC_APP_URL should be set for proper CORS configuration');
    }

    // SSL
    if (!process.env.FORCE_HTTPS) {
      warnings.push('FORCE_HTTPS should be enabled in production');
    }
  }

  // Check for insecure defaults
  const insecureSecrets = ['secret', 'password', 'changeme', 'default'];
  const encryptionSecret = process.env.ENCRYPTION_SECRET?.toLowerCase() || '';

  if (insecureSecrets.some(s => encryptionSecret.includes(s))) {
    errors.push('ENCRYPTION_SECRET appears to use an insecure default value');
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Get security configuration
 */
export function getSecurityConfig(): SecurityConfig {
  const env = (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test';
  const isProduction = env === 'production';
  const isDevelopment = env === 'development';

  return {
    // Environment
    environment: env,
    isProduction,
    isDevelopment,

    // SSL/TLS
    ssl: {
      enabled: isProduction,
      enforceHTTPS: process.env.FORCE_HTTPS === 'true' || isProduction,
      hstsEnabled: isProduction,
      hstsMaxAge: 31536000, // 1 year
    },

    // CORS
    cors: {
      enabled: true,
      allowedOrigins: [
        process.env.NEXT_PUBLIC_APP_URL || 'https://omni-sales.com',
        process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : '',
      ].filter(Boolean),
      allowCredentials: true,
    },

    // CSRF
    csrf: {
      enabled: true,
      cookieName: 'csrf_token',
      headerName: 'X-CSRF-Token',
    },

    // Rate Limiting
    rateLimit: {
      enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
      store: (process.env.RATE_LIMIT_STORE as 'memory' | 'redis') || 'memory',
    },

    // Session
    session: {
      timeout: 30 * 60 * 1000, // 30 minutes
      absoluteTimeout: 24 * 60 * 60 * 1000, // 24 hours
      slidingExpiration: true,
      requireFreshLogin: true,
      freshLoginTimeout: 5 * 60 * 1000, // 5 minutes
    },

    // Password Policy
    password: {
      minLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '12'),
      requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
      requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false',
      requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS !== 'false',
      requireSpecialChars: process.env.PASSWORD_REQUIRE_SPECIAL !== 'false',
      preventCommonPasswords: true,
      maxAge: process.env.PASSWORD_MAX_AGE_DAYS
        ? parseInt(process.env.PASSWORD_MAX_AGE_DAYS) * 24 * 60 * 60 * 1000
        : undefined,
      preventReuse: parseInt(process.env.PASSWORD_PREVENT_REUSE || '5'),
    },

    // Encryption
    encryption: {
      algorithm: 'aes-256-gcm',
      secretConfigured: !!(
        process.env.ENCRYPTION_SECRET &&
        process.env.ENCRYPTION_SECRET !== 'change-me-in-production'
      ),
    },

    // Cookies
    cookies: {
      httpOnly: true,
      secure: isProduction,
      sameSite: (process.env.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none') || 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
    },

    // API Security
    api: {
      requestSigningEnabled: process.env.REQUEST_SIGNING_ENABLED === 'true',
      apiKeyAuthEnabled: process.env.API_KEY_AUTH_ENABLED === 'true',
      requestIdTracking: process.env.REQUEST_ID_TRACKING !== 'false',
      auditLogging: process.env.AUDIT_LOGGING !== 'false',
    },

    // IP Tracking
    ipTracking: {
      enabled: process.env.IP_TRACKING_ENABLED !== 'false',
      requireReauthOnChange: process.env.IP_REAUTH_ON_CHANGE === 'true',
      hashIP: process.env.IP_HASH_ENABLED !== 'false',
    },

    // Suspicious Activity Detection
    suspiciousActivity: {
      enabled: process.env.SUSPICIOUS_ACTIVITY_DETECTION !== 'false',
      maxFailedAttempts: parseInt(process.env.MAX_FAILED_ATTEMPTS || '5'),
      lockoutDuration: parseInt(process.env.LOCKOUT_DURATION_MINUTES || '15') * 60 * 1000,
      requireMFAOnSuspicious: process.env.REQUIRE_MFA_ON_SUSPICIOUS === 'true',
    },

    // Data Protection
    dataProtection: {
      maskPIIInLogs: process.env.MASK_PII_IN_LOGS !== 'false',
      encryptPIIAtRest: process.env.ENCRYPT_PII_AT_REST === 'true',
      piiFields: (process.env.PII_FIELDS || 'email,phone,ssn,creditCard,address').split(','),
    },
  };
}

/**
 * Initialize and validate security configuration
 */
export function initializeSecurity(): {
  config: SecurityConfig;
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
} {
  const validation = validateEnvironment();
  const config = getSecurityConfig();

  // Log validation results
  if (validation.errors.length > 0) {
    console.error('[Security Config] Validation errors:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
  }

  if (validation.warnings.length > 0) {
    console.warn('[Security Config] Warnings:');
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  if (validation.valid) {
    console.log('[Security Config] Configuration validated successfully');
  } else {
    console.error('[Security Config] Configuration validation failed');
    if (config.isProduction) {
      throw new Error('Security configuration validation failed in production');
    }
  }

  // Log security status
  console.log('[Security Config] Status:', {
    environment: config.environment,
    ssl: config.ssl.enabled,
    cors: config.cors.enabled,
    csrf: config.csrf.enabled,
    rateLimit: config.rateLimit.enabled,
    encryption: config.encryption.secretConfigured,
  });

  return { config, validation };
}

/**
 * Security health check
 */
export function securityHealthCheck(): {
  healthy: boolean;
  checks: Record<string, { status: 'pass' | 'warn' | 'fail'; message?: string }>;
} {
  const config = getSecurityConfig();
  const checks: Record<string, { status: 'pass' | 'warn' | 'fail'; message?: string }> = {};

  // Check SSL in production
  checks.ssl = config.isProduction && config.ssl.enabled
    ? { status: 'pass' }
    : config.isProduction
    ? { status: 'fail', message: 'SSL should be enabled in production' }
    : { status: 'warn', message: 'SSL not required in development' };

  // Check encryption secret
  checks.encryption = config.encryption.secretConfigured
    ? { status: 'pass' }
    : { status: 'fail', message: 'Encryption secret not configured' };

  // Check CSRF protection
  checks.csrf = config.csrf.enabled
    ? { status: 'pass' }
    : { status: 'warn', message: 'CSRF protection disabled' };

  // Check rate limiting
  checks.rateLimit = config.rateLimit.enabled
    ? { status: 'pass' }
    : { status: 'warn', message: 'Rate limiting disabled' };

  // Check secure cookies
  checks.cookies = config.cookies.secure || !config.isProduction
    ? { status: 'pass' }
    : { status: 'fail', message: 'Secure cookies should be enabled in production' };

  // Check password policy
  checks.passwordPolicy = config.password.minLength >= 12 &&
    config.password.requireUppercase &&
    config.password.requireNumbers
    ? { status: 'pass' }
    : { status: 'warn', message: 'Weak password policy' };

  // Overall health
  const failures = Object.values(checks).filter(c => c.status === 'fail').length;
  const healthy = failures === 0;

  return { healthy, checks };
}

/**
 * Get security headers for response
 */
export function getSecurityHeaders(): Record<string, string> {
  const config = getSecurityConfig();
  const headers: Record<string, string> = {};

  if (config.ssl.hstsEnabled) {
    headers['Strict-Transport-Security'] = `max-age=${config.ssl.hstsMaxAge}; includeSubDomains; preload`;
  }

  headers['X-Content-Type-Options'] = 'nosniff';
  headers['X-Frame-Options'] = 'DENY';
  headers['X-XSS-Protection'] = '1; mode=block';
  headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';

  return headers;
}

// Export singleton instance
let securityConfigInstance: ReturnType<typeof initializeSecurity> | null = null;

export function getSecurityConfigInstance(): ReturnType<typeof initializeSecurity> {
  if (!securityConfigInstance) {
    securityConfigInstance = initializeSecurity();
  }
  return securityConfigInstance;
}

// Export all
export default {
  getSecurityConfig,
  initializeSecurity,
  securityHealthCheck,
  getSecurityHeaders,
  getSecurityConfigInstance,
};
