# Customer Management System (CRM)

Comprehensive customer relationship management (CRM) system with RFM analysis, segmentation, loyalty programs, and communication tracking.

## Features

### 1. Customer Profiles
- Detailed customer information management
- Contact information (email, phone, address)
- Customer types (retail, wholesale, distributor)
- Source tracking (direct, marketplace, referral)
- Status management (active, inactive, vip, at_risk, lost)
- Lifetime value calculations
- Order and spending history

### 2. RFM Analysis
- Recency scoring (how recent the last purchase)
- Frequency scoring (how often customer purchases)
- Monetary scoring (how much customer spent)
- Automatic segmentation into:
  - Champions (best customers)
  - Loyal Customers (consistent buyers)
  - Potential Loyalists (growth potential)
  - At Risk (declining engagement)
  - Lost (inactive customers)
  - VIP (high value customers)
  - New Customers (recent acquires)

### 3. Churn Prediction
- Calculates risk score (0-1) for each customer
- Based on purchase frequency and recency
- Helps identify at-risk customers for retention

### 4. Customer Segmentation
- Create custom segments with flexible criteria
- Auto-add customers to segments based on conditions
- Tag customers for organization
- Color-coded tags for visual organization

### 5. Communication Tracking
- Log all customer communications
- Support multiple channels (email, SMS, phone, chat, in-person)
- Track communication direction (inbound/outbound)
- Monitor delivery status (sent, delivered, opened, clicked, bounced, replied)
- Store communication history for each customer

### 6. Loyalty Programs
- Create points-based loyalty programs
- Configure point multipliers and expiry rules
- Support tier-based programs
- Track customer points balance
- Manage point redemption

### 7. Customer Analytics
- Total orders and spending metrics
- Average order value calculations
- Repeat purchase rate
- Purchase frequency analysis
- Product preference tracking
- Churn risk assessment
- Lifetime value predictions
- Engagement scoring
- Customer satisfaction NPS scores

### 8. Customer Preferences
- Notification preferences (email, SMS, push)
- Marketing communication settings
- Contact method preferences
- GDPR compliance tracking
- Subscription preferences

## Database Schema

### Core Tables

#### `customer_profiles`
Enhanced customer information with KPI metrics
- Profile details (name, contact, company)
- Customer segmentation (type, source, status)
- Financial metrics (lifetime value, total spent)
- Order tracking (first/last order dates)

#### `customer_addresses`
Multiple address management
- Billing/shipping addresses
- Home/office locations
- Default address tracking

#### `customer_preferences`
Communication and notification settings
- Notification channel preferences
- Marketing opt-ins
- GDPR consent tracking

#### `customer_segments`
Dynamic segmentation definitions
- Custom segment creation
- Flexible criteria rules (JSON-based)
- Active/inactive control

#### `customer_tags`
Flexible tagging system
- Unlimited tags per customer
- Color-coded for organization
- Fast lookup by tag

#### `customer_notes`
Internal notes and communication records
- Note types (internal, follow_up, reminder, complaint, compliment)
- Priority levels
- Pinned notes for quick access

#### `customer_communications`
Complete communication audit trail
- Multi-channel support
- Direction tracking (inbound/outbound)
- Status monitoring (delivery, opens, clicks)
- Metadata for integration

#### `customer_interactions`
Event and behavior tracking
- Visit tracking
- Purchase events
- Review/feedback events
- Support interactions
- Return events

#### `loyalty_programs`
Loyalty program definitions
- Program types (points, tier, referral, vip)
- Point multiplier configuration
- Minimum purchase requirements
- Point expiry settings
- Tiered rewards

#### `customer_loyalty_points`
Per-customer loyalty point tracking
- Total points earned
- Available points balance
- Redeemed points history
- Tier levels
- Activity tracking

#### `customer_rfm_scores`
RFM analysis results
- Individual R/F/M scores (1-5)
- Overall RFM score
- Segment classification
- Last calculation timestamp

#### `customer_analytics`
Computed customer metrics
- Purchase behavior metrics
- Churn risk scoring
- Lifetime value predictions
- Engagement measurements
- NPS scores

## API Endpoints

### Customer Profiles

**GET** `/api/customers/profiles`
```json
Query Parameters:
- userId (required)
- customerId (optional)
- status (optional)
- limit (default: 50)
- offset (default: 0)

Response:
{
  "data": [...],
  "total": number,
  "limit": number,
  "offset": number
}
```

**POST** `/api/customers/profiles`
```json
Body:
{
  "userId": "string",
  "customerId": "string",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string",
  "companyName": "string",
  "customerType": "retail|wholesale|distributor",
  "source": "direct|marketplace|referral"
}

Response: CustomerProfile object
```

**PUT** `/api/customers/profiles`
```json
Body:
{
  "customerId": "string",
  "userId": "string",
  ...updateFields
}

Response: Updated CustomerProfile object
```

### RFM Analysis

**GET** `/api/customers/rfm`
```json
Query Parameters:
- userId (required)
- segment (optional) - filter by RFM segment

Response:
{
  "scores": [...],
  "distribution": {
    "Champions": number,
    "Loyal Customers": number,
    ...
  }
}
```

**POST** `/api/customers/rfm`
```json
Body:
{
  "userId": "string",
  "customerId": "string",
  "days": 365
}

Response: RFMScore object
```

### Customer Analytics

**GET** `/api/customers/analytics`
```json
Query Parameters:
- userId (required)
- customerId (optional)

Response: [CustomerAnalytics, ...]
```

**POST** `/api/customers/analytics`
```json
Body:
{
  "userId": "string",
  "customerId": "string"
}

Response: Updated CustomerAnalytics object
```

### Loyalty Points

**GET** `/api/customers/loyalty-points`
```json
Query Parameters:
- userId (required)
- customerId (optional)
- loyaltyProgramId (optional)

Response: [CustomerLoyaltyPoints, ...]
```

**POST** `/api/customers/loyalty-points`
```json
Body:
{
  "userId": "string",
  "customerId": "string",
  "loyaltyProgramId": "string",
  "action": "add|redeem",
  "points": number
}

Response: Updated points balance
```

### Communications

**GET** `/api/customers/communications`
```json
Query Parameters:
- userId (required)
- customerId (optional)
- channel (optional)
- status (optional)
- limit (default: 50)
- offset (default: 0)

Response:
{
  "data": [...],
  "total": number,
  "limit": number,
  "offset": number
}
```

**POST** `/api/customers/communications`
```json
Body:
{
  "userId": "string",
  "customerId": "string",
  "communicationType": "email|sms|phone|chat|in_person",
  "subject": "string",
  "message": "string",
  "direction": "inbound|outbound",
  "channel": "email|sms|phone|etc",
  "status": "sent|delivered|opened|bounced"
}

Response: Communication object
```

### Segments

**GET** `/api/customers/segments`
```json
Query Parameters:
- userId (required)
- customerId (optional)

Response:
{
  "segments": [...],
  "customerSegments": [segment_ids]
}
```

**POST** `/api/customers/segments`
```json
Body - Create segment:
{
  "userId": "string",
  "action": "create",
  "name": "string",
  "description": "string"
}

Body - Add to segment:
{
  "userId": "string",
  "action": "add_member",
  "customerId": "string",
  "segmentId": "string"
}

Response: Segment object or confirmation
```

## Service Functions

Located in `/lib/customer/service.ts`

### getOrCreateCustomerProfile()
Gets existing or creates new customer profile
```typescript
getOrCreateCustomerProfile(
  userId: string,
  customerId: string,
  customerData?: any
): Promise<CustomerProfile | null>
```

### calculateRFMScore()
Calculates and saves RFM scores for customer
```typescript
calculateRFMScore(
  userId: string,
  customerId: string,
  days?: number
): Promise<CustomerRFMScore | null>
```

### calculateChurnRisk()
Predicts customer churn risk (0-1 scale)
```typescript
calculateChurnRisk(
  customerId: string,
  days?: number
): Promise<number>
```

### updateCustomerAnalytics()
Computes and saves customer analytics
```typescript
updateCustomerAnalytics(
  userId: string,
  customerId: string
): Promise<CustomerAnalytics | null>
```

### addCustomerToSegment()
Adds customer to a segment
```typescript
addCustomerToSegment(
  customerId: string,
  segmentId: string,
  userId: string
): Promise<boolean>
```

### getCustomerLoyaltyPoints()
Gets customer's loyalty point balance
```typescript
getCustomerLoyaltyPoints(
  customerId: string,
  loyaltyProgramId?: string
): Promise<number>
```

### addLoyaltyPoints()
Adds points to customer's account
```typescript
addLoyaltyPoints(
  customerId: string,
  points: number,
  loyaltyProgramId: string,
  userId: string
): Promise<boolean>
```

### redeemLoyaltyPoints()
Redeems customer's loyalty points
```typescript
redeemLoyaltyPoints(
  customerId: string,
  loyaltyProgramId: string,
  points: number
): Promise<boolean>
```

### logCommunication()
Logs customer communication
```typescript
logCommunication(
  userId: string,
  customerId: string,
  communication: {
    communicationType: string;
    subject?: string;
    message: string;
    direction: string;
    channel: string;
    status?: string;
  }
): Promise<boolean>
```

### addCustomerNote()
Adds note to customer record
```typescript
addCustomerNote(
  userId: string,
  customerId: string,
  note: {
    title?: string;
    content: string;
    noteType?: string;
    priority?: string;
  }
): Promise<boolean>
```

### getCustomerCommunications()
Fetches communication history
```typescript
getCustomerCommunications(
  customerId: string,
  limit?: number
): Promise<any[]>
```

## RFM Scoring Model

### Recency Scoring (1-5)
- **5**: Purchase within last 30 days
- **4**: Purchase within 31-60 days
- **3**: Purchase within 61-90 days
- **2**: Purchase within 91-180 days
- **1**: No purchase for 180+ days

### Frequency Scoring (1-5)
- **5**: 10+ purchases
- **4**: 7-9 purchases
- **3**: 4-6 purchases
- **2**: 2-3 purchases
- **1**: 1 purchase

### Monetary Scoring (1-5)
- **5**: Spent $5000+
- **4**: Spent $2500-4999
- **3**: Spent $1000-2499
- **2**: Spent $500-999
- **1**: Spent <$500

## Frontend Components

### Customer Dashboard (`/app/customers/page.tsx`)
- KPI cards (total, active, VIP, at-risk customers)
- Multi-tab interface (List, Segments, Loyalty)
- Searchable customer list with filtering
- RFM segment badges
- Customer detail modal
- At-risk customer indicators

## Type Definitions

See `/types/index.ts` for complete interfaces:
- `CustomerProfile`
- `CustomerAddress`
- `CustomerPreferences`
- `CustomerSegment`
- `CustomerTag`
- `CustomerNote`
- `CustomerCommunication`
- `CustomerInteraction`
- `LoyaltyProgram`
- `CustomerLoyaltyPoints`
- `CustomerRFMScore`
- `CustomerAnalytics`

## Usage Examples

### Create Customer Profile
```typescript
const profile = await getOrCreateCustomerProfile(userId, customerId, {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  customerType: 'retail',
  source: 'direct'
});
```

### Calculate RFM and Get Segment
```typescript
const rfmScore = await calculateRFMScore(userId, customerId);
console.log(`Segment: ${rfmScore.rfmSegment}`); // "Champions", "Loyal Customers", etc
```

### Check Churn Risk
```typescript
const churnRisk = await calculateChurnRisk(customerId);
if (churnRisk > 0.7) {
  // Send retention campaign
}
```

### Award Loyalty Points
```typescript
await addLoyaltyPoints(
  customerId,
  points: 100,
  loyaltyProgramId,
  userId
);
```

### Log Customer Interaction
```typescript
await logCommunication(userId, customerId, {
  communicationType: 'email',
  message: 'Promotional offer sent',
  direction: 'outbound',
  channel: 'email',
  status: 'sent'
});
```

## Integration Points

The Customer Management system integrates with:
- **Email Notifications**: Send targeted campaigns to segments
- **Inventory Management**: Track customer's preferred products
- **Marketplace Integration**: Consolidate customers across channels
- **Analytics Dashboard**: Customer behavior analysis
- **Order Management**: Automatic order tracking and LTV updates

## Performance Optimization

- Indexes on user_id, customer_id, status, RFM segment
- Efficient RFM calculation (batch processing recommended)
- Pagination on all list endpoints
- Denormalized metrics for fast retrieval
- Timestamp-based filters for historical queries

## GDPR Compliance

- GDPR consent tracking per customer
- Right to be forgotten capabilities
- Data export functionality
- Audit trail of communication consent
- Do-not-contact support

## Future Enhancements

- Predictive churn modeling with ML
- Recommendation engine for personalized offers
- Customer feedback and sentiment analysis
- Automated win-back campaigns
- Advanced segmentation rules engine
- Customer health scoring
- Behavioral scoring models
- Integration with email marketing platforms
- Customer journey mapping
- Attribution modeling for touchpoints

## Troubleshooting

### RFM Scores Not Updating
- Verify customer has order history
- Check that orders table is populated
- Ensure userId matches authenticated user
- Run manual recalculation via POST endpoint

### Loyalty Points Not Working
- Verify loyalty program exists and is active
- Check customer-loyalty_program association
- Ensure sufficient points for redemption
- Verify point expiry settings

### Churn Predictions Inaccurate
- Need at least 30 days of order history
- Check for data quality in orders table
- Review calculation period (default 365 days)
- Consider adding custom churn signals

## Support

For issues or questions, refer to the main README.md or contact support.
