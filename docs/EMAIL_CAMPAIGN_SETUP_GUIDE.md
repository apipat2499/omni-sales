# Email Campaign Setup Guide

Step-by-step guide to create and manage email campaigns.

## Quick Start

### 1. Configure Email Provider

Choose your email provider and add credentials to `.env`:

```bash
# Option A: SendGrid (Recommended for high volume)
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.your_api_key

# Option B: Mailgun (Great deliverability)
EMAIL_PROVIDER=mailgun
MAILGUN_API_KEY=your_api_key
MAILGUN_DOMAIN=mg.yourdomain.com

# Option C: SMTP (Fallback)
EMAIL_PROVIDER=nodemailer
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_password

# Required for all
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 2. Create Email Template

Navigate to `/admin/email-templates` and create your first template:

1. Click "Create New Template"
2. Choose a category (transactional, marketing, notification)
3. Enter subject line with variables: `Hi {{customer_name}}, Special offer inside!`
4. Add HTML content with variables
5. Preview and test
6. Save template

Or use the API:

```javascript
await fetch('/api/email/templates', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'your-user-id',
    name: 'welcome_email',
    subject: 'Welcome to {{company_name}}!',
    htmlContent: `<h1>Welcome {{customer_name}}!</h1>`,
    category: 'marketing'
  })
});
```

### 3. Send Your First Email

```javascript
await fetch('/api/email/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'customer@example.com',
    from: process.env.EMAIL_FROM_ADDRESS,
    templateId: 'template-id-here',
    templateVariables: {
      customer_name: 'John Doe',
      company_name: 'Your Store'
    }
  })
});
```

## Campaign Types

### 1. Transactional Emails

**Use case:** Order confirmations, shipping notifications, receipts

**Best practices:**
- Send immediately after action
- Keep content focused and clear
- Include all necessary details
- No unsubscribe needed (legal requirement)

**Example:**
```javascript
// After order creation
const orderConfirmation = {
  userId: userId,
  name: 'Order Confirmation Auto-send',
  templateId: 'order_confirmation_template',
  sendFrom: 'orders@yourdomain.com',
  sendImmediately: true
};
```

### 2. Marketing Campaigns

**Use case:** Promotions, announcements, newsletters

**Best practices:**
- Segment your audience
- A/B test subject lines
- Include clear CTA
- Must include unsubscribe link

**Example:**
```javascript
const marketingCampaign = {
  userId: userId,
  name: 'Summer Sale Campaign',
  templateId: 'promotional_template',
  sendFrom: 'marketing@yourdomain.com',
  segmentFilters: {
    rfm_segment: ['champions', 'loyal_customers'],
    email_subscribed: true
  },
  scheduledAt: '2025-06-01T10:00:00Z',
  abTest: {
    enabled: true,
    variant_a: { subject: '🌞 Summer Sale - 20% Off Everything!' },
    variant_b: { subject: 'Hot Summer Deals - Limited Time!' },
    split_percentage: 50,
    winner_metric: 'open_rate'
  }
};
```

### 3. Automated Campaigns

**Use case:** Welcome series, abandoned cart, re-engagement

**Best practices:**
- Set up triggers
- Add delays between emails
- Monitor unsubscribe rates
- Personalize content

**Example:**
```javascript
const automatedCampaign = {
  userId: userId,
  name: 'Abandoned Cart Recovery',
  triggerType: 'abandoned_cart',
  delay_hours: 1, // Send 1 hour after cart abandonment
  templateId: 'abandoned_cart_template',
  isActive: true
};
```

## Recipient Segmentation

### RFM Segmentation

Segment customers by:
- **R**ecency: How recently they purchased
- **F**requency: How often they purchase
- **M**onetary: How much they spend

**Segments:**
```javascript
{
  rfm_segment: [
    'champions',        // Best customers
    'loyal_customers',  // Regular buyers
    'potential_loyalists', // Promising customers
    'at_risk',          // Haven't bought recently
    'hibernating',      // Long time no purchase
    'lost'              // Likely churned
  ]
}
```

### Tag-Based Segmentation

```javascript
{
  tags: ['vip', 'early_adopter', 'newsletter_subscriber']
}
```

### Behavior-Based Segmentation

```javascript
{
  min_order_count: 5,           // At least 5 orders
  max_order_count: 20,          // Up to 20 orders
  min_total_spent: 500,         // Spent at least $500
  max_total_spent: 2000,        // Spent up to $2000
  last_order_days_ago: 30       // Last order within 30 days
}
```

### Combined Segmentation

```javascript
{
  rfm_segment: ['champions', 'loyal_customers'],
  tags: ['newsletter_subscriber'],
  min_total_spent: 100,
  email_subscribed: true
}
```

## A/B Testing

### What to Test

1. **Subject Lines**
   - Length (short vs long)
   - Tone (formal vs casual)
   - Emojis vs no emojis
   - Personalization vs generic

2. **Email Content**
   - CTA placement
   - Image vs no image
   - Short vs long copy
   - Single vs multiple offers

3. **Send Times**
   - Morning vs afternoon
   - Weekday vs weekend
   - Time zones

### How to Set Up A/B Test

```javascript
const abTestCampaign = {
  userId: userId,
  name: 'Product Launch A/B Test',
  templateId: 'product_launch_template',
  sendFrom: 'marketing@yourdomain.com',

  abTest: {
    enabled: true,

    // Variant A (50% of recipients)
    variant_a: {
      subject: '🚀 Introducing Our New Product!',
      content: '<h1>Big News!</h1><p>We have something exciting...</p>'
    },

    // Variant B (50% of recipients)
    variant_b: {
      subject: 'You asked, we delivered: New Product Inside',
      content: '<h1>Listen to Your Feedback</h1><p>Based on your requests...</p>'
    },

    // Test parameters
    split_percentage: 50,        // 50/50 split
    winner_metric: 'click_rate', // What determines winner

    // Optional: Auto-send winner after 24 hours
    auto_send_winner: true,
    test_duration_hours: 24
  }
};
```

### Metrics to Track

- **Open Rate**: Which subject line gets more opens
- **Click Rate**: Which content drives more clicks
- **Conversion Rate**: Which version generates more sales

## Scheduling Campaigns

### Schedule for Future

```javascript
const scheduledCampaign = {
  userId: userId,
  name: 'Black Friday Sale',
  templateId: 'black_friday_template',
  sendFrom: 'sales@yourdomain.com',
  scheduledAt: '2025-11-29T00:00:00Z', // Black Friday midnight
  segmentFilters: {
    rfm_segment: ['champions', 'loyal_customers', 'potential_loyalists']
  }
};
```

### Best Send Times

**B2C (Consumer):**
- Tuesday-Thursday: 10am - 11am
- Saturday: 9am - 10am
- Sunday: 8pm - 9pm

**B2B (Business):**
- Tuesday-Thursday: 10am - 12pm
- Avoid Mondays and Fridays
- Avoid weekends

**E-commerce:**
- Payday times: 1st and 15th of month
- Lunch hours: 12pm - 1pm
- Evening: 7pm - 9pm

## Deliverability Best Practices

### 1. Warm Up Your Domain

Start slow and increase volume gradually:
- Week 1: 50 emails/day
- Week 2: 100 emails/day
- Week 3: 500 emails/day
- Week 4: 1000 emails/day
- Week 5+: Full volume

### 2. Maintain List Hygiene

```javascript
// Before sending campaign
const cleanList = recipients.filter(r =>
  r.email_status === 'active' &&
  r.email_subscribed === true &&
  r.bounce_count < 3
);
```

### 3. Monitor Bounce Rates

- **Hard Bounces**: Remove immediately
- **Soft Bounces**: Remove after 5 attempts
- **Target**: Keep bounce rate < 5%

### 4. Handle Unsubscribes

```javascript
// Always include unsubscribe link in marketing emails
const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${email}&token=${token}`;
```

### 5. Set Up SPF, DKIM, DMARC

Add DNS records for your domain:

```dns
# SPF Record
TXT @ "v=spf1 include:sendgrid.net ~all"

# DKIM Record (Get from provider)
TXT s1._domainkey "k=rsa; p=MIGfMA0GCSq..."

# DMARC Record
TXT _dmarc "v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com"
```

## Campaign Analytics

### Metrics to Track

1. **Delivery Metrics**
   - Sent: Total emails sent
   - Delivered: Successfully delivered
   - Bounced: Failed to deliver
   - Delivery Rate: Delivered / Sent

2. **Engagement Metrics**
   - Opened: Unique opens
   - Clicked: Unique clicks
   - Open Rate: Opens / Delivered
   - Click Rate: Clicks / Delivered
   - Click-to-Open Rate: Clicks / Opens

3. **Conversion Metrics**
   - Conversions: Sales from email
   - Revenue: Total revenue generated
   - Conversion Rate: Conversions / Delivered
   - Revenue per Email: Revenue / Delivered

4. **List Health Metrics**
   - Unsubscribe Rate: Unsubscribes / Delivered
   - Complaint Rate: Complaints / Delivered
   - Bounce Rate: Bounces / Sent

### Get Analytics

```javascript
// Campaign analytics
const response = await fetch('/api/email/analytics?campaignId=campaign-id');
const { analytics } = await response.json();

console.log(`
  Sent: ${analytics.emails_sent}
  Delivered: ${analytics.emails_delivered}
  Opened: ${analytics.emails_opened}
  Clicked: ${analytics.emails_clicked}

  Open Rate: ${analytics.open_rate}%
  Click Rate: ${analytics.click_rate}%
  Bounce Rate: ${analytics.bounce_rate}%
  Conversion Rate: ${analytics.conversion_rate}%

  Revenue: $${analytics.revenue_generated}
`);
```

## Troubleshooting

### Low Open Rates (< 15%)

**Causes:**
- Poor subject lines
- Wrong send time
- Inactive subscribers
- Spam folder delivery

**Solutions:**
- A/B test subject lines
- Test different send times
- Clean inactive subscribers
- Improve sender reputation

### Low Click Rates (< 2%)

**Causes:**
- Weak call-to-action
- Poor email design
- Wrong audience
- Mobile unfriendly

**Solutions:**
- Stronger, clearer CTA
- Improve email layout
- Better segmentation
- Test on mobile devices

### High Bounce Rate (> 5%)

**Causes:**
- Old email list
- Purchased lists
- Typos in emails

**Solutions:**
- Remove bounced emails
- Use double opt-in
- Validate email addresses
- Regular list cleaning

### High Unsubscribe Rate (> 0.5%)

**Causes:**
- Too frequent emails
- Irrelevant content
- Misleading subject lines

**Solutions:**
- Reduce frequency
- Better segmentation
- Match subject to content
- Preference center

## Campaign Examples

### Example 1: Welcome Series

```javascript
// Email 1: Immediate
{
  name: 'Welcome Email',
  trigger: 'user_signup',
  delay_hours: 0,
  templateId: 'welcome_template',
  variables: {
    discount_code: 'WELCOME10',
    expiry_days: 7
  }
}

// Email 2: Day 3
{
  name: 'Getting Started Guide',
  trigger: 'user_signup',
  delay_hours: 72,
  templateId: 'guide_template'
}

// Email 3: Day 7
{
  name: 'Special Offer',
  trigger: 'user_signup',
  delay_hours: 168,
  templateId: 'offer_template'
}
```

### Example 2: Abandoned Cart

```javascript
// Email 1: 1 hour later
{
  name: 'Cart Reminder',
  trigger: 'cart_abandoned',
  delay_hours: 1,
  templateId: 'cart_reminder_template'
}

// Email 2: 24 hours later
{
  name: 'Cart + Discount',
  trigger: 'cart_abandoned',
  delay_hours: 24,
  templateId: 'cart_discount_template',
  variables: {
    discount_amount: 10
  }
}

// Email 3: 72 hours later
{
  name: 'Last Chance',
  trigger: 'cart_abandoned',
  delay_hours: 72,
  templateId: 'cart_last_chance_template'
}
```

### Example 3: Re-engagement

```javascript
{
  name: 'Win Back Campaign',
  segmentFilters: {
    rfm_segment: ['at_risk', 'hibernating'],
    last_order_days_ago: 90
  },
  templateId: 'winback_template',
  variables: {
    discount_code: 'COMEBACK20',
    discount_amount: 20
  }
}
```

## Advanced Features

### Dynamic Content

```javascript
// Conditional content based on customer data
const htmlContent = `
  <h1>Hi {{customer_name}}</h1>

  {{#if is_vip}}
    <p>As a VIP member, you get early access!</p>
  {{else}}
    <p>Join our VIP program for exclusive benefits.</p>
  {{/if}}

  {{#if birthday_month}}
    <p>🎂 Happy birthday! Here's a special gift: {{birthday_discount}}</p>
  {{/if}}
`;
```

### Personalized Product Recommendations

```javascript
{
  templateId: 'recommendation_template',
  variables: {
    customer_name: 'John',
    recommended_products: getRecommendations(customerId),
    view_history: getViewHistory(customerId)
  }
}
```

### Multi-language Support

```javascript
{
  templateId: customer.language === 'th'
    ? 'template_th'
    : 'template_en',
  variables: {
    greeting: customer.language === 'th'
      ? 'สวัสดี'
      : 'Hello'
  }
}
```

## Compliance

### GDPR (Europe)

- ✅ Obtain explicit consent
- ✅ Clear unsubscribe option
- ✅ Privacy policy link
- ✅ Data processing agreement
- ✅ Right to be forgotten

### CAN-SPAM (USA)

- ✅ Accurate From/To/Reply headers
- ✅ Clear subject line
- ✅ Physical address in footer
- ✅ Unsubscribe mechanism
- ✅ Honor opt-outs within 10 days

### PDPA (Thailand)

- ✅ Consent for marketing
- ✅ Opt-out mechanism
- ✅ Data protection measures
- ✅ Purpose notification

## Next Steps

1. ✅ Configure your email provider
2. ✅ Create email templates
3. ✅ Set up webhooks for tracking
4. ✅ Send test emails
5. ✅ Create your first campaign
6. ✅ Monitor analytics
7. ✅ Optimize based on results
8. ✅ Scale your campaigns

Need help? Check the [Email System Guide](/docs/EMAIL_SYSTEM_GUIDE.md) for detailed API documentation.
