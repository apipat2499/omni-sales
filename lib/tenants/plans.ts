/**
 * Subscription Plans Configuration
 * Defines features, limits, and pricing for multi-tenant plans
 */

export type PlanTier = 'starter' | 'professional' | 'enterprise';

export interface PlanFeatures {
  // User & Team
  maxUsers: number; // -1 = unlimited
  maxTeams: number;
  roleBasedAccess: boolean;
  ssoEnabled: boolean;

  // Storage & Data
  maxStorage: number; // in MB, -1 = unlimited
  maxOrders: number; // -1 = unlimited
  maxProducts: number;
  maxCustomers: number;

  // Analytics & Reporting
  basicAnalytics: boolean;
  advancedAnalytics: boolean;
  customReports: boolean;
  dataExport: boolean;
  realTimeReporting: boolean;

  // Integration & API
  apiAccess: boolean;
  webhooks: boolean;
  customIntegrations: boolean;
  apiRateLimit: number; // requests per minute

  // White-label & Branding
  whiteLabel: boolean;
  customDomain: boolean;
  customBranding: boolean;
  customEmailTemplates: boolean;
  removePoweredBy: boolean;

  // Support
  emailSupport: boolean;
  prioritySupport: boolean;
  dedicatedAccountManager: boolean;
  slaSupportHours: string;

  // E-commerce Features
  multiCurrency: boolean;
  multiLanguage: boolean;
  advancedPricing: boolean;
  loyaltyProgram: boolean;
  giftCards: boolean;
  subscriptionProducts: boolean;

  // Marketing & Sales
  emailMarketing: boolean;
  smsMarketing: boolean;
  pushNotifications: boolean;
  customerSegmentation: boolean;
  abTesting: boolean;
  abandonedCartRecovery: boolean;

  // Marketplace Integration
  marketplaceIntegrations: string[]; // e.g., ['shopee', 'lazada', 'amazon']
  autoSyncOrders: boolean;
  centralizedInventory: boolean;

  // Security & Compliance
  twoFactorAuth: boolean;
  auditLogs: boolean;
  dataRetention: number; // in days, -1 = unlimited
  ipWhitelisting: boolean;
  customRoles: boolean;

  // Advanced Features
  aiRecommendations: boolean;
  fraudDetection: boolean;
  advancedInventory: boolean;
  batchOperations: boolean;
  scheduledReports: boolean;
}

export interface PlanPricing {
  monthly: number; // in USD
  yearly: number; // in USD (usually discounted)
  currency: string;
  trialDays: number;
}

export interface Plan {
  id: PlanTier;
  name: string;
  description: string;
  tagline: string;
  popular: boolean;
  pricing: PlanPricing;
  features: PlanFeatures;
  limits: {
    storage: string;
    users: string;
    orders: string;
  };
  highlights: string[];
}

/**
 * Subscription Plans
 */
export const SUBSCRIPTION_PLANS: Record<PlanTier, Plan> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small businesses just getting started',
    tagline: 'Essential features to launch your online store',
    popular: false,
    pricing: {
      monthly: 29,
      yearly: 290, // ~$24/month
      currency: 'USD',
      trialDays: 14,
    },
    features: {
      // User & Team
      maxUsers: 5,
      maxTeams: 1,
      roleBasedAccess: true,
      ssoEnabled: false,

      // Storage & Data
      maxStorage: 1024, // 1GB
      maxOrders: 1000,
      maxProducts: 100,
      maxCustomers: 1000,

      // Analytics & Reporting
      basicAnalytics: true,
      advancedAnalytics: false,
      customReports: false,
      dataExport: true,
      realTimeReporting: false,

      // Integration & API
      apiAccess: false,
      webhooks: false,
      customIntegrations: false,
      apiRateLimit: 0,

      // White-label & Branding
      whiteLabel: false,
      customDomain: false,
      customBranding: false,
      customEmailTemplates: false,
      removePoweredBy: false,

      // Support
      emailSupport: true,
      prioritySupport: false,
      dedicatedAccountManager: false,
      slaSupportHours: 'Business hours',

      // E-commerce Features
      multiCurrency: false,
      multiLanguage: false,
      advancedPricing: false,
      loyaltyProgram: false,
      giftCards: false,
      subscriptionProducts: false,

      // Marketing & Sales
      emailMarketing: true,
      smsMarketing: false,
      pushNotifications: true,
      customerSegmentation: false,
      abTesting: false,
      abandonedCartRecovery: false,

      // Marketplace Integration
      marketplaceIntegrations: [],
      autoSyncOrders: false,
      centralizedInventory: false,

      // Security & Compliance
      twoFactorAuth: true,
      auditLogs: false,
      dataRetention: 90,
      ipWhitelisting: false,
      customRoles: false,

      // Advanced Features
      aiRecommendations: false,
      fraudDetection: false,
      advancedInventory: false,
      batchOperations: false,
      scheduledReports: false,
    },
    limits: {
      storage: '1 GB',
      users: '5 users',
      orders: '1,000 orders/month',
    },
    highlights: [
      'Up to 5 team members',
      '1,000 orders per month',
      'Basic analytics & reports',
      'Email marketing',
      'Email support',
      '14-day free trial',
    ],
  },

  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'For growing businesses that need more power',
    tagline: 'Advanced features for scaling your business',
    popular: true,
    pricing: {
      monthly: 99,
      yearly: 990, // ~$82.50/month
      currency: 'USD',
      trialDays: 14,
    },
    features: {
      // User & Team
      maxUsers: 25,
      maxTeams: 5,
      roleBasedAccess: true,
      ssoEnabled: false,

      // Storage & Data
      maxStorage: 10240, // 10GB
      maxOrders: 10000,
      maxProducts: 1000,
      maxCustomers: 10000,

      // Analytics & Reporting
      basicAnalytics: true,
      advancedAnalytics: true,
      customReports: true,
      dataExport: true,
      realTimeReporting: true,

      // Integration & API
      apiAccess: true,
      webhooks: true,
      customIntegrations: true,
      apiRateLimit: 1000, // 1000 req/min

      // White-label & Branding
      whiteLabel: true,
      customDomain: true,
      customBranding: true,
      customEmailTemplates: true,
      removePoweredBy: true,

      // Support
      emailSupport: true,
      prioritySupport: true,
      dedicatedAccountManager: false,
      slaSupportHours: '24/7',

      // E-commerce Features
      multiCurrency: true,
      multiLanguage: true,
      advancedPricing: true,
      loyaltyProgram: true,
      giftCards: true,
      subscriptionProducts: true,

      // Marketing & Sales
      emailMarketing: true,
      smsMarketing: true,
      pushNotifications: true,
      customerSegmentation: true,
      abTesting: true,
      abandonedCartRecovery: true,

      // Marketplace Integration
      marketplaceIntegrations: ['shopee', 'lazada', 'shopify'],
      autoSyncOrders: true,
      centralizedInventory: true,

      // Security & Compliance
      twoFactorAuth: true,
      auditLogs: true,
      dataRetention: 365,
      ipWhitelisting: true,
      customRoles: true,

      // Advanced Features
      aiRecommendations: true,
      fraudDetection: true,
      advancedInventory: true,
      batchOperations: true,
      scheduledReports: true,
    },
    limits: {
      storage: '10 GB',
      users: '25 users',
      orders: '10,000 orders/month',
    },
    highlights: [
      'Up to 25 team members',
      '10,000 orders per month',
      'Advanced analytics & AI insights',
      'White-label branding',
      'Custom domain support',
      'API access & webhooks',
      'Multi-currency & multi-language',
      'Marketplace integrations',
      'Priority support 24/7',
    ],
  },

  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations with custom needs',
    tagline: 'Unlimited power and dedicated support',
    popular: false,
    pricing: {
      monthly: 299,
      yearly: 2990, // ~$249/month
      currency: 'USD',
      trialDays: 30,
    },
    features: {
      // User & Team
      maxUsers: -1, // Unlimited
      maxTeams: -1,
      roleBasedAccess: true,
      ssoEnabled: true,

      // Storage & Data
      maxStorage: -1, // Unlimited
      maxOrders: -1,
      maxProducts: -1,
      maxCustomers: -1,

      // Analytics & Reporting
      basicAnalytics: true,
      advancedAnalytics: true,
      customReports: true,
      dataExport: true,
      realTimeReporting: true,

      // Integration & API
      apiAccess: true,
      webhooks: true,
      customIntegrations: true,
      apiRateLimit: -1, // Unlimited

      // White-label & Branding
      whiteLabel: true,
      customDomain: true,
      customBranding: true,
      customEmailTemplates: true,
      removePoweredBy: true,

      // Support
      emailSupport: true,
      prioritySupport: true,
      dedicatedAccountManager: true,
      slaSupportHours: '24/7 with SLA',

      // E-commerce Features
      multiCurrency: true,
      multiLanguage: true,
      advancedPricing: true,
      loyaltyProgram: true,
      giftCards: true,
      subscriptionProducts: true,

      // Marketing & Sales
      emailMarketing: true,
      smsMarketing: true,
      pushNotifications: true,
      customerSegmentation: true,
      abTesting: true,
      abandonedCartRecovery: true,

      // Marketplace Integration
      marketplaceIntegrations: ['shopee', 'lazada', 'shopify', 'amazon', 'ebay', 'walmart'],
      autoSyncOrders: true,
      centralizedInventory: true,

      // Security & Compliance
      twoFactorAuth: true,
      auditLogs: true,
      dataRetention: -1, // Unlimited
      ipWhitelisting: true,
      customRoles: true,

      // Advanced Features
      aiRecommendations: true,
      fraudDetection: true,
      advancedInventory: true,
      batchOperations: true,
      scheduledReports: true,
    },
    limits: {
      storage: 'Unlimited',
      users: 'Unlimited',
      orders: 'Unlimited',
    },
    highlights: [
      'Unlimited everything',
      'SSO & advanced security',
      'Dedicated account manager',
      '99.9% uptime SLA',
      'Custom integrations',
      'All marketplace integrations',
      'Advanced fraud detection',
      'Custom contracts & pricing',
      '24/7 priority support',
      '30-day free trial',
    ],
  },
};

/**
 * Get plan by tier
 */
export function getPlan(tier: PlanTier): Plan {
  return SUBSCRIPTION_PLANS[tier];
}

/**
 * Get all plans
 */
export function getAllPlans(): Plan[] {
  return Object.values(SUBSCRIPTION_PLANS);
}

/**
 * Check if plan has feature
 */
export function hasFeature(
  plan: PlanTier,
  feature: keyof PlanFeatures
): boolean {
  return SUBSCRIPTION_PLANS[plan].features[feature] as boolean;
}

/**
 * Get feature limit
 */
export function getFeatureLimit(
  plan: PlanTier,
  feature: keyof PlanFeatures
): number {
  return SUBSCRIPTION_PLANS[plan].features[feature] as number;
}

/**
 * Compare plans
 */
export function comparePlans(current: PlanTier, target: PlanTier): {
  isUpgrade: boolean;
  isDowngrade: boolean;
  priceDifference: number;
} {
  const currentPlan = SUBSCRIPTION_PLANS[current];
  const targetPlan = SUBSCRIPTION_PLANS[target];

  const currentPrice = currentPlan.pricing.monthly;
  const targetPrice = targetPlan.pricing.monthly;

  return {
    isUpgrade: targetPrice > currentPrice,
    isDowngrade: targetPrice < currentPrice,
    priceDifference: targetPrice - currentPrice,
  };
}

/**
 * Calculate usage-based pricing
 */
export function calculateUsageBasedPrice(
  plan: PlanTier,
  usage: {
    users: number;
    storage: number; // in MB
    orders: number;
  }
): {
  basePlan: number;
  overageCharges: {
    users: number;
    storage: number;
    orders: number;
  };
  total: number;
} {
  const planConfig = SUBSCRIPTION_PLANS[plan];
  const basePrice = planConfig.pricing.monthly;

  // Overage pricing (per unit)
  const overagePricing = {
    userPrice: 5, // $5 per additional user
    storagePrice: 0.1, // $0.10 per GB
    orderPrice: 0.01, // $0.01 per additional order
  };

  const overageCharges = {
    users: 0,
    storage: 0,
    orders: 0,
  };

  // Calculate user overage
  if (planConfig.features.maxUsers !== -1 && usage.users > planConfig.features.maxUsers) {
    overageCharges.users = (usage.users - planConfig.features.maxUsers) * overagePricing.userPrice;
  }

  // Calculate storage overage
  if (planConfig.features.maxStorage !== -1 && usage.storage > planConfig.features.maxStorage) {
    const overageGB = (usage.storage - planConfig.features.maxStorage) / 1024;
    overageCharges.storage = Math.ceil(overageGB) * overagePricing.storagePrice;
  }

  // Calculate order overage
  if (planConfig.features.maxOrders !== -1 && usage.orders > planConfig.features.maxOrders) {
    overageCharges.orders = (usage.orders - planConfig.features.maxOrders) * overagePricing.orderPrice;
  }

  return {
    basePlan: basePrice,
    overageCharges,
    total: basePrice + overageCharges.users + overageCharges.storage + overageCharges.orders,
  };
}

/**
 * Get plan recommendation based on usage
 */
export function recommendPlan(usage: {
  users: number;
  storage: number;
  orders: number;
}): PlanTier {
  const plans = getAllPlans();

  for (const plan of plans) {
    const meetsUsers = plan.features.maxUsers === -1 || usage.users <= plan.features.maxUsers;
    const meetsStorage = plan.features.maxStorage === -1 || usage.storage <= plan.features.maxStorage;
    const meetsOrders = plan.features.maxOrders === -1 || usage.orders <= plan.features.maxOrders;

    if (meetsUsers && meetsStorage && meetsOrders) {
      return plan.id;
    }
  }

  return 'enterprise'; // Default to enterprise if usage exceeds all plans
}
