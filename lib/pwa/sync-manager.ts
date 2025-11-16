/**
 * Offline Sync Manager
 * Handles synchronization of offline data with the server
 */

import {
  addToSyncQueue,
  getSyncQueue,
  updateSyncQueueItem,
  deleteSyncQueueItem,
  clearCompletedSyncItems,
  SyncQueueItem,
  addPendingOrder,
  getPendingOrders,
  deletePendingOrder,
  updatePendingOrder,
  cacheOrder,
  cacheProduct,
  cacheCustomer,
  setMetadata,
  getMetadata,
} from './indexed-db';

// ============================================================================
// TYPES
// ============================================================================

export type ConflictResolutionStrategy = 'server-wins' | 'client-wins' | 'merge' | 'manual';

export interface SyncOptions {
  strategy?: ConflictResolutionStrategy;
  onProgress?: (progress: SyncProgress) => void;
  onConflict?: (conflict: SyncConflict) => Promise<any>;
  maxRetries?: number;
}

export interface SyncProgress {
  total: number;
  completed: number;
  failed: number;
  current?: string;
}

export interface SyncConflict {
  resource: string;
  clientData: any;
  serverData: any;
  timestamp: number;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  conflicts: SyncConflict[];
  errors: string[];
}

// ============================================================================
// SYNC MANAGER CLASS
// ============================================================================

export class SyncManager {
  private isSyncing = false;
  private syncInterval?: NodeJS.Timeout;
  private options: SyncOptions;

  constructor(options: SyncOptions = {}) {
    this.options = {
      strategy: 'server-wins',
      maxRetries: 3,
      ...options,
    };
  }

  /**
   * Start automatic sync on network connection
   */
  public startAutoSync(intervalMs: number = 5 * 60 * 1000): void {
    if (typeof window === 'undefined') return;

    // Sync on app open
    this.syncAll().catch(console.error);

    // Sync when coming back online
    window.addEventListener('online', () => {
      console.log('[SyncManager] Network restored, syncing...');
      this.syncAll().catch(console.error);
    });

    // Periodic sync
    this.syncInterval = setInterval(() => {
      if (navigator.onLine) {
        this.syncAll().catch(console.error);
      }
    }, intervalMs);

    // Sync when page becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && navigator.onLine) {
        this.syncAll().catch(console.error);
      }
    });

    console.log('[SyncManager] Auto-sync started');
  }

  /**
   * Stop automatic sync
   */
  public stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
    }
    console.log('[SyncManager] Auto-sync stopped');
  }

  /**
   * Sync all pending data
   */
  public async syncAll(options?: SyncOptions): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('[SyncManager] Sync already in progress');
      return {
        success: false,
        synced: 0,
        failed: 0,
        conflicts: [],
        errors: ['Sync already in progress'],
      };
    }

    if (!navigator.onLine) {
      console.log('[SyncManager] Cannot sync while offline');
      return {
        success: false,
        synced: 0,
        failed: 0,
        conflicts: [],
        errors: ['Device is offline'],
      };
    }

    this.isSyncing = true;
    const mergedOptions = { ...this.options, ...options };

    try {
      const [pendingOrders, syncQueue] = await Promise.all([
        getPendingOrders(),
        getSyncQueue(),
      ]);

      const total = pendingOrders.length + syncQueue.length;
      let synced = 0;
      let failed = 0;
      const conflicts: SyncConflict[] = [];
      const errors: string[] = [];

      const progress: SyncProgress = { total, completed: 0, failed: 0 };

      // Sync pending orders
      for (const order of pendingOrders) {
        try {
          progress.current = `Syncing order ${order.orderId || order.id}`;
          mergedOptions.onProgress?.(progress);

          await this.syncPendingOrder(order, mergedOptions);
          synced++;
          progress.completed++;
        } catch (error) {
          failed++;
          progress.failed++;
          errors.push(`Failed to sync order: ${error}`);
          console.error('[SyncManager] Failed to sync order:', error);
        }
      }

      // Sync queue items
      for (const item of syncQueue) {
        try {
          progress.current = `Syncing ${item.resource}`;
          mergedOptions.onProgress?.(progress);

          const conflict = await this.syncQueueItem(item, mergedOptions);
          if (conflict) {
            conflicts.push(conflict);
          }
          synced++;
          progress.completed++;
        } catch (error) {
          failed++;
          progress.failed++;
          errors.push(`Failed to sync ${item.resource}: ${error}`);
          console.error('[SyncManager] Failed to sync queue item:', error);
        }
      }

      // Clean up completed items
      await clearCompletedSyncItems();

      // Update last sync time
      await setMetadata('lastSyncTime', Date.now());

      console.log('[SyncManager] Sync completed:', { synced, failed, conflicts: conflicts.length });

      return {
        success: failed === 0 && conflicts.length === 0,
        synced,
        failed,
        conflicts,
        errors,
      };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync a single pending order
   */
  private async syncPendingOrder(order: any, options: SyncOptions): Promise<void> {
    if (!order.id) return;

    try {
      await updatePendingOrder(order.id, { status: 'syncing' });

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order.data),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();

      // Cache the synced order
      await cacheOrder({
        id: result.id,
        data: result,
        timestamp: Date.now(),
      });

      // Remove from pending queue
      await deletePendingOrder(order.id);

      console.log('[SyncManager] Order synced successfully:', result.id);
    } catch (error) {
      const retryCount = (order.retryCount || 0) + 1;

      if (retryCount >= (options.maxRetries || 3)) {
        await updatePendingOrder(order.id, {
          status: 'failed',
          retryCount,
          error: String(error),
        });
      } else {
        await updatePendingOrder(order.id, {
          status: 'pending',
          retryCount,
          error: String(error),
        });
      }

      throw error;
    }
  }

  /**
   * Sync a single queue item
   */
  private async syncQueueItem(item: SyncQueueItem, options: SyncOptions): Promise<SyncConflict | null> {
    if (!item.id) return null;

    try {
      await updateSyncQueueItem(item.id, { status: 'syncing' });

      const endpoint = this.getEndpoint(item.resource);
      const method = this.getMethod(item.type);

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.data),
      });

      if (response.status === 409) {
        // Conflict detected
        const serverData = await response.json();
        const conflict: SyncConflict = {
          resource: item.resource,
          clientData: item.data,
          serverData,
          timestamp: Date.now(),
        };

        const resolved = await this.resolveConflict(conflict, options);
        if (resolved) {
          await this.applySyncResult(item, resolved);
        }

        return conflict;
      }

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      await this.applySyncResult(item, result);
      await deleteSyncQueueItem(item.id);

      console.log('[SyncManager] Item synced successfully:', item.resource);
      return null;
    } catch (error) {
      const retryCount = (item.retryCount || 0) + 1;

      if (retryCount >= (options.maxRetries || 3)) {
        await updateSyncQueueItem(item.id, {
          status: 'failed',
          retryCount,
          error: String(error),
        });
      } else {
        await updateSyncQueueItem(item.id, {
          status: 'pending',
          retryCount,
          error: String(error),
        });
      }

      throw error;
    }
  }

  /**
   * Resolve sync conflict
   */
  private async resolveConflict(conflict: SyncConflict, options: SyncOptions): Promise<any> {
    const strategy = options.strategy || 'server-wins';

    switch (strategy) {
      case 'server-wins':
        console.log('[SyncManager] Conflict resolved: server wins');
        return conflict.serverData;

      case 'client-wins':
        console.log('[SyncManager] Conflict resolved: client wins');
        return conflict.clientData;

      case 'merge':
        console.log('[SyncManager] Conflict resolved: merge');
        return this.mergeData(conflict.clientData, conflict.serverData);

      case 'manual':
        if (options.onConflict) {
          console.log('[SyncManager] Conflict resolved: manual');
          return await options.onConflict(conflict);
        }
        return conflict.serverData;

      default:
        return conflict.serverData;
    }
  }

  /**
   * Merge client and server data
   */
  private mergeData(clientData: any, serverData: any): any {
    // Simple merge strategy - prefer newer fields
    const merged = { ...serverData };

    for (const key in clientData) {
      if (clientData[key] !== undefined && clientData[key] !== null) {
        // If server data doesn't have this field, use client data
        if (!(key in serverData)) {
          merged[key] = clientData[key];
        }
        // If both have timestamps, use newer one
        else if (key === 'updatedAt' || key === 'timestamp') {
          if (new Date(clientData[key]) > new Date(serverData[key])) {
            merged[key] = clientData[key];
          }
        }
      }
    }

    return merged;
  }

  /**
   * Apply sync result to local cache
   */
  private async applySyncResult(item: SyncQueueItem, result: any): Promise<void> {
    switch (item.resource) {
      case 'order':
        await cacheOrder({
          id: result.id,
          data: result,
          timestamp: Date.now(),
        });
        break;

      case 'product':
        await cacheProduct({
          id: result.id,
          data: result,
          category: result.category,
          timestamp: Date.now(),
        });
        break;

      case 'customer':
        await cacheCustomer({
          id: result.id,
          data: result,
          timestamp: Date.now(),
        });
        break;
    }
  }

  /**
   * Get API endpoint for resource
   */
  private getEndpoint(resource: string): string {
    const endpoints: Record<string, string> = {
      order: '/api/orders',
      product: '/api/products',
      customer: '/api/customers',
      inventory: '/api/inventory',
    };

    return endpoints[resource] || `/api/${resource}`;
  }

  /**
   * Get HTTP method for operation type
   */
  private getMethod(type: string): string {
    const methods: Record<string, string> = {
      create: 'POST',
      update: 'PUT',
      delete: 'DELETE',
    };

    return methods[type] || 'POST';
  }

  /**
   * Queue an operation for offline sync
   */
  public async queueOperation(
    resource: string,
    type: 'create' | 'update' | 'delete',
    data: any
  ): Promise<void> {
    await addToSyncQueue({
      type,
      resource,
      data,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
    });

    console.log('[SyncManager] Operation queued:', { resource, type });

    // Try to sync immediately if online
    if (navigator.onLine && !this.isSyncing) {
      this.syncAll().catch(console.error);
    }
  }

  /**
   * Get last sync time
   */
  public async getLastSyncTime(): Promise<number | null> {
    return await getMetadata('lastSyncTime');
  }

  /**
   * Check if sync is in progress
   */
  public isSyncInProgress(): boolean {
    return this.isSyncing;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let syncManagerInstance: SyncManager | null = null;

export function getSyncManager(options?: SyncOptions): SyncManager {
  if (!syncManagerInstance) {
    syncManagerInstance = new SyncManager(options);
  }
  return syncManagerInstance;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Register background sync
 */
export async function registerBackgroundSync(tag: string): Promise<void> {
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(tag);
      console.log('[SyncManager] Background sync registered:', tag);
    } catch (error) {
      console.error('[SyncManager] Failed to register background sync:', error);
    }
  }
}

/**
 * Register periodic background sync
 */
export async function registerPeriodicSync(tag: string, minInterval: number = 24 * 60 * 60 * 1000): Promise<void> {
  if ('serviceWorker' in navigator && 'periodicSync' in ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).periodicSync.register(tag, {
        minInterval,
      });
      console.log('[SyncManager] Periodic background sync registered:', tag);
    } catch (error) {
      console.error('[SyncManager] Failed to register periodic sync:', error);
    }
  }
}
