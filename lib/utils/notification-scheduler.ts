/**
 * Notification Scheduler Service
 *
 * Schedule notifications, recurring notifications, batch sending, and time zone handling.
 */

import { v4 as uuidv4 } from 'uuid';
import { createEmail, createEmailFromTemplate } from './email-service';
import { createSMS, createSMSFromTemplate } from './sms-service';

// ============================================================================
// Type Definitions
// ============================================================================

export type ScheduleType = 'one-time' | 'recurring' | 'triggered';
export type ScheduleStatus = 'active' | 'paused' | 'completed' | 'cancelled';
export type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'custom';
export type TriggerEvent =
  | 'order_created'
  | 'order_paid'
  | 'order_shipped'
  | 'order_delivered'
  | 'order_cancelled'
  | 'customer_registered'
  | 'cart_abandoned'
  | 'low_stock'
  | 'payment_failed'
  | 'payment_refunded';

export interface NotificationSchedule {
  id: string;
  name: string;
  description?: string;

  // Template info
  templateId: string;
  type: 'email' | 'sms';

  // Schedule type
  scheduleType: ScheduleType;

  // One-time schedule
  scheduledFor?: Date;

  // Recurring schedule
  recurrencePattern?: RecurrencePattern;
  cronExpression?: string; // For custom patterns
  startDate?: Date;
  endDate?: Date;
  nextRunAt?: Date;

  // Triggered schedule
  triggerEvent?: TriggerEvent;
  triggerDelay?: number; // Delay in minutes after trigger

  // Recipients
  recipients: {
    // Specific recipients
    emails?: string[];
    phones?: string[];

    // Dynamic recipients
    customerIds?: string[];
    customerSegment?: string;

    // All customers
    allCustomers?: boolean;
  };

  // Template variables (can be static or dynamic)
  templateVariables?: Record<string, any>;

  // Time zone handling
  timeZone?: string; // IANA time zone (e.g., 'America/New_York')

  // Status
  status: ScheduleStatus;

  // Statistics
  sentCount: number;
  failedCount: number;
  lastRunAt?: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface ScheduleExecutionLog {
  id: string;
  scheduleId: string;
  executedAt: Date;
  status: 'success' | 'failed' | 'partial';
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  error?: string;
}

// ============================================================================
// Constants
// ============================================================================

const SCHEDULE_STORAGE_KEY = 'notification_schedules';
const EXECUTION_LOG_KEY = 'schedule_execution_logs';

// ============================================================================
// Storage Functions
// ============================================================================

/**
 * Get all schedules from storage
 */
export function getAllSchedules(): NotificationSchedule[] {
  try {
    const stored = localStorage.getItem(SCHEDULE_STORAGE_KEY);
    if (!stored) return [];

    const schedules = JSON.parse(stored) as NotificationSchedule[];
    return schedules.map(s => ({
      ...s,
      createdAt: new Date(s.createdAt),
      updatedAt: new Date(s.updatedAt),
      scheduledFor: s.scheduledFor ? new Date(s.scheduledFor) : undefined,
      startDate: s.startDate ? new Date(s.startDate) : undefined,
      endDate: s.endDate ? new Date(s.endDate) : undefined,
      nextRunAt: s.nextRunAt ? new Date(s.nextRunAt) : undefined,
      lastRunAt: s.lastRunAt ? new Date(s.lastRunAt) : undefined,
    }));
  } catch (error) {
    console.error('Error loading schedules:', error);
    return [];
  }
}

/**
 * Save schedule to storage
 */
export function saveSchedule(schedule: NotificationSchedule): void {
  try {
    const schedules = getAllSchedules();
    const index = schedules.findIndex(s => s.id === schedule.id);

    if (index >= 0) {
      schedules[index] = schedule;
    } else {
      schedules.push(schedule);
    }

    localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(schedules));
  } catch (error) {
    console.error('Error saving schedule:', error);
  }
}

/**
 * Get schedule by ID
 */
export function getScheduleById(id: string): NotificationSchedule | null {
  const schedules = getAllSchedules();
  return schedules.find(s => s.id === id) || null;
}

/**
 * Delete schedule
 */
export function deleteSchedule(id: string): boolean {
  try {
    const schedules = getAllSchedules();
    const filtered = schedules.filter(s => s.id !== id);

    if (filtered.length === schedules.length) {
      return false;
    }

    localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting schedule:', error);
    return false;
  }
}

/**
 * Get schedules by status
 */
export function getSchedulesByStatus(status: ScheduleStatus): NotificationSchedule[] {
  return getAllSchedules().filter(s => s.status === status);
}

/**
 * Get schedules by type
 */
export function getSchedulesByType(scheduleType: ScheduleType): NotificationSchedule[] {
  return getAllSchedules().filter(s => s.scheduleType === scheduleType);
}

// ============================================================================
// Execution Log Functions
// ============================================================================

/**
 * Get all execution logs
 */
export function getAllExecutionLogs(): ScheduleExecutionLog[] {
  try {
    const stored = localStorage.getItem(EXECUTION_LOG_KEY);
    if (!stored) return [];

    const logs = JSON.parse(stored) as ScheduleExecutionLog[];
    return logs.map(l => ({
      ...l,
      executedAt: new Date(l.executedAt),
    }));
  } catch (error) {
    console.error('Error loading execution logs:', error);
    return [];
  }
}

/**
 * Save execution log
 */
export function saveExecutionLog(log: ScheduleExecutionLog): void {
  try {
    const logs = getAllExecutionLogs();
    logs.push(log);

    // Keep last 1000 logs
    if (logs.length > 1000) {
      logs.sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime());
      logs.splice(1000);
    }

    localStorage.setItem(EXECUTION_LOG_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error('Error saving execution log:', error);
  }
}

/**
 * Get execution logs for a schedule
 */
export function getExecutionLogsBySchedule(scheduleId: string): ScheduleExecutionLog[] {
  return getAllExecutionLogs().filter(l => l.scheduleId === scheduleId);
}

// ============================================================================
// Schedule Creation
// ============================================================================

/**
 * Create a new schedule
 */
export function createSchedule(
  params: Omit<NotificationSchedule, 'id' | 'createdAt' | 'updatedAt' | 'sentCount' | 'failedCount'>
): NotificationSchedule {
  const now = new Date();

  const schedule: NotificationSchedule = {
    ...params,
    id: uuidv4(),
    sentCount: 0,
    failedCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  // Calculate next run time for recurring schedules
  if (schedule.scheduleType === 'recurring' && schedule.status === 'active') {
    schedule.nextRunAt = calculateNextRun(schedule);
  }

  saveSchedule(schedule);
  return schedule;
}

/**
 * Update schedule
 */
export function updateSchedule(id: string, updates: Partial<NotificationSchedule>): NotificationSchedule | null {
  const schedule = getScheduleById(id);
  if (!schedule) return null;

  const updated: NotificationSchedule = {
    ...schedule,
    ...updates,
    updatedAt: new Date(),
  };

  // Recalculate next run if schedule changed
  if (
    updated.scheduleType === 'recurring' &&
    updated.status === 'active' &&
    (updates.recurrencePattern || updates.cronExpression || updates.startDate)
  ) {
    updated.nextRunAt = calculateNextRun(updated);
  }

  saveSchedule(updated);
  return updated;
}

// ============================================================================
// Time Calculation Functions
// ============================================================================

/**
 * Calculate next run time for recurring schedule
 */
export function calculateNextRun(schedule: NotificationSchedule): Date | undefined {
  if (schedule.scheduleType !== 'recurring') {
    return undefined;
  }

  const now = new Date();
  const startDate = schedule.startDate || now;
  const baseDate = schedule.lastRunAt || startDate;

  let nextRun: Date;

  if (schedule.cronExpression) {
    // Parse cron expression (simplified)
    nextRun = parseCronExpression(schedule.cronExpression, baseDate);
  } else {
    // Use recurrence pattern
    nextRun = new Date(baseDate);

    switch (schedule.recurrencePattern) {
      case 'daily':
        nextRun.setDate(nextRun.getDate() + 1);
        break;

      case 'weekly':
        nextRun.setDate(nextRun.getDate() + 7);
        break;

      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + 1);
        break;

      default:
        return undefined;
    }
  }

  // Check if next run is within schedule range
  if (schedule.endDate && nextRun > schedule.endDate) {
    return undefined;
  }

  // Adjust for time zone if specified
  if (schedule.timeZone) {
    nextRun = adjustForTimeZone(nextRun, schedule.timeZone);
  }

  return nextRun;
}

/**
 * Parse cron expression (simplified version)
 * Format: minute hour day month dayOfWeek
 */
export function parseCronExpression(cron: string, baseDate: Date): Date {
  const parts = cron.split(' ');
  if (parts.length !== 5) {
    throw new Error('Invalid cron expression');
  }

  const [minute, hour, day, month, dayOfWeek] = parts;
  const nextRun = new Date(baseDate);

  // Simple implementation - just adds one day for now
  // In production, you'd want to use a proper cron parser library
  nextRun.setDate(nextRun.getDate() + 1);

  return nextRun;
}

/**
 * Adjust date for time zone
 */
export function adjustForTimeZone(date: Date, timeZone: string): Date {
  try {
    // This is a simplified version
    // In production, use a library like date-fns-tz or luxon
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const values: Record<string, number> = {};

    parts.forEach(part => {
      if (part.type !== 'literal') {
        values[part.type] = parseInt(part.value);
      }
    });

    return new Date(
      values.year,
      values.month - 1,
      values.day,
      values.hour,
      values.minute,
      values.second
    );
  } catch (error) {
    console.error('Error adjusting for time zone:', error);
    return date;
  }
}

// ============================================================================
// Schedule Execution
// ============================================================================

/**
 * Execute a schedule
 */
export async function executeSchedule(scheduleId: string): Promise<ScheduleExecutionLog> {
  const schedule = getScheduleById(scheduleId);
  if (!schedule) {
    throw new Error(`Schedule ${scheduleId} not found`);
  }

  if (schedule.status !== 'active') {
    throw new Error('Schedule is not active');
  }

  const log: ScheduleExecutionLog = {
    id: uuidv4(),
    scheduleId,
    executedAt: new Date(),
    status: 'success',
    recipientCount: 0,
    sentCount: 0,
    failedCount: 0,
  };

  try {
    // Get recipients
    const recipients = await getRecipients(schedule);
    log.recipientCount = recipients.length;

    if (recipients.length === 0) {
      log.status = 'failed';
      log.error = 'No recipients found';
      saveExecutionLog(log);
      return log;
    }

    // Send notifications
    for (const recipient of recipients) {
      try {
        if (schedule.type === 'email') {
          const email = createEmailFromTemplate(
            schedule.templateId,
            recipient.email!,
            { ...schedule.templateVariables, ...recipient.variables }
          );
          log.sentCount++;
        } else {
          const sms = createSMSFromTemplate(
            schedule.templateId,
            recipient.phone!,
            { ...schedule.templateVariables, ...recipient.variables }
          );
          log.sentCount++;
        }
      } catch (error) {
        log.failedCount++;
        console.error('Failed to send notification:', error);
      }
    }

    // Update schedule
    schedule.sentCount += log.sentCount;
    schedule.failedCount += log.failedCount;
    schedule.lastRunAt = new Date();

    // Calculate next run for recurring schedules
    if (schedule.scheduleType === 'recurring') {
      schedule.nextRunAt = calculateNextRun(schedule);

      if (!schedule.nextRunAt) {
        // No more runs, mark as completed
        schedule.status = 'completed';
      }
    } else if (schedule.scheduleType === 'one-time') {
      // Mark one-time schedule as completed
      schedule.status = 'completed';
    }

    saveSchedule(schedule);

    // Determine overall status
    if (log.failedCount === 0) {
      log.status = 'success';
    } else if (log.sentCount === 0) {
      log.status = 'failed';
    } else {
      log.status = 'partial';
    }

    saveExecutionLog(log);
    return log;
  } catch (error: any) {
    log.status = 'failed';
    log.error = error.message;
    saveExecutionLog(log);
    throw error;
  }
}

/**
 * Get recipients for a schedule
 */
async function getRecipients(schedule: NotificationSchedule): Promise<Array<{
  email?: string;
  phone?: string;
  variables?: Record<string, any>;
}>> {
  const recipients: Array<{
    email?: string;
    phone?: string;
    variables?: Record<string, any>;
  }> = [];

  // Add specific email recipients
  if (schedule.recipients.emails) {
    schedule.recipients.emails.forEach(email => {
      recipients.push({ email });
    });
  }

  // Add specific phone recipients
  if (schedule.recipients.phones) {
    schedule.recipients.phones.forEach(phone => {
      recipients.push({ phone });
    });
  }

  // Add customer IDs (would fetch from database in production)
  if (schedule.recipients.customerIds) {
    // In production, fetch customer data from database
    // For now, just placeholder
    schedule.recipients.customerIds.forEach(customerId => {
      recipients.push({
        email: `customer-${customerId}@example.com`,
        variables: { customerId },
      });
    });
  }

  // Add customer segment (would query database in production)
  if (schedule.recipients.customerSegment) {
    // In production, query customers by segment
    // For now, just placeholder
  }

  // Add all customers (would query database in production)
  if (schedule.recipients.allCustomers) {
    // In production, fetch all active customers
    // For now, just placeholder
  }

  return recipients;
}

/**
 * Process due schedules
 */
export async function processDueSchedules(): Promise<{
  executed: number;
  failed: number;
  logs: ScheduleExecutionLog[];
}> {
  const now = new Date();
  const activeSchedules = getSchedulesByStatus('active');

  const dueSchedules = activeSchedules.filter(schedule => {
    if (schedule.scheduleType === 'one-time') {
      return schedule.scheduledFor && schedule.scheduledFor <= now;
    } else if (schedule.scheduleType === 'recurring') {
      return schedule.nextRunAt && schedule.nextRunAt <= now;
    }
    return false;
  });

  let executed = 0;
  let failed = 0;
  const logs: ScheduleExecutionLog[] = [];

  for (const schedule of dueSchedules) {
    try {
      const log = await executeSchedule(schedule.id);
      logs.push(log);

      if (log.status === 'success' || log.status === 'partial') {
        executed++;
      } else {
        failed++;
      }
    } catch (error) {
      failed++;
      console.error(`Failed to execute schedule ${schedule.id}:`, error);
    }
  }

  return { executed, failed, logs };
}

/**
 * Handle triggered events
 */
export async function handleTriggerEvent(
  event: TriggerEvent,
  eventData: Record<string, any>
): Promise<void> {
  const triggeredSchedules = getAllSchedules().filter(
    s => s.scheduleType === 'triggered' && s.triggerEvent === event && s.status === 'active'
  );

  for (const schedule of triggeredSchedules) {
    // Apply delay if configured
    if (schedule.triggerDelay && schedule.triggerDelay > 0) {
      setTimeout(async () => {
        try {
          await executeSchedule(schedule.id);
        } catch (error) {
          console.error('Failed to execute triggered schedule:', error);
        }
      }, schedule.triggerDelay * 60 * 1000); // Convert minutes to milliseconds
    } else {
      try {
        await executeSchedule(schedule.id);
      } catch (error) {
        console.error('Failed to execute triggered schedule:', error);
      }
    }
  }
}

// ============================================================================
// Batch Operations
// ============================================================================

/**
 * Pause schedule
 */
export function pauseSchedule(scheduleId: string): boolean {
  const schedule = getScheduleById(scheduleId);
  if (!schedule || schedule.status !== 'active') {
    return false;
  }

  schedule.status = 'paused';
  schedule.updatedAt = new Date();
  saveSchedule(schedule);
  return true;
}

/**
 * Resume schedule
 */
export function resumeSchedule(scheduleId: string): boolean {
  const schedule = getScheduleById(scheduleId);
  if (!schedule || schedule.status !== 'paused') {
    return false;
  }

  schedule.status = 'active';
  schedule.updatedAt = new Date();

  // Recalculate next run for recurring schedules
  if (schedule.scheduleType === 'recurring') {
    schedule.nextRunAt = calculateNextRun(schedule);
  }

  saveSchedule(schedule);
  return true;
}

/**
 * Cancel schedule
 */
export function cancelSchedule(scheduleId: string): boolean {
  const schedule = getScheduleById(scheduleId);
  if (!schedule) {
    return false;
  }

  schedule.status = 'cancelled';
  schedule.updatedAt = new Date();
  saveSchedule(schedule);
  return true;
}

// ============================================================================
// Export scheduler service
// ============================================================================

export const schedulerService = {
  // Storage
  getAllSchedules,
  getScheduleById,
  saveSchedule,
  deleteSchedule,
  getSchedulesByStatus,
  getSchedulesByType,

  // Execution logs
  getAllExecutionLogs,
  getExecutionLogsBySchedule,

  // Creation
  createSchedule,
  updateSchedule,

  // Time calculation
  calculateNextRun,
  parseCronExpression,
  adjustForTimeZone,

  // Execution
  executeSchedule,
  processDueSchedules,
  handleTriggerEvent,

  // Batch operations
  pauseSchedule,
  resumeSchedule,
  cancelSchedule,
};

export default schedulerService;
