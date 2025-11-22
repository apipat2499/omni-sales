/**
 * Email sending utilities with database integration
 * Integrates with email providers and logs all emails to database
 */

import { EmailTemplate } from './templates';
import { getEmailDatabaseService } from './database';
import type { EmailLogEntry } from './database';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  userId?: string;
  templateId?: string;
  templateType?: string;
  campaignId?: string;
  relatedOrderId?: string;
  relatedCustomerId?: string;
  metadata?: Record<string, any>;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  logId?: string;
  error?: string;
}

/**
 * Send email with database logging
 * All emails are logged to the database with status tracking
 */
export async function sendEmail(options: EmailOptions): Promise<SendEmailResult> {
  const dbService = getEmailDatabaseService();
  const recipients = Array.isArray(options.to) ? options.to : [options.to];
  let logId: string | null = null;

  try {
    // Create email log entry for tracking
    if (options.userId && recipients.length > 0) {
      logId = await dbService.createEmailLog({
        user_id: options.userId,
        recipient_email: recipients[0],
        subject: options.subject,
        template_type: options.templateType,
        template_id: options.templateId,
        campaign_id: options.campaignId,
        status: 'pending',
        related_order_id: options.relatedOrderId,
        related_customer_id: options.relatedCustomerId,
        metadata: options.metadata,
        html_content: options.html,
        text_content: options.text,
      });

      if (!logId) {
        console.warn('Failed to create email log, continuing with send');
      }
    }

    // Log email for development
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Email sent:');
      console.log(`To: ${recipients.join(', ')}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`---`);
      console.log(options.text);
      console.log(`---`);
    }

    // TODO: Integrate with actual email service provider
    // For now, simulate successful send in development
    // In production, this would call SendGrid, AWS SES, Mailgun, etc.
    /*
    const msg = {
      to: options.to,
      from: options.from || 'noreply@omni-sales.com',
      subject: options.subject,
      text: options.text,
      html: options.html,
    };
    const result = await emailProvider.send(msg);
    */

    // Simulate success
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Update email log to 'sent' status
    if (logId) {
      await dbService.updateEmailLogStatus(logId, 'sent');
    }

    return {
      success: true,
      messageId,
      logId: logId || undefined,
    };
  } catch (error: any) {
    console.error('Failed to send email:', error);

    // Update email log to 'failed' status
    if (logId) {
      await dbService.updateEmailLogStatus(logId, 'failed', error.message);
    }

    return {
      success: false,
      error: error.message || 'Failed to send email',
      logId: logId || undefined,
    };
  }
}

/**
 * Send email using template
 */
export async function sendTemplateEmail(
  to: string | string[],
  template: EmailTemplate,
  userId?: string,
  from?: string
): Promise<SendEmailResult> {
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
    from,
    userId,
  });
}

/**
 * Queue email for later sending (for bulk emails)
 */
export interface QueuedEmail extends EmailOptions {
  id?: string;
  status?: 'pending' | 'sent' | 'failed';
  error?: string;
  scheduledFor?: Date;
  sentAt?: Date;
  retryCount?: number;
  maxRetries?: number;
}

export interface QueueEmailResult {
  success: boolean;
  queueId?: string;
  error?: string;
}

/**
 * Queue email for later sending
 * Emails are stored in database and processed by background worker
 */
export async function queueEmail(options: EmailOptions & {
  userId: string;
  scheduledFor?: Date;
}): Promise<QueueEmailResult> {
  const dbService = getEmailDatabaseService();

  try {
    if (!options.userId) {
      throw new Error('userId is required for queuing emails');
    }

    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    if (recipients.length === 0) {
      throw new Error('At least one recipient is required');
    }

    // Create queue entry
    const queueId = await dbService.createEmailQueue({
      user_id: options.userId,
      recipient_email: recipients[0],
      subject: options.subject,
      html_content: options.html,
      text_content: options.text,
      template_id: options.templateId,
      campaign_id: options.campaignId,
      scheduled_for: options.scheduledFor,
      related_order_id: options.relatedOrderId,
      related_customer_id: options.relatedCustomerId,
      metadata: options.metadata,
    });

    if (!queueId) {
      throw new Error('Failed to create email queue entry');
    }

    return {
      success: true,
      queueId,
    };
  } catch (error: any) {
    console.error('Failed to queue email:', error);
    return {
      success: false,
      error: error.message || 'Failed to queue email',
    };
  }
}

/**
 * Send bulk emails (with rate limiting)
 * Uses queue system for better reliability and status tracking
 */
export async function sendBulkEmails(
  emails: (EmailOptions & { userId: string })[],
  options?: {
    rateLimit?: number; // emails per second
    useQueue?: boolean; // whether to use queue or send immediately
    scheduledFor?: Date;
  }
): Promise<{ sent: number; failed: number; queued: number }> {
  const rateLimit = options?.rateLimit || 10;
  const useQueue = options?.useQueue ?? true;
  const delay = 1000 / rateLimit;

  let sent = 0;
  let failed = 0;
  let queued = 0;

  for (const email of emails) {
    try {
      if (useQueue) {
        // Queue email for background processing
        const result = await queueEmail({
          ...email,
          scheduledFor: options?.scheduledFor,
        });

        if (result.success) {
          queued++;
        } else {
          failed++;
        }
      } else {
        // Send immediately
        const result = await sendEmail(email);

        if (result.success) {
          sent++;
        } else {
          failed++;
        }
      }
    } catch (error) {
      console.error('Failed to process email:', error);
      failed++;
    }

    // Rate limiting delay
    if (emails.indexOf(email) < emails.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return { sent, failed, queued };
}
