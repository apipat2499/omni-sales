/**
 * useCouponManagement Hook
 * Manages coupons, validation, and redemption
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { OrderItem, Customer } from '@/types';
import {
  getAllCoupons,
  getActiveCoupons,
  getCouponByCode,
  createCoupon as createCouponUtil,
  updateCoupon as updateCouponUtil,
  deleteCoupon as deleteCouponUtil,
  generateBulkCoupons as generateBulkCouponsUtil,
  generateCouponCode,
  validateCoupon as validateCouponUtil,
  redeemCoupon as redeemCouponUtil,
  calculateCouponDiscount,
  calculateStackedDiscounts,
  getCustomerCouponUsage,
  validateCouponConfig,
  getCouponStatistics,
  getLoyaltyAccount,
  saveLoyaltyAccount,
  getLoyaltyConfig,
  saveLoyaltyConfig,
  calculateLoyaltyPointsEarned,
  addLoyaltyPoints,
  redeemLoyaltyPoints,
  expireOldPoints,
  type Coupon,
  type CouponType,
  type CouponValidation,
  type DiscountStackingResult,
  type LoyaltyAccount,
  type LoyaltyPointsConfig,
  type LoyaltyTransaction,
} from '@/lib/utils/discount-calculator';

export interface UseCouponManagementOptions {
  autoLoad?: boolean;
  filterActive?: boolean;
}

export interface UseCouponManagementReturn {
  // State
  coupons: Coupon[];
  activeCoupons: Coupon[];
  loading: boolean;
  error: string | null;

  // CRUD operations
  createCoupon: (coupon: Omit<Coupon, 'usageCount' | 'createdAt' | 'updatedAt'>) => Promise<Coupon>;
  updateCoupon: (code: string, updates: Partial<Omit<Coupon, 'code' | 'createdAt'>>) => Promise<Coupon | null>;
  deleteCoupon: (code: string) => Promise<boolean>;
  generateBulkCoupons: (count: number, config: Omit<Coupon, 'code' | 'usageCount' | 'createdAt' | 'updatedAt'>) => Promise<string[]>;
  generateCode: (prefix?: string, length?: number) => string;

  // Validation and redemption
  validateCoupon: (code: string, items: OrderItem[], customer: Customer, orderTotal: number) => Promise<CouponValidation>;
  redeemCoupon: (code: string, customerId: string) => Promise<boolean>;
  calculateDiscount: (items: OrderItem[], coupon: Coupon, orderTotal: number) => number;
  stackCoupons: (items: OrderItem[], customer: Customer, codes: string[], orderTotal: number) => DiscountStackingResult;

  // Usage tracking
  getUsage: (customerId: string, code: string) => number;

  // Utility
  refresh: () => Promise<void>;
  validateConfig: (coupon: Partial<Coupon>) => { valid: boolean; errors: string[] };

  // Statistics
  statistics: {
    totalCoupons: number;
    activeCoupons: number;
    totalRedemptions: number;
    topCoupons: { coupon: Coupon; redemptions: number }[];
  };
}

/**
 * Hook for managing coupons
 */
export function useCouponManagement(options: UseCouponManagementOptions = {}): UseCouponManagementReturn {
  const { autoLoad = true, filterActive = false } = options;

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load coupons from storage
   */
  const loadCoupons = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const loadedCoupons = filterActive ? getActiveCoupons() : getAllCoupons();
      setCoupons(loadedCoupons);
    } catch (err) {
      console.error('Error loading coupons:', err);
      setError(err instanceof Error ? err.message : 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  }, [filterActive]);

  /**
   * Initial load
   */
  useEffect(() => {
    if (autoLoad) {
      loadCoupons();
    }
  }, [autoLoad, loadCoupons]);

  /**
   * Get active coupons
   */
  const activeCoupons = useMemo(() => {
    return getActiveCoupons();
  }, [coupons]);

  /**
   * Create new coupon
   */
  const createCouponHandler = useCallback(
    async (coupon: Omit<Coupon, 'usageCount' | 'createdAt' | 'updatedAt'>): Promise<Coupon> => {
      try {
        setError(null);

        // Validate coupon
        const validation = validateCouponConfig(coupon as Partial<Coupon>);
        if (!validation.valid) {
          throw new Error(validation.errors.join(', '));
        }

        const newCoupon = createCouponUtil(coupon);
        await loadCoupons();
        return newCoupon;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to create coupon';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [loadCoupons]
  );

  /**
   * Update coupon
   */
  const updateCouponHandler = useCallback(
    async (
      code: string,
      updates: Partial<Omit<Coupon, 'code' | 'createdAt'>>
    ): Promise<Coupon | null> => {
      try {
        setError(null);

        const updated = updateCouponUtil(code, updates);
        if (!updated) {
          throw new Error('Coupon not found');
        }

        await loadCoupons();
        return updated;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update coupon';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [loadCoupons]
  );

  /**
   * Delete coupon
   */
  const deleteCouponHandler = useCallback(
    async (code: string): Promise<boolean> => {
      try {
        setError(null);

        const success = deleteCouponUtil(code);
        if (!success) {
          throw new Error('Coupon not found');
        }

        await loadCoupons();
        return success;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to delete coupon';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [loadCoupons]
  );

  /**
   * Generate bulk coupons
   */
  const generateBulkCouponsHandler = useCallback(
    async (
      count: number,
      config: Omit<Coupon, 'code' | 'usageCount' | 'createdAt' | 'updatedAt'>
    ): Promise<string[]> => {
      try {
        setError(null);

        const codes = generateBulkCouponsUtil(count, config);
        await loadCoupons();
        return codes;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to generate coupons';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [loadCoupons]
  );

  /**
   * Generate coupon code
   */
  const generateCodeHandler = useCallback((prefix?: string, length?: number): string => {
    return generateCouponCode(prefix, length);
  }, []);

  /**
   * Validate coupon
   */
  const validateCouponHandler = useCallback(
    async (
      code: string,
      items: OrderItem[],
      customer: Customer,
      orderTotal: number
    ): Promise<CouponValidation> => {
      try {
        setError(null);
        return validateCouponUtil(code, items, customer, orderTotal);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to validate coupon';
        setError(errorMsg);
        return {
          valid: false,
          discount: 0,
          error: errorMsg,
        };
      }
    },
    []
  );

  /**
   * Redeem coupon
   */
  const redeemCouponHandler = useCallback(
    async (code: string, customerId: string): Promise<boolean> => {
      try {
        setError(null);

        const success = redeemCouponUtil(code, customerId);
        if (!success) {
          throw new Error('Failed to redeem coupon');
        }

        await loadCoupons();
        return success;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to redeem coupon';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [loadCoupons]
  );

  /**
   * Calculate coupon discount
   */
  const calculateDiscountHandler = useCallback(
    (items: OrderItem[], coupon: Coupon, orderTotal: number): number => {
      return calculateCouponDiscount(items, coupon, orderTotal);
    },
    []
  );

  /**
   * Stack multiple coupons
   */
  const stackCouponsHandler = useCallback(
    (
      items: OrderItem[],
      customer: Customer,
      codes: string[],
      orderTotal: number
    ): DiscountStackingResult => {
      return calculateStackedDiscounts(items, customer, codes, orderTotal);
    },
    []
  );

  /**
   * Get customer usage for a coupon
   */
  const getUsageHandler = useCallback((customerId: string, code: string): number => {
    return getCustomerCouponUsage(customerId, code);
  }, []);

  /**
   * Refresh coupons
   */
  const refresh = useCallback(async () => {
    await loadCoupons();
  }, [loadCoupons]);

  /**
   * Validate coupon configuration
   */
  const validateConfigHandler = useCallback((coupon: Partial<Coupon>) => {
    return validateCouponConfig(coupon);
  }, []);

  /**
   * Get statistics
   */
  const statistics = useMemo(() => {
    return getCouponStatistics();
  }, [coupons]);

  return {
    coupons,
    activeCoupons,
    loading,
    error,

    createCoupon: createCouponHandler,
    updateCoupon: updateCouponHandler,
    deleteCoupon: deleteCouponHandler,
    generateBulkCoupons: generateBulkCouponsHandler,
    generateCode: generateCodeHandler,

    validateCoupon: validateCouponHandler,
    redeemCoupon: redeemCouponHandler,
    calculateDiscount: calculateDiscountHandler,
    stackCoupons: stackCouponsHandler,

    getUsage: getUsageHandler,

    refresh,
    validateConfig: validateConfigHandler,

    statistics,
  };
}

/**
 * Hook for managing loyalty points
 */
export interface UseLoyaltyPointsReturn {
  // Account state
  account: LoyaltyAccount | null;
  config: LoyaltyPointsConfig;
  loading: boolean;
  error: string | null;

  // Operations
  earnPoints: (customerId: string, finalPrice: number, tier: string, description: string, orderId?: string) => Promise<LoyaltyAccount>;
  redeemPoints: (customerId: string, points: number, description: string) => Promise<{ success: boolean; error?: string; dollarValue?: number }>;
  checkExpired: (customerId: string) => Promise<number>;
  getAccount: (customerId: string) => LoyaltyAccount;

  // Config
  updateConfig: (config: LoyaltyPointsConfig) => void;

  // Utility
  refresh: (customerId: string) => void;
}

export function useLoyaltyPoints(customerId?: string): UseLoyaltyPointsReturn {
  const [account, setAccount] = useState<LoyaltyAccount | null>(null);
  const [config, setConfig] = useState<LoyaltyPointsConfig>(getLoyaltyConfig());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load account
   */
  const loadAccount = useCallback((id: string) => {
    try {
      setLoading(true);
      setError(null);
      const acc = getLoyaltyAccount(id);
      setAccount(acc);
    } catch (err) {
      console.error('Error loading loyalty account:', err);
      setError(err instanceof Error ? err.message : 'Failed to load loyalty account');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Initial load
   */
  useEffect(() => {
    if (customerId) {
      loadAccount(customerId);
    }
  }, [customerId, loadAccount]);

  /**
   * Earn points
   */
  const earnPointsHandler = useCallback(
    async (
      custId: string,
      finalPrice: number,
      tier: string,
      description: string,
      orderId?: string
    ): Promise<LoyaltyAccount> => {
      try {
        setError(null);

        const points = calculateLoyaltyPointsEarned(finalPrice, tier);
        const updatedAccount = addLoyaltyPoints(custId, points, description, orderId);

        if (custId === customerId) {
          setAccount(updatedAccount);
        }

        return updatedAccount;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to earn points';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [customerId]
  );

  /**
   * Redeem points
   */
  const redeemPointsHandler = useCallback(
    async (
      custId: string,
      points: number,
      description: string
    ): Promise<{ success: boolean; error?: string; dollarValue?: number }> => {
      try {
        setError(null);

        const result = redeemLoyaltyPoints(custId, points, description);

        if (result.success && custId === customerId) {
          loadAccount(custId);
        }

        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to redeem points';
        setError(errorMsg);
        return {
          success: false,
          error: errorMsg,
        };
      }
    },
    [customerId, loadAccount]
  );

  /**
   * Check for expired points
   */
  const checkExpiredHandler = useCallback(
    async (custId: string): Promise<number> => {
      try {
        setError(null);

        const expired = expireOldPoints(custId);

        if (expired > 0 && custId === customerId) {
          loadAccount(custId);
        }

        return expired;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to check expired points';
        setError(errorMsg);
        return 0;
      }
    },
    [customerId, loadAccount]
  );

  /**
   * Get account
   */
  const getAccountHandler = useCallback((custId: string): LoyaltyAccount => {
    return getLoyaltyAccount(custId);
  }, []);

  /**
   * Update config
   */
  const updateConfigHandler = useCallback((newConfig: LoyaltyPointsConfig) => {
    saveLoyaltyConfig(newConfig);
    setConfig(newConfig);
  }, []);

  /**
   * Refresh account
   */
  const refresh = useCallback(
    (custId: string) => {
      loadAccount(custId);
    },
    [loadAccount]
  );

  return {
    account,
    config,
    loading,
    error,

    earnPoints: earnPointsHandler,
    redeemPoints: redeemPointsHandler,
    checkExpired: checkExpiredHandler,
    getAccount: getAccountHandler,

    updateConfig: updateConfigHandler,

    refresh,
  };
}
