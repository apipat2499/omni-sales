# PWA Offline-First Architecture Guide

## Overview

Omni Sales PWA has been enhanced with comprehensive offline-first capabilities, allowing users to work seamlessly even without an internet connection. All changes made offline are automatically synchronized when the connection is restored.

## Features

### 1. **Offline Detection**
- Real-time network status monitoring
- Connection quality detection (excellent, good, poor, offline)
- Visual indicators for offline/slow connection states
- Automatic retry when connection is restored

### 2. **Data Caching**
- **Orders**: Cached for offline viewing and creation
- **Products**: Full catalog cached with category indexing
- **Customers**: Customer information cached locally
- **Inventory**: Stock status cached
- **Search Index**: Offline search capability

### 3. **Offline Operations**
- View cached orders, products, and customers
- Create draft orders offline
- Search products locally
- Browse product catalog
- View customer information

### 4. **Background Sync**
- Automatic synchronization when online
- Queue-based retry mechanism
- Conflict resolution strategies
- Progress tracking and notifications

### 5. **Cache Strategies**

#### Cache-First
Used for: Static assets, images
- Serves from cache immediately
- Updates cache in background
- Best for: Assets that rarely change

#### Network-First
Used for: API calls, dynamic data
- Tries network first
- Falls back to cache if offline
- Best for: Fresh data that needs updates

#### Stale-While-Revalidate
Used for: Documents, fonts
- Returns cached version immediately
- Updates cache in background
- Best for: Content that can be slightly stale

## Architecture

### IndexedDB Schema

```typescript
// Stores
- pendingOrders: Orders created offline
- cachedOrders: Cached order data
- cachedProducts: Product catalog
- cachedCustomers: Customer data
- cachedInventory: Inventory status
- syncQueue: Operations waiting to sync
- searchIndex: Offline search data
- metadata: App metadata and settings
```

### Sync Queue

All offline operations are queued and synchronized when online:

```typescript
{
  type: 'create' | 'update' | 'delete',
  resource: 'order' | 'product' | 'customer',
  data: any,
  status: 'pending' | 'syncing' | 'completed' | 'failed',
  timestamp: number,
  retryCount: number
}
```

## Sync Strategies

### 1. Server Wins (Default)
- Server data takes precedence
- Local changes are discarded
- Use when: Server is source of truth

### 2. Client Wins
- Client data takes precedence
- Server data is overwritten
- Use when: Client has most recent changes

### 3. Merge
- Combines client and server data
- Field-by-field comparison
- Use when: Both have valid changes

### 4. Manual
- User resolves conflicts
- Interactive conflict resolver UI
- Use when: Critical data needs review

## Components

### OfflineIndicator
Displays network status with visual feedback:
```tsx
import OfflineIndicator from '@/components/OfflineIndicator';

<OfflineIndicator />
```

### SyncStatus
Shows sync progress and pending data:
```tsx
import SyncStatus from '@/components/SyncStatus';

<SyncStatus />
```

### ConflictResolver
Interactive conflict resolution UI:
```tsx
import ConflictResolver from '@/components/ConflictResolver';

<ConflictResolver
  conflicts={conflicts}
  onResolve={handleResolve}
  onClose={handleClose}
/>
```

## Hooks

### useNetworkStatus
Monitor network status:
```tsx
const { status, isOnline, isOffline, isSlow } = useNetworkStatus();
```

### useSyncStatus
Track synchronization:
```tsx
const { isSyncing, lastSyncTime, syncNow } = useSyncStatus();
```

### useOfflineData
Load data with offline support:
```tsx
const { data, isLoading, save } = useOfflineData('product', productId);
```

### useOfflineList
Load lists with offline support:
```tsx
const { data, isLoading } = useOfflineList('products');
```

## Usage Examples

### Creating an Order Offline

```tsx
import { useOfflineQueue, useNetworkStatus } from '@/lib/hooks/useOffline';

function CreateOrder() {
  const { isOnline } = useNetworkStatus();
  const { queueOperation } = useOfflineQueue('order');

  const handleSubmit = async (orderData) => {
    if (isOnline) {
      // Save directly to server
      await fetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });
    } else {
      // Queue for offline sync
      await queueOperation('create', orderData);
      alert('Order saved offline. Will sync when online.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

### Viewing Cached Data

```tsx
import { useOfflineList } from '@/lib/hooks/useOffline';

function ProductList() {
  const { data: products, isLoading } = useOfflineList('products');

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### Manual Sync

```tsx
import { useSyncStatus } from '@/lib/hooks/useOffline';

function SyncButton() {
  const { isSyncing, syncNow } = useSyncStatus();

  return (
    <button onClick={syncNow} disabled={isSyncing}>
      {isSyncing ? 'Syncing...' : 'Sync Now'}
    </button>
  );
}
```

## Configuration

### PWA Config (`lib/pwa/config.ts`)

```typescript
{
  sync: {
    autoSync: true,              // Auto-sync when online
    syncInterval: 5 * 60 * 1000, // Sync every 5 minutes
    maxRetries: 3,               // Max retry attempts
    conflictStrategy: 'server-wins'
  },
  cache: {
    maxAge: {
      static: 30 * 24 * 60 * 60,  // 30 days
      api: 5 * 60,                 // 5 minutes
      images: 7 * 24 * 60 * 60,    // 7 days
    }
  }
}
```

## Service Worker

### Cache Management
```javascript
// Clear all caches
navigator.serviceWorker.controller.postMessage({
  type: 'CLEAR_CACHE'
});

// Get SW version
navigator.serviceWorker.controller.postMessage({
  type: 'GET_VERSION'
});

// Trigger sync
navigator.serviceWorker.controller.postMessage({
  type: 'SYNC_NOW'
});
```

### Background Sync
```javascript
// Register background sync
if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
  const registration = await navigator.serviceWorker.ready;
  await registration.sync.register('sync-orders');
}
```

## Best Practices

### 1. **Cache Wisely**
- Cache essential data only
- Set appropriate expiration times
- Monitor storage usage

### 2. **Handle Errors Gracefully**
- Show clear offline indicators
- Queue operations for retry
- Provide feedback on sync status

### 3. **Optimize Performance**
- Use IndexedDB for large datasets
- Implement pagination for lists
- Clean up old cache regularly

### 4. **User Experience**
- Show sync progress
- Indicate cached vs. fresh data
- Allow manual sync trigger

### 5. **Data Consistency**
- Choose appropriate conflict strategy
- Validate data before syncing
- Handle edge cases

## Monitoring

### Storage Usage
```typescript
import { getStorageUsage } from '@/lib/pwa/indexed-db';

const usage = await getStorageUsage();
console.log('Storage:', usage);
```

### Sync Status
```typescript
import { getSyncManager } from '@/lib/pwa/sync-manager';

const syncManager = getSyncManager();
const lastSync = await syncManager.getLastSyncTime();
const isSyncing = syncManager.isSyncInProgress();
```

## Troubleshooting

### Clear Cache
```typescript
import { clearAllData } from '@/lib/pwa/indexed-db';
await clearAllData();
```

### Reset Service Worker
```typescript
import { unregisterServiceWorker, clearCaches } from '@/lib/pwa/register-sw';
await unregisterServiceWorker();
await clearCaches();
```

### Debug Mode
```javascript
// Enable SW debug logs
localStorage.setItem('sw-debug', 'true');

// View IndexedDB in DevTools
// Application > Storage > IndexedDB > omni-sales-offline
```

## Future Enhancements

- [ ] Periodic background sync
- [ ] Push notifications for sync completion
- [ ] Advanced conflict resolution with AI
- [ ] Optimistic UI updates
- [ ] Differential sync
- [ ] Compressed cache storage
- [ ] Multi-tab synchronization
- [ ] Offline analytics

## Support

For issues or questions:
- Check browser console for errors
- Verify IndexedDB storage
- Check network tab for failed requests
- Review service worker logs

---

**Last Updated**: 2025-11-16
**Version**: 2.0
**Status**: Production Ready
