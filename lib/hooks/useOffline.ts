/**
 * React Hooks for Offline/PWA Functionality
 */

import { useEffect, useState, useCallback } from 'react';
import { getOfflineDetector, NetworkStatus, NetworkInfo } from '@/lib/pwa/offline-detector';
import { getSyncManager, SyncResult, SyncConflict } from '@/lib/pwa/sync-manager';
import {
  getCachedOrders,
  getCachedProducts,
  getCachedCustomers,
  cacheOrder,
  cacheProduct,
  cacheCustomer,
  addToSyncQueue,
  CachedOrder,
  CachedProduct,
  CachedCustomer,
} from '@/lib/pwa/indexed-db';
import { getPWAConfig } from '@/lib/pwa/config';

// ============================================================================
// NETWORK STATUS HOOK
// ============================================================================

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>('online');
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);

  useEffect(() => {
    const detector = getOfflineDetector();

    // Get initial status
    setStatus(detector.getStatus());
    setNetworkInfo(detector.getNetworkInfo());

    // Add listener
    const handleStatusChange = (newStatus: NetworkStatus) => {
      setStatus(newStatus);
      setNetworkInfo(detector.getNetworkInfo());
    };

    detector.addListener(handleStatusChange);

    return () => {
      detector.removeListener(handleStatusChange);
    };
  }, []);

  return {
    status,
    networkInfo,
    isOnline: status === 'online' || status === 'slow',
    isOffline: status === 'offline',
    isSlow: status === 'slow',
  };
}

// ============================================================================
// SYNC STATUS HOOK
// ============================================================================

export function useSyncStatus() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  useEffect(() => {
    const syncManager = getSyncManager();

    // Get initial sync time
    syncManager.getLastSyncTime().then(setLastSyncTime);

    // Check if syncing
    setIsSyncing(syncManager.isSyncInProgress());
  }, []);

  const syncNow = useCallback(async () => {
    setIsSyncing(true);
    setSyncResult(null);

    try {
      const syncManager = getSyncManager();
      const result = await syncManager.syncAll();

      setSyncResult(result);

      const lastSync = await syncManager.getLastSyncTime();
      setLastSyncTime(lastSync);

      return result;
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return {
    isSyncing,
    lastSyncTime,
    syncResult,
    syncNow,
  };
}

// ============================================================================
// OFFLINE DATA HOOK
// ============================================================================

export function useOfflineData<T = any>(
  resource: 'order' | 'product' | 'customer',
  id?: string
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    loadData();
  }, [resource, id, isOnline]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Try online first if connected
      if (isOnline && id) {
        const response = await fetch(`/api/${resource}s/${id}`);
        if (response.ok) {
          const onlineData = await response.json();
          setData(onlineData);

          // Cache the data
          await cacheData(resource, onlineData);

          setIsLoading(false);
          return;
        }
      }

      // Fall back to cached data
      if (id) {
        const cached = await getCachedData(resource, id);
        setData(cached as T);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveData = async (newData: any) => {
    try {
      if (isOnline) {
        // Save online
        const response = await fetch(`/api/${resource}s`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newData),
        });

        if (response.ok) {
          const saved = await response.json();
          await cacheData(resource, saved);
          setData(saved);
          return saved;
        }
      } else {
        // Queue for offline sync
        await addToSyncQueue({
          type: 'create',
          resource,
          data: newData,
          timestamp: Date.now(),
          status: 'pending',
          retryCount: 0,
        });

        // Cache locally
        await cacheData(resource, newData);
        setData(newData);
        return newData;
      }
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  return {
    data,
    isLoading,
    error,
    refresh: loadData,
    save: saveData,
  };
}

// Helper functions
async function getCachedData(resource: string, id: string): Promise<any> {
  switch (resource) {
    case 'order':
      return (await import('@/lib/pwa/indexed-db')).getCachedOrder(id);
    case 'product':
      return (await import('@/lib/pwa/indexed-db')).getCachedProduct(id);
    case 'customer':
      return (await import('@/lib/pwa/indexed-db')).getCachedCustomer(id);
    default:
      return null;
  }
}

async function cacheData(resource: string, data: any): Promise<void> {
  const timestamp = Date.now();

  switch (resource) {
    case 'order':
      await cacheOrder({ id: data.id, data, timestamp });
      break;
    case 'product':
      await cacheProduct({ id: data.id, data, category: data.category, timestamp });
      break;
    case 'customer':
      await cacheCustomer({ id: data.id, data, timestamp });
      break;
  }
}

// ============================================================================
// OFFLINE LIST HOOK
// ============================================================================

export function useOfflineList<T = any>(resource: 'orders' | 'products' | 'customers') {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    loadData();
  }, [resource, isOnline]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Try online first
      if (isOnline) {
        const response = await fetch(`/api/${resource}`);
        if (response.ok) {
          const onlineData = await response.json();
          setData(onlineData);

          // Cache the data
          await cacheListData(resource, onlineData);

          setIsLoading(false);
          return;
        }
      }

      // Fall back to cached data
      const cached = await getCachedListData(resource);
      setData(cached as T[]);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    data,
    isLoading,
    error,
    refresh: loadData,
  };
}

async function getCachedListData(resource: string): Promise<any[]> {
  switch (resource) {
    case 'orders':
      const orders = await getCachedOrders();
      return orders.map(o => o.data);
    case 'products':
      const products = await getCachedProducts();
      return products.map(p => p.data);
    case 'customers':
      const customers = await getCachedCustomers();
      return customers.map(c => c.data);
    default:
      return [];
  }
}

async function cacheListData(resource: string, data: any[]): Promise<void> {
  const timestamp = Date.now();

  switch (resource) {
    case 'orders':
      await Promise.all(data.map(item => cacheOrder({ id: item.id, data: item, timestamp })));
      break;
    case 'products':
      await Promise.all(data.map(item => cacheProduct({
        id: item.id,
        data: item,
        category: item.category,
        timestamp,
      })));
      break;
    case 'customers':
      await Promise.all(data.map(item => cacheCustomer({ id: item.id, data: item, timestamp })));
      break;
  }
}

// ============================================================================
// OFFLINE QUEUE HOOK
// ============================================================================

export function useOfflineQueue(resource: string) {
  const { isOnline } = useNetworkStatus();

  const queueOperation = useCallback(async (
    type: 'create' | 'update' | 'delete',
    data: any
  ) => {
    await addToSyncQueue({
      type,
      resource,
      data,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
    });

    // Try to sync immediately if online
    if (isOnline) {
      const syncManager = getSyncManager();
      await syncManager.syncAll();
    }
  }, [resource, isOnline]);

  return {
    queueOperation,
  };
}

// ============================================================================
// PWA INSTALL HOOK
// ============================================================================

export function usePWAInstall() {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      const installed =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsInstalled(installed);
    };

    checkInstalled();

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setCanInstall(false);
      setDeferredPrompt(null);
      return true;
    }

    return false;
  };

  return {
    canInstall,
    isInstalled,
    install,
  };
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export {
  useNetworkStatus,
  useSyncStatus,
  useOfflineData,
  useOfflineList,
  useOfflineQueue,
  usePWAInstall,
};
