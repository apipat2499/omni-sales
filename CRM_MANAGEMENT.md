# Customer Relationship Management (CRM) System

## Overview

The CRM System is a comprehensive solution for managing customer relationships, leads, opportunities, and sales pipelines. It provides tools for tracking customer interactions, managing sales opportunities, scoring leads, and gaining insights into customer health and lifecycle.

## Architecture

### Database Schema

#### Core Tables

1. **crm_customer_profiles** - Enhanced customer data with lifecycle tracking
   - Extends basic customer data with company info, health score, and engagement level
   - Supports customer segmentation and lifecycle stage tracking
   - Custom fields for extensibility

2. **crm_contacts** - Multiple contacts per customer
   - Store multiple contacts (decision makers, stakeholders) per customer
   - Track last contact date and preferred contact method
   - Support for primary contact designation

3. **crm_interactions** - Complete interaction history
   - Track calls, emails, meetings, notes, tasks, and SMS
   - Record outcome, next steps, and sentiment analysis
   - Attachment support for documents and files

4. **crm_opportunities** - Sales pipeline management
   - Track sales opportunities with value, probability, and stage
   - Monitor days in pipeline and forecast amounts
   - Support for custom opportunity types and sources

5. **crm_leads** - Lead management and qualification
   - Manage leads from initial contact to conversion
   - Track lead source, quality, and assignment
   - Support lead-to-customer conversion tracking

6. **crm_lead_scores** - Lead scoring for prioritization
   - Calculate engagement, fit, and activity scores
   - Auto-grade leads (A, B, C, D) based on total score
   - Support for multiple scoring dates (track trend)

7. **crm_pipeline_stages** - Custom sales pipeline configuration
   - Define custom pipeline stages per organization
   - Set probability and expected cycle time per stage
   - Support for final stage designation

8. **crm_tags** - Flexible tagging system
   - Create and organize tags by category
   - Track usage count for tag management
   - Support for color coding tags

9. **crm_tagged_items** - Tag association
   - Many-to-many relationship for tagging customers, leads, opportunities

10. **crm_notes** - Internal notes and comments
    - Pin important notes for visibility
    - Mention team members for collaboration
    - Support for different note types

11. **crm_activity_timeline** - Complete activity history
    - Chronological log of all customer-related activities
    - Mark important activities for priority
    - Support for custom metadata

12. **crm_customer_segments** - Customer segmentation
    - Dynamic and static segments
    - Segmentation criteria via JSONB
    - Track segment membership

13. **crm_email_addresses** - Multiple email addresses per contact
    - Support for different email types (work, personal, etc.)
    - Email verification tracking
    - Primary email designation

14. **crm_phone_numbers** - Multiple phone numbers per contact
    - Support for different phone types (mobile, office, etc.)
    - Country code and phone verification
    - Primary phone designation

15. **crm_deal_stages** - Deal progression tracking
    - Track when and why deals move between stages
    - Historical record of deal progression
    - Record who moved the deal and notes

16. **crm_customer_health_scores** - Customer health monitoring
    - Daily health score tracking (0-100)
    - Risk level classification (green, yellow, red)
    - Health factors and recommendations

### Indexing Strategy

```sql
-- Optimized indexes for common queries
idx_crm_customer_profiles_user - Fast user data access
idx_crm_customer_profiles_segment - Segment-based filtering
idx_crm_contacts_customer - Contact list per customer
idx_crm_interactions_user_date - Recent interactions query
idx_crm_opportunities_user_stage - Pipeline view
idx_crm_leads_user_status - Lead funnel analysis
idx_crm_tagged_items_item - Tag-based searches
idx_crm_activity_timeline_customer - Activity history
```

## TypeScript Types

### Key Interfaces

#### CRMCustomerProfile
Extended customer data with lifecycle and engagement tracking.

#### CRMContact
Contact person at customer organization with multiple phone/email support.

#### CRMInteraction
Records all customer touchpoints (calls, emails, meetings, etc.).

#### CRMOpportunity
Sales opportunity with value, probability, and pipeline stage tracking.

#### CRMLead
Lead management from initial contact through conversion.

#### CRMLeadScore
Lead scoring with engagement, fit, and activity components.

#### CRMActivityTimeline
Complete chronological log of customer activities.

#### CRMDashboardData
Aggregated CRM metrics for dashboard display.

## Service Layer (/lib/crm/service.ts)

### Customer Profile Management
- `getCustomerProfile()` - Retrieve customer profile
- `createOrUpdateCustomerProfile()` - Create or update profile

### Contact Management
- `getContacts()` - List customer contacts
- `createContact()` - Add new contact
- `updateContact()` - Modify contact details

### Interaction Tracking
- `recordInteraction()` - Log customer interaction
- `getInteractionHistory()` - Retrieve interaction timeline

### Opportunity Management
- `createOpportunity()` - Create sales opportunity
- `updateOpportunity()` - Update opportunity details
- `getOpportunitiesByCustomer()` - List customer opportunities
- `getSalesPipeline()` - Get pipeline breakdown by stage

### Lead Management
- `createLead()` - Create new lead
- `updateLead()` - Update lead details
- `getLeads()` - List leads with optional status filter
- `scoreLead()` - Apply lead scoring

### Activity Tracking
- `recordActivityTimeline()` - Log activity
- `getActivityTimeline()` - Retrieve activity history

### Health Scoring
- `recordHealthScore()` - Calculate and store health score
- `getLatestHealthScore()` - Get current health score

### Dashboard
- `getCRMDashboardData()` - Aggregate all metrics for dashboard

## API Endpoints

### GET /api/crm/dashboard
Retrieves comprehensive CRM dashboard metrics.

**Query Parameters**:
- `userId` (required): User identifier

**Response**:
```json
{
  "data": {
    "totalCustomers": 150,
    "totalLeads": 45,
    "totalOpportunities": 23,
    "pipelineValue": 2500000,
    "conversionRate": 32.5,
    "averageDealSize": 108695.65,
    "recentInteractions": [...],
    "topOpportunities": [...],
    "stagePipeline": {"prospecting": 500000, ...},
    "leadsBySource": {"website": 20, "referral": 15, ...}
  }
}
```

### GET/POST /api/crm/customers
Manage customer CRM data.

**GET Parameters**:
- `userId` (required)
- `customerId` (required)

**POST Actions**:
- `profile` - Create/update customer profile
- `contact` - Create new contact

### GET/POST /api/crm/opportunities
Manage sales opportunities.

**GET Parameters**:
- `userId` (required)
- `customerId` (optional) - Get customer opportunities
- Returns pipeline if customerId omitted

**POST Actions**:
- `create` - Create new opportunity
- `update` - Update opportunity (requires opportunityId)

### GET/POST /api/crm/leads
Manage leads.

**GET Parameters**:
- `userId` (required)
- `status` (optional) - Filter by lead status

**POST Actions**:
- `create` - Create new lead
- `update` - Update lead (requires leadId)
- `score` - Apply lead scoring (requires leadId)

### GET/POST /api/crm/interactions
Track customer interactions.

**GET Parameters**:
- `userId` (required)
- `customerId` (required)
- `limit` (optional, default: 20)

**POST**: Record new interaction

## Dashboard Features

### Key Metrics
- **Total Customers**: Count of all active customers
- **Active Leads**: Count of leads in pipeline
- **Open Opportunities**: Number of active sales opportunities
- **Pipeline Value**: Total value of open opportunities

### Opportunity Pipeline
- Display top 5 opportunities by value
- Show stage and probability for each opportunity
- Visual progress bar showing deal probability

### Quick Actions
- New Customer, Lead, Opportunity, Interaction buttons
- Conversion metrics summary
- Lead-to-Customer conversion rate
- Average sales cycle length
- Customer retention rate

### Recent Activity
- Chronological feed of customer interactions
- Activity type icons (call, email, meeting, task, etc.)
- Interaction date and subject display

## Usage Examples

### Creating a Customer with Profile
```typescript
const profile = await createOrUpdateCustomerProfile(
  'user-123',
  'customer-456',
  {
    segment: 'vip',
    lifecycleStage: 'customer',
    companyName: 'Acme Corp',
    industry: 'Technology',
    healthScore: 85,
    engagementLevel: 'high'
  }
);
```

### Recording an Interaction
```typescript
const interaction = await recordInteraction(
  'user-123',
  {
    customerId: 'customer-456',
    interactionType: 'call',
    subject: 'Product Demo Discussion',
    description: 'Discussed feature requirements and pricing',
    durationMinutes: 30,
    outcome: 'positive',
    nextStep: 'Send proposal',
    conductedBy: 'John Smith',
    sentiment: 'positive'
  }
);
```

### Creating a Sales Opportunity
```typescript
const opportunity = await createOpportunity(
  'user-123',
  {
    customerId: 'customer-456',
    name: 'Enterprise License Deal',
    value: 250000,
    probabilityPercent: 60,
    stage: 'proposal',
    expectedCloseDate: new Date('2024-12-31'),
    source: 'inbound'
  }
);
```

### Scoring a Lead
```typescript
const score = await scoreLead(
  'user-123',
  'lead-789',
  {
    engagementScore: 85,
    fitScore: 75,
    activityScore: 90,
    totalScore: 250,
    grade: 'A',
    scoringDate: new Date().toISOString().split('T')[0]
  }
);
```

### Fetching CRM Dashboard
```typescript
const dashboard = await fetch(
  `/api/crm/dashboard?userId=user-123`
);
const dashboardData = await dashboard.json();
```

## Best Practices

### Lead Management
1. **Score leads regularly** to identify hot prospects
2. **Set follow-up dates** to ensure timely engagement
3. **Track lead source** to understand acquisition channels
4. **Assign leads** to team members promptly

### Opportunity Management
1. **Update stage regularly** to maintain accurate pipeline
2. **Record win/loss reasons** for historical analysis
3. **Track competitor info** for competitive intelligence
4. **Use probability scoring** for revenue forecasting

### Interaction Tracking
1. **Log all interactions** for complete customer history
2. **Set next steps** to maintain engagement momentum
3. **Note sentiment** to monitor customer satisfaction
4. **Record outcomes** for data-driven decisions

### Customer Health
1. **Calculate health scores** monthly based on engagement
2. **Identify at-risk customers** for proactive outreach
3. **Provide recommendations** for relationship improvement
4. **Track trends** to monitor customer lifecycle

## Health Score Factors

- **Engagement Score** (0-100)
  - Interaction frequency, recency, type mix
  - Sentiment of interactions
  - Response time and engagement level

- **Activity Score** (0-100)
  - Days since last activity
  - Interaction count (last 30/90 days)
  - Opportunities in pipeline

- **Satisfaction Score** (0-100)
  - Customer satisfaction ratings
  - Support ticket resolution
  - Net Promoter Score (NPS)

- **Risk Level**
  - Green (75-100): Healthy, low risk
  - Yellow (50-74): Moderate, watch closely
  - Red (0-49): At risk, immediate action needed

## Conversion Metrics

- **Lead to Customer**: Percentage of leads converted to customers
- **Sales Cycle**: Average days from opportunity creation to close
- **Win Rate**: Percentage of opportunities closed as won
- **Average Deal Size**: Average value of closed opportunities
- **Pipeline Velocity**: Rate of deal progression through stages

## Future Enhancements

1. **Advanced Reporting** - Custom report builder
2. **Predictive Analytics** - Churn prediction and lead scoring
3. **Email Integration** - Sync with email systems
4. **Calendar Sync** - Integration with calendar apps
5. **Workflow Automation** - Automated follow-ups and tasks
6. **Territory Management** - Sales territory assignment
7. **Forecasting** - Revenue forecasting models
8. **Mobile App** - Native mobile CRM application
9. **Social Integration** - LinkedIn and social data
10. **AI Assistant** - AI-powered recommendations

## Security & Privacy

- **Row Level Security (RLS)** - User data isolation via RLS policies
- **Data Encryption** - All sensitive data encrypted in transit
- **Audit Trail** - Complete activity history for compliance
- **GDPR Compliance** - Data retention and deletion support
- **Access Control** - Role-based access management

## Related Documentation

- [Analytics Management](./ANALYTICS_MANAGEMENT.md)
- [Inventory Management](./INVENTORY_MANAGEMENT.md)
- [Order Management](./ORDER_MANAGEMENT.md)
- [API Documentation](./API_DOCUMENTATION.md)
