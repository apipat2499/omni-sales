/**
 * IndexedDB Utilities for Offline Storage
 * Provides a simple interface for storing and retrieving data locally
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Database configuration
const DB_NAME = 'omni-sales-offline';
const DB_VERSION = 1;

// ============================================================================
// DATABASE SCHEMA
// ============================================================================

export interface OfflineDBSchema extends DBSchema {
  // Pending operations queue
  pendingOrders: {
    key: number;
    value: PendingOrder;
    indexes: { 'by-timestamp': number; 'by-status': string };
  };

  // Cached data stores
  cachedOrders: {
    key: string;
    value: CachedOrder;
    indexes: { 'by-timestamp': number };
  };

  cachedProducts: {
    key: string;
    value: CachedProduct;
    indexes: { 'by-timestamp': number; 'by-category': string };
  };

  cachedCustomers: {
    key: string;
    value: CachedCustomer;
    indexes: { 'by-timestamp': number };
  };

  cachedInventory: {
    key: string;
    value: CachedInventory;
    indexes: { 'by-timestamp': number };
  };

  // Sync queue for offline operations
  syncQueue: {
    key: number;
    value: SyncQueueItem;
    indexes: { 'by-timestamp': number; 'by-type': string; 'by-status': string };
  };

  // Search index for offline search
  searchIndex: {
    key: string;
    value: SearchIndexItem;
    indexes: { 'by-type': string };
  };

  // App settings and metadata
  metadata: {
    key: string;
    value: MetadataItem;
  };
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface PendingOrder {
  id?: number;
  orderId?: string;
  data: any;
  timestamp: number;
  status: 'pending' | 'syncing' | 'failed';
  retryCount: number;
  error?: string;
}

export interface CachedOrder {
  id: string;
  data: any;
  timestamp: number;
}

export interface CachedProduct {
  id: string;
  data: any;
  category?: string;
  timestamp: number;
}

export interface CachedCustomer {
  id: string;
  data: any;
  timestamp: number;
}

export interface CachedInventory {
  id: string;
  productId: string;
  quantity: number;
  timestamp: number;
}

export interface SyncQueueItem {
  id?: number;
  type: 'create' | 'update' | 'delete';
  resource: string; // 'order', 'product', 'customer', etc.
  data: any;
  timestamp: number;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  retryCount: number;
  error?: string;
}

export interface SearchIndexItem {
  id: string;
  type: string;
  title: string;
  description: string;
  keywords: string[];
  data: any;
}

export interface MetadataItem {
  key: string;
  value: any;
  timestamp: number;
}

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

let dbInstance: IDBPDatabase<OfflineDBSchema> | null = null;

export async function initDB(): Promise<IDBPDatabase<OfflineDBSchema>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<OfflineDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      console.log('[IndexedDB] Upgrading database from', oldVersion, 'to', newVersion);

      // Create pending orders store
      if (!db.objectStoreNames.contains('pendingOrders')) {
        const pendingOrdersStore = db.createObjectStore('pendingOrders', {
          keyPath: 'id',
          autoIncrement: true,
        });
        pendingOrdersStore.createIndex('by-timestamp', 'timestamp');
        pendingOrdersStore.createIndex('by-status', 'status');
      }

      // Create cached orders store
      if (!db.objectStoreNames.contains('cachedOrders')) {
        const cachedOrdersStore = db.createObjectStore('cachedOrders', {
          keyPath: 'id',
        });
        cachedOrdersStore.createIndex('by-timestamp', 'timestamp');
      }

      // Create cached products store
      if (!db.objectStoreNames.contains('cachedProducts')) {
        const cachedProductsStore = db.createObjectStore('cachedProducts', {
          keyPath: 'id',
        });
        cachedProductsStore.createIndex('by-timestamp', 'timestamp');
        cachedProductsStore.createIndex('by-category', 'category');
      }

      // Create cached customers store
      if (!db.objectStoreNames.contains('cachedCustomers')) {
        const cachedCustomersStore = db.createObjectStore('cachedCustomers', {
          keyPath: 'id',
        });
        cachedCustomersStore.createIndex('by-timestamp', 'timestamp');
      }

      // Create cached inventory store
      if (!db.objectStoreNames.contains('cachedInventory')) {
        const cachedInventoryStore = db.createObjectStore('cachedInventory', {
          keyPath: 'id',
        });
        cachedInventoryStore.createIndex('by-timestamp', 'timestamp');
      }

      // Create sync queue store
      if (!db.objectStoreNames.contains('syncQueue')) {
        const syncQueueStore = db.createObjectStore('syncQueue', {
          keyPath: 'id',
          autoIncrement: true,
        });
        syncQueueStore.createIndex('by-timestamp', 'timestamp');
        syncQueueStore.createIndex('by-type', 'type');
        syncQueueStore.createIndex('by-status', 'status');
      }

      // Create search index store
      if (!db.objectStoreNames.contains('searchIndex')) {
        const searchIndexStore = db.createObjectStore('searchIndex', {
          keyPath: 'id',
        });
        searchIndexStore.createIndex('by-type', 'type');
      }

      // Create metadata store
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'key' });
      }
    },
  });

  console.log('[IndexedDB] Database initialized');
  return dbInstance;
}

// ============================================================================
// PENDING ORDERS
// ============================================================================

export async function addPendingOrder(order: Omit<PendingOrder, 'id'>): Promise<number> {
  const db = await initDB();
  return db.add('pendingOrders', order as PendingOrder);
}

export async function getPendingOrders(): Promise<PendingOrder[]> {
  const db = await initDB();
  return db.getAll('pendingOrders');
}

export async function updatePendingOrder(id: number, updates: Partial<PendingOrder>): Promise<void> {
  const db = await initDB();
  const order = await db.get('pendingOrders', id);
  if (order) {
    await db.put('pendingOrders', { ...order, ...updates });
  }
}

export async function deletePendingOrder(id: number): Promise<void> {
  const db = await initDB();
  await db.delete('pendingOrders', id);
}

// ============================================================================
// CACHED ORDERS
// ============================================================================

export async function cacheOrder(order: CachedOrder): Promise<void> {
  const db = await initDB();
  await db.put('cachedOrders', order);
}

export async function getCachedOrder(id: string): Promise<CachedOrder | undefined> {
  const db = await initDB();
  return db.get('cachedOrders', id);
}

export async function getCachedOrders(): Promise<CachedOrder[]> {
  const db = await initDB();
  return db.getAll('cachedOrders');
}

export async function deleteCachedOrder(id: string): Promise<void> {
  const db = await initDB();
  await db.delete('cachedOrders', id);
}

// ============================================================================
// CACHED PRODUCTS
// ============================================================================

export async function cacheProduct(product: CachedProduct): Promise<void> {
  const db = await initDB();
  await db.put('cachedProducts', product);
}

export async function cacheProducts(products: CachedProduct[]): Promise<void> {
  const db = await initDB();
  const tx = db.transaction('cachedProducts', 'readwrite');
  await Promise.all([
    ...products.map(product => tx.store.put(product)),
    tx.done,
  ]);
}

export async function getCachedProduct(id: string): Promise<CachedProduct | undefined> {
  const db = await initDB();
  return db.get('cachedProducts', id);
}

export async function getCachedProducts(): Promise<CachedProduct[]> {
  const db = await initDB();
  return db.getAll('cachedProducts');
}

export async function getCachedProductsByCategory(category: string): Promise<CachedProduct[]> {
  const db = await initDB();
  return db.getAllFromIndex('cachedProducts', 'by-category', category);
}

export async function deleteCachedProduct(id: string): Promise<void> {
  const db = await initDB();
  await db.delete('cachedProducts', id);
}

// ============================================================================
// CACHED CUSTOMERS
// ============================================================================

export async function cacheCustomer(customer: CachedCustomer): Promise<void> {
  const db = await initDB();
  await db.put('cachedCustomers', customer);
}

export async function cacheCustomers(customers: CachedCustomer[]): Promise<void> {
  const db = await initDB();
  const tx = db.transaction('cachedCustomers', 'readwrite');
  await Promise.all([
    ...customers.map(customer => tx.store.put(customer)),
    tx.done,
  ]);
}

export async function getCachedCustomer(id: string): Promise<CachedCustomer | undefined> {
  const db = await initDB();
  return db.get('cachedCustomers', id);
}

export async function getCachedCustomers(): Promise<CachedCustomer[]> {
  const db = await initDB();
  return db.getAll('cachedCustomers');
}

// ============================================================================
// CACHED INVENTORY
// ============================================================================

export async function cacheInventory(inventory: CachedInventory): Promise<void> {
  const db = await initDB();
  await db.put('cachedInventory', inventory);
}

export async function getCachedInventory(id: string): Promise<CachedInventory | undefined> {
  const db = await initDB();
  return db.get('cachedInventory', id);
}

// ============================================================================
// SYNC QUEUE
// ============================================================================

export async function addToSyncQueue(item: Omit<SyncQueueItem, 'id'>): Promise<number> {
  const db = await initDB();
  return db.add('syncQueue', item as SyncQueueItem);
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const db = await initDB();
  return db.getAllFromIndex('syncQueue', 'by-status', 'pending');
}

export async function updateSyncQueueItem(id: number, updates: Partial<SyncQueueItem>): Promise<void> {
  const db = await initDB();
  const item = await db.get('syncQueue', id);
  if (item) {
    await db.put('syncQueue', { ...item, ...updates });
  }
}

export async function deleteSyncQueueItem(id: number): Promise<void> {
  const db = await initDB();
  await db.delete('syncQueue', id);
}

export async function clearCompletedSyncItems(): Promise<void> {
  const db = await initDB();
  const completed = await db.getAllFromIndex('syncQueue', 'by-status', 'completed');
  const tx = db.transaction('syncQueue', 'readwrite');
  await Promise.all([
    ...completed.map(item => item.id && tx.store.delete(item.id)),
    tx.done,
  ]);
}

// ============================================================================
// SEARCH INDEX
// ============================================================================

export async function addToSearchIndex(item: SearchIndexItem): Promise<void> {
  const db = await initDB();
  await db.put('searchIndex', item);
}

export async function searchOffline(query: string): Promise<SearchIndexItem[]> {
  const db = await initDB();
  const allItems = await db.getAll('searchIndex');

  const lowerQuery = query.toLowerCase();
  return allItems.filter(item => {
    return (
      item.title.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery) ||
      item.keywords.some(keyword => keyword.toLowerCase().includes(lowerQuery))
    );
  });
}

export async function clearSearchIndex(): Promise<void> {
  const db = await initDB();
  await db.clear('searchIndex');
}

// ============================================================================
// METADATA
// ============================================================================

export async function setMetadata(key: string, value: any): Promise<void> {
  const db = await initDB();
  await db.put('metadata', {
    key,
    value,
    timestamp: Date.now(),
  });
}

export async function getMetadata(key: string): Promise<any> {
  const db = await initDB();
  const item = await db.get('metadata', key);
  return item?.value;
}

export async function deleteMetadata(key: string): Promise<void> {
  const db = await initDB();
  await db.delete('metadata', key);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export async function clearAllData(): Promise<void> {
  const db = await initDB();
  await Promise.all([
    db.clear('pendingOrders'),
    db.clear('cachedOrders'),
    db.clear('cachedProducts'),
    db.clear('cachedCustomers'),
    db.clear('cachedInventory'),
    db.clear('syncQueue'),
    db.clear('searchIndex'),
    db.clear('metadata'),
  ]);
  console.log('[IndexedDB] All data cleared');
}

export async function getStorageUsage(): Promise<{
  pendingOrders: number;
  cachedOrders: number;
  cachedProducts: number;
  cachedCustomers: number;
  syncQueue: number;
}> {
  const db = await initDB();
  const [pendingOrders, cachedOrders, cachedProducts, cachedCustomers, syncQueue] = await Promise.all([
    db.count('pendingOrders'),
    db.count('cachedOrders'),
    db.count('cachedProducts'),
    db.count('cachedCustomers'),
    db.count('syncQueue'),
  ]);

  return {
    pendingOrders,
    cachedOrders,
    cachedProducts,
    cachedCustomers,
    syncQueue,
  };
}

export async function deleteOldCache(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
  const db = await initDB();
  const cutoff = Date.now() - maxAge;

  // Delete old cached orders
  const oldOrders = await db.getAllFromIndex('cachedOrders', 'by-timestamp', IDBKeyRange.upperBound(cutoff));
  await Promise.all(oldOrders.map(order => db.delete('cachedOrders', order.id)));

  // Delete old cached products
  const oldProducts = await db.getAllFromIndex('cachedProducts', 'by-timestamp', IDBKeyRange.upperBound(cutoff));
  await Promise.all(oldProducts.map(product => db.delete('cachedProducts', product.id)));

  // Delete old cached customers
  const oldCustomers = await db.getAllFromIndex('cachedCustomers', 'by-timestamp', IDBKeyRange.upperBound(cutoff));
  await Promise.all(oldCustomers.map(customer => db.delete('cachedCustomers', customer.id)));

  console.log('[IndexedDB] Old cache deleted');
}
