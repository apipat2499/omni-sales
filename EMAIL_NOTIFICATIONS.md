# Email Notifications System Guide

Complete guide for setting up and using the Email Notifications system in Omni Sales.

## Overview

The Email Notifications system allows you to:
- **Automatically send transactional emails** (order confirmations, payment receipts)
- **Alert on important business events** (low stock, payment failures)
- **Send regular reports** (daily summaries, weekly/monthly analytics)
- **Customize email templates** for your brand
- **Track email performance** (open rates, click rates, bounces)
- **Manage preferences** for different notification types

## Getting Started

### 1. Set Up Email Service

We use **Resend** (https://resend.com) - a modern email API for transactional emails.

#### Steps:
1. Sign up at https://resend.com
2. Verify your email and domain
3. Get your API key from the dashboard
4. Add to `.env.local`:
   ```env
   RESEND_API_KEY=re_your_api_key_here
   ```

**Cost**: $20/month for 100,000 emails (or $1 per 1,000 emails for higher volumes)

### 2. Verify Domain (Optional but Recommended)

For best deliverability:
1. Go to Resend Dashboard → Domains
2. Add your domain
3. Follow DNS verification steps
4. Update `.env.local` with domain

```env
RESEND_API_KEY=re_your_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

## Email Types

### Transactional Emails (Auto-sent on events)

1. **Order Confirmation** (`order_confirmation`)
   - Sent when: Customer places order
   - To: Customer email
   - Variables: orderID, total, items, date

2. **Payment Receipt** (`payment_receipt`)
   - Sent when: Payment is confirmed
   - To: Customer email
   - Variables: transactionID, amount, date, method

3. **Order Shipped** (`order_shipped`)
   - Sent when: Order ships
   - To: Customer email
   - Variables: trackingNumber, carrier, estimatedDelivery

4. **Order Delivered** (`order_delivered`)
   - Sent when: Order is delivered
   - To: Customer email
   - Variables: deliveryDate, orderID

5. **Payment Failed** (`payment_failed`)
   - Sent when: Payment fails
   - To: Customer email
   - Variables: reason, retryLink

### Operational Emails (Shop Owner)

1. **Low Stock Alert** (`low_stock_alert`)
   - Sent when: Product stock falls below threshold
   - To: Shop owner
   - Variables: productName, currentStock, sku

2. **Daily Summary** (`daily_summary`)
   - Sent daily at scheduled time
   - To: Shop owner
   - Variables: totalOrders, revenue, topProduct

3. **Weekly Report** (`weekly_report`)
   - Sent weekly
   - To: Shop owner
   - Variables: weeklyStats, topProducts, trends

4. **Monthly Report** (`monthly_report`)
   - Sent monthly
   - To: Shop owner
   - Variables: monthlyStats, growth, insights

### Marketing Emails (Optional)

1. **Customer Welcome** (`customer_welcome`)
   - Sent when: New customer signs up
   - To: Customer email
   - Variables: customerName, welcomeOffer

2. **Abandoned Cart** (`abandoned_cart`)
   - Sent when: Cart abandoned after 24h
   - To: Customer email
   - Variables: cartItems, cartTotal, recoveryLink

## Database Schema

### email_templates
Custom email templates for each template type
- `user_id`: Owner of template
- `template_type`: Type of email
- `subject`: Email subject line
- `html_content`: HTML template with {{variables}}
- `variables`: Array of available placeholders

### email_logs
Audit trail of all sent emails
- `user_id`: Sender
- `recipient_email`: Who it was sent to
- `status`: pending/sent/failed/bounced
- `opened`: Was email opened?
- `clicked`: Did recipient click link?
- Track engagement metrics

### email_queue
Queue for asynchronous email sending
- `status`: pending/sent/failed
- `retry_count`: Number of retries
- `scheduled_for`: When to send
- Auto-retry with exponential backoff

### email_preferences
User notification settings
- `daily_summary_enabled`: Send daily digest
- `new_order_notification`: Alert on new orders
- `low_stock_alert`: Alert on low stock
- `low_stock_threshold`: Min stock level (default: 10)
- `marketing_emails`: Opt-in for marketing
- More granular controls

### email_triggers
Rules for sending automated emails
- `trigger_event`: Event that triggers email (order_created, payment_received, etc)
- `template_id`: Which template to use
- `delay_minutes`: Send after delay
- `conditions`: Custom conditions (e.g., order_total > 1000)

## API Endpoints

### Get Email Templates
```
GET /api/email/templates?userId={userId}

Response:
[
  {
    "id": "uuid",
    "templateType": "order_confirmation",
    "subject": "Your order confirmation",
    "htmlContent": "<p>Hello {{customerName}}...</p>",
    "variables": ["customerName", "orderId", "total"]
  }
]
```

### Create/Update Email Template
```
POST /api/email/templates
Body: {
  "userId": "uuid",
  "templateType": "order_confirmation",
  "subject": "Order Confirmed",
  "htmlContent": "<p>Thanks {{name}}</p>",
  "variables": ["name", "orderId", "total"]
}
```

### Get Email Preferences
```
GET /api/email/preferences?userId={userId}

Response:
{
  "dailySummaryEnabled": true,
  "newOrderNotification": true,
  "lowStockAlert": true,
  "lowStockThreshold": 10,
  ...
}
```

### Update Email Preferences
```
PUT /api/email/preferences
Body: {
  "userId": "uuid",
  "dailySummaryEnabled": false,
  "lowStockThreshold": 20,
  ...
}
```

### Get Email Logs
```
GET /api/email/logs?userId={userId}&limit=50&offset=0&status=sent

Response:
{
  "data": [
    {
      "id": "uuid",
      "recipientEmail": "customer@email.com",
      "subject": "Your Order",
      "status": "sent",
      "opened": true,
      "clicked": false,
      "sentAt": "2024-11-15T10:30:00Z"
    }
  ],
  "total": 150,
  "limit": 50,
  "offset": 0
}
```

## Using Email Service

### Send Custom Email
```typescript
import { sendEmail } from '@/lib/email/service';

const result = await sendEmail({
  to: 'customer@example.com',
  subject: 'Hello',
  html: '<p>Welcome!</p>',
  text: 'Welcome!', // Optional plain text fallback
});

if (result.success) {
  console.log('Email sent:', result.messageId);
} else {
  console.error('Failed:', result.error);
}
```

### Queue Email for Later
```typescript
import { queueEmail } from '@/lib/email/service';

await queueEmail(userId, {
  recipientEmail: 'customer@example.com',
  recipientName: 'John Doe',
  templateType: 'order_confirmation',
  subject: 'Order Confirmed',
  htmlContent: '<p>Your order is confirmed</p>',
  variables: { orderId: '123', total: '฿500' },
  scheduledFor: new Date(Date.now() + 3600000), // 1 hour from now
});
```

### Get and Render Template
```typescript
import { getAndRenderTemplate } from '@/lib/email/service';

const template = await getAndRenderTemplate(
  userId,
  'order_confirmation',
  {
    customerName: 'John',
    orderId: '123',
    total: '฿500'
  }
);

console.log(template.subject); // "Order Confirmed"
console.log(template.html); // HTML with variables replaced
```

### Send Order Confirmation
```typescript
import { sendOrderConfirmationEmail } from '@/lib/email/service';

const success = await sendOrderConfirmationEmail(userId, order);
```

### Send Payment Confirmation
```typescript
import { sendPaymentConfirmationEmail } from '@/lib/email/service';

const success = await sendPaymentConfirmationEmail(userId, payment);
```

### Send Low Stock Alert
```typescript
import { sendLowStockAlert } from '@/lib/email/service';

const success = await sendLowStockAlert(
  userId,
  'owner@example.com',
  product,
  currentStock,
  threshold
);
```

## Email Template Variables

Each template type supports specific variables:

### order_confirmation
- `{{customerName}}` - Customer name
- `{{orderId}}` - Order ID
- `{{orderTotal}}` - Total amount (formatted)
- `{{orderDate}}` - Order date
- `{{items}}` - List of items
- `{{deliveryDate}}` - Expected delivery

### payment_receipt
- `{{transactionId}}` - Transaction ID
- `{{amount}}` - Amount (formatted)
- `{{date}}` - Payment date
- `{{paymentMethod}}` - How they paid
- `{{receiptUrl}}` - Link to receipt

### low_stock_alert
- `{{productName}}` - Product name
- `{{currentStock}}` - Current units
- `{{threshold}}` - Alert threshold
- `{{sku}}` - Product SKU
- `{{restockLink}}` - Link to restock

## Automation Setup

### Queue Processing (Cron Job)

Run `processEmailQueue()` every 5 minutes to send queued emails:

```typescript
// pages/api/cron/process-emails.ts
import { processEmailQueue } from '@/lib/email/service';

export default async function handler(req, res) {
  // Verify cron secret
  if (req.headers['x-cron-secret'] !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { processed, failed } = await processEmailQueue();
  res.status(200).json({ processed, failed });
}
```

Set up cron:
- Vercel: `vercel.json` with `crons` section
- AWS Lambda: CloudWatch Events
- GitHub Actions: Scheduled workflow
- Cron.io: External monitoring

### Automatic Triggers

Implement email triggers when orders/payments are created:

```typescript
// app/api/orders/route.ts
import { queueEmail } from '@/lib/email/service';

export async function POST(req) {
  const order = await createOrder(req.body);

  // Send confirmation email
  await queueEmail(userId, {
    recipientEmail: order.customerEmail,
    templateType: 'order_confirmation',
    subject: 'Your Order is Confirmed',
    htmlContent: template,
    relatedOrderId: order.id,
  });

  return res.json(order);
}
```

## Best Practices

### Email Design
- ✅ Mobile-responsive HTML
- ✅ Plain text fallback
- ✅ Clear call-to-action buttons
- ✅ Brand consistency (logo, colors)
- ✅ Unsubscribe link for compliance

### Deliverability
- ✅ Verify your domain with SPF/DKIM/DMARC
- ✅ Use consistent from address
- ✅ Don't send from no-reply addresses
- ✅ Avoid spam trigger words
- ✅ Monitor bounce rates

### Performance
- ✅ Queue emails instead of sending synchronously
- ✅ Batch similar emails
- ✅ Set appropriate retry limits
- ✅ Archive old logs monthly

### Compliance
- ✅ Include physical address in footer
- ✅ Provide unsubscribe links (GDPR/CAN-SPAM)
- ✅ Honor opt-out preferences
- ✅ Get consent for marketing emails
- ✅ Keep audit trail of sends

## Troubleshooting

### Emails Not Sending

**Problem**: No emails being sent

**Solutions**:
1. Check `RESEND_API_KEY` is set in `.env.local`
2. Verify domain is verified (if using custom domain)
3. Check `email_queue` table for pending emails
4. Look for errors in logs
5. Test with `sendEmail()` directly

### Low Deliverability

**Problem**: Emails ending up in spam

**Solutions**:
1. Verify SPF/DKIM records
2. Use branded domain not generic
3. Avoid spam trigger words
4. Monitor bounce rates in logs
5. Clean up bounced emails

### Queue Not Processing

**Problem**: Emails staying in "pending" status

**Solutions**:
1. Ensure `processEmailQueue()` cron is running
2. Check cron logs for errors
3. Verify database connection
4. Check retry_count against max_retries

## Monitoring

### Email Stats Dashboard

Track key metrics:
```typescript
// Total sent, open rate, click rate, bounce rate
const stats = {
  totalSent: logs.filter(l => l.status === 'sent').length,
  openRate: opened / totalSent,
  clickRate: clicked / totalSent,
  bounceRate: bounced / totalSent,
};
```

### Bounced Email Management

Automatically unsubscribe hard bounces:
```typescript
// Monitor email_bounces table
// Hard bounces (invalid email) → remove from list
// Soft bounces (mailbox full) → retry later
```

## Cost Optimization

With Resend:
- 100,000 emails/month: $20
- 500,000 emails/month: $100
- 1M+ emails/month: Custom pricing

### Strategies:
- Batch digest emails (daily/weekly vs individual)
- Implement unsubscribe preference
- Clean bounced emails
- Monitor engagement metrics
- Segment marketing emails (only engaged users)

## Future Enhancements

Planned features:
- [ ] Email scheduling and drip campaigns
- [ ] A/B testing for email variants
- [ ] Advanced segmentation
- [ ] SMS notifications
- [ ] Push notifications
- [ ] Multi-language templates
- [ ] Dynamic content blocks
- [ ] Survey integration
- [ ] Feedback collection
