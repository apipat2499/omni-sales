import type { Order } from '@/types';

// Sync operation types
export type SyncOperation = 'create' | 'update' | 'delete';

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';

export interface SyncQueueItem {
  id: string;
  operation: SyncOperation;
  resourceType: 'order' | 'customer' | 'product';
  resourceId: string;
  data?: any;
  timestamp: number;
  attempts: number;
  status: SyncStatus;
  error?: string;
  localVersion?: number;
  remoteVersion?: number;
}

export interface SyncConflict {
  id: string;
  resourceType: string;
  resourceId: string;
  localData: any;
  remoteData: any;
  localTimestamp: number;
  remoteTimestamp: number;
}

export type ConflictResolutionStrategy = 'local-wins' | 'remote-wins' | 'latest-wins' | 'manual';

const STORAGE_KEY = 'omni-sales-sync-queue';
const SYNC_STATUS_KEY = 'omni-sales-sync-status';
const MAX_RETRY_ATTEMPTS = 5;
const BASE_RETRY_DELAY = 1000; // 1 second

/**
 * Sync Manager - Handles offline queue and sync operations
 */
export class SyncManager {
  private queue: SyncQueueItem[] = [];
  private isSyncing = false;
  private listeners: Set<(status: SyncStatus) => void> = new Set();
  private conflictListeners: Set<(conflict: SyncConflict) => void> = new Set();

  constructor() {
    this.loadQueue();
  }

  /**
   * Load sync queue from localStorage
   */
  private loadQueue(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
      this.queue = [];
    }
  }

  /**
   * Save sync queue to localStorage
   */
  private saveQueue(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  /**
   * Add operation to sync queue
   */
  addToQueue(
    operation: SyncOperation,
    resourceType: 'order' | 'customer' | 'product',
    resourceId: string,
    data?: any
  ): string {
    const item: SyncQueueItem = {
      id: crypto.randomUUID(),
      operation,
      resourceType,
      resourceId,
      data,
      timestamp: Date.now(),
      attempts: 0,
      status: 'pending',
    };

    this.queue.push(item);
    this.saveQueue();
    this.notifyListeners('pending');

    return item.id;
  }

  /**
   * Remove item from queue
   */
  removeFromQueue(itemId: string): void {
    this.queue = this.queue.filter(item => item.id !== itemId);
    this.saveQueue();
  }

  /**
   * Get all pending items in queue
   */
  getPendingItems(): SyncQueueItem[] {
    return this.queue.filter(item => item.status === 'pending' || item.status === 'failed');
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.getPendingItems().length;
  }

  /**
   * Clear all synced items from queue
   */
  clearSyncedItems(): void {
    this.queue = this.queue.filter(item => item.status !== 'synced');
    this.saveQueue();
  }

  /**
   * Get sync status
   */
  getSyncStatus(): {
    isSyncing: boolean;
    pending: number;
    synced: number;
    failed: number;
    conflicts: number;
  } {
    return {
      isSyncing: this.isSyncing,
      pending: this.queue.filter(item => item.status === 'pending').length,
      synced: this.queue.filter(item => item.status === 'synced').length,
      failed: this.queue.filter(item => item.status === 'failed').length,
      conflicts: this.queue.filter(item => item.status === 'conflict').length,
    };
  }

  /**
   * Process sync queue with retry logic
   */
  async processQueue(
    syncFunction: (item: SyncQueueItem) => Promise<{ success: boolean; error?: string; conflict?: boolean }>
  ): Promise<void> {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return;
    }

    this.isSyncing = true;
    this.notifyListeners('syncing');

    const pendingItems = this.getPendingItems();

    for (const item of pendingItems) {
      try {
        // Update status
        item.status = 'syncing';
        item.attempts += 1;
        this.saveQueue();

        // Execute sync function
        const result = await syncFunction(item);

        if (result.success) {
          // Mark as synced
          item.status = 'synced';
          this.saveQueue();
        } else if (result.conflict) {
          // Handle conflict
          item.status = 'conflict';
          this.saveQueue();
        } else {
          // Handle failure with retry logic
          await this.handleFailure(item, result.error);
        }
      } catch (error: any) {
        await this.handleFailure(item, error.message);
      }
    }

    this.isSyncing = false;
    const status = this.getSyncStatus();
    this.notifyListeners(status.failed > 0 ? 'failed' : 'synced');
  }

  /**
   * Handle sync failure with exponential backoff
   */
  private async handleFailure(item: SyncQueueItem, error?: string): Promise<void> {
    if (item.attempts >= MAX_RETRY_ATTEMPTS) {
      item.status = 'failed';
      item.error = error || 'Max retry attempts reached';
      this.saveQueue();
      return;
    }

    // Calculate exponential backoff delay
    const delay = this.calculateBackoffDelay(item.attempts);

    // Mark as pending for retry
    item.status = 'pending';
    item.error = error;
    this.saveQueue();

    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoffDelay(attempts: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    const delay = BASE_RETRY_DELAY * Math.pow(2, attempts - 1);
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 1000;
    return delay + jitter;
  }

  /**
   * Resolve conflict based on strategy
   */
  resolveConflict(
    conflict: SyncConflict,
    strategy: ConflictResolutionStrategy = 'latest-wins'
  ): any {
    switch (strategy) {
      case 'local-wins':
        return conflict.localData;

      case 'remote-wins':
        return conflict.remoteData;

      case 'latest-wins':
        return conflict.localTimestamp > conflict.remoteTimestamp
          ? conflict.localData
          : conflict.remoteData;

      case 'manual':
        // Emit conflict for manual resolution
        this.notifyConflictListeners(conflict);
        return null;

      default:
        return conflict.localData;
    }
  }

  /**
   * Detect conflicts between local and remote data
   */
  detectConflict(localData: any, remoteData: any, localTimestamp: number, remoteTimestamp: number): boolean {
    // If timestamps are the same, no conflict
    if (localTimestamp === remoteTimestamp) {
      return false;
    }

    // If remote is newer and data differs, it's a conflict
    if (remoteTimestamp > localTimestamp) {
      return JSON.stringify(localData) !== JSON.stringify(remoteData);
    }

    return false;
  }

  /**
   * Retry failed items
   */
  async retryFailed(): Promise<void> {
    this.queue.forEach(item => {
      if (item.status === 'failed') {
        item.status = 'pending';
        item.attempts = 0;
        item.error = undefined;
      }
    });
    this.saveQueue();
  }

  /**
   * Clear all items from queue
   */
  clearQueue(): void {
    this.queue = [];
    this.saveQueue();
  }

  /**
   * Subscribe to sync status changes
   */
  onStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Subscribe to conflict notifications
   */
  onConflict(callback: (conflict: SyncConflict) => void): () => void {
    this.conflictListeners.add(callback);
    return () => this.conflictListeners.delete(callback);
  }

  /**
   * Notify all status listeners
   */
  private notifyListeners(status: SyncStatus): void {
    this.listeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in sync status listener:', error);
      }
    });
  }

  /**
   * Notify all conflict listeners
   */
  private notifyConflictListeners(conflict: SyncConflict): void {
    this.conflictListeners.forEach(callback => {
      try {
        callback(conflict);
      } catch (error) {
        console.error('Error in conflict listener:', error);
      }
    });
  }

  /**
   * Get items by status
   */
  getItemsByStatus(status: SyncStatus): SyncQueueItem[] {
    return this.queue.filter(item => item.status === status);
  }

  /**
   * Get item by ID
   */
  getItem(itemId: string): SyncQueueItem | undefined {
    return this.queue.find(item => item.id === itemId);
  }

  /**
   * Update item status
   */
  updateItemStatus(itemId: string, status: SyncStatus, error?: string): void {
    const item = this.getItem(itemId);
    if (item) {
      item.status = status;
      if (error) item.error = error;
      this.saveQueue();
    }
  }

  /**
   * Mark item as synced
   */
  markAsSynced(itemId: string): void {
    this.updateItemStatus(itemId, 'synced');
  }

  /**
   * Mark item as failed
   */
  markAsFailed(itemId: string, error: string): void {
    this.updateItemStatus(itemId, 'failed', error);
  }

  /**
   * Check if online
   */
  isOnline(): boolean {
    return typeof window !== 'undefined' && navigator.onLine;
  }

  /**
   * Wait for online status
   */
  async waitForOnline(timeout: number = 30000): Promise<boolean> {
    if (this.isOnline()) return true;

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        window.removeEventListener('online', onlineHandler);
        resolve(false);
      }, timeout);

      const onlineHandler = () => {
        clearTimeout(timeoutId);
        window.removeEventListener('online', onlineHandler);
        resolve(true);
      };

      window.addEventListener('online', onlineHandler);
    });
  }
}

// Export singleton instance
export const syncManager = new SyncManager();

// Export utility functions

/**
 * Add operation to sync queue
 */
export function addToSyncQueue(
  operation: SyncOperation,
  resourceType: 'order' | 'customer' | 'product',
  resourceId: string,
  data?: any
): string {
  return syncManager.addToQueue(operation, resourceType, resourceId, data);
}

/**
 * Get sync queue status
 */
export function getSyncQueueStatus() {
  return syncManager.getSyncStatus();
}

/**
 * Process sync queue
 */
export async function processSyncQueue(
  syncFunction: (item: SyncQueueItem) => Promise<{ success: boolean; error?: string; conflict?: boolean }>
): Promise<void> {
  return syncManager.processQueue(syncFunction);
}

/**
 * Subscribe to sync status changes
 */
export function onSyncStatusChange(callback: (status: SyncStatus) => void): () => void {
  return syncManager.onStatusChange(callback);
}

/**
 * Check if device is online
 */
export function isOnline(): boolean {
  return syncManager.isOnline();
}
