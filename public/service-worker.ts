/**
 * Enhanced Service Worker for Omni Sales PWA
 * Offline-First Architecture with Background Sync
 */

/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import {
  NetworkFirst,
  CacheFirst,
  StaleWhileRevalidate,
  NetworkOnly,
} from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// Configuration
const CACHE_VERSION = 'v2';
const CACHE_PREFIX = 'omni-sales';
const STATIC_CACHE = `${CACHE_PREFIX}-static-${CACHE_VERSION}`;
const API_CACHE = `${CACHE_PREFIX}-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `${CACHE_PREFIX}-images-${CACHE_VERSION}`;
const DOCUMENT_CACHE = `${CACHE_PREFIX}-documents-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

// Cache size limits
const MAX_ENTRIES = {
  static: 60,
  api: 100,
  images: 50,
  documents: 30,
};

// Cache duration (in seconds)
const MAX_AGE = {
  static: 30 * 24 * 60 * 60, // 30 days
  api: 5 * 60, // 5 minutes
  images: 7 * 24 * 60 * 60, // 7 days
  documents: 24 * 60 * 60, // 1 day
};

// Claim clients immediately
clientsClaim();

// Precache static assets
self.skipWaiting();
precacheAndRoute(self.__WB_MANIFEST || []);

// ============================================================================
// CACHING STRATEGIES
// ============================================================================

/**
 * API Routes - Network First with Background Sync
 * Try network first, fall back to cache if offline
 */
const bgSyncPlugin = new BackgroundSyncPlugin('apiQueue', {
  maxRetentionTime: 24 * 60, // Retry for up to 24 hours (in minutes)
  onSync: async ({ queue }) => {
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request);
        console.log('[SW] Background sync successful:', entry.request.url);
      } catch (error) {
        console.error('[SW] Background sync failed:', error);
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  },
});

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: API_CACHE,
    plugins: [
      new ExpirationPlugin({
        maxEntries: MAX_ENTRIES.api,
        maxAgeSeconds: MAX_AGE.api,
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      bgSyncPlugin,
    ],
  }),
  'POST'
);

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: API_CACHE,
    plugins: [
      new ExpirationPlugin({
        maxEntries: MAX_ENTRIES.api,
        maxAgeSeconds: MAX_AGE.api,
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  }),
  'GET'
);

/**
 * Static Assets - Cache First
 * Serve from cache first, update cache in background
 */
registerRoute(
  ({ request, url }) =>
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/static/') ||
    request.destination === 'script' ||
    request.destination === 'style',
  new CacheFirst({
    cacheName: STATIC_CACHE,
    plugins: [
      new ExpirationPlugin({
        maxEntries: MAX_ENTRIES.static,
        maxAgeSeconds: MAX_AGE.static,
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

/**
 * Images - Cache First with Stale While Revalidate
 * Serve cached images immediately, update in background
 */
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: IMAGE_CACHE,
    plugins: [
      new ExpirationPlugin({
        maxEntries: MAX_ENTRIES.images,
        maxAgeSeconds: MAX_AGE.images,
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

/**
 * Documents and Fonts - Stale While Revalidate
 * Return cached version immediately, update in background
 */
registerRoute(
  ({ request }) =>
    request.destination === 'document' ||
    request.destination === 'font',
  new StaleWhileRevalidate({
    cacheName: DOCUMENT_CACHE,
    plugins: [
      new ExpirationPlugin({
        maxEntries: MAX_ENTRIES.documents,
        maxAgeSeconds: MAX_AGE.documents,
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

/**
 * Navigation Routes - Network First with Offline Fallback
 */
registerRoute(
  new NavigationRoute(
    async (params) => {
      try {
        return await fetch(params.request);
      } catch (error) {
        const cache = await caches.open(DOCUMENT_CACHE);
        const cachedResponse = await cache.match(params.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        // Return offline page as fallback
        return cache.match(OFFLINE_URL) || Response.error();
      }
    }
  )
);

// ============================================================================
// BACKGROUND SYNC
// ============================================================================

/**
 * Handle background sync events
 */
self.addEventListener('sync', (event: SyncEvent) => {
  console.log('[SW] Background sync event:', event.tag);

  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  } else if (event.tag === 'sync-products') {
    event.waitUntil(syncProducts());
  } else if (event.tag === 'sync-customers') {
    event.waitUntil(syncCustomers());
  } else if (event.tag.startsWith('sync-')) {
    event.waitUntil(genericSync(event.tag));
  }
});

async function syncOrders(): Promise<void> {
  console.log('[SW] Syncing orders...');
  try {
    // Get pending orders from IndexedDB and sync to server
    const db = await openDB();
    const tx = db.transaction('pendingOrders', 'readonly');
    const store = tx.objectStore('pendingOrders');
    const orders = await store.getAll();

    for (const order of orders) {
      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order),
        });

        if (response.ok) {
          // Remove from pending queue
          const deleteTx = db.transaction('pendingOrders', 'readwrite');
          await deleteTx.objectStore('pendingOrders').delete(order.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync order:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Order sync failed:', error);
  }
}

async function syncProducts(): Promise<void> {
  console.log('[SW] Syncing products...');
  // Implement product sync logic
}

async function syncCustomers(): Promise<void> {
  console.log('[SW] Syncing customers...');
  // Implement customer sync logic
}

async function genericSync(tag: string): Promise<void> {
  console.log('[SW] Generic sync:', tag);
  // Implement generic sync logic
}

// ============================================================================
// PERIODIC BACKGROUND SYNC
// ============================================================================

/**
 * Handle periodic background sync (requires registration)
 */
self.addEventListener('periodicsync', (event: any) => {
  console.log('[SW] Periodic background sync:', event.tag);

  if (event.tag === 'sync-data') {
    event.waitUntil(periodicDataSync());
  }
});

async function periodicDataSync(): Promise<void> {
  console.log('[SW] Periodic data sync...');
  try {
    // Sync critical data periodically
    await Promise.all([
      syncOrders(),
      syncProducts(),
      syncCustomers(),
    ]);
  } catch (error) {
    console.error('[SW] Periodic sync failed:', error);
  }
}

// ============================================================================
// PUSH NOTIFICATIONS
// ============================================================================

/**
 * Handle push notification events
 */
self.addEventListener('push', (event: PushEvent) => {
  console.log('[SW] Push notification received');

  if (!event.data) return;

  const data = event.data.json();
  const title = data.title || 'Omni Sales';
  const options: NotificationOptions = {
    body: data.body || 'มีการอัพเดทใหม่',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: data.url || '/',
    tag: data.tag || 'general',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

/**
 * Handle notification clicks
 */
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  console.log('[SW] Notification clicked:', event.notification.tag);

  event.notification.close();

  const urlToOpen = event.notification.data || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there's already a window open
        for (const client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // No window open, open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// ============================================================================
// MESSAGE HANDLING
// ============================================================================

/**
 * Handle messages from clients
 */
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  console.log('[SW] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(clearAllCaches());
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(cacheUrls(event.data.urls));
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }

  if (event.data && event.data.type === 'SYNC_NOW') {
    event.waitUntil(periodicDataSync());
  }
});

async function clearAllCaches(): Promise<void> {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames
      .filter(name => name.startsWith(CACHE_PREFIX))
      .map(name => caches.delete(name))
  );
  console.log('[SW] All caches cleared');
}

async function cacheUrls(urls: string[]): Promise<void> {
  const cache = await caches.open(STATIC_CACHE);
  await cache.addAll(urls);
  console.log('[SW] URLs cached:', urls.length);
}

// ============================================================================
// INDEXEDDB HELPER
// ============================================================================

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('omni-sales-offline', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores
      if (!db.objectStoreNames.contains('pendingOrders')) {
        db.createObjectStore('pendingOrders', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('cachedOrders')) {
        db.createObjectStore('cachedOrders', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('cachedProducts')) {
        db.createObjectStore('cachedProducts', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('cachedCustomers')) {
        db.createObjectStore('cachedCustomers', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

// ============================================================================
// INSTALL & ACTIVATE
// ============================================================================

self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll([
        '/',
        '/offline.html',
        '/manifest.json',
      ]).catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      });
    })
  );
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName.startsWith(CACHE_PREFIX) &&
                   !cacheName.includes(CACHE_VERSION);
          })
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
});

console.log('[SW] Service worker loaded - Offline-First Mode');
