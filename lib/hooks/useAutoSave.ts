'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  delay?: number; // Delay in milliseconds before auto-save (default: 2000ms)
  enabled?: boolean;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface AutoSaveState {
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  error: Error | null;
}

export function useAutoSave<T>({
  data,
  onSave,
  delay = 2000,
  enabled = true,
  onSuccess,
  onError,
}: UseAutoSaveOptions<T>) {
  const [state, setState] = useState<AutoSaveState>({
    isSaving: false,
    lastSaved: null,
    hasUnsavedChanges: false,
    error: null,
  });

  const timeoutRef = useRef<NodeJS.Timeout>();
  const previousDataRef = useRef<T>(data);
  const isMountedRef = useRef(false);

  const saveMutation = useMutation({
    mutationFn: onSave,
    onMutate: () => {
      setState((prev) => ({ ...prev, isSaving: true, error: null }));
    },
    onSuccess: () => {
      setState({
        isSaving: false,
        lastSaved: new Date(),
        hasUnsavedChanges: false,
        error: null,
      });
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      setState((prev) => ({
        ...prev,
        isSaving: false,
        error,
      }));
      if (onError) onError(error);
    },
  });

  const saveNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    saveMutation.mutate(data);
  }, [data, saveMutation]);

  useEffect(() => {
    // Skip on initial mount
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      previousDataRef.current = data;
      return;
    }

    // Skip if auto-save is disabled
    if (!enabled) {
      return;
    }

    // Check if data has changed
    const hasChanged = JSON.stringify(data) !== JSON.stringify(previousDataRef.current);

    if (hasChanged) {
      setState((prev) => ({ ...prev, hasUnsavedChanges: true }));

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout for auto-save
      timeoutRef.current = setTimeout(() => {
        saveMutation.mutate(data);
      }, delay);

      previousDataRef.current = data;
    }

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, enabled, saveMutation]);

  // Save on window unload (when user closes tab/window)
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'คุณมีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก ต้องการออกหรือไม่?';

        // Try to save synchronously before unload
        const dataToSave = JSON.stringify(data);
        navigator.sendBeacon('/api/auto-save', dataToSave);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [enabled, state.hasUnsavedChanges, data]);

  return {
    ...state,
    saveNow,
  };
}

/**
 * Auto-save status indicator component
 */
export function AutoSaveIndicator({ state }: { state: AutoSaveState }) {
  if (state.isSaving) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        กำลังบันทึก...
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        บันทึกล้มเหลว
      </div>
    );
  }

  if (state.lastSaved) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        บันทึกแล้วเมื่อ {state.lastSaved.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
      </div>
    );
  }

  if (state.hasUnsavedChanges) {
    return (
      <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
        มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก
      </div>
    );
  }

  return null;
}
