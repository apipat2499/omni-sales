import { createClient } from '@supabase/supabase-js';

export type TenantHealthStatus = 'healthy' | 'warning' | 'critical';

export interface TenantUsageSummary {
  users: { current: number; limit: number; percent: number };
  storage: { current: number; limit: number; percent: number };
  orders: { current: number; limit: number; percent: number };
  apiUsagePercent: number | null;
}

export interface TenantHealth {
  id: string;
  name: string;
  subdomain: string;
  plan: string;
  status: string;
  subscriptionStatus: string;
  envReady: boolean;
  trialEndsInDays: number | null;
  lastActivityAt: string | null;
  health: TenantHealthStatus;
  issues: string[];
  usageSummary: TenantUsageSummary;
  billingStatus: 'current' | 'trial' | 'overdue' | 'suspended';
}

export interface TenantHealthReport {
  tenants: TenantHealth[];
  summary: {
    total: number;
    healthy: number;
    warning: number;
    critical: number;
    envIssues: number;
  };
  generatedAt: string;
  offline: boolean;
}

const FALLBACK_TENANTS: TenantHealth[] = [
  {
    id: 'demo-tenant-1',
    name: 'Demo Retail HQ',
    subdomain: 'demo-retail',
    plan: 'professional',
    status: 'active',
    subscriptionStatus: 'trial',
    envReady: false,
    trialEndsInDays: 7,
    lastActivityAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    health: 'warning',
    issues: ['Supabase credentials missing', 'Trial จะหมดใน 7 วัน'],
    usageSummary: {
      users: { current: 12, limit: 25, percent: 0.48 },
      storage: { current: 6, limit: 10, percent: 0.6 },
      orders: { current: 720, limit: 1000, percent: 0.72 },
      apiUsagePercent: 0.55,
    },
    billingStatus: 'trial',
  },
  {
    id: 'demo-tenant-2',
    name: 'Demo Cafe Chain',
    subdomain: 'demo-cafe',
    plan: 'starter',
    status: 'suspended',
    subscriptionStatus: 'suspended',
    envReady: true,
    trialEndsInDays: null,
    lastActivityAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    health: 'critical',
    issues: ['Suspended by billing', 'ต้องติดต่อทีมการเงิน'],
    usageSummary: {
      users: { current: 5, limit: 5, percent: 1 },
      storage: { current: 1, limit: 1, percent: 1 },
      orders: { current: 980, limit: 1000, percent: 0.98 },
      apiUsagePercent: 0.92,
    },
    billingStatus: 'suspended',
  },
];

const HEALTH_WINDOW_MS = 1000 * 60 * 60 * 24;

export async function getTenantHealthReport(): Promise<TenantHealthReport> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return buildReport(FALLBACK_TENANTS, true);
  }

  try {
    const supabase = createClient(url, serviceKey);
    const { data, error } = await supabase
      .from('tenants')
      .select(
        'id,name,subdomain,status,subscription_status,subscription_plan,trial_ends_at,updated_at,settings'
      );

    if (error) {
      throw error;
    }

    const tenants =
      data?.map((tenant) => {
        const trialEndsInDays = tenant.trial_ends_at
          ? Math.ceil(
              (new Date(tenant.trial_ends_at).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24)
            )
          : null;

        const envReady =
          tenant.settings?.supabaseConfigured !== false &&
          tenant.settings?.environmentStatus !== 'missing';

        const issues: string[] = [];
        if (tenant.status !== 'active') {
          issues.push(`Tenant status: ${tenant.status}`);
        }

        if (tenant.subscription_status === 'suspended') {
          issues.push('การเรียกเก็บเงินถูกระงับ');
        }

        if (trialEndsInDays !== null && trialEndsInDays <= 0) {
          issues.push('Trial หมดอายุ');
        } else if (trialEndsInDays !== null && trialEndsInDays <= 5) {
          issues.push(`Trial จะหมดใน ${trialEndsInDays} วัน`);
        }

        const usageSummary = summarizeUsage(tenant);
        if (usageSummary.users.percent >= 1) {
          issues.push('จำนวนผู้ใช้งานเต็มโควตา');
        }
        if (usageSummary.storage.percent >= 1) {
          issues.push('พื้นที่จัดเก็บเต็ม');
        }
        if (usageSummary.orders.percent >= 1) {
          issues.push('คำสั่งซื้อแตะขีดจำกัด');
        }
        if (
          typeof usageSummary.apiUsagePercent === 'number' &&
          usageSummary.apiUsagePercent >= 0.9
        ) {
          issues.push('API ใกล้เต็มโควตา');
        }

        if (!envReady) {
          issues.push('Supabase credentials missing');
        }

        const health: TenantHealthStatus =
          issues.length === 0
            ? 'healthy'
            : issues.some((issue) =>
                /suspend|หมด|missing|inactive/i.test(issue)
              )
            ? 'critical'
            : 'warning';

        const lastActivity =
          tenant.updated_at && withinWindow(tenant.updated_at)
            ? tenant.updated_at
            : null;

        const billingStatus =
          tenant.subscription_status === 'suspended'
            ? 'suspended'
            : tenant.subscription_status === 'trial'
            ? 'trial'
            : tenant.status === 'active'
            ? 'current'
            : 'overdue';

        return {
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          plan: tenant.subscription_plan,
          status: tenant.status,
          subscriptionStatus: tenant.subscription_status,
          envReady,
          trialEndsInDays,
          lastActivityAt: lastActivity,
          health,
          issues,
          usageSummary,
          billingStatus,
        } as TenantHealth;
      }) || [];

    return buildReport(tenants, false);
  } catch (error) {
    console.error('Failed to load tenant health report:', error);
    return buildReport(
      FALLBACK_TENANTS.map((tenant) => ({
        ...tenant,
        issues: [...tenant.issues, 'ไม่สามารถเชื่อมต่อ Supabase'],
      })),
      true
    );
  }
}

function withinWindow(updatedAt: string | null): boolean {
  if (!updatedAt) return false;
  return Date.now() - new Date(updatedAt).getTime() <= HEALTH_WINDOW_MS;
}

function buildReport(
  tenants: TenantHealth[],
  offline: boolean
): TenantHealthReport {
  const summary = tenants.reduce(
    (acc, tenant) => {
      acc.total += 1;
      acc[tenant.health] += 1;
      if (!tenant.envReady) {
        acc.envIssues += 1;
      }
      return acc;
    },
    {
      total: 0,
      healthy: 0,
      warning: 0,
      critical: 0,
      envIssues: 0,
    }
  );

  return {
    tenants,
    summary,
    generatedAt: new Date().toISOString(),
    offline,
  };
}

type TenantRecord = {
  usage?: {
    currentUsers?: number;
    currentStorage?: number;
    currentOrders?: number;
  };
  features?: {
    maxUsers?: number;
    maxStorage?: number;
    maxOrders?: number;
  };
  settings?: {
    apiUsagePercent?: number;
  };
};

function summarizeUsage(tenant: TenantRecord): TenantUsageSummary {
  const usage = tenant.usage || {
    currentUsers: 0,
    currentStorage: 0,
    currentOrders: 0,
  };
  const features = tenant.features || {
    maxUsers: 1,
    maxStorage: 1,
    maxOrders: 1,
  };

  const calc = (current: number, limit: number) => {
    if (!limit || limit < 0) return 0;
    return Math.min(current / limit, 1);
  };

  return {
    users: {
      current: usage.currentUsers || 0,
      limit: features.maxUsers > 0 ? features.maxUsers : usage.currentUsers || 0,
      percent: calc(usage.currentUsers || 0, features.maxUsers || 1),
    },
    storage: {
      current: usage.currentStorage || 0,
      limit: features.maxStorage > 0 ? features.maxStorage : usage.currentStorage || 0,
      percent: calc(usage.currentStorage || 0, features.maxStorage || 1),
    },
    orders: {
      current: usage.currentOrders || 0,
      limit: features.maxOrders > 0 ? features.maxOrders : usage.currentOrders || 0,
      percent: calc(usage.currentOrders || 0, features.maxOrders || 1),
    },
    apiUsagePercent: tenant.settings?.apiUsagePercent ?? null,
  };
}
