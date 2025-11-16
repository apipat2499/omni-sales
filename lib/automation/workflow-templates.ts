/**
 * Pre-built Workflow Templates
 * Ready-to-use workflow templates for common scenarios
 */

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  trigger_type: string;
  trigger_config: any;
  steps: any[];
  triggers: any[];
  preview_image_url?: string;
  estimated_setup_time?: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
}

/**
 * Welcome Series Template (3 emails)
 */
export const WELCOME_SERIES_TEMPLATE: WorkflowTemplate = {
  id: 'welcome-series',
  name: 'Welcome Series (3 Emails)',
  description: 'Automated welcome email series sent over 7 days to new customers',
  category: 'onboarding',
  trigger_type: 'customer_signup',
  trigger_config: {},
  difficulty_level: 'beginner',
  estimated_setup_time: 15,
  steps: [
    {
      step_order: 1,
      step_type: 'send_email',
      step_name: 'Welcome Email #1',
      step_config: {
        subject: 'Welcome to {{company_name}}! 🎉',
        to: '{{customer_email}}',
        body: `
          <h1>Hi {{customer_name}}!</h1>
          <p>Welcome to {{company_name}}! We're thrilled to have you on board.</p>
          <p>Here's what you can expect from us:</p>
          <ul>
            <li>Exclusive deals and discounts</li>
            <li>New product launches</li>
            <li>Helpful tips and guides</li>
          </ul>
          <p>Start shopping now and enjoy 10% off your first order!</p>
          <a href="{{shop_url}}?code=WELCOME10" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Shop Now</a>
        `,
        template_id: 'welcome-1',
      },
      position_x: 100,
      position_y: 50,
    },
    {
      step_order: 2,
      step_type: 'wait',
      step_name: 'Wait 3 Days',
      step_config: {
        delay_days: 3,
        delay_hours: 0,
      },
      position_x: 100,
      position_y: 200,
    },
    {
      step_order: 3,
      step_type: 'send_email',
      step_name: 'Welcome Email #2',
      step_config: {
        subject: 'Discover What Makes Us Special',
        to: '{{customer_email}}',
        body: `
          <h1>Hi {{customer_name}}!</h1>
          <p>We wanted to share what makes {{company_name}} unique:</p>
          <ul>
            <li>✅ Free shipping on orders over 1,000 THB</li>
            <li>✅ 30-day money-back guarantee</li>
            <li>✅ Award-winning customer service</li>
            <li>✅ Eco-friendly packaging</li>
          </ul>
          <p>Have questions? Just hit reply - we're here to help!</p>
        `,
        template_id: 'welcome-2',
      },
      position_x: 100,
      position_y: 350,
    },
    {
      step_order: 4,
      step_type: 'wait',
      step_name: 'Wait 4 Days',
      step_config: {
        delay_days: 4,
        delay_hours: 0,
      },
      position_x: 100,
      position_y: 500,
    },
    {
      step_order: 5,
      step_type: 'send_email',
      step_name: 'Welcome Email #3',
      step_config: {
        subject: 'Here are our best sellers!',
        to: '{{customer_email}}',
        body: `
          <h1>Hi {{customer_name}}!</h1>
          <p>Check out what other customers are loving:</p>
          <p>🔥 Top 3 Best Sellers this month</p>
          <p>Still have your 10% welcome discount? Use code WELCOME10 at checkout!</p>
          <a href="{{shop_url}}/bestsellers" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Browse Best Sellers</a>
        `,
        template_id: 'welcome-3',
      },
      position_x: 100,
      position_y: 650,
    },
    {
      step_order: 6,
      step_type: 'add_tag',
      step_name: 'Tag as Onboarded',
      step_config: {
        tag: 'onboarded',
      },
      position_x: 100,
      position_y: 800,
    },
  ],
  triggers: [
    {
      trigger_type: 'customer_signup',
      trigger_config: {},
      filter_conditions: {},
      is_active: true,
    },
  ],
};

/**
 * Abandoned Cart Template
 */
export const ABANDONED_CART_TEMPLATE: WorkflowTemplate = {
  id: 'abandoned-cart',
  name: 'Abandoned Cart Recovery',
  description: 'Recover lost sales with 3 reminder emails over 7 days',
  category: 'recovery',
  trigger_type: 'cart_abandoned',
  trigger_config: {
    abandon_duration_hours: 1,
  },
  difficulty_level: 'beginner',
  estimated_setup_time: 10,
  steps: [
    {
      step_order: 1,
      step_type: 'wait',
      step_name: 'Wait 1 Hour',
      step_config: {
        delay_hours: 1,
      },
      position_x: 100,
      position_y: 50,
    },
    {
      step_order: 2,
      step_type: 'send_email',
      step_name: 'Reminder Email #1',
      step_config: {
        subject: 'You left something in your cart!',
        to: '{{customer_email}}',
        body: `
          <h1>Don't forget your items!</h1>
          <p>Hi {{customer_name}},</p>
          <p>We noticed you left some items in your cart. They're still waiting for you!</p>
          <p><strong>Your Cart:</strong></p>
          {{cart_items}}
          <p><strong>Total: {{cart_total}} THB</strong></p>
          <a href="{{cart_url}}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Complete Your Order</a>
        `,
        template_id: 'cart-reminder-1',
      },
      position_x: 100,
      position_y: 200,
    },
    {
      step_order: 3,
      step_type: 'wait',
      step_name: 'Wait 1 Day',
      step_config: {
        delay_days: 1,
      },
      position_x: 100,
      position_y: 350,
    },
    {
      step_order: 4,
      step_type: 'send_email',
      step_name: 'Reminder Email #2 with Discount',
      step_config: {
        subject: '10% OFF - Complete your order today!',
        to: '{{customer_email}}',
        body: `
          <h1>Special offer just for you!</h1>
          <p>Hi {{customer_name}},</p>
          <p>We really want you to have these items! Here's <strong>10% OFF</strong> to sweeten the deal.</p>
          <p>Use code: <strong>CART10</strong> at checkout</p>
          <p>Your cart total: <del>{{cart_total}} THB</del> <strong>{{discounted_total}} THB</strong></p>
          <a href="{{cart_url}}?code=CART10" style="background: #EF4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Claim Your Discount</a>
          <p style="color: #666; font-size: 12px;">Offer expires in 48 hours</p>
        `,
        template_id: 'cart-reminder-2',
      },
      position_x: 100,
      position_y: 500,
    },
    {
      step_order: 5,
      step_type: 'wait',
      step_name: 'Wait 3 Days',
      step_config: {
        delay_days: 3,
      },
      position_x: 100,
      position_y: 650,
    },
    {
      step_order: 6,
      step_type: 'send_email',
      step_name: 'Final Reminder',
      step_config: {
        subject: 'Last chance! Your cart items are almost gone',
        to: '{{customer_email}}',
        body: `
          <h1>⏰ Last Chance!</h1>
          <p>Hi {{customer_name}},</p>
          <p>Your cart items are selling fast and may soon be out of stock!</p>
          <p>This is your final reminder to complete your order.</p>
          <p>Your 10% discount code <strong>CART10</strong> is still valid for 24 hours.</p>
          <a href="{{cart_url}}?code=CART10" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Complete Order Now</a>
        `,
        template_id: 'cart-reminder-3',
      },
      position_x: 100,
      position_y: 800,
    },
  ],
  triggers: [
    {
      trigger_type: 'cart_abandoned',
      trigger_config: {
        abandon_duration_hours: 1,
      },
      filter_conditions: {
        cart_value_min: 100,
      },
      is_active: true,
    },
  ],
};

/**
 * Post-Purchase Follow-up Template
 */
export const POST_PURCHASE_TEMPLATE: WorkflowTemplate = {
  id: 'post-purchase',
  name: 'Post-Purchase Follow-up',
  description: 'Thank customers and request reviews after purchase',
  category: 'engagement',
  trigger_type: 'order_completed',
  trigger_config: {},
  difficulty_level: 'beginner',
  estimated_setup_time: 10,
  steps: [
    {
      step_order: 1,
      step_type: 'wait',
      step_name: 'Wait 1 Day',
      step_config: {
        delay_days: 1,
      },
      position_x: 100,
      position_y: 50,
    },
    {
      step_order: 2,
      step_type: 'send_email',
      step_name: 'Thank You Email',
      step_config: {
        subject: 'Thank you for your order! 💙',
        to: '{{customer_email}}',
        body: `
          <h1>Thank you for your order!</h1>
          <p>Hi {{customer_name}},</p>
          <p>We're so grateful for your purchase! Your order #{{order_number}} has been delivered.</p>
          <p>We hope you love your items. If you have any questions, we're here to help!</p>
          <p><a href="{{order_tracking_url}}">Track Your Order</a></p>
        `,
        template_id: 'thank-you',
      },
      position_x: 100,
      position_y: 200,
    },
    {
      step_order: 3,
      step_type: 'wait',
      step_name: 'Wait 7 Days',
      step_config: {
        delay_days: 7,
      },
      position_x: 100,
      position_y: 350,
    },
    {
      step_order: 4,
      step_type: 'send_email',
      step_name: 'Review Request',
      step_config: {
        subject: 'How was your experience? Leave a review ⭐',
        to: '{{customer_email}}',
        body: `
          <h1>We'd love your feedback!</h1>
          <p>Hi {{customer_name}},</p>
          <p>How are you enjoying your recent purchase?</p>
          <p>Your review helps us improve and helps other customers make informed decisions.</p>
          <p>It only takes 2 minutes!</p>
          <a href="{{review_url}}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Leave a Review</a>
          <p style="margin-top: 20px; color: #666;">As a thank you, we'll give you 50 loyalty points for your review!</p>
        `,
        template_id: 'review-request',
      },
      position_x: 100,
      position_y: 500,
    },
    {
      step_order: 5,
      step_type: 'add_tag',
      step_name: 'Tag as Recent Customer',
      step_config: {
        tag: 'recent-customer',
      },
      position_x: 100,
      position_y: 650,
    },
  ],
  triggers: [
    {
      trigger_type: 'order_completed',
      trigger_config: {},
      filter_conditions: {},
      is_active: true,
    },
  ],
};

/**
 * Birthday Greetings Template
 */
export const BIRTHDAY_TEMPLATE: WorkflowTemplate = {
  id: 'birthday',
  name: 'Birthday Greetings',
  description: 'Send personalized birthday wishes with special discount',
  category: 'engagement',
  trigger_type: 'customer_birthday',
  trigger_config: {},
  difficulty_level: 'beginner',
  estimated_setup_time: 5,
  steps: [
    {
      step_order: 1,
      step_type: 'send_email',
      step_name: 'Birthday Email',
      step_config: {
        subject: '🎂 Happy Birthday {{customer_name}}!',
        to: '{{customer_email}}',
        body: `
          <h1>🎉 Happy Birthday!</h1>
          <p>Hi {{customer_name}},</p>
          <p>Wishing you a fantastic birthday filled with joy and happiness!</p>
          <p>To celebrate your special day, here's a <strong>20% birthday discount</strong> just for you!</p>
          <p>Use code: <strong>BDAY20</strong></p>
          <a href="{{shop_url}}?code=BDAY20" style="background: #EC4899; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Start Shopping</a>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">Valid for 7 days from your birthday</p>
        `,
        template_id: 'birthday',
      },
      position_x: 100,
      position_y: 50,
    },
    {
      step_order: 2,
      step_type: 'send_sms',
      step_name: 'Birthday SMS',
      step_config: {
        to: '{{customer_phone}}',
        message: 'Happy Birthday {{customer_name}}! 🎂 Enjoy 20% OFF with code BDAY20. Valid for 7 days!',
      },
      position_x: 100,
      position_y: 200,
    },
    {
      step_order: 3,
      step_type: 'add_tag',
      step_name: 'Tag Birthday Sent',
      step_config: {
        tag: 'birthday-greeted-2025',
      },
      position_x: 100,
      position_y: 350,
    },
  ],
  triggers: [
    {
      trigger_type: 'customer_birthday',
      trigger_config: {},
      filter_conditions: {},
      is_active: true,
    },
  ],
};

/**
 * Re-engagement Campaign Template
 */
export const REENGAGEMENT_TEMPLATE: WorkflowTemplate = {
  id: 'reengagement',
  name: 'Re-engagement Campaign',
  description: 'Win back inactive customers with personalized offers',
  category: 'recovery',
  trigger_type: 'scheduled_time',
  trigger_config: {
    schedule: 'monthly',
  },
  difficulty_level: 'intermediate',
  estimated_setup_time: 15,
  steps: [
    {
      step_order: 1,
      step_type: 'condition',
      step_name: 'Check Last Purchase',
      step_config: {
        condition: {
          field: 'days_since_last_purchase',
          operator: 'greater_than',
          value: 90,
        },
      },
      position_x: 100,
      position_y: 50,
    },
    {
      step_order: 2,
      step_type: 'send_email',
      step_name: 'We Miss You Email',
      step_config: {
        subject: 'We miss you! Here\'s 15% off to come back',
        to: '{{customer_email}}',
        body: `
          <h1>We miss you! 💙</h1>
          <p>Hi {{customer_name}},</p>
          <p>It's been a while since we've seen you! We wanted to reach out and let you know we're thinking of you.</p>
          <p>Come back and discover what's new! Here's <strong>15% OFF</strong> your next order.</p>
          <p>Use code: <strong>WELCOME15</strong></p>
          <a href="{{shop_url}}?code=WELCOME15" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Browse New Arrivals</a>
          <p style="margin-top: 20px;">✨ See what's new since your last visit:</p>
          <ul>
            <li>New product collections</li>
            <li>Improved customer service</li>
            <li>Faster shipping</li>
          </ul>
        `,
        template_id: 'winback',
      },
      position_x: 100,
      position_y: 200,
    },
    {
      step_order: 3,
      step_type: 'wait',
      step_name: 'Wait 7 Days',
      step_config: {
        delay_days: 7,
      },
      position_x: 100,
      position_y: 350,
    },
    {
      step_order: 4,
      step_type: 'condition',
      step_name: 'Check if Purchased',
      step_config: {
        condition: {
          field: 'recent_purchase',
          operator: 'exists',
          value: true,
        },
      },
      position_x: 100,
      position_y: 500,
    },
    {
      step_order: 5,
      step_type: 'send_email',
      step_name: 'Final Offer',
      step_config: {
        subject: 'Final offer: 20% OFF - Don\'t miss out!',
        to: '{{customer_email}}',
        body: `
          <h1>Last chance to save!</h1>
          <p>Hi {{customer_name}},</p>
          <p>This is our final offer - we're giving you <strong>20% OFF</strong> everything!</p>
          <p>Use code: <strong>FINAL20</strong></p>
          <p>This offer expires in 48 hours, so don't wait!</p>
          <a href="{{shop_url}}?code=FINAL20" style="background: #EF4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Claim Your Discount</a>
        `,
        template_id: 'winback-final',
      },
      position_x: 100,
      position_y: 650,
    },
    {
      step_order: 6,
      step_type: 'add_tag',
      step_name: 'Tag Winback Attempted',
      step_config: {
        tag: 'winback-2025',
      },
      position_x: 100,
      position_y: 800,
    },
  ],
  triggers: [
    {
      trigger_type: 'scheduled_time',
      trigger_config: {},
      schedule_cron: '0 10 1 * *', // First day of month at 10 AM
      is_active: true,
    },
  ],
};

/**
 * Product Review Request Template
 */
export const REVIEW_REQUEST_TEMPLATE: WorkflowTemplate = {
  id: 'review-request',
  name: 'Product Review Request',
  description: 'Automatically request product reviews after delivery',
  category: 'engagement',
  trigger_type: 'order_completed',
  trigger_config: {},
  difficulty_level: 'beginner',
  estimated_setup_time: 8,
  steps: [
    {
      step_order: 1,
      step_type: 'wait',
      step_name: 'Wait 5 Days',
      step_config: {
        delay_days: 5,
      },
      position_x: 100,
      position_y: 50,
    },
    {
      step_order: 2,
      step_type: 'send_email',
      step_name: 'Review Request',
      step_config: {
        subject: 'How do you like your {{product_name}}? ⭐',
        to: '{{customer_email}}',
        body: `
          <h1>Share your experience!</h1>
          <p>Hi {{customer_name}},</p>
          <p>You've had a few days to try out your {{product_name}}. We'd love to hear what you think!</p>
          <p>Your honest review helps other shoppers make better decisions.</p>
          <a href="{{review_url}}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Write a Review</a>
          <p style="margin-top: 20px; color: #666;">🎁 Earn 100 loyalty points for leaving a review!</p>
        `,
        template_id: 'product-review',
      },
      position_x: 100,
      position_y: 200,
    },
    {
      step_order: 3,
      step_type: 'wait',
      step_name: 'Wait 3 Days',
      step_config: {
        delay_days: 3,
      },
      position_x: 100,
      position_y: 350,
    },
    {
      step_order: 4,
      step_type: 'condition',
      step_name: 'Check if Reviewed',
      step_config: {
        condition: {
          field: 'has_reviewed',
          operator: 'equals',
          value: false,
        },
      },
      position_x: 100,
      position_y: 500,
    },
    {
      step_order: 5,
      step_type: 'send_email',
      step_name: 'Review Reminder',
      step_config: {
        subject: 'Quick reminder: Share your {{product_name}} review',
        to: '{{customer_email}}',
        body: `
          <h1>We're still waiting for your review!</h1>
          <p>Hi {{customer_name}},</p>
          <p>We noticed you haven't reviewed your {{product_name}} yet.</p>
          <p>It only takes 2 minutes and you'll earn 100 loyalty points!</p>
          <a href="{{review_url}}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Leave a Review</a>
        `,
        template_id: 'review-reminder',
      },
      position_x: 100,
      position_y: 650,
    },
  ],
  triggers: [
    {
      trigger_type: 'order_completed',
      trigger_config: {},
      filter_conditions: {},
      is_active: true,
    },
  ],
};

/**
 * All Templates Registry
 */
export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  WELCOME_SERIES_TEMPLATE,
  ABANDONED_CART_TEMPLATE,
  POST_PURCHASE_TEMPLATE,
  BIRTHDAY_TEMPLATE,
  REENGAGEMENT_TEMPLATE,
  REVIEW_REQUEST_TEMPLATE,
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): WorkflowTemplate | undefined {
  return WORKFLOW_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): WorkflowTemplate[] {
  return WORKFLOW_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Get all template categories
 */
export function getTemplateCategories(): string[] {
  return [...new Set(WORKFLOW_TEMPLATES.map((t) => t.category))];
}
