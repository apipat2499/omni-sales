# Email Marketing & Campaign Management System

## Overview

The Email Marketing & Campaign Management System is a comprehensive solution for creating, managing, and automating email campaigns within the Omni-Sales platform. It provides multi-tenant support with complete campaign lifecycle management, audience segmentation, template management, and advanced automation workflows.

## Database Schema

The email marketing system uses 12 PostgreSQL tables with advanced features including JSON storage for flexible data structures, comprehensive indexing for performance, and Row-Level Security (RLS) for multi-tenant isolation.

## Core Tables

### 1. email_templates
Stores reusable email templates with support for personalization variables and multiple content formats.
- Columns: id, user_id, template_name, html_content, text_content, subject_line, variables, description, created_at, updated_at
- Use Cases: Store multiple campaign templates, maintain template versions, enable variable substitution

### 2. email_campaigns
Main campaign definition table storing all campaign metadata and configuration.
- Columns: id, user_id, campaign_name, template_id, description, status, scheduled_send_time, sent_at, audience_filter, ab_test_enabled, ab_test_config, created_at, updated_at
- Statuses: draft, scheduled, sending, sent, paused, failed
- Use Cases: Create campaigns from templates, schedule campaigns, A/B test, track lifecycle

### 3. email_campaign_recipients
Individual delivery tracking for each campaign recipient, recording delivery status and engagement metrics.
- Columns: id, campaign_id, email_address, recipient_name, user_id, status, delivered_at, bounce_type, bounce_reason, opened_at, click_count, personalization_data, created_at, updated_at
- Statuses: queued, sending, delivered, bounced, suppressed, unsubscribed, complained
- Use Cases: Track individual delivery status, manage bounces, personalization, calculate rates

### 4. email_links
URL tracking setup for campaigns, storing which URLs are tracked and their click counts.
- Columns: id, campaign_id, original_url, tracking_url, link_label, click_count, created_at
- Use Cases: Enable URL-level click tracking, identify effective CTAs, click attribution

### 5. email_link_clicks
Detailed click event tracking, recording each individual click with user and timestamp information.
- Columns: id, link_id, recipient_id, campaign_id, user_id, clicked_at, device_type, browser_info, created_at
- Use Cases: Track engagement with CTAs, analyze click patterns, automation triggers

### 6. email_segments
Dynamic audience segments for targeting specific recipient groups in campaigns.
- Columns: id, user_id, segment_name, description, filter_criteria, recipient_count, last_calculated_at, is_dynamic, created_at, updated_at
- Use Cases: Define target audiences, create dynamic segments, support complex targeting

### 7. email_suppression_list
Manages suppressed and unsubscribed email addresses to prevent sending to opted-out users.
- Columns: id, user_id, email_address, reason, campaign_id, suppressed_at, suppressed_reason_detail, created_at
- Reasons: unsubscribed, hard_bounce, complaint, manual
- Use Cases: Prevent sending to unsubscribed addresses, manage bounces, compliance

### 8. email_unsubscribe_preferences
Granular unsubscribe preferences allowing users to manage subscription at category level.
- Columns: id, user_id, email_address, campaign_category, is_subscribed, updated_at, created_at
- Categories: promotions, newsletters, product_updates, transactional
- Use Cases: Preference centers, category-based unsubscribes, email best practices

### 9. email_automations
Defines automated email workflows triggered by specific events or schedules.
- Columns: id, user_id, automation_name, description, automation_type, trigger_type, trigger_criteria, status, template_sequence, max_emails_per_user, created_at, updated_at
- Types: welcome_series, abandoned_cart, win_back, birthday, re_engagement, drip_campaign, event_triggered
- Use Cases: Welcome series, cart recovery, re-engagement, birthday campaigns

### 10. email_automation_logs
Execution history of automated campaigns, tracking when automations ran and for which recipients.
- Columns: id, automation_id, campaign_id, user_id, trigger_event_id, recipients_count, executed_at, next_run_scheduled, status, error_message, created_at
- Use Cases: Track execution history, debug failures, monitor performance

### 11. email_analytics
Aggregated campaign performance metrics for dashboard and reporting.
- Columns: id, campaign_id, user_id, total_recipients, delivered_count, bounce_count, open_count, click_count, unsubscribe_count, complaint_count, conversion_count, open_rate, click_rate, bounce_rate, conversion_rate, calculated_at, created_at
- Use Cases: Dashboard KPIs, campaign reports, performance comparison

### 12. email_events
Detailed event log for all email activities providing audit trail and data for analytics.
- Columns: id, campaign_id, recipient_id, user_id, event_type, event_timestamp, metadata, created_at
- Event Types: sent, delivered, open, click, bounce, complaint, unsubscribe, suppressed
- Use Cases: Audit trail, engagement tracking, compliance, event processing

## Service Layer Functions

### Template Management
- **getTemplates(userId)**: Retrieves all email templates for a user
- **createTemplate(userId, templateData)**: Creates a new email template

### Campaign Management
- **getCampaigns(userId)**: Retrieves all campaigns for a user
- **createCampaign(userId, campaignData)**: Creates a new email campaign
- **updateCampaign(userId, campaignId, updates)**: Updates existing campaign
- **sendCampaign(userId, campaignId)**: Sends a campaign immediately

### Recipient Management
- **getRecipients(userId, campaignId)**: Gets all recipients for a campaign
- **addCampaignRecipients(userId, campaignId, recipients)**: Adds recipients to campaign

### Segment Management
- **getSegments(userId)**: Retrieves all segments for a user
- **createSegment(userId, segmentData)**: Creates a new audience segment

### Automation Management
- **getAutomations(userId)**: Retrieves all automations for a user
- **createAutomation(userId, automationData)**: Creates a new automated workflow

### Dashboard & Analytics
- **getEmailMarketingDashboardData(userId)**: Retrieves comprehensive dashboard metrics
  - Returns: totalCampaigns, activeCampaigns, totalSubscribers, suppressed, avgOpenRate, avgClickRate, avgConversionRate, recentCampaigns, topPerformingCampaigns, automationCount, templateCount, segmentCount, campaignsByStatus

## API Endpoints

### GET /api/email/dashboard
Retrieves email marketing dashboard data with all KPI metrics.
- Query: userId (required)
- Returns: Dashboard data with metrics and campaigns

### POST /api/email/campaigns
Creates a new email campaign.
- Body: userId, campaign_name, template_id, description, scheduled_send_time, audience_filter, ab_test_enabled, ab_test_config

### GET /api/email/campaigns
Retrieves all campaigns for a user.
- Query: userId (required), status (optional)
- Returns: Array of campaigns with total count

### GET /api/email/recipients
Retrieves all recipients for a campaign.
- Query: userId (required), campaignId (required), status (optional)
- Returns: Array of recipients with total count

### GET /api/email/analytics
Retrieves analytics for a specific campaign.
- Query: userId (required), campaignId (required)
- Returns: Campaign analytics with rates and metrics

## Best Practices

### Email Campaign Design
1. **Subject Line Optimization** - Keep under 50 chars, personalize, A/B test
2. **Template Design** - Responsive, plain text fallback, proper contrast, cross-client testing
3. **Content Strategy** - 80/20 rule, clear CTAs, concise, include unsubscribe

### Audience Management
4. **Segmentation** - Segment by engagement, create dynamic segments, clean inactive, respect preferences
5. **Suppression List** - Auto-suppress bounces, honor unsubscribes, review complaints, maintain compliance

### Campaign Execution
6. **Scheduling** - Test before sending, optimal times (10am-2pm), avoid Friday bulk sends, monitor bounces
7. **Automation** - Welcome series (3-5 emails), re-engagement (6 months), abandoned cart (1-5 days), monitor performance

### Analytics and Optimization
8. **Key Metrics** - Open Rate: 20-40%, Click Rate: 2-5%, Bounce: <2%, Unsubscribe: monitor, Complaint: <0.1%
9. **Testing** - A/B test subjects, send times, content; use click data for CTAs; test frequency; improve segmentation
10. **Compliance** - Include physical address, honor preferences, authenticate email (SPF/DKIM/DMARC), follow regulations

## Compliance Considerations

### CAN-SPAM Act (USA)
- Clear advertisement identification
- Valid physical postal address
- Clear unsubscribe mechanism
- Honor requests within 10 days

### GDPR (EU)
- Explicit consent for promotional emails
- Easy consent withdrawal
- Maintain consent records
- Enable data subject rights

### CASL (Canada)
- Express or implied consent
- Clear sender identification
- Functioning unsubscribe
- Contact information required

## Troubleshooting

### High Bounce Rates
- Hard Bounces: Remove invalid addresses
- Soft Bounces: Monitor and retry
- Action: Review list quality, validate emails

### Low Open Rates
- Subject line too generic: Test more compelling subjects
- Suboptimal send time: Try different windows
- Cold engagement: Segment and skip cold recipients

### High Unsubscribe Rates
- Content not relevant: Review segmentation
- Too frequent: Reduce frequency
- No value: Improve content quality

### Deliverability Issues
- Check SPF/DKIM/DMARC authentication
- Monitor sender reputation
- Use dedicated IP
- Authenticate templates

## System Limits
- Campaign Size: Up to 1,000,000 recipients
- Template Size: Up to 10MB HTML
- Automation Sequences: Up to 50 emails
- Concurrent Sends: Provider limited
- Attachments: Not currently supported

## Version History
**v1.0 - Initial Release**
- Core campaign management
- Template system
- Segmentation
- Basic automation
- Dashboard and analytics
- Compliance features
