import { createClient } from '@supabase/supabase-js';

export interface TenantConfig {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  customDomain: string | null;
  subdomain: string;

  // Subscription & Billing
  subscriptionPlan: 'starter' | 'professional' | 'enterprise';
  subscriptionStatus: 'active' | 'trial' | 'suspended' | 'cancelled';
  trialEndsAt: Date | null;
  subscriptionEndsAt: Date | null;

  // Branding
  branding: {
    logo: string | null;
    favicon: string | null;
    primaryColor: string;
    accentColor: string;
    companyName: string;
    customNavLabels: Record<string, string>;
    customPageTitles: Record<string, string>;
    customFonts: {
      heading: string;
      body: string;
    };
    removeBranding: boolean; // Remove "Powered by Omni-Sales"
  };

  // Email Settings
  emailBranding: {
    senderName: string;
    replyTo: string;
    customTemplates: boolean;
    footerText: string;
  };

  // Features & Limits
  features: {
    maxUsers: number;
    maxStorage: number; // in MB
    maxOrders: number;
    advancedAnalytics: boolean;
    apiAccess: boolean;
    customIntegrations: boolean;
    prioritySupport: boolean;
    whiteLabel: boolean;
    customDomain: boolean;
    sso: boolean;
    multiCurrency: boolean;
  };

  // Usage Tracking
  usage: {
    currentUsers: number;
    currentStorage: number; // in MB
    currentOrders: number;
  };

  // Database Isolation Strategy
  isolationStrategy: 'shared_with_rls' | 'database_per_tenant' | 'schema_per_tenant';

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  status: 'active' | 'suspended' | 'inactive';
  settings: Record<string, any>;
}

export interface TenantUser {
  userId: string;
  tenantId: string;
  role: 'owner' | 'admin' | 'member';
  invitedBy: string | null;
  joinedAt: Date;
}

/**
 * Multi-Tenant Manager
 * Handles tenant isolation, configuration, and context management
 */
export class TenantManager {
  private static instance: TenantManager;
  private currentTenant: TenantConfig | null = null;
  private supabaseUrl: string;
  private supabaseKey: string;

  private constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    this.supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): TenantManager {
    if (!TenantManager.instance) {
      TenantManager.instance = new TenantManager();
    }
    return TenantManager.instance;
  }

  /**
   * Detect tenant from request
   * Supports: subdomain.app.com, custom.domain.com
   */
  public async detectTenantFromRequest(hostname: string): Promise<TenantConfig | null> {
    try {
      const supabase = createClient(this.supabaseUrl, this.supabaseKey);

      // Try custom domain first
      let { data: tenant, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('custom_domain', hostname)
        .eq('status', 'active')
        .single();

      // Handle table not found error gracefully
      if (error && (error.code === 'PGRST116' || error.code === 'PGRST204' || error.code === 'PGRST205')) {
        console.warn('Tenants table not found - running in demo mode without multi-tenancy');
        return null;
      }

      // If not found, try subdomain
      if (!tenant && !error) {
        const subdomain = this.extractSubdomain(hostname);
        if (subdomain) {
          ({ data: tenant, error } = await supabase
            .from('tenants')
            .select('*')
            .eq('subdomain', subdomain)
            .eq('status', 'active')
            .single());

          // Handle table not found error gracefully
          if (error && (error.code === 'PGRST116' || error.code === 'PGRST204' || error.code === 'PGRST205')) {
            console.warn('Tenants table not found - running in demo mode without multi-tenancy');
            return null;
          }
        }
      }

      if (error || !tenant) {
        // Only log non-404 errors
        if (error && error.code !== 'PGRST116' && error.code !== 'PGRST204' && error.code !== 'PGRST205') {
          console.error('Tenant detection error:', error);
        }
        return null;
      }

      return this.mapDatabaseToConfig(tenant);
    } catch (error) {
      console.error('Unexpected error in tenant detection:', error);
      return null;
    }
  }

  /**
   * Extract subdomain from hostname
   */
  private extractSubdomain(hostname: string): string | null {
    // Remove port if present
    const host = hostname.split(':')[0];
    const parts = host.split('.');

    // If localhost or IP, no subdomain
    if (host === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
      return null;
    }

    // For subdomain.app.com -> return 'subdomain'
    // For app.com -> return null
    if (parts.length >= 3) {
      return parts[0];
    }

    return null;
  }

  /**
   * Set current tenant context
   */
  public setTenant(tenant: TenantConfig): void {
    this.currentTenant = tenant;
  }

  /**
   * Get current tenant
   */
  public getTenant(): TenantConfig | null {
    return this.currentTenant;
  }

  /**
   * Get tenant ID for RLS
   */
  public getTenantId(): string | null {
    return this.currentTenant?.id || null;
  }

  /**
   * Create new tenant
   */
  public async createTenant(data: {
    name: string;
    slug: string;
    subdomain: string;
    ownerEmail: string;
    ownerId: string;
    plan?: 'starter' | 'professional' | 'enterprise';
  }): Promise<TenantConfig> {
    const supabase = createClient(this.supabaseUrl, this.supabaseKey);

    // Check if subdomain is available
    const { data: existing } = await supabase
      .from('tenants')
      .select('id')
      .eq('subdomain', data.subdomain)
      .single();

    if (existing) {
      throw new Error('Subdomain already taken');
    }

    // Create tenant
    const { data: tenant, error } = await supabase
      .from('tenants')
      .insert({
        name: data.name,
        slug: data.slug,
        subdomain: data.subdomain,
        subscription_plan: data.plan || 'starter',
        subscription_status: 'trial',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days trial
        created_by: data.ownerId,
        status: 'active',
        branding: this.getDefaultBranding(data.name),
        email_branding: this.getDefaultEmailBranding(data.name),
        features: this.getPlanFeatures(data.plan || 'starter'),
        usage: { currentUsers: 0, currentStorage: 0, currentOrders: 0 },
        isolation_strategy: 'shared_with_rls',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create tenant: ${error.message}`);
    }

    // Create tenant owner
    await supabase.from('tenant_users').insert({
      tenant_id: tenant.id,
      user_id: data.ownerId,
      role: 'owner',
      joined_at: new Date().toISOString(),
    });

    return this.mapDatabaseToConfig(tenant);
  }

  /**
   * Update tenant branding
   */
  public async updateBranding(
    tenantId: string,
    branding: Partial<TenantConfig['branding']>
  ): Promise<void> {
    const supabase = createClient(this.supabaseUrl, this.supabaseKey);

    const { error } = await supabase
      .from('tenants')
      .update({
        branding,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenantId);

    if (error) {
      throw new Error(`Failed to update branding: ${error.message}`);
    }
  }

  /**
   * Setup custom domain
   */
  public async setupCustomDomain(
    tenantId: string,
    customDomain: string
  ): Promise<{ dnsRecords: any[]; verificationToken: string }> {
    const supabase = createClient(this.supabaseUrl, this.supabaseKey);

    // Generate verification token
    const verificationToken = this.generateVerificationToken();

    // Update tenant with custom domain
    const { error } = await supabase
      .from('tenants')
      .update({
        custom_domain: customDomain,
        domain_verification_token: verificationToken,
        domain_verified: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenantId);

    if (error) {
      throw new Error(`Failed to setup custom domain: ${error.message}`);
    }

    // Return DNS records to configure
    return {
      verificationToken,
      dnsRecords: [
        {
          type: 'CNAME',
          name: customDomain,
          value: 'app.omnisales.com',
          ttl: 3600,
        },
        {
          type: 'TXT',
          name: `_omnisales-verify.${customDomain}`,
          value: verificationToken,
          ttl: 3600,
        },
      ],
    };
  }

  /**
   * Verify custom domain
   */
  public async verifyCustomDomain(tenantId: string): Promise<boolean> {
    const supabase = createClient(this.supabaseUrl, this.supabaseKey);

    const { data: tenant } = await supabase
      .from('tenants')
      .select('custom_domain, domain_verification_token')
      .eq('id', tenantId)
      .single();

    if (!tenant?.custom_domain || !tenant?.domain_verification_token) {
      return false;
    }

    // TODO: Implement actual DNS verification
    // For now, mark as verified
    await supabase
      .from('tenants')
      .update({
        domain_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenantId);

    return true;
  }

  /**
   * Check feature access
   */
  public hasFeature(feature: keyof TenantConfig['features']): boolean {
    if (!this.currentTenant) {
      return false;
    }
    return this.currentTenant.features[feature] as boolean;
  }

  /**
   * Check usage limits
   */
  public async checkUsageLimits(tenantId: string): Promise<{
    users: { current: number; max: number; exceeded: boolean };
    storage: { current: number; max: number; exceeded: boolean };
    orders: { current: number; max: number; exceeded: boolean };
  }> {
    const supabase = createClient(this.supabaseUrl, this.supabaseKey);

    const { data: tenant } = await supabase
      .from('tenants')
      .select('features, usage')
      .eq('id', tenantId)
      .single();

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    return {
      users: {
        current: tenant.usage.currentUsers,
        max: tenant.features.maxUsers,
        exceeded: tenant.usage.currentUsers >= tenant.features.maxUsers,
      },
      storage: {
        current: tenant.usage.currentStorage,
        max: tenant.features.maxStorage,
        exceeded: tenant.usage.currentStorage >= tenant.features.maxStorage,
      },
      orders: {
        current: tenant.usage.currentOrders,
        max: tenant.features.maxOrders,
        exceeded: tenant.usage.currentOrders >= tenant.features.maxOrders,
      },
    };
  }

  /**
   * Get Supabase client with tenant context (RLS)
   */
  public getSupabaseClient(userId?: string) {
    const supabase = createClient(this.supabaseUrl, this.supabaseKey);

    // Set tenant context for RLS
    if (this.currentTenant) {
      // This will be used by RLS policies
      supabase.rpc('set_tenant_id', { tenant_id: this.currentTenant.id });
    }

    return supabase;
  }

  // Helper methods
  private getDefaultBranding(companyName: string): TenantConfig['branding'] {
    return {
      logo: null,
      favicon: null,
      primaryColor: '#3b82f6',
      accentColor: '#8b5cf6',
      companyName,
      customNavLabels: {},
      customPageTitles: {},
      customFonts: {
        heading: 'Inter',
        body: 'Inter',
      },
      removeBranding: false,
    };
  }

  private getDefaultEmailBranding(companyName: string): TenantConfig['emailBranding'] {
    return {
      senderName: companyName,
      replyTo: 'noreply@example.com',
      customTemplates: false,
      footerText: `© ${new Date().getFullYear()} ${companyName}. All rights reserved.`,
    };
  }

  private getPlanFeatures(plan: string): TenantConfig['features'] {
    const plans = {
      starter: {
        maxUsers: 5,
        maxStorage: 1024, // 1GB
        maxOrders: 1000,
        advancedAnalytics: false,
        apiAccess: false,
        customIntegrations: false,
        prioritySupport: false,
        whiteLabel: false,
        customDomain: false,
        sso: false,
        multiCurrency: false,
      },
      professional: {
        maxUsers: 25,
        maxStorage: 10240, // 10GB
        maxOrders: 10000,
        advancedAnalytics: true,
        apiAccess: true,
        customIntegrations: true,
        prioritySupport: false,
        whiteLabel: true,
        customDomain: true,
        sso: false,
        multiCurrency: true,
      },
      enterprise: {
        maxUsers: -1, // Unlimited
        maxStorage: -1, // Unlimited
        maxOrders: -1, // Unlimited
        advancedAnalytics: true,
        apiAccess: true,
        customIntegrations: true,
        prioritySupport: true,
        whiteLabel: true,
        customDomain: true,
        sso: true,
        multiCurrency: true,
      },
    };

    return plans[plan as keyof typeof plans] || plans.starter;
  }

  private generateVerificationToken(): string {
    return `omnisales-verify-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  }

  private mapDatabaseToConfig(dbTenant: any): TenantConfig {
    return {
      id: dbTenant.id,
      name: dbTenant.name,
      slug: dbTenant.slug,
      domain: dbTenant.domain,
      customDomain: dbTenant.custom_domain,
      subdomain: dbTenant.subdomain,
      subscriptionPlan: dbTenant.subscription_plan,
      subscriptionStatus: dbTenant.subscription_status,
      trialEndsAt: dbTenant.trial_ends_at ? new Date(dbTenant.trial_ends_at) : null,
      subscriptionEndsAt: dbTenant.subscription_ends_at ? new Date(dbTenant.subscription_ends_at) : null,
      branding: dbTenant.branding,
      emailBranding: dbTenant.email_branding,
      features: dbTenant.features,
      usage: dbTenant.usage,
      isolationStrategy: dbTenant.isolation_strategy,
      createdAt: new Date(dbTenant.created_at),
      updatedAt: new Date(dbTenant.updated_at),
      createdBy: dbTenant.created_by,
      status: dbTenant.status,
      settings: dbTenant.settings || {},
    };
  }
}

// Export singleton instance
export const tenantManager = TenantManager.getInstance();
