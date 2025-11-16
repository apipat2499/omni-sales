# Email Workflow Examples

Real-world workflow examples and use cases.

## Example 1: Advanced Abandoned Cart Recovery

```typescript
{
  "name": "Advanced Abandoned Cart Recovery",
  "description": "Multi-step cart recovery with dynamic discounts",
  "trigger_type": "cart_abandoned",
  "trigger_config": {
    "abandon_duration_hours": 1,
    "min_cart_value": 100
  },
  "steps": [
    {
      "step_order": 1,
      "step_type": "wait",
      "step_name": "Wait 1 Hour",
      "step_config": {
        "delay_hours": 1
      }
    },
    {
      "step_order": 2,
      "step_type": "condition",
      "step_name": "Check Cart Value",
      "step_config": {
        "condition": {
          "field": "cart.total",
          "operator": "greater_than",
          "value": 1000
        }
      }
    },
    {
      "step_order": 3,
      "step_type": "send_email",
      "step_name": "High-Value Cart Reminder",
      "step_config": {
        "subject": "Your premium items are waiting!",
        "to": "{{customer_email}}",
        "body": "<h1>Don't miss out on your premium selection!</h1><p>Your cart total: {{cart_total}} THB</p><p>Get 15% OFF with code: PREMIUM15</p>",
        "template_id": "high-value-cart"
      }
    },
    {
      "step_order": 4,
      "step_type": "send_email",
      "step_name": "Standard Cart Reminder",
      "step_config": {
        "subject": "You left items in your cart",
        "to": "{{customer_email}}",
        "body": "<h1>Complete your order</h1><p>Your cart total: {{cart_total}} THB</p><p>Get 10% OFF with code: CART10</p>",
        "template_id": "standard-cart"
      }
    },
    {
      "step_order": 5,
      "step_type": "wait",
      "step_name": "Wait 24 Hours",
      "step_config": {
        "delay_hours": 24
      }
    },
    {
      "step_order": 6,
      "step_type": "send_sms",
      "step_name": "SMS Reminder",
      "step_config": {
        "to": "{{customer_phone}}",
        "message": "Your cart items are waiting! Complete your order and save with code CART10. {{cart_url}}"
      }
    },
    {
      "step_order": 7,
      "step_type": "wait",
      "step_name": "Wait 2 Days",
      "step_config": {
        "delay_days": 2
      }
    },
    {
      "step_order": 8,
      "step_type": "send_email",
      "step_name": "Final Urgency Email",
      "step_config": {
        "subject": "⏰ Last chance! Items may sell out",
        "to": "{{customer_email}}",
        "body": "<h1>Your cart expires soon!</h1><p>Some items are low in stock. Complete your order now!</p>",
        "template_id": "cart-urgency"
      }
    },
    {
      "step_order": 9,
      "step_type": "add_tag",
      "step_name": "Tag as Cart Abandoner",
      "step_config": {
        "tag": "cart-abandoned-2025"
      }
    }
  ]
}
```

## Example 2: VIP Customer Onboarding

```typescript
{
  "name": "VIP Customer Onboarding",
  "description": "Special onboarding for high-value customers",
  "trigger_type": "customer_signup",
  "trigger_config": {},
  "steps": [
    {
      "step_order": 1,
      "step_type": "condition",
      "step_name": "Check if VIP",
      "step_config": {
        "condition": {
          "field": "customer.vip_status",
          "operator": "equals",
          "value": true
        }
      }
    },
    {
      "step_order": 2,
      "step_type": "send_email",
      "step_name": "VIP Welcome Email",
      "step_config": {
        "subject": "Welcome to our VIP Program! 🌟",
        "to": "{{customer_email}}",
        "body": "<h1>Welcome, {{customer_name}}!</h1><p>As a VIP member, you get:</p><ul><li>Free shipping on all orders</li><li>20% discount on all products</li><li>Early access to new releases</li><li>Dedicated support team</li></ul>",
        "template_id": "vip-welcome"
      }
    },
    {
      "step_order": 3,
      "step_type": "send_sms",
      "step_name": "VIP SMS Welcome",
      "step_config": {
        "to": "{{customer_phone}}",
        "message": "Welcome to VIP, {{customer_name}}! Your exclusive 20% discount is ready. Code: VIP20"
      }
    },
    {
      "step_order": 4,
      "step_type": "create_task",
      "step_name": "Assign Account Manager",
      "step_config": {
        "title": "Assign VIP Account Manager",
        "description": "New VIP customer {{customer_name}} needs account manager",
        "assigned_to": "vip-team",
        "priority": "high"
      }
    },
    {
      "step_order": 5,
      "step_type": "add_tag",
      "step_name": "Tag as VIP Onboarded",
      "step_config": {
        "tag": "vip-onboarded"
      }
    },
    {
      "step_order": 6,
      "step_type": "wait",
      "step_name": "Wait 3 Days",
      "step_config": {
        "delay_days": 3
      }
    },
    {
      "step_order": 7,
      "step_type": "send_email",
      "step_name": "VIP Concierge Introduction",
      "step_config": {
        "subject": "Meet your personal shopping concierge",
        "to": "{{customer_email}}",
        "body": "<h1>Your VIP experience starts here</h1><p>Hi {{customer_name}},</p><p>Meet {{concierge_name}}, your personal shopping concierge.</p><p>Need help finding the perfect product? Just reply to this email!</p>",
        "template_id": "vip-concierge"
      }
    }
  ]
}
```

## Example 3: Post-Purchase Upsell Sequence

```typescript
{
  "name": "Post-Purchase Upsell",
  "description": "Recommend complementary products after purchase",
  "trigger_type": "order_completed",
  "trigger_config": {},
  "steps": [
    {
      "step_order": 1,
      "step_type": "wait",
      "step_name": "Wait 3 Days",
      "step_config": {
        "delay_days": 3
      }
    },
    {
      "step_order": 2,
      "step_type": "send_email",
      "step_name": "Thank You Email",
      "step_config": {
        "subject": "Thank you for your order, {{customer_name}}!",
        "to": "{{customer_email}}",
        "body": "<h1>We hope you love your purchase!</h1><p>Your order #{{order_number}} has been delivered.</p><p>Here are some products that go great with your purchase:</p>{{recommended_products}}",
        "template_id": "thank-you-upsell"
      }
    },
    {
      "step_order": 3,
      "step_type": "wait",
      "step_name": "Wait 7 Days",
      "step_config": {
        "delay_days": 7
      }
    },
    {
      "step_order": 4,
      "step_type": "condition",
      "step_name": "Check if Made Another Purchase",
      "step_config": {
        "condition": {
          "field": "repeat_purchase",
          "operator": "equals",
          "value": false
        }
      }
    },
    {
      "step_order": 5,
      "step_type": "send_email",
      "step_name": "Complementary Products Email",
      "step_config": {
        "subject": "Complete your collection!",
        "to": "{{customer_email}}",
        "body": "<h1>Don't miss these perfect matches!</h1><p>Based on your recent purchase, you might love:</p>{{ai_recommended_products}}<p>Get 10% OFF with code: COMPLETE10</p>",
        "template_id": "complementary-products"
      }
    },
    {
      "step_order": 6,
      "step_type": "wait",
      "step_name": "Wait 5 Days",
      "step_config": {
        "delay_days": 5
      }
    },
    {
      "step_order": 7,
      "step_type": "send_email",
      "step_name": "Review Request",
      "step_config": {
        "subject": "How are you enjoying your {{product_name}}?",
        "to": "{{customer_email}}",
        "body": "<h1>Share your experience</h1><p>We'd love to hear what you think!</p><a href='{{review_url}}'>Leave a Review</a><p>Earn 100 loyalty points!</p>",
        "template_id": "review-request"
      }
    }
  ]
}
```

## Example 4: Seasonal Campaign Automation

```typescript
{
  "name": "Black Friday Campaign",
  "description": "Automated Black Friday promotional sequence",
  "trigger_type": "scheduled_time",
  "trigger_config": {
    "start_date": "2025-11-28T00:00:00Z"
  },
  "steps": [
    {
      "step_order": 1,
      "step_type": "send_email",
      "step_name": "Black Friday Announcement",
      "step_config": {
        "subject": "🔥 Black Friday is HERE! Up to 70% OFF",
        "to": "{{customer_email}}",
        "body": "<h1>Black Friday Mega Sale!</h1><p>Hi {{customer_name}},</p><p>Our biggest sale of the year is now live!</p><ul><li>Up to 70% OFF</li><li>Free shipping on all orders</li><li>Extra 10% for loyalty members</li></ul><a href='{{shop_url}}'>Shop Now</a>",
        "template_id": "black-friday-announcement"
      }
    },
    {
      "step_order": 2,
      "step_type": "wait",
      "step_name": "Wait 6 Hours",
      "step_config": {
        "delay_hours": 6
      }
    },
    {
      "step_order": 3,
      "step_type": "condition",
      "step_name": "Check if Purchased",
      "step_config": {
        "condition": {
          "field": "black_friday_purchase",
          "operator": "equals",
          "value": false
        }
      }
    },
    {
      "step_order": 4,
      "step_type": "send_email",
      "step_name": "Personalized Recommendations",
      "step_config": {
        "subject": "{{customer_name}}, these deals are picked just for you!",
        "to": "{{customer_email}}",
        "body": "<h1>Your personal Black Friday picks</h1><p>Based on your browsing history:</p>{{personalized_deals}}<p>Hurry! Sale ends in 18 hours!</p>",
        "template_id": "personalized-black-friday"
      }
    },
    {
      "step_order": 5,
      "step_type": "wait",
      "step_name": "Wait 12 Hours",
      "step_config": {
        "delay_hours": 12
      }
    },
    {
      "step_order": 6,
      "step_type": "condition",
      "step_name": "Final Check if Purchased",
      "step_config": {
        "condition": {
          "field": "black_friday_purchase",
          "operator": "equals",
          "value": false
        }
      }
    },
    {
      "step_order": 7,
      "step_type": "send_email",
      "step_name": "Last Chance Email",
      "step_config": {
        "subject": "⏰ FINAL HOURS! Black Friday ends tonight",
        "to": "{{customer_email}}",
        "body": "<h1>Last Chance!</h1><p>Black Friday ends in 6 hours!</p><p>Don't miss out on up to 70% OFF!</p><a href='{{shop_url}}'>Shop Now</a>",
        "template_id": "black-friday-last-chance"
      }
    },
    {
      "step_order": 8,
      "step_type": "send_sms",
      "step_name": "Final SMS Alert",
      "step_config": {
        "to": "{{customer_phone}}",
        "message": "BLACK FRIDAY ENDS IN 6 HOURS! Up to 70% OFF. Shop now: {{shop_url}}"
      }
    }
  ]
}
```

## Example 5: Customer Win-Back Series

```typescript
{
  "name": "90-Day Win-Back Campaign",
  "description": "Re-engage customers who haven't purchased in 90 days",
  "trigger_type": "scheduled_time",
  "trigger_config": {
    "schedule": "weekly"
  },
  "steps": [
    {
      "step_order": 1,
      "step_type": "condition",
      "step_name": "Check Inactivity",
      "step_config": {
        "condition": {
          "field": "days_since_last_purchase",
          "operator": "greater_than",
          "value": 90
        }
      }
    },
    {
      "step_order": 2,
      "step_type": "condition",
      "step_name": "Check Customer Tier",
      "step_config": {
        "condition": {
          "field": "customer.tier",
          "operator": "equals",
          "value": "gold"
        }
      }
    },
    {
      "step_order": 3,
      "step_type": "send_email",
      "step_name": "Gold Tier Win-Back",
      "step_config": {
        "subject": "We miss you, {{customer_name}}! Here's 20% OFF",
        "to": "{{customer_email}}",
        "body": "<h1>Your VIP status is waiting!</h1><p>Hi {{customer_name}},</p><p>As a Gold member, we want you back with a special offer:</p><p>20% OFF + Free Shipping on your next order</p><p>Code: GOLD20</p>",
        "template_id": "gold-winback"
      }
    },
    {
      "step_order": 4,
      "step_type": "send_email",
      "step_name": "Standard Win-Back",
      "step_config": {
        "subject": "We miss you! Come back for 15% OFF",
        "to": "{{customer_email}}",
        "body": "<h1>Long time no see!</h1><p>We've missed you, {{customer_name}}!</p><p>Here's 15% OFF to welcome you back</p><p>Code: COMEBACK15</p>",
        "template_id": "standard-winback"
      }
    },
    {
      "step_order": 5,
      "step_type": "wait",
      "step_name": "Wait 5 Days",
      "step_config": {
        "delay_days": 5
      }
    },
    {
      "step_order": 6,
      "step_type": "condition",
      "step_name": "Check if Returned",
      "step_config": {
        "condition": {
          "field": "recent_purchase",
          "operator": "exists",
          "value": true
        }
      }
    },
    {
      "step_order": 7,
      "step_type": "send_email",
      "step_name": "Welcome Back Email",
      "step_config": {
        "subject": "Welcome back! 🎉",
        "to": "{{customer_email}}",
        "body": "<h1>So glad you're back!</h1><p>Thanks for your order! We've added 500 bonus loyalty points to your account.</p>",
        "template_id": "welcome-back"
      }
    },
    {
      "step_order": 8,
      "step_type": "update_field",
      "step_name": "Add Loyalty Points",
      "step_config": {
        "table": "customers",
        "field": "loyalty_points",
        "value": "{{loyalty_points}} + 500"
      }
    },
    {
      "step_order": 9,
      "step_type": "send_email",
      "step_name": "What's New Email",
      "step_config": {
        "subject": "See what's new since you've been away",
        "to": "{{customer_email}}",
        "body": "<h1>What's new at {{company_name}}</h1><p>Check out our new products and features!</p>{{new_products}}",
        "template_id": "whats-new"
      }
    },
    {
      "step_order": 10,
      "step_type": "wait",
      "step_name": "Wait 7 Days",
      "step_config": {
        "delay_days": 7
      }
    },
    {
      "step_order": 11,
      "step_type": "send_email",
      "step_name": "Final Offer",
      "step_config": {
        "subject": "Final offer: 25% OFF everything",
        "to": "{{customer_email}}",
        "body": "<h1>This is our final offer</h1><p>We really want you back!</p><p>25% OFF your entire order</p><p>Code: FINAL25</p><p>Valid for 48 hours only</p>",
        "template_id": "final-winback"
      }
    }
  ]
}
```

## Example 6: Loyalty Tier Upgrade Celebration

```typescript
{
  "name": "Loyalty Tier Upgrade",
  "description": "Celebrate when customer reaches new loyalty tier",
  "trigger_type": "manual_trigger",
  "trigger_config": {},
  "steps": [
    {
      "step_order": 1,
      "step_type": "send_email",
      "step_name": "Tier Upgrade Email",
      "step_config": {
        "subject": "🎉 Congratulations! You've reached {{new_tier}} status!",
        "to": "{{customer_email}}",
        "body": "<h1>Welcome to {{new_tier}}!</h1><p>Hi {{customer_name}},</p><p>You've reached {{new_tier}} tier!</p><p>Your new benefits:</p><ul><li>{{benefit_1}}</li><li>{{benefit_2}}</li><li>{{benefit_3}}</li></ul><p>Thank you for being a loyal customer!</p>",
        "template_id": "tier-upgrade"
      }
    },
    {
      "step_order": 2,
      "step_type": "send_sms",
      "step_name": "Tier Upgrade SMS",
      "step_config": {
        "to": "{{customer_phone}}",
        "message": "Congrats {{customer_name}}! You're now {{new_tier}} tier! Enjoy exclusive benefits. Check your email for details."
      }
    },
    {
      "step_order": 3,
      "step_type": "update_field",
      "step_name": "Update Tier",
      "step_config": {
        "table": "customers",
        "field": "tier",
        "value": "{{new_tier}}"
      }
    },
    {
      "step_order": 4,
      "step_type": "add_tag",
      "step_name": "Tag New Tier",
      "step_config": {
        "tag": "{{new_tier}}-member"
      }
    },
    {
      "step_order": 5,
      "step_type": "wait",
      "step_name": "Wait 2 Days",
      "step_config": {
        "delay_days": 2
      }
    },
    {
      "step_order": 6,
      "step_type": "send_email",
      "step_name": "Tier Benefits Guide",
      "step_config": {
        "subject": "Your complete {{new_tier}} benefits guide",
        "to": "{{customer_email}}",
        "body": "<h1>Make the most of your {{new_tier}} status</h1><p>Here's everything you can do:</p>{{benefits_guide}}<p>Start enjoying your perks today!</p>",
        "template_id": "tier-benefits"
      }
    }
  ]
}
```

## Programmatic Usage

### Trigger on Cart Abandonment

```typescript
// In your cart tracking code
async function onCartAbandoned(cart: Cart) {
  const workflowId = 'abandoned-cart-workflow-id';

  await triggerWorkflow(workflowId, {
    cart_id: cart.id,
    customer_id: cart.customer_id,
    customer_email: cart.customer_email,
    customer_name: cart.customer_name,
    customer_phone: cart.customer_phone,
    cart_total: cart.total,
    cart_items: cart.items.map(item => `
      <div>
        <h3>${item.product_name}</h3>
        <p>${item.quantity} x ${item.price} THB</p>
      </div>
    `).join(''),
    cart_url: `https://yourstore.com/cart/${cart.id}`,
    discounted_total: cart.total * 0.9, // 10% off
  });
}
```

### Trigger on Customer Birthday

```typescript
// In a daily cron job
async function sendBirthdayEmails() {
  const today = new Date();
  const customers = await getCustomersWithBirthdayToday(today);

  const workflowId = 'birthday-workflow-id';

  for (const customer of customers) {
    await triggerWorkflow(workflowId, {
      customer_id: customer.id,
      customer_email: customer.email,
      customer_name: customer.name,
      customer_phone: customer.phone,
      shop_url: 'https://yourstore.com',
      company_name: 'Your Store',
    });
  }
}
```

### Trigger on VIP Status Change

```typescript
// When customer reaches VIP threshold
async function onCustomerReachedVIP(customer: Customer) {
  const workflowId = 'vip-onboarding-workflow-id';

  await triggerWorkflow(workflowId, {
    customer_id: customer.id,
    customer_email: customer.email,
    customer_name: customer.name,
    customer_phone: customer.phone,
    vip_status: true,
    concierge_name: 'Sarah Johnson',
    concierge_email: 'sarah@yourstore.com',
  });
}
```

## Best Practices from Examples

1. **Segment by Value**: Different workflows for high-value vs standard customers
2. **Use Conditions**: Branch workflows based on customer behavior
3. **Multi-Channel**: Combine email and SMS for better reach
4. **Timing Matters**: Optimize send times based on customer behavior
5. **Personalization**: Use dynamic variables for personalized content
6. **Progressive Discounts**: Increase discount over time to drive urgency
7. **Track Everything**: Use analytics to optimize performance
8. **Test and Iterate**: A/B test different workflows
9. **Respect Preferences**: Honor unsubscribe and communication preferences
10. **Mobile Optimize**: Ensure all emails work on mobile devices
