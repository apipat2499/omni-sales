# Security Guidelines

## Overview

This document outlines the security measures implemented in the Omni Sales application and provides guidelines for secure deployment and operation.

## Table of Contents

1. [Security Features](#security-features)
2. [Environment Configuration](#environment-configuration)
3. [Deployment Checklist](#deployment-checklist)
4. [Best Practices](#best-practices)
5. [Security Layers](#security-layers)
6. [Incident Response](#incident-response)
7. [Security Testing](#security-testing)

---

## Security Features

### 1. CORS Protection

**Location:** `lib/middleware/cors.ts`

- Implements strict Cross-Origin Resource Sharing policies
- Whitelist-based origin validation
- Supports credential requests
- Pre-flight request handling
- Configurable per environment

**Configuration:**
```typescript
// Environment variables
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 2. Security Headers

**Location:** `lib/middleware/security-headers.ts`

Implements comprehensive HTTP security headers:

- **Content-Security-Policy (CSP)**: Prevents XSS attacks
- **Strict-Transport-Security (HSTS)**: Enforces HTTPS
- **X-Content-Type-Options**: Prevents MIME sniffing
- **X-Frame-Options**: Prevents clickjacking
- **X-XSS-Protection**: Additional XSS protection
- **Referrer-Policy**: Controls referrer information
- **Permissions-Policy**: Restricts browser features

### 3. Input Validation & Sanitization

**Location:** `lib/validation/sanitizer.ts`

Provides comprehensive input sanitization:

- HTML entity encoding
- SQL injection prevention
- XSS prevention
- Path traversal prevention
- NoSQL injection prevention
- Request size limits
- JSON validation

**Usage:**
```typescript
import { sanitizeInput, escapeHTML, validateSQLParameter } from '@/lib/validation/sanitizer';

// Sanitize user input
const safe = sanitizeInput(userInput, 'email');
const html = escapeHTML(userContent);
```

### 4. API Security

**Location:** `lib/security/api-security.ts`

Implements multiple API security measures:

- **CSRF Protection**: Token-based CSRF prevention
- **Request Signing**: HMAC-based request authentication
- **API Key Management**: Secure API key generation and validation
- **Request ID Tracking**: Audit trail support
- **IP Filtering**: Whitelist/blacklist support
- **Audit Logging**: Comprehensive request logging

### 5. Authentication Hardening

**Location:** `lib/security/auth-hardening.ts`

Enhanced authentication security:

- **Session Management**: Configurable timeouts and rotation
- **Refresh Token Rotation**: Prevents token reuse attacks
- **IP Address Tracking**: Detects suspicious location changes
- **Suspicious Activity Detection**: Brute force protection
- **Password Policy**: Enforces strong passwords
- **Secure Cookies**: HttpOnly, Secure, SameSite attributes

### 6. Data Protection

**Location:** `lib/security/data-protection.ts`

Protects sensitive data:

- **Field-Level Encryption**: AES-256-GCM encryption
- **Data Masking**: Email, phone, credit card masking
- **PII Detection**: Automatic PII identification
- **Log Sanitization**: Removes sensitive data from logs
- **Secure Comparison**: Timing-safe comparisons

### 7. Row-Level Security (RLS)

**Location:** `supabase/migrations/add_security_hardening_rls.sql`

Database-level security:

- User data isolation
- Role-based access control
- Audit triggers for sensitive operations
- Team/organization isolation

---

## Environment Configuration

### Required Environment Variables (Production)

```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Encryption (CRITICAL - Set to strong random value)
ENCRYPTION_SECRET=<generate-strong-secret-32-chars>

# Security
FORCE_HTTPS=true
COOKIE_SAME_SITE=strict

# Optional
REQUEST_SIGNING_SECRET=<generate-strong-secret>
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Generate Secrets

Use these commands to generate secure secrets:

```bash
# Generate encryption secret (32 bytes)
openssl rand -hex 32

# Generate request signing secret
openssl rand -base64 32
```

### Optional Security Variables

```bash
# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_STORE=redis

# Password Policy
PASSWORD_MIN_LENGTH=12
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBERS=true
PASSWORD_REQUIRE_SPECIAL=true

# Session Management
SESSION_TIMEOUT_MINUTES=30
SESSION_ABSOLUTE_TIMEOUT_HOURS=24

# IP Tracking
IP_TRACKING_ENABLED=true
IP_REAUTH_ON_CHANGE=false
IP_HASH_ENABLED=true

# Suspicious Activity Detection
SUSPICIOUS_ACTIVITY_DETECTION=true
MAX_FAILED_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15

# Data Protection
MASK_PII_IN_LOGS=true
ENCRYPT_PII_AT_REST=true
PII_FIELDS=email,phone,ssn,creditCard,address

# API Security
REQUEST_SIGNING_ENABLED=false
API_KEY_AUTH_ENABLED=false
REQUEST_ID_TRACKING=true
AUDIT_LOGGING=true

# Logging
ENABLE_SECURITY_LOGGING=true
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All environment variables are set
- [ ] `ENCRYPTION_SECRET` is set to a strong random value
- [ ] `FORCE_HTTPS=true` in production
- [ ] Database RLS policies are applied
- [ ] SSL/TLS certificate is configured
- [ ] CORS origins are configured correctly
- [ ] Rate limiting is enabled
- [ ] Security headers are tested
- [ ] CSRF protection is enabled

### Database Security

- [ ] Run RLS migration: `add_security_hardening_rls.sql`
- [ ] Verify RLS policies are active
- [ ] Audit triggers are configured
- [ ] Database backups are encrypted
- [ ] Database access is restricted by IP (if possible)

### Infrastructure

- [ ] WAF (Web Application Firewall) is configured
- [ ] DDoS protection is enabled
- [ ] CDN is configured with security headers
- [ ] Monitoring and alerting are set up
- [ ] Log aggregation is configured
- [ ] Intrusion detection is active

### Application

- [ ] Security headers are verified
- [ ] CSP policy is tested
- [ ] XSS protection is verified
- [ ] CSRF protection is tested
- [ ] Authentication flows are secure
- [ ] API endpoints are protected
- [ ] Input validation is comprehensive
- [ ] Error messages don't leak sensitive info

### Post-Deployment

- [ ] Security scan is performed
- [ ] Penetration testing is completed
- [ ] Vulnerability assessment is done
- [ ] Security monitoring is active
- [ ] Incident response plan is ready

---

## Best Practices

### 1. Secure Coding

- **Never trust user input**: Always validate and sanitize
- **Use parameterized queries**: Prevent SQL injection
- **Escape output**: Prevent XSS
- **Use secure functions**: Leverage built-in sanitization
- **Avoid eval()**: Never use eval with user input
- **Handle errors securely**: Don't expose stack traces

### 2. Authentication

- **Use strong passwords**: Enforce password policy
- **Enable MFA**: For sensitive operations
- **Implement session timeout**: 30 minutes idle
- **Rotate tokens**: Refresh token rotation
- **Hash passwords**: Use bcrypt/scrypt/argon2
- **Lock accounts**: After failed attempts

### 3. Data Protection

- **Encrypt PII**: Use field-level encryption
- **Mask sensitive data**: In logs and UI
- **Use HTTPS**: Always in production
- **Secure cookies**: HttpOnly, Secure, SameSite
- **Minimize data**: Don't collect unnecessary PII
- **Data retention**: Delete old data

### 4. API Security

- **Rate limiting**: Prevent abuse
- **Request signing**: For sensitive operations
- **CSRF tokens**: For state-changing operations
- **API versioning**: Plan for changes
- **Input validation**: Validate all inputs
- **Output encoding**: Prevent injection

### 5. Monitoring

- **Log security events**: Track authentication, authorization
- **Monitor failed attempts**: Detect brute force
- **Alert on anomalies**: Unusual patterns
- **Audit sensitive operations**: Track changes
- **Review logs regularly**: Identify threats
- **Incident response**: Have a plan

---

## Security Layers

### Defense in Depth

The application implements multiple security layers:

1. **Network Layer**
   - HTTPS/TLS encryption
   - DDoS protection
   - IP filtering

2. **Application Layer**
   - CORS protection
   - Security headers
   - CSRF protection
   - Input validation
   - Output encoding

3. **Authentication Layer**
   - Session management
   - Token rotation
   - MFA support
   - IP tracking
   - Suspicious activity detection

4. **Authorization Layer**
   - Row-level security (RLS)
   - Role-based access control
   - Resource ownership checks

5. **Data Layer**
   - Encryption at rest
   - Encryption in transit
   - Data masking
   - Audit logging

---

## Incident Response

### Security Incident Workflow

1. **Detection**
   - Monitor security alerts
   - Review audit logs
   - Check error rates

2. **Containment**
   - Isolate affected systems
   - Revoke compromised credentials
   - Block malicious IPs

3. **Investigation**
   - Analyze logs
   - Identify attack vector
   - Assess damage

4. **Remediation**
   - Patch vulnerabilities
   - Update security rules
   - Reset credentials

5. **Recovery**
   - Restore from backups
   - Verify system integrity
   - Resume normal operations

6. **Post-Incident**
   - Document incident
   - Update procedures
   - Communicate to stakeholders

### Contacts

- **Security Team**: security@your-domain.com
- **Incident Response**: incident@your-domain.com
- **On-Call**: [Your on-call system]

---

## Security Testing

### Regular Testing

- **Weekly**: Automated security scans
- **Monthly**: Dependency vulnerability checks
- **Quarterly**: Manual penetration testing
- **Annually**: Comprehensive security audit

### Testing Tools

- **OWASP ZAP**: Web application security testing
- **Burp Suite**: API security testing
- **npm audit**: Dependency vulnerability scanning
- **Snyk**: Continuous security monitoring

### Test Cases

1. **Authentication**
   - Brute force protection
   - Session fixation
   - Token theft
   - Password reset flow

2. **Authorization**
   - Horizontal privilege escalation
   - Vertical privilege escalation
   - IDOR (Insecure Direct Object Reference)

3. **Input Validation**
   - SQL injection
   - XSS (reflected, stored, DOM-based)
   - LDAP injection
   - Command injection

4. **Business Logic**
   - Race conditions
   - Price manipulation
   - Workflow bypass

5. **Configuration**
   - Security headers
   - SSL/TLS configuration
   - Error handling
   - Information disclosure

---

## Reporting Security Issues

If you discover a security vulnerability, please email:

**security@your-domain.com**

Please include:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

**Do not disclose publicly until we've had a chance to address it.**

---

## Compliance

This application implements security controls aligned with:

- **OWASP Top 10**: Web application security risks
- **CWE Top 25**: Most dangerous software weaknesses
- **GDPR**: Data protection and privacy (EU)
- **PCI DSS**: Payment card data security
- **SOC 2**: Security and availability

---

## Security Updates

Stay informed about security updates:

1. Subscribe to security mailing list
2. Monitor GitHub security advisories
3. Enable Dependabot alerts
4. Review security bulletins regularly

---

## Resources

### External Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/deploying/production-checklist#security)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)

### Internal Documentation

- `/lib/middleware/cors.ts` - CORS configuration
- `/lib/middleware/security-headers.ts` - Security headers
- `/lib/validation/sanitizer.ts` - Input sanitization
- `/lib/security/api-security.ts` - API security
- `/lib/security/auth-hardening.ts` - Authentication
- `/lib/security/data-protection.ts` - Data protection
- `/lib/security/security-config.ts` - Security configuration

---

**Last Updated:** 2025-11-16

**Version:** 1.0.0
