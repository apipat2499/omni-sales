# Loyalty & Rewards Management System Documentation

## Overview

The Loyalty & Rewards Management System enables merchants to create and manage comprehensive loyalty programs that increase customer retention and lifetime value. Features include points-based systems, tiered programs, referral rewards, and detailed analytics.

## Database Schema

### Core Tables

#### `loyalty_programs`
Program configuration and settings.

**Columns:**
- `id` (uuid, PK) - Unique program ID
- `user_id` (uuid, FK) - Merchant ID
- `name` (varchar) - Program name
- `description` (text) - Program description
- `program_type` (varchar) - points, tier, referral, vip
- `is_active` (boolean) - Active status
- `point_multiplier` (decimal) - Points earned per dollar spent
- `min_purchase_for_points` (decimal) - Minimum purchase to earn points
- `point_expiry_days` (integer) - Days before points expire
- `tier_structure` (jsonb) - Tier configuration
- `rewards` (jsonb) - Reward definitions
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `loyalty_tiers`
Customer tier levels (Bronze, Silver, Gold, Platinum, etc).

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `loyalty_program_id` (uuid, FK)
- `tier_name` (varchar) - Bronze, Silver, Gold, Platinum
- `tier_level` (integer) - 1, 2, 3, 4 (sort order)
- `min_points` (integer) - Minimum points for tier
- `max_points` (integer) - Maximum points for tier
- `min_annual_spending` (decimal) - Min spending to maintain
- `max_annual_spending` (decimal) - Max spending for tier
- `points_multiplier` (decimal) - Bonus multiplier
- `bonus_points_on_join` (integer) - Welcome points
- `exclusive_benefits` (text[]) - Tier benefits
- `color_hex` (varchar) - Display color
- `icon_url` (varchar) - Tier icon
- `is_vip` (boolean) - VIP tier flag
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `loyalty_point_rules`
Rules for earning points based on customer actions.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `loyalty_program_id` (uuid, FK)
- `rule_name` (varchar)
- `rule_type` (varchar) - purchase, review, referral, signup, birthday, social_share
- `trigger_event` (varchar) - Event triggering points
- `points_earned` (integer) - Points awarded
- `points_calculation_type` (varchar) - flat, percentage_of_amount, dynamic
- `percentage_value` (decimal) - For percentage-based
- `min_transaction_amount` (decimal)
- `max_points_per_transaction` (integer)
- `category_applicable` (text[]) - Product categories
- `is_stackable` (boolean) - Can combine with other rules
- `is_active` (boolean)
- `start_date` (timestamp)
- `end_date` (timestamp)
- `priority` (integer) - Rule priority
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `loyalty_rewards`
Rewards customers can redeem points for.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `loyalty_program_id` (uuid, FK)
- `reward_name` (varchar)
- `reward_type` (varchar) - discount, free_product, free_shipping, upgrade, exclusive_access
- `reward_value` (decimal) - $ amount or percent
- `reward_unit` (varchar) - percent, amount, points, quantity
- `points_required` (integer) - Points to redeem
- `total_available_quantity` (integer) - Max redemptions
- `claimed_quantity` (integer) - Already claimed
- `description` (text)
- `terms_conditions` (text)
- `image_url` (varchar)
- `tier_required` (varchar) - Tier restriction
- `is_active` (boolean)
- `is_featured` (boolean)
- `expiry_days` (integer) - Reward expiration
- `started_at` (timestamp)
- `ended_at` (timestamp)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `customer_reward_redemptions`
Individual customer reward redemptions.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `customer_id` (uuid, FK)
- `loyalty_program_id` (uuid, FK)
- `reward_id` (uuid, FK)
- `points_spent` (integer)
- `redemption_status` (varchar) - pending, approved, claimed, used, expired, cancelled
- `redemption_code` (varchar, unique)
- `order_applied_to` (uuid)
- `claimed_at` (timestamp)
- `used_at` (timestamp)
- `expires_at` (timestamp)
- `notes` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `loyalty_point_transactions`
Complete audit trail of all point movements.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `customer_id` (uuid, FK)
- `loyalty_program_id` (uuid, FK)
- `transaction_type` (varchar) - earned, redeemed, expired, adjusted, refunded
- `points_amount` (integer) - Points added/removed
- `points_before` (integer) - Previous balance
- `points_after` (integer) - New balance
- `related_order_id` (uuid) - Order ID if order-related
- `related_reward_id` (uuid) - Reward if redemption
- `related_rule_id` (uuid) - Rule that triggered
- `description` (varchar)
- `notes` (text)
- `created_by` (uuid) - Admin making adjustment
- `created_at` (timestamp)

#### `loyalty_tier_history`
Track customer tier progression over time.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `customer_id` (uuid, FK)
- `loyalty_program_id` (uuid, FK)
- `previous_tier_id` (uuid)
- `new_tier_id` (uuid)
- `promotion_reason` (varchar) - points_milestone, spending_threshold, birthday_promotion, admin_adjustment
- `effective_date` (timestamp)
- `downgrade_reason` (varchar)
- `expiry_date` (timestamp)
- `created_at` (timestamp)

#### `loyalty_promotions`
Time-limited promotional campaigns.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `loyalty_program_id` (uuid, FK)
- `promotion_name` (varchar)
- `promotion_type` (varchar) - bonus_points, double_points, tier_bonus, birthday, anniversary, seasonal
- `description` (text)
- `points_multiplier` (decimal) - 2.0 = double points
- `bonus_points_fixed` (integer) - Fixed point bonus
- `min_transaction_amount` (decimal)
- `max_bonus_points` (integer)
- `target_customer_segment` (varchar) - all, new, vip, at_risk, birthday
- `applicable_categories` (text[])
- `start_date` (timestamp)
- `end_date` (timestamp)
- `is_active` (boolean)
- `promotion_code` (varchar)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `loyalty_analytics`
Daily program metrics and statistics.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `loyalty_program_id` (uuid, FK)
- `date` (timestamp)
- `total_active_members` (integer)
- `new_members` (integer) - Joined today
- `points_issued` (integer) - Total points given
- `points_redeemed` (integer) - Total points spent
- `points_expired` (integer) - Points expired
- `rewards_claimed` (integer)
- `rewards_used` (integer)
- `avg_points_per_member` (decimal)
- `tier_distribution` (jsonb) - tier_name: count
- `engagement_rate` (decimal) - % active
- `repeat_purchase_rate` (decimal) - % repeat customers
- `revenue_from_loyalty_purchases` (decimal)
- `created_at` (timestamp)

#### `loyalty_referral_rewards`
Referral program tracking.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `loyalty_program_id` (uuid, FK)
- `referrer_customer_id` (uuid, FK)
- `referred_customer_id` (uuid)
- `referral_code` (varchar, unique)
- `referrer_points` (integer) - Points referrer gets
- `referred_customer_discount` (decimal) - % discount for new customer
- `referred_customer_points` (integer) - Welcome points
- `referral_status` (varchar) - pending, completed, cancelled, expired
- `referred_customer_made_purchase` (boolean)
- `purchase_date` (timestamp)
- `minimum_purchase_amount` (decimal)
- `claimed_at` (timestamp)
- `expires_at` (timestamp)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `customer_loyalty_points`
Current customer point balances and tier status.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `customer_id` (uuid, FK)
- `loyalty_program_id` (uuid, FK)
- `total_points` (integer) - Lifetime points
- `available_points` (integer) - Spendable points
- `redeemed_points` (integer) - Already spent
- `tier_level` (varchar) - Current tier
- `tier_since` (timestamp) - When promoted
- `points_expiry_date` (timestamp)
- `last_activity_date` (timestamp)
- `created_at` (timestamp)
- `updated_at` (timestamp)

## TypeScript Types

All types defined in `/types/index.ts`:

- `LoyaltyProgram`
- `LoyaltyTier`
- `LoyaltyPointRule`
- `LoyaltyReward`
- `CustomerRewardRedemption`
- `LoyaltyPointTransaction`
- `LoyaltyTierHistory`
- `LoyaltyPromotion`
- `LoyaltyAnalytics`
- `LoyaltyReferralReward`
- `CustomerLoyaltyAccount`

## Service Functions

Location: `/lib/loyalty/service.ts`

### Program Management

#### `createLoyaltyProgram(userId, program): Promise<LoyaltyProgram | null>`
Create new loyalty program.

```typescript
const program = await createLoyaltyProgram(userId, {
  name: 'VIP Rewards',
  programType: 'tier',
  pointMultiplier: 1.5,
  minPurchaseForPoints: 10,
  pointExpiryDays: 365
});
```

#### `getLoyaltyProgram(programId): Promise<LoyaltyProgram | null>`
Fetch program details.

### Tier Management

#### `createLoyaltyTier(userId, tier): Promise<LoyaltyTier | null>`
Define tier level.

```typescript
const tier = await createLoyaltyTier(userId, {
  loyaltyProgramId: 'prog-123',
  tierName: 'Gold',
  tierLevel: 2,
  minPoints: 5000,
  maxPoints: 9999,
  minAnnualSpending: 1000,
  pointsMultiplier: 1.5,
  exclusiveBenefits: ['Free shipping', 'Early access to sales']
});
```

#### `getLoyaltyTiers(programId): Promise<LoyaltyTier[]>`
Fetch all tiers for program.

### Point Rules

#### `createPointRule(userId, rule): Promise<LoyaltyPointRule | null>`
Create rule for earning points.

```typescript
const rule = await createPointRule(userId, {
  loyaltyProgramId: 'prog-123',
  ruleName: 'Purchase Points',
  ruleType: 'purchase',
  triggerEvent: 'order_completed',
  pointsEarned: 1,
  pointsCalculationType: 'percentage_of_amount',
  percentageValue: 1,  // 1 point per $1 spent
  minTransactionAmount: 10
});
```

### Rewards

#### `createReward(userId, reward): Promise<LoyaltyReward | null>`
Create redeemable reward.

```typescript
const reward = await createReward(userId, {
  loyaltyProgramId: 'prog-123',
  rewardName: '$50 Discount',
  rewardType: 'discount',
  rewardValue: 50,
  rewardUnit: 'amount',
  pointsRequired: 5000,
  totalAvailableQuantity: 100,
  description: 'Get $50 off your next order'
});
```

#### `getRewards(programId): Promise<LoyaltyReward[]>`
Fetch available rewards.

### Point Transactions

#### `addPointsToCustomer(userId, customerId, loyaltyProgramId, points, transactionType, relatedOrderId?, relatedRuleId?): Promise<LoyaltyPointTransaction | null>`
Award points to customer.

```typescript
const transaction = await addPointsToCustomer(
  userId,
  'cust-456',
  'prog-123',
  100,
  'earned',
  'order-789',
  'rule-101'
);
```

### Reward Redemption

#### `redeemReward(userId, customerId, rewardId, loyaltyProgramId?): Promise<CustomerRewardRedemption | null>`
Customer redeems reward for points.

```typescript
const redemption = await redeemReward(
  userId,
  'cust-456',
  'reward-123',
  'prog-123'
);
// Returns redemption_code customer can use at checkout
```

#### `approveRedemption(redemptionId): Promise<boolean>`
Approve pending redemption.

```typescript
await approveRedemption('redemption-123');
```

### Tier Management

#### `updateCustomerTier(userId, customerId, loyaltyProgramId, newTierId, promotionReason?): Promise<boolean>`
Promote/demote customer tier.

```typescript
await updateCustomerTier(
  userId,
  'cust-456',
  'prog-123',
  'tier-gold',
  'spending_threshold'
);
```

### Referrals

#### `createReferralReward(userId, referrerCustomerId, loyaltyProgramId, referrerPoints, referredCustomerDiscount, referredCustomerPoints): Promise<LoyaltyReferralReward | null>`
Create referral link.

```typescript
const referral = await createReferralReward(
  userId,
  'referrer-123',
  'prog-123',
  500,    // referrer gets 500 points
  10,     // referred customer gets 10% off
  100     // referred customer gets 100 points
);
// referral.referral_code can be shared
```

#### `completeReferral(referralId, referredCustomerId): Promise<boolean>`
Mark referral as completed when new customer makes purchase.

### Customer Loyalty

#### `getCustomerLoyaltyAccount(customerId, loyaltyProgramId): Promise<object | null>`
Get customer's loyalty status.

```typescript
const account = await getCustomerLoyaltyAccount('cust-456', 'prog-123');
// Returns: {
//   totalPoints: 2500,
//   availablePoints: 2300,
//   redeemedPoints: 200,
//   tierLevel: 'Silver',
//   tierSince: Date,
//   lastActivityDate: Date
// }
```

#### `initializeCustomerLoyalty(userId, customerId, loyaltyProgramId, bonusPointsOnJoin?): Promise<boolean>`
Enroll customer in program.

```typescript
await initializeCustomerLoyalty(userId, 'cust-456', 'prog-123', 100);
```

### Analytics

#### `recordLoyaltyAnalytics(userId, loyaltyProgramId, analytics): Promise<LoyaltyAnalytics | null>`
Record daily metrics.

#### `getLoyaltyAnalytics(programId, days?): Promise<LoyaltyAnalytics[]>`
Fetch analytics for period.

## API Endpoints

### Programs

**POST** `/api/loyalty/programs`
Create loyalty program.

**GET** `/api/loyalty/programs?userId=...`
List programs.

### Tiers

**GET** `/api/loyalty/programs/[programId]/tiers`
List tiers.

**POST** `/api/loyalty/programs/[programId]/tiers`
Create tier.

### Rewards

**GET** `/api/loyalty/programs/[programId]/rewards`
List rewards.

**POST** `/api/loyalty/programs/[programId]/rewards`
Create reward.

### Rules

**POST** `/api/loyalty/programs/[programId]/rules`
Create point rule.

### Customer Loyalty

**GET** `/api/loyalty/customers/[customerId]/account?programId=...`
Get customer loyalty account.

**POST** `/api/loyalty/customers/[customerId]/account`
Initialize loyalty enrollment.

### Redemptions

**POST** `/api/loyalty/customers/[customerId]/redeem`
Redeem reward.

### Analytics

**GET** `/api/loyalty/analytics?programId=...&days=30`
Get analytics.

**POST** `/api/loyalty/analytics`
Record analytics.

## UI Components

### Loyalty Dashboard (`/app/loyalty/page.tsx`)

Features:
- Program management (CRUD)
- KPI cards (programs, members, points issued, rewards claimed)
- Multi-tab interface (Programs, Tiers, Rewards, Analytics)
- Program creation modal
- Tier management interface
- Reward listing and creation
- Analytics visualization

## User Workflows

### 1. Merchant Creates Loyalty Program

1. Click "New Program"
2. Enter program name, type (points/tier/referral/vip)
3. Set point multiplier (1.5x = 1.5 points per $1)
4. Set minimum purchase threshold
5. Create program
6. Add tiers (if tier-based)
7. Create point rules (how customers earn)
8. Define rewards (what customers can redeem)

### 2. Merchant Creates Tier

1. Go to Tiers tab
2. Select program
3. Create tier (Bronze, Silver, Gold, Platinum)
4. Set minimum points to reach
5. Set annual spending requirement
6. Add exclusive benefits
7. Save tier

### 3. Customer Earns Points

1. Customer makes purchase ($100)
2. Point rule triggered (1 point per $1 = 100 points)
3. Tier-based multiplier applied if applicable (Gold = 1.5x = 150 points)
4. Points added to customer's account
5. Transaction logged for audit

### 4. Customer Redeems Reward

1. Customer has 5000 points
2. Browse available rewards
3. Select $50 discount (requires 5000 points)
4. Click Redeem
5. Receive redemption code
6. Apply code at checkout for $50 off
7. System marks points as redeemed

### 5. Referral Program

1. Customer receives referral code
2. Shares with friend
3. Friend makes account with referral code
4. Friend makes first purchase
5. Both customers get bonus points

## Features

### Points System
- Flexible point earning based on rules
- Percentage-based or flat amount
- Stackable rules
- Point expiration settings
- Transaction history

### Tier System
- Multiple tier levels
- Annual spending requirements
- Tier-specific benefits
- Automatic promotion/demotion
- VIP tier option

### Rewards
- Multiple reward types (discount, free shipping, product, upgrade)
- Limited quantity tracking
- Tier restrictions
- Expiration dates
- Featured rewards display

### Referrals
- Unique referral codes
- Referrer rewards
- New customer incentives
- Discount for new customers
- Referral status tracking

### Analytics
- Daily active members
- Points issued/redeemed/expired
- Rewards claimed/used
- Engagement rates
- Revenue from loyalty purchases
- Tier distribution

## Best Practices

### For Merchants
- Set realistic point earning rates
- Create tiered rewards strategy
- Use promotions to drive engagement
- Monitor tier distribution
- Balance reward costs with revenue

### For Customers
- Earn and save points consistently
- Monitor point expiration dates
- Aim for higher tier benefits
- Share referral codes
- Redeem rewards strategically

### Platform
- Batch process point expiration nightly
- Archive old analytics after 1 year
- Implement fraud detection for referrals
- Cache customer loyalty accounts
- Optimize tier calculations

## Performance Optimization

- Index on customer_id for loyalty accounts
- Denormalized point balances
- Caching tier configurations
- Batch analytics processing
- Archive old transactions

## Compliance

- GDPR deletion support
- Point transparency
- Reward terms in plain language
- Expiration date notifications
- Referral fraud prevention

## Troubleshooting

### Points Not Showing
- Verify rule is active
- Check purchase amount meets minimum
- Verify product category matches
- Check for point expiration

### Tier Not Updated
- Manual tier updates available
- Check annual spending requirement
- Verify point threshold met
- Review tier history

### Reward Not Redeemable
- Check point balance
- Verify tier requirement
- Check reward availability
- Verify expiration date
