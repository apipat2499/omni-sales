import type { Order } from '@/types';
import { formatCurrency } from '@/lib/utils';

export function getOrderCreatedEmailHTML(order: Order, customerEmail: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .order-details {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .order-item {
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .order-item:last-child {
      border-bottom: none;
    }
    .total {
      font-size: 1.2em;
      font-weight: bold;
      color: #667eea;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 2px solid #667eea;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      color: #6b7280;
      font-size: 0.9em;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Order Confirmed!</h1>
    <p>Thank you for your order</p>
  </div>
  <div class="content">
    <p>Hi <strong>${order.customerName}</strong>,</p>
    <p>Your order has been successfully placed and is being processed.</p>

    <div class="order-details">
      <p><strong>Order ID:</strong> ${order.id.slice(0, 8).toUpperCase()}</p>
      <p><strong>Order Date:</strong> ${order.createdAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}</p>
      <p><strong>Payment Method:</strong> ${order.paymentMethod || 'N/A'}</p>
      ${order.shippingAddress ? `<p><strong>Shipping Address:</strong><br>${order.shippingAddress.replace(/\n/g, '<br>')}</p>` : ''}
    </div>

    <h3>Order Items:</h3>
    ${order.items.map(item => `
      <div class="order-item">
        <strong>${item.productName}</strong><br>
        Quantity: ${item.quantity} × ${formatCurrency(item.price)} = ${formatCurrency(item.quantity * item.price)}
      </div>
    `).join('')}

    <div style="margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 6px;">
      <p style="margin: 5px 0;"><strong>Subtotal:</strong> <span style="float: right;">${formatCurrency(order.subtotal)}</span></p>
      ${order.discountAmount && order.discountAmount > 0 ? `
        <p style="margin: 5px 0; color: #10b981;"><strong>Discount (${order.discountCode}):</strong> <span style="float: right;">-${formatCurrency(order.discountAmount)}</span></p>
      ` : ''}
      <p style="margin: 5px 0;"><strong>Tax:</strong> <span style="float: right;">${formatCurrency(order.tax)}</span></p>
      <p style="margin: 5px 0;"><strong>Shipping:</strong> <span style="float: right;">${formatCurrency(order.shipping)}</span></p>
      <div class="total">
        Total: ${formatCurrency(order.total)}
      </div>
    </div>

    ${order.notes ? `<p style="margin-top: 20px;"><strong>Notes:</strong> ${order.notes}</p>` : ''}

    <p style="margin-top: 30px;">We'll send you another email when your order ships.</p>
  </div>
  <div class="footer">
    <p>Thank you for shopping with us! 🙏</p>
    <p>If you have any questions, please contact us.</p>
  </div>
</body>
</html>
  `.trim();
}

export function getOrderStatusUpdateEmailHTML(
  order: Order,
  customerEmail: string,
  oldStatus: string,
  newStatus: string
): string {
  const statusEmojis: Record<string, string> = {
    pending: '⏳',
    processing: '⚙️',
    shipped: '📦',
    delivered: '✅',
    cancelled: '❌',
  };

  const statusMessages: Record<string, string> = {
    processing: 'Your order is now being processed.',
    shipped: 'Great news! Your order has been shipped and is on its way.',
    delivered: 'Your order has been delivered. We hope you enjoy your purchase!',
    cancelled: 'Your order has been cancelled.',
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Status Update</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .status-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: bold;
      margin: 10px 0;
      font-size: 1.1em;
    }
    .status-processing {
      background: #fef3c7;
      color: #92400e;
    }
    .status-shipped {
      background: #dbeafe;
      color: #1e40af;
    }
    .status-delivered {
      background: #d1fae5;
      color: #065f46;
    }
    .status-cancelled {
      background: #fee2e2;
      color: #991b1b;
    }
    .footer {
      text-align: center;
      color: #6b7280;
      font-size: 0.9em;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${statusEmojis[newStatus]} Order Status Update</h1>
  </div>
  <div class="content">
    <p>Hi <strong>${order.customerName}</strong>,</p>
    <p>${statusMessages[newStatus] || 'Your order status has been updated.'}</p>

    <div style="text-align: center; margin: 30px 0;">
      <div class="status-badge status-${newStatus}">
        ${statusEmojis[newStatus]} ${newStatus.toUpperCase()}
      </div>
    </div>

    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p><strong>Order ID:</strong> ${order.id.slice(0, 8).toUpperCase()}</p>
      <p><strong>Total:</strong> ${formatCurrency(order.total)}</p>
      <p><strong>Items:</strong> ${order.items.length} item(s)</p>
    </div>

    ${newStatus === 'shipped' && order.shippingAddress ? `
      <p><strong>Shipping to:</strong><br>${order.shippingAddress.replace(/\n/g, '<br>')}</p>
    ` : ''}

    ${newStatus === 'delivered' ? `
      <p style="margin-top: 20px;">We hope you're satisfied with your purchase. If you have any issues, please don't hesitate to contact us.</p>
    ` : ''}
  </div>
  <div class="footer">
    <p>Thank you for shopping with us! 🙏</p>
  </div>
</body>
</html>
  `.trim();
}

export function getLowStockEmailHTML(
  productName: string,
  currentStock: number,
  sku: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Low Stock Alert</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .alert-box {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .stock-count {
      font-size: 2em;
      font-weight: bold;
      color: #dc2626;
      text-align: center;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>⚠️ Low Stock Alert</h1>
  </div>
  <div class="content">
    <div class="alert-box">
      <p><strong>Product:</strong> ${productName}</p>
      <p><strong>SKU:</strong> ${sku}</p>
      <div class="stock-count">${currentStock} units remaining</div>
    </div>

    <p>This product is running low on stock. Consider restocking soon to avoid running out.</p>
  </div>
</body>
</html>
  `.trim();
}

export function getOutOfStockEmailHTML(productName: string, sku: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Out of Stock Alert</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .alert-box {
      background: #fee2e2;
      border-left: 4px solid #dc2626;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚨 Out of Stock Alert</h1>
  </div>
  <div class="content">
    <div class="alert-box">
      <p><strong>Product:</strong> ${productName}</p>
      <p><strong>SKU:</strong> ${sku}</p>
      <p style="font-size: 1.2em; font-weight: bold; color: #dc2626; text-align: center; margin: 20px 0;">
        OUT OF STOCK
      </p>
    </div>

    <p>This product is now out of stock. Please restock immediately to resume sales.</p>
  </div>
</body>
</html>
  `.trim();
}
