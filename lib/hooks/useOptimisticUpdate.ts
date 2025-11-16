import { useState, useCallback, useRef } from 'react';
import {
  OptimisticUpdateStack,
  DebouncedOptimisticUpdater,
  OptimisticTransaction,
} from '@/lib/utils/optimistic-updates';

interface UseOptimisticUpdateOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  timeout?: number;
  enableUndo?: boolean;
}

/**
 * Hook for optimistic updates with instant UI feedback
 */
export function useOptimisticUpdate<T>(
  initialData: T,
  apiCall: (data: Partial<T>) => Promise<T>,
  options: UseOptimisticUpdateOptions<T> = {}
) {
  const { onSuccess, onError, timeout = 30000, enableUndo = true } = options;

  const [data, setData] = useState<T>(initialData);
  const [isOptimistic, setIsOptimistic] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const undoStackRef = useRef<OptimisticUpdateStack<T> | null>(
    enableUndo ? new OptimisticUpdateStack() : null
  );

  const originalRef = useRef<T>(initialData);

  const update = useCallback(
    async (partial: Partial<T>) => {
      try {
        // Save to undo stack
        if (undoStackRef.current) {
          undoStackRef.current.push(data);
        }
        originalRef.current = data;

        // Apply optimistic update
        const optimisticData = { ...data, ...partial };
        setData(optimisticData);
        setIsOptimistic(true);
        setError(null);
        setPending(true);

        // Call API in background
        const result = await Promise.race([
          apiCall(partial),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeout)
          ),
        ]);

        // Update with server response
        setData(result);
        setIsOptimistic(false);
        onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');

        // Rollback on error
        setData(originalRef.current);
        setIsOptimistic(false);
        setError(error.message);
        onError?.(error);

        return null;
      } finally {
        setPending(false);
      }
    },
    [data, apiCall, timeout, onSuccess, onError]
  );

  const undo = useCallback(() => {
    if (!undoStackRef.current || !undoStackRef.current.canUndo()) return;

    const previousState = undoStackRef.current.undo();
    if (previousState) {
      setData(previousState);
      setError(null);
    }
  }, []);

  const redo = useCallback(() => {
    if (!undoStackRef.current || !undoStackRef.current.canRedo()) return;

    const nextState = undoStackRef.current.redo();
    if (nextState) {
      setData(nextState);
      setError(null);
    }
  }, []);

  return {
    data,
    update,
    isOptimistic,
    pending,
    error,
    canUndo: undoStackRef.current?.canUndo() ?? false,
    canRedo: undoStackRef.current?.canRedo() ?? false,
    undo: enableUndo ? undo : undefined,
    redo: enableUndo ? redo : undefined,
    clearError: () => setError(null),
  };
}

/**
 * Hook for debounced optimistic updates
 */
export function useDebouncedOptimisticUpdate<T>(
  initialData: T,
  apiCall: (data: Partial<T>) => Promise<T>,
  debounceMs: number = 500,
  options: UseOptimisticUpdateOptions<T> = {}
) {
  const { onSuccess, onError } = options;

  const [data, setData] = useState<T>(initialData);
  const [isOptimistic, setIsOptimistic] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updaterRef = useRef(new DebouncedOptimisticUpdater<T>(debounceMs));
  const originalRef = useRef<T>(initialData);

  const update = useCallback(
    async (partial: Partial<T>) => {
      originalRef.current = data;

      // Apply optimistic update
      const optimisticData = { ...data, ...partial };
      setData(optimisticData);
      setIsOptimistic(true);
      setError(null);

      // Queue for debounced API call
      return updaterRef.current.queue(
        partial,
        () => {
          setPending(true);
        },
        async () => {
          try {
            const result = await apiCall(updaterRef.current.getPending() || partial);
            setData(result);
            setIsOptimistic(false);
            onSuccess?.(result);
            return result;
          } catch (err) {
            const error = err instanceof Error ? err : new Error('Unknown error');
            setData(originalRef.current);
            setIsOptimistic(false);
            setError(error.message);
            onError?.(error);
            return null;
          } finally {
            setPending(false);
          }
        }
      );
    },
    [data, apiCall, onSuccess, onError]
  );

  const flush = useCallback(async () => {
    const result = await updaterRef.current.flush(() => apiCall(updaterRef.current.getPending() || {}));
    if (result) {
      setData(result);
      setIsOptimistic(false);
      onSuccess?.(result);
    }
    return result;
  }, [apiCall, onSuccess]);

  const cancel = useCallback(() => {
    updaterRef.current.cancel();
    setData(originalRef.current);
    setIsOptimistic(false);
  }, []);

  return {
    data,
    update,
    flush,
    cancel,
    isOptimistic,
    pending,
    error,
    clearError: () => setError(null),
  };
}

/**
 * Hook for transaction-based optimistic updates
 */
export function useOptimisticTransaction<T>(
  initialData: T,
  onCommit: (changes: Partial<T>) => Promise<T>,
  options: UseOptimisticUpdateOptions<T> = {}
) {
  const { onSuccess, onError } = options;

  const [data, setData] = useState<T>(initialData);
  const [isOptimistic, setIsOptimistic] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transactionRef = useRef<OptimisticTransaction<T> | null>(null);

  const begin = useCallback(() => {
    transactionRef.current = new OptimisticTransaction(data);
  }, [data]);

  const update = useCallback((partial: Partial<T>) => {
    if (!transactionRef.current) {
      throw new Error('Transaction not started. Call begin() first.');
    }

    transactionRef.current.update(partial);
    const current = transactionRef.current.getCurrent();
    setData(current);
    setIsOptimistic(true);
  }, []);

  const commit = useCallback(async () => {
    if (!transactionRef.current) {
      throw new Error('No transaction in progress');
    }

    try {
      const changes = transactionRef.current.getChanges();
      if (Object.keys(changes).length === 0) {
        return;
      }

      setPending(true);
      setError(null);

      const result = await onCommit(changes);
      setData(result);
      setIsOptimistic(false);
      transactionRef.current = null;

      onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');

      // Rollback
      if (transactionRef.current) {
        const original = transactionRef.current.rollback();
        setData(original);
      }

      setIsOptimistic(false);
      setError(error.message);
      onError?.(error);
      transactionRef.current = null;

      return null;
    } finally {
      setPending(false);
    }
  }, [onCommit, onSuccess, onError]);

  const rollback = useCallback(() => {
    if (!transactionRef.current) return;

    const original = transactionRef.current.rollback();
    setData(original);
    setIsOptimistic(false);
    setError(null);
    transactionRef.current = null;
  }, []);

  return {
    data,
    begin,
    update,
    commit,
    rollback,
    isOptimistic,
    pending,
    error,
    hasChanges: transactionRef.current?.hasChanges() ?? false,
    changeCount: transactionRef.current?.getChangeCount() ?? 0,
    clearError: () => setError(null),
  };
}

/**
 * Hook for batch optimistic updates
 */
export function useBatchOptimisticUpdate<T extends { id: string }>(
  initialItems: T[],
  apiCall: (id: string, data: Partial<T>) => Promise<T>,
  options: UseOptimisticUpdateOptions<T[]> = {}
) {
  const { onSuccess, onError } = options;

  const [items, setItems] = useState<T[]>(initialItems);
  const [isOptimistic, setIsOptimistic] = useState(false);
  const [pending, setPending] = useState<string[]>([]);
  const [error, setError] = useState<Record<string, string>>({});

  const originalRef = useRef<T[]>(initialItems);

  const updateItem = useCallback(
    async (id: string, partial: Partial<T>) => {
      // Find and update item optimistically
      const updated = items.map((item) =>
        item.id === id ? { ...item, ...partial } : item
      );

      originalRef.current = items;
      setItems(updated);
      setIsOptimistic(true);
      setPending((prev) => [...prev, id]);

      try {
        const result = await apiCall(id, partial);

        // Replace with server response
        setItems((prev) =>
          prev.map((item) => (item.id === id ? result : item))
        );
        setIsOptimistic(false);
        setPending((prev) => prev.filter((pid) => pid !== id));

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');

        // Rollback
        setItems(originalRef.current);
        setIsOptimistic(false);
        setPending((prev) => prev.filter((pid) => pid !== id));
        setError((prev) => ({ ...prev, [id]: error.message }));
        onError?.(error);

        return null;
      }
    },
    [items, apiCall, onError]
  );

  const clearError = useCallback((id?: string) => {
    if (id) {
      setError((prev) => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
    } else {
      setError({});
    }
  }, []);

  return {
    items,
    updateItem,
    isOptimistic,
    pending,
    error,
    isPending: (id: string) => pending.includes(id),
    hasError: (id: string) => !!error[id],
    getError: (id: string) => error[id] || null,
    clearError,
  };
}
