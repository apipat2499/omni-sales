/**
 * Optimistic updates utilities
 * Provides instant UI feedback while API requests are in progress
 */

export type OptimisticState<T> = {
  data: T;
  isOptimistic: boolean;
  pending: boolean;
  error: string | null;
};

export interface OptimisticUpdateOptions<T, U = T> {
  /**
   * Function to transform optimistic data for display
   */
  optimisticTransform?: (previous: T, update: Partial<T>) => U;

  /**
   * Rollback strategy on error
   */
  rollbackStrategy?: 'revert' | 'retry' | 'manual';

  /**
   * Timeout for optimistic update (ms)
   */
  timeout?: number;

  /**
   * Custom error message
   */
  getErrorMessage?: (error: Error) => string;
}

/**
 * Create optimistic update transaction
 */
export async function createOptimisticUpdate<T>(
  onOptimistic: (update: Partial<T>) => void,
  apiCall: () => Promise<T>,
  onSuccess: (data: T) => void,
  onError: (error: Error) => void,
  options: OptimisticUpdateOptions<T> = {}
): Promise<T | null> {
  const { timeout = 30000, rollbackStrategy = 'revert' } = options;

  try {
    // Start API call in background
    const promise = Promise.race([
      apiCall(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Request timeout')),
          timeout
        )
      ),
    ]);

    // Execute API call
    const result = await promise;
    onSuccess(result);
    return result;
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');

    if (rollbackStrategy === 'revert') {
      onError(err);
    } else if (rollbackStrategy === 'retry') {
      // Will be retried by caller
      onError(err);
    }

    return null;
  }
}

/**
 * Batch optimistic updates
 */
export async function batchOptimisticUpdates<T>(
  updates: Array<{
    id: string;
    data: Partial<T>;
    apiCall: () => Promise<T>;
    onOptimistic: (data: Partial<T>) => void;
  }>,
  onBatchSuccess: (results: T[]) => void,
  onBatchError: (errors: Record<string, Error>) => void
): Promise<(T | null)[]> {
  const results: (T | null)[] = [];
  const errors: Record<string, Error> = {};

  // Apply all optimistic updates immediately
  updates.forEach((update) => {
    update.onOptimistic(update.data);
  });

  // Execute API calls in parallel
  const promises = updates.map((update) =>
    update
      .apiCall()
      .then((result) => {
        results.push(result);
        return result;
      })
      .catch((error) => {
        const err = error instanceof Error ? error : new Error('Unknown error');
        errors[update.id] = err;
        results.push(null);
        return null;
      })
  );

  await Promise.all(promises);

  if (Object.keys(errors).length === 0) {
    onBatchSuccess(results.filter((r) => r !== null) as T[]);
  } else {
    onBatchError(errors);
  }

  return results;
}

/**
 * Undo/Redo stack for optimistic updates
 */
export class OptimisticUpdateStack<T> {
  private undoStack: T[] = [];
  private redoStack: T[] = [];
  private maxStackSize = 50;

  push(state: T): void {
    this.undoStack.push(state);
    this.redoStack = []; // Clear redo stack on new change

    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift();
    }
  }

  undo(): T | null {
    if (this.undoStack.length === 0) return null;

    const current = this.undoStack.pop();
    if (current) {
      this.redoStack.push(current);
    }

    return this.undoStack[this.undoStack.length - 1] || null;
  }

  redo(): T | null {
    if (this.redoStack.length === 0) return null;

    const state = this.redoStack.pop();
    if (state) {
      this.undoStack.push(state);
    }

    return state || null;
  }

  canUndo(): boolean {
    return this.undoStack.length > 1;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  getSize(): number {
    return this.undoStack.length;
  }
}

/**
 * Optimistic operation result
 */
export interface OptimisticResult<T> {
  data: T;
  isOptimistic: boolean;
  timestamp: Date;
}

/**
 * Debounced optimistic updates (for rapid successive updates)
 */
export class DebouncedOptimisticUpdater<T> {
  private pendingUpdate: Partial<T> | null = null;
  private timeoutId: NodeJS.Timeout | null = null;
  private debounceMs: number;

  constructor(debounceMs: number = 500) {
    this.debounceMs = debounceMs;
  }

  /**
   * Queue an optimistic update
   */
  queue(
    update: Partial<T>,
    onOptimistic: (data: Partial<T>) => void,
    apiCall: () => Promise<T>
  ): Promise<T | null> {
    return new Promise((resolve) => {
      // Clear previous timeout
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }

      // Merge with pending update
      this.pendingUpdate = {
        ...this.pendingUpdate,
        ...update,
      };

      // Schedule execution
      this.timeoutId = setTimeout(async () => {
        if (this.pendingUpdate) {
          onOptimistic(this.pendingUpdate);

          try {
            const result = await apiCall();
            this.pendingUpdate = null;
            resolve(result);
          } catch (error) {
            resolve(null);
          }
        }
      }, this.debounceMs);
    });
  }

  /**
   * Clear pending updates
   */
  cancel(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.pendingUpdate = null;
  }

  /**
   * Get pending update
   */
  getPending(): Partial<T> | null {
    return this.pendingUpdate;
  }

  /**
   * Force execute pending update
   */
  async flush(apiCall: () => Promise<T>): Promise<T | null> {
    this.cancel();

    if (this.pendingUpdate) {
      try {
        return await apiCall();
      } catch (error) {
        return null;
      }
    }

    return null;
  }
}

/**
 * Conflict resolution for concurrent updates
 */
export type ConflictResolutionStrategy = 'local-wins' | 'remote-wins' | 'merge';

export function resolveConflict<T>(
  local: T,
  remote: T,
  strategy: ConflictResolutionStrategy = 'remote-wins'
): T {
  switch (strategy) {
    case 'local-wins':
      return local;

    case 'remote-wins':
      return remote;

    case 'merge':
      // Deep merge objects
      if (typeof local === 'object' && typeof remote === 'object') {
        return {
          ...local,
          ...remote,
        } as T;
      }
      return remote;

    default:
      return remote;
  }
}

/**
 * Optimistic update transaction with rollback
 */
export class OptimisticTransaction<T> {
  private original: T;
  private current: T;
  private isCommitted = false;
  private isRolledBack = false;

  constructor(initial: T) {
    this.original = JSON.parse(JSON.stringify(initial));
    this.current = JSON.parse(JSON.stringify(initial));
  }

  /**
   * Update data optimistically
   */
  update(partial: Partial<T>): void {
    if (this.isCommitted || this.isRolledBack) {
      throw new Error('Cannot update committed or rolled back transaction');
    }

    this.current = {
      ...this.current,
      ...partial,
    };
  }

  /**
   * Get current state
   */
  getCurrent(): T {
    return this.current;
  }

  /**
   * Get original state
   */
  getOriginal(): T {
    return this.original;
  }

  /**
   * Get changes
   */
  getChanges(): Partial<T> {
    const changes: any = {};

    for (const key in this.current) {
      if (this.current[key] !== this.original[key]) {
        changes[key] = this.current[key];
      }
    }

    return changes;
  }

  /**
   * Commit transaction
   */
  commit(): T {
    this.isCommitted = true;
    return this.current;
  }

  /**
   * Rollback to original
   */
  rollback(): T {
    this.isRolledBack = true;
    this.current = JSON.parse(JSON.stringify(this.original));
    return this.current;
  }

  /**
   * Check if has changes
   */
  hasChanges(): boolean {
    return JSON.stringify(this.current) !== JSON.stringify(this.original);
  }

  /**
   * Get number of changed fields
   */
  getChangeCount(): number {
    return Object.keys(this.getChanges()).length;
  }
}
