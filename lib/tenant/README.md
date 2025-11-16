# Multi-Tenant Architecture

## Overview

This directory contains the multi-tenant architecture implementation for Omni-Sales, providing white-label capabilities and tenant isolation.

## Components

### 1. Tenant Manager (`tenant-manager.ts`)

Core service for tenant management and isolation.

**Features:**
- Tenant detection from subdomain/custom domain
- Tenant context management
- Database isolation with RLS
- Feature access control
- Usage limit tracking

**Usage:**
```typescript
import { tenantManager } from '@/lib/tenant/tenant-manager';

// Detect tenant from request
const tenant = await tenantManager.detectTenantFromRequest(hostname);

// Set tenant context
tenantManager.setTenant(tenant);

// Check feature access
if (tenantManager.hasFeature('whiteLabel')) {
  // Feature is available
}
```

### 2. Branding Service (`branding-service.ts`)

Manages white-label branding and customization.

**Features:**
- Logo and favicon upload
- Custom color schemes
- Navigation and page title customization
- Email template branding
- CSS variable generation

**Usage:**
```typescript
import { brandingService } from '@/lib/tenant/branding-service';

// Upload logo
await brandingService.uploadLogo(tenantId, file);

// Update colors
await brandingService.updateColors(tenantId, {
  primaryColor: '#3b82f6',
  accentColor: '#8b5cf6',
});

// Generate CSS
const css = brandingService.generateCSSVariables(branding);
```

### 3. Billing Service (`billing-service.ts`)

Handles per-tenant subscriptions and billing via Stripe.

**Features:**
- Stripe customer creation
- Subscription management
- Usage-based billing
- Webhook handling
- Invoice generation

**Usage:**
```typescript
import { tenantBillingService } from '@/lib/tenant/billing-service';

// Create subscription
await tenantBillingService.createSubscription(tenantId, 'professional');

// Update plan
await tenantBillingService.updateSubscription(tenantId, 'enterprise');

// Track usage
const usage = await tenantBillingService.trackUsage(tenantId);
```

## Tenant Isolation Strategies

### 1. Shared Database with RLS (Default)

All tenants share the same database, with Row-Level Security (RLS) policies enforcing data isolation.

**Pros:**
- Cost-effective
- Easy to manage
- Efficient resource usage

**Cons:**
- Requires careful RLS policy management
- Potential for data leaks if misconfigured

### 2. Database Per Tenant

Each tenant gets a dedicated database.

**Pros:**
- Strong data isolation
- Easy to backup/restore per tenant
- Can scale independently

**Cons:**
- Higher cost
- More complex management
- Schema updates require coordination

### 3. Schema Per Tenant

Each tenant gets a dedicated schema within a shared database.

**Pros:**
- Good isolation
- Moderate cost
- Easier than separate databases

**Cons:**
- Connection pool management
- Schema proliferation

## Onboarding Flow

1. **Account Setup** - Company info, subdomain selection
2. **Plan Selection** - Choose subscription tier
3. **Branding** - Upload logo, set colors
4. **Settings** - Configure timezone, currency, language
5. **Complete** - Tenant created, redirect to dashboard

## API Routes

### Tenant Management

- `POST /api/tenants` - Create new tenant
- `GET /api/tenants` - List user's tenants
- `GET /api/tenants/:id` - Get tenant details
- `PUT /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Delete tenant (soft delete)

### Branding

- `GET /api/tenants/:id/branding` - Get branding
- `PUT /api/tenants/:id/branding` - Update branding

### Subscription

- `GET /api/tenants/:id/subscription` - Get subscription details
- `PUT /api/tenants/:id/subscription` - Update subscription plan

### Custom Domain

- `POST /api/tenants/:id/custom-domain` - Setup custom domain
- `PUT /api/tenants/:id/custom-domain` - Verify custom domain

### Billing

- `POST /api/billing/webhook` - Stripe webhook handler

## Middleware

The tenant middleware runs on every request to:

1. Detect tenant from hostname
2. Load tenant configuration
3. Set tenant context
4. Apply RLS policies
5. Check subscription status
6. Validate trial/subscription expiration

## Database Schema

### Tables

- `tenants` - Tenant configuration and settings
- `tenant_users` - Users belonging to tenants
- `tenant_invitations` - Pending user invitations
- `tenant_billing_history` - Billing and invoice history
- `tenant_activity_log` - Activity and audit log

### RLS Policies

All tenant data is isolated using RLS policies that check:
- User belongs to tenant (`tenant_users` table)
- User has appropriate role
- Tenant is active

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Testing

```bash
# Run migrations
cd supabase
supabase migration up

# Seed test data
psql $DATABASE_URL -f seed-tenants.sql

# Test tenant isolation
npm test tenant-manager.test.ts
```

## Security Considerations

1. **RLS Policies** - Always verify RLS policies are correct
2. **Feature Gates** - Check plan features before allowing access
3. **Usage Limits** - Enforce limits on users, storage, orders
4. **Subdomain Validation** - Prevent subdomain hijacking
5. **Custom Domain Verification** - Verify DNS records before activation

## Performance

- **Caching** - Tenant config is cached per request
- **Indexes** - Database indexes on tenant_id columns
- **Connection Pooling** - Efficient database connections
- **CDN** - Static assets served via CDN

## Future Enhancements

- [ ] Multi-region support
- [ ] Tenant analytics dashboard
- [ ] Advanced RBAC per tenant
- [ ] Tenant data export/import
- [ ] Tenant cloning
- [ ] Custom subdomain SSL certificates
- [ ] Geographic data residency
