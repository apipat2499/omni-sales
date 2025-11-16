/**
 * PWA Configuration
 * Central configuration for PWA features
 */

export interface PWAConfig {
  // Service Worker
  serviceWorker: {
    url: string;
    scope: string;
    updateInterval: number; // in milliseconds
  };

  // Offline Detection
  offline: {
    pingUrl: string;
    pingInterval: number; // in milliseconds
    pingTimeout: number; // in milliseconds
  };

  // Sync Configuration
  sync: {
    autoSync: boolean;
    syncInterval: number; // in milliseconds
    maxRetries: number;
    conflictStrategy: 'server-wins' | 'client-wins' | 'merge' | 'manual';
  };

  // Cache Configuration
  cache: {
    maxAge: {
      static: number; // in seconds
      api: number; // in seconds
      images: number; // in seconds
      documents: number; // in seconds
    };
    maxEntries: {
      static: number;
      api: number;
      images: number;
      documents: number;
    };
  };

  // IndexedDB Configuration
  indexedDB: {
    name: string;
    version: number;
    maxCacheAge: number; // in milliseconds
  };

  // Features
  features: {
    backgroundSync: boolean;
    periodicBackgroundSync: boolean;
    pushNotifications: boolean;
    offlineSearch: boolean;
  };
}

// Default Configuration
export const defaultPWAConfig: PWAConfig = {
  serviceWorker: {
    url: '/sw.js',
    scope: '/',
    updateInterval: 60 * 60 * 1000, // 1 hour
  },

  offline: {
    pingUrl: '/api/health',
    pingInterval: 30000, // 30 seconds
    pingTimeout: 5000, // 5 seconds
  },

  sync: {
    autoSync: true,
    syncInterval: 5 * 60 * 1000, // 5 minutes
    maxRetries: 3,
    conflictStrategy: 'server-wins',
  },

  cache: {
    maxAge: {
      static: 30 * 24 * 60 * 60, // 30 days
      api: 5 * 60, // 5 minutes
      images: 7 * 24 * 60 * 60, // 7 days
      documents: 24 * 60 * 60, // 1 day
    },
    maxEntries: {
      static: 60,
      api: 100,
      images: 50,
      documents: 30,
    },
  },

  indexedDB: {
    name: 'omni-sales-offline',
    version: 1,
    maxCacheAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },

  features: {
    backgroundSync: true,
    periodicBackgroundSync: false, // Requires permission
    pushNotifications: true,
    offlineSearch: true,
  },
};

// Resources to cache on install
export const staticAssets = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// API endpoints to cache
export const cacheableEndpoints = [
  '/api/products',
  '/api/orders',
  '/api/customers',
  '/api/inventory',
  '/api/categories',
];

// Data to sync offline
export const syncableResources = [
  'order',
  'product',
  'customer',
  'inventory',
];

// Get PWA config (can be extended with environment variables)
export function getPWAConfig(): PWAConfig {
  return {
    ...defaultPWAConfig,
    // Override with environment variables if needed
    sync: {
      ...defaultPWAConfig.sync,
      autoSync: process.env.NEXT_PUBLIC_PWA_AUTO_SYNC !== 'false',
    },
  };
}
