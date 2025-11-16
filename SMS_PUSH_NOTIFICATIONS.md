# SMS & Push Notifications System

## Overview

The SMS & Push Notifications System is a comprehensive multi-channel notification platform for the Omni-Sales system, enabling businesses to reach customers through both SMS text messages and mobile push notifications. The system provides complete campaign lifecycle management, provider integration, template management, and detailed analytics.

## Database Schema

### Core Tables (10 Tables)

#### 1. sms_providers
Stores SMS service provider configurations (Twilio, AWS SNS, Nexmo, Sinch).
- Columns: id, user_id, provider_name, provider_type, api_key, api_secret, account_sid, phone_number, is_active, config
- Purpose: Manage multiple SMS provider integrations
- Indexes: user_id, is_active

#### 2. push_providers
Stores push notification service provider configurations (Firebase, OneSignal, AWS SNS, APNS).
- Columns: id, user_id, provider_name, provider_type, api_key, api_secret, server_key, sender_id, is_active, config
- Purpose: Manage multiple push notification providers
- Indexes: user_id, is_active

#### 3. sms_templates
Reusable SMS message templates with variable support.
- Columns: id, user_id, template_name, content, variables, character_count, description
- Purpose: Create and manage SMS templates for campaigns
- Character limit: 160-480 characters per SMS segment
- Supports personalization variables: {{firstName}}, {{lastName}}, etc.

#### 4. push_templates
Reusable push notification templates with rich media support.
- Columns: id, user_id, template_name, title, body, image_url, action_url, variables, description
- Purpose: Create and manage push notification templates
- Supports: Title, body text, images, deep links

#### 5. sms_campaigns
SMS campaign definitions and metadata.
- Columns: id, user_id, campaign_name, template_id, provider_id, description, status, scheduled_send_time, sent_at, audience_filter
- Statuses: draft, scheduled, sending, sent, paused, failed
- Supports audience filtering by customer attributes
- Indexes: user_id + status, scheduled_send_time

#### 6. push_campaigns
Push notification campaign definitions and metadata.
- Columns: id, user_id, campaign_name, template_id, provider_id, description, status, scheduled_send_time, sent_at, audience_filter
- Statuses: draft, scheduled, sending, sent, paused, failed
- Supports audience filtering by device type and user segments

#### 7. sms_campaign_recipients
Individual SMS delivery tracking per recipient.
- Columns: id, campaign_id, phone_number, recipient_name, user_id, status, delivered_at, read_at, failure_reason, provider_message_id, personalization_data
- Statuses: queued, sending, delivered, failed, bounced, opted_out
- Tracks: Delivery status, timestamps, provider message IDs
- Indexes: campaign_id, phone_number, status, user_id + status

#### 8. push_campaign_recipients
Individual push notification delivery tracking per device.
- Columns: id, campaign_id, device_token, recipient_name, device_type, user_id, status, delivered_at, opened_at, clicked_at, failure_reason, provider_message_id, personalization_data
- Device types: ios, android, web, unknown
- Statuses: queued, sending, delivered, failed, bounced, opted_out
- Tracks: Delivery, opens, clicks

#### 9. notification_preferences
User notification opt-in/opt-out preferences.
- Columns: id, user_id, customer_id, phone_number, device_token, sms_opted_in, push_opted_in, marketing_opted_in, transactional_opted_in, sms_categories, push_categories
- Purpose: Manage subscription preferences per customer
- Supports category-level preferences (marketing, transactional, etc.)
- Indexes: phone_number, device_token, user_id

#### 10. notification_events
Comprehensive event log for all notifications sent.
- Columns: id, campaign_id, recipient_id, campaign_type, user_id, event_type, event_timestamp, metadata
- Event types: sent, delivered, opened, clicked, failed, bounced, opted_out
- Purpose: Audit trail and analytics data source
- Indexes: campaign_id + event_type, user_id

## TypeScript Types

### Provider Types
- `SMSProviderType`: 'twilio' | 'aws_sns' | 'nexmo' | 'sinch'
- `PushProviderType`: 'firebase' | 'onesignal' | 'aws_sns' | 'apns'

### Campaign & Status Types
- `NotificationStatus`: 'queued' | 'sending' | 'delivered' | 'failed' | 'bounced' | 'opted_out'
- `NotificationEventType`: 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed' | 'bounced' | 'opted_out'
- `DeviceType`: 'ios' | 'android' | 'web' | 'unknown'
- `CampaignType`: 'sms' | 'push'

### Key Interfaces
- `SMSProvider`, `PushProvider`: Provider configurations
- `SMSTemplate`, `PushTemplate`: Template definitions
- `SMSCampaign`, `PushCampaign`: Campaign configurations
- `SMSCampaignRecipient`, `PushCampaignRecipient`: Recipient delivery tracking
- `NotificationPreferences`: User preferences
- `NotificationEvent`: Event log entries
- `NotificationDashboardData`: Aggregated metrics

## Service Layer Functions (lib/notification/service.ts)

### Provider Management
- `getSMSProviders(userId)`: Get all SMS providers
- `createSMSProvider(userId, providerData)`: Create new SMS provider
- `updateSMSProvider(userId, providerId, updates)`: Update SMS provider
- `getPushProviders(userId)`: Get all push providers
- `createPushProvider(userId, providerData)`: Create push provider
- `updatePushProvider(userId, providerId, updates)`: Update push provider

### Template Management
- `getSMSTemplates(userId)`: Get all SMS templates
- `createSMSTemplate(userId, templateData)`: Create SMS template (auto-calculates character count)
- `getPushTemplates(userId)`: Get all push templates
- `createPushTemplate(userId, templateData)`: Create push template

### Campaign Management
- `getSMSCampaigns(userId)`: Get all SMS campaigns
- `createSMSCampaign(userId, campaignData)`: Create SMS campaign (default status: draft)
- `updateSMSCampaign(userId, campaignId, updates)`: Update SMS campaign
- `getPushCampaigns(userId)`: Get all push campaigns
- `createPushCampaign(userId, campaignData)`: Create push campaign
- `updatePushCampaign(userId, campaignId, updates)`: Update push campaign

### Recipient Management
- `getSMSRecipients(userId, campaignId)`: Get recipients for SMS campaign
- `addSMSRecipients(userId, campaignId, recipients)`: Add recipients to SMS campaign
- `getPushRecipients(userId, campaignId)`: Get recipients for push campaign
- `addPushRecipients(userId, campaignId, recipients)`: Add recipients to push campaign

### Preferences & Analytics
- `getNotificationPreferences(userId, customerId?)`: Get customer preferences
- `updateNotificationPreferences(userId, customerId, preferences)`: Update or create preferences
- `getNotificationDashboardData(userId)`: Get aggregated dashboard metrics

## API Endpoints

### GET /api/notification/dashboard
Retrieves comprehensive notification dashboard metrics.

**Query Parameters:**
- `userId` (required): User identifier

**Response:**
```json
{
  "data": {
    "totalSMSCampaigns": 15,
    "totalPushCampaigns": 8,
    "activeSMSCampaigns": 2,
    "activePushCampaigns": 1,
    "totalSMSDelivered": 2500,
    "totalPushDelivered": 1200,
    "smsSendCost": 12.50,
    "smsAverageDeliveryRate": 98.5,
    "pushAverageOpenRate": 45.2,
    "pushAverageClickRate": 8.5,
    "recentSMSCampaigns": [...],
    "recentPushCampaigns": [...],
    "topPerformingSMSCampaigns": [...],
    "topPerformingPushCampaigns": [...],
    "smsTemplateCount": 12,
    "pushTemplateCount": 8,
    "smsProviderCount": 2,
    "pushProviderCount": 1,
    "campaignsByStatus": {...}
  }
}
```

## Dashboard UI

The notification dashboard (app/notification/page.tsx) provides:
- 6 KPI metric cards (Total campaigns, delivery rates, costs, engagement rates)
- Recent SMS campaigns list with status badges
- Recent push campaigns list with status badges
- Quick action cards for Templates, Push Templates, Providers, and Preferences
- Responsive design with dark mode support
- Real-time refresh functionality

## Key Features

1. **Multi-Channel Messaging**: Send via SMS and push notifications
2. **Provider Flexibility**: Support multiple SMS and push providers
3. **Template Management**: Reusable templates with variable personalization
4. **Campaign Scheduling**: Schedule campaigns for future delivery
5. **Audience Filtering**: Target campaigns by customer attributes
6. **Delivery Tracking**: Real-time tracking of message delivery
7. **Engagement Analytics**: Track opens and clicks on push notifications
8. **Preference Management**: Respect customer communication preferences
9. **Event Logging**: Comprehensive audit trail of all notifications
10. **Cost Tracking**: Monitor SMS sending costs

## Best Practices

### SMS Best Practices
- Keep messages under 160 characters (1 SMS) when possible
- Use clear CTAs with tracking links
- Respect sending windows (9am-9pm recipient timezone)
- Verify phone number format and validity
- Always include unsubscribe information

### Push Notification Best Practices
- Write compelling titles (30-50 characters)
- Keep body text concise (under 150 characters)
- Use rich images (2:1 aspect ratio)
- Include deep links for seamless navigation
- Avoid excessive frequency (max 2-3 per day)

### Campaign Management
- Always test with sample recipients first
- Monitor delivery rates and engagement
- A/B test messages for optimal performance
- Schedule at optimal engagement times
- Segment audiences by engagement level

## Compliance & Legal

### SMS Compliance
- Obtain explicit consent before sending promotional SMS
- Include clear sender identity (company name or short code)
- Honor opt-out requests immediately
- Keep records of consent
- Comply with TCPA regulations (US) and similar laws

### Push Notification Compliance
- Obtain user permission before sending
- Respect do-not-disturb settings
- Honor opt-out preferences
- Comply with GDPR and similar regulations
- Provide clear opt-out mechanism

## Provider Integration

### Supported SMS Providers
- **Twilio**: Industry standard, excellent documentation, competitive pricing
- **AWS SNS**: Native AWS integration, reliable delivery
- **Nexmo**: Global coverage, strong SMS rates
- **Sinch**: Global reach, enterprise features

### Supported Push Providers
- **Firebase Cloud Messaging (FCM)**: Android, web, multi-platform
- **OneSignal**: Easy integration, good analytics
- **AWS SNS**: Native AWS integration, mobile push
- **APNS**: Apple Push Notification service for iOS

## System Limits

- SMS length: Up to 480 characters (3 segments) for optimal delivery
- Push notification title: Max 65 characters
- Push notification body: Max 240 characters
- Campaign recipients: Up to 1,000,000 per campaign
- Template count: Unlimited
- Provider count: Typically 2-3 per type recommended

## Future Enhancements

1. Advanced scheduling with timezone support
2. A/B testing for SMS and push messages
3. Machine learning-based optimal send time
4. WhatsApp integration
5. Webhooks for external system integration
6. Advanced segmentation with ML-based predictive targeting
7. Rich media support in SMS (RCS)
8. Conversion attribution tracking

## Troubleshooting

### SMS Delivery Issues
- **Low delivery rates**: Verify phone numbers, check provider rate limits
- **Messages not reaching**: Verify carrier compatibility, check DLR reports
- **Cost overages**: Review character count, consolidate messages

### Push Notification Issues
- **Low open rates**: Test message content, optimize timing
- **Delivery failures**: Verify device tokens are current, check provider status
- **Device token errors**: Implement token refresh strategy

## Support

For issues or feature requests, provide:
- Specific error messages or behavior
- Steps to reproduce the issue
- User ID and affected campaign/template ID
- Expected vs actual results

---

This system provides enterprise-grade notification capabilities while maintaining flexibility for multiple providers and use cases.
