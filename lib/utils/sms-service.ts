/**
 * SMS Service - Twilio Integration
 *
 * Comprehensive SMS service with Twilio integration,
 * template management, message queuing, and delivery status tracking.
 */

import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Type Definitions
// ============================================================================

export type SMSStatus = 'pending' | 'queued' | 'sending' | 'sent' | 'delivered' | 'failed' | 'undelivered' | 'optout';

export interface SMSMessage {
  id: string;
  to: string; // E.164 format: +1234567890
  from?: string; // Twilio phone number
  body: string;

  templateId?: string;
  templateVariables?: Record<string, any>;

  status: SMSStatus;
  sentAt?: Date;
  deliveredAt?: Date;
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

  // Twilio specific
  twilioSid?: string;
  twilioStatus?: string;
  twilioErrorCode?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface SMSConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
  enabled: boolean;
  maxRetries: number;
  retryDelay: number;
  batchSize: number;
  messagingServiceSid?: string;
}

export interface TwilioResponse {
  sid?: string;
  status?: string;
  error_code?: string;
  error_message?: string;
  to?: string;
  from?: string;
  body?: string;
  date_created?: string;
  date_updated?: string;
  date_sent?: string;
}

export interface SMSStats {
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  pending: number;
  optedOut: number;
  deliveryRate: number;
}

export interface OptOutRecord {
  phoneNumber: string;
  optedOutAt: Date;
  reason?: string;
}

// ============================================================================
// Constants
// ============================================================================

const SMS_STORAGE_KEY = 'sms_messages';
const SMS_CONFIG_KEY = 'sms_config';
const OPT_OUT_STORAGE_KEY = 'sms_opt_outs';
const TWILIO_API_URL = 'https://api.twilio.com/2010-04-01';

// Default configuration
const DEFAULT_CONFIG: SMSConfig = {
  accountSid: process.env.NEXT_PUBLIC_TWILIO_ACCOUNT_SID || '',
  authToken: process.env.NEXT_PUBLIC_TWILIO_AUTH_TOKEN || '',
  fromNumber: process.env.NEXT_PUBLIC_TWILIO_FROM_NUMBER || '',
  enabled: true,
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
  batchSize: 10,
  messagingServiceSid: process.env.NEXT_PUBLIC_TWILIO_MESSAGING_SERVICE_SID || '',
};

// SMS character limits
const SMS_SINGLE_LENGTH = 160;
const SMS_MULTI_LENGTH = 153;

// ============================================================================
// Storage Functions
// ============================================================================

/**
 * Get all SMS messages from storage
 */
export function getAllSMS(): SMSMessage[] {
  try {
    const stored = localStorage.getItem(SMS_STORAGE_KEY);
    if (!stored) return [];

    const messages = JSON.parse(stored) as SMSMessage[];
    return messages.map(msg => ({
      ...msg,
      createdAt: new Date(msg.createdAt),
      updatedAt: new Date(msg.updatedAt),
      sentAt: msg.sentAt ? new Date(msg.sentAt) : undefined,
      deliveredAt: msg.deliveredAt ? new Date(msg.deliveredAt) : undefined,
      scheduledFor: msg.scheduledFor ? new Date(msg.scheduledFor) : undefined,
    }));
  } catch (error) {
    console.error('Error loading SMS:', error);
    return [];
  }
}

/**
 * Save SMS to storage
 */
export function saveSMS(sms: SMSMessage): void {
  try {
    const messages = getAllSMS();
    const index = messages.findIndex(m => m.id === sms.id);

    if (index >= 0) {
      messages[index] = sms;
    } else {
      messages.push(sms);
    }

    // Keep last 1000 messages
    if (messages.length > 1000) {
      messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      messages.splice(1000);
    }

    localStorage.setItem(SMS_STORAGE_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error('Error saving SMS:', error);
  }
}

/**
 * Get SMS by ID
 */
export function getSMSById(id: string): SMSMessage | null {
  const messages = getAllSMS();
  return messages.find(m => m.id === id) || null;
}

/**
 * Delete SMS
 */
export function deleteSMS(id: string): boolean {
  try {
    const messages = getAllSMS();
    const filtered = messages.filter(m => m.id !== id);

    if (filtered.length === messages.length) {
      return false;
    }

    localStorage.setItem(SMS_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting SMS:', error);
    return false;
  }
}

/**
 * Get SMS by status
 */
export function getSMSByStatus(status: SMSStatus): SMSMessage[] {
  return getAllSMS().filter(m => m.status === status);
}

/**
 * Get SMS by type
 */
export function getSMSByType(type: string): SMSMessage[] {
  return getAllSMS().filter(m => m.metadata?.type === type);
}

// ============================================================================
// Opt-Out Management
// ============================================================================

/**
 * Get all opt-out records
 */
export function getAllOptOuts(): OptOutRecord[] {
  try {
    const stored = localStorage.getItem(OPT_OUT_STORAGE_KEY);
    if (!stored) return [];

    const records = JSON.parse(stored) as OptOutRecord[];
    return records.map(r => ({
      ...r,
      optedOutAt: new Date(r.optedOutAt),
    }));
  } catch (error) {
    console.error('Error loading opt-outs:', error);
    return [];
  }
}

/**
 * Check if phone number is opted out
 */
export function isOptedOut(phoneNumber: string): boolean {
  const optOuts = getAllOptOuts();
  const normalized = normalizePhoneNumber(phoneNumber);
  return optOuts.some(r => normalizePhoneNumber(r.phoneNumber) === normalized);
}

/**
 * Add opt-out record
 */
export function addOptOut(phoneNumber: string, reason?: string): void {
  try {
    if (isOptedOut(phoneNumber)) {
      return; // Already opted out
    }

    const optOuts = getAllOptOuts();
    optOuts.push({
      phoneNumber: normalizePhoneNumber(phoneNumber),
      optedOutAt: new Date(),
      reason,
    });

    localStorage.setItem(OPT_OUT_STORAGE_KEY, JSON.stringify(optOuts));
  } catch (error) {
    console.error('Error adding opt-out:', error);
  }
}

/**
 * Remove opt-out record
 */
export function removeOptOut(phoneNumber: string): boolean {
  try {
    const optOuts = getAllOptOuts();
    const normalized = normalizePhoneNumber(phoneNumber);
    const filtered = optOuts.filter(r => normalizePhoneNumber(r.phoneNumber) !== normalized);

    if (filtered.length === optOuts.length) {
      return false;
    }

    localStorage.setItem(OPT_OUT_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error removing opt-out:', error);
    return false;
  }
}

// ============================================================================
// Configuration Functions
// ============================================================================

/**
 * Get SMS configuration
 */
export function getSMSConfig(): SMSConfig {
  try {
    const stored = localStorage.getItem(SMS_CONFIG_KEY);
    if (!stored) return DEFAULT_CONFIG;

    return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
  } catch (error) {
    console.error('Error loading SMS config:', error);
    return DEFAULT_CONFIG;
  }
}

/**
 * Save SMS configuration
 */
export function saveSMSConfig(config: Partial<SMSConfig>): void {
  try {
    const current = getSMSConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(SMS_CONFIG_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving SMS config:', error);
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Normalize phone number to E.164 format
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '');

  // Add + if not present
  if (!phone.startsWith('+')) {
    // Assume US/Canada if 10 digits
    if (digits.length === 10) {
      digits = '1' + digits;
    }
    return '+' + digits;
  }

  return '+' + digits;
}

/**
 * Validate phone number
 */
export function isValidPhoneNumber(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  // E.164 format: +[country code][number]
  // Length should be between 8 and 15 digits (including country code)
  return /^\+\d{8,15}$/.test(normalized);
}

/**
 * Calculate SMS segments
 */
export function calculateSMSSegments(message: string): number {
  const length = message.length;

  // Check if message contains unicode characters
  const hasUnicode = /[^\x00-\x7F]/.test(message);

  if (hasUnicode) {
    // Unicode messages are limited to 70 characters per segment
    return Math.ceil(length / 70);
  }

  if (length <= SMS_SINGLE_LENGTH) {
    return 1;
  }

  return Math.ceil(length / SMS_MULTI_LENGTH);
}

/**
 * Get SMS character count info
 */
export function getSMSCharacterInfo(message: string): {
  length: number;
  segments: number;
  remaining: number;
  encoding: 'GSM-7' | 'UCS-2';
} {
  const hasUnicode = /[^\x00-\x7F]/.test(message);
  const encoding = hasUnicode ? 'UCS-2' : 'GSM-7';
  const length = message.length;
  const segments = calculateSMSSegments(message);

  let remaining: number;
  if (hasUnicode) {
    const limit = segments === 1 ? 70 : 67;
    remaining = (limit * segments) - length;
  } else {
    const limit = segments === 1 ? SMS_SINGLE_LENGTH : SMS_MULTI_LENGTH;
    remaining = (limit * segments) - length;
  }

  return {
    length,
    segments,
    remaining,
    encoding,
  };
}

// ============================================================================
// SMS Creation Functions
// ============================================================================

/**
 * Create a new SMS message
 */
export function createSMS(
  params: Omit<SMSMessage, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'retryCount' | 'maxRetries' | 'priority'> & {
    priority?: 'low' | 'normal' | 'high';
    maxRetries?: number;
  }
): SMSMessage {
  const config = getSMSConfig();
  const now = new Date();

  // Validate phone number
  if (!isValidPhoneNumber(params.to)) {
    throw new Error(`Invalid phone number: ${params.to}`);
  }

  // Check opt-out status
  if (isOptedOut(params.to)) {
    throw new Error(`Phone number ${params.to} has opted out`);
  }

  const sms: SMSMessage = {
    ...params,
    id: uuidv4(),
    to: normalizePhoneNumber(params.to),
    status: 'pending',
    retryCount: 0,
    maxRetries: params.maxRetries ?? config.maxRetries,
    priority: params.priority ?? 'normal',
    createdAt: now,
    updatedAt: now,
  };

  saveSMS(sms);
  return sms;
}

/**
 * Create SMS from template
 */
export function createSMSFromTemplate(
  templateId: string,
  to: string,
  variables: Record<string, any>,
  options?: {
    metadata?: SMSMessage['metadata'];
    priority?: 'low' | 'normal' | 'high';
    scheduledFor?: Date;
  }
): SMSMessage {
  return createSMS({
    to,
    body: '', // Will be filled by template rendering
    templateId,
    templateVariables: variables,
    metadata: options?.metadata,
    priority: options?.priority,
    scheduledFor: options?.scheduledFor,
  });
}

// ============================================================================
// Twilio API Functions
// ============================================================================

/**
 * Build Twilio API credentials
 */
function getTwilioAuth(config: SMSConfig): string {
  const credentials = `${config.accountSid}:${config.authToken}`;
  return `Basic ${Buffer.from(credentials).toString('base64')}`;
}

/**
 * Send SMS via Twilio API
 */
async function sendViaTwilio(sms: SMSMessage, config: SMSConfig): Promise<TwilioResponse> {
  const url = `${TWILIO_API_URL}/Accounts/${config.accountSid}/Messages.json`;

  const body = new URLSearchParams();
  body.append('To', sms.to);
  body.append('Body', sms.body);

  if (config.messagingServiceSid) {
    body.append('MessagingServiceSid', config.messagingServiceSid);
  } else {
    body.append('From', sms.from || config.fromNumber);
  }

  // Add status callback for tracking
  // body.append('StatusCallback', `${process.env.NEXT_PUBLIC_APP_URL}/api/sms/webhook`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': getTwilioAuth(config),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || `Twilio API error: ${response.status}`);
    }

    return result;
  } catch (error: any) {
    throw new Error(`Twilio API error: ${error.message}`);
  }
}

// ============================================================================
// SMS Sending Functions
// ============================================================================

/**
 * Send a single SMS
 */
export async function sendSMS(smsId: string): Promise<boolean> {
  const sms = getSMSById(smsId);
  if (!sms) {
    throw new Error(`SMS ${smsId} not found`);
  }

  const config = getSMSConfig();

  if (!config.enabled) {
    throw new Error('SMS service is disabled');
  }

  if (!config.accountSid || !config.authToken) {
    throw new Error('Twilio credentials not configured');
  }

  if (!config.fromNumber && !config.messagingServiceSid) {
    throw new Error('Twilio from number or messaging service not configured');
  }

  // Check opt-out status
  if (isOptedOut(sms.to)) {
    sms.status = 'optout';
    sms.failureReason = 'Recipient has opted out';
    sms.updatedAt = new Date();
    saveSMS(sms);
    throw new Error('Recipient has opted out');
  }

  // Check if scheduled
  if (sms.scheduledFor && sms.scheduledFor > new Date()) {
    throw new Error('SMS is scheduled for future delivery');
  }

  // Update status to sending
  sms.status = 'sending';
  sms.updatedAt = new Date();
  saveSMS(sms);

  try {
    const response = await sendViaTwilio(sms, config);

    if (response.sid) {
      // Success
      sms.status = 'sent';
      sms.sentAt = new Date();
      sms.twilioSid = response.sid;
      sms.twilioStatus = response.status;
      sms.updatedAt = new Date();
      saveSMS(sms);
      return true;
    } else {
      throw new Error('No SID returned from Twilio');
    }
  } catch (error: any) {
    sms.status = 'failed';
    sms.failureReason = error.message;
    sms.retryCount += 1;
    sms.updatedAt = new Date();
    saveSMS(sms);

    // Schedule retry if not exceeded max retries
    if (sms.retryCount < sms.maxRetries) {
      setTimeout(() => {
        retrySMS(smsId).catch(console.error);
      }, config.retryDelay * Math.pow(2, sms.retryCount - 1)); // Exponential backoff
    }

    return false;
  }
}

/**
 * Retry sending a failed SMS
 */
export async function retrySMS(smsId: string): Promise<boolean> {
  const sms = getSMSById(smsId);
  if (!sms) {
    throw new Error(`SMS ${smsId} not found`);
  }

  if (sms.retryCount >= sms.maxRetries) {
    throw new Error('Maximum retry attempts exceeded');
  }

  return sendSMS(smsId);
}

/**
 * Send bulk SMS
 */
export async function sendBulkSMS(smsIds: string[]): Promise<{ sent: number; failed: number }> {
  const config = getSMSConfig();
  let sent = 0;
  let failed = 0;

  // Process in batches
  for (let i = 0; i < smsIds.length; i += config.batchSize) {
    const batch = smsIds.slice(i, i + config.batchSize);

    const results = await Promise.allSettled(
      batch.map(id => sendSMS(id))
    );

    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        sent++;
      } else {
        failed++;
      }
    });

    // Rate limiting: wait between batches
    if (i + config.batchSize < smsIds.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return { sent, failed };
}

/**
 * Process SMS queue
 */
export async function processSMSQueue(): Promise<{ sent: number; failed: number }> {
  const pending = getSMSByStatus('pending').filter(sms => {
    // Check if scheduled for future
    if (sms.scheduledFor && sms.scheduledFor > new Date()) {
      return false;
    }
    // Check opt-out status
    if (isOptedOut(sms.to)) {
      return false;
    }
    return true;
  });

  const smsIds = pending
    .sort((a, b) => {
      // Sort by priority first
      const priorityMap = { high: 3, normal: 2, low: 1 };
      const priorityDiff = priorityMap[b.priority] - priorityMap[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by creation time
      return a.createdAt.getTime() - b.createdAt.getTime();
    })
    .map(s => s.id);

  return sendBulkSMS(smsIds);
}

/**
 * Process scheduled SMS
 */
export async function processScheduledSMS(): Promise<{ sent: number; failed: number }> {
  const now = new Date();
  const scheduled = getAllSMS().filter(sms =>
    sms.status === 'pending' &&
    sms.scheduledFor &&
    sms.scheduledFor <= now &&
    !isOptedOut(sms.to)
  );

  const smsIds = scheduled.map(s => s.id);
  return sendBulkSMS(smsIds);
}

// ============================================================================
// Webhook Handling
// ============================================================================

export interface TwilioWebhookEvent {
  MessageSid: string;
  MessageStatus: string;
  ErrorCode?: string;
  ErrorMessage?: string;
  To: string;
  From: string;
  [key: string]: any;
}

/**
 * Handle Twilio webhook events
 */
export function handleWebhookEvent(event: TwilioWebhookEvent): void {
  const messages = getAllSMS();
  const sms = messages.find(m => m.twilioSid === event.MessageSid);

  if (!sms) return;

  const now = new Date();

  // Update status based on Twilio status
  switch (event.MessageStatus) {
    case 'queued':
      sms.status = 'queued';
      break;

    case 'sending':
      sms.status = 'sending';
      break;

    case 'sent':
      sms.status = 'sent';
      sms.sentAt = now;
      break;

    case 'delivered':
      sms.status = 'delivered';
      sms.deliveredAt = now;
      break;

    case 'undelivered':
      sms.status = 'undelivered';
      sms.failureReason = event.ErrorMessage || 'Message undelivered';
      sms.twilioErrorCode = event.ErrorCode;
      break;

    case 'failed':
      sms.status = 'failed';
      sms.failureReason = event.ErrorMessage || 'Message failed';
      sms.twilioErrorCode = event.ErrorCode;
      break;
  }

  sms.twilioStatus = event.MessageStatus;
  sms.updatedAt = now;
  saveSMS(sms);
}

// ============================================================================
// Statistics Functions
// ============================================================================

/**
 * Get SMS statistics
 */
export function getSMSStats(filters?: {
  type?: string;
  dateFrom?: Date;
  dateTo?: Date;
}): SMSStats {
  let messages = getAllSMS();

  if (filters?.type) {
    messages = messages.filter(m => m.metadata?.type === filters.type);
  }

  if (filters?.dateFrom) {
    messages = messages.filter(m => m.createdAt >= filters.dateFrom!);
  }

  if (filters?.dateTo) {
    messages = messages.filter(m => m.createdAt <= filters.dateTo!);
  }

  const total = messages.length;
  const sent = messages.filter(m => ['sent', 'delivered'].includes(m.status)).length;
  const delivered = messages.filter(m => m.status === 'delivered').length;
  const failed = messages.filter(m => m.status === 'failed').length;
  const pending = messages.filter(m => m.status === 'pending').length;
  const optedOut = messages.filter(m => m.status === 'optout').length;

  return {
    total,
    sent,
    delivered,
    failed,
    pending,
    optedOut,
    deliveryRate: sent > 0 ? (delivered / sent) * 100 : 0,
  };
}

// ============================================================================
// Cleanup Functions
// ============================================================================

/**
 * Clean up old SMS
 */
export function cleanupOldSMS(daysToKeep: number = 90): number {
  const messages = getAllSMS();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const filtered = messages.filter(m => m.createdAt >= cutoffDate);
  const removed = messages.length - filtered.length;

  if (removed > 0) {
    localStorage.setItem(SMS_STORAGE_KEY, JSON.stringify(filtered));
  }

  return removed;
}

/**
 * Clear all SMS
 */
export function clearAllSMS(): void {
  localStorage.removeItem(SMS_STORAGE_KEY);
}

// ============================================================================
// Export default SMS service instance
// ============================================================================

export const smsService = {
  // Storage
  getAllSMS,
  getSMSById,
  saveSMS,
  deleteSMS,
  getSMSByStatus,
  getSMSByType,

  // Opt-out management
  getAllOptOuts,
  isOptedOut,
  addOptOut,
  removeOptOut,

  // Configuration
  getSMSConfig,
  saveSMSConfig,

  // Utilities
  normalizePhoneNumber,
  isValidPhoneNumber,
  calculateSMSSegments,
  getSMSCharacterInfo,

  // Creation
  createSMS,
  createSMSFromTemplate,

  // Sending
  sendSMS,
  retrySMS,
  sendBulkSMS,
  processSMSQueue,
  processScheduledSMS,

  // Webhooks
  handleWebhookEvent,

  // Statistics
  getSMSStats,

  // Cleanup
  cleanupOldSMS,
  clearAllSMS,
};

export default smsService;
