/**
 * Email Service - SendGrid Integration
 *
 * Comprehensive email service with SendGrid integration,
 * template management, queuing, delivery tracking, and retry logic.
 */

import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Type Definitions
// ============================================================================

export type EmailStatus = 'pending' | 'sending' | 'sent' | 'failed' | 'bounced' | 'opened' | 'clicked';

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType: string;
  disposition?: 'attachment' | 'inline';
  contentId?: string;
}

export interface EmailMessage {
  id: string;
  to: string | string[];
  cc?: string[];
  bcc?: string[];
  from?: string;
  replyTo?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;

  templateId?: string;
  templateVariables?: Record<string, any>;

  attachments?: EmailAttachment[];

  status: EmailStatus;
  sentAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  failureReason?: string;
  retryCount: number;
  maxRetries: number;

  metadata?: {
    orderId?: string;
    customerId?: string;
    type: string;
    tags?: string[];
  };

  priority: 'low' | 'normal' | 'high';
  scheduledFor?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export interface EmailConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
  replyToEmail?: string;
  enabled: boolean;
  maxRetries: number;
  retryDelay: number;
  batchSize: number;
}

export interface SendGridResponse {
  statusCode: number;
  body?: any;
  headers?: any;
}

export interface EmailStats {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  bounced: number;
  opened: number;
  clicked: number;
  openRate: number;
  clickRate: number;
}

// ============================================================================
// Constants
// ============================================================================

const EMAIL_STORAGE_KEY = 'email_messages';
const EMAIL_CONFIG_KEY = 'email_config';
const SENDGRID_API_URL = 'https://api.sendgrid.com/v3/mail/send';

// Default configuration
const DEFAULT_CONFIG: EmailConfig = {
  apiKey: process.env.NEXT_PUBLIC_SENDGRID_API_KEY || '',
  fromEmail: process.env.NEXT_PUBLIC_FROM_EMAIL || 'noreply@omnisales.com',
  fromName: process.env.NEXT_PUBLIC_FROM_NAME || 'OmniSales',
  replyToEmail: process.env.NEXT_PUBLIC_REPLY_TO_EMAIL || '',
  enabled: true,
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
  batchSize: 10,
};

// ============================================================================
// Storage Functions
// ============================================================================

/**
 * Get all email messages from storage
 */
export function getAllEmails(): EmailMessage[] {
  try {
    const stored = localStorage.getItem(EMAIL_STORAGE_KEY);
    if (!stored) return [];

    const emails = JSON.parse(stored) as EmailMessage[];
    return emails.map(email => ({
      ...email,
      createdAt: new Date(email.createdAt),
      updatedAt: new Date(email.updatedAt),
      sentAt: email.sentAt ? new Date(email.sentAt) : undefined,
      openedAt: email.openedAt ? new Date(email.openedAt) : undefined,
      clickedAt: email.clickedAt ? new Date(email.clickedAt) : undefined,
      scheduledFor: email.scheduledFor ? new Date(email.scheduledFor) : undefined,
    }));
  } catch (error) {
    console.error('Error loading emails:', error);
    return [];
  }
}

/**
 * Save email to storage
 */
export function saveEmail(email: EmailMessage): void {
  try {
    const emails = getAllEmails();
    const index = emails.findIndex(e => e.id === email.id);

    if (index >= 0) {
      emails[index] = email;
    } else {
      emails.push(email);
    }

    // Keep last 1000 emails
    if (emails.length > 1000) {
      emails.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      emails.splice(1000);
    }

    localStorage.setItem(EMAIL_STORAGE_KEY, JSON.stringify(emails));
  } catch (error) {
    console.error('Error saving email:', error);
  }
}

/**
 * Get email by ID
 */
export function getEmailById(id: string): EmailMessage | null {
  const emails = getAllEmails();
  return emails.find(e => e.id === id) || null;
}

/**
 * Delete email
 */
export function deleteEmail(id: string): boolean {
  try {
    const emails = getAllEmails();
    const filtered = emails.filter(e => e.id !== id);

    if (filtered.length === emails.length) {
      return false;
    }

    localStorage.setItem(EMAIL_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting email:', error);
    return false;
  }
}

/**
 * Get emails by status
 */
export function getEmailsByStatus(status: EmailStatus): EmailMessage[] {
  return getAllEmails().filter(e => e.status === status);
}

/**
 * Get emails by type
 */
export function getEmailsByType(type: string): EmailMessage[] {
  return getAllEmails().filter(e => e.metadata?.type === type);
}

// ============================================================================
// Configuration Functions
// ============================================================================

/**
 * Get email configuration
 */
export function getEmailConfig(): EmailConfig {
  try {
    const stored = localStorage.getItem(EMAIL_CONFIG_KEY);
    if (!stored) return DEFAULT_CONFIG;

    return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
  } catch (error) {
    console.error('Error loading email config:', error);
    return DEFAULT_CONFIG;
  }
}

/**
 * Save email configuration
 */
export function saveEmailConfig(config: Partial<EmailConfig>): void {
  try {
    const current = getEmailConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(EMAIL_CONFIG_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving email config:', error);
  }
}

// ============================================================================
// Email Creation Functions
// ============================================================================

/**
 * Create a new email message
 */
export function createEmail(
  params: Omit<EmailMessage, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'retryCount' | 'maxRetries' | 'priority'> & {
    priority?: 'low' | 'normal' | 'high';
    maxRetries?: number;
  }
): EmailMessage {
  const config = getEmailConfig();
  const now = new Date();

  const email: EmailMessage = {
    ...params,
    id: uuidv4(),
    status: 'pending',
    retryCount: 0,
    maxRetries: params.maxRetries ?? config.maxRetries,
    priority: params.priority ?? 'normal',
    createdAt: now,
    updatedAt: now,
  };

  saveEmail(email);
  return email;
}

/**
 * Create email from template
 */
export function createEmailFromTemplate(
  templateId: string,
  to: string | string[],
  variables: Record<string, any>,
  options?: {
    subject?: string;
    cc?: string[];
    bcc?: string[];
    attachments?: EmailAttachment[];
    metadata?: EmailMessage['metadata'];
    priority?: 'low' | 'normal' | 'high';
    scheduledFor?: Date;
  }
): EmailMessage {
  return createEmail({
    to,
    cc: options?.cc,
    bcc: options?.bcc,
    subject: options?.subject || '',
    htmlContent: '', // Will be filled by template rendering
    templateId,
    templateVariables: variables,
    attachments: options?.attachments,
    metadata: options?.metadata,
    priority: options?.priority,
    scheduledFor: options?.scheduledFor,
  });
}

// ============================================================================
// SendGrid API Functions
// ============================================================================

/**
 * Build SendGrid API request body
 */
function buildSendGridRequest(email: EmailMessage, config: EmailConfig): any {
  const toArray = Array.isArray(email.to) ? email.to : [email.to];

  const request: any = {
    personalizations: [
      {
        to: toArray.map(address => ({ email: address })),
        subject: email.subject,
      },
    ],
    from: {
      email: email.from || config.fromEmail,
      name: config.fromName,
    },
    content: [
      {
        type: 'text/html',
        value: email.htmlContent,
      },
    ],
  };

  // Add CC
  if (email.cc && email.cc.length > 0) {
    request.personalizations[0].cc = email.cc.map(address => ({ email: address }));
  }

  // Add BCC
  if (email.bcc && email.bcc.length > 0) {
    request.personalizations[0].bcc = email.bcc.map(address => ({ email: address }));
  }

  // Add text content
  if (email.textContent) {
    request.content.push({
      type: 'text/plain',
      value: email.textContent,
    });
  }

  // Add reply-to
  if (email.replyTo || config.replyToEmail) {
    request.reply_to = {
      email: email.replyTo || config.replyToEmail,
    };
  }

  // Add attachments
  if (email.attachments && email.attachments.length > 0) {
    request.attachments = email.attachments.map(att => ({
      content: typeof att.content === 'string' ? att.content : att.content.toString('base64'),
      filename: att.filename,
      type: att.contentType,
      disposition: att.disposition || 'attachment',
      content_id: att.contentId,
    }));
  }

  // Add tracking settings
  request.tracking_settings = {
    click_tracking: { enable: true },
    open_tracking: { enable: true },
  };

  // Add custom args for tracking
  if (email.metadata) {
    request.custom_args = {
      email_id: email.id,
      ...email.metadata,
    };
  }

  return request;
}

/**
 * Send email via SendGrid API
 */
async function sendViaSendGrid(email: EmailMessage, config: EmailConfig): Promise<SendGridResponse> {
  const request = buildSendGridRequest(email, config);

  try {
    const response = await fetch(SENDGRID_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const result: SendGridResponse = {
      statusCode: response.status,
      headers: Object.fromEntries(response.headers.entries()),
    };

    if (!response.ok) {
      result.body = await response.json().catch(() => ({}));
    }

    return result;
  } catch (error: any) {
    throw new Error(`SendGrid API error: ${error.message}`);
  }
}

// ============================================================================
// Email Sending Functions
// ============================================================================

/**
 * Send a single email
 */
export async function sendEmail(emailId: string): Promise<boolean> {
  const email = getEmailById(emailId);
  if (!email) {
    throw new Error(`Email ${emailId} not found`);
  }

  const config = getEmailConfig();

  if (!config.enabled) {
    throw new Error('Email service is disabled');
  }

  if (!config.apiKey) {
    throw new Error('SendGrid API key not configured');
  }

  // Check if scheduled
  if (email.scheduledFor && email.scheduledFor > new Date()) {
    throw new Error('Email is scheduled for future delivery');
  }

  // Update status to sending
  email.status = 'sending';
  email.updatedAt = new Date();
  saveEmail(email);

  try {
    const response = await sendViaSendGrid(email, config);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      // Success
      email.status = 'sent';
      email.sentAt = new Date();
      email.updatedAt = new Date();
      saveEmail(email);
      return true;
    } else {
      // Failed
      throw new Error(`SendGrid returned status ${response.statusCode}: ${JSON.stringify(response.body)}`);
    }
  } catch (error: any) {
    email.status = 'failed';
    email.failureReason = error.message;
    email.retryCount += 1;
    email.updatedAt = new Date();
    saveEmail(email);

    // Schedule retry if not exceeded max retries
    if (email.retryCount < email.maxRetries) {
      setTimeout(() => {
        retryEmail(emailId).catch(console.error);
      }, config.retryDelay * Math.pow(2, email.retryCount - 1)); // Exponential backoff
    }

    return false;
  }
}

/**
 * Retry sending a failed email
 */
export async function retryEmail(emailId: string): Promise<boolean> {
  const email = getEmailById(emailId);
  if (!email) {
    throw new Error(`Email ${emailId} not found`);
  }

  if (email.retryCount >= email.maxRetries) {
    throw new Error('Maximum retry attempts exceeded');
  }

  return sendEmail(emailId);
}

/**
 * Send bulk emails
 */
export async function sendBulkEmails(emailIds: string[]): Promise<{ sent: number; failed: number }> {
  const config = getEmailConfig();
  let sent = 0;
  let failed = 0;

  // Process in batches
  for (let i = 0; i < emailIds.length; i += config.batchSize) {
    const batch = emailIds.slice(i, i + config.batchSize);

    const results = await Promise.allSettled(
      batch.map(id => sendEmail(id))
    );

    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        sent++;
      } else {
        failed++;
      }
    });

    // Rate limiting: wait between batches
    if (i + config.batchSize < emailIds.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return { sent, failed };
}

/**
 * Process email queue
 */
export async function processEmailQueue(): Promise<{ sent: number; failed: number }> {
  const pending = getEmailsByStatus('pending').filter(email => {
    // Check if scheduled for future
    if (email.scheduledFor && email.scheduledFor > new Date()) {
      return false;
    }
    return true;
  });

  const emailIds = pending
    .sort((a, b) => {
      // Sort by priority first
      const priorityMap = { high: 3, normal: 2, low: 1 };
      const priorityDiff = priorityMap[b.priority] - priorityMap[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by creation time
      return a.createdAt.getTime() - b.createdAt.getTime();
    })
    .map(e => e.id);

  return sendBulkEmails(emailIds);
}

/**
 * Process scheduled emails
 */
export async function processScheduledEmails(): Promise<{ sent: number; failed: number }> {
  const now = new Date();
  const scheduled = getAllEmails().filter(email =>
    email.status === 'pending' &&
    email.scheduledFor &&
    email.scheduledFor <= now
  );

  const emailIds = scheduled.map(e => e.id);
  return sendBulkEmails(emailIds);
}

// ============================================================================
// Webhook Handling
// ============================================================================

export interface SendGridWebhookEvent {
  email: string;
  timestamp: number;
  event: 'processed' | 'dropped' | 'delivered' | 'bounce' | 'open' | 'click' | 'spamreport' | 'unsubscribe';
  email_id?: string;
  [key: string]: any;
}

/**
 * Handle SendGrid webhook events
 */
export function handleWebhookEvent(event: SendGridWebhookEvent): void {
  const emailId = event.email_id;
  if (!emailId) return;

  const email = getEmailById(emailId);
  if (!email) return;

  const now = new Date(event.timestamp * 1000);

  switch (event.event) {
    case 'delivered':
      if (email.status !== 'sent') {
        email.status = 'sent';
        email.sentAt = now;
      }
      break;

    case 'bounce':
      email.status = 'bounced';
      email.failureReason = event.reason || 'Email bounced';
      break;

    case 'open':
      email.status = 'opened';
      email.openedAt = now;
      break;

    case 'click':
      email.status = 'clicked';
      email.clickedAt = now;
      break;

    case 'dropped':
      email.status = 'failed';
      email.failureReason = event.reason || 'Email dropped';
      break;
  }

  email.updatedAt = now;
  saveEmail(email);
}

// ============================================================================
// Statistics Functions
// ============================================================================

/**
 * Get email statistics
 */
export function getEmailStats(filters?: {
  type?: string;
  dateFrom?: Date;
  dateTo?: Date;
}): EmailStats {
  let emails = getAllEmails();

  if (filters?.type) {
    emails = emails.filter(e => e.metadata?.type === filters.type);
  }

  if (filters?.dateFrom) {
    emails = emails.filter(e => e.createdAt >= filters.dateFrom!);
  }

  if (filters?.dateTo) {
    emails = emails.filter(e => e.createdAt <= filters.dateTo!);
  }

  const total = emails.length;
  const sent = emails.filter(e => ['sent', 'opened', 'clicked'].includes(e.status)).length;
  const failed = emails.filter(e => e.status === 'failed').length;
  const pending = emails.filter(e => e.status === 'pending').length;
  const bounced = emails.filter(e => e.status === 'bounced').length;
  const opened = emails.filter(e => ['opened', 'clicked'].includes(e.status)).length;
  const clicked = emails.filter(e => e.status === 'clicked').length;

  return {
    total,
    sent,
    failed,
    pending,
    bounced,
    opened,
    clicked,
    openRate: sent > 0 ? (opened / sent) * 100 : 0,
    clickRate: sent > 0 ? (clicked / sent) * 100 : 0,
  };
}

/**
 * Get email stats by date range
 */
export function getEmailStatsByDateRange(
  startDate: Date,
  endDate: Date,
  groupBy: 'day' | 'week' | 'month' = 'day'
): Array<{
  date: string;
  sent: number;
  failed: number;
  opened: number;
  clicked: number;
}> {
  const emails = getAllEmails().filter(
    e => e.createdAt >= startDate && e.createdAt <= endDate
  );

  const grouped = new Map<string, {
    sent: number;
    failed: number;
    opened: number;
    clicked: number;
  }>();

  emails.forEach(email => {
    let key: string;

    if (groupBy === 'day') {
      key = email.createdAt.toISOString().split('T')[0];
    } else if (groupBy === 'week') {
      const weekStart = new Date(email.createdAt);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else {
      key = `${email.createdAt.getFullYear()}-${String(email.createdAt.getMonth() + 1).padStart(2, '0')}`;
    }

    if (!grouped.has(key)) {
      grouped.set(key, { sent: 0, failed: 0, opened: 0, clicked: 0 });
    }

    const stats = grouped.get(key)!;

    if (['sent', 'opened', 'clicked'].includes(email.status)) {
      stats.sent++;
    }
    if (email.status === 'failed') {
      stats.failed++;
    }
    if (['opened', 'clicked'].includes(email.status)) {
      stats.opened++;
    }
    if (email.status === 'clicked') {
      stats.clicked++;
    }
  });

  return Array.from(grouped.entries())
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ============================================================================
// Cleanup Functions
// ============================================================================

/**
 * Clean up old emails
 */
export function cleanupOldEmails(daysToKeep: number = 90): number {
  const emails = getAllEmails();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const filtered = emails.filter(e => e.createdAt >= cutoffDate);
  const removed = emails.length - filtered.length;

  if (removed > 0) {
    localStorage.setItem(EMAIL_STORAGE_KEY, JSON.stringify(filtered));
  }

  return removed;
}

/**
 * Clear all emails
 */
export function clearAllEmails(): void {
  localStorage.removeItem(EMAIL_STORAGE_KEY);
}

// ============================================================================
// Export default email service instance
// ============================================================================

export const emailService = {
  // Storage
  getAllEmails,
  getEmailById,
  saveEmail,
  deleteEmail,
  getEmailsByStatus,
  getEmailsByType,

  // Configuration
  getEmailConfig,
  saveEmailConfig,

  // Creation
  createEmail,
  createEmailFromTemplate,

  // Sending
  sendEmail,
  retryEmail,
  sendBulkEmails,
  processEmailQueue,
  processScheduledEmails,

  // Webhooks
  handleWebhookEvent,

  // Statistics
  getEmailStats,
  getEmailStatsByDateRange,

  // Cleanup
  cleanupOldEmails,
  clearAllEmails,
};

export default emailService;
