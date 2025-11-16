import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export interface EmailTemplate {
  name: string;
  subject: string;
  html: string;
  text?: string;
}

// Order confirmation email template
export function orderConfirmationTemplate(
  customerName: string,
  orderNumber: string,
  items: Array<{ name: string; quantity: number; price: number }>,
  total: number
): EmailTemplate {
  const itemsHtml = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px;">${item.name}</td>
      <td style="padding: 10px; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; text-align: right;">$${item.price.toFixed(2)}</td>
    </tr>
  `
    )
    .join("");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Order Confirmation</h2>
      <p>Dear ${customerName},</p>
      <p>Thank you for your order. Your order has been confirmed and is being processed.</p>

      <h3>Order Details</h3>
      <p><strong>Order Number:</strong> ${orderNumber}</p>

      <h3>Items</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f0f0f0;">
            <th style="padding: 10px; text-align: left;">Product</th>
            <th style="padding: 10px; text-align: center;">Quantity</th>
            <th style="padding: 10px; text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <h3 style="text-align: right; margin-top: 20px;">Total: $${total.toFixed(2)}</h3>

      <p>You can track your order status on your account dashboard.</p>
      <p>If you have any questions, please contact our support team.</p>

      <p>Best regards,<br/>The Sales Team</p>
    </div>
  `;

  return {
    name: "order_confirmation",
    subject: `Order Confirmation - #${orderNumber}`,
    html,
  };
}

// Order shipped email template
export function orderShippedTemplate(
  customerName: string,
  orderNumber: string,
  trackingNumber: string,
  carrier: string
): EmailTemplate {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Your Order Has Been Shipped</h2>
      <p>Dear ${customerName},</p>
      <p>Great news! Your order has been shipped and is on its way to you.</p>

      <h3>Shipping Details</h3>
      <p><strong>Order Number:</strong> ${orderNumber}</p>
      <p><strong>Carrier:</strong> ${carrier}</p>
      <p><strong>Tracking Number:</strong> <code>${trackingNumber}</code></p>

      <p>You can track your shipment using the tracking number above on the carrier's website.</p>
      <p>Your order should arrive within the estimated delivery timeframe.</p>

      <p>Thank you for your business!</p>
      <p>Best regards,<br/>The Sales Team</p>
    </div>
  `;

  return {
    name: "order_shipped",
    subject: `Your Order Has Been Shipped - #${orderNumber}`,
    html,
  };
}

// Low stock alert template
export function lowStockAlertTemplate(
  productName: string,
  currentStock: number,
  reorderPoint: number
): EmailTemplate {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Low Stock Alert</h2>
      <p>A product in your inventory has fallen below the reorder point.</p>

      <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Product:</strong> ${productName}</p>
        <p><strong>Current Stock:</strong> ${currentStock} units</p>
        <p><strong>Reorder Point:</strong> ${reorderPoint} units</p>
      </div>

      <p>Please consider placing a reorder to maintain inventory levels.</p>

      <p>Best regards,<br/>Your Sales Management System</p>
    </div>
  `;

  return {
    name: "low_stock_alert",
    subject: `Low Stock Alert: ${productName}`,
    html,
  };
}

// Payment reminder template
export function paymentReminderTemplate(
  customerName: string,
  invoiceNumber: string,
  dueDate: string,
  amount: number
): EmailTemplate {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Payment Reminder</h2>
      <p>Dear ${customerName},</p>
      <p>This is a friendly reminder about an outstanding payment.</p>

      <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
        <p><strong>Amount Due:</strong> $${amount.toFixed(2)}</p>
        <p><strong>Due Date:</strong> ${dueDate}</p>
      </div>

      <p>Please process your payment at your earliest convenience. If payment has already been made, please disregard this message.</p>
      <p>If you have any questions, please contact our billing department.</p>

      <p>Best regards,<br/>The Billing Team</p>
    </div>
  `;

  return {
    name: "payment_reminder",
    subject: `Payment Reminder - Invoice #${invoiceNumber}`,
    html,
  };
}

// Send email function
export async function sendEmail(
  to: string,
  template: EmailTemplate,
  cc?: string[],
  bcc?: string[]
) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@omni-sales.com",
      to,
      subject: template.subject,
      html: template.html,
      cc: cc || [],
      bcc: bcc || [],
    };

    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Email sending error:", error);
    throw error;
  }
}

// Bulk send emails
export async function sendBulkEmails(
  recipients: string[],
  template: EmailTemplate
) {
  try {
    const results = await Promise.all(
      recipients.map((email) => sendEmail(email, template))
    );

    return {
      success: true,
      sent: results.length,
      results,
    };
  } catch (error) {
    console.error("Bulk email sending error:", error);
    throw error;
  }
}

// Send custom email
export async function sendCustomEmail(
  to: string,
  subject: string,
  html: string,
  cc?: string[]
) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@omni-sales.com",
      to,
      subject,
      html,
      cc: cc || [],
    };

    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Email sending error:", error);
    throw error;
  }
}

// Verify email configuration
export async function verifyEmailConfig() {
  try {
    await transporter.verify();
    return { success: true, message: "Email configuration is valid" };
  } catch (error) {
    console.error("Email configuration error:", error);
    throw error;
  }
}

// Email Campaign Functions
export async function createEmailCampaign(
  userId: string,
  campaignData: any
): Promise<any> {
  try {
    // This would typically use Supabase to store campaign data
    return {
      id: `campaign_${Date.now()}`,
      ...campaignData,
      createdAt: new Date().toISOString(),
      status: 'draft',
    };
  } catch (error) {
    console.error('Error creating email campaign:', error);
    throw error;
  }
}

export async function getEmailCampaigns(userId: string): Promise<any[]> {
  try {
    // This would typically fetch campaigns from Supabase
    return [];
  } catch (error) {
    console.error('Error fetching email campaigns:', error);
    return [];
  }
}

export default transporter;
