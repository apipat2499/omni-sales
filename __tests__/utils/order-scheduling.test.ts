/**
 * Order Scheduling Tests
 * Tests for recurring orders, schedule management, and execution
 */

import {
  createSchedule,
  calculateNextExecution,
  shouldExecuteSchedule,
  getUpcomingExecutions,
  getAllSchedules,
  getScheduleById,
  getPendingSchedules,
  saveSchedule,
  updateSchedule,
  deleteSchedule,
  searchSchedules,
  getSchedulesByTag,
  getAllScheduleTags,
  recordExecution,
  getExecutionHistory,
  duplicateSchedule,
  getScheduleStats,
} from '@/lib/utils/order-scheduling';
import { createMockOrderSchedule, createMockOrderItem } from '../factories';

describe('Order Scheduling', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-11-16T09:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('createSchedule', () => {
    it('should create schedule with all required fields', () => {
      const now = new Date();
      const schedule = createSchedule({
        name: 'Daily Order',
        items: [createMockOrderItem()],
        frequency: 'daily',
        startDate: now,
        time: '09:00',
        isActive: true,
      });

      expect(schedule.id).toBeDefined();
      expect(schedule.createdAt).toBeInstanceOf(Date);
      expect(schedule.updatedAt).toBeInstanceOf(Date);
      expect(schedule.nextExecutionAt).toBeDefined();
    });

    it('should calculate next execution time on creation', () => {
      const schedule = createSchedule({
        name: 'Test',
        items: [],
        frequency: 'daily',
        startDate: new Date('2024-11-16T08:00:00Z'),
        time: '10:00',
        isActive: true,
      });

      expect(schedule.nextExecutionAt).toBeDefined();
    });
  });

  describe('calculateNextExecution', () => {
    describe('once frequency', () => {
      it('should return start date for future once schedule', () => {
        const schedule = {
          frequency: 'once' as const,
          startDate: new Date('2024-11-17T10:00:00Z'),
          time: '10:00',
        };

        const next = calculateNextExecution(schedule);

        expect(next.getTime()).toBeGreaterThan(Date.now());
      });
    });

    describe('daily frequency', () => {
      it('should calculate next daily execution for same day future time', () => {
        const schedule = {
          frequency: 'daily' as const,
          startDate: new Date('2024-11-16T08:00:00Z'),
          time: '14:00',
        };

        const next = calculateNextExecution(schedule);

        expect(next.getHours()).toBe(14);
        expect(next.getMinutes()).toBe(0);
      });

      it('should calculate next daily execution for next day if time passed', () => {
        const schedule = {
          frequency: 'daily' as const,
          startDate: new Date('2024-11-16T08:00:00Z'),
          time: '08:00',
        };

        const next = calculateNextExecution(schedule);

        expect(next.getDate()).toBe(17);
      });
    });

    describe('weekly frequency', () => {
      it('should calculate next weekly execution', () => {
        const schedule = {
          frequency: 'weekly' as const,
          startDate: new Date('2024-11-16T08:00:00Z'),
          time: '10:00',
          daysOfWeek: ['monday' as const],
        };

        const next = calculateNextExecution(schedule);

        expect(next.getDay()).toBe(1); // Monday
      });

      it('should handle multiple days of week', () => {
        const schedule = {
          frequency: 'weekly' as const,
          startDate: new Date('2024-11-16T08:00:00Z'),
          time: '10:00',
          daysOfWeek: ['monday' as const, 'wednesday' as const, 'friday' as const],
        };

        const next = calculateNextExecution(schedule);

        expect([1, 3, 5]).toContain(next.getDay());
      });
    });

    describe('monthly frequency', () => {
      it('should calculate next monthly execution', () => {
        const schedule = {
          frequency: 'monthly' as const,
          startDate: new Date('2024-11-16T08:00:00Z'),
          time: '10:00',
          dayOfMonth: 15,
        };

        const next = calculateNextExecution(schedule);

        expect(next.getDate()).toBe(15);
      });

      it('should move to next month if day already passed', () => {
        const schedule = {
          frequency: 'monthly' as const,
          startDate: new Date('2024-11-16T08:00:00Z'),
          time: '10:00',
          dayOfMonth: 10,
        };

        const next = calculateNextExecution(schedule);

        expect(next.getMonth()).toBe(11); // December
      });
    });
  });

  describe('shouldExecuteSchedule', () => {
    it('should return true when execution time has arrived', () => {
      const schedule = createMockOrderSchedule({
        isActive: true,
        startDate: new Date('2024-11-15T00:00:00Z'),
        nextExecutionAt: new Date('2024-11-16T09:00:00Z'),
      });

      const should = shouldExecuteSchedule(schedule);

      expect(should).toBe(true);
    });

    it('should return false for inactive schedule', () => {
      const schedule = createMockOrderSchedule({
        isActive: false,
        nextExecutionAt: new Date('2024-11-16T09:00:00Z'),
      });

      const should = shouldExecuteSchedule(schedule);

      expect(should).toBe(false);
    });

    it('should return false if start date not reached', () => {
      const schedule = createMockOrderSchedule({
        isActive: true,
        startDate: new Date('2024-11-17T00:00:00Z'),
      });

      const should = shouldExecuteSchedule(schedule);

      expect(should).toBe(false);
    });

    it('should return false if end date passed', () => {
      const schedule = createMockOrderSchedule({
        isActive: true,
        startDate: new Date('2024-11-01T00:00:00Z'),
        endDate: new Date('2024-11-15T00:00:00Z'),
      });

      const should = shouldExecuteSchedule(schedule);

      expect(should).toBe(false);
    });

    it('should handle 1-minute window for execution', () => {
      const schedule = createMockOrderSchedule({
        isActive: true,
        nextExecutionAt: new Date('2024-11-16T08:59:30Z'),
      });

      const should = shouldExecuteSchedule(schedule, new Date('2024-11-16T09:00:00Z'));

      expect(should).toBe(true);
    });
  });

  describe('getUpcomingExecutions', () => {
    it('should return list of upcoming executions', () => {
      const schedule = createMockOrderSchedule({
        frequency: 'daily',
        startDate: new Date('2024-11-16T08:00:00Z'),
        time: '10:00',
      });

      const upcoming = getUpcomingExecutions(schedule, 5);

      expect(upcoming).toHaveLength(5);
    });

    it('should respect end date', () => {
      const schedule = createMockOrderSchedule({
        frequency: 'daily',
        startDate: new Date('2024-11-16T08:00:00Z'),
        endDate: new Date('2024-11-18T00:00:00Z'),
        time: '10:00',
      });

      const upcoming = getUpcomingExecutions(schedule, 10);

      expect(upcoming.length).toBeLessThan(10);
    });

    it('should default to 10 executions', () => {
      const schedule = createMockOrderSchedule({
        frequency: 'daily',
        startDate: new Date('2024-11-16T08:00:00Z'),
        time: '10:00',
      });

      const upcoming = getUpcomingExecutions(schedule);

      expect(upcoming).toHaveLength(10);
    });
  });

  describe('saveSchedule and getSchedule', () => {
    it('should save and retrieve schedule', () => {
      const schedule = createMockOrderSchedule({ name: 'Test Schedule' });

      saveSchedule(schedule);
      const retrieved = getScheduleById(schedule.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.name).toBe('Test Schedule');
    });

    it('should update existing schedule', () => {
      const schedule = createMockOrderSchedule({ name: 'Original' });

      saveSchedule(schedule);
      saveSchedule({ ...schedule, name: 'Updated' });

      const schedules = getAllSchedules();

      expect(schedules).toHaveLength(1);
      expect(schedules[0].name).toBe('Updated');
    });

    it('should limit to 200 schedules', () => {
      for (let i = 0; i < 250; i++) {
        const schedule = createMockOrderSchedule({ name: `Schedule ${i}` });
        saveSchedule(schedule);
      }

      const schedules = getAllSchedules();

      expect(schedules.length).toBeLessThanOrEqual(200);
    });
  });

  describe('getAllSchedules', () => {
    it('should parse dates correctly', () => {
      const schedule = createMockOrderSchedule();

      saveSchedule(schedule);
      const schedules = getAllSchedules();

      expect(schedules[0].startDate).toBeInstanceOf(Date);
      expect(schedules[0].createdAt).toBeInstanceOf(Date);
    });
  });

  describe('getPendingSchedules', () => {
    it('should return schedules ready for execution', () => {
      const pending = createMockOrderSchedule({
        isActive: true,
        startDate: new Date('2024-11-15T00:00:00Z'),
        nextExecutionAt: new Date('2024-11-16T09:00:00Z'),
      });

      const future = createMockOrderSchedule({
        isActive: true,
        startDate: new Date('2024-11-15T00:00:00Z'),
        nextExecutionAt: new Date('2024-11-17T09:00:00Z'),
      });

      saveSchedule(pending);
      saveSchedule(future);

      const pendingSchedules = getPendingSchedules();

      expect(pendingSchedules).toHaveLength(1);
      expect(pendingSchedules[0].id).toBe(pending.id);
    });

    it('should exclude inactive schedules', () => {
      const schedule = createMockOrderSchedule({
        isActive: false,
        nextExecutionAt: new Date('2024-11-16T09:00:00Z'),
      });

      saveSchedule(schedule);

      const pending = getPendingSchedules();

      expect(pending).toHaveLength(0);
    });
  });

  describe('updateSchedule', () => {
    it('should update schedule fields', () => {
      const schedule = createMockOrderSchedule({ name: 'Original' });

      saveSchedule(schedule);
      const updated = updateSchedule(schedule.id, { name: 'Updated' });

      expect(updated).not.toBeNull();
      expect(updated!.name).toBe('Updated');
    });

    it('should recalculate next execution time', () => {
      const schedule = createMockOrderSchedule({
        frequency: 'daily',
        time: '10:00',
      });

      saveSchedule(schedule);
      const updated = updateSchedule(schedule.id, { time: '15:00' });

      expect(updated!.nextExecutionAt).not.toEqual(schedule.nextExecutionAt);
    });

    it('should return null for non-existent schedule', () => {
      const updated = updateSchedule('non-existent', { name: 'Updated' });

      expect(updated).toBeNull();
    });
  });

  describe('deleteSchedule', () => {
    it('should delete schedule', () => {
      const schedule = createMockOrderSchedule();

      saveSchedule(schedule);
      const deleted = deleteSchedule(schedule.id);

      expect(deleted).toBe(true);
      expect(getAllSchedules()).toHaveLength(0);
    });

    it('should return false for non-existent schedule', () => {
      const deleted = deleteSchedule('non-existent');

      expect(deleted).toBe(false);
    });
  });

  describe('searchSchedules', () => {
    it('should search by name', () => {
      saveSchedule(createMockOrderSchedule({ name: 'Weekly Order' }));
      saveSchedule(createMockOrderSchedule({ name: 'Monthly Order' }));
      saveSchedule(createMockOrderSchedule({ name: 'Daily Task' }));

      const results = searchSchedules('order');

      expect(results).toHaveLength(2);
    });

    it('should search by description', () => {
      saveSchedule(createMockOrderSchedule({
        name: 'Schedule 1',
        description: 'Important recurring task',
      }));

      const results = searchSchedules('important');

      expect(results).toHaveLength(1);
    });

    it('should be case-insensitive', () => {
      saveSchedule(createMockOrderSchedule({ name: 'Weekly Order' }));

      const results = searchSchedules('WEEKLY');

      expect(results).toHaveLength(1);
    });
  });

  describe('tags', () => {
    it('should get schedules by tag', () => {
      saveSchedule(createMockOrderSchedule({ tags: ['important', 'weekly'] }));
      saveSchedule(createMockOrderSchedule({ tags: ['daily'] }));

      const results = getSchedulesByTag('important');

      expect(results).toHaveLength(1);
    });

    it('should get all unique tags', () => {
      saveSchedule(createMockOrderSchedule({ tags: ['tag1', 'tag2'] }));
      saveSchedule(createMockOrderSchedule({ tags: ['tag2', 'tag3'] }));

      const tags = getAllScheduleTags();

      expect(tags).toContain('tag1');
      expect(tags).toContain('tag2');
      expect(tags).toContain('tag3');
      expect(tags).toHaveLength(3);
    });

    it('should return sorted tags', () => {
      saveSchedule(createMockOrderSchedule({ tags: ['zebra', 'alpha', 'beta'] }));

      const tags = getAllScheduleTags();

      expect(tags[0]).toBe('alpha');
      expect(tags[tags.length - 1]).toBe('zebra');
    });
  });

  describe('recordExecution', () => {
    it('should record schedule execution', () => {
      const schedule = createMockOrderSchedule();

      saveSchedule(schedule);
      recordExecution(schedule, 'success');

      const history = getExecutionHistory(schedule.id);

      expect(history.length).toBeGreaterThan(0);
      expect(history[0].status).toBe('success');
    });

    it('should record error message on failure', () => {
      const schedule = createMockOrderSchedule();

      saveSchedule(schedule);
      recordExecution(schedule, 'failed', 'Network error');

      const history = getExecutionHistory(schedule.id);

      expect(history[0].errorMessage).toBe('Network error');
    });

    it('should update schedule execution times', () => {
      const schedule = createMockOrderSchedule();

      saveSchedule(schedule);
      recordExecution(schedule, 'success');

      const updated = getScheduleById(schedule.id);

      expect(updated!.lastExecutedAt).toBeDefined();
    });
  });

  describe('getExecutionHistory', () => {
    it('should get execution history for schedule', () => {
      const schedule = createMockOrderSchedule();

      saveSchedule(schedule);
      recordExecution(schedule, 'success');
      recordExecution(schedule, 'success');

      const history = getExecutionHistory(schedule.id);

      expect(history).toHaveLength(2);
    });

    it('should limit history by parameter', () => {
      const schedule = createMockOrderSchedule();

      saveSchedule(schedule);

      for (let i = 0; i < 10; i++) {
        recordExecution(schedule, 'success');
      }

      const history = getExecutionHistory(schedule.id, 5);

      expect(history).toHaveLength(5);
    });

    it('should return most recent first', () => {
      const schedule = createMockOrderSchedule();

      saveSchedule(schedule);
      recordExecution(schedule, 'success');
      jest.advanceTimersByTime(1000);
      recordExecution(schedule, 'failed');

      const history = getExecutionHistory(schedule.id);

      expect(history[0].status).toBe('failed');
    });
  });

  describe('duplicateSchedule', () => {
    it('should duplicate schedule', () => {
      const schedule = createMockOrderSchedule({ name: 'Original' });

      saveSchedule(schedule);
      const duplicate = duplicateSchedule(schedule.id);

      expect(duplicate).not.toBeNull();
      expect(duplicate!.id).not.toBe(schedule.id);
      expect(duplicate!.name).toBe('Original (copy)');
    });

    it('should use custom name if provided', () => {
      const schedule = createMockOrderSchedule({ name: 'Original' });

      saveSchedule(schedule);
      const duplicate = duplicateSchedule(schedule.id, 'Custom Name');

      expect(duplicate!.name).toBe('Custom Name');
    });

    it('should reset execution times', () => {
      const schedule = createMockOrderSchedule();

      saveSchedule(schedule);
      recordExecution(schedule, 'success');

      const duplicate = duplicateSchedule(schedule.id);

      expect(duplicate!.lastExecutedAt).toBeUndefined();
    });

    it('should return null for non-existent schedule', () => {
      const duplicate = duplicateSchedule('non-existent');

      expect(duplicate).toBeNull();
    });
  });

  describe('getScheduleStats', () => {
    it('should calculate schedule statistics', () => {
      saveSchedule(createMockOrderSchedule({ isActive: true, frequency: 'daily' }));
      saveSchedule(createMockOrderSchedule({ isActive: false, frequency: 'weekly' }));
      saveSchedule(createMockOrderSchedule({ isActive: true, frequency: 'daily' }));

      const stats = getScheduleStats();

      expect(stats.total).toBe(3);
      expect(stats.active).toBe(2);
      expect(stats.inactive).toBe(1);
      expect(stats.byFrequency.daily).toBe(2);
      expect(stats.byFrequency.weekly).toBe(1);
    });

    it('should include execution statistics', () => {
      const schedule = createMockOrderSchedule();

      saveSchedule(schedule);
      recordExecution(schedule, 'success');
      recordExecution(schedule, 'failed');

      const stats = getScheduleStats();

      expect(stats.totalExecutions).toBe(2);
      expect(stats.successfulExecutions).toBe(1);
      expect(stats.failedExecutions).toBe(1);
    });
  });
});
