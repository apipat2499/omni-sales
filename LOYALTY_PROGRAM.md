# Loyalty Program Management System

## Overview

The Loyalty Program Management System is a comprehensive customer retention and rewards platform that enables businesses to create, manage, and optimize customer loyalty programs. The system supports multiple program types, tiered membership structures, points-based rewards, referral systems, and detailed analytics to drive customer lifetime value and repeat purchases.

## Database Schema

### Core Tables (9 Tables)

#### 1. loyalty_programs
Main program definitions and configuration.
- Columns: id, user_id, program_name, description, program_type, currency, status, points_per_dollar, points_expiration_days, min_redemption_points, tier_system_enabled, referral_enabled, referral_points_awarded, birthday_bonus_points, program_rules
- Program Types: points (simple points), tiered (membership tiers), hybrid (combined), cash_back (percentage returns)
- Status: active, inactive
- Supports flexible rules via JSONB configuration
- Indexes: user_id, status

#### 2. loyalty_tiers
Membership tier definitions with benefits and thresholds.
- Columns: id, program_id, user_id, tier_name, tier_level, min_points_required, max_points_required, points_multiplier, benefits, exclusive_rewards, birthday_bonus_multiplier
- Purpose: Define VIP/Gold/Silver/Bronze tier structures
- Points multiplier for accelerated earning (e.g., 1.5x points for Gold tier)
- Exclusive rewards available only to specific tiers
- Birthday bonus multiplier for tier-specific birthday rewards

#### 3. loyalty_members
Individual member enrollment and tracking.
- Columns: id, program_id, user_id, customer_id, customer_name, email, phone, current_tier_id, current_points, lifetime_points, redemption_count, total_spent, membership_status, enrollment_date, last_activity_date, referral_code, referred_by, member_metadata
- Statuses: active, inactive, suspended, expired
- Tracks current/lifetime points, tier status, purchase history
- Referral code for viral growth tracking
- Custom metadata for member-specific data (preferences, tags, etc.)
- Indexes: program_id+user_id, customer_id, email, referral_code, status

#### 4. loyalty_points_transactions
Points earning and spending ledger.
- Columns: id, program_id, member_id, user_id, transaction_type, points_amount, points_balance_after, source, reference_id, reference_type, description, expiration_date, status
- Transaction Types: purchase (from orders), referral (friend signup), birthday_bonus, manual_adjustment, redemption, expiration
- Complete audit trail of all points movements
- Expiration tracking for time-limited points
- Status tracking: completed, pending, failed
- Indexes: member_id, transaction_type, created_at, user_id+created_at

#### 5. loyalty_rewards
Available rewards catalog.
- Columns: id, program_id, user_id, reward_name, description, reward_type, points_cost, quantity_available, quantity_remaining, reward_image_url, reward_code, tier_exclusive_id, active, start_date, end_date, reward_terms
- Reward Types: discount (percentage/fixed), free_product, free_shipping, exclusive_access, cash_back
- Limited quantity management with remaining count
- Tier-exclusive rewards for premium members
- Time-limited availability (start/end dates)
- JSONB reward terms for complex conditions
- Indexes: program_id, active, points_cost

#### 6. loyalty_redemptions
Redemption transaction history.
- Columns: id, program_id, member_id, reward_id, user_id, points_redeemed, redemption_date, fulfillment_status, fulfillment_date, reward_code_generated, delivery_method, shipping_address, tracking_number, redemption_notes
- Fulfillment Statuses: pending, approved, shipped, delivered, redeemed, cancelled
- Tracks complete redemption workflow from request to delivery
- Generated reward codes for digital redemptions
- Shipping/tracking support for physical rewards
- Indexes: member_id, fulfillment_status, redemption_date

#### 7. loyalty_tier_progression
Historical record of member tier changes.
- Columns: id, program_id, member_id, user_id, previous_tier_id, new_tier_id, promotion_reason, promotion_date
- Purpose: Track tier history for analytics and member communication
- Promotion reasons: automatic_points (points-based), manual_promotion, special_event
- Enables tier demotion tracking if applicable
- Indexes: member_id, promotion_date

#### 8. loyalty_program_analytics
Aggregated metrics and KPIs.
- Columns: id, program_id, user_id, analytics_date, total_members, active_members, total_points_issued, total_points_redeemed, total_points_outstanding, average_member_points, redemption_rate, tier_distribution, new_members, churned_members, total_spending, average_spending_per_member
- Snapshot metrics for dashboard and reporting
- Redemption rate = (redemptions / eligible members) * 100
- Churn tracking for membership retention analysis
- Average spending per member for ROI calculations
- Indexes: program_id+analytics_date

#### 9. loyalty_member_activity
Activity log for member engagement tracking.
- Columns: id, program_id, member_id, user_id, activity_type, activity_description, points_involved, activity_metadata, activity_date
- Activity Types: points_earned, points_redeemed, tier_promoted, tier_demoted, referral_made, purchase_made, engagement_milestone
- Detailed metadata for rich event tracking
- Purpose: Member timeline and engagement history
- Indexes: member_id, activity_type

## TypeScript Types

### Type Definitions
- `ProgramType`: 'points' | 'tiered' | 'hybrid' | 'cash_back'
- `TransactionType`: 'purchase' | 'referral' | 'birthday_bonus' | 'manual_adjustment' | 'redemption' | 'expiration'
- `RewardType`: 'discount' | 'free_product' | 'free_shipping' | 'exclusive_access' | 'cash_back'
- `MembershipStatus`: 'active' | 'inactive' | 'suspended' | 'expired'
- `FulfillmentStatus`: 'pending' | 'approved' | 'shipped' | 'delivered' | 'redeemed' | 'cancelled'

### Key Interfaces
- `LoyaltyProgram`: Program definition and configuration
- `LoyaltyTier`: Tier definition with benefits
- `LoyaltyMember`: Member enrollment and status
- `LoyaltyPointsTransaction`: Points ledger entry
- `LoyaltyReward`: Reward catalog item
- `LoyaltyRedemption`: Redemption transaction
- `LoyaltyTierProgression`: Tier history record
- `LoyaltyProgramAnalytics`: Aggregated metrics
- `LoyaltyMemberActivity`: Activity log entry
- `LoyaltyDashboardData`: Dashboard aggregates

## Service Layer Functions (lib/loyalty/service.ts)

### Program Management
- `getLoyaltyPrograms(userId)`: Get all programs
- `createLoyaltyProgram(userId, programData)`: Create new program

### Tier Management
- `getLoyaltyTiers(programId)`: Get tiers for program
- `createLoyaltyTier(userId, programId, tierData)`: Create tier with benefits

### Member Management
- `getLoyaltyMembers(programId, userId)`: Get program members
- `enrollLoyaltyMember(userId, programId, memberData)`: Enroll new member
- `updateLoyaltyMember(userId, memberId, updates)`: Update member status/points

### Points Management
- `addPointsTransaction(userId, programId, memberId, transactionData)`: Record points change
- `getMemberPointsHistory(memberId)`: Get transaction history for member

### Rewards Management
- `getLoyaltyRewards(programId, userId)`: Get available rewards
- `createLoyaltyReward(userId, programId, rewardData)`: Create new reward

### Redemptions
- `createRedemption(userId, programId, memberId, rewardId, pointsRedeemed)`: Create redemption
- `getMemberRedemptions(memberId)`: Get redemption history

### Analytics
- `getLoyaltyDashboardData(userId)`: Get dashboard metrics

## API Endpoints

### GET /api/loyalty/dashboard
Retrieves loyalty program dashboard data with KPIs and member metrics.

**Query Parameters:**
- `userId` (required): User identifier

**Response:**
```json
{
  "data": {
    "totalPrograms": 5,
    "activePrograms": 4,
    "totalMembers": 1250,
    "activeMembers": 980,
    "totalPointsOutstanding": 1250000,
    "totalPointsRedeemed": 450000,
    "averagePointsPerMember": 1276,
    "redemptionRate": 36.5,
    "recentMembers": [...],
    "topMembers": [...],
    "upcomingRewards": [...],
    "tierDistribution": {...},
    "programsByStatus": {...},
    "membershipTrendLastMonth": [...],
    "redemptionTrendLastMonth": [...]
  }
}
```

## Dashboard UI

The loyalty program dashboard (app/loyalty/page.tsx) provides:
- 6 KPI metric cards (Programs, members, points, redemption rate)
- Top members leaderboard with points and spending
- Quick action buttons (Create Program, Tier, Reward, Enroll Member)
- Program statistics (avg points, tier distribution, pending redemptions)
- Responsive design with dark mode support
- Real-time refresh functionality

## Key Features

1. **Flexible Program Types**: Points-based, tiered, hybrid, and cash back options
2. **Dynamic Tier System**: VIP/Gold/Silver/Bronze with exclusive benefits
3. **Points Management**: Earning sources (purchases, referrals, birthdays, manual)
4. **Reward Catalog**: Digital, physical, discount, and exclusive rewards
5. **Redemption Workflow**: Complete fulfillment tracking from request to delivery
6. **Member Activity**: Comprehensive engagement and transaction history
7. **Tier Progression**: Automatic promotions based on points thresholds
8. **Referral Program**: Viral growth with referral codes and tracking
9. **Birthday Bonuses**: Tier-multiplied birthday point rewards
10. **Analytics**: Comprehensive dashboards with redemption tracking and ROI

## Best Practices

### Program Design
- Start with simple points-based program, upgrade to tiered structure as you grow
- Set meaningful point values (e.g., 1 point per dollar spent)
- Ensure reward costs are attractive (redeem at 10-20% discount point value)
- Balance exclusive rewards (10%) with mass-appeal rewards (90%)

### Member Engagement
- Launch with welcome bonus (100-500 points for signup)
- Regular point earning opportunities (2-5x events per month)
- Monthly tier progress notifications
- Personalized reward recommendations based on history
- Reactivation campaigns for inactive members (30+ days)

### Tier Management
- Keep tiers simple (3-5 tiers recommended)
- Clear tier benefit communication
- Annual tier resets to maintain exclusivity
- Tier demotion policies (e.g., inactive 6+ months)
- Special tier for high-value customers (VIP)

### Redemption Strategy
- Limited-time flash rewards to drive urgency
- Tiered reward availability based on membership level
- Partial redemption options (e.g., $10 off with 1000 points)
- Reward recommendations matching spending history
- Easy redemption process (1-3 clicks)

## Compliance & Best Practices

### Program Terms
- Clear expiration policies for points and rewards
- Documented tier promotion/demotion criteria
- Transparent points earning and redemption rates
- Member account termination policies
- Data privacy for member information

### Financial Accounting
- Treat earned points as liability on balance sheet
- Estimated redemption rates for financial projections
- Breakage (unredeemed points) revenue recognition
- Tax implications of rewards (may be taxable)

### Technical Operations
- Real-time points balance updates
- Transaction idempotency to prevent duplicate entries
- Historical data retention for audits
- Regular backup of member and redemption data
- API rate limiting for member enrollments

## System Limits

- Members per program: Unlimited
- Programs per user: Unlimited (recommend max 5)
- Tiers per program: Typically 3-5 (max 10)
- Rewards per program: Unlimited
- Points earning rate: Configurable (0.1-10 per dollar typical)
- Points expiration: Configurable (360-1095 days typical)
- Transaction history retention: Unlimited (recommend purge after 7 years)

## Integration Points

### Ecommerce Integration
- Automatic points award after purchase completion
- Post-purchase tier eligibility checks
- Reward redemption at checkout
- Referral code tracking in order creation

### Email Integration
- Welcome series with program overview
- Tier advancement notifications
- Birthday bonus reminders
- Reward expiration warnings
- Seasonal promotions with bonus points

### Mobile App
- Real-time points balance display
- QR code for in-store point redemption
- Push notifications for rewards and birthdays
- Account tier status visibility
- Referral code sharing

## Future Enhancements

1. Machine learning tier recommendations
2. Gamification (badges, challenges, leaderboards)
3. Partner program integrations
4. Social sharing for referrals
5. Mobile wallet integration (Apple/Google Pay)
6. Blockchain-based points (if applicable)
7. AI-driven personalized rewards
8. Voice-activated redemptions

## Support & Troubleshooting

### Common Issues

**Points Not Crediting**
- Verify transaction status in points_transactions table
- Check member eligibility (active status, not suspended)
- Confirm points earning rules configured in program_rules

**Member Can't Redeem**
- Verify member has sufficient points
- Check reward availability (quantity, date range)
- Confirm member tier eligibility for reward

**Tier Not Updating**
- Check tier progression thresholds and current points
- Verify automatic promotion is enabled in program
- Manual tier adjustment may be needed

---

This system provides enterprise-grade loyalty management with flexibility to support various business models and customer engagement strategies.
