# Email Marketing & Campaigns Documentation

## Overview

The Email Marketing & Campaigns System provides merchants with a comprehensive solution for managing email communications with customers. Features include template management, scheduled campaigns, delivery tracking, bounce management, compliance tracking, and detailed analytics.

## Database Schema

### Core Tables

#### `email_providers`
Email service provider configuration (SendGrid, AWS SES, Mailgun, MailerLite, Brevo).

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `provider_name` (varchar) - SendGrid, AWS SES, Mailgun, MailerLite, Brevo
- `is_active` (boolean)
- `api_key` (varchar, encrypted)
- `api_secret` (varchar, encrypted)
- `from_email` (varchar)
- `from_name` (varchar)
- `reply_to_email` (varchar)
- `monthly_quota` (integer)
- `current_usage` (integer)
- `bounce_rate` (decimal)
- `spam_rate` (decimal)
- `reputation_score` (decimal)
- `supported_countries` (text[])
- `metadata` (jsonb)
- `connected_at` (timestamp)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `email_templates`
Reusable email templates with HTML and plain text support.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `name` (varchar) - Template name
- `template_type` (varchar) - order_confirmation, shipping_update, newsletter, promotional, welcome, password_reset, etc
- `subject_line` (varchar)
- `preheader_text` (varchar)
- `html_content` (text) - Full HTML email body
- `plain_text_content` (text) - Plain text fallback
- `variables` (text[]) - {{customer_name}}, {{order_id}}, {{discount_code}}, etc
- `category` (varchar)
- `thumbnail_url` (varchar)
- `is_default` (boolean)
- `is_active` (boolean)
- `is_responsive` (boolean)
- `preview_data` (jsonb)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `email_triggers`
Automatic triggers for sending emails based on events.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `trigger_name` (varchar)
- `trigger_event` (varchar) - order_placed, payment_received, order_shipped, cart_abandoned, signup, birthday, etc
- `template_id` (uuid, FK)
- `is_enabled` (boolean)
- `delay_minutes` (integer) - Send after N minutes
- `recipient_type` (varchar) - customer, merchant, both
- `conditions` (jsonb) - Additional conditions
- `max_frequency_hours` (integer)
- `metadata` (jsonb)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `email_logs`
Complete record of all sent emails with tracking data.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `recipient_email` (varchar)
- `recipient_name` (varchar)
- `template_type` (varchar)
- `subject_line` (varchar)
- `email_body` (text)
- `status` (varchar) - pending, queued, sent, delivered, bounced, complained, opened, clicked
- `provider` (varchar)
- `provider_message_id` (varchar)
- `delivery_status` (varchar)
- `bounce_type` (varchar) - hard_bounce, soft_bounce, complaint
- `bounce_reason` (text)
- `failure_reason` (text)
- `failure_code` (varchar)
- `click_count` (integer)
- `open_count` (integer)
- `related_order_id` (uuid)
- `related_customer_id` (uuid)
- `metadata` (jsonb)
- `sent_at` (timestamp)
- `delivered_at` (timestamp)
- `opened_at` (timestamp)
- `clicked_at` (timestamp)
- `bounced_at` (timestamp)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `email_queue`
Queue for asynchronous email sending.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `recipient_email` (varchar)
- `recipient_name` (varchar)
- `template_id` (uuid, FK)
- `subject_line` (varchar)
- `html_content` (text)
- `plain_text_content` (text)
- `variables` (jsonb)
- `status` (varchar) - pending, processing, sent, failed
- `retry_count` (integer)
- `max_retries` (integer)
- `scheduled_for` (timestamp)
- `sent_at` (timestamp)
- `error_message` (text)
- `related_order_id` (uuid)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `email_preferences`
Customer email notification preferences.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `customer_id` (uuid, FK)
- `email_address` (varchar)
- `email_verified` (boolean)
- `verified_at` (timestamp)
- `all_emails` (boolean)
- `order_notifications` (boolean)
- `order_confirmation` (boolean)
- `shipping_updates` (boolean)
- `delivery_confirmation` (boolean)
- `payment_reminders` (boolean)
- `promotional_offers` (boolean)
- `newsletter` (boolean)
- `product_recommendations` (boolean)
- `weekly_digest` (boolean)
- `birthday_offers` (boolean)
- `flash_sales` (boolean)
- `abandoned_cart` (boolean)
- `is_opted_in` (boolean)
- `opted_in_date` (timestamp)
- `opted_out_date` (timestamp)
- `opted_out_reason` (varchar)
- `do_not_contact` (boolean)
- `unsubscribe_token` (varchar)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `email_campaigns`
Bulk email campaigns for marketing and promotions.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `campaign_name` (varchar)
- `description` (text)
- `campaign_type` (varchar) - newsletter, promotional, transactional, welcome, educational, seasonal, cart_recovery
- `status` (varchar) - draft, scheduled, active, paused, completed, cancelled
- `template_id` (uuid, FK)
- `subject_line` (varchar)
- `preheader_text` (varchar)
- `html_content` (text)
- `plain_text_content` (text)
- `target_audience` (varchar) - all, segment, vip, at_risk, new_customers, birthday, inactive
- `target_segment_id` (uuid)
- `recipient_count` (integer)
- `segment_filter` (jsonb)
- `scheduled_for` (timestamp)
- `started_at` (timestamp)
- `completed_at` (timestamp)
- `budget_limit` (decimal)
- `total_cost` (decimal)
- `sent_count` (integer)
- `delivered_count` (integer)
- `opened_count` (integer)
- `clicked_count` (integer)
- `bounced_count` (integer)
- `complained_count` (integer)
- `unsubscribed_count` (integer)
- `conversion_count` (integer)
- `revenue_generated` (decimal)
- `open_rate` (decimal)
- `click_rate` (decimal)
- `conversion_rate` (decimal)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `email_analytics`
Daily email metrics and statistics.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `date` (timestamp)
- `total_sent` (integer)
- `total_delivered` (integer)
- `total_bounced` (integer)
- `total_complained` (integer)
- `total_unsubscribed` (integer)
- `total_opened` (integer)
- `total_clicked` (integer)
- `total_revenue` (decimal)
- `total_conversions` (integer)
- `unique_opens` (integer)
- `unique_clicks` (integer)
- `delivery_rate` (decimal)
- `bounce_rate` (decimal)
- `complaint_rate` (decimal)
- `open_rate` (decimal)
- `click_rate` (decimal)
- `conversion_rate` (decimal)
- `revenue_per_email` (decimal)
- `unique_recipients` (integer)
- `campaign_id` (uuid)
- `created_at` (timestamp)

#### `email_bounces`
Track undeliverable email addresses.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `email_address` (varchar)
- `bounce_type` (varchar) - hard_bounce, soft_bounce, complaint
- `bounce_reason` (text)
- `is_permanent` (boolean)
- `first_bounce_at` (timestamp)
- `last_bounce_at` (timestamp)
- `bounce_count` (integer)
- `suppression_status` (varchar) - active, inactive
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `email_compliance`
GDPR, CAN-SPAM, and regulatory compliance tracking.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `customer_id` (uuid)
- `email_address` (varchar)
- `consent_type` (varchar) - marketing, transactional, newsletter, promotional
- `consent_status` (varchar) - opted_in, opted_out, pending, revoked, unsupported
- `consent_date` (timestamp)
- `consent_method` (varchar) - web_form, email, import, api, import_without_consent
- `ip_address` (varchar)
- `user_agent` (varchar)
- `regulatory_framework` (varchar) - CAN-SPAM, GDPR, CASL, PECR
- `double_opt_in_date` (timestamp)
- `list_id` (varchar)
- `notes` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

## TypeScript Types

All types defined in `/types/index.ts`:
- `EmailProvider`
- `EmailTemplate`
- `EmailTrigger`
- `EmailLog`
- `EmailQueue`
- `EmailPreferences`
- `EmailCampaign`
- `EmailAnalytics`
- `EmailBounce`
- `EmailCompliance`

## Service Functions

Location: `/lib/email/service.ts`

### Template Management

#### `createEmailTemplate(userId, template): Promise<EmailTemplate | null>`
Create email template.

#### `getEmailTemplates(userId): Promise<EmailTemplate[]>`
Fetch active email templates.

#### `updateEmailTemplate(templateId, updates): Promise<boolean>`
Update template.

### Sending

#### `queueEmail(userId, email): Promise<boolean>`
Queue email for sending.

#### `logEmail(userId, log): Promise<EmailLog | null>`
Log email attempt.

#### `updateEmailLogStatus(logId, status, deliveredAt?, openedAt?, clickedAt?): Promise<boolean>`
Update email delivery status.

### Preferences

#### `getEmailPreferences(customerId): Promise<EmailPreferences | null>`
Get customer email preferences.

#### `updateEmailPreferences(userId, customerId, preferences): Promise<boolean>`
Update customer preferences.

### Campaigns

#### `createEmailCampaign(userId, campaign): Promise<EmailCampaign | null>`
Create bulk email campaign.

#### `getEmailCampaigns(userId, status?): Promise<EmailCampaign[]>`
Fetch campaigns by status.

#### `updateEmailCampaignStatus(campaignId, status): Promise<boolean>`
Update campaign status.

### Analytics

#### `recordEmailAnalytics(userId, analytics): Promise<EmailAnalytics | null>`
Record daily metrics.

#### `getEmailAnalytics(userId, days?): Promise<EmailAnalytics[]>`
Fetch historical analytics.

### Logs

#### `getEmailLogs(userId, status?, limit?): Promise<EmailLog[]>`
Retrieve email logs.

### Bounce Management

#### `recordBounce(userId, emailAddress, bounceType, bounceReason?): Promise<boolean>`
Track undeliverable emails.

### Compliance

#### `recordConsentForEmail(userId, customerId, emailAddress, consentStatus, consentMethod, regulatoryFramework?): Promise<boolean>`
Record customer consent.

### Provider Management

#### `getEmailProviders(userId): Promise<EmailProvider[]>`
Fetch email providers.

#### `getActiveEmailProvider(userId): Promise<EmailProvider | null>`
Fetch active provider.

## API Endpoints

### Templates

**GET** `/api/email/templates?userId=...`
List email templates.

**POST** `/api/email/templates`
Create template.

### Send Email

**POST** `/api/email/send`
Queue email for sending.

### Campaigns

**GET** `/api/email/campaigns?userId=...&status=...`
List campaigns.

**POST** `/api/email/campaigns`
Create campaign.

## UI Components

### Email Dashboard (`/app/email/page.tsx`)

Features:
- Template management (create, edit, delete)
- Campaign management
- Email logs and delivery tracking
- Analytics dashboard
- KPI cards (templates, campaigns, sent, open rate)

## Features

✅ **Template Management** - Reusable email templates
✅ **Template Variables** - Dynamic content insertion
✅ **Message Scheduling** - Send at specific times
✅ **Bulk Campaigns** - Send to customer segments
✅ **Delivery Tracking** - Real-time email status
✅ **Bounce Management** - Track undeliverable emails
✅ **Analytics** - Open rates, click rates, costs
✅ **Compliance** - GDPR, CAN-SPAM, CASL, PECR
✅ **Opt-in/Out** - Customer preferences
✅ **Multi-Provider** - SendGrid, AWS SES, Mailgun, MailerLite, Brevo

## Best Practices

- Use responsive email templates
- Test all templates before sending
- Include unsubscribe link in all marketing emails
- Respect customer preferences
- Monitor bounce rates
- Track open and click rates
- Use A/B testing for subject lines
- Segment customers for targeted campaigns
- Maintain clean email lists
- Monitor sender reputation score

## Compliance

- **CAN-SPAM** - Identify as advertisement, include opt-out
- **GDPR** - Explicit consent required, respect preferences
- **CASL** - Detailed consent records
- **PECR** - Prior consent for marketing
- Maintain double opt-in records
- Store consent method and date
- Allow easy unsubscription
- Process unsubscribe requests within 10 business days

## Performance

- Batch email processing
- Queue-based asynchronous sending
- Index on email address and status
- Archive old logs monthly
- Cache analytics data
- Optimize query performance
- Implement exponential backoff for retries
- Rate limiting per provider

## Troubleshooting

### Emails Not Sending

- Check provider configuration
- Verify email format
- Check API keys/credentials
- Verify sender email is authorized
- Check queue for pending items

### High Bounce Rate

- Verify email addresses
- Remove hard bounces from list
- Check customer data quality
- Clean email list regularly

### Delivery Issues

- Check provider status
- Review failure codes
- Monitor retry attempts
- Check rate limiting

### Low Open Rates

- Test subject lines
- Optimize send times
- Improve template design
- Segment better
- Review content relevance

## Integrations

- **SendGrid** - Full support
- **AWS SES** - Full support
- **Mailgun** - Full support
- **MailerLite** - Full support
- **Brevo** - Full support

## Migration & Data Import

- Support bulk email import
- Consent verification on import
- Duplicate detection
- List segmentation on import
