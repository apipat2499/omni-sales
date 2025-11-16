# Customer Segmentation & Behavioral Analytics System

## Overview

The Customer Segmentation & Behavioral Analytics System provides comprehensive tools for dividing customers into meaningful groups based on behavior, demographics, purchasing patterns, and predicted lifetime value. This system enables targeted marketing campaigns, personalized customer experiences, and data-driven business decisions.

## Key Features

- **Behavioral Segmentation**: Track and analyze customer behavior patterns across multiple touchpoints
- **RFM Analysis**: Implement Recency, Frequency, Monetary segmentation automatically
- **Cohort Analysis**: Group customers by acquisition date and analyze cohort performance
- **Customer Journey Tracking**: Monitor customer progression through defined lifecycle stages
- **LTV Predictions**: Predict customer lifetime value and churn probability
- **Real-time Analytics**: Daily behavioral metrics and segment performance tracking
- **Event Tracking**: Comprehensive event recording with device, location, and session data

## Database Schema

### 1. customer_segments_v2
Stores customer segment definitions and metadata.

```sql
Table: customer_segments_v2
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- name: VARCHAR (Segment name)
- description: TEXT (Segment description)
- segment_type: VARCHAR (rfm|behavioral|cohort|custom|demographic|value-based)
- criteria: JSONB (Segment definition criteria)
- is_active: BOOLEAN (Active status)
- member_count: INTEGER (Current member count)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

Indexes:
- idx_customer_segments_v2_user_id
- idx_customer_segments_v2_segment_type
- idx_customer_segments_v2_is_active
```

**Use Cases**:
- Store predefined customer groups (VIP, At-Risk, New Customers)
- Define dynamic segments based on behavioral criteria
- Manage segment lifecycle and metadata

**Example Data**:
```json
{
  "id": "uuid-123",
  "user_id": "uuid-user-456",
  "name": "High-Value Customers",
  "segment_type": "rfm",
  "criteria": {
    "recency_days": 30,
    "min_frequency": 10,
    "min_monetary": 500
  },
  "is_active": true,
  "member_count": 152
}
```

### 2. segment_members
Maps customers to segments with membership tracking.

```sql
Table: segment_members
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- segment_id: UUID (Foreign Key)
- customer_id: UUID (Foreign Key)
- joined_at: TIMESTAMP
- left_at: TIMESTAMP (NULL if still member)

Indexes:
- idx_segment_members_user_id
- idx_segment_members_segment_id
- idx_segment_members_customer_id
- idx_segment_members_left_at
```

**Use Cases**:
- Track segment membership history
- Calculate segment churn and retention
- Identify customers in multiple segments

**Key Queries**:
```sql
-- Active members of a segment
SELECT * FROM segment_members
WHERE segment_id = 'uuid' AND left_at IS NULL;

-- Membership timeline for analysis
SELECT customer_id, joined_at, left_at FROM segment_members
WHERE segment_id = 'uuid' ORDER BY joined_at DESC;
```

### 3. customer_behavior_events
Records individual customer interactions and touchpoints.

```sql
Table: customer_behavior_events
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- customer_id: UUID (Foreign Key)
- event_type: VARCHAR (page_view|product_view|add_to_cart|purchase|wishlist|etc)
- event_category: VARCHAR (website|mobile|email|sms|social|etc)
- product_id: UUID
- product_name: VARCHAR
- product_category: VARCHAR
- event_value: NUMERIC (monetary value if applicable)
- event_properties: JSONB (Custom event data)
- page_url: VARCHAR
- referrer_url: VARCHAR
- ip_address: INET
- user_agent: VARCHAR
- device_type: VARCHAR (desktop|mobile|tablet)
- browser: VARCHAR
- os: VARCHAR
- location: JSONB (latitude, longitude, country, city)
- session_id: VARCHAR
- created_at: TIMESTAMP

Indexes:
- idx_customer_behavior_events_user_id
- idx_customer_behavior_events_customer_id
- idx_customer_behavior_events_created_at
- idx_customer_behavior_events_event_type
```

**Use Cases**:
- Build complete customer activity timeline
- Analyze conversion funnels
- Identify behavioral patterns for segmentation
- Track multi-channel interactions

**Example Event**:
```json
{
  "event_type": "purchase",
  "event_category": "website",
  "product_name": "Premium Subscription",
  "event_value": 99.99,
  "device_type": "mobile",
  "location": {
    "country": "US",
    "city": "New York",
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "session_id": "sess_abc123"
}
```

### 4. customer_behavior_summary
Aggregated behavior metrics per customer.

```sql
Table: customer_behavior_summary
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- customer_id: UUID (Foreign Key)
- total_events: INTEGER
- total_page_views: INTEGER
- total_product_views: INTEGER
- total_add_to_cart: INTEGER
- total_purchases: INTEGER
- total_spent: NUMERIC
- avg_order_value: NUMERIC
- last_purchase_date: TIMESTAMP
- first_purchase_date: TIMESTAMP
- days_since_purchase: INTEGER
- purchase_frequency_days: NUMERIC
- preferred_category: VARCHAR
- preferred_device: VARCHAR
- preferred_source: VARCHAR
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

Indexes:
- idx_customer_behavior_summary_user_id
- idx_customer_behavior_summary_customer_id
```

**Use Cases**:
- Quick access to customer aggregated metrics
- Power customer profile views
- Enable real-time behavior-based recommendations
- Support RFM calculations

### 5. cohorts
Groups customers by acquisition date for longitudinal analysis.

```sql
Table: cohorts
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- cohort_name: VARCHAR
- cohort_type: VARCHAR (acquisition|behavioral|value|engagement|etc)
- acquisition_start_date: DATE
- acquisition_end_date: DATE
- description: TEXT
- member_count: INTEGER
- is_active: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

Indexes:
- idx_cohorts_user_id
- idx_cohorts_cohort_type
```

**Use Cases**:
- Analyze customer lifetime value by acquisition cohort
- Understand retention patterns across cohorts
- Identify which acquisition periods generated best customers
- Track cohort aging and maturation

**Example Cohort**:
```json
{
  "cohort_name": "Q4 2024 Acquisition",
  "cohort_type": "acquisition",
  "acquisition_start_date": "2024-10-01",
  "acquisition_end_date": "2024-12-31",
  "member_count": 1250
}
```

### 6. cohort_members
Maps customers to cohorts.

```sql
Table: cohort_members
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- cohort_id: UUID (Foreign Key)
- customer_id: UUID (Foreign Key)
- joined_at: TIMESTAMP
- left_at: TIMESTAMP

Indexes:
- idx_cohort_members_user_id
- idx_cohort_members_cohort_id
```

### 7. customer_journey_stages
Tracks customer progression through defined lifecycle stages.

```sql
Table: customer_journey_stages
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- customer_id: UUID (Foreign Key)
- current_stage: VARCHAR (awareness|consideration|decision|retention|advocacy)
- stage_entered_at: TIMESTAMP
- days_in_stage: INTEGER
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

Indexes:
- idx_customer_journey_stages_user_id
- idx_customer_journey_stages_customer_id
- idx_customer_journey_stages_current_stage
```

**Journey Stages**:
- **Awareness**: Customer first discovers brand
- **Consideration**: Actively evaluating products/services
- **Decision**: Ready to purchase
- **Retention**: Active customer with retention focus
- **Advocacy**: Loyal customer, potential advocate

**Use Cases**:
- Personalize experiences by journey stage
- Trigger stage-specific campaigns
- Measure stage progression rates
- Identify drop-off points

### 8. customer_ltv_predictions
Predicted lifetime value and churn probability per customer.

```sql
Table: customer_ltv_predictions
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- customer_id: UUID (Foreign Key)
- current_ltv: NUMERIC
- predicted_ltv_1year: NUMERIC
- predicted_ltv_3year: NUMERIC
- predicted_ltv_5year: NUMERIC
- churn_probability: NUMERIC (0.0 to 1.0)
- growth_potential: VARCHAR (high|medium|low)
- confidence_score: NUMERIC (0.0 to 1.0)
- prediction_date: TIMESTAMP
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

Indexes:
- idx_customer_ltv_predictions_user_id
- idx_customer_ltv_predictions_churn_probability
```

**Use Cases**:
- Identify at-risk customers for retention campaigns
- Prioritize high-potential customers for upsell/cross-sell
- Allocate marketing budget based on predicted value
- Build customer risk profiles

**Example Prediction**:
```json
{
  "current_ltv": 1250.00,
  "predicted_ltv_1year": 1850.00,
  "churn_probability": 0.15,
  "growth_potential": "high",
  "confidence_score": 0.87
}
```

### 9. behavioral_analytics
Daily aggregated analytics by segment and date.

```sql
Table: behavioral_analytics
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- segment_id: UUID
- date: DATE
- total_customers: INTEGER
- new_customers: INTEGER
- active_customers: INTEGER
- at_risk_customers: INTEGER
- churned_customers: INTEGER
- total_page_views: INTEGER
- total_product_views: INTEGER
- total_add_to_cart: INTEGER
- total_purchases: INTEGER
- conversion_rate: NUMERIC
- avg_session_duration_minutes: NUMERIC
- bounce_rate: NUMERIC
- repeat_purchase_rate: NUMERIC
- avg_order_value: NUMERIC
- revenue: NUMERIC
- created_at: TIMESTAMP

Indexes:
- idx_behavioral_analytics_user_id
- idx_behavioral_analytics_date
- idx_behavioral_analytics_segment_id
```

**Use Cases**:
- Track segment health over time
- Analyze conversion trends
- Calculate daily revenue per segment
- Identify engagement patterns

### 10. segment_performance
Performance metrics per segment with detailed engagement analytics.

```sql
Table: segment_performance
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- segment_id: UUID (Foreign Key)
- date: DATE
- member_count: INTEGER
- active_members: INTEGER
- churn_rate: NUMERIC
- lifetime_value: NUMERIC
- avg_order_value: NUMERIC
- purchase_frequency: NUMERIC
- conversion_rate: NUMERIC
- email_open_rate: NUMERIC
- email_click_rate: NUMERIC
- sms_open_rate: NUMERIC
- engagement_score: NUMERIC (0-100)
- revenue_generated: NUMERIC
- created_at: TIMESTAMP

Indexes:
- idx_segment_performance_user_id
- idx_segment_performance_segment_id
- idx_segment_performance_date
```

**Use Cases**:
- Measure segment marketing effectiveness
- Track campaign performance by segment
- Calculate segment ROI
- Monitor engagement trends

## Service Layer

### Segment Management Functions

#### createSegment(userId, segment)
Creates a new customer segment.

```typescript
async function createSegment(
  userId: string,
  segment: Partial<CustomerSegmentV2>
): Promise<CustomerSegmentV2 | null>
```

**Parameters**:
- `userId`: Owner of the segment
- `segment.name`: Display name
- `segment.segmentType`: One of rfm|behavioral|cohort|custom|demographic|value-based
- `segment.description`: Optional description
- `segment.criteria`: Optional JSONB criteria object

**Returns**: Created segment with ID or null on error

**Example**:
```typescript
const segment = await createSegment(userId, {
  name: "High-Value Customers",
  segmentType: "rfm",
  criteria: { minMonetary: 1000 }
});
```

#### getSegments(userId)
Fetches all active segments for a user.

```typescript
async function getSegments(userId: string): Promise<CustomerSegmentV2[]>
```

#### updateSegment(segmentId, updates)
Updates segment metadata and criteria.

```typescript
async function updateSegment(
  segmentId: string,
  updates: Partial<CustomerSegmentV2>
): Promise<boolean>
```

### Behavior Tracking Functions

#### recordBehaviorEvent(userId, event)
Records a customer behavior event.

```typescript
async function recordBehaviorEvent(
  userId: string,
  event: Partial<CustomerBehaviorEvent>
): Promise<boolean>
```

**Event Types**:
- page_view, product_view, add_to_cart, purchase
- wishlist, review, share, email_open, email_click
- sms_click, social_click, support_ticket, etc.

**Event Categories**:
- website, mobile_app, email, sms, social_media, ads

**Example**:
```typescript
await recordBehaviorEvent(userId, {
  customerId: "cust_123",
  eventType: "purchase",
  eventCategory: "website",
  productName: "Premium Plan",
  eventValue: 99.99,
  deviceType: "mobile",
  location: {
    country: "US",
    city: "New York"
  }
});
```

#### getBehaviorSummary(customerId)
Gets aggregated behavior metrics for a customer.

```typescript
async function getBehaviorSummary(
  customerId: string
): Promise<CustomerBehaviorSummary | null>
```

#### updateBehaviorSummary(userId, customerId, updates)
Updates customer behavior summary.

```typescript
async function updateBehaviorSummary(
  userId: string,
  customerId: string,
  updates: Partial<CustomerBehaviorSummary>
): Promise<boolean>
```

### Cohort Management Functions

#### createCohort(userId, cohort)
Creates a new customer cohort.

```typescript
async function createCohort(
  userId: string,
  cohort: Partial<Cohort>
): Promise<Cohort | null>
```

#### getCohorts(userId)
Fetches all active cohorts for a user.

```typescript
async function getCohorts(userId: string): Promise<Cohort[]>
```

### Customer Journey Functions

#### updateCustomerJourneyStage(userId, customerId, stage)
Updates customer's journey stage.

```typescript
async function updateCustomerJourneyStage(
  userId: string,
  customerId: string,
  stage: string
): Promise<boolean>
```

**Valid Stages**: awareness, consideration, decision, retention, advocacy

#### getCustomerJourneyStage(customerId)
Gets customer's current journey stage.

```typescript
async function getCustomerJourneyStage(
  customerId: string
): Promise<CustomerJourneyStage | null>
```

### LTV Prediction Functions

#### recordLTVPrediction(userId, prediction)
Records or updates customer LTV prediction.

```typescript
async function recordLTVPrediction(
  userId: string,
  prediction: Partial<CustomerLTVPrediction>
): Promise<CustomerLTVPrediction | null>
```

**Parameters**:
- `currentLtv`: Actual lifetime value to date
- `predictedLtv1Year`: Predicted LTV in 1 year
- `churnProbability`: 0.0 to 1.0 (0 = no churn risk, 1 = certain churn)
- `growthPotential`: high|medium|low

#### getLTVPredictions(userId)
Gets top at-risk customers by churn probability.

```typescript
async function getLTVPredictions(userId: string): Promise<CustomerLTVPrediction[]>
```

### Analytics Functions

#### recordBehavioralAnalytics(userId, analytics)
Records daily behavioral analytics for a segment.

```typescript
async function recordBehavioralAnalytics(
  userId: string,
  analytics: Partial<BehavioralAnalytics>
): Promise<BehavioralAnalytics | null>
```

#### getBehavioralAnalytics(userId, days)
Gets historical behavioral analytics.

```typescript
async function getBehavioralAnalytics(
  userId: string,
  days: number = 30
): Promise<BehavioralAnalytics[]>
```

#### recordSegmentPerformance(userId, performance)
Records daily segment performance metrics.

```typescript
async function recordSegmentPerformance(
  userId: string,
  performance: Partial<SegmentPerformance>
): Promise<SegmentPerformance | null>
```

#### getSegmentPerformance(segmentId, days)
Gets historical performance for a segment.

```typescript
async function getSegmentPerformance(
  segmentId: string,
  days: number = 30
): Promise<SegmentPerformance[]>
```

### Segment Membership Functions

#### addSegmentMember(userId, segmentId, customerId)
Adds a customer to a segment.

```typescript
async function addSegmentMember(
  userId: string,
  segmentId: string,
  customerId: string
): Promise<boolean>
```

#### getSegmentMembers(segmentId)
Fetches all active members of a segment.

```typescript
async function getSegmentMembers(segmentId: string): Promise<SegmentMember[]>
```

#### removeSegmentMember(segmentId, customerId)
Removes a customer from a segment.

```typescript
async function removeSegmentMember(
  segmentId: string,
  customerId: string
): Promise<boolean>
```

## API Endpoints

### 1. GET /api/segmentation/segments
Fetches all segments for a user.

**Query Parameters**:
- `userId` (required): User identifier

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "VIP Customers",
      "segmentType": "value-based",
      "memberCount": 150,
      "isActive": true
    }
  ],
  "total": 1
}
```

### 2. POST /api/segmentation/segments
Creates a new segment.

**Request Body**:
```json
{
  "userId": "user_123",
  "name": "At-Risk Customers",
  "segmentType": "behavioral",
  "description": "Customers with declining activity",
  "criteria": {
    "daysInactive": 30,
    "minPreviousPurchases": 3
  }
}
```

**Response**: Created segment object (status 201)

### 3. POST /api/segmentation/events
Records a customer behavior event.

**Request Body**:
```json
{
  "userId": "user_123",
  "customerId": "cust_456",
  "eventType": "purchase",
  "eventCategory": "website",
  "productId": "prod_789",
  "productName": "Premium Package",
  "eventValue": 199.99,
  "deviceType": "mobile",
  "browser": "Chrome",
  "location": {
    "country": "US",
    "city": "San Francisco"
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Event recorded"
}
```

### 4. GET /api/segmentation/analytics
Fetches behavioral analytics or segment performance.

**Query Parameters**:
- `userId` (required): User identifier
- `segmentId` (optional): Specific segment ID
- `days` (optional): Days of history (default 30)

**Response with segmentId**:
```json
{
  "data": [
    {
      "date": "2024-01-15",
      "memberCount": 150,
      "activeMembers": 135,
      "churnRate": 0.02,
      "conversionRate": 0.12,
      "revenueGenerated": 12500.00,
      "engagementScore": 85
    }
  ],
  "total": 30
}
```

**Response without segmentId**:
```json
{
  "data": [
    {
      "date": "2024-01-15",
      "totalCustomers": 5000,
      "newCustomers": 150,
      "activeCustomers": 3500,
      "atRiskCustomers": 250,
      "churnedCustomers": 50,
      "conversionRate": 0.08,
      "revenue": 50000.00
    }
  ],
  "total": 30
}
```

## Dashboard Usage

The segmentation dashboard (`/app/segmentation/page.tsx`) provides:

### KPI Cards
- **Total Segments**: Count of active segments
- **Total Members**: Sum of all members across segments
- **Active Segments**: Count of segments with active members
- **Avg Size**: Average members per segment

### Segment Management
- Create new segments with name, type, and description
- View all segments with member counts
- Edit segment metadata
- Delete segments (soft delete via is_active flag)

### Multi-tab Interface
- **Segments Tab**: Manage and view segments
- **Analytics Tab**: View behavioral trends and performance
- **Cohorts Tab**: Manage customer cohorts
- **Customer Journeys Tab**: Track customer lifecycle stages

## Best Practices

### 1. Event Tracking
- Record events as soon as they occur
- Include complete context (device, location, session)
- Use consistent event type naming conventions
- Regularly review and prune old event data for performance

### 2. Segment Definition
- Keep segment criteria simple and maintainable
- Document segment business logic
- Review segment membership quarterly
- Archive unused segments

### 3. Analytics
- Calculate analytics daily at off-peak hours
- Use pre-aggregated tables for reporting
- Monitor query performance on large datasets
- Archive old analytics data beyond 2 years

### 4. LTV Predictions
- Rerun predictions monthly or quarterly
- Validate predictions against actual behavior
- Adjust model parameters based on accuracy
- Use churn probability for retention campaigns

### 5. Customer Journey
- Define clear stage transition criteria
- Automate stage progression where possible
- Review journey abandonment rates
- Optimize onboarding for faster progression

### 6. Performance Optimization
- Use indexes on frequently filtered columns
- Partition tables by date for large datasets
- Cache frequently accessed segments
- Use materialized views for complex aggregations

## Error Handling

All service functions return null or false on error after logging details to console:

```typescript
try {
  const segment = await createSegment(userId, data);
  if (!segment) {
    console.error('Failed to create segment');
    // Handle error
  }
} catch (error) {
  console.error('Unexpected error:', error);
}
```

## Security Considerations

- All queries filter by user_id to prevent cross-tenant data leakage
- Row-level security (RLS) policies enabled on all tables
- API endpoints validate userId parameter
- Behavior events include user_id for audit trails
- Customer PII (location data) should be anonymized for analytics

## Common Use Cases

### 1. Building a VIP Customer Program
```typescript
// Create VIP segment based on RFM analysis
const vipSegment = await createSegment(userId, {
  name: "VIP Customers",
  segmentType: "rfm",
  criteria: {
    recency_days: 30,
    min_frequency: 20,
    min_monetary: 5000
  }
});

// Get segment members for targeted communication
const members = await getSegmentMembers(vipSegment.id);
```

### 2. Implementing Retention Campaigns
```typescript
// Get at-risk customers
const predictions = await getLTVPredictions(userId);
const atRisk = predictions.filter(p => p.churnProbability > 0.5);

// Create retention segment
const retentionSegment = await createSegment(userId, {
  name: "At-Risk Retention Campaign",
  segmentType: "behavioral",
  criteria: { high_churn_risk: true }
});

// Track campaign performance
const performance = await getSegmentPerformance(retentionSegment.id, 30);
```

### 3. Analyzing Cohort Performance
```typescript
// Create acquisition cohort
const cohort = await createCohort(userId, {
  cohortName: "Q4 2024 New Customers",
  cohortType: "acquisition",
  acquisitionStartDate: "2024-10-01",
  acquisitionEndDate: "2024-12-31"
});

// Track cohort metrics over time
const analytics = await getBehavioralAnalytics(userId, 90);
```

### 4. Journey Stage Automation
```typescript
// Update customer journey based on events
async function processCustomerEvent(userId: string, customerId: string, event: any) {
  // Record event
  await recordBehaviorEvent(userId, event);

  // Update behavior summary
  const summary = await getBehaviorSummary(customerId);

  // Auto-advance journey based on criteria
  if (summary.total_purchases === 1) {
    await updateCustomerJourneyStage(userId, customerId, "decision");
  } else if (summary.days_since_purchase > 60) {
    await updateCustomerJourneyStage(userId, customerId, "retention");
  }
}
```

## Troubleshooting

### Segments showing incorrect member counts
- Check that segment_members entries are being created
- Verify is_active status on segment_members
- Ensure member count is updated when members are added/removed

### Analytics not updating
- Verify behavioral_analytics records are being inserted
- Check that dates are in correct ISO format
- Ensure segment_id is valid when querying

### LTV predictions seem inaccurate
- Validate behavior summary totals are correct
- Check that purchase events are being recorded
- Review prediction confidence scores
- Compare against actual customer spending

### Performance issues on large datasets
- Add indexes on frequently filtered columns
- Archive analytics data older than 2 years
- Use pagination for API responses
- Consider partitioning tables by date or user_id

## Future Enhancements

- Machine learning model for improved churn predictions
- Real-time segment membership updates
- Advanced segmentation with multi-criteria logic builder
- Predictive analytics dashboard with forecasting
- Integration with marketing automation platforms
- A/B testing framework for segment-based campaigns
- Customer propensity scoring models
- Behavioral lookalike audience generation
