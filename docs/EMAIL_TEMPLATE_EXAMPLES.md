# Email Template Examples

Professional email templates ready to use in your system.

## Template Variables Reference

Common variables you can use in all templates:

### Customer Variables
- `{{customer_name}}` - Customer's full name
- `{{customer_email}}` - Customer's email address
- `{{customer_phone}}` - Customer's phone number

### Order Variables
- `{{order_id}}` - Order number/ID
- `{{order_date}}` - Order date
- `{{order_status}}` - Order status
- `{{total_amount}}` - Order total amount
- `{{currency_symbol}}` - Currency symbol ($, €, ฿, etc.)
- `{{order_tracking_url}}` - Link to track order

### Shipping Variables
- `{{carrier_name}}` - Shipping carrier name
- `{{tracking_number}}` - Tracking number
- `{{tracking_url}}` - Tracking URL
- `{{estimated_delivery_date}}` - Estimated delivery date
- `{{delivery_date}}` - Actual delivery date
- `{{shipping_address}}` - Full shipping address

### Payment Variables
- `{{payment_method}}` - Payment method used
- `{{payment_date}}` - Payment date
- `{{transaction_id}}` - Transaction/payment ID
- `{{amount_paid}}` - Amount paid

### Cart Variables
- `{{cart_items}}` - List of cart items
- `{{cart_total}}` - Cart total amount
- `{{cart_url}}` - Link to cart

### Promotional Variables
- `{{promotion_title}}` - Promotion title
- `{{promotion_description}}` - Promotion description
- `{{discount_amount}}` - Discount amount/percentage
- `{{promo_code}}` - Promotional code
- `{{expiry_date}}` - Promotion expiry date
- `{{shop_url}}` - Link to shop

### Company Variables
- `{{company_name}}` - Your company name
- `{{company_address}}` - Company address
- `{{company_phone}}` - Company phone
- `{{company_email}}` - Company email
- `{{support_url}}` - Customer support URL
- `{{unsubscribe_url}}` - Unsubscribe link

## Example Templates

### 1. Order Confirmation

**Subject:** Order Confirmation - Order #{{order_id}}

**HTML Content:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { padding: 30px; background: #f9fafb; }
    .order-box { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .button { display: inline-block; padding: 12px 30px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
    .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .total { font-size: 18px; font-weight: bold; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">✅ Order Confirmed!</h1>
    </div>
    <div class="content">
      <h2>Thank you, {{customer_name}}!</h2>
      <p>We've received your order and we're getting it ready for you.</p>

      <div class="order-box">
        <h3 style="margin-top: 0;">Order Details</h3>
        <div class="item">
          <span><strong>Order Number:</strong></span>
          <span>#{{order_id}}</span>
        </div>
        <div class="item">
          <span><strong>Order Date:</strong></span>
          <span>{{order_date}}</span>
        </div>
        <div class="item">
          <span><strong>Status:</strong></span>
          <span>{{order_status}}</span>
        </div>
        <div class="total">
          Total: {{currency_symbol}}{{total_amount}}
        </div>
      </div>

      <center>
        <a href="{{order_tracking_url}}" class="button">Track Your Order</a>
      </center>

      <p style="margin-top: 30px;">We'll send you another email when your order ships with tracking information.</p>

      <p>If you have any questions, feel free to <a href="{{support_url}}">contact our support team</a>.</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 {{company_name}}. All rights reserved.</p>
      <p>{{company_address}}</p>
      <p>Questions? Email us at {{company_email}}</p>
    </div>
  </div>
</body>
</html>
```

### 2. Abandoned Cart Reminder

**Subject:** Don't forget! Your cart is waiting

**HTML Content:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f3f4f6; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .content { padding: 40px 30px; }
    .cart-icon { font-size: 60px; text-align: center; margin: 20px 0; }
    .product-box { background: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
    .button { display: inline-block; padding: 15px 40px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
    .urgency { background: #fef3c7; border: 2px dashed #f59e0b; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center; }
    .footer { background: #1f2937; color: white; padding: 30px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="cart-icon">🛒</div>
      <h1 style="margin: 0;">You Left Something Behind!</h1>
    </div>
    <div class="content">
      <h2>Hi {{customer_name}},</h2>
      <p>We noticed you didn't complete your purchase. Good news - your items are still in your cart and ready whenever you are!</p>

      <div class="product-box">
        <h3 style="margin-top: 0;">Your Cart Items</h3>
        {{cart_items}}
        <hr style="margin: 15px 0; border: none; border-top: 1px solid #e5e7eb;">
        <div style="font-size: 20px; font-weight: bold; text-align: right;">
          Total: {{currency_symbol}}{{cart_total}}
        </div>
      </div>

      <center>
        <a href="{{cart_url}}" class="button">Complete Your Purchase</a>
      </center>

      <div class="urgency">
        <strong>⏰ Limited Time!</strong><br>
        Items in your cart are selling fast. Complete your order now before they're gone!
      </div>

      <p style="text-align: center; color: #6b7280; margin-top: 30px;">
        Need help? Our support team is here for you!<br>
        <a href="{{support_url}}" style="color: #667eea;">Contact Support</a>
      </p>
    </div>
    <div class="footer">
      <p>&copy; 2025 {{company_name}}</p>
      <p style="font-size: 12px; margin-top: 10px;">
        <a href="{{unsubscribe_url}}" style="color: #9ca3af;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>
```

### 3. Shipment Notification

**Subject:** Your Order #{{order_id}} Has Shipped! 📦

**HTML Content:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { padding: 30px; background: #f0fdf4; }
    .tracking-box { background: white; padding: 25px; margin: 20px 0; border-radius: 8px; border-left: 5px solid #10b981; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .button { display: inline-block; padding: 15px 35px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; font-weight: bold; }
    .timeline { margin: 30px 0; }
    .timeline-item { padding: 15px; margin: 10px 0; background: white; border-radius: 5px; display: flex; align-items: center; }
    .timeline-icon { width: 40px; height: 40px; background: #10b981; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-weight: bold; }
    .footer { text-align: center; padding: 20px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 32px;">📦 Your Order is on the Way!</h1>
    </div>
    <div class="content">
      <h2>Good news, {{customer_name}}!</h2>
      <p style="font-size: 16px;">Your order has been shipped and is on its way to you.</p>

      <div class="tracking-box">
        <h3 style="margin-top: 0; color: #10b981;">Shipping Information</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;"><strong>Order Number:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">#{{order_id}}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;"><strong>Carrier:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{carrier_name}}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;"><strong>Tracking Number:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-family: monospace;">{{tracking_number}}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0;"><strong>Estimated Delivery:</strong></td>
            <td style="padding: 10px 0; text-align: right; color: #10b981; font-weight: bold;">{{estimated_delivery_date}}</td>
          </tr>
        </table>
      </div>

      <center>
        <a href="{{tracking_url}}" class="button">Track Your Package</a>
      </center>

      <div class="timeline">
        <h3>What Happens Next?</h3>
        <div class="timeline-item">
          <div class="timeline-icon">1</div>
          <div>
            <strong>Package Picked Up</strong><br>
            <span style="color: #6b7280; font-size: 14px;">Your package has left our warehouse</span>
          </div>
        </div>
        <div class="timeline-item">
          <div class="timeline-icon">2</div>
          <div>
            <strong>In Transit</strong><br>
            <span style="color: #6b7280; font-size: 14px;">On its way to you</span>
          </div>
        </div>
        <div class="timeline-item">
          <div class="timeline-icon">3</div>
          <div>
            <strong>Out for Delivery</strong><br>
            <span style="color: #6b7280; font-size: 14px;">Final delivery day</span>
          </div>
        </div>
        <div class="timeline-item">
          <div class="timeline-icon">4</div>
          <div>
            <strong>Delivered!</strong><br>
            <span style="color: #6b7280; font-size: 14px;">Enjoy your purchase</span>
          </div>
        </div>
      </div>

      <p style="margin-top: 30px;">We'll notify you again when your package is delivered.</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 {{company_name}}. All rights reserved.</p>
      <p>Questions? <a href="{{support_url}}">Contact Support</a></p>
    </div>
  </div>
</body>
</html>
```

### 4. Review Request

**Subject:** How was your experience? Share your feedback

**HTML Content:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 40px; text-align: center; }
    .content { padding: 40px 30px; }
    .rating-section { background: #fef3f9; padding: 30px; margin: 30px 0; border-radius: 10px; text-align: center; }
    .stars { font-size: 50px; margin: 20px 0; letter-spacing: 5px; }
    .star-button { text-decoration: none; }
    .button { display: inline-block; padding: 15px 40px; background: #f5576c; color: white; text-decoration: none; border-radius: 25px; margin: 20px 0; font-weight: bold; font-size: 16px; }
    .benefit-box { background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 5px; }
    .footer { background: #f9fafb; padding: 30px; text-align: center; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 36px;">We'd Love Your Feedback!</h1>
      <p style="margin: 10px 0 0 0; font-size: 18px;">Help us serve you better</p>
    </div>
    <div class="content">
      <h2>Hi {{customer_name}},</h2>
      <p style="font-size: 16px;">Thank you for your recent purchase! We hope you're loving your new items.</p>

      <div class="rating-section">
        <h3 style="margin-top: 0;">How would you rate your experience?</h3>
        <div class="stars">
          <a href="{{review_url}}&rating=5" class="star-button">⭐</a>
          <a href="{{review_url}}&rating=5" class="star-button">⭐</a>
          <a href="{{review_url}}&rating=5" class="star-button">⭐</a>
          <a href="{{review_url}}&rating=5" class="star-button">⭐</a>
          <a href="{{review_url}}&rating=5" class="star-button">⭐</a>
        </div>
        <p style="color: #6b7280; margin-top: 10px;">Click a star to rate us</p>
        <a href="{{review_url}}" class="button">Write a Review</a>
      </div>

      <div class="benefit-box">
        <strong>🎁 Special Offer!</strong><br>
        Leave a review and get 10% off your next purchase!
      </div>

      <h3>Your feedback helps us:</h3>
      <ul style="line-height: 2;">
        <li>Improve our products and services</li>
        <li>Help other customers make informed decisions</li>
        <li>Show appreciation for your business</li>
      </ul>

      <p style="margin-top: 30px; text-align: center; color: #6b7280;">
        It only takes 2 minutes and means the world to us!
      </p>
    </div>
    <div class="footer">
      <p>&copy; 2025 {{company_name}}</p>
      <p style="margin-top: 10px; font-size: 14px;">
        {{company_address}}
      </p>
      <p style="margin-top: 15px; font-size: 12px;">
        <a href="{{unsubscribe_url}}" style="color: #9ca3af;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>
```

## Plain Text Versions

Always include plain text versions of your emails:

### Order Confirmation (Plain Text)
```
Order Confirmation - Order #{{order_id}}

Thank you for your order, {{customer_name}}!

We've received your order and we're getting it ready for you.

ORDER DETAILS
Order Number: #{{order_id}}
Order Date: {{order_date}}
Status: {{order_status}}
Total: {{currency_symbol}}{{total_amount}}

Track your order: {{order_tracking_url}}

We'll send you another email when your order ships.

Questions? Contact us: {{company_email}}

© 2025 {{company_name}}
{{company_address}}
```

## Best Practices

1. **Keep It Simple**: Use clean, responsive design
2. **Mobile-First**: Test on mobile devices
3. **Clear CTAs**: One primary call-to-action button
4. **Brand Consistency**: Use your brand colors and logo
5. **Personalization**: Use customer name and order details
6. **Test Variables**: Always test with sample data
7. **Plain Text**: Include plain text version
8. **Unsubscribe**: Include unsubscribe link in marketing emails
9. **Accessibility**: Use alt text for images
10. **Legal Compliance**: Include company address

## Testing

Test your templates with sample data:

```javascript
const testVariables = {
  customer_name: 'John Doe',
  order_id: '12345',
  order_date: 'January 15, 2025',
  total_amount: '99.99',
  currency_symbol: '$',
  company_name: 'Your Store',
  company_address: '123 Main St, City, Country'
};
```
