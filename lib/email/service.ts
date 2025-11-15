import { supabase } from '@/lib/supabase/client';
import { EmailTemplate, EmailLog, EmailQueueItem } from '@/types';

/**
 * Email Service for sending transactional emails
 * Uses Resend (https://resend.com) - modern email API
 *
 * To use:
 * 1. Sign up at https://resend.com
 * 2. Get your API key
 * 3. Add to .env.local: RESEND_API_KEY=your_key
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_API_URL = 'https://api.resend.com/emails';

interface SendEmailOptions {
  from?: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

/**
 * Send email via Resend API
 */
export async function sendEmail(options: SendEmailOptions): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured. Email sending disabled.');
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: options.from || 'noreply@omnisales.app',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        reply_to: options.replyTo,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }

    const data = await response.json();

    return {
      success: true,
      messageId: data.id,
    };
  } catch (error) {
    console.error('Email send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Queue email for sending (asynchronous)
 */
export async function queueEmail(
  userId: string,
  options: {
    recipientEmail: string;
    recipientName?: string;
    templateType?: string;
    subject: string;
    htmlContent: string;
    variables?: Record<string, unknown>;
    relatedOrderId?: string;
    scheduledFor?: Date;
  }
): Promise<EmailQueueItem | null> {
  try {
    const { data, error } = await supabase
      .from('email_queue')
      .insert({
        user_id: userId,
        recipient_email: options.recipientEmail,
        recipient_name: options.recipientName,
        subject: options.subject,
        html_content: options.htmlContent,
        variables: options.variables || {},
        status: 'pending',
        scheduled_for: options.scheduledFor || new Date(),
        related_order_id: options.relatedOrderId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error queuing email:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Queue email error:', error);
    return null;
  }
}

/**
 * Get email template and render with variables
 */
export async function getAndRenderTemplate(
  userId: string,
  templateType: string,
  variables: Record<string, unknown>
): Promise<{ subject: string; html: string } | null> {
  try {
    const { data: template, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('user_id', userId)
      .eq('template_type', templateType)
      .eq('is_active', true)
      .single();

    if (error || !template) {
      console.error(`Template not found: ${templateType}`);
      return null;
    }

    // Replace variables in HTML
    let html = template.html_content;
    let subject = template.subject;

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      const stringValue = String(value);
      html = html.replace(new RegExp(placeholder, 'g'), stringValue);
      subject = subject.replace(new RegExp(placeholder, 'g'), stringValue);
    });

    return {
      subject,
      html,
    };
  } catch (error) {
    console.error('Get template error:', error);
    return null;
  }
}

/**
 * Log email sending attempt
 */
export async function logEmail(
  userId: string,
  options: {
    recipientEmail: string;
    recipientName?: string;
    subject: string;
    templateType?: string;
    status: 'pending' | 'sent' | 'failed';
    providerId?: string;
    relatedOrderId?: string;
    relatedCustomerId?: string;
    errorMessage?: string;
  }
): Promise<EmailLog | null> {
  try {
    const { data, error } = await supabase
      .from('email_logs')
      .insert({
        user_id: userId,
        recipient_email: options.recipientEmail,
        recipient_name: options.recipientName,
        subject: options.subject,
        template_type: options.templateType,
        status: options.status,
        provider: 'resend',
        provider_id: options.providerId,
        related_order_id: options.relatedOrderId,
        related_customer_id: options.relatedCustomerId,
        sent_at: options.status === 'sent' ? new Date() : null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error logging email:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Log email error:', error);
    return null;
  }
}

/**
 * Get email preferences for user
 */
export async function getUserEmailPreferences(userId: string) {
  try {
    const { data, error } = await supabase
      .from('email_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // Return defaults if not found
      return {
        dailySummaryEnabled: true,
        newOrderNotification: true,
        paymentConfirmation: true,
        lowStockAlert: true,
      };
    }

    return data;
  } catch (error) {
    console.error('Get preferences error:', error);
    return null;
  }
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(
  userId: string,
  order: any
): Promise<boolean> {
  try {
    const template = await getAndRenderTemplate(userId, 'order_confirmation', {
      customerName: order.customerName || 'Customer',
      orderId: order.id,
      orderTotal: `฿${Number(order.total || 0).toLocaleString('th-TH', {
        maximumFractionDigits: 2,
      })}`,
      orderDate: new Date(order.createdAt).toLocaleDateString('th-TH'),
    });

    if (!template) {
      console.warn('Order confirmation template not found');
      return false;
    }

    const result = await sendEmail({
      to: order.customerEmail || '',
      subject: template.subject,
      html: template.html,
    });

    if (result.success) {
      await logEmail(userId, {
        recipientEmail: order.customerEmail,
        recipientName: order.customerName,
        subject: template.subject,
        templateType: 'order_confirmation',
        status: 'sent',
        providerId: result.messageId,
        relatedOrderId: order.id,
      });
      return true;
    }

    return false;
  } catch (error) {
    console.error('Send order confirmation error:', error);
    return false;
  }
}

/**
 * Send payment confirmation email
 */
export async function sendPaymentConfirmationEmail(
  userId: string,
  payment: any
): Promise<boolean> {
  try {
    const template = await getAndRenderTemplate(userId, 'payment_receipt', {
      transactionId: payment.id,
      amount: `฿${Number(payment.amountCents / 100).toLocaleString('th-TH', {
        maximumFractionDigits: 2,
      })}`,
      date: new Date(payment.createdAt).toLocaleDateString('th-TH'),
      status: payment.status,
    });

    if (!template) {
      console.warn('Payment receipt template not found');
      return false;
    }

    const result = await sendEmail({
      to: payment.customerEmail || '',
      subject: template.subject,
      html: template.html,
    });

    if (result.success) {
      await logEmail(userId, {
        recipientEmail: payment.customerEmail,
        subject: template.subject,
        templateType: 'payment_receipt',
        status: 'sent',
        providerId: result.messageId,
      });
      return true;
    }

    return false;
  } catch (error) {
    console.error('Send payment confirmation error:', error);
    return false;
  }
}

/**
 * Send low stock alert to shop owner
 */
export async function sendLowStockAlert(
  userId: string,
  userEmail: string,
  product: any,
  currentStock: number,
  threshold: number
): Promise<boolean> {
  try {
    const template = await getAndRenderTemplate(userId, 'low_stock_alert', {
      productName: product.name,
      currentStock: currentStock,
      threshold: threshold,
      sku: product.sku,
    });

    if (!template) {
      console.warn('Low stock alert template not found');
      return false;
    }

    const result = await sendEmail({
      to: userEmail,
      subject: template.subject,
      html: template.html,
    });

    if (result.success) {
      await logEmail(userId, {
        recipientEmail: userEmail,
        subject: template.subject,
        templateType: 'low_stock_alert',
        status: 'sent',
        providerId: result.messageId,
      });
      return true;
    }

    return false;
  } catch (error) {
    console.error('Send low stock alert error:', error);
    return false;
  }
}

/**
 * Process email queue (run periodically via cron job)
 */
export async function processEmailQueue() {
  try {
    // Get pending emails
    const { data: queuedEmails, error } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('scheduled_for', new Date().toISOString())
      .limit(100);

    if (error || !queuedEmails) {
      console.error('Error fetching queued emails:', error);
      return { processed: 0, failed: 0 };
    }

    let processed = 0;
    let failed = 0;

    for (const email of queuedEmails) {
      try {
        const result = await sendEmail({
          to: email.recipient_email,
          subject: email.subject,
          html: email.html_content,
        });

        if (result.success) {
          // Mark as sent
          await supabase
            .from('email_queue')
            .update({
              status: 'sent',
              sent_at: new Date(),
            })
            .eq('id', email.id);

          processed++;
        } else {
          // Update retry count
          const newRetryCount = (email.retry_count || 0) + 1;

          if (newRetryCount >= email.max_retries) {
            await supabase
              .from('email_queue')
              .update({
                status: 'failed',
                error_message: result.error,
              })
              .eq('id', email.id);
            failed++;
          } else {
            await supabase
              .from('email_queue')
              .update({
                retry_count: newRetryCount,
              })
              .eq('id', email.id);
          }
        }
      } catch (err) {
        console.error(`Error processing email ${email.id}:`, err);
        failed++;
      }
    }

    return { processed, failed };
  } catch (error) {
    console.error('Process email queue error:', error);
    return { processed: 0, failed: 0 };
  }
}
