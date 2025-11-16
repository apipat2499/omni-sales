# Complaint & Feedback Management System Documentation

## Overview

The Complaint & Feedback Management System provides comprehensive ticketing, escalation, and resolution workflows for customer complaints. It enables efficient complaint handling with priority-based assignment, automated escalation, multi-level approval workflows, and detailed analytics to drive continuous improvement.

## Core Features

- **Complaint Ticketing**: Auto-generated ticket IDs with full lifecycle tracking
- **Priority & Severity Classification**: Configurable complaint categories with SLA management
- **Assignment & Escalation**: Route complaints to appropriate teams with escalation workflows
- **Response Management**: Track all communications with internal and customer responses
- **Resolution Tracking**: Document resolution actions, compensation, and outcomes
- **Customer Feedback**: Collect satisfaction ratings and NPS scores
- **SLA Monitoring**: Track compliance with service level agreements
- **Analytics & Insights**: Monitor complaint trends, resolution rates, and satisfaction metrics
- **Feedback Surveys**: Collect general customer feedback and satisfaction data

## Database Schema

### Complaint Categories Table
```sql
CREATE TABLE complaint_categories (
  id UUID PRIMARY KEY,
  category_code VARCHAR(50) UNIQUE NOT NULL,
  category_name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  escalation_required BOOLEAN DEFAULT false,
  sla_hours INT DEFAULT 24,
  created_at TIMESTAMP
);
```

**Key Fields**:
- `category_code`: Unique identifier (e.g., "PROD_QUALITY", "DELIVERY")
- `sla_hours`: Service level agreement hours for response
- `escalation_required`: Auto-escalate complaints of this category

### Complaints Table
```sql
CREATE TABLE complaints (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  order_id UUID REFERENCES orders(id),
  complaint_ticket_id VARCHAR(50) UNIQUE NOT NULL,
  complaint_category_id UUID NOT NULL,
  complaint_type VARCHAR(50) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  complaint_status VARCHAR(50) DEFAULT 'open',
  priority VARCHAR(50) DEFAULT 'medium',
  severity VARCHAR(50) DEFAULT 'medium',
  assigned_to_id UUID,
  assigned_at TIMESTAMP,
  acknowledgment_status VARCHAR(50) DEFAULT 'pending',
  acknowledged_at TIMESTAMP,
  resolution_summary TEXT,
  resolution_date TIMESTAMP,
  satisfaction_rating INT,
  requires_escalation BOOLEAN DEFAULT false,
  escalated_at TIMESTAMP,
  tags TEXT[] DEFAULT '{}',
  attachments TEXT[],
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Status Workflow**: open → acknowledged → in_progress → resolved → closed
**Priority Levels**: low, medium, high, critical
**Complaint Types**: product_quality, delivery, customer_service, billing, other

### Complaint Responses Table
```sql
CREATE TABLE complaint_responses (
  id UUID PRIMARY KEY,
  complaint_id UUID NOT NULL REFERENCES complaints(id),
  responder_id UUID,
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  response_type VARCHAR(50),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Purpose**: Track all communication (internal and external)
**Response Types**: initial, follow_up, resolution_proposed, resolution_confirmed

### Complaint Escalations Table
```sql
CREATE TABLE complaint_escalations (
  id UUID PRIMARY KEY,
  complaint_id UUID NOT NULL,
  escalation_level INT,
  escalated_from_id UUID,
  escalated_to_id UUID,
  escalation_reason TEXT,
  escalation_time TIMESTAMP,
  resolved BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP
);
```

**Purpose**: Track escalation history and levels
**Levels**: 1 (Team Lead), 2 (Manager), 3 (Director), 4 (Executive)

### Complaint Resolution Table
```sql
CREATE TABLE complaint_resolutions (
  id UUID PRIMARY KEY,
  complaint_id UUID NOT NULL,
  resolution_type VARCHAR(50) NOT NULL,
  compensation_offered DECIMAL(12, 2),
  refund_amount DECIMAL(12, 2),
  replacement_offered BOOLEAN DEFAULT false,
  store_credit_amount DECIMAL(12, 2),
  actions_taken TEXT[],
  resolved_by_id UUID,
  resolution_date TIMESTAMP,
  created_at TIMESTAMP
);
```

**Resolution Types**: refund, replacement, store_credit, repair, closed_no_action

### Complaint Feedback Table
```sql
CREATE TABLE complaint_feedback (
  id UUID PRIMARY KEY,
  complaint_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  satisfaction_rating INT CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  response_quality_rating INT,
  resolution_effectiveness_rating INT,
  communication_rating INT,
  overall_experience_rating INT,
  feedback_comments TEXT,
  would_recommend BOOLEAN,
  nps_score INT,
  follow_up_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP
);
```

**Purpose**: Collect detailed feedback on complaint handling
**NPS Score**: -100 to +100 (Promoters: 9-10, Passives: 7-8, Detractors: 0-6)

### Complaint Analytics Table
```sql
CREATE TABLE complaint_analytics (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  period_start_date DATE,
  period_end_date DATE,
  total_complaints INTEGER,
  open_complaints INTEGER,
  resolved_complaints INTEGER,
  average_resolution_days DECIMAL(10, 2),
  average_satisfaction_rating DECIMAL(3, 2),
  complaint_rate DECIMAL(5, 2),
  escalation_rate DECIMAL(5, 2),
  customer_satisfaction_score DECIMAL(5, 2),
  complaint_by_category JSONB,
  complaint_by_priority JSONB,
  created_at TIMESTAMP
);
```

## TypeScript Types

### Core Interfaces

```typescript
export type ComplaintStatus = 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed' | 'reopened';
export type ComplaintPriority = 'low' | 'medium' | 'high' | 'critical';
export type ComplaintType = 'product_quality' | 'delivery' | 'customer_service' | 'billing' | 'other';

export interface Complaint {
  id: string;
  userId: string;
  customerId: string;
  orderId?: string;
  complaintTicketId: string;
  complaintStatus: ComplaintStatus;
  priority: ComplaintPriority;
  severity: ComplaintSeverity;
  subject: string;
  description: string;
  assignedToId?: string;
  satisfactionRating?: number;
  requiresEscalation: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplaintResponse {
  id: string;
  complaintId: string;
  responderId?: string;
  message: string;
  isInternal: boolean;
  responseType?: string;
  createdAt: Date;
}

export interface ComplaintResolution {
  id: string;
  complaintId: string;
  resolutionType: 'refund' | 'replacement' | 'store_credit' | 'repair' | 'closed_no_action';
  compensationOffered?: number;
  refundAmount?: number;
  resolvedById?: string;
  createdAt: Date;
}

export interface ComplaintFeedback {
  id: string;
  complaintId: string;
  customerId: string;
  satisfactionRating: number;
  responseQualityRating: number;
  overallExperienceRating: number;
  npsScore?: number;
  wouldRecommend?: boolean;
  createdAt: Date;
}
```

## Service Layer Functions

### Complaint Management

**`createComplaint(userId: string, data: Partial<Complaint>): Promise<Complaint | null>`**
- Creates new complaint with auto-generated ticket ID
- Parameters: customerId (required), orderId, complaintCategoryId, complaintType, subject, description
- Returns: Created complaint with ticket ID (format: TKT-TIMESTAMP-RANDOM)

**`getComplaint(complaintId: string): Promise<Complaint | null>`**
- Retrieves single complaint with details
- Returns: Complete complaint object

**`getComplaints(userId: string, status?: string, priority?: string): Promise<Complaint[]>`**
- Lists all complaints with optional filtering
- Returns: Array of complaints ordered by creation date (newest first)

**`acknowledgeComplaint(complaintId: string, acknowledgedById?: string): Promise<boolean>`**
- Marks complaint as acknowledged
- Updates status to 'acknowledged'
- Returns: true on success

**`updateComplaintStatus(complaintId: string, newStatus: string): Promise<boolean>`**
- Updates complaint workflow status
- Returns: true on success

**`assignComplaint(complaintId: string, assignedToId: string): Promise<boolean>`**
- Assigns complaint to team member
- Updates assigned_to_id and assigned_at timestamp
- Returns: true on success

### Response Management

**`addComplaintResponse(complaintId: string, data: Partial<ComplaintResponse>): Promise<ComplaintResponse | null>`**
- Adds response/comment to complaint
- Parameters: message (required), responderId, responderType, isInternal, responseType
- Returns: Created response object

**`getComplaintResponses(complaintId: string): Promise<ComplaintResponse[]>`**
- Retrieves all responses for a complaint
- Returns: Array of responses ordered chronologically

### Escalation

**`escalateComplaint(complaintId: string, data: Partial<ComplaintEscalation>): Promise<ComplaintEscalation | null>`**
- Escalates complaint to higher level
- Parameters: escalationLevel, escalatedToId, escalationReason
- Updates complaint escalation flags
- Returns: Created escalation record

**`getComplaintEscalations(complaintId: string): Promise<ComplaintEscalation[]>`**
- Retrieves escalation history
- Returns: Array of escalations (newest first)

### Resolution

**`resolveComplaint(complaintId: string, data: Partial<ComplaintResolution>): Promise<ComplaintResolution | null>`**
- Records resolution and closes complaint
- Parameters: resolutionType, compensationOffered, refundAmount, storeCreditAmount, actionsTaken
- Updates complaint status to 'resolved'
- Returns: Created resolution record

**`getComplaintResolution(complaintId: string): Promise<ComplaintResolution | null>`**
- Retrieves resolution details
- Returns: Resolution object or null

### Feedback

**`submitComplaintFeedback(data: Partial<ComplaintFeedback>): Promise<ComplaintFeedback | null>`**
- Collects customer feedback on complaint handling
- Parameters: complaintId, customerId, satisfactionRating (required), and other ratings
- Calculates NPS score
- Returns: Created feedback record

**`getComplaintFeedback(complaintId: string): Promise<ComplaintFeedback | null>`**
- Retrieves feedback for a complaint
- Returns: Feedback object or null

### Analytics

**`getComplaintStatistics(userId: string): Promise<ComplaintStatistics | null>`**
- Calculates real-time statistics
- Returns: ComplaintStatistics with KPIs

**`getComplaintAnalytics(userId: string, days?: number): Promise<ComplaintAnalytics[]>`**
- Fetches historical analytics (default: 30 days)
- Returns: Array of analytics records

**`recordComplaintAnalytics(userId: string, data: Partial<ComplaintAnalytics>): Promise<ComplaintAnalytics | null>`**
- Records analytics snapshot
- Returns: Created analytics record

## API Endpoints

### GET/POST /api/complaints
List complaints or create new complaint.

**GET Query Parameters**:
- `userId` (required): User's ID
- `status` (optional): Filter by status
- `priority` (optional): Filter by priority
- `includeStats` (optional): Include statistics summary

**POST Body**:
```json
{
  "userId": "uuid",
  "customerId": "uuid",
  "orderId": "uuid",
  "complaintCategoryId": "uuid",
  "complaintType": "product_quality",
  "subject": "Complaint subject",
  "description": "Detailed description",
  "priority": "high",
  "tags": ["urgent", "vip"],
  "attachments": ["url1", "url2"]
}
```

**POST Response**: 201 Created
```json
{
  "id": "uuid",
  "complaintTicketId": "TKT-1234567890-1234",
  "complaintStatus": "open",
  "priority": "high",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### GET/POST /api/complaints/response
Manage complaint responses.

**GET Query Parameters**:
- `complaintId` (required): Complaint ID

**POST Body**:
```json
{
  "complaintId": "uuid",
  "responderId": "uuid",
  "message": "Response message",
  "isInternal": false,
  "attachments": ["url1"]
}
```

### POST /api/complaints/escalate
Escalate complaint to higher level.

**Body**:
```json
{
  "complaintId": "uuid",
  "escalationLevel": 2,
  "escalatedToId": "uuid",
  "escalationReason": "Unable to resolve at first level"
}
```

### POST /api/complaints/resolve
Record complaint resolution.

**Body**:
```json
{
  "complaintId": "uuid",
  "resolutionType": "refund",
  "refundAmount": 99.99,
  "compensationOffered": 25.00,
  "actionsTaken": ["refund_processed", "replacement_shipped"]
}
```

### POST /api/complaints/feedback
Submit customer feedback on complaint handling.

**Body**:
```json
{
  "complaintId": "uuid",
  "customerId": "uuid",
  "satisfactionRating": 4,
  "responseQualityRating": 5,
  "resolutionEffectivenessRating": 4,
  "communicationRating": 5,
  "overallExperienceRating": 4,
  "npsScore": 8,
  "wouldRecommend": true
}
```

### GET /api/complaints/analytics
Retrieve complaint analytics and statistics.

**Query Parameters**:
- `userId` (required): User's ID
- `days` (optional): Period in days (default: 30)

**Response**:
```json
{
  "data": [ ComplaintAnalytics[] ],
  "statistics": {
    "totalComplaints": 15,
    "openComplaints": 3,
    "resolvedComplaints": 12,
    "resolutionRate": 80,
    "averageSatisfactionRating": 4.2,
    "averageResolutionTime": 2.5,
    "escalationRate": 20,
    "customerSatisfactionScore": 4.2
  },
  "total": 12
}
```

## Complaint Workflow

### Complete Complaint Lifecycle

1. **Creation** (open)
   - Customer submits complaint
   - System generates ticket ID
   - Auto-assigns category based on type
   - Status: open

2. **Acknowledgment** (acknowledged)
   - Support team reviews complaint
   - Acknowledge receipt to customer
   - Status: acknowledged
   - Check SLA compliance

3. **Assignment** (in_progress)
   - Assign to specific team member
   - Begin investigation
   - Send initial response
   - Status: in_progress

4. **Communication**
   - Exchange responses with customer
   - Track all internal discussions
   - Document findings
   - Update progress

5. **Escalation** (if needed)
   - Escalate to higher level if unresolved
   - Document escalation reason
   - Change assigned team member
   - Escalation level tracked

6. **Resolution** (resolved)
   - Document resolution actions
   - Offer compensation if applicable
   - Status: resolved
   - Resolution date recorded

7. **Feedback** (closed)
   - Collect customer feedback
   - Calculate satisfaction rating
   - Calculate NPS score
   - Status: closed

### SLA Management

- SLA defined per complaint category
- Escalate automatically if SLA exceeded
- Track compliance metrics
- Send alerts for at-risk complaints
- Report on SLA performance

## Dashboard Features

The Complaints Dashboard at `/app/complaints` includes:

### Overview
- Total complaints KPI
- Open complaints count
- Resolution rate percentage
- Customer satisfaction score

### Filtering
- Filter by status (Open, Resolved, All)
- Filter by priority (Critical, High, Medium, Low)
- Real-time data refresh

### Complaint List
- Ticket ID (clickable for details)
- Subject and description
- Status with color coding
- Priority badge
- Satisfaction rating
- Creation date

### Performance Metrics
- Average resolution time
- Escalation rate percentage
- Overall satisfaction score (1-5)
- Progress bar visualization

### Statistics
- Complaint breakdown by category
- Distribution by priority
- Resolution success rate
- Customer satisfaction trends

## Key Metrics & Analytics

### Response Time Metrics
```
Average Resolution Days = Sum of (Resolution Date - Creation Date) / Number of Resolved Complaints
SLA Compliance = (Complaints Resolved Within SLA Hours / Total Complaints) × 100
```

### Satisfaction Metrics
```
Average Satisfaction Rating = Sum of Ratings / Number of Ratings
Net Promoter Score (NPS) = (Promoters - Detractors) / Total Respondents × 100
Customer Satisfaction Score = Average Rating / 5 × 100
```

### Efficiency Metrics
```
Resolution Rate = (Resolved Complaints / Total Complaints) × 100
Escalation Rate = (Escalated Complaints / Total Complaints) × 100
Complaint Rate = (Total Complaints / Total Orders) × 100
```

## Best Practices

### Complaint Handling
- Acknowledge within 24 hours
- Investigate thoroughly before responding
- Provide clear timeline for resolution
- Keep customer informed of progress
- Document all communications

### Resolution Strategy
- Offer fair compensation proportional to issue
- Consider customer lifetime value
- Prevent repeat complaints
- Turn complaints into opportunities
- Follow up after resolution

### Escalation Management
- Use escalation for complex cases
- Set clear escalation criteria
- Document escalation reasons
- Track escalation success rate
- Prevent unnecessary escalations

### Feedback Collection
- Always collect feedback on handling
- Use NPS for satisfaction tracking
- Follow up on low satisfaction scores
- Share feedback with team
- Use feedback for improvements

### Team Performance
- Monitor individual performance metrics
- Track resolution time per agent
- Monitor customer satisfaction ratings
- Provide training for low performers
- Recognize high achievers

## Troubleshooting Guide

### Complaint Not Appearing
**Problem**: Created complaint not showing in list
**Solution**:
1. Verify userId is correct
2. Check complaint status filter
3. Ensure complaintCategoryId is valid
4. Verify customer exists

### SLA Not Triggering
**Problem**: Complaint not escalating at SLA deadline
**Solution**:
1. Check category SLA hours setting
2. Verify escalation_required flag
3. Check scheduled escalation job
4. Review complaint timestamps

### Feedback Not Recording
**Problem**: Customer feedback not saving
**Solution**:
1. Verify all required ratings provided
2. Check NPS score calculation
3. Ensure complaint is resolved first
4. Verify customer ID is valid

### Analytics Data Missing
**Problem**: Analytics showing incomplete data
**Solution**:
1. Verify period dates are correct
2. Check recordComplaintAnalytics being called
3. Ensure user_id parameter matches
4. Run manual analytics refresh

## Performance Optimization

### Database Indexes
- idx_complaints_user: Fast user-specific queries
- idx_complaints_status: Status filtering
- idx_complaints_priority: Priority sorting
- idx_complaint_responses_complaint: Response lookups
- idx_complaint_analytics_period: Analytics queries

### Query Optimization
- Use status filters to reduce dataset
- Limit response list to recent only
- Cache complaint categories
- Archive old complaints after 1 year
- Batch analytics calculations

## Security & Compliance

- All complaints associated with user_id for isolation
- RLS policies enforce data access control
- Audit trail of all changes tracked
- Attachment scanning recommended
- GDPR compliance for customer data

## Future Enhancements

- AI-powered sentiment analysis
- Automated complaint routing
- Chatbot for initial triage
- Social media monitoring integration
- Predictive escalation alerts
- Multi-language support
- Integration with CRM systems
- Advanced reporting and visualization
