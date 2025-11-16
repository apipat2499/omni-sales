# Discount & Coupon Management System Documentation

## Overview

The Discount & Coupon Management System provides comprehensive tools for creating, managing, and tracking promotional codes, discount campaigns, and coupon redemptions. Built with flexible rules engine, analytics, and multi-tenancy support.

## Database Schema

### Core Tables

#### `discount_codes`
Main discount/coupon code definitions.

**Columns:**
- `id` (uuid, PK) - Unique discount code identifier
- `user_id` (uuid, FK) - Merchant/owner ID
- `code` (varchar, unique) - Coupon code (e.g., "SUMMER20", "WELCOME10")
- `description` (text) - Code description
- `discount_type` (enum) - Type: percentage, fixed_amount, buy_x_get_y, tiered
- `discount_value` (decimal) - Discount amount or percentage
- `currency` (varchar, default: USD) - Currency for fixed amounts
- `status` (enum) - active, inactive, expired, archived
- `is_stackable` (boolean) - Can be combined with other discounts
- `is_exclusive` (boolean) - Cannot be combined with other discounts
- `usage_limit` (integer) - Max total uses (null = unlimited)
- `usage_per_customer` (integer) - Max uses per customer (null = unlimited)
- `current_usage_count` (integer) - Current redemption count
- `minimum_order_value` (decimal) - Minimum purchase amount to apply
- `maximum_discount_amount` (decimal) - Cap on discount amount
- `applicable_to` (enum) - all, specific_products, specific_categories, specific_customers
- `start_date` (timestamp) - When code becomes valid
- `end_date` (timestamp) - When code expires
- `auto_apply` (boolean) - Apply automatically if eligible
- `notes` (text) - Internal notes
- `created_at` (timestamp)
- `updated_at` (timestamp)
- `created_by` (uuid) - User who created the code

**Indexes:**
- `idx_discount_codes_user` - Filter by merchant
- `idx_discount_codes_code` - Lookup by code
- `idx_discount_codes_status` - Filter by status
- `idx_discount_codes_date_range` - Filter by date range

#### `discount_rules`
Complex rules for tiered/conditional discounts.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `discount_code_id` (uuid, FK) - Reference to discount code
- `rule_type` (enum) - quantity_based, amount_based, category_based, customer_segment
- `condition_operator` (varchar) - equals, greater_than, less_than, between
- `condition_value` (jsonb) - Flexible condition values (e.g., {min: 10, max: 20})
- `discount_value` (decimal) - Discount for this rule
- `priority` (integer) - Rule evaluation order
- `created_at` (timestamp)

**Example Rules:**
- Quantity-based: Buy 3+ items, get 10% off
- Amount-based: Orders over $100, get $20 off
- Tiered: 5-10 items = 10%, 10+ items = 15%

#### `discount_code_products`
Specific products eligible for discount.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `discount_code_id` (uuid, FK)
- `product_id` (text) - Product reference
- `product_sku` (varchar) - SKU (denormalized)
- `product_name` (varchar) - Product name (denormalized)
- `created_at` (timestamp)

#### `discount_code_categories`
Product categories eligible for discount.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `discount_code_id` (uuid, FK)
- `category_name` (varchar) - Category name
- `created_at` (timestamp)

#### `discount_code_segments`
Customer segments eligible for discount.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `discount_code_id` (uuid, FK)
- `customer_segment_id` (text) - Reference to customer segment
- `segment_name` (varchar) - Segment name (denormalized)
- `created_at` (timestamp)

#### `coupon_redemptions`
Audit trail of coupon usage.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `discount_code_id` (uuid, FK)
- `order_id` (uuid, FK) - Associated order
- `customer_id` (text) - Customer who redeemed
- `code` (varchar) - Code used (denormalized)
- `discount_amount` (decimal) - Amount discounted
- `redeemed_at` (timestamp)
- `redeemed_by` (uuid) - User who applied (for manual redemptions)
- `notes` (text)

**Indexes:**
- `idx_coupon_redemptions_code` - Lookup by code
- `idx_coupon_redemptions_order` - Find redemptions for order
- `idx_coupon_redemptions_customer` - Customer redemption history
- `idx_coupon_redemptions_date` - Timeline queries

#### `promotional_campaigns`
Marketing campaigns using discount codes.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `campaign_name` (varchar)
- `description` (text)
- `campaign_type` (enum) - seasonal, flash_sale, loyalty, bulk_discount, referral
- `status` (enum) - draft, active, paused, ended, archived
- `start_date` (timestamp)
- `end_date` (timestamp)
- `budget_limit` (decimal) - Maximum discount budget
- `budget_used` (decimal) - Tracking actual spend
- `discount_codes` (text[], array) - Associated discount codes
- `target_audience` (enum) - all, specific_segment, new_customers, vip_customers
- `min_purchase_amount` (decimal)
- `marketing_channel` (enum) - email, sms, in_app, web, social
- `campaign_notes` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)
- `created_by` (uuid)

#### `discount_analytics`
Performance metrics for discounts and campaigns.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `discount_code_id` (uuid, FK)
- `campaign_id` (uuid, FK)
- `date` (timestamp) - Metric date (usually daily rollup)
- `total_redemptions` (integer) - Times redeemed
- `total_discount_amount` (decimal) - Total discounts given
- `average_order_value` (decimal) - AOV for orders with code
- `orders_created` (integer) - Orders using this code
- `customers_reached` (integer) - Unique customers
- `conversion_rate` (decimal) - Percentage
- `created_at` (timestamp)

## TypeScript Types

```typescript
export type DiscountType = 'percentage' | 'fixed_amount' | 'buy_x_get_y' | 'tiered';
export type DiscountStatus = 'active' | 'inactive' | 'expired' | 'archived';
export type DiscountApplicableTo = 'all' | 'specific_products' | 'specific_categories' | 'specific_customers';
export type RuleType = 'quantity_based' | 'amount_based' | 'category_based' | 'customer_segment';
export type CampaignType = 'seasonal' | 'flash_sale' | 'loyalty' | 'bulk_discount' | 'referral';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'ended' | 'archived';

export interface DiscountCode {
  id: string;
  userId: string;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  currency: string;
  status: DiscountStatus;
  isStackable: boolean;
  isExclusive: boolean;
  usageLimit?: number;
  usagePerCustomer?: number;
  currentUsageCount: number;
  minimumOrderValue?: number;
  maximumDiscountAmount?: number;
  applicableTo: DiscountApplicableTo;
  startDate?: Date;
  endDate?: Date;
  autoApply: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface DiscountRule {
  id: string;
  userId: string;
  discountCodeId: string;
  ruleType: RuleType;
  conditionOperator?: 'equals' | 'greater_than' | 'less_than' | 'between';
  conditionValue?: Record<string, any>;
  discountValue: number;
  priority: number;
  createdAt: Date;
}

export interface CouponRedemption {
  id: string;
  userId: string;
  discountCodeId?: string;
  orderId?: string;
  customerId?: string;
  code: string;
  discountAmount: number;
  redeemedAt: Date;
  redeemedBy?: string;
  notes?: string;
}

export interface PromotionalCampaign {
  id: string;
  userId: string;
  campaignName: string;
  description?: string;
  campaignType: CampaignType;
  status: CampaignStatus;
  startDate?: Date;
  endDate?: Date;
  budgetLimit?: number;
  budgetUsed: number;
  discountCodes: string[];
  targetAudience: TargetAudience;
  minPurchaseAmount?: number;
  marketingChannel?: MarketingChannel;
  campaignNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface DiscountAnalytics {
  id: string;
  userId: string;
  discountCodeId?: string;
  campaignId?: string;
  date: Date;
  totalRedemptions: number;
  totalDiscountAmount: number;
  averageOrderValue?: number;
  ordersCreated: number;
  customersReached: number;
  conversionRate?: number;
  createdAt: Date;
}
```

## Service Functions

### Discount Code Management

#### `createDiscountCode(userId, codeData): Promise<DiscountCode | null>`
Create a new discount code.

```typescript
const code = await createDiscountCode(userId, {
  code: 'SUMMER20',
  description: 'Summer sale - 20% off',
  discountType: 'percentage',
  discountValue: 20,
  usageLimit: 1000,
  usagePerCustomer: 1,
  startDate: new Date('2024-06-01'),
  endDate: new Date('2024-08-31'),
  minimumOrderValue: 50
});
```

#### `validateCouponCode(userId, code, customerId?, orderValue?): Promise<validation>`
Validate if code can be applied.

**Returns:** `{ valid, reason?, discount }`

**Checks:**
- Code exists
- Status is active
- Date range is valid
- Usage limits not exceeded
- Per-customer limits not exceeded
- Minimum order value met

```typescript
const validation = await validateCouponCode(userId, 'SUMMER20', 'cust-123', 250);
if (!validation.valid) {
  console.log(validation.reason); // "Coupon code has expired"
}
```

#### `redeemCoupon(userId, discountCodeId, customerId, orderId?, discountAmount?): Promise<CouponRedemption | null>`
Apply/redeem a coupon code.

```typescript
const redemption = await redeemCoupon(
  userId,
  'discount-code-id',
  'customer-123',
  'order-456',
  50.00
);
```

#### `getDiscountCodeWithDetails(discountCodeId): Promise<DiscountWithDetails | null>`
Fetch code with all related data (rules, products, analytics, etc).

### Discount Rules Engine

#### `addDiscountRule(userId, discountCodeId, rule): Promise<DiscountRule | null>`
Add conditional discount rules.

```typescript
// Tiered discount: 5-10 items = 10%, 10+ items = 15%
await addDiscountRule(userId, discountCodeId, {
  ruleType: 'quantity_based',
  conditionOperator: 'between',
  conditionValue: { min: 5, max: 10 },
  discountValue: 10,
  priority: 1
});

await addDiscountRule(userId, discountCodeId, {
  ruleType: 'quantity_based',
  conditionOperator: 'greater_than',
  conditionValue: { value: 10 },
  discountValue: 15,
  priority: 2
});
```

### Validation & Calculation

#### `calculateOrderDiscount(userId, code, orderValue, items?): Promise<calculation | null>`
Calculate actual discount amount for order.

```typescript
const discount = await calculateOrderDiscount(userId, 'SUMMER20', 250);
// Returns: { discountAmount: 50, discountPercent: 20 }
```

### Campaign Management

#### `createPromotionalCampaign(userId, campaign): Promise<PromotionalCampaign | null>`
Create a marketing campaign.

```typescript
const campaign = await createPromotionalCampaign(userId, {
  campaignName: 'Summer Flash Sale',
  campaignType: 'flash_sale',
  targetAudience: 'all',
  startDate: new Date(),
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  budgetLimit: 5000,
  discountCodes: ['SUMMER20', 'SUMMER30'],
  marketingChannel: 'email'
});
```

#### `updateCampaignStatus(campaignId, status): Promise<boolean>`
Change campaign status (draft → active → paused → ended).

### Analytics

#### `recordDiscountAnalytics(userId, analytics): Promise<DiscountAnalytics | null>`
Record daily metrics.

```typescript
await recordDiscountAnalytics(userId, {
  discountCodeId: 'code-123',
  date: new Date(),
  totalRedemptions: 45,
  totalDiscountAmount: 2250,
  averageOrderValue: 275,
  ordersCreated: 45,
  customersReached: 42,
  conversionRate: 3.2
});
```

#### `getCampaignAnalytics(campaignId, startDate?, endDate?): Promise<DiscountAnalytics[]>`
Get analytics for date range.

#### `getDiscountCodes(userId, filters?): Promise<{codes, total}>`
List discount codes with filtering.

```typescript
const { codes, total } = await getDiscountCodes(userId, {
  status: 'active',
  applicableTo: 'all',
  limit: 50,
  offset: 0
});
```

## API Endpoints

### Discount Codes

**GET** `/api/discounts/codes`

**Query Parameters:**
- `userId` (required) - Merchant ID
- `status` (optional) - Filter by status
- `applicableTo` (optional) - Filter by applicability
- `limit` (default: 50)
- `offset` (default: 0)

**Response:**
```json
{
  "data": [
    {
      "id": "code-123",
      "code": "SUMMER20",
      "discountType": "percentage",
      "discountValue": 20,
      "status": "active",
      "currentUsageCount": 145,
      "usageLimit": 1000
    }
  ],
  "total": 45,
  "limit": 50,
  "offset": 0
}
```

**POST** `/api/discounts/codes`

**Request Body:**
```json
{
  "userId": "user-123",
  "code": "SUMMER20",
  "description": "Summer sale 20% off",
  "discountType": "percentage",
  "discountValue": 20,
  "usageLimit": 1000,
  "minimumOrderValue": 50,
  "startDate": "2024-06-01T00:00:00Z",
  "endDate": "2024-08-31T23:59:59Z"
}
```

### Coupon Validation

**POST** `/api/discounts/validate`

**Request Body:**
```json
{
  "userId": "user-123",
  "code": "SUMMER20",
  "customerId": "cust-123",
  "orderValue": 250
}
```

**Response:**
```json
{
  "valid": true,
  "discount": {
    "id": "code-123",
    "code": "SUMMER20",
    "discountType": "percentage",
    "discountValue": 20,
    "discountAmount": 50,
    "currency": "USD"
  }
}
```

**Error Response:**
```json
{
  "valid": false,
  "reason": "Minimum order value of $50 required"
}
```

### Coupon Redemption

**POST** `/api/discounts/redeem`

**Request Body:**
```json
{
  "userId": "user-123",
  "discountCodeId": "code-123",
  "customerId": "cust-123",
  "orderId": "order-456",
  "discountAmount": 50.00
}
```

**Response:** `201 Created`
```json
{
  "id": "redemption-789",
  "code": "SUMMER20",
  "discountAmount": 50.00,
  "redeemedAt": "2024-06-15T10:30:00Z"
}
```

### Campaigns

**GET** `/api/discounts/campaigns`

**POST** `/api/discounts/campaigns`

### Analytics

**GET** `/api/discounts/analytics`

**POST** `/api/discounts/analytics`

## Integration Examples

### Checkout Flow

```typescript
// 1. Validate coupon on checkout
const validation = await validateCouponCode(
  userId,
  couponCode,
  customerId,
  cartTotal
);

if (!validation.valid) {
  showError(validation.reason);
  return;
}

// 2. Calculate discount
const discount = await calculateOrderDiscount(
  userId,
  couponCode,
  cartTotal,
  cartItems
);

// 3. Display discount to customer
displayDiscount(discount.discountAmount);

// 4. After order creation, redeem coupon
await redeemCoupon(
  userId,
  validation.discount.id,
  customerId,
  orderId,
  discount.discountAmount
);
```

### Campaign Setup

```typescript
// Create campaign
const campaign = await createPromotionalCampaign(userId, {
  campaignName: 'Holiday Sale 2024',
  campaignType: 'seasonal',
  startDate: new Date('2024-11-01'),
  endDate: new Date('2024-12-31'),
  budgetLimit: 10000,
  discountCodes: ['BLACK30', 'CYBER40'],
  targetAudience: 'all',
  marketingChannel: 'email'
});

// Activate campaign
await updateCampaignStatus(campaign.id, 'active');

// Track performance
const analytics = await getCampaignAnalytics(
  campaign.id,
  new Date('2024-11-01'),
  new Date()
);

// Record daily metrics
await recordDiscountAnalytics(userId, {
  campaignId: campaign.id,
  date: new Date(),
  totalRedemptions: 234,
  totalDiscountAmount: 5670,
  ordersCreated: 234,
  conversionRate: 4.5
});
```

## Discount Types

### Percentage
Give X% off.
```
discount_type: 'percentage'
discount_value: 20  // 20% off
```

### Fixed Amount
Subtract fixed dollar amount.
```
discount_type: 'fixed_amount'
discount_value: 50  // $50 off
```

### Buy X Get Y
Buy X items, get Y free/discounted.
```
discount_type: 'buy_x_get_y'
discount_value: can store as 2 1 (buy 2 get 1)
```

### Tiered
Different discounts based on quantity/value.
```
discount_type: 'tiered'
// Use discount_rules table for different tiers
```

## Best Practices

### Code Naming
- Use uppercase: `SUMMER20`, `WELCOME10`
- Make codes memorable
- Include campaign identifier: `BF2024_30` for Black Friday

### Expiration Strategy
- Always set end dates for promotional codes
- Stagger expiration dates for campaigns
- Archive inactive codes regularly

### Usage Limits
- Set per-customer limits for fairness
- Total limits for budget control
- Leave unlimited for permanent discounts

### Validation
- Always validate on server-side checkout
- Validate minimum order values
- Check customer eligibility (new vs returning)

### Analytics
- Record redemptions immediately
- Track budget usage daily
- Monitor conversion rate by campaign
- Identify underperforming codes

### Performance
- Index on `code` for fast lookup
- Index on `discount_code_id` for relations
- Index on `redeemed_at` for timeline queries
- Denormalize code string for auditing

## Compliance

### GDPR/Privacy
- Customer IDs stored for analytics only
- Redemptions tied to orders for audit
- Soft delete codes (archive status)
- Retention policies for old redemptions

### Fraud Prevention
- Per-customer usage limits
- IP-based rate limiting (client-side)
- Order value validation
- Suspicious pattern detection

## Troubleshooting

### Common Issues

**Coupon not working**
- Check status (must be 'active')
- Verify start/end dates
- Check usage limits
- Verify minimum order value
- Confirm customer segment eligibility

**Discount amount incorrect**
- Check discount_type (percentage vs fixed)
- Verify maximum_discount_amount cap
- Check for stacking restrictions
- Validate order eligibility

**Analytics not updating**
- Ensure redemptions recorded
- Check date format consistency
- Verify campaign/code IDs match
- Use POST /api/discounts/analytics to record

## Performance Optimization

- Cache active codes (invalidate on status change)
- Pre-calculate tiered rules
- Batch analytics record
- Use database triggers for usage count
- Archive old redemptions to archive table
