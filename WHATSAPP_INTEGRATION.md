# WhatsApp Business API Integration

This document provides a comprehensive guide for integrating WhatsApp Business API into your Omni-Sales application.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Setup Guide](#setup-guide)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Message Templates](#message-templates)
- [Components](#components)
- [Usage Examples](#usage-examples)
- [Troubleshooting](#troubleshooting)

## Overview

The WhatsApp Business API integration allows you to:
- Send automated notifications to customers
- Run marketing campaigns via WhatsApp
- Handle two-way conversations
- Track message delivery and read status
- Manage message templates in Thai language

## Features

### 1. Message Types Support
- ✅ Text messages
- ✅ Image messages (with captions)
- ✅ Document messages (PDF, Word, etc.)
- ✅ Template messages (pre-approved)
- ✅ Interactive buttons
- ✅ Interactive lists

### 2. Business Use Cases
- 📦 Order confirmations
- 🚚 Shipment tracking updates
- 💳 Payment reminders
- 📢 Promotional campaigns
- 💬 Customer support
- ⭐ Review requests
- 🛒 Abandoned cart recovery

### 3. Thai Language Support
All templates and messages support Thai language natively, with pre-configured templates for:
- การยืนยันคำสั่งซื้อ (Order confirmations)
- การติดตามการจัดส่ง (Shipping updates)
- การแจ้งเตือนการชำระเงิน (Payment reminders)
- โปรโมชั่นและแคมเปญ (Promotional campaigns)
- การบริการลูกค้า (Customer support)

### 4. Advanced Features
- Message queue management
- Webhook handling for real-time updates
- Campaign analytics and tracking
- Contact management with opt-in/opt-out
- Automatic customer linking to CRM

## Prerequisites

### 1. WhatsApp Business Account
1. Create a Facebook Business Manager account at [business.facebook.com](https://business.facebook.com)
2. Create a WhatsApp Business Account (WABA)
3. Add a phone number to your WABA
4. Verify your business

### 2. Meta Developer Account
1. Create a Meta Developer account at [developers.facebook.com](https://developers.facebook.com)
2. Create a new app or use existing one
3. Add WhatsApp product to your app

### 3. Access Token
1. Go to Meta Business Settings → System Users
2. Create a system user with necessary permissions
3. Generate a permanent access token with these permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`

## Setup Guide

### Step 1: Configure Environment Variables

Copy the following variables to your `.env` file:

```env
# Required
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_WEBHOOK_SECRET=your_random_secret_token

# Optional
WHATSAPP_ENABLE_NOTIFICATIONS=true
WHATSAPP_ENABLE_CAMPAIGNS=true
WHATSAPP_DEFAULT_LANGUAGE=th
```

### Step 2: Run Database Migration

```bash
# Apply WhatsApp database schema
psql -d your_database < supabase/migrations/add_whatsapp_integration.sql
```

This will create the following tables:
- `whatsapp_connections`
- `whatsapp_messages`
- `whatsapp_templates`
- `whatsapp_webhooks`
- `whatsapp_contacts`
- `whatsapp_campaigns`
- `whatsapp_campaign_recipients`

### Step 3: Configure Webhook in Meta Developer Console

1. Go to your app in Meta Developer Console
2. Navigate to WhatsApp → Configuration
3. Set Callback URL: `https://yourdomain.com/api/whatsapp/webhook`
4. Set Verify Token: Use the value from `WHATSAPP_WEBHOOK_SECRET`
5. Subscribe to fields: `messages`, `message_status`, `messaging_handovers`

### Step 4: Initialize WhatsApp Connection

Insert your WhatsApp connection in the database:

```sql
INSERT INTO whatsapp_connections (
  business_account_id,
  phone_number_id,
  phone_number,
  display_phone_number,
  verified_name,
  access_token,
  webhook_verify_token,
  is_active
) VALUES (
  'your_business_account_id',
  'your_phone_number_id',
  '66812345678',
  '+66 81 234 5678',
  'Your Business Name',
  'your_access_token',
  'your_webhook_secret',
  true
);
```

### Step 5: Import Thai Templates

The system includes pre-configured Thai templates. Import them using:

```typescript
import { getAllThaiTemplates } from '@/lib/integrations/whatsapp/templates';

const templates = getAllThaiTemplates();
// Save to database via API
```

## Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | Yes | Your WhatsApp Business Account ID | - |
| `WHATSAPP_PHONE_NUMBER_ID` | Yes | Phone number ID to send messages from | - |
| `WHATSAPP_ACCESS_TOKEN` | Yes | Permanent access token from Meta | - |
| `WHATSAPP_WEBHOOK_SECRET` | Yes | Secret token for webhook verification | - |
| `WHATSAPP_API_VERSION` | No | Meta API version | `v18.0` |
| `WHATSAPP_ENABLE_NOTIFICATIONS` | No | Enable order notifications | `true` |
| `WHATSAPP_ENABLE_CAMPAIGNS` | No | Enable marketing campaigns | `true` |
| `WHATSAPP_DEFAULT_LANGUAGE` | No | Default template language | `th` |
| `WHATSAPP_RATE_LIMIT_PER_SECOND` | No | Message rate limit | `100` |
| `WHATSAPP_AUTO_REPLY_ENABLED` | No | Enable auto-replies | `false` |
| `WHATSAPP_REQUIRE_OPT_IN` | No | Require opt-in for marketing | `true` |

## Database Schema

### whatsapp_connections
Stores WhatsApp Business Account connection details.

### whatsapp_messages
Logs all incoming and outgoing messages with status tracking.

### whatsapp_templates
Stores pre-approved message templates.

### whatsapp_contacts
Manages customer WhatsApp contact information.

### whatsapp_campaigns
Tracks promotional campaigns.

### whatsapp_webhooks
Logs all webhook events from WhatsApp.

## API Endpoints

### POST /api/whatsapp/send
Send a WhatsApp message.

```typescript
// Send text message
const response = await fetch('/api/whatsapp/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: '66812345678',
    type: 'text',
    message: 'สวัสดีค่ะ ขอบคุณที่สั่งซื้อสินค้า',
  }),
});

// Send template message
const response = await fetch('/api/whatsapp/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: '66812345678',
    type: 'template',
    templateName: 'order_confirmation_th',
    templateLanguage: 'th',
    templateComponents: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: 'คุณสมชาย' },
          { type: 'text', text: 'ORD-12345' },
          { type: 'text', text: '1,250' },
          { type: 'text', text: '15/11/2567' },
        ],
      },
    ],
  }),
});
```

### POST /api/whatsapp/webhook
Receive webhook events from WhatsApp (handled automatically).

### GET /api/whatsapp/contacts
Get all WhatsApp contacts.

```typescript
const response = await fetch('/api/whatsapp/contacts?page=1&limit=50');
const { data, pagination } = await response.json();
```

### POST /api/whatsapp/campaign
Create and send a campaign.

```typescript
const response = await fetch('/api/whatsapp/campaign', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Flash Sale November 2024',
    templateName: 'promotional_campaign_th',
    targetAudience: { customTags: ['vip', 'active'] },
    sendNow: true,
  }),
});
```

### GET /api/whatsapp/status
Get message delivery status.

```typescript
const response = await fetch('/api/whatsapp/status?phone_number=66812345678');
const { data, stats } = await response.json();
```

## Message Templates

### Available Thai Templates

1. **order_confirmation_th** - Order Confirmation
2. **shipping_update_th** - Shipping Update
3. **delivery_confirmation_th** - Delivery Confirmation
4. **payment_reminder_th** - Payment Reminder
5. **promotional_campaign_th** - Promotional Campaign
6. **customer_support_th** - Customer Support
7. **abandoned_cart_th** - Abandoned Cart
8. **review_request_th** - Review Request
9. **stock_alert_th** - Stock Alert

### Template Helper Functions

```typescript
import {
  formatOrderConfirmation,
  formatShippingUpdate,
  formatDeliveryConfirmation,
} from '@/lib/integrations/whatsapp/templates';

// Format order confirmation
const components = formatOrderConfirmation({
  customerName: 'คุณสมชาย',
  orderNumber: 'ORD-12345',
  totalAmount: 1250,
  orderDate: '15/11/2567',
});
```

## Components

### WhatsAppPhoneInput
Phone number input component with validation.

```tsx
import { WhatsAppPhoneInput } from '@/components/whatsapp';

function MyComponent() {
  const [phone, setPhone] = useState('');
  const [isValid, setIsValid] = useState(false);

  return (
    <WhatsAppPhoneInput
      value={phone}
      onChange={(value, valid) => {
        setPhone(value);
        setIsValid(valid);
      }}
      label="หมายเลข WhatsApp"
      placeholder="กรอกหมายเลขโทรศัพท์"
    />
  );
}
```

### WhatsAppCampaignBuilder
Campaign creation component.

```tsx
import { WhatsAppCampaignBuilder } from '@/components/whatsapp';

function CreateCampaign() {
  return (
    <WhatsAppCampaignBuilder
      onSave={(campaign) => {
        console.log('Campaign created:', campaign);
      }}
      onCancel={() => {
        // Handle cancel
      }}
    />
  );
}
```

### WhatsAppConversation
Message conversation component.

```tsx
import { WhatsAppConversation } from '@/components/whatsapp';

function CustomerChat() {
  return (
    <WhatsAppConversation
      phoneNumber="66812345678"
      onClose={() => {
        // Handle close
      }}
    />
  );
}
```

## Usage Examples

### 1. Send Order Confirmation

```typescript
import { initWhatsAppClient, formatOrderConfirmation } from '@/lib/integrations/whatsapp';

const client = initWhatsAppClient({
  businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID!,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
});

const components = formatOrderConfirmation({
  customerName: 'คุณสมชาย',
  orderNumber: 'ORD-12345',
  totalAmount: 1250,
  orderDate: '15/11/2567',
});

await client.sendTemplateMessage(
  '66812345678',
  'order_confirmation_th',
  'th',
  components
);
```

### 2. Send Shipping Update

```typescript
import { formatShippingUpdate } from '@/lib/integrations/whatsapp';

const components = formatShippingUpdate({
  customerName: 'คุณสมชาย',
  orderNumber: 'ORD-12345',
  carrier: 'Kerry Express',
  trackingNumber: 'KE123456789TH',
  estimatedDelivery: '16/11/2567',
});

await client.sendTemplateMessage(
  '66812345678',
  'shipping_update_th',
  'th',
  components
);
```

### 3. Handle Incoming Messages

```typescript
import { getEventEmitter } from '@/lib/integrations/whatsapp';

const emitter = getEventEmitter();

emitter.onMessage(async (message) => {
  console.log('Received message:', message);

  // Auto-reply
  if (message.type === 'text') {
    await client.sendTextMessage(
      message.from,
      'ขอบคุณที่ติดต่อเรา เราจะตอบกลับโดยเร็วที่สุดค่ะ'
    );
  }
});

emitter.onStatus(async (status) => {
  console.log('Message status:', status);
  // Update database or trigger notifications
});
```

## Troubleshooting

### Common Issues

**1. Webhook verification fails**
- Ensure `WHATSAPP_WEBHOOK_SECRET` matches the verify token in Meta Developer Console
- Check that your webhook endpoint is publicly accessible

**2. Messages not sending**
- Verify your access token has the correct permissions
- Check WhatsApp Business Account status and limits
- Ensure phone number is verified

**3. Template messages rejected**
- Templates must be pre-approved by Meta
- Check template status in Meta Business Manager
- Ensure variable counts match template definition

**4. Rate limiting errors**
- Reduce `WHATSAPP_RATE_LIMIT_PER_SECOND`
- Implement exponential backoff for retries
- Check your messaging tier limits

### Debug Mode

Enable debug logging:

```typescript
// In your WhatsApp client initialization
const client = new WhatsAppClient({
  ...config,
  debug: true, // Enable debug logs
});
```

### Support

For issues specific to WhatsApp Business API, refer to:
- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Meta Developer Community](https://developers.facebook.com/community/)

## Best Practices

1. **Opt-in Management**: Always obtain user consent before sending marketing messages
2. **Rate Limiting**: Respect WhatsApp's rate limits to avoid account suspension
3. **Template Quality**: Use clear, concise templates that provide value to customers
4. **Error Handling**: Implement robust error handling and retry logic
5. **Privacy**: Never share customer phone numbers or conversations
6. **Monitoring**: Track delivery rates and engagement metrics
7. **Testing**: Test templates thoroughly before submitting for approval

## License

This integration is part of the Omni-Sales platform. See LICENSE for details.
