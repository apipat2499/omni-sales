# Production Security Checklist

## Pre-Deployment Security Checklist

### Environment Configuration

- [ ] `ENCRYPTION_SECRET` set to strong random value (32+ chars)
- [ ] `REQUEST_SIGNING_SECRET` configured
- [ ] `NEXT_PUBLIC_SUPABASE_URL` configured
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configured
- [ ] `NEXT_PUBLIC_APP_URL` set to production domain
- [ ] `FORCE_HTTPS=true` in production
- [ ] `NODE_ENV=production`
- [ ] All secrets are stored securely (not in code)

### SSL/TLS Configuration

- [ ] SSL certificate installed and valid
- [ ] Certificate auto-renewal configured
- [ ] TLS 1.2+ only (no TLS 1.0/1.1)
- [ ] Strong cipher suites configured
- [ ] HSTS header enabled (Strict-Transport-Security)
- [ ] Certificate Transparency monitoring

### CORS Configuration

- [ ] Allowed origins whitelist configured
- [ ] Credentials support enabled only for trusted origins
- [ ] Wildcard origins not used in production
- [ ] CORS tested with actual client applications

### Security Headers

- [ ] Content-Security-Policy (CSP) configured
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] X-XSS-Protection enabled
- [ ] Referrer-Policy configured
- [ ] Permissions-Policy configured
- [ ] No sensitive data in headers

### Authentication & Authorization

- [ ] Strong password policy enforced (12+ chars, complexity)
- [ ] Password hashing uses bcrypt/scrypt/argon2
- [ ] Session timeout configured (30 minutes idle)
- [ ] Absolute session timeout (24 hours max)
- [ ] Token rotation implemented
- [ ] MFA available for sensitive operations
- [ ] Account lockout after failed attempts (5 attempts)
- [ ] Lockout duration configured (15 minutes)
- [ ] Password reset flow secure
- [ ] Email verification required

### Database Security

- [ ] RLS (Row Level Security) enabled on all tables
- [ ] User isolation policies applied
- [ ] Audit triggers configured for sensitive tables
- [ ] Database connection uses SSL/TLS
- [ ] Database credentials rotated regularly
- [ ] Database backups encrypted
- [ ] Database access restricted by IP
- [ ] Prepared statements used (no SQL injection)

### API Security

- [ ] Rate limiting enabled
- [ ] Rate limits appropriate per endpoint
- [ ] CSRF protection enabled
- [ ] Request signing implemented (if needed)
- [ ] API key authentication configured (if applicable)
- [ ] Request ID tracking enabled
- [ ] Audit logging enabled
- [ ] API versioning in place
- [ ] Error messages don't leak sensitive info
- [ ] No debug endpoints in production

### Input Validation

- [ ] All user input validated
- [ ] Input sanitization implemented
- [ ] File upload restrictions enforced
- [ ] File size limits configured
- [ ] File type validation implemented
- [ ] Path traversal prevention
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] NoSQL injection prevention
- [ ] Command injection prevention

### Data Protection

- [ ] PII fields encrypted at rest
- [ ] Sensitive data masked in logs
- [ ] Data retention policy implemented
- [ ] PII deletion mechanism in place
- [ ] Secure data disposal procedures
- [ ] Third-party data sharing reviewed
- [ ] GDPR compliance (if applicable)
- [ ] Data minimization practiced

### Error Handling

- [ ] Generic error messages for users
- [ ] Detailed errors logged server-side only
- [ ] No stack traces exposed
- [ ] 404 pages don't leak info
- [ ] Error monitoring configured
- [ ] Alert on critical errors

### Logging & Monitoring

- [ ] Security events logged
- [ ] Failed login attempts tracked
- [ ] Suspicious activity detection enabled
- [ ] Logs include request IDs
- [ ] Logs sanitized (no PII)
- [ ] Log retention policy configured
- [ ] Real-time alerting configured
- [ ] Log analysis tools integrated
- [ ] Audit trail for sensitive operations

### Third-Party Dependencies

- [ ] All dependencies up to date
- [ ] Vulnerability scanning enabled
- [ ] Dependabot alerts enabled
- [ ] Security advisories monitored
- [ ] Minimal dependencies used
- [ ] License compliance verified
- [ ] Supply chain security reviewed

### Infrastructure

- [ ] Firewall configured
- [ ] DDoS protection enabled
- [ ] WAF (Web Application Firewall) configured
- [ ] Intrusion detection enabled
- [ ] Security groups restrictive
- [ ] Least privilege principle applied
- [ ] Network segmentation implemented
- [ ] VPN for admin access

### Deployment

- [ ] Secrets not in Git repository
- [ ] `.env` files in `.gitignore`
- [ ] Separate environments (dev/staging/prod)
- [ ] Prod database isolated
- [ ] Deployment uses CI/CD pipeline
- [ ] Automated security tests in pipeline
- [ ] Code review before deployment
- [ ] Rollback plan in place

### Testing

- [ ] Security testing performed
- [ ] Penetration testing completed
- [ ] OWASP Top 10 tested
- [ ] Authentication flows tested
- [ ] Authorization tested
- [ ] Input validation tested
- [ ] XSS testing done
- [ ] SQL injection testing done
- [ ] CSRF protection tested
- [ ] Rate limiting tested

### Documentation

- [ ] SECURITY.md updated
- [ ] Security procedures documented
- [ ] Incident response plan documented
- [ ] Security contacts listed
- [ ] Admin procedures documented
- [ ] Disaster recovery plan ready

### Compliance

- [ ] Privacy policy updated
- [ ] Terms of service reviewed
- [ ] Cookie consent implemented (if needed)
- [ ] Data processing agreement signed
- [ ] Compliance audit completed
- [ ] Security certifications obtained (if needed)

### Post-Deployment

- [ ] Security headers verified in production
- [ ] SSL/TLS configuration tested
- [ ] CORS functionality verified
- [ ] Authentication flows tested
- [ ] Rate limiting verified
- [ ] Monitoring dashboards checked
- [ ] Alert notifications tested
- [ ] Backup and restore tested
- [ ] Incident response plan tested

---

## Security Validation Commands

### Test Security Headers

```bash
# Test security headers
curl -I https://your-domain.com

# Expected headers:
# - Strict-Transport-Security
# - X-Content-Type-Options: nosniff
# - X-Frame-Options: DENY
# - X-XSS-Protection: 1; mode=block
# - Referrer-Policy
# - Content-Security-Policy
```

### Test SSL/TLS

```bash
# Test SSL configuration
openssl s_client -connect your-domain.com:443

# Or use online tools:
# - https://www.ssllabs.com/ssltest/
# - https://securityheaders.com/
```

### Test Rate Limiting

```bash
# Send multiple requests quickly
for i in {1..20}; do curl https://your-domain.com/api/endpoint; done

# Should return 429 after exceeding limit
```

### Check Dependencies

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Check outdated packages
npm outdated
```

---

## Security Score

**Target Score: 100/100**

Current Implementation:

- ✅ CORS Protection
- ✅ Security Headers (CSP, HSTS, etc.)
- ✅ Input Validation & Sanitization
- ✅ RLS Policies & User Isolation
- ✅ CSRF Protection
- ✅ Rate Limiting
- ✅ Authentication Hardening
- ✅ Data Protection & Encryption
- ✅ Audit Logging
- ✅ Request ID Tracking
- ✅ Session Management
- ✅ Password Policy
- ✅ IP Tracking
- ✅ Suspicious Activity Detection
- ✅ API Security

---

## Security Priorities

### Critical (P0)

1. Set `ENCRYPTION_SECRET` to strong random value
2. Enable HTTPS/SSL in production
3. Configure database RLS policies
4. Enable rate limiting
5. Set up monitoring and alerting

### High (P1)

6. Configure CORS whitelist
7. Enable CSRF protection
8. Set up audit logging
9. Configure session timeout
10. Enable MFA for admin accounts

### Medium (P2)

11. Implement request signing
12. Set up IP tracking
13. Configure suspicious activity detection
14. Enable PII masking in logs
15. Set up data retention policies

### Low (P3)

16. Fine-tune CSP policy
17. Optimize rate limits
18. Set up advanced monitoring
19. Configure anomaly detection
20. Regular security audits

---

**Last Updated:** 2025-11-16
