export const DEFAULT_EMAIL_TEMPLATES = {
  ORDER_CONFIRMATION: {
    name: 'order_confirmation',
    subject: 'Order Confirmation - Order #{{order_id}}',
    category: 'transactional',
    html_content: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .order-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmation</h1>
          </div>
          <div class="content">
            <h2>Thank you for your order, {{customer_name}}!</h2>
            <p>Your order has been confirmed and will be shipped soon.</p>

            <div class="order-details">
              <h3>Order Details</h3>
              <p><strong>Order ID:</strong> #{{order_id}}</p>
              <p><strong>Order Date:</strong> {{order_date}}</p>
              <p><strong>Total Amount:</strong> {{currency_symbol}}{{total_amount}}</p>
            </div>

            <a href="{{order_tracking_url}}" class="button">Track Your Order</a>

            <p>We'll send you another email when your order ships.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 {{company_name}}. All rights reserved.</p>
            <p>{{company_address}}</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text_content: `
Thank you for your order, {{customer_name}}!

Your order has been confirmed and will be shipped soon.

Order Details:
- Order ID: #{{order_id}}
- Order Date: {{order_date}}
- Total Amount: {{currency_symbol}}{{total_amount}}

Track your order: {{order_tracking_url}}

We'll send you another email when your order ships.

© 2025 {{company_name}}. All rights reserved.
    `,
  },

  SHIPMENT_NOTIFICATION: {
    name: 'shipment_notification',
    subject: 'Your Order #{{order_id}} Has Shipped!',
    category: 'transactional',
    html_content: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10B981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .tracking-info { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #10B981; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 12px 24px; background: #10B981; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📦 Your Order Has Shipped!</h1>
          </div>
          <div class="content">
            <h2>Good news, {{customer_name}}!</h2>
            <p>Your order #{{order_id}} is on its way!</p>

            <div class="tracking-info">
              <h3>Shipping Information</h3>
              <p><strong>Carrier:</strong> {{carrier_name}}</p>
              <p><strong>Tracking Number:</strong> {{tracking_number}}</p>
              <p><strong>Estimated Delivery:</strong> {{estimated_delivery_date}}</p>
            </div>

            <a href="{{tracking_url}}" class="button">Track Shipment</a>
          </div>
          <div class="footer">
            <p>&copy; 2025 {{company_name}}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  },

  DELIVERY_NOTIFICATION: {
    name: 'delivery_notification',
    subject: 'Order #{{order_id}} Delivered',
    category: 'transactional',
    html_content: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .success-box { background: white; padding: 20px; margin: 15px 0; border-radius: 5px; text-align: center; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 12px 24px; background: #059669; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Delivery Confirmed</h1>
          </div>
          <div class="content">
            <div class="success-box">
              <h2>Your order has been delivered!</h2>
              <p>We hope you enjoy your purchase, {{customer_name}}!</p>
            </div>

            <p><strong>Order ID:</strong> #{{order_id}}</p>
            <p><strong>Delivered on:</strong> {{delivery_date}}</p>

            <a href="{{review_url}}" class="button">Leave a Review</a>

            <p style="margin-top: 20px;">If you have any questions or concerns, please don't hesitate to contact us.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 {{company_name}}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  },

  PAYMENT_RECEIPT: {
    name: 'payment_receipt',
    subject: 'Payment Receipt - Order #{{order_id}}',
    category: 'transactional',
    html_content: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6366F1; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .receipt { background: white; padding: 20px; margin: 15px 0; border-radius: 5px; }
          .total { font-size: 18px; font-weight: bold; margin-top: 15px; padding-top: 15px; border-top: 2px solid #ddd; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Receipt</h1>
          </div>
          <div class="content">
            <h2>Thank you for your payment, {{customer_name}}</h2>

            <div class="receipt">
              <h3>Payment Details</h3>
              <p><strong>Order ID:</strong> #{{order_id}}</p>
              <p><strong>Payment Date:</strong> {{payment_date}}</p>
              <p><strong>Payment Method:</strong> {{payment_method}}</p>
              <p><strong>Transaction ID:</strong> {{transaction_id}}</p>

              <div class="total">
                <p>Amount Paid: {{currency_symbol}}{{amount_paid}}</p>
              </div>
            </div>

            <p>This receipt serves as confirmation of your payment.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 {{company_name}}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  },

  ABANDONED_CART: {
    name: 'abandoned_cart_reminder',
    subject: 'You left something in your cart, {{customer_name}}',
    category: 'marketing',
    html_content: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #F59E0B; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .cart-items { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 12px 24px; background: #F59E0B; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛒 Don't Forget Your Cart!</h1>
          </div>
          <div class="content">
            <h2>Hi {{customer_name}},</h2>
            <p>We noticed you left some items in your cart. They're still waiting for you!</p>

            <div class="cart-items">
              <h3>Your Cart</h3>
              <p>{{cart_items}}</p>
              <p><strong>Total:</strong> {{currency_symbol}}{{cart_total}}</p>
            </div>

            <a href="{{cart_url}}" class="button">Complete Your Purchase</a>

            <p>Hurry! Items in your cart are selling fast.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 {{company_name}}. All rights reserved.</p>
            <p><a href="{{unsubscribe_url}}">Unsubscribe</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
  },

  FEEDBACK_REQUEST: {
    name: 'customer_feedback_request',
    subject: 'How was your experience with order #{{order_id}}?',
    category: 'marketing',
    html_content: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8B5CF6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; text-align: center; }
          .rating { background: white; padding: 30px; margin: 15px 0; border-radius: 5px; }
          .stars { font-size: 40px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 12px 24px; background: #8B5CF6; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>We'd Love Your Feedback!</h1>
          </div>
          <div class="content">
            <h2>Hi {{customer_name}},</h2>
            <p>Thank you for your recent purchase!</p>

            <div class="rating">
              <h3>How would you rate your experience?</h3>
              <div class="stars">⭐⭐⭐⭐⭐</div>
              <a href="{{review_url}}" class="button">Leave a Review</a>
            </div>

            <p>Your feedback helps us improve and serve you better.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 {{company_name}}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  },

  PROMOTIONAL_CAMPAIGN: {
    name: 'promotional_campaign',
    subject: '{{promotion_title}} - Special Offer Just For You!',
    category: 'marketing',
    html_content: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #EC4899; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .promo-box { background: white; padding: 30px; margin: 15px 0; border-radius: 5px; text-align: center; border: 3px dashed #EC4899; }
          .discount { font-size: 48px; font-weight: bold; color: #EC4899; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 15px 30px; background: #EC4899; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; font-size: 18px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 {{promotion_title}}</h1>
          </div>
          <div class="content">
            <h2>Hi {{customer_name}},</h2>
            <p>{{promotion_description}}</p>

            <div class="promo-box">
              <h3>Your Exclusive Discount</h3>
              <div class="discount">{{discount_amount}}% OFF</div>
              <p><strong>Code:</strong> {{promo_code}}</p>
              <p><strong>Valid until:</strong> {{expiry_date}}</p>

              <a href="{{shop_url}}" class="button">Shop Now</a>
            </div>

            <p>Don't miss out on this limited-time offer!</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 {{company_name}}. All rights reserved.</p>
            <p><a href="{{unsubscribe_url}}">Unsubscribe</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
  },
};
