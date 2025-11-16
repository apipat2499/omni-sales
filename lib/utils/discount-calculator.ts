/**
 * Discount Calculator
 * Handles discount calculations, stacking rules, loyalty points, and coupon validation
 */

import type { OrderItem, Customer } from '@/types';
import { calculatePrice, type PriceCalculation } from './pricing-rules';

// ============================================================================
// Type Definitions
// ============================================================================

export type CouponType = 'percentage' | 'fixed' | 'bogo' | 'free_shipping' | 'buy_x_get_y';

export interface Coupon {
  code: string;
  type: CouponType;
  value: number;

  validFrom: Date;
  validUntil: Date;

  minOrderValue?: number;
  maxDiscount?: number;

  applicableProducts?: string[]; // Product IDs
  applicableCategories?: string[]; // Categories
  excludedProducts?: string[]; // Excluded product IDs

  maxUsages?: number;
  usageCount: number;

  maxUsagesPerCustomer?: number;
  applicableCustomers?: string[]; // VIP only, specific customers, etc.
  applicableCustomerTiers?: string[]; // 'vip', 'regular', etc.

  isActive: boolean;
  isStackable: boolean;

  // BOGO specific
  buyQuantity?: number; // Buy X
  getQuantity?: number; // Get Y free

  // Metadata
  description?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CouponValidation {
  valid: boolean;
  discount: number;
  error?: string;
  message?: string;
  coupon?: Coupon;
}

export interface DiscountStackingResult {
  totalDiscount: number;
  appliedCoupons: Coupon[];
  conflicts: string[];
  warnings: string[];
}

export interface LoyaltyPointsConfig {
  pointsPerDollar: number;
  dollarsPerPoint: number;
  tierMultipliers: Record<string, number>;
  minimumRedemption: number;
  expirationDays?: number;
}

export interface LoyaltyAccount {
  customerId: string;
  points: number;
  lifetimePoints: number;
  tier: string;
  expiringPoints?: {
    points: number;
    expiryDate: Date;
  }[];
  transactions: LoyaltyTransaction[];
}

export interface LoyaltyTransaction {
  id: string;
  customerId: string;
  type: 'earned' | 'redeemed' | 'expired' | 'adjusted';
  points: number;
  description: string;
  orderId?: string;
  timestamp: Date;
}

// ============================================================================
// Storage Keys
// ============================================================================

const COUPONS_KEY = 'coupons';
const COUPON_USAGE_KEY = 'coupon_usage';
const LOYALTY_KEY = 'loyalty_accounts';
const LOYALTY_CONFIG_KEY = 'loyalty_config';

// ============================================================================
// Coupon Management
// ============================================================================

/**
 * Get all coupons
 */
export function getAllCoupons(): Coupon[] {
  try {
    const stored = localStorage.getItem(COUPONS_KEY);
    if (!stored) return [];

    const coupons = JSON.parse(stored) as Coupon[];
    return coupons.map(deserializeCoupon);
  } catch {
    return [];
  }
}

/**
 * Get active coupons
 */
export function getActiveCoupons(): Coupon[] {
  const now = new Date();
  return getAllCoupons().filter((coupon) => {
    if (!coupon.isActive) return false;
    if (coupon.validFrom > now) return false;
    if (coupon.validUntil < now) return false;
    if (coupon.maxUsages && coupon.usageCount >= coupon.maxUsages) return false;
    return true;
  });
}

/**
 * Get coupon by code
 */
export function getCouponByCode(code: string): Coupon | null {
  const coupons = getAllCoupons();
  return coupons.find((c) => c.code.toLowerCase() === code.toLowerCase()) || null;
}

/**
 * Create new coupon
 */
export function createCoupon(
  coupon: Omit<Coupon, 'usageCount' | 'createdAt' | 'updatedAt'>
): Coupon {
  const now = new Date();

  const newCoupon: Coupon = {
    ...coupon,
    code: coupon.code.toUpperCase(),
    usageCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  saveCoupon(newCoupon);
  return newCoupon;
}

/**
 * Save coupon
 */
export function saveCoupon(coupon: Coupon): void {
  const coupons = getAllCoupons();
  const index = coupons.findIndex((c) => c.code === coupon.code);

  if (index >= 0) {
    coupons[index] = { ...coupon, updatedAt: new Date() };
  } else {
    coupons.push(coupon);
  }

  localStorage.setItem(COUPONS_KEY, JSON.stringify(coupons.map(serializeCoupon)));
}

/**
 * Update coupon
 */
export function updateCoupon(
  code: string,
  updates: Partial<Omit<Coupon, 'code' | 'createdAt'>>
): Coupon | null {
  const coupon = getCouponByCode(code);
  if (!coupon) return null;

  const updated: Coupon = {
    ...coupon,
    ...updates,
    updatedAt: new Date(),
  };

  saveCoupon(updated);
  return updated;
}

/**
 * Delete coupon
 */
export function deleteCoupon(code: string): boolean {
  const coupons = getAllCoupons();
  const filtered = coupons.filter((c) => c.code !== code);

  if (filtered.length === coupons.length) return false;

  localStorage.setItem(COUPONS_KEY, JSON.stringify(filtered.map(serializeCoupon)));
  return true;
}

/**
 * Generate bulk coupons
 */
export function generateBulkCoupons(
  count: number,
  config: Omit<Coupon, 'code' | 'usageCount' | 'createdAt' | 'updatedAt'>
): string[] {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    const code = generateCouponCode();
    createCoupon({
      ...config,
      code,
    });
    codes.push(code);
  }

  return codes;
}

/**
 * Generate random coupon code
 */
export function generateCouponCode(prefix: string = '', length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = prefix;

  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // Ensure uniqueness
  if (getCouponByCode(code)) {
    return generateCouponCode(prefix, length);
  }

  return code;
}

// ============================================================================
// Coupon Validation
// ============================================================================

/**
 * Validate coupon for an order
 */
export function validateCoupon(
  code: string,
  items: OrderItem[],
  customer: Customer,
  orderTotal: number
): CouponValidation {
  const coupon = getCouponByCode(code);

  if (!coupon) {
    return {
      valid: false,
      discount: 0,
      error: 'Invalid coupon code',
    };
  }

  if (!coupon.isActive) {
    return {
      valid: false,
      discount: 0,
      error: 'This coupon is not active',
    };
  }

  const now = new Date();

  if (coupon.validFrom > now) {
    return {
      valid: false,
      discount: 0,
      error: `This coupon is not valid until ${coupon.validFrom.toLocaleDateString()}`,
    };
  }

  if (coupon.validUntil < now) {
    return {
      valid: false,
      discount: 0,
      error: 'This coupon has expired',
    };
  }

  if (coupon.maxUsages && coupon.usageCount >= coupon.maxUsages) {
    return {
      valid: false,
      discount: 0,
      error: 'This coupon has reached its usage limit',
    };
  }

  if (coupon.minOrderValue && orderTotal < coupon.minOrderValue) {
    return {
      valid: false,
      discount: 0,
      error: `Minimum order value of $${coupon.minOrderValue} required`,
    };
  }

  // Check customer eligibility
  if (coupon.applicableCustomers && coupon.applicableCustomers.length > 0) {
    if (!coupon.applicableCustomers.includes(customer.id)) {
      return {
        valid: false,
        discount: 0,
        error: 'This coupon is not valid for your account',
      };
    }
  }

  // Check customer tier
  if (coupon.applicableCustomerTiers && coupon.applicableCustomerTiers.length > 0) {
    const customerTier = customer.tags?.[0] || 'regular';
    if (!coupon.applicableCustomerTiers.includes(customerTier)) {
      return {
        valid: false,
        discount: 0,
        error: `This coupon is only valid for ${coupon.applicableCustomerTiers.join(', ')} customers`,
      };
    }
  }

  // Check per-customer usage limit
  if (coupon.maxUsagesPerCustomer) {
    const usage = getCustomerCouponUsage(customer.id, code);
    if (usage >= coupon.maxUsagesPerCustomer) {
      return {
        valid: false,
        discount: 0,
        error: 'You have already used this coupon the maximum number of times',
      };
    }
  }

  // Check product applicability
  const applicableItems = getApplicableItems(items, coupon);
  if (applicableItems.length === 0) {
    return {
      valid: false,
      discount: 0,
      error: 'This coupon is not valid for any items in your cart',
    };
  }

  // Calculate discount
  const discount = calculateCouponDiscount(applicableItems, coupon, orderTotal);

  return {
    valid: true,
    discount,
    coupon,
    message: getCouponMessage(coupon, discount),
  };
}

/**
 * Calculate coupon discount
 */
export function calculateCouponDiscount(
  items: OrderItem[],
  coupon: Coupon,
  orderTotal: number
): number {
  const applicableItems = getApplicableItems(items, coupon);
  const applicableTotal = applicableItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  let discount = 0;

  switch (coupon.type) {
    case 'percentage': {
      discount = (applicableTotal * coupon.value) / 100;
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
      break;
    }

    case 'fixed': {
      discount = Math.min(coupon.value, applicableTotal);
      break;
    }

    case 'bogo': {
      // Buy X Get Y free - calculate discount on free items
      if (coupon.buyQuantity && coupon.getQuantity) {
        const totalQty = applicableItems.reduce((sum, item) => sum + item.quantity, 0);
        const sets = Math.floor(totalQty / (coupon.buyQuantity + coupon.getQuantity));
        const freeItems = sets * coupon.getQuantity;

        // Find cheapest items to discount
        const sortedItems = [...applicableItems].sort((a, b) => a.price - b.price);
        let remainingFree = freeItems;

        for (const item of sortedItems) {
          if (remainingFree <= 0) break;
          const freeQty = Math.min(item.quantity, remainingFree);
          discount += item.price * freeQty;
          remainingFree -= freeQty;
        }
      }
      break;
    }

    case 'free_shipping': {
      discount = coupon.value; // Shipping cost
      break;
    }

    case 'buy_x_get_y': {
      // Similar to BOGO but more flexible
      if (coupon.buyQuantity && coupon.getQuantity) {
        const totalQty = applicableItems.reduce((sum, item) => sum + item.quantity, 0);
        if (totalQty >= coupon.buyQuantity) {
          const sortedItems = [...applicableItems].sort((a, b) => a.price - b.price);
          let remainingFree = coupon.getQuantity;

          for (const item of sortedItems) {
            if (remainingFree <= 0) break;
            const freeQty = Math.min(item.quantity, remainingFree);
            discount += item.price * freeQty;
            remainingFree -= freeQty;
          }
        }
      }
      break;
    }
  }

  return Math.round(discount * 100) / 100;
}

/**
 * Get items applicable for a coupon
 */
function getApplicableItems(items: OrderItem[], coupon: Coupon): OrderItem[] {
  return items.filter((item) => {
    // Check if product is excluded
    if (coupon.excludedProducts?.includes(item.productId)) {
      return false;
    }

    // Check if product is in applicable list
    if (coupon.applicableProducts && coupon.applicableProducts.length > 0) {
      return coupon.applicableProducts.includes(item.productId);
    }

    // Check if category is in applicable list
    // Note: This would require product category data
    if (coupon.applicableCategories && coupon.applicableCategories.length > 0) {
      // Implementation depends on how category data is available
      return true; // Simplified for now
    }

    return true;
  });
}

/**
 * Get coupon message
 */
function getCouponMessage(coupon: Coupon, discount: number): string {
  switch (coupon.type) {
    case 'percentage':
      return `${coupon.value}% off applied! You saved $${discount.toFixed(2)}`;
    case 'fixed':
      return `$${coupon.value} off applied! You saved $${discount.toFixed(2)}`;
    case 'bogo':
      return `Buy ${coupon.buyQuantity} Get ${coupon.getQuantity} Free! You saved $${discount.toFixed(2)}`;
    case 'free_shipping':
      return 'Free shipping applied!';
    case 'buy_x_get_y':
      return `Buy ${coupon.buyQuantity} Get ${coupon.getQuantity} Free! You saved $${discount.toFixed(2)}`;
    default:
      return `Coupon applied! You saved $${discount.toFixed(2)}`;
  }
}

/**
 * Redeem coupon
 */
export function redeemCoupon(code: string, customerId: string): boolean {
  const coupon = getCouponByCode(code);
  if (!coupon) return false;

  // Update global usage count
  updateCoupon(code, { usageCount: coupon.usageCount + 1 });

  // Track per-customer usage
  incrementCustomerCouponUsage(customerId, code);

  return true;
}

// ============================================================================
// Coupon Usage Tracking
// ============================================================================

/**
 * Get all coupon usage data
 */
function getAllCouponUsage(): Record<string, Record<string, number>> {
  try {
    const stored = localStorage.getItem(COUPON_USAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Get customer coupon usage
 */
export function getCustomerCouponUsage(customerId: string, couponCode: string): number {
  const allUsage = getAllCouponUsage();
  const customerUsage = allUsage[customerId] || {};
  return customerUsage[couponCode] || 0;
}

/**
 * Increment customer coupon usage
 */
function incrementCustomerCouponUsage(customerId: string, couponCode: string): void {
  try {
    const allUsage = getAllCouponUsage();
    const customerUsage = allUsage[customerId] || {};
    customerUsage[couponCode] = (customerUsage[couponCode] || 0) + 1;
    allUsage[customerId] = customerUsage;

    localStorage.setItem(COUPON_USAGE_KEY, JSON.stringify(allUsage));
  } catch {
    // Ignore errors
  }
}

// ============================================================================
// Discount Stacking
// ============================================================================

/**
 * Calculate total discount with stacking rules
 */
export function calculateStackedDiscounts(
  items: OrderItem[],
  customer: Customer,
  couponCodes: string[],
  orderTotal: number
): DiscountStackingResult {
  const appliedCoupons: Coupon[] = [];
  const conflicts: string[] = [];
  const warnings: string[] = [];
  let totalDiscount = 0;
  let hasNonStackable = false;

  for (const code of couponCodes) {
    const validation = validateCoupon(code, items, customer, orderTotal);

    if (!validation.valid) {
      conflicts.push(`${code}: ${validation.error}`);
      continue;
    }

    if (!validation.coupon) continue;

    // Check if we already have a non-stackable coupon
    if (hasNonStackable) {
      warnings.push(`${code}: Cannot be combined with other coupons`);
      continue;
    }

    // Check if this coupon is stackable
    if (!validation.coupon.isStackable) {
      if (appliedCoupons.length > 0) {
        warnings.push(`${code}: Cannot be combined with other coupons`);
        continue;
      }
      hasNonStackable = true;
    }

    appliedCoupons.push(validation.coupon);
    totalDiscount += validation.discount;
  }

  return {
    totalDiscount,
    appliedCoupons,
    conflicts,
    warnings,
  };
}

// ============================================================================
// Loyalty Points
// ============================================================================

/**
 * Get default loyalty config
 */
export function getDefaultLoyaltyConfig(): LoyaltyPointsConfig {
  return {
    pointsPerDollar: 1, // 1 point per dollar spent
    dollarsPerPoint: 0.01, // 1 point = $0.01
    tierMultipliers: {
      vip: 3,
      wholesale: 2,
      regular: 1,
      new: 1.5,
    },
    minimumRedemption: 100, // Minimum 100 points to redeem
    expirationDays: 365, // Points expire after 1 year
  };
}

/**
 * Get loyalty config
 */
export function getLoyaltyConfig(): LoyaltyPointsConfig {
  try {
    const stored = localStorage.getItem(LOYALTY_CONFIG_KEY);
    return stored ? JSON.parse(stored) : getDefaultLoyaltyConfig();
  } catch {
    return getDefaultLoyaltyConfig();
  }
}

/**
 * Save loyalty config
 */
export function saveLoyaltyConfig(config: LoyaltyPointsConfig): void {
  localStorage.setItem(LOYALTY_CONFIG_KEY, JSON.stringify(config));
}

/**
 * Get loyalty account
 */
export function getLoyaltyAccount(customerId: string): LoyaltyAccount {
  try {
    const stored = localStorage.getItem(LOYALTY_KEY);
    const accounts = stored ? JSON.parse(stored) : {};

    if (accounts[customerId]) {
      const account = accounts[customerId];
      return {
        ...account,
        expiringPoints: account.expiringPoints?.map((ep: any) => ({
          ...ep,
          expiryDate: new Date(ep.expiryDate),
        })),
        transactions: account.transactions.map((t: any) => ({
          ...t,
          timestamp: new Date(t.timestamp),
        })),
      };
    }

    // Create new account
    return {
      customerId,
      points: 0,
      lifetimePoints: 0,
      tier: 'regular',
      expiringPoints: [],
      transactions: [],
    };
  } catch {
    return {
      customerId,
      points: 0,
      lifetimePoints: 0,
      tier: 'regular',
      expiringPoints: [],
      transactions: [],
    };
  }
}

/**
 * Save loyalty account
 */
export function saveLoyaltyAccount(account: LoyaltyAccount): void {
  try {
    const stored = localStorage.getItem(LOYALTY_KEY);
    const accounts = stored ? JSON.parse(stored) : {};
    accounts[account.customerId] = account;
    localStorage.setItem(LOYALTY_KEY, JSON.stringify(accounts));
  } catch {
    // Ignore errors
  }
}

/**
 * Calculate loyalty points earned
 */
export function calculateLoyaltyPointsEarned(
  finalPrice: number,
  customerTier: string
): number {
  const config = getLoyaltyConfig();
  const basePoints = finalPrice * config.pointsPerDollar;
  const multiplier = config.tierMultipliers[customerTier] || 1;
  return Math.floor(basePoints * multiplier);
}

/**
 * Add loyalty points
 */
export function addLoyaltyPoints(
  customerId: string,
  points: number,
  description: string,
  orderId?: string
): LoyaltyAccount {
  const account = getLoyaltyAccount(customerId);

  const transaction: LoyaltyTransaction = {
    id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    customerId,
    type: 'earned',
    points,
    description,
    orderId,
    timestamp: new Date(),
  };

  account.points += points;
  account.lifetimePoints += points;
  account.transactions.unshift(transaction);

  // Add to expiring points
  const config = getLoyaltyConfig();
  if (config.expirationDays) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + config.expirationDays);
    account.expiringPoints = account.expiringPoints || [];
    account.expiringPoints.push({ points, expiryDate });
  }

  saveLoyaltyAccount(account);
  return account;
}

/**
 * Redeem loyalty points
 */
export function redeemLoyaltyPoints(
  customerId: string,
  points: number,
  description: string
): { success: boolean; error?: string; dollarValue?: number } {
  const config = getLoyaltyConfig();
  const account = getLoyaltyAccount(customerId);

  if (points < config.minimumRedemption) {
    return {
      success: false,
      error: `Minimum redemption is ${config.minimumRedemption} points`,
    };
  }

  if (account.points < points) {
    return {
      success: false,
      error: `Insufficient points. You have ${account.points} points`,
    };
  }

  const transaction: LoyaltyTransaction = {
    id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    customerId,
    type: 'redeemed',
    points: -points,
    description,
    timestamp: new Date(),
  };

  account.points -= points;
  account.transactions.unshift(transaction);

  saveLoyaltyAccount(account);

  const dollarValue = points * config.dollarsPerPoint;

  return {
    success: true,
    dollarValue,
  };
}

/**
 * Check and expire old points
 */
export function expireOldPoints(customerId: string): number {
  const account = getLoyaltyAccount(customerId);
  const now = new Date();
  let expiredTotal = 0;

  if (!account.expiringPoints) return 0;

  const remainingPoints = account.expiringPoints.filter((ep) => {
    if (ep.expiryDate < now) {
      expiredTotal += ep.points;
      return false;
    }
    return true;
  });

  if (expiredTotal > 0) {
    account.expiringPoints = remainingPoints;
    account.points -= expiredTotal;

    const transaction: LoyaltyTransaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customerId,
      type: 'expired',
      points: -expiredTotal,
      description: 'Points expired',
      timestamp: now,
    };

    account.transactions.unshift(transaction);
    saveLoyaltyAccount(account);
  }

  return expiredTotal;
}

// ============================================================================
// Serialization
// ============================================================================

function serializeCoupon(coupon: Coupon): any {
  return {
    ...coupon,
    validFrom: coupon.validFrom.toISOString(),
    validUntil: coupon.validUntil.toISOString(),
    createdAt: coupon.createdAt.toISOString(),
    updatedAt: coupon.updatedAt.toISOString(),
  };
}

function deserializeCoupon(coupon: any): Coupon {
  return {
    ...coupon,
    validFrom: new Date(coupon.validFrom),
    validUntil: new Date(coupon.validUntil),
    createdAt: new Date(coupon.createdAt),
    updatedAt: new Date(coupon.updatedAt),
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate coupon configuration
 */
export function validateCouponConfig(
  coupon: Partial<Coupon>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!coupon.code || coupon.code.trim() === '') {
    errors.push('Coupon code is required');
  }

  if (!coupon.type) {
    errors.push('Coupon type is required');
  }

  if (coupon.value === undefined || coupon.value < 0) {
    errors.push('Coupon value must be non-negative');
  }

  if (coupon.type === 'percentage' && coupon.value && coupon.value > 100) {
    errors.push('Percentage discount cannot exceed 100%');
  }

  if (coupon.validFrom && coupon.validUntil && coupon.validFrom > coupon.validUntil) {
    errors.push('Valid until date must be after valid from date');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get coupon statistics
 */
export function getCouponStatistics(): {
  totalCoupons: number;
  activeCoupons: number;
  totalRedemptions: number;
  topCoupons: { coupon: Coupon; redemptions: number }[];
} {
  const allCoupons = getAllCoupons();
  const activeCoupons = getActiveCoupons();

  const totalRedemptions = allCoupons.reduce((sum, coupon) => sum + coupon.usageCount, 0);

  const topCoupons = [...allCoupons]
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 5)
    .map((coupon) => ({ coupon, redemptions: coupon.usageCount }));

  return {
    totalCoupons: allCoupons.length,
    activeCoupons: activeCoupons.length,
    totalRedemptions,
    topCoupons,
  };
}
