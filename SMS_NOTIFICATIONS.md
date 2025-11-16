# SMS & Text Message Notifications Documentation

## Overview

The SMS & Text Message Notifications System provides merchants with a complete solution for sending SMS messages to customers. Features include template management, scheduled campaigns, delivery tracking, compliance management, and detailed analytics.

## Database Schema

### Core Tables

#### `sms_providers`
SMS service provider configuration (Twilio, AWS SNS, Nexmo).

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `provider_name` (varchar) - Twilio, AWS SNS, Nexmo
- `is_active` (boolean)
- `api_key` (varchar, encrypted)
- `api_secret` (varchar, encrypted)
- `sender_id` (varchar) - Phone number or alphanumeric ID
- `monthly_quota` (integer)
- `current_usage` (integer)
- `supported_countries` (text[])
- `connected_at` (timestamp)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `sms_templates`
Reusable SMS message templates.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `name` (varchar) - Template name
- `template_type` (varchar) - order_confirmation, shipping_update, payment_reminder, promotional, etc
- `content` (text) - Message content (max 160 chars per SMS segment)
- `variables` (text[]) - Template variables like {{customer_name}}, {{order_id}}
- `character_count` (integer)
- `sms_count` (integer) - Number of SMS segments (160 chars = 1 segment)
- `is_default` (boolean)
- `is_active` (boolean)
- `preview_data` (jsonb)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `sms_triggers`
Automatic triggers for sending SMS based on events.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `trigger_name` (varchar)
- `trigger_event` (varchar) - order_placed, payment_received, order_shipped, delivery_confirmed
- `template_id` (uuid, FK)
- `is_enabled` (boolean)
- `delay_minutes` (integer) - Send after N minutes
- `recipient_type` (varchar) - customer, merchant, both
- `conditions` (jsonb) - Additional conditions
- `max_frequency_hours` (integer)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `sms_logs`
Complete record of all sent SMS messages.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `recipient_phone` (varchar)
- `recipient_name` (varchar)
- `template_type` (varchar)
- `content` (text)
- `status` (varchar) - pending, queued, sent, delivered, failed, bounced
- `provider` (varchar)
- `provider_message_id` (varchar)
- `delivery_status` (varchar)
- `failure_reason` (text)
- `failure_code` (varchar)
- `segments_used` (integer)
- `cost` (decimal)
- `related_order_id` (uuid)
- `related_customer_id` (uuid)
- `sent_at` (timestamp)
- `delivered_at` (timestamp)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `sms_queue`
Queue for asynchronous SMS sending.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `recipient_phone` (varchar)
- `recipient_name` (varchar)
- `template_id` (uuid, FK)
- `content` (text)
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

#### `sms_preferences`
Customer SMS notification preferences.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `customer_id` (uuid, FK)
- `customer_phone` (varchar)
- `phone_verified` (boolean)
- `verified_at` (timestamp)
- `order_notifications` (boolean)
- `order_confirmation` (boolean)
- `shipping_updates` (boolean)
- `delivery_confirmation` (boolean)
- `payment_reminders` (boolean)
- `promotional_offers` (boolean)
- `cart_abandonment` (boolean)
- `loyalty_rewards` (boolean)
- `is_opted_in` (boolean)
- `opted_in_date` (timestamp)
- `opted_out_date` (timestamp)
- `do_not_contact` (boolean)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `sms_campaigns`
Bulk SMS campaigns for marketing and promotions.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `campaign_name` (varchar)
- `description` (text)
- `campaign_type` (varchar) - promotional, transactional, reminder, verification
- `status` (varchar) - draft, scheduled, active, paused, completed, cancelled
- `template_id` (uuid, FK)
- `content` (text)
- `target_audience` (varchar) - all, segment, vip, at_risk, new_customers
- `recipient_count` (integer)
- `scheduled_for` (timestamp)
- `started_at` (timestamp)
- `completed_at` (timestamp)
- `budget_limit` (decimal)
- `total_cost` (decimal)
- `sent_count` (integer)
- `delivered_count` (integer)
- `failed_count` (integer)
- `conversion_rate` (decimal)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `sms_analytics`
Daily SMS metrics and statistics.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `date` (timestamp)
- `total_sent` (integer)
- `total_delivered` (integer)
- `total_failed` (integer)
- `total_bounced` (integer)
- `total_cost` (decimal)
- `segments_used` (integer)
- `delivery_rate` (decimal)
- `failure_rate` (decimal)
- `bounce_rate` (decimal)
- `avg_segments_per_message` (decimal)
- `unique_recipients` (integer)
- `campaign_id` (uuid)
- `created_at` (timestamp)

#### `sms_bounces`
Track undeliverable phone numbers.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `phone_number` (varchar)
- `bounce_type` (varchar) - permanent, temporary, invalid
- `bounce_reason` (text)
- `is_permanent` (boolean)
- `first_bounce_at` (timestamp)
- `last_bounce_at` (timestamp)
- `bounce_count` (integer)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `sms_compliance`
GDPR, TCPA, and regulatory compliance tracking.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `customer_id` (uuid)
- `phone_number` (varchar)
- `consent_type` (varchar) - marketing, transactional, all
- `consent_status` (varchar) - opted_in, opted_out, pending, revoked
- `consent_date` (timestamp)
- `consent_method` (varchar) - web_form, phone_call, sms, email
- `ip_address` (varchar)
- `regulatory_framework` (varchar) - TCPA, GDPR, PDPA
- `notes` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

## TypeScript Types

All types defined in `/types/index.ts`:
- `SMSTemplate`
- `SMSLog`
- `SMSCampaign`
- `SMSAnalytics`
- `SMSPreferences`
- `SMSProvider`
- `SMSTrigger`
- `SMSQueue`
- `SMSBounce`
- `SMSCompliance`

## Service Functions

Location: `/lib/sms/service.ts`

### Template Management

#### `createSMSTemplate(userId, template): Promise<SMSTemplate | null>`
Create SMS template.

#### `getSMSTemplates(userId): Promise<SMSTemplate[]>`
Fetch active SMS templates.

### Sending

#### `queueSMS(userId, sms): Promise<boolean>`
Queue SMS for sending.

#### `logSMS(userId, log): Promise<SMSLog | null>`
Log SMS delivery.

### Preferences

#### `getSMSPreferences(customerId): Promise<object | null>`
Get customer SMS preferences.

#### `updateSMSPreferences(userId, customerId, preferences): Promise<boolean>`
Update customer preferences.

### Campaigns

#### `createSMSCampaign(userId, campaign): Promise<SMSCampaign | null>`
Create bulk SMS campaign.

#### `getSMSCampaigns(userId, status?): Promise<SMSCampaign[]>`
Fetch campaigns by status.

### Analytics

#### `recordSMSAnalytics(userId, analytics): Promise<SMSAnalytics | null>`
Record daily metrics.

#### `getSMSAnalytics(userId, days?): Promise<SMSAnalytics[]>`
Fetch historical analytics.

### Logs

#### `getSMSLogs(userId, status?, limit?): Promise<SMSLog[]>`
Retrieve SMS logs.

#### `updateSMSLogStatus(logId, status, deliveredAt?): Promise<boolean>`
Update SMS delivery status.

### Bounce Management

#### `recordBounce(userId, phoneNumber, bounceType, bounceReason?): Promise<boolean>`
Track undeliverable numbers.

### Compliance

#### `recordConsentForSMS(userId, customerId, phoneNumber, consentStatus, consentMethod, regulatoryFramework?): Promise<boolean>`
Record customer consent.

## API Endpoints

### Templates

**GET** `/api/sms/templates?userId=...`
List SMS templates.

**POST** `/api/sms/templates`
Create template.

### Send SMS

**POST** `/api/sms/send`
Queue SMS for sending.

### Campaigns

**GET** `/api/sms/campaigns?userId=...&status=...`
List campaigns.

**POST** `/api/sms/campaigns`
Create campaign.

## UI Components

### SMS Dashboard (`/app/sms/page.tsx`)

Features:
- Template management (create, edit, delete)
- Campaign management
- SMS logs and delivery tracking
- Analytics dashboard
- KPI cards (templates, campaigns, sent, delivery rate)

## Features

✅ **Template Management** - Reusable SMS templates
✅ **Message Scheduling** - Send at specific times
✅ **Bulk Campaigns** - Send to customer segments
✅ **Delivery Tracking** - Real-time SMS status
✅ **Bounce Management** - Track undeliverable numbers
✅ **Analytics** - Delivery rates, costs, insights
✅ **Compliance** - GDPR, TCPA, PDPA support
✅ **Opt-in/Out** - Customer preferences
✅ **Cost Tracking** - SMS segment billing
✅ **Multi-Provider** - Twilio, AWS SNS, Nexmo

## Best Practices

- Keep messages under 160 characters (1 SMS segment)
- Use templates for consistency
- Respect opt-out preferences
- Track consent for compliance
- Monitor delivery rates
- Schedule during business hours
- Test campaigns before sending
- Maintain bounce list

## Compliance

- GDPR - Explicit consent required
- TCPA - No unsolicited marketing
- PDPA - Thailand compliance
- CCPA - California privacy
- Customer opt-in/out records
- Message content logging

## Performance

- Batch SMS processing
- Queue-based sending
- Index on phone number
- Archive old logs monthly
- Cache analytics
- Optimize queries

## Troubleshooting

### SMS Not Sending
- Check provider configuration
- Verify phone number format
- Check quota limits
- Verify template content

### High Bounce Rate
- Verify phone numbers
- Check bounce reasons
- Clean bounce list
- Update invalid numbers

### Delivery Issues
- Check provider status
- Review failure codes
- Monitor retry attempts
- Check rate limiting
