# Email Workflow Automation

Visual drag-drop email workflow builder with triggers, conditions, and automated actions.

## Features

### 🎨 Visual Workflow Builder
- Drag-and-drop interface
- Visual workflow diagram
- Step configuration panel
- Real-time preview

### ⚡ Triggers
**Order Triggers:**
- Order Created
- Order Paid
- Order Shipped
- Order Completed
- Order Refunded
- Order Cancelled

**Customer Triggers:**
- Customer Signup
- Customer Birthday
- Customer Anniversary

**Behavioral Triggers:**
- Cart Abandoned
- Wishlist Viewed
- Price Drop
- Product Back in Stock

**Time Triggers:**
- Scheduled Time
- Recurring Schedule

**Manual Triggers:**
- Admin Button Trigger

### 🔧 Actions

**Send Email**
- Template selection
- Dynamic variables ({{customer_name}}, {{order_total}}, etc.)
- HTML email support
- Personalization

**Wait/Delay**
- Days, hours, seconds
- Scheduled delays
- Time-based execution

**Send SMS**
- SMS notifications
- Dynamic content
- Multi-provider support

**Conditions**
- If/then logic
- Field comparison
- Branching workflows

**Customer Actions**
- Add Tag
- Update Field
- Create Task

### 📊 Analytics
- Email sent count
- Open rate
- Click rate
- Conversion rate
- Revenue attribution
- Performance metrics
- A/B testing

## Pre-built Templates

### 1. Welcome Series (3 Emails)
Automated onboarding sequence for new customers over 7 days.

**Trigger:** Customer Signup

**Flow:**
1. Welcome email (immediate)
2. Wait 3 days
3. Feature highlights email
4. Wait 4 days
5. Best sellers email
6. Add "onboarded" tag

### 2. Abandoned Cart Recovery
Recover lost sales with 3 reminder emails over 7 days.

**Trigger:** Cart Abandoned (1 hour)

**Flow:**
1. Wait 1 hour
2. Reminder email #1
3. Wait 1 day
4. Reminder email #2 with 10% discount
5. Wait 3 days
6. Final reminder with urgency

### 3. Post-Purchase Follow-up
Thank customers and request reviews after delivery.

**Trigger:** Order Completed

**Flow:**
1. Wait 1 day
2. Thank you email
3. Wait 7 days
4. Review request with incentive

### 4. Birthday Greetings
Send personalized birthday wishes with special discount.

**Trigger:** Customer Birthday

**Flow:**
1. Birthday email with 20% discount
2. Birthday SMS
3. Add birthday tag

### 5. Re-engagement Campaign
Win back inactive customers with personalized offers.

**Trigger:** Scheduled (Monthly)

**Flow:**
1. Check last purchase > 90 days
2. "We miss you" email with 15% off
3. Wait 7 days
4. Check if purchased
5. If no purchase: Final offer (20% off)
6. Add winback tag

### 6. Product Review Request
Automatically request product reviews after delivery.

**Trigger:** Order Completed

**Flow:**
1. Wait 5 days
2. Review request email
3. Wait 3 days
4. Check if reviewed
5. If not reviewed: Reminder email

## API Reference

### Create Workflow
```typescript
POST /api/workflows

{
  "name": "Welcome Series",
  "description": "3-email welcome sequence",
  "trigger_type": "customer_signup",
  "trigger_config": {},
  "steps": [
    {
      "step_type": "send_email",
      "step_name": "Welcome Email",
      "step_config": {
        "subject": "Welcome!",
        "to": "{{customer_email}}",
        "body": "Hi {{customer_name}}..."
      }
    }
  ]
}
```

### List Workflows
```typescript
GET /api/workflows?status=active&page=1&limit=20
```

### Get Workflow
```typescript
GET /api/workflows/:id
```

### Update Workflow
```typescript
PUT /api/workflows/:id

{
  "name": "Updated Name",
  "status": "active"
}
```

### Activate Workflow
```typescript
POST /api/workflows/:id/activate

{
  "active": true
}
```

### Get Execution History
```typescript
GET /api/workflows/:id/executions?status=completed&page=1
```

### Test Workflow
```typescript
POST /api/workflows/:id/test

{
  "customer_email": "test@example.com",
  "customer_name": "Test Customer"
}
```

### Get Templates
```typescript
GET /api/workflows/templates?category=onboarding
```

## Usage Examples

### Example 1: Create Welcome Email Workflow

```typescript
const workflow = {
  name: "Welcome Email",
  trigger_type: "customer_signup",
  steps: [
    {
      step_type: "send_email",
      step_name: "Welcome",
      step_config: {
        subject: "Welcome to {{company_name}}!",
        to: "{{customer_email}}",
        body: `
          <h1>Hi {{customer_name}}!</h1>
          <p>Thanks for signing up!</p>
        `
      }
    }
  ]
};

const response = await fetch('/api/workflows', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(workflow)
});
```

### Example 2: Create Conditional Workflow

```typescript
const workflow = {
  name: "VIP Customer Flow",
  trigger_type: "order_completed",
  steps: [
    {
      step_type: "condition",
      step_name: "Check Order Value",
      step_config: {
        condition: {
          field: "order.total",
          operator: "greater_than",
          value: 5000
        }
      }
    },
    {
      step_type: "send_email",
      step_name: "VIP Thank You",
      step_config: {
        subject: "Thank you, VIP customer!",
        to: "{{customer_email}}",
        body: "Thanks for your large order!"
      }
    },
    {
      step_type: "add_tag",
      step_name: "Add VIP Tag",
      step_config: {
        tag: "vip-customer"
      }
    }
  ]
};
```

### Example 3: Trigger Workflow Programmatically

```typescript
import { triggerWorkflow } from '@/lib/automation/workflow-engine';

// Trigger on customer signup
async function onCustomerSignup(customer: any) {
  await triggerWorkflow('workflow-id', {
    customer_id: customer.id,
    customer_email: customer.email,
    customer_name: customer.name,
  });
}

// Trigger on order completed
async function onOrderCompleted(order: any) {
  await triggerWorkflow('workflow-id', {
    order_id: order.id,
    customer_id: order.customer_id,
    customer_email: order.customer_email,
    order_total: order.total,
    order_number: order.order_number,
  });
}
```

### Example 4: Track Analytics

```typescript
import {
  trackEmailOpened,
  trackEmailClicked,
  trackConversion
} from '@/lib/automation/workflow-analytics';

// Track email opened (from email tracking pixel)
await trackEmailOpened(workflowId, executionId, emailId);

// Track email clicked (from tracked links)
await trackEmailClicked(workflowId, executionId, emailId);

// Track conversion and revenue
await trackConversion(
  workflowId,
  executionId,
  orderId,
  revenueAmount,
  'THB'
);
```

### Example 5: Get Workflow Analytics

```typescript
import { WorkflowAnalytics } from '@/lib/automation/workflow-analytics';

const analytics = new WorkflowAnalytics();

// Get overall metrics
const metrics = await analytics.getWorkflowMetrics(workflowId, 30);
console.log('Conversion rate:', metrics.conversion_rate);
console.log('Total revenue:', metrics.total_revenue);

// Get email engagement
const engagement = await analytics.getEmailEngagement(workflowId, 30);
console.log('Open rate:', (engagement.opened / engagement.sent * 100).toFixed(2) + '%');

// Get conversion funnel
const funnel = await analytics.getConversionFunnel(workflowId, 30);
console.log('Funnel:', funnel);

// Compare workflows (A/B testing)
const comparison = await analytics.compareWorkflows(
  workflowIdA,
  workflowIdB,
  30
);
console.log('Winner:', comparison.winner);
console.log('Improvement:', comparison.improvement + '%');
```

## Dynamic Variables

Use `{{variable}}` syntax for dynamic content:

**Customer Variables:**
- `{{customer_id}}`
- `{{customer_email}}`
- `{{customer_name}}`
- `{{customer_phone}}`

**Order Variables:**
- `{{order_id}}`
- `{{order_number}}`
- `{{order_total}}`
- `{{order_items}}`
- `{{order_status}}`

**Product Variables:**
- `{{product_id}}`
- `{{product_name}}`
- `{{product_price}}`
- `{{product_url}}`

**Company Variables:**
- `{{company_name}}`
- `{{shop_url}}`
- `{{support_email}}`

**Custom Variables:**
- Any field from execution context

## Cron Setup

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/workflows",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

Or use GitHub Actions:

```yaml
name: Workflow Scheduler
on:
  schedule:
    - cron: '*/5 * * * *'
jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger workflow cron
        run: |
          curl -X POST https://your-domain.com/api/cron/workflows \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

## Database Schema

### email_workflows
- id, name, description, status
- trigger_type, trigger_config
- total_executions, successful_executions, failed_executions
- created_at, updated_at, activated_at

### workflow_steps
- id, workflow_id, step_order
- step_type, step_name, step_config
- position_x, position_y (for visual designer)
- next_step_id, condition_true_step_id, condition_false_step_id

### workflow_triggers
- id, workflow_id, trigger_type
- trigger_config, filter_conditions
- schedule_cron, next_run_at, last_run_at

### workflow_executions
- id, workflow_id, trigger_id
- status, execution_context
- started_at, completed_at
- emails_sent, sms_sent

### workflow_analytics
- id, workflow_id, execution_id
- event_type, event_timestamp
- email_id, recipient_email
- order_id, revenue_amount

## Best Practices

1. **Test First**: Always test workflows before activating
2. **Use Templates**: Start with pre-built templates
3. **Monitor Analytics**: Track performance regularly
4. **Segment Customers**: Use conditions for personalization
5. **A/B Testing**: Compare workflow variants
6. **Unsubscribe**: Include unsubscribe links
7. **Throttling**: Avoid sending too many emails
8. **Error Handling**: Enable retry on failure
9. **Data Privacy**: Follow GDPR/PDPA regulations
10. **Mobile Optimize**: Ensure mobile-friendly emails

## Troubleshooting

**Workflow not triggering:**
- Check workflow status is "active"
- Verify trigger conditions are met
- Check trigger configuration

**Emails not sending:**
- Verify email service is configured
- Check step configuration
- Review execution logs

**Poor performance:**
- Check email content quality
- Review send times
- Analyze subject lines
- Test different variations

## Support

For issues or questions:
- Check execution history in workflow dashboard
- Review analytics for insights
- Test workflows with test mode
- Contact support team

## Migration Guide

### From Manual Emails

1. Identify email campaigns
2. Map to workflow triggers
3. Create workflow steps
4. Test with small segment
5. Activate and monitor

### From Other Platforms

1. Export email templates
2. Create workflows using templates
3. Import customer segments
4. Set up triggers
5. Activate workflows

## Roadmap

- [ ] Visual A/B testing builder
- [ ] Advanced segmentation
- [ ] SMS workflow actions
- [ ] Push notification actions
- [ ] Webhook actions
- [ ] API actions
- [ ] Machine learning optimization
- [ ] Predictive send times
- [ ] Content recommendations
