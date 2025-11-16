# Email System Guide

Complete guide for the multi-provider email system with SendGrid, Mailgun, and Nodemailer support.

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Setup](#setup)
4. [Email Templates](#email-templates)
5. [Campaign Management](#campaign-management)
6. [API Reference](#api-reference)
7. [Webhooks](#webhooks)
8. [Analytics](#analytics)
9. [Best Practices](#best-practices)

## Overview

The email system provides enterprise-grade email functionality with:
- **Multi-provider support**: SendGrid, Mailgun, Nodemailer (SMTP)
- **Automatic failover**: If primary provider fails, automatically tries backup providers
- **Template management**: Create and manage email templates with variables
- **Campaign management**: Schedule emails, segment recipients, A/B testing
- **Deliverability features**: Rate limiting, bounce handling, retry logic
- **Analytics**: Track opens, clicks, bounces, conversions

## Features

### Multi-Provider Support
- **SendGrid**: Best for high-volume transactional and marketing emails
- **Mailgun**: Reliable delivery with detailed analytics
- **Nodemailer**: SMTP fallback, works with any email provider

### Email Template Management
- CRUD operations for email templates
- Variable replacement: `{{customer_name}}`, `{{order_id}}`, etc.
- HTML editor with preview
- Test sending
- Default templates included

### Campaign Management
- Schedule emails for future delivery
- Segment recipients by RFM, tags, custom filters
- A/B testing (subject lines, content)
- Bounce and complaint management
- Unsubscribe handling

### Deliverability
- DKIM/SPF/DMARC support (via provider)
- Bounce handling (hard/soft)
- Complaint management
- Rate limiting (100 emails/second default)
- Exponential backoff retry logic

### Analytics
- Track email opens
- Track link clicks
- Monitor bounce rates
- Track unsubscribes
- Dashboard with metrics

## Setup

### 1. Install Dependencies

Dependencies are already installed:
- `@sendgrid/mail`
- `mailgun.js`
- `nodemailer`

### 2. Configure Environment Variables

Add to your `.env` file:

```bash
# Primary provider (sendgrid, mailgun, or nodemailer)
EMAIL_PROVIDER=sendgrid

# From address
EMAIL_FROM_ADDRESS=noreply@yourdomain.com

# SendGrid (recommended)
SENDGRID_API_KEY=SG.your_api_key_here

# Mailgun (alternative)
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=mg.yourdomain.com

# Nodemailer/SMTP (fallback)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_password

# Rate limiting (emails per second)
EMAIL_RATE_LIMIT=100

# App URL (for tracking)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 3. Run Database Migration

```bash
# Apply email system migration
npx supabase db push
```

Or manually run the migration in `/supabase/migrations/20250116_email_system.sql`

### 4. Configure Webhooks

#### SendGrid
1. Go to https://app.sendgrid.com/settings/mail_settings/webhook_settings
2. Add webhook URL: `https://yourdomain.com/api/email/webhooks/sendgrid`
3. Select events: delivered, open, click, bounce, dropped, spam_report, unsubscribe

#### Mailgun
1. Go to https://app.mailgun.com/app/sending/domains/YOURDOMAIN/webhooks
2. Add webhook URL: `https://yourdomain.com/api/email/webhooks/mailgun`
3. Select events: delivered, opened, clicked, bounced, failed, complained, unsubscribed

## Email Templates

### Creating Templates

#### Via Admin UI
Navigate to `/admin/email-templates` to create and manage templates using the visual editor.

#### Via API
```javascript
const response = await fetch('/api/email/templates', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-id',
    name: 'order_confirmation',
    subject: 'Order Confirmation - Order #{{order_id}}',
    htmlContent: `
      <h1>Thank you, {{customer_name}}!</h1>
      <p>Your order #{{order_id}} has been confirmed.</p>
    `,
    category: 'transactional'
  })
});
```

### Default Templates

The system includes 7 default templates:

1. **Order Confirmation** - Sent when order is placed
2. **Shipment Notification** - Sent when order ships
3. **Delivery Notification** - Sent when order is delivered
4. **Payment Receipt** - Sent after payment
5. **Abandoned Cart Reminder** - Sent for abandoned carts
6. **Customer Feedback Request** - Request reviews
7. **Promotional Campaign** - Marketing campaigns

### Template Variables

Use `{{variable_name}}` syntax in templates:

Common variables:
- `{{customer_name}}`
- `{{order_id}}`
- `{{order_date}}`
- `{{total_amount}}`
- `{{currency_symbol}}`
- `{{tracking_number}}`
- `{{company_name}}`

Variables are automatically extracted and validated.

## Campaign Management

### Creating a Campaign

```javascript
const response = await fetch('/api/email/campaign', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-id',
    name: 'Summer Sale Campaign',
    templateId: 'template-id',
    sendFrom: 'noreply@yourdomain.com',
    segmentFilters: {
      rfm_segment: ['champions', 'loyal_customers'],
      min_total_spent: 100
    },
    scheduledAt: '2025-06-01T10:00:00Z',
    abTest: {
      enabled: true,
      variant_a: {
        subject: 'Summer Sale - 20% Off!'
      },
      variant_b: {
        subject: 'Hot Summer Deals Inside!'
      },
      split_percentage: 50,
      winner_metric: 'open_rate'
    }
  })
});
```

### Recipient Segmentation

Filter recipients by:
- **RFM segments**: champions, loyal_customers, at_risk, etc.
- **Tags**: customer tags
- **Order count**: min/max order count
- **Total spent**: min/max total spent
- **Last order**: days since last order

### A/B Testing

Test different:
- Subject lines
- Email content
- Sending times

The system tracks performance and determines the winner based on:
- Open rate
- Click rate
- Conversion rate

## API Reference

### Send Single Email

```
POST /api/email/send
```

**Request:**
```json
{
  "to": "customer@example.com",
  "from": "noreply@yourdomain.com",
  "subject": "Your Order Confirmation",
  "html": "<h1>Thank you!</h1>",
  "text": "Thank you!",
  "templateId": "template-id-here",
  "templateVariables": {
    "customer_name": "John Doe",
    "order_id": "12345"
  },
  "tags": ["order", "confirmation"],
  "metadata": {
    "order_id": "12345",
    "customer_id": "cust-123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "msg_abc123",
  "provider": "sendgrid"
}
```

### Create Campaign

```
POST /api/email/campaign
```

### List Templates

```
GET /api/email/templates?userId=user-id&category=transactional
```

### Get Analytics

```
GET /api/email/analytics?campaignId=campaign-id
GET /api/email/analytics?userId=user-id&startDate=2025-01-01&endDate=2025-01-31
```

## Webhooks

### SendGrid Webhook Handler

```
POST /api/email/webhooks/sendgrid
```

Handles events: delivered, open, click, bounce, dropped, spam_report, unsubscribe

### Mailgun Webhook Handler

```
POST /api/email/webhooks/mailgun
```

Handles events: delivered, opened, clicked, bounced, failed, complained, unsubscribed

## Analytics

### Tracking Email Opens

Email opens are tracked automatically via a 1x1 tracking pixel.

The system adds a tracking pixel to all HTML emails:
```html
<img src="https://yourdomain.com/api/email/track/open?mid=message-id" width="1" height="1" />
```

### Tracking Link Clicks

All links in emails can be tracked:

```javascript
import { getEmailAnalyticsTracker } from '@/lib/email/analytics/tracker';

const tracker = getEmailAnalyticsTracker();
const trackedUrl = tracker.generateTrackedLink(messageId, 'https://example.com/product');
```

### Available Metrics

- **Emails sent**: Total emails sent
- **Emails delivered**: Successfully delivered
- **Emails opened**: Number of opens
- **Emails clicked**: Number of clicks
- **Open rate**: Percentage of delivered emails opened
- **Click rate**: Percentage of delivered emails clicked
- **Bounce rate**: Percentage of bounced emails
- **Unsubscribe rate**: Percentage unsubscribed

## Best Practices

### 1. Provider Configuration

- **Use SendGrid or Mailgun** for production (not SMTP)
- Configure webhooks for accurate tracking
- Set up SPF, DKIM, and DMARC records for your domain

### 2. Template Design

- Use responsive HTML templates
- Always provide plain text version
- Test templates before sending
- Keep subject lines under 50 characters
- Personalize with variables

### 3. Campaign Management

- Segment your audience
- Test with small sample before full send
- Use A/B testing for important campaigns
- Respect unsubscribe requests
- Monitor bounce rates

### 4. Deliverability

- Maintain clean email lists
- Remove hard bounces immediately
- Monitor soft bounce threshold (5 bounces)
- Handle complaints promptly
- Use double opt-in for subscriptions

### 5. Rate Limiting

- Default: 100 emails/second
- Adjust based on your provider's limits
- SendGrid: up to 15,000/hour on free tier
- Mailgun: up to 10,000/month on free tier

### 6. Analytics

- Track opens and clicks
- Monitor bounce rates (keep under 5%)
- Analyze campaign performance
- A/B test to improve results

## Troubleshooting

### Emails Not Sending

1. Check environment variables are set
2. Verify API keys are correct
3. Check provider account status
4. Review rate limiting settings
5. Check email logs in database

### Webhooks Not Working

1. Verify webhook URLs are accessible
2. Check webhook configuration in provider
3. Review webhook handler logs
4. Test with provider's webhook tester

### Low Deliverability

1. Check SPF/DKIM/DMARC records
2. Review bounce rates
3. Clean email list
4. Reduce sending frequency
5. Improve email content

## Example Workflows

### Send Order Confirmation

```javascript
// After order creation
await fetch('/api/email/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: order.customer_email,
    from: process.env.EMAIL_FROM_ADDRESS,
    templateId: 'order_confirmation_template_id',
    templateVariables: {
      customer_name: order.customer_name,
      order_id: order.id,
      order_date: new Date().toLocaleDateString(),
      total_amount: order.total,
      currency_symbol: '$',
      order_tracking_url: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}`,
      company_name: 'Your Company',
      company_address: '123 Main St, City, Country'
    }
  })
});
```

### Send Marketing Campaign

```javascript
// Create and schedule campaign
await fetch('/api/email/campaign', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-id',
    name: 'Black Friday Sale',
    templateId: 'promotional_template_id',
    sendFrom: 'marketing@yourdomain.com',
    segmentFilters: {
      rfm_segment: ['champions', 'loyal_customers'],
      min_total_spent: 50
    },
    scheduledAt: '2025-11-29T09:00:00Z'
  })
});
```

## Support

For issues or questions:
- Check the error logs in `/api/email/*` endpoints
- Review database tables: `email_logs`, `email_analytics`
- Contact provider support (SendGrid, Mailgun)
