import { useState, useCallback } from 'react';
import {
  generateSalesReport,
  generateInventoryReport,
  generateProductReport,
  getAllReports,
  saveReport,
  deleteReport,
  getReportSchedules,
  saveReportSchedule,
  deleteReportSchedule,
  exportReportAsCSV,
  exportReportAsJSON,
  getReportStatistics,
  createCustomReport,
  Report,
  ReportSchedule,
  type ReportType,
  type ReportFormat,
} from '@/lib/utils/advanced-reporting';
import type { OrderItem } from '@/types';

interface UseAdvancedReportingOptions {
  autoSave?: boolean;
}

/**
 * Hook for managing reports
 */
export function useAdvancedReporting(options: UseAdvancedReportingOptions = {}) {
  const { autoSave = true } = options;

  const [reports, setReports] = useState<Report[]>(() => getAllReports());
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState(getReportStatistics());

  const loadReports = useCallback(() => {
    setIsLoading(true);
    try {
      const loaded = getAllReports();
      setReports(loaded);
      setStats(getReportStatistics());
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load reports';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateReport = useCallback(
    (type: ReportType, items: OrderItem[], startDate: Date, endDate: Date) => {
      setIsLoading(true);
      try {
        let report: Report;

        switch (type) {
          case 'sales':
            report = generateSalesReport(items, startDate, endDate);
            break;
          case 'inventory':
            report = generateInventoryReport(startDate, endDate);
            break;
          case 'product':
            report = generateProductReport(items, startDate, endDate);
            break;
          default:
            throw new Error(`Unsupported report type: ${type}`);
        }

        if (autoSave) {
          saveReport(report);
          loadReports();
        }

        setSelectedReport(report);
        return report;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to generate report';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [autoSave, loadReports]
  );

  const deleteSelectedReport = useCallback(
    (id: string) => {
      try {
        const success = deleteReport(id);
        if (success) {
          if (selectedReport?.id === id) {
            setSelectedReport(null);
          }
          loadReports();
        }
        return success;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete report';
        setError(message);
        return false;
      }
    },
    [selectedReport?.id, loadReports]
  );

  const exportReport = useCallback(
    (report: Report, format: ReportFormat) => {
      try {
        let content: string;
        let mimeType: string;

        switch (format) {
          case 'csv':
            content = exportReportAsCSV(report);
            mimeType = 'text/csv';
            break;
          case 'json':
            content = exportReportAsJSON(report);
            mimeType = 'application/json';
            break;
          default:
            throw new Error(`Unsupported format: ${format}`);
        }

        const element = document.createElement('a');
        const file = new Blob([content], { type: mimeType });
        element.href = URL.createObjectURL(file);
        element.download = `${report.name}.${format}`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to export report';
        setError(message);
        return false;
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Data
    reports,
    selectedReport,
    stats,

    // State
    isLoading,
    error,

    // Actions
    generateReport,
    deleteSelectedReport,
    exportReport,
    setSelectedReport,

    // Utility
    refresh: loadReports,
    clearError,
  };
}

/**
 * Hook for report scheduling
 */
export function useReportScheduling() {
  const [schedules, setSchedules] = useState<ReportSchedule[]>(() => getReportSchedules());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSchedules = useCallback(() => {
    setIsLoading(true);
    try {
      const loaded = getReportSchedules();
      setSchedules(loaded);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load schedules';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createSchedule = useCallback(
    (schedule: Omit<ReportSchedule, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const id = `sched_${Date.now()}`;
        const newSchedule: ReportSchedule = {
          ...schedule,
          id,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        saveReportSchedule(newSchedule);
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

  const updateSchedule = useCallback(
    (id: string, updates: Partial<Omit<ReportSchedule, 'id' | 'createdAt'>>) => {
      try {
        const schedule = schedules.find((s) => s.id === id);
        if (!schedule) return null;

        const updated: ReportSchedule = {
          ...schedule,
          ...updates,
          updatedAt: new Date(),
        };

        saveReportSchedule(updated);
        loadSchedules();
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update schedule';
        setError(message);
        return null;
      }
    },
    [schedules, loadSchedules]
  );

  const deleteSchedule = useCallback(
    (id: string) => {
      try {
        const success = deleteReportSchedule(id);
        if (success) {
          loadSchedules();
        }
        return success;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete schedule';
        setError(message);
        return false;
      }
    },
    [loadSchedules]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    schedules,
    isLoading,
    error,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    refresh: loadSchedules,
    clearError,
  };
}

/**
 * Hook for custom report builder
 */
export function useReportBuilder() {
  const [formData, setFormData] = useState({
    name: '',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    endDate: new Date(),
    metrics: [] as Array<{ name: string; value: string }>,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = useCallback(
    <K extends keyof typeof formData>(field: K, value: (typeof formData)[K]) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    },
    []
  );

  const addMetric = useCallback(() => {
    updateField('metrics', [...formData.metrics, { name: '', value: '' }]);
  }, [formData.metrics, updateField]);

  const removeMetric = useCallback(
    (index: number) => {
      updateField(
        'metrics',
        formData.metrics.filter((_, i) => i !== index)
      );
    },
    [formData.metrics, updateField]
  );

  const updateMetric = useCallback(
    (index: number, field: 'name' | 'value', value: string) => {
      const updated = [...formData.metrics];
      updated[index][field] = value;
      updateField('metrics', updated);
    },
    [formData.metrics, updateField]
  );

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = 'Report name is required';
    }

    if (formData.metrics.length === 0) {
      newErrors.metrics = 'At least one metric is required';
    }

    if (formData.startDate > formData.endDate) {
      newErrors.date = 'Start date must be before end date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const reset = useCallback(() => {
    setFormData({
      name: '',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
      metrics: [],
    });
    setErrors({});
  }, []);

  return {
    formData,
    errors,
    updateField,
    addMetric,
    removeMetric,
    updateMetric,
    validateForm,
    reset,
    isValid: Object.keys(errors).length === 0,
  };
}
