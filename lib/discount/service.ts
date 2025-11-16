import { supabase } from '@/lib/supabase/client';
import {
  DiscountCode,
  DiscountRule,
  CouponRedemption,
  PromotionalCampaign,
  DiscountAnalytics,
  DiscountWithDetails,
} from '@/types';

/**
 * Discount Management Service
 * Handles coupon codes, promotional campaigns, and discount analytics
 */

/**
 * Create a new discount/coupon code
 */
export async function createDiscountCode(
  userId: string,
  codeData: {
    code: string;
    description?: string;
    discountType: string;
    discountValue: number;
    currency?: string;
    usageLimit?: number;
    usagePerCustomer?: number;
    minimumOrderValue?: number;
    maximumDiscountAmount?: number;
    applicableTo?: string;
    startDate?: Date;
    endDate?: Date;
    isStackable?: boolean;
    isExclusive?: boolean;
    autoApply?: boolean;
    notes?: string;
  }
): Promise<DiscountCode | null> {
  try {
    const { data, error } = await supabase
      .from('discount_codes')
      .insert({
        user_id: userId,
        code: codeData.code.toUpperCase(),
        description: codeData.description,
        discount_type: codeData.discountType,
        discount_value: codeData.discountValue,
        currency: codeData.currency || 'USD',
        status: 'active',
        usage_limit: codeData.usageLimit,
        usage_per_customer: codeData.usagePerCustomer,
        minimum_order_value: codeData.minimumOrderValue,
        maximum_discount_amount: codeData.maximumDiscountAmount,
        applicable_to: codeData.applicableTo || 'all',
        start_date: codeData.startDate,
        end_date: codeData.endDate,
        is_stackable: codeData.isStackable || false,
        is_exclusive: codeData.isExclusive || false,
        auto_apply: codeData.autoApply || false,
        notes: codeData.notes,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating discount code:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createDiscountCode:', error);
    return null;
  }
}

/**
 * Validate if a coupon code can be applied
 */
export async function validateCouponCode(
  userId: string,
  code: string,
  customerId?: string,
  orderValue?: number
): Promise<{ valid: boolean; reason?: string; discount?: DiscountCode }> {
  try {
    const { data: discountCode, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('user_id', userId)
      .eq('code', code.toUpperCase())
      .single();

    if (error || !discountCode) {
      return { valid: false, reason: 'Coupon code not found' };
    }

    // Check if code is active
    if (discountCode.status !== 'active') {
      return { valid: false, reason: `Coupon code is ${discountCode.status}` };
    }

    // Check date validity
    const now = new Date();
    if (discountCode.start_date && new Date(discountCode.start_date) > now) {
      return { valid: false, reason: 'Coupon code has not started yet' };
    }
    if (discountCode.end_date && new Date(discountCode.end_date) < now) {
      return { valid: false, reason: 'Coupon code has expired' };
    }

    // Check usage limit
    if (
      discountCode.usage_limit &&
      discountCode.current_usage_count >= discountCode.usage_limit
    ) {
      return { valid: false, reason: 'Coupon code usage limit exceeded' };
    }

    // Check minimum order value
    if (
      orderValue &&
      discountCode.minimum_order_value &&
      orderValue < discountCode.minimum_order_value
    ) {
      return {
        valid: false,
        reason: `Minimum order value of $${discountCode.minimum_order_value} required`,
      };
    }

    // Check per-customer usage limit
    if (discountCode.usage_per_customer && customerId) {
      const { data: customerRedemptions } = await supabase
        .from('coupon_redemptions')
        .select('id')
        .eq('discount_code_id', discountCode.id)
        .eq('customer_id', customerId);

      if (
        customerRedemptions &&
        customerRedemptions.length >= discountCode.usage_per_customer
      ) {
        return {
          valid: false,
          reason: 'You have reached the redemption limit for this coupon',
        };
      }
    }

    return { valid: true, discount: discountCode };
  } catch (error) {
    console.error('Error validating coupon code:', error);
    return { valid: false, reason: 'Error validating coupon code' };
  }
}

/**
 * Apply/redeem a coupon code
 */
export async function redeemCoupon(
  userId: string,
  discountCodeId: string,
  customerId: string,
  orderId?: string,
  discountAmount?: number
): Promise<CouponRedemption | null> {
  try {
    // Get the discount code
    const { data: discountCode } = await supabase
      .from('discount_codes')
      .select('code')
      .eq('id', discountCodeId)
      .single();

    if (!discountCode) {
      return null;
    }

    // Record redemption
    const { data, error } = await supabase
      .from('coupon_redemptions')
      .insert({
        user_id: userId,
        discount_code_id: discountCodeId,
        customer_id: customerId,
        order_id: orderId,
        code: discountCode.code,
        discount_amount: discountAmount || 0,
        redeemed_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error redeeming coupon:', error);
      return null;
    }

    // Increment usage count
    await supabase.rpc('increment_discount_usage', {
      p_discount_code_id: discountCodeId,
    });

    return data;
  } catch (error) {
    console.error('Error in redeemCoupon:', error);
    return null;
  }
}

/**
 * Add rule to discount code
 */
export async function addDiscountRule(
  userId: string,
  discountCodeId: string,
  rule: {
    ruleType: string;
    conditionOperator?: string;
    conditionValue?: Record<string, any>;
    discountValue: number;
    priority?: number;
  }
): Promise<DiscountRule | null> {
  try {
    const { data, error } = await supabase
      .from('discount_rules')
      .insert({
        user_id: userId,
        discount_code_id: discountCodeId,
        rule_type: rule.ruleType,
        condition_operator: rule.conditionOperator,
        condition_value: rule.conditionValue,
        discount_value: rule.discountValue,
        priority: rule.priority || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding discount rule:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in addDiscountRule:', error);
    return null;
  }
}

/**
 * Get discount code with all details
 */
export async function getDiscountCodeWithDetails(
  discountCodeId: string
): Promise<DiscountWithDetails | null> {
  try {
    const { data: code } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('id', discountCodeId)
      .single();

    if (!code) {
      return null;
    }

    // Fetch related data
    const [
      { data: rules },
      { data: products },
      { data: categories },
      { data: segments },
      { data: redemptions },
      { data: analytics },
    ] = await Promise.all([
      supabase
        .from('discount_rules')
        .select('*')
        .eq('discount_code_id', discountCodeId),
      supabase
        .from('discount_code_products')
        .select('*')
        .eq('discount_code_id', discountCodeId),
      supabase
        .from('discount_code_categories')
        .select('*')
        .eq('discount_code_id', discountCodeId),
      supabase
        .from('discount_code_segments')
        .select('*')
        .eq('discount_code_id', discountCodeId),
      supabase
        .from('coupon_redemptions')
        .select('*')
        .eq('discount_code_id', discountCodeId),
      supabase
        .from('discount_analytics')
        .select('*')
        .eq('discount_code_id', discountCodeId),
    ]);

    return {
      ...code,
      rules: rules || [],
      applicableProducts: products || [],
      applicableCategories: categories || [],
      applicableSegments: segments || [],
      redemptions: redemptions || [],
      analytics: analytics || [],
    };
  } catch (error) {
    console.error('Error fetching discount code details:', error);
    return null;
  }
}

/**
 * Create promotional campaign
 */
export async function createPromotionalCampaign(
  userId: string,
  campaign: {
    campaignName: string;
    description?: string;
    campaignType: string;
    targetAudience?: string;
    startDate?: Date;
    endDate?: Date;
    budgetLimit?: number;
    minPurchaseAmount?: number;
    discountCodes?: string[];
    marketingChannel?: string;
    campaignNotes?: string;
  }
): Promise<PromotionalCampaign | null> {
  try {
    const { data, error } = await supabase
      .from('promotional_campaigns')
      .insert({
        user_id: userId,
        campaign_name: campaign.campaignName,
        description: campaign.description,
        campaign_type: campaign.campaignType,
        status: 'draft',
        target_audience: campaign.targetAudience || 'all',
        start_date: campaign.startDate,
        end_date: campaign.endDate,
        budget_limit: campaign.budgetLimit,
        min_purchase_amount: campaign.minPurchaseAmount,
        discount_codes: campaign.discountCodes || [],
        marketing_channel: campaign.marketingChannel,
        campaign_notes: campaign.campaignNotes,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating promotional campaign:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createPromotionalCampaign:', error);
    return null;
  }
}

/**
 * Update campaign status
 */
export async function updateCampaignStatus(
  campaignId: string,
  status: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('promotional_campaigns')
      .update({ status })
      .eq('id', campaignId);

    if (error) {
      console.error('Error updating campaign status:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateCampaignStatus:', error);
    return false;
  }
}

/**
 * Record discount analytics
 */
export async function recordDiscountAnalytics(
  userId: string,
  analytics: {
    discountCodeId?: string;
    campaignId?: string;
    date: Date;
    totalRedemptions: number;
    totalDiscountAmount: number;
    averageOrderValue?: number;
    ordersCreated?: number;
    customersReached?: number;
    conversionRate?: number;
  }
): Promise<DiscountAnalytics | null> {
  try {
    const { data, error } = await supabase
      .from('discount_analytics')
      .insert({
        user_id: userId,
        discount_code_id: analytics.discountCodeId,
        campaign_id: analytics.campaignId,
        date: analytics.date,
        total_redemptions: analytics.totalRedemptions,
        total_discount_amount: analytics.totalDiscountAmount,
        average_order_value: analytics.averageOrderValue,
        orders_created: analytics.ordersCreated || 0,
        customers_reached: analytics.customersReached || 0,
        conversion_rate: analytics.conversionRate,
      })
      .select()
      .single();

    if (error) {
      console.error('Error recording discount analytics:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in recordDiscountAnalytics:', error);
    return null;
  }
}

/**
 * Get discount codes by user with filters
 */
export async function getDiscountCodes(
  userId: string,
  filters?: {
    status?: string;
    applicableTo?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ codes: DiscountCode[]; total: number }> {
  try {
    let query = supabase
      .from('discount_codes')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.applicableTo) {
      query = query.eq('applicable_to', filters.applicableTo);
    }

    const { data: codes, count, error } = await query
      .order('created_at', { ascending: false })
      .range(filters?.offset || 0, (filters?.offset || 0) + (filters?.limit || 50) - 1);

    if (error) {
      console.error('Error fetching discount codes:', error);
      return { codes: [], total: 0 };
    }

    return { codes: codes || [], total: count || 0 };
  } catch (error) {
    console.error('Error in getDiscountCodes:', error);
    return { codes: [], total: 0 };
  }
}

/**
 * Calculate applicable discount for order
 */
export async function calculateOrderDiscount(
  userId: string,
  code: string,
  orderValue: number,
  applicableItems?: { productId: string; quantity: number; price: number }[]
): Promise<{ discountAmount: number; discountPercent?: number } | null> {
  try {
    const { valid, discount } = await validateCouponCode(
      userId,
      code,
      undefined,
      orderValue
    );

    if (!valid || !discount) {
      return null;
    }

    let discountAmount = 0;

    if (discount.discount_type === 'percentage') {
      discountAmount = (orderValue * discount.discount_value) / 100;
    } else if (discount.discount_type === 'fixed_amount') {
      discountAmount = discount.discount_value;
    }

    // Cap at maximum discount
    if (discount.maximum_discount_amount) {
      discountAmount = Math.min(discountAmount, discount.maximum_discount_amount);
    }

    return {
      discountAmount: Math.min(discountAmount, orderValue),
      discountPercent: discount.discount_type === 'percentage' ? discount.discount_value : undefined,
    };
  } catch (error) {
    console.error('Error calculating order discount:', error);
    return null;
  }
}

/**
 * Get campaign analytics
 */
export async function getCampaignAnalytics(
  campaignId: string,
  startDate?: Date,
  endDate?: Date
): Promise<DiscountAnalytics[]> {
  try {
    let query = supabase
      .from('discount_analytics')
      .select('*')
      .eq('campaign_id', campaignId);

    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query.order('date', { ascending: true });

    if (error) {
      console.error('Error fetching campaign analytics:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getCampaignAnalytics:', error);
    return [];
  }
}
