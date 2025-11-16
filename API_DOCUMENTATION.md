# Omni Sales SaaS Platform - API Documentation

## Overview

Complete API documentation for the Omni Sales SaaS platform covering all implemented features and endpoints.

**Base URLs:**
- Development: `http://localhost:3000/api`
- Production: `https://api.omnisales.com/api`

## Features & API Endpoints Summary

### 1. Loyalty & Rewards Management (Feature #11)

Manage customer loyalty programs, points, tiers, and rewards.

#### Endpoints:
- **GET /loyalty/tiers** - Fetch all loyalty tiers
- **POST /loyalty/tiers** - Create new loyalty tier
- **POST /loyalty/points** - Award points to customer
- **GET /loyalty/rewards** - List available rewards
- **POST /loyalty/rewards** - Redeem reward for customer
- **GET /loyalty/analytics** - Get loyalty program analytics

#### Key Functionality:
- Multi-tier loyalty system
- Point accrual based on purchases
- Automated tier progression
- Reward redemption tracking
- RFM-based tier eligibility

---

### 2. SMS Notifications (Feature #12)

Send and manage SMS marketing campaigns.

#### Endpoints:
- **POST /sms/send** - Queue SMS for delivery
- **GET /sms/templates** - List SMS templates
- **POST /sms/templates** - Create SMS template
- **GET /sms/campaigns** - List SMS campaigns
- **POST /sms/campaigns** - Create SMS campaign
- **GET /sms/analytics** - Get SMS performance metrics
- **POST /sms/preferences** - Set customer SMS preferences

#### Key Functionality:
- SMS template management
- Campaign scheduling
- Delivery tracking
- Message queuing
- Opt-in/opt-out management
- Performance analytics (delivery rate, open rate, click rate)

---

### 3. Email Marketing (Feature #13)

Comprehensive email marketing and campaign management.

#### Endpoints:
- **GET /email/templates** - List email templates
- **POST /email/templates** - Create email template
- **POST /email/send** - Queue email for sending
- **GET /email/campaigns** - List email campaigns
- **POST /email/campaigns** - Create email campaign
- **GET /email/logs** - View email sending logs
- **GET /email/analytics** - Get email performance metrics
- **POST /email/preferences** - Set customer email preferences
- **POST /email/bounces** - Track bounce events

#### Key Functionality:
- Email template builder
- Campaign scheduling
- Delivery logging
- Bounce tracking (hard bounce, soft bounce, complaint)
- Open rate and click tracking
- Deliverability compliance (CAN-SPAM, GDPR, CASL, PECR)
- Email preference management

---

### 4. Customer Segmentation & Analytics (Feature #14)

Advanced customer segmentation with behavioral analytics.

#### Endpoints:
- **GET /segmentation/segments** - Get customer segments
- **POST /segmentation/segments** - Create segment
- **POST /segmentation/events** - Record behavior event
- **GET /segmentation/analytics** - Get analytics data
- **GET /segmentation/cohorts** - Get customer cohorts
- **GET /segmentation/journeys** - Get customer journey stages
- **POST /segmentation/ltv** - Record LTV prediction

#### Segmentation Types:
- **RFM (Recency, Frequency, Monetary)** - Automated RFM scoring
- **Behavioral** - Event-based segmentation
- **Demographic** - Customer attribute segmentation
- **Cohort** - Acquisition-based grouping
- **Custom** - User-defined criteria

#### Tracked Metrics:
- Event-level tracking (page view, product view, purchase, etc.)
- Customer journey stage mapping
- Lifetime value predictions
- Churn probability scoring
- Daily behavioral analytics
- Segment performance metrics

---

### 5. Product Recommendations (Feature #15)

AI-powered product recommendation engine.

#### Endpoints:
- **POST /recommendations/generate** - Generate recommendations
- **GET /recommendations/generate** - Get stored recommendations
- **POST /recommendations/track** - Track click/conversion
- **GET /recommendations/track** - Get tracking data
- **GET /recommendations/analytics** - Get performance analytics
- **POST /recommendations/rules** - Create recommendation rule
- **POST /recommendations/preferences** - Set personalization preferences

#### Recommendation Algorithms:
- **Collaborative Filtering** - User-user and item-item similarity
- **Content-Based** - Product attribute similarity
- **Popularity-Based** - Trending and best-selling products
- **Rule-Based** - Custom business rules
- **Hybrid** - Combination of multiple algorithms

#### Delivery Contexts:
- Product page recommendations
- Shopping cart suggestions
- Email campaign personalization
- Homepage featured products
- Search result enhancement

#### Tracking:
- Impression tracking
- Click tracking with device type
- Conversion tracking with revenue
- Per-product performance metrics
- Algorithm effectiveness analytics

---

### 6. Orders Management (Feature #9)

Order creation, management, and tracking.

#### Endpoints:
- **GET /orders** - List orders (with filtering)
- **POST /orders** - Create order
- **GET /orders/{id}** - Get order details
- **PUT /orders/{id}** - Update order
- **GET /orders/status** - Get order by status
- **POST /orders/{id}/refund** - Refund order

#### Features:
- Multi-channel order support
- Order status tracking
- Payment processing
- Shipping integration
- Order history and analytics

---

### 7. Customers (CRM)

Customer management and relationship tracking.

#### Endpoints:
- **GET /customers** - List all customers
- **POST /customers** - Create customer
- **GET /customers/{id}** - Get customer details
- **PUT /customers/{id}** - Update customer
- **GET /customers/{id}/orders** - Get customer orders
- **GET /customers/{id}/rfm** - Get customer RFM metrics
- **GET /customers/search** - Search customers

#### Features:
- Customer profile management
- Contact information tracking
- Purchase history
- RFM analysis
- Customer tagging and segmentation
- Lifetime value metrics

---

### 8. Products

Product catalog management.

#### Endpoints:
- **GET /products** - List products
- **POST /products** - Create product
- **GET /products/{id}** - Get product details
- **PUT /products/{id}** - Update product
- **GET /products/category** - Filter by category
- **GET /products/search** - Search products

#### Features:
- Product catalog management
- Category and SKU management
- Pricing and inventory
- Product description and images

---

## Request/Response Format

### Standard Response Format

**Success Response (2xx)**:
```json
{
  "data": { /* response data */ },
  "total": 10,
  "message": "Operation successful"
}
```

**Error Response (4xx/5xx)**:
```json
{
  "error": "Error message",
  "status": 400,
  "code": "ERROR_CODE"
}
```

### Authentication

All endpoints require authentication via Bearer token in the Authorization header:

```
Authorization: Bearer <JWT_TOKEN>
```

### Common Query Parameters

- `userId` - Required for most operations
- `customerId` - Customer identifier
- `limit` - Results per page (default: 10)
- `offset` - Pagination offset
- `sortBy` - Field to sort by
- `order` - ASC or DESC
- `days` - Number of days for analytics (default: 30)

---

## API Usage Examples

### Example 1: Create Customer Segment

```bash
curl -X POST http://localhost:3000/api/segmentation/segments \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "name": "High-Value Customers",
    "segmentType": "rfm",
    "description": "Customers with high lifetime value",
    "criteria": {
      "minMonetary": 1000,
      "minFrequency": 5
    }
  }'
```

### Example 2: Generate Product Recommendations

```bash
curl -X POST http://localhost:3000/api/recommendations/generate \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "customerId": "cust_456",
    "context": "product_page",
    "maxRecommendations": 5
  }'
```

### Example 3: Send Email Campaign

```bash
curl -X POST http://localhost:3000/api/email/campaigns \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "campaignName": "Weekly Newsletter",
    "campaignType": "newsletter",
    "templateId": "template_123",
    "recipientSegment": "all_active_customers"
  }'
```

### Example 4: Track Recommendation Conversion

```bash
curl -X POST http://localhost:3000/api/recommendations/track \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "customerId": "cust_456",
    "recommendationId": "rec_123",
    "productId": "prod_789",
    "trackingType": "conversion",
    "orderId": "order_123",
    "revenue": 49.99
  }'
```

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| MISSING_REQUIRED_FIELDS | 400 | Required field missing in request |
| INVALID_USER_ID | 400 | Invalid or missing userId |
| INVALID_CUSTOMER_ID | 400 | Invalid or missing customerId |
| NOT_FOUND | 404 | Resource not found |
| DUPLICATE_ENTRY | 409 | Resource already exists |
| OPERATION_FAILED | 500 | Database operation failed |
| INVALID_REQUEST | 400 | Invalid request format |
| UNAUTHORIZED | 401 | Authentication failed |
| FORBIDDEN | 403 | Access denied |

---

## Rate Limiting

API rate limits are enforced per user:
- **Standard tier**: 1,000 requests/hour
- **Premium tier**: 10,000 requests/hour
- **Enterprise**: Custom limits

Rate limit information is returned in response headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640000000
```

---

## SDK/Client Libraries

Official SDKs available for:
- JavaScript/TypeScript
- Python
- PHP
- Ruby
- Java
- Go

---

## Webhook Events

Real-time event notifications for key actions:
- `order.created`
- `order.updated`
- `order.delivered`
- `customer.segment_changed`
- `recommendation.clicked`
- `recommendation.converted`
- `email.delivered`
- `email.bounced`
- `sms.delivered`

Subscribe to webhooks via the dashboard.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-11-15 | Initial release (Features #9-15) |

---

## Support

For API support and questions:
- Email: api-support@omnisales.com
- Documentation: https://docs.omnisales.com
- Status: https://status.omnisales.com
