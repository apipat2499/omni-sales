# Email Integration with Database

Complete email integration system that logs all emails to the database with proper status tracking, queue management, and analytics.

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Database Functions](#database-functions)
4. [Core Components](#core-components)
5. [API Endpoints](#api-endpoints)
6. [Usage Examples](#usage-examples)
7. [Queue Processing](#queue-processing)
8. [Testing](#testing)

## Overview

The email integration system provides:

- **Email Queue**: Store pending emails in database before sending
- **Email Logging**: Save email details to `email_logs` table with status, recipient, content, etc.
- **Campaign Tracking**: Link emails to campaigns via `email_campaigns` table
- **Template Support**: Use email templates from `email_templates` table
- **Status Tracking**: Track email status (pending/sent/failed) with automatic updates
- **Retry Logic**: Automatic retry for failed emails with configurable max attempts
- **Analytics**: Track opens, clicks, bounces, and other metrics

## Database Schema

### email_queue

Stores emails pending to be sent.

```sql
CREATE TABLE email_queue (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  template_id UUID REFERENCES email_templates(id),
  subject VARCHAR(255),
  html_content TEXT NOT NULL,
  text_content TEXT,
  variables JSONB DEFAULT '{}',
  campaign_id UUID REFERENCES email_campaigns(id),
  status VARCHAR(50) DEFAULT 'pending', -- pending, sent, failed
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  related_order_id UUID REFERENCES orders(id),
  related_customer_id UUID REFERENCES customers(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### email_logs

Tracks all sent emails with detailed information.

```sql
CREATE TABLE email_logs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  subject VARCHAR(255) NOT NULL,
  template_type VARCHAR(50),
  template_id UUID REFERENCES email_templates(id),
  campaign_id UUID REFERENCES email_campaigns(id),
  status VARCHAR(50) DEFAULT 'pending', -- pending, sent, failed, bounced
  provider VARCHAR(50),
  provider_id VARCHAR(255),
  opened BOOLEAN DEFAULT false,
  clicked BOOLEAN DEFAULT false,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  bounced BOOLEAN DEFAULT false,
  bounced_reason TEXT,
  error_message TEXT,
  related_order_id UUID REFERENCES orders(id),
  related_customer_id UUID REFERENCES customers(id),
  metadata JSONB DEFAULT '{}',
  html_content TEXT,
  text_content TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### email_templates

Stores reusable email templates.

```sql
CREATE TABLE email_templates (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  template_type VARCHAR(50) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  variables TEXT[] DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  preview_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### email_campaigns

Stores email campaign information.

```sql
CREATE TABLE email_campaigns (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  campaign_name VARCHAR(255) NOT NULL,
  description TEXT,
  campaign_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'draft',
  template_id UUID REFERENCES email_templates(id),
  subject_line VARCHAR(255),
  html_content TEXT,
  plain_text_content TEXT,
  target_audience VARCHAR(50),
  recipient_count INTEGER DEFAULT 0,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  -- Analytics fields
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  bounced_count INTEGER DEFAULT 0,
  -- More fields...
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Database Functions

### create_email_queue

Creates a new email queue entry.

```sql
SELECT create_email_queue(
  p_user_id := 'user-uuid',
  p_recipient_email := 'user@example.com',
  p_subject := 'Email subject',
  p_html_content := '<html>...</html>',
  -- Optional parameters
  p_template_id := 'template-uuid',
  p_campaign_id := 'campaign-uuid',
  p_scheduled_for := '2025-01-01 10:00:00',
  -- Returns: queue_id (UUID)
);
```

### update_email_queue_status

Updates the status of an email in the queue.

```sql
SELECT update_email_queue_status(
  p_queue_id := 'queue-uuid',
  p_status := 'sent', -- pending, sent, failed
  p_error_message := NULL,
  p_provider_id := 'msg_123'
  -- Returns: boolean
);
```

### create_email_log

Creates a new email log entry.

```sql
SELECT create_email_log(
  p_user_id := 'user-uuid',
  p_recipient_email := 'user@example.com',
  p_subject := 'Email subject',
  p_status := 'pending',
  -- Optional parameters
  p_template_id := 'template-uuid',
  p_campaign_id := 'campaign-uuid',
  -- Returns: log_id (UUID)
);
```

### update_email_log_status

Updates the status of an email log.

```sql
SELECT update_email_log_status(
  p_log_id := 'log-uuid',
  p_status := 'sent', -- pending, sent, failed, bounced
  p_error_message := NULL,
  p_bounced_reason := NULL
  -- Returns: boolean
);
```

### track_email_open

Tracks when an email is opened.

```sql
SELECT track_email_open(
  p_log_id := 'log-uuid'
  -- Returns: boolean
);
```

### track_email_click

Tracks when an email link is clicked.

```sql
SELECT track_email_click(
  p_log_id := 'log-uuid'
  -- Returns: boolean
);
```

### get_pending_emails

Retrieves pending emails from queue for processing.

```sql
SELECT * FROM get_pending_emails(
  p_limit := 100,
  p_max_retries := 3
  -- Returns: TABLE of email_queue entries
);
```

### get_email_stats

Gets email statistics for a user within a date range.

```sql
SELECT * FROM get_email_stats(
  p_user_id := 'user-uuid',
  p_start_date := '2025-01-01',
  p_end_date := '2025-01-31'
  -- Returns: TABLE with stats (total_sent, total_opened, open_rate, etc.)
);
```

## Core Components

### 1. Email Database Service (`/lib/email/database.ts`)

Provides methods for all email database operations:

```typescript
import { getEmailDatabaseService } from '@/lib/email/database';

const dbService = getEmailDatabaseService();

// Create email queue
const queueId = await dbService.createEmailQueue({
  user_id: 'user-uuid',
  recipient_email: 'user@example.com',
  subject: 'Test Email',
  html_content: '<html>...</html>',
});

// Create email log
const logId = await dbService.createEmailLog({
  user_id: 'user-uuid',
  recipient_email: 'user@example.com',
  subject: 'Test Email',
  status: 'pending',
});

// Update status
await dbService.updateEmailLogStatus(logId, 'sent');

// Track open/click
await dbService.trackEmailOpen(logId);
await dbService.trackEmailClick(logId);

// Get stats
const stats = await dbService.getEmailStats('user-uuid');
```

### 2. Email Sender (`/lib/email/sender.ts`)

Handles sending emails with automatic database logging:

```typescript
import { sendEmail, queueEmail } from '@/lib/email/sender';

// Send email immediately
const result = await sendEmail({
  userId: 'user-uuid',
  to: 'user@example.com',
  subject: 'Test Email',
  html: '<html>...</html>',
  text: 'Plain text version',
  campaignId: 'campaign-uuid', // Optional
  templateId: 'template-uuid', // Optional
});

// Queue email for later
const queueResult = await queueEmail({
  userId: 'user-uuid',
  to: 'user@example.com',
  subject: 'Test Email',
  html: '<html>...</html>',
  text: 'Plain text version',
  scheduledFor: new Date('2025-01-01 10:00:00'), // Optional
});
```

### 3. Email Queue Processor (`/lib/email/queue-processor.ts`)

Background worker to process queued emails:

```typescript
import {
  getEmailQueueProcessor,
  startEmailQueueProcessor,
  stopEmailQueueProcessor,
} from '@/lib/email/queue-processor';

// Start automatic processing (in app initialization)
startEmailQueueProcessor({
  batchSize: 100, // emails per batch
  intervalMs: 5000, // 5 seconds between batches
  maxRetries: 3, // max retry attempts
  concurrency: 10, // concurrent sends
});

// Or process once manually
const processor = getEmailQueueProcessor();
const result = await processor.processOnce();
console.log(`Processed: ${result.processed}, Failed: ${result.failed}`);

// Stop processing
stopEmailQueueProcessor();
```

## API Endpoints

### POST /api/email/send

Send a single email with database logging.

**Request:**
```json
{
  "userId": "user-uuid",
  "to": "user@example.com",
  "from": "noreply@omni-sales.com",
  "subject": "Test Email",
  "html": "<html>...</html>",
  "text": "Plain text",
  "templateId": "template-uuid",
  "campaignId": "campaign-uuid",
  "useQueue": false
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "msg_123",
  "logId": "log-uuid",
  "provider": "sendgrid"
}
```

### POST /api/email/queue

Add an email to the queue.

**Request:**
```json
{
  "userId": "user-uuid",
  "to": "user@example.com",
  "subject": "Test Email",
  "html": "<html>...</html>",
  "scheduledFor": "2025-01-01T10:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "queueId": "queue-uuid"
}
```

### GET /api/email/queue

Get pending emails in queue.

**Query Parameters:**
- `limit`: Number of emails to retrieve (default: 50)
- `maxRetries`: Max retries filter (default: 3)

**Response:**
```json
{
  "success": true,
  "emails": [...],
  "count": 10
}
```

### POST /api/email/queue/process

Manually trigger email queue processing.

**Response:**
```json
{
  "success": true,
  "processed": 10,
  "failed": 0
}
```

### GET /api/email/queue/process

Get queue processor status.

**Response:**
```json
{
  "success": true,
  "status": {
    "running": true,
    "config": {
      "batchSize": 100,
      "intervalMs": 5000,
      "maxRetries": 3,
      "concurrency": 10
    }
  }
}
```

### GET /api/email/logs

Get email logs for a user.

**Query Parameters:**
- `userId`: User ID (required)
- `limit`: Results per page (default: 50)
- `offset`: Pagination offset (default: 0)
- `status`: Filter by status (optional)

**Response:**
```json
{
  "data": [...],
  "total": 100,
  "limit": 50,
  "offset": 0
}
```

### POST /api/email/test

Test email integration.

**Request:**
```json
{
  "userId": "user-uuid",
  "to": "test@example.com",
  "testType": "send" // or "queue"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email sent successfully",
  "messageId": "msg_123",
  "logId": "log-uuid"
}
```

### GET /api/email/test

Get email statistics for testing.

**Query Parameters:**
- `userId`: User ID (required)

**Response:**
```json
{
  "success": true,
  "stats": {
    "total_sent": 100,
    "total_opened": 75,
    "total_clicked": 30,
    "open_rate": 75.0,
    "click_rate": 30.0
  },
  "queueStats": {
    "totalPending": 50,
    "userPending": 10
  }
}
```

## Usage Examples

### Example 1: Send Email Immediately

```typescript
import { sendEmail } from '@/lib/email/sender';

const result = await sendEmail({
  userId: 'user-123',
  to: 'customer@example.com',
  subject: 'Order Confirmation',
  html: '<h1>Thank you for your order!</h1>',
  text: 'Thank you for your order!',
  relatedOrderId: 'order-456',
  metadata: {
    orderNumber: '12345',
  },
});

if (result.success) {
  console.log('Email sent:', result.messageId);
  console.log('Log ID:', result.logId);
} else {
  console.error('Failed to send:', result.error);
}
```

### Example 2: Queue Email for Later

```typescript
import { queueEmail } from '@/lib/email/sender';

const result = await queueEmail({
  userId: 'user-123',
  to: 'customer@example.com',
  subject: 'Weekly Newsletter',
  html: '<h1>This week in sales...</h1>',
  text: 'This week in sales...',
  campaignId: 'newsletter-campaign',
  scheduledFor: new Date('2025-01-15 09:00:00'),
});

if (result.success) {
  console.log('Email queued:', result.queueId);
}
```

### Example 3: Send Bulk Emails

```typescript
import { sendBulkEmails } from '@/lib/email/sender';

const emails = customers.map(customer => ({
  userId: 'user-123',
  to: customer.email,
  subject: 'Special Offer',
  html: `<h1>Hi ${customer.name}!</h1>`,
  text: `Hi ${customer.name}!`,
  campaignId: 'promo-campaign',
}));

const result = await sendBulkEmails(emails, {
  useQueue: true, // Use queue for reliability
  rateLimit: 10, // 10 emails per second
});

console.log(`Queued: ${result.queued}, Failed: ${result.failed}`);
```

### Example 4: Get Email Statistics

```typescript
import { getEmailDatabaseService } from '@/lib/email/database';

const dbService = getEmailDatabaseService();

// Get overall stats
const stats = await dbService.getEmailStats('user-123');
console.log(`Open rate: ${stats.open_rate}%`);
console.log(`Click rate: ${stats.click_rate}%`);

// Get stats for date range
const monthStats = await dbService.getEmailStats(
  'user-123',
  new Date('2025-01-01'),
  new Date('2025-01-31')
);
```

## Queue Processing

### Automatic Processing

Start the queue processor in your application initialization (e.g., in a Next.js middleware or server startup):

```typescript
// In your app initialization
import { startEmailQueueProcessor } from '@/lib/email/queue-processor';

startEmailQueueProcessor({
  batchSize: 100,
  intervalMs: 5000,
  maxRetries: 3,
  concurrency: 10,
});
```

### Manual Processing (Cron Job)

You can also trigger processing manually via API or cron:

```bash
# Call the process endpoint
curl -X POST http://localhost:3000/api/email/queue/process
```

### How It Works

1. **Queue Creation**: Email is added to `email_queue` table with status 'pending'
2. **Processing**: Queue processor fetches pending emails
3. **Sending**: Each email is sent via provider (SendGrid, etc.)
4. **Logging**: Email log entry is created in `email_logs` table
5. **Status Update**: Both queue and log statuses are updated to 'sent' or 'failed'
6. **Retry Logic**: Failed emails are retried up to `max_retries` times
7. **Tracking**: Opens and clicks are tracked via tracking URLs

## Testing

### Test Email Integration

```bash
# Send test email
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "to": "test@example.com",
    "testType": "send"
  }'

# Queue test email
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "to": "test@example.com",
    "testType": "queue"
  }'

# Get email stats
curl http://localhost:3000/api/email/test?userId=user-123
```

### Manual Database Testing

```sql
-- Check pending queue
SELECT * FROM email_queue WHERE status = 'pending';

-- Check email logs
SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 10;

-- Get stats for user
SELECT * FROM get_email_stats('user-uuid', NULL, NULL);

-- Check campaign performance
SELECT
  campaign_id,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE opened = true) as opened,
  COUNT(*) FILTER (WHERE clicked = true) as clicked
FROM email_logs
WHERE campaign_id = 'campaign-uuid'
GROUP BY campaign_id;
```

## Migration

To set up the email integration:

1. Run the SQL migration:
   ```bash
   psql -d your_database -f supabase/migrations/email_functions.sql
   ```

2. Verify functions are created:
   ```sql
   SELECT routine_name
   FROM information_schema.routines
   WHERE routine_name LIKE '%email%';
   ```

3. Test the integration using the test endpoint

## Summary

The email integration system provides a complete solution for:

- Reliable email sending with queue support
- Complete email logging and tracking
- Campaign management and analytics
- Template support
- Automatic retry for failed emails
- Status tracking (pending/sent/failed/bounced)
- Open and click tracking
- Statistics and reporting

All emails sent through the system are automatically logged in the database with proper status tracking, making it easy to monitor email delivery and engagement.
