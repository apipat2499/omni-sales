import { useState, useEffect, useCallback, useRef } from 'react';
import { isSupabaseAvailable, getSupabaseClient } from '@/lib/supabase/client';
import {
  createOrder,
  updateOrder,
  deleteOrder,
  getOrders,
  getOrder,
  batchCreateOrders,
  batchUpdateOrders,
  batchDeleteOrders,
  checkDatabaseConnection,
} from '@/lib/supabase/database';
import {
  syncManager,
  type SyncStatus,
  type SyncQueueItem,
  type ConflictResolutionStrategy,
  type SyncConflict,
} from '@/lib/utils/sync-manager';
import type { Order } from '@/types';

// Local storage keys
const ORDERS_STORAGE_KEY = 'omni-sales-orders';
const LAST_SYNC_KEY = 'omni-sales-last-sync';

export interface SupabaseSyncOptions {
  /**
   * Enable automatic sync when online
   */
  autoSync?: boolean;

  /**
   * Sync interval in milliseconds (default: 30000 - 30 seconds)
   */
  syncInterval?: number;

  /**
   * Conflict resolution strategy
   */
  conflictResolution?: ConflictResolutionStrategy;

  /**
   * Enable real-time subscriptions
   */
  realtime?: boolean;

  /**
   * Local storage key for data
   */
  storageKey?: string;
}

export interface SupabaseSyncState {
  /**
   * Whether Supabase is available
   */
  isAvailable: boolean;

  /**
   * Whether currently syncing
   */
  isSyncing: boolean;

  /**
   * Whether device is online
   */
  isOnline: boolean;

  /**
   * Current sync status
   */
  syncStatus: SyncStatus;

  /**
   * Number of pending sync operations
   */
  pendingCount: number;

  /**
   * Last sync timestamp
   */
  lastSync: Date | null;

  /**
   * Any sync errors
   */
  error: string | null;

  /**
   * Conflicts that need resolution
   */
  conflicts: SyncConflict[];
}

/**
 * Hook for syncing localStorage data with Supabase
 * Supports offline queue, real-time subscriptions, and conflict resolution
 */
export function useSupabaseSync(options: SupabaseSyncOptions = {}) {
  const {
    autoSync = true,
    syncInterval = 30000,
    conflictResolution = 'latest-wins',
    realtime = true,
    storageKey = ORDERS_STORAGE_KEY,
  } = options;

  // State
  const [state, setState] = useState<SupabaseSyncState>({
    isAvailable: isSupabaseAvailable(),
    isSyncing: false,
    isOnline: typeof window !== 'undefined' && navigator.onLine,
    syncStatus: 'synced',
    pendingCount: 0,
    lastSync: null,
    error: null,
    conflicts: [],
  });

  // Refs
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const realtimeChannelRef = useRef<any>(null);

  /**
   * Load data from localStorage
   */
  const loadLocalData = useCallback((): Order[] => {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        // Convert date strings back to Date objects
        return data.map((order: any) => ({
          ...order,
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt),
          deliveredAt: order.deliveredAt ? new Date(order.deliveredAt) : undefined,
        }));
      }
    } catch (error) {
      console.error('Failed to load local data:', error);
    }
    return [];
  }, [storageKey]);

  /**
   * Save data to localStorage
   */
  const saveLocalData = useCallback((data: Order[]): void => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save local data:', error);
    }
  }, [storageKey]);

  /**
   * Get last sync timestamp
   */
  const getLastSync = useCallback((): Date | null => {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(LAST_SYNC_KEY);
      return stored ? new Date(stored) : null;
    } catch {
      return null;
    }
  }, []);

  /**
   * Set last sync timestamp
   */
  const setLastSync = useCallback((date: Date): void => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(LAST_SYNC_KEY, date.toISOString());
      setState(prev => ({ ...prev, lastSync: date }));
    } catch (error) {
      console.error('Failed to save last sync time:', error);
    }
  }, []);

  /**
   * Sync local data with Supabase
   */
  const sync = useCallback(async (): Promise<void> => {
    if (!isSupabaseAvailable()) {
      console.log('Supabase not available, skipping sync');
      return;
    }

    if (state.isSyncing) {
      console.log('Sync already in progress');
      return;
    }

    setState(prev => ({ ...prev, isSyncing: true, error: null }));

    try {
      // Check database connection
      const isConnected = await checkDatabaseConnection();
      if (!isConnected) {
        throw new Error('Cannot connect to database');
      }

      // Process sync queue
      await syncManager.processQueue(async (item: SyncQueueItem) => {
        try {
          switch (item.operation) {
            case 'create':
              const createResult = await createOrder(item.data);
              if (!createResult.success) {
                return { success: false, error: createResult.error?.message };
              }
              break;

            case 'update':
              const updateResult = await updateOrder(item.resourceId, item.data);
              if (!updateResult.success) {
                return { success: false, error: updateResult.error?.message };
              }
              break;

            case 'delete':
              const deleteResult = await deleteOrder(item.resourceId);
              if (!deleteResult.success) {
                return { success: false, error: deleteResult.error?.message };
              }
              break;
          }

          return { success: true };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      });

      // Pull latest data from Supabase
      const result = await getOrders();
      if (result.success) {
        saveLocalData(result.data);
        setLastSync(new Date());
      }

      // Update state
      const queueStatus = syncManager.getSyncStatus();
      setState(prev => ({
        ...prev,
        isSyncing: false,
        syncStatus: queueStatus.failed > 0 ? 'failed' : 'synced',
        pendingCount: queueStatus.pending,
        error: null,
      }));
    } catch (error: any) {
      console.error('Sync failed:', error);
      setState(prev => ({
        ...prev,
        isSyncing: false,
        syncStatus: 'failed',
        error: error.message,
      }));
    }
  }, [state.isSyncing, saveLocalData, setLastSync]);

  /**
   * Create order with offline support
   */
  const createOrderWithSync = useCallback(async (order: Order): Promise<void> => {
    // Save to localStorage immediately
    const localData = loadLocalData();
    localData.push(order);
    saveLocalData(localData);

    // Queue for sync if online, otherwise just save locally
    if (isSupabaseAvailable() && state.isOnline) {
      const result = await createOrder(order);
      if (!result.success) {
        // Add to sync queue for retry
        syncManager.addToQueue('create', 'order', order.id, order);
        setState(prev => ({
          ...prev,
          pendingCount: prev.pendingCount + 1,
          syncStatus: 'pending',
        }));
      } else {
        setLastSync(new Date());
      }
    } else {
      // Offline - add to queue
      syncManager.addToQueue('create', 'order', order.id, order);
      setState(prev => ({
        ...prev,
        pendingCount: prev.pendingCount + 1,
        syncStatus: 'pending',
      }));
    }
  }, [loadLocalData, saveLocalData, setLastSync, state.isOnline]);

  /**
   * Update order with offline support
   */
  const updateOrderWithSync = useCallback(async (
    orderId: string,
    updates: Partial<Order>
  ): Promise<void> => {
    // Update localStorage immediately
    const localData = loadLocalData();
    const index = localData.findIndex(o => o.id === orderId);
    if (index >= 0) {
      localData[index] = { ...localData[index], ...updates, updatedAt: new Date() };
      saveLocalData(localData);
    }

    // Queue for sync if online, otherwise just save locally
    if (isSupabaseAvailable() && state.isOnline) {
      const result = await updateOrder(orderId, updates);
      if (!result.success) {
        // Add to sync queue for retry
        syncManager.addToQueue('update', 'order', orderId, updates);
        setState(prev => ({
          ...prev,
          pendingCount: prev.pendingCount + 1,
          syncStatus: 'pending',
        }));
      } else {
        setLastSync(new Date());
      }
    } else {
      // Offline - add to queue
      syncManager.addToQueue('update', 'order', orderId, updates);
      setState(prev => ({
        ...prev,
        pendingCount: prev.pendingCount + 1,
        syncStatus: 'pending',
      }));
    }
  }, [loadLocalData, saveLocalData, setLastSync, state.isOnline]);

  /**
   * Delete order with offline support
   */
  const deleteOrderWithSync = useCallback(async (orderId: string): Promise<void> => {
    // Remove from localStorage immediately
    const localData = loadLocalData();
    const filtered = localData.filter(o => o.id !== orderId);
    saveLocalData(filtered);

    // Queue for sync if online, otherwise just save locally
    if (isSupabaseAvailable() && state.isOnline) {
      const result = await deleteOrder(orderId);
      if (!result.success) {
        // Add to sync queue for retry
        syncManager.addToQueue('delete', 'order', orderId);
        setState(prev => ({
          ...prev,
          pendingCount: prev.pendingCount + 1,
          syncStatus: 'pending',
        }));
      } else {
        setLastSync(new Date());
      }
    } else {
      // Offline - add to queue
      syncManager.addToQueue('delete', 'order', orderId);
      setState(prev => ({
        ...prev,
        pendingCount: prev.pendingCount + 1,
        syncStatus: 'pending',
      }));
    }
  }, [loadLocalData, saveLocalData, setLastSync, state.isOnline]);

  /**
   * Force immediate sync
   */
  const forceSync = useCallback(async (): Promise<void> => {
    await sync();
  }, [sync]);

  /**
   * Retry failed sync operations
   */
  const retryFailed = useCallback(async (): Promise<void> => {
    await syncManager.retryFailed();
    await sync();
  }, [sync]);

  /**
   * Clear sync queue
   */
  const clearQueue = useCallback((): void => {
    syncManager.clearQueue();
    setState(prev => ({
      ...prev,
      pendingCount: 0,
      syncStatus: 'synced',
    }));
  }, []);

  /**
   * Resolve conflict manually
   */
  const resolveConflict = useCallback((conflict: SyncConflict, data: any): void => {
    // Update local data with resolved version
    const localData = loadLocalData();
    const index = localData.findIndex((o: any) => o.id === conflict.resourceId);
    if (index >= 0) {
      localData[index] = data;
      saveLocalData(localData);
    }

    // Remove conflict from state
    setState(prev => ({
      ...prev,
      conflicts: prev.conflicts.filter(c => c.id !== conflict.id),
    }));
  }, [loadLocalData, saveLocalData]);

  // Setup real-time subscriptions
  useEffect(() => {
    if (!realtime || !isSupabaseAvailable()) return;

    const client = getSupabaseClient();
    if (!client) return;

    // Subscribe to order changes
    const channel = client
      .channel('orders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        console.log('Real-time order change:', payload);
        // Trigger sync to get latest data
        sync();
      })
      .subscribe();

    realtimeChannelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [realtime, sync]);

  // Setup auto-sync interval
  useEffect(() => {
    if (!autoSync || !isSupabaseAvailable()) return;

    // Initial sync
    sync();

    // Setup interval
    if (syncInterval > 0) {
      syncIntervalRef.current = setInterval(() => {
        if (state.isOnline && !state.isSyncing) {
          sync();
        }
      }, syncInterval);
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [autoSync, syncInterval, sync, state.isOnline, state.isSyncing]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      // Trigger sync when coming online
      if (autoSync) {
        sync();
      }
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [autoSync, sync]);

  // Listen for sync status changes
  useEffect(() => {
    const unsubscribe = syncManager.onStatusChange((status) => {
      const queueStatus = syncManager.getSyncStatus();
      setState(prev => ({
        ...prev,
        syncStatus: status,
        pendingCount: queueStatus.pending,
      }));
    });

    return unsubscribe;
  }, []);

  // Listen for conflicts
  useEffect(() => {
    const unsubscribe = syncManager.onConflict((conflict) => {
      setState(prev => ({
        ...prev,
        conflicts: [...prev.conflicts, conflict],
      }));
    });

    return unsubscribe;
  }, []);

  // Initialize last sync time
  useEffect(() => {
    const lastSync = getLastSync();
    setState(prev => ({ ...prev, lastSync }));
  }, [getLastSync]);

  return {
    // State
    ...state,

    // Data operations
    createOrder: createOrderWithSync,
    updateOrder: updateOrderWithSync,
    deleteOrder: deleteOrderWithSync,
    loadLocalData,
    saveLocalData,

    // Sync operations
    sync: forceSync,
    retryFailed,
    clearQueue,
    resolveConflict,

    // Queue info
    queueStatus: syncManager.getSyncStatus(),
    pendingItems: syncManager.getPendingItems(),
  };
}

export default useSupabaseSync;
