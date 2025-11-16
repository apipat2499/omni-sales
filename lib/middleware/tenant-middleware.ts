import { NextRequest, NextResponse } from 'next/server';
import { tenantManager } from '../tenant/tenant-manager';

/**
 * Tenant Detection Middleware
 * Detects tenant from subdomain or custom domain and sets tenant context
 */
export async function tenantMiddleware(req: NextRequest): Promise<NextResponse> {
  const hostname = req.headers.get('host') || '';

  // Skip tenant detection for certain paths
  const skipPaths = [
    '/api/health',
    '/api/status',
    '/onboard',
    '/_next',
    '/static',
  ];

  if (skipPaths.some(path => req.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Detect tenant from hostname
  const tenant = await tenantManager.detectTenantFromRequest(hostname);

  if (!tenant) {
    // No tenant found - redirect to onboarding or show error
    if (!req.nextUrl.pathname.startsWith('/onboard')) {
      const url = req.nextUrl.clone();
      url.pathname = '/onboard';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Check if tenant is active
  if (tenant.status !== 'active') {
    return new NextResponse(
      JSON.stringify({
        error: 'Tenant is suspended or inactive',
        status: tenant.status,
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // Check subscription status
  if (tenant.subscriptionStatus === 'cancelled' || tenant.subscriptionStatus === 'suspended') {
    // Redirect to billing page
    if (!req.nextUrl.pathname.startsWith('/billing')) {
      const url = req.nextUrl.clone();
      url.pathname = '/billing';
      return NextResponse.redirect(url);
    }
  }

  // Check trial expiration
  if (tenant.subscriptionStatus === 'trial' && tenant.trialEndsAt) {
    if (new Date(tenant.trialEndsAt) < new Date()) {
      // Trial expired
      if (!req.nextUrl.pathname.startsWith('/billing')) {
        const url = req.nextUrl.clone();
        url.pathname = '/billing';
        url.searchParams.set('reason', 'trial_expired');
        return NextResponse.redirect(url);
      }
    }
  }

  // Set tenant context
  tenantManager.setTenant(tenant);

  // Create response with tenant headers
  const response = NextResponse.next();

  // Add tenant information to headers
  response.headers.set('X-Tenant-ID', tenant.id);
  response.headers.set('X-Tenant-Subdomain', tenant.subdomain);
  response.headers.set('X-Tenant-Plan', tenant.subscriptionPlan);

  // Add custom branding CSS variables
  if (tenant.branding) {
    response.headers.set('X-Tenant-Primary-Color', tenant.branding.primaryColor);
    response.headers.set('X-Tenant-Accent-Color', tenant.branding.accentColor);
  }

  return response;
}

/**
 * Check if user has access to tenant
 */
export async function checkTenantAccess(
  userId: string,
  tenantId: string
): Promise<boolean> {
  // TODO: Implement check against tenant_users table
  return true;
}

/**
 * Get tenant from request headers
 */
export function getTenantFromHeaders(req: NextRequest): {
  tenantId: string | null;
  subdomain: string | null;
  plan: string | null;
} {
  return {
    tenantId: req.headers.get('X-Tenant-ID'),
    subdomain: req.headers.get('X-Tenant-Subdomain'),
    plan: req.headers.get('X-Tenant-Plan'),
  };
}
