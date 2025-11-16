import { useState, useCallback, useEffect, useRef } from 'react';
import {
  createSchedule,
  getScheduleById,
  getAllSchedules,
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
  calculateNextExecution,
  OrderSchedule,
  ScheduleFrequency,
  ScheduleExecution,
  type DayOfWeek,
  type CronPattern,
} from '@/lib/utils/order-scheduling';
import type { OrderItem } from '@/types';

interface UseOrderSchedulingOptions {
  onScheduleExecuted?: (schedule: OrderSchedule, items: OrderItem[]) => void;
  pollInterval?: number;
  autoExecute?: boolean;
}

/**
 * Hook for managing order schedules
 */
export function useOrderScheduling(options: UseOrderSchedulingOptions = {}) {
  const {
    onScheduleExecuted,
    pollInterval = 60000, // Check every minute
    autoExecute = false,
  } = options;

  const [schedules, setSchedules] = useState<OrderSchedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<OrderSchedule | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState(getScheduleStats());

  const pollIntervalRef = useRef<NodeJS.Timeout>();

  // Load schedules on mount
  useEffect(() => {
    loadSchedules();
  }, []);

  // Setup polling for pending schedules
  useEffect(() => {
    if (!autoExecute) return;

    const checkAndExecute = () => {
      try {
        const pending = getPendingSchedules();

        pending.forEach((schedule) => {
          try {
            recordExecution(schedule, 'success');
            onScheduleExecuted?.(schedule, schedule.items);

            // Reload schedules to reflect updated state
            loadSchedules();
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to execute schedule';
            recordExecution(schedule, 'failed', message);
          }
        });
      } catch (err) {
        console.error('Error checking pending schedules:', err);
      }
    };

    pollIntervalRef.current = setInterval(checkAndExecute, pollInterval);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [autoExecute, pollInterval, onScheduleExecuted]);

  const loadSchedules = useCallback(() => {
    setIsLoading(true);
    try {
      const loaded = getAllSchedules();
      setSchedules(loaded);
      setStats(getScheduleStats());
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load schedules';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createNewSchedule = useCallback(
    (scheduleData: Omit<OrderSchedule, 'id' | 'createdAt' | 'updatedAt' | 'nextExecutionAt'>) => {
      try {
        const newSchedule = createSchedule(scheduleData);
        saveSchedule(newSchedule);
        loadSchedules();
        return newSchedule;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create schedule';
        setError(message);
        return null;
      }
    },
    [loadSchedules]
  );

  const updateExistingSchedule = useCallback(
    (id: string, updates: Partial<Omit<OrderSchedule, 'id' | 'createdAt'>>) => {
      try {
        const updated = updateSchedule(id, updates);
        if (updated) {
          if (selectedSchedule?.id === id) {
            setSelectedSchedule(updated);
          }
          loadSchedules();
          return updated;
        }
        return null;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update schedule';
        setError(message);
        return null;
      }
    },
    [selectedSchedule?.id, loadSchedules]
  );

  const deleteExistingSchedule = useCallback(
    (id: string) => {
      try {
        const success = deleteSchedule(id);
        if (success) {
          if (selectedSchedule?.id === id) {
            setSelectedSchedule(null);
          }
          loadSchedules();
        }
        return success;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete schedule';
        setError(message);
        return false;
      }
    },
    [selectedSchedule?.id, loadSchedules]
  );

  const searchSchedulesLocal = useCallback((query: string) => {
    try {
      return searchSchedules(query);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to search schedules';
      setError(message);
      return [];
    }
  }, []);

  const getSchedulesByTagLocal = useCallback((tag: string) => {
    try {
      return getSchedulesByTag(tag);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get schedules by tag';
      setError(message);
      return [];
    }
  }, []);

  const getAllTags = useCallback(() => {
    try {
      return getAllScheduleTags();
    } catch {
      return [];
    }
  }, []);

  const toggleScheduleActive = useCallback(
    (id: string) => {
      const schedule = getScheduleById(id);
      if (schedule) {
        return updateExistingSchedule(id, {
          isActive: !schedule.isActive,
        });
      }
      return null;
    },
    [updateExistingSchedule]
  );

  const duplicateExistingSchedule = useCallback(
    (id: string, newName?: string) => {
      try {
        const duplicated = duplicateSchedule(id, newName);
        if (duplicated) {
          loadSchedules();
          return duplicated;
        }
        return null;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to duplicate schedule';
        setError(message);
        return null;
      }
    },
    [loadSchedules]
  );

  const executeScheduleManually = useCallback(
    (id: string) => {
      try {
        const schedule = getScheduleById(id);
        if (!schedule) return false;

        recordExecution(schedule, 'success');
        onScheduleExecuted?.(schedule, schedule.items);
        loadSchedules();
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to execute schedule';
        setError(message);
        return false;
      }
    },
    [loadSchedules, onScheduleExecuted]
  );

  const getExecutionHistoryForSchedule = useCallback((scheduleId: string) => {
    try {
      return getExecutionHistory(scheduleId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get execution history';
      setError(message);
      return [];
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Data
    schedules,
    selectedSchedule,
    stats,

    // State
    isLoading,
    error,

    // Actions
    createNewSchedule,
    updateExistingSchedule,
    deleteExistingSchedule,
    searchSchedulesLocal,
    getSchedulesByTagLocal,
    getAllTags,
    toggleScheduleActive,
    duplicateExistingSchedule,
    executeScheduleManually,
    getExecutionHistoryForSchedule,

    // Selection
    setSelectedSchedule,

    // Utility
    refresh: loadSchedules,
    clearError,

    // Computed
    activeSchedules: schedules.filter((s) => s.isActive),
    inactiveSchedules: schedules.filter((s) => !s.isActive),
    pendingSchedules: getPendingSchedules(),
  };
}

/**
 * Hook for building schedule creation form
 */
export function useScheduleBuilder(templateId?: string) {
  const [formData, setFormData] = useState<Omit<OrderSchedule, 'id' | 'createdAt' | 'updatedAt' | 'nextExecutionAt'>>({
    name: '',
    description: '',
    templateId,
    items: [],
    frequency: 'daily',
    startDate: new Date(),
    time: '09:00',
    isActive: true,
    daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = useCallback(
    <K extends keyof typeof formData>(field: K, value: (typeof formData)[K]) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Clear error for this field
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    },
    []
  );

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = 'Schedule name is required';
    }

    if (formData.items.length === 0) {
      newErrors.items = 'At least one item is required';
    }

    if (!formData.time.match(/^\d{2}:\d{2}$/)) {
      newErrors.time = 'Invalid time format (HH:mm)';
    }

    if (formData.frequency === 'weekly' && (!formData.daysOfWeek || formData.daysOfWeek.length === 0)) {
      newErrors.daysOfWeek = 'At least one day must be selected for weekly schedules';
    }

    if (formData.frequency === 'monthly' && !formData.dayOfMonth) {
      newErrors.dayOfMonth = 'Day of month is required for monthly schedules';
    }

    if (formData.dayOfMonth && (formData.dayOfMonth < 1 || formData.dayOfMonth > 28)) {
      newErrors.dayOfMonth = 'Day of month must be between 1 and 28';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const reset = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      templateId,
      items: [],
      frequency: 'daily',
      startDate: new Date(),
      time: '09:00',
      isActive: true,
      daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    });
    setErrors({});
  }, [templateId]);

  return {
    formData,
    errors,
    updateField,
    validateForm,
    reset,
    isValid: Object.keys(errors).length === 0,
  };
}

/**
 * Hook for viewing schedule details and execution history
 */
export function useScheduleDetails(scheduleId: string) {
  const [schedule, setSchedule] = useState<OrderSchedule | null>(null);
  const [executionHistory, setExecutionHistory] = useState<ScheduleExecution[]>([]);
  const [nextExecutions, setNextExecutions] = useState<Date[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadDetails = useCallback(() => {
    setIsLoading(true);
    try {
      const loaded = getScheduleById(scheduleId);
      if (loaded) {
        setSchedule(loaded);
        setExecutionHistory(getExecutionHistory(scheduleId, 20));

        // Calculate next 10 executions
        const upcoming: Date[] = [];
        let currentSchedule = { ...loaded };

        for (let i = 0; i < 10; i++) {
          const nextExec = calculateNextExecution(currentSchedule);
          if (loaded.endDate && nextExec > loaded.endDate) break;

          upcoming.push(nextExec);
          currentSchedule = {
            ...currentSchedule,
            startDate: new Date(nextExec.getTime() + 1000),
          };
        }

        setNextExecutions(upcoming);
      }
    } finally {
      setIsLoading(false);
    }
  }, [scheduleId]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  return {
    schedule,
    executionHistory,
    nextExecutions,
    isLoading,
    refresh: loadDetails,
  };
}
