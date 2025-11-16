/**
 * Order scheduling utilities for recurring and time-based orders
 */

import type { OrderItem } from '@/types';

export type ScheduleFrequency = 'once' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

/**
 * Custom cron pattern for advanced scheduling
 */
export interface CronPattern {
  minute: number | '*' | string; // 0-59
  hour: number | '*' | string; // 0-23
  dayOfMonth: number | '*' | string; // 1-31
  month: number | '*' | string; // 1-12
  dayOfWeek: number | '*' | string; // 0-6 (Sunday=0)
}

/**
 * Schedule configuration
 */
export interface OrderSchedule {
  id: string;
  name: string;
  description?: string;
  templateId?: string; // Link to order template
  items: OrderItem[];
  frequency: ScheduleFrequency;
  startDate: Date;
  endDate?: Date;
  daysOfWeek?: DayOfWeek[]; // For weekly/biweekly
  dayOfMonth?: number; // For monthly (1-28)
  time: string; // HH:mm format
  timezone?: string;
  isActive: boolean;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  lastExecutedAt?: Date;
  nextExecutionAt?: Date;
  cronPattern?: CronPattern; // For custom frequency
  notificationMinutesBeforeExecution?: number;
}

/**
 * Schedule execution record
 */
export interface ScheduleExecution {
  id: string;
  scheduleId: string;
  executedAt: Date;
  itemsApplied: OrderItem[];
  status: 'success' | 'failed' | 'cancelled';
  errorMessage?: string;
}

/**
 * Create a new order schedule
 */
export function createSchedule(
  schedule: Omit<OrderSchedule, 'id' | 'createdAt' | 'updatedAt' | 'nextExecutionAt'>
): OrderSchedule {
  const id = `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();

  return {
    ...schedule,
    id,
    createdAt: now,
    updatedAt: now,
    nextExecutionAt: calculateNextExecution(schedule),
  };
}

/**
 * Calculate next execution time for a schedule
 */
export function calculateNextExecution(schedule: Omit<OrderSchedule, 'nextExecutionAt'>): Date {
  const now = new Date();
  const [hours, minutes] = schedule.time.split(':').map(Number);

  switch (schedule.frequency) {
    case 'once': {
      const scheduledTime = new Date(schedule.startDate);
      scheduledTime.setHours(hours, minutes, 0, 0);
      return scheduledTime > now ? scheduledTime : new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }

    case 'daily': {
      const nextTime = new Date(now);
      nextTime.setHours(hours, minutes, 0, 0);
      if (nextTime <= now) {
        nextTime.setDate(nextTime.getDate() + 1);
      }
      return nextTime;
    }

    case 'weekly': {
      const daysOfWeek = schedule.daysOfWeek || ['monday'];
      const dayNumbers = daysOfWeekToNumbers(daysOfWeek);
      return getNextWeeklyExecution(now, dayNumbers, hours, minutes);
    }

    case 'biweekly': {
      const daysOfWeek = schedule.daysOfWeek || ['monday'];
      const dayNumbers = daysOfWeekToNumbers(daysOfWeek);
      const startWeek = getWeekNumber(schedule.startDate);
      const currentWeek = getWeekNumber(now);
      const weeksElapsed = currentWeek - startWeek;

      // If even number of weeks have passed, it's an execution week
      if (weeksElapsed % 2 === 0) {
        return getNextWeeklyExecution(now, dayNumbers, hours, minutes);
      } else {
        // Otherwise, add 1 week then find the day
        const nextWeekDate = new Date(now);
        nextWeekDate.setDate(nextWeekDate.getDate() + 7);
        return getNextWeeklyExecution(nextWeekDate, dayNumbers, hours, minutes);
      }
    }

    case 'monthly': {
      const dayOfMonth = schedule.dayOfMonth || 1;
      const nextDate = new Date(now.getFullYear(), now.getMonth(), dayOfMonth, hours, minutes, 0, 0);

      if (nextDate <= now) {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }

      return nextDate;
    }

    case 'custom': {
      if (schedule.cronPattern) {
        return getNextCronExecution(now, schedule.cronPattern);
      }
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }

    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
}

/**
 * Check if a schedule should be executed at the given time
 */
export function shouldExecuteSchedule(schedule: OrderSchedule, checkTime?: Date): boolean {
  const now = checkTime || new Date();

  // Check if active
  if (!schedule.isActive) return false;

  // Check date range
  if (now < schedule.startDate) return false;
  if (schedule.endDate && now > schedule.endDate) return false;

  // Check if next execution time has arrived (with 1-minute buffer)
  if (schedule.nextExecutionAt) {
    const timeDiff = now.getTime() - schedule.nextExecutionAt.getTime();
    return timeDiff >= 0 && timeDiff < 60000; // Within 1 minute window
  }

  return false;
}

/**
 * Get list of next 10 execution times for a schedule
 */
export function getUpcomingExecutions(schedule: OrderSchedule, count: number = 10): Date[] {
  const executions: Date[] = [];
  let currentSchedule = { ...schedule };

  for (let i = 0; i < count; i++) {
    const nextExec = calculateNextExecution(currentSchedule);

    // Check end date
    if (currentSchedule.endDate && nextExec > currentSchedule.endDate) {
      break;
    }

    executions.push(nextExec);

    // Move start date forward for next iteration
    currentSchedule = {
      ...currentSchedule,
      startDate: new Date(nextExec.getTime() + 1000),
    };
  }

  return executions;
}

/**
 * Get all schedules (from localStorage)
 */
export function getAllSchedules(): OrderSchedule[] {
  try {
    const stored = localStorage.getItem('order_schedules');
    if (!stored) return [];

    const schedules = JSON.parse(stored) as OrderSchedule[];
    return schedules.map((s) => ({
      ...s,
      startDate: new Date(s.startDate),
      endDate: s.endDate ? new Date(s.endDate) : undefined,
      createdAt: new Date(s.createdAt),
      updatedAt: new Date(s.updatedAt),
      lastExecutedAt: s.lastExecutedAt ? new Date(s.lastExecutedAt) : undefined,
      nextExecutionAt: s.nextExecutionAt ? new Date(s.nextExecutionAt) : undefined,
    }));
  } catch {
    return [];
  }
}

/**
 * Get schedule by ID
 */
export function getScheduleById(id: string): OrderSchedule | null {
  const schedules = getAllSchedules();
  return schedules.find((s) => s.id === id) || null;
}

/**
 * Get active schedules that need execution
 */
export function getPendingSchedules(): OrderSchedule[] {
  const schedules = getAllSchedules();
  const now = new Date();

  return schedules.filter((s) => {
    if (!s.isActive) return false;
    if (now < s.startDate) return false;
    if (s.endDate && now > s.endDate) return false;
    if (!s.nextExecutionAt) return false;

    const timeDiff = now.getTime() - s.nextExecutionAt.getTime();
    return timeDiff >= 0 && timeDiff < 60000;
  });
}

/**
 * Save schedule to localStorage
 */
export function saveSchedule(schedule: OrderSchedule): void {
  const schedules = getAllSchedules();
  const index = schedules.findIndex((s) => s.id === schedule.id);

  if (index >= 0) {
    schedules[index] = schedule;
  } else {
    schedules.push(schedule);
  }

  // Limit to 200 schedules
  if (schedules.length > 200) {
    schedules.shift();
  }

  localStorage.setItem('order_schedules', JSON.stringify(schedules));
}

/**
 * Update schedule
 */
export function updateSchedule(
  id: string,
  updates: Partial<Omit<OrderSchedule, 'id' | 'createdAt'>>
): OrderSchedule | null {
  const schedule = getScheduleById(id);
  if (!schedule) return null;

  const updated: OrderSchedule = {
    ...schedule,
    ...updates,
    updatedAt: new Date(),
    nextExecutionAt: calculateNextExecution({
      ...schedule,
      ...updates,
    }),
  };

  saveSchedule(updated);
  return updated;
}

/**
 * Delete schedule
 */
export function deleteSchedule(id: string): boolean {
  const schedules = getAllSchedules();
  const filtered = schedules.filter((s) => s.id !== id);

  if (filtered.length === schedules.length) {
    return false;
  }

  localStorage.setItem('order_schedules', JSON.stringify(filtered));
  return true;
}

/**
 * Search schedules by name or description
 */
export function searchSchedules(query: string): OrderSchedule[] {
  const schedules = getAllSchedules();
  const lowerQuery = query.toLowerCase();

  return schedules.filter(
    (s) =>
      s.name.toLowerCase().includes(lowerQuery) ||
      (s.description && s.description.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get schedules by tag
 */
export function getSchedulesByTag(tag: string): OrderSchedule[] {
  const schedules = getAllSchedules();
  return schedules.filter((s) => s.tags?.includes(tag));
}

/**
 * Get all unique tags from schedules
 */
export function getAllScheduleTags(): string[] {
  const schedules = getAllSchedules();
  const tags = new Set<string>();

  schedules.forEach((s) => {
    s.tags?.forEach((tag) => tags.add(tag));
  });

  return Array.from(tags).sort();
}

/**
 * Record schedule execution
 */
export function recordExecution(
  schedule: OrderSchedule,
  status: 'success' | 'failed' | 'cancelled',
  errorMessage?: string
): void {
  const execution: ScheduleExecution = {
    id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    scheduleId: schedule.id,
    executedAt: new Date(),
    itemsApplied: schedule.items,
    status,
    errorMessage,
  };

  // Store execution record
  try {
    const executions = JSON.parse(localStorage.getItem('schedule_executions') || '[]');
    executions.push(execution);

    // Keep last 1000 executions
    if (executions.length > 1000) {
      executions.shift();
    }

    localStorage.setItem('schedule_executions', JSON.stringify(executions));
  } catch {
    // Ignore storage errors
  }

  // Update schedule's last execution and next execution times
  updateSchedule(schedule.id, {
    lastExecutedAt: new Date(),
    nextExecutionAt: calculateNextExecution(schedule),
  });
}

/**
 * Get execution history
 */
export function getExecutionHistory(scheduleId?: string, limit: number = 50): ScheduleExecution[] {
  try {
    const executions = JSON.parse(localStorage.getItem('schedule_executions') || '[]') as ScheduleExecution[];

    let filtered = executions
      .map((e) => ({
        ...e,
        executedAt: new Date(e.executedAt),
      }))
      .reverse();

    if (scheduleId) {
      filtered = filtered.filter((e) => e.scheduleId === scheduleId);
    }

    return filtered.slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * Duplicate a schedule
 */
export function duplicateSchedule(id: string, newName?: string): OrderSchedule | null {
  const schedule = getScheduleById(id);
  if (!schedule) return null;

  const duplicated = createSchedule({
    ...schedule,
    id: undefined as any,
    createdAt: undefined as any,
    updatedAt: undefined as any,
    nextExecutionAt: undefined as any,
    name: newName || `${schedule.name} (copy)`,
    lastExecutedAt: undefined,
  });

  saveSchedule(duplicated);
  return duplicated;
}

/**
 * Get schedule statistics
 */
export function getScheduleStats(): {
  total: number;
  active: number;
  inactive: number;
  byFrequency: Record<ScheduleFrequency, number>;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
} {
  const schedules = getAllSchedules();
  const executions = JSON.parse(localStorage.getItem('schedule_executions') || '[]');

  const byFrequency: Record<ScheduleFrequency, number> = {
    once: 0,
    daily: 0,
    weekly: 0,
    biweekly: 0,
    monthly: 0,
    custom: 0,
  };

  let active = 0;

  schedules.forEach((s) => {
    if (s.isActive) active++;
    byFrequency[s.frequency]++;
  });

  const successfulExecutions = executions.filter((e: any) => e.status === 'success').length;
  const failedExecutions = executions.filter((e: any) => e.status === 'failed').length;

  return {
    total: schedules.length,
    active,
    inactive: schedules.length - active,
    byFrequency,
    totalExecutions: executions.length,
    successfulExecutions,
    failedExecutions,
  };
}

/**
 * Helper: Convert day names to numbers
 */
function daysOfWeekToNumbers(days: DayOfWeek[]): number[] {
  const dayMap: Record<DayOfWeek, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  return days.map((d) => dayMap[d]);
}

/**
 * Helper: Get week number of a date
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Helper: Get next weekly execution time
 */
function getNextWeeklyExecution(now: Date, dayNumbers: number[], hours: number, minutes: number): Date {
  const nextExec = new Date(now);

  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(nextExec);
    checkDate.setDate(checkDate.getDate() + i);
    checkDate.setHours(hours, minutes, 0, 0);

    if (checkDate > now && dayNumbers.includes(checkDate.getDay())) {
      return checkDate;
    }
  }

  // If no match found in current week, start from next week
  const nextWeekStart = new Date(now);
  nextWeekStart.setDate(nextWeekStart.getDate() + 7);
  nextWeekStart.setHours(0, 0, 0, 0);

  return getNextWeeklyExecution(nextWeekStart, dayNumbers, hours, minutes);
}

/**
 * Helper: Get next cron execution time
 */
function getNextCronExecution(now: Date, cron: CronPattern): Date {
  // Simple cron pattern matching - checks next 24 hours
  const nextExec = new Date(now);
  nextExec.setSeconds(0, 0);

  for (let i = 0; i < 24 * 60; i++) {
    nextExec.setMinutes(nextExec.getMinutes() + 1);

    if (matchesCronPattern(nextExec, cron)) {
      return nextExec;
    }
  }

  // Fallback to 1 hour from now
  return new Date(now.getTime() + 60 * 60 * 1000);
}

/**
 * Helper: Check if date matches cron pattern
 */
function matchesCronPattern(date: Date, cron: CronPattern): boolean {
  return (
    matchesCronField(date.getMinutes(), cron.minute) &&
    matchesCronField(date.getHours(), cron.hour) &&
    matchesCronField(date.getDate(), cron.dayOfMonth) &&
    matchesCronField(date.getMonth() + 1, cron.month) &&
    matchesCronField(date.getDay(), cron.dayOfWeek)
  );
}

/**
 * Helper: Match single cron field
 */
function matchesCronField(value: number, field: number | string): boolean {
  if (field === '*') return true;
  if (typeof field === 'number') return value === field;

  // Handle comma-separated values
  if (field.includes(',')) {
    return field.split(',').some((f) => matchesCronField(value, parseInt(f)));
  }

  // Handle ranges
  if (field.includes('-')) {
    const [start, end] = field.split('-').map(Number);
    return value >= start && value <= end;
  }

  // Handle step values
  if (field.includes('/')) {
    const [range, step] = field.split('/');
    const stepNum = parseInt(step);

    if (range === '*') {
      return value % stepNum === 0;
    }

    const [start] = range.split('-').map(Number);
    return value >= start && (value - start) % stepNum === 0;
  }

  return value === parseInt(field);
}
