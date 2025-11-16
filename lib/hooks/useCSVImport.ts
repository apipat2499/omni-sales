import { useState, useCallback } from 'react';
import {
  readCSVFile,
  validateCSVFile,
  importFromCSV,
  CSVImportResult,
  ImportOptions,
} from '@/lib/utils/csv-import';
import type { OrderItem } from '@/types';

interface UseCSVImportOptions extends ImportOptions {
  onSuccess?: (items: Omit<OrderItem, 'id'>[]) => void;
  onError?: (error: string) => void;
}

/**
 * Hook for CSV import operations
 */
export function useCSVImport(options: UseCSVImportOptions = {}) {
  const { onSuccess, onError, ...importOptions } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CSVImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const importFile = useCallback(
    async (file: File) => {
      setIsLoading(true);
      setError(null);
      setResult(null);

      try {
        // Validate file
        const validation = validateCSVFile(file);
        if (!validation.valid) {
          const errorMsg = validation.error || 'Invalid file';
          setError(errorMsg);
          onError?.(errorMsg);
          setIsLoading(false);
          return null;
        }

        // Read file
        const csvString = await readCSVFile(file);

        // Import
        const importResult = importFromCSV(csvString, importOptions);
        setResult(importResult);

        if (importResult.success) {
          onSuccess?.(importResult.items);
        } else if (!importOptions.skipErrors) {
          const errorMsg =
            importResult.errors[0]?.message ||
            'Import failed with errors';
          setError(errorMsg);
          onError?.(errorMsg);
        }

        return importResult;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Failed to import file';
        setError(errorMsg);
        onError?.(errorMsg);
        setIsLoading(false);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [importOptions, onSuccess, onError]
  );

  const importCSV = useCallback(
    async (csvString: string) => {
      setIsLoading(true);
      setError(null);
      setResult(null);

      try {
        const importResult = importFromCSV(csvString, importOptions);
        setResult(importResult);

        if (importResult.success) {
          onSuccess?.(importResult.items);
        } else if (!importOptions.skipErrors) {
          const errorMsg =
            importResult.errors[0]?.message ||
            'Import failed with errors';
          setError(errorMsg);
          onError?.(errorMsg);
        }

        return importResult;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Failed to import CSV';
        setError(errorMsg);
        onError?.(errorMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [importOptions, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setIsLoading(false);
    setResult(null);
    setError(null);
  }, []);

  return {
    importFile,
    importCSV,
    isLoading,
    result,
    error,
    reset,
    hasErrors: (result?.errorCount || 0) > 0,
    hasWarnings: (result?.warnings.length || 0) > 0,
  };
}

/**
 * Hook for bulk import with preview
 */
export function useBulkImport() {
  const { importFile, importCSV, ...rest } = useCSVImport();
  const [preview, setPreview] = useState<Omit<OrderItem, 'id'>[] | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const generatePreview = useCallback(
    async (file: File) => {
      setPreview(null);
      setPreviewError(null);

      try {
        const validation = validateCSVFile(file);
        if (!validation.valid) {
          setPreviewError(validation.error);
          return;
        }

        const csvString = await readCSVFile(file);
        const result = importFromCSV(csvString);

        if (result.success) {
          setPreview(result.items);
        } else {
          setPreviewError(
            result.errors[0]?.message || 'Failed to generate preview'
          );
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Failed to generate preview';
        setPreviewError(errorMsg);
      }
    },
    []
  );

  const clearPreview = useCallback(() => {
    setPreview(null);
    setPreviewError(null);
  }, []);

  return {
    importFile,
    importCSV,
    generatePreview,
    preview,
    previewError,
    clearPreview,
    ...rest,
  };
}
