/**
 * Service Worker Registration
 * This file handles the registration of the service worker for PWA functionality
 */

export function registerServiceWorker() {
  // Only register service worker in production and if supported
  if (
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator) ||
    process.env.NODE_ENV !== 'production'
  ) {
    console.log('[PWA] Service worker not registered:', {
      isServer: typeof window === 'undefined',
      supported: 'serviceWorker' in navigator,
      env: process.env.NODE_ENV,
    });
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('[PWA] Service Worker registered successfully:', registration.scope);

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Check every hour

        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;

          if (newWorker) {
            console.log('[PWA] New service worker found, installing...');

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker installed and ready to activate
                console.log('[PWA] New service worker installed, waiting to activate');

                // Notify user about the update
                if (confirm('มีเวอร์ชันใหม่พร้อมให้ใช้งาน คุณต้องการรีเฟรชหน้านี้หรือไม่?')) {
                  // Tell the new service worker to skip waiting
                  newWorker.postMessage({ type: 'SKIP_WAITING' });

                  // Reload the page to activate the new service worker
                  window.location.reload();
                }
              }
            });
          }
        });

        // Handle controller change (new service worker activated)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('[PWA] Service worker controller changed');
        });
      })
      .catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error);
      });

    // Handle online/offline events
    window.addEventListener('online', () => {
      console.log('[PWA] App is online');
      // You can dispatch a custom event here to notify your app
      window.dispatchEvent(new CustomEvent('app-online'));
    });

    window.addEventListener('offline', () => {
      console.log('[PWA] App is offline');
      // You can dispatch a custom event here to notify your app
      window.dispatchEvent(new CustomEvent('app-offline'));
    });
  });
}

/**
 * Unregister all service workers
 * Useful for development or troubleshooting
 */
export async function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();

    for (const registration of registrations) {
      const success = await registration.unregister();
      console.log('[PWA] Service worker unregistered:', success);
    }
  }
}

/**
 * Clear all caches
 * Useful for development or troubleshooting
 */
export async function clearCaches() {
  if ('caches' in window) {
    const cacheNames = await caches.keys();

    for (const cacheName of cacheNames) {
      const deleted = await caches.delete(cacheName);
      console.log('[PWA] Cache deleted:', cacheName, deleted);
    }
  }
}

/**
 * Check if app is running in standalone mode (installed as PWA)
 */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Get service worker registration
 */
export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if ('serviceWorker' in navigator) {
    try {
      return (await navigator.serviceWorker.getRegistration()) || null;
    } catch (error) {
      console.error('[PWA] Failed to get service worker registration:', error);
      return null;
    }
  }
  return null;
}

/**
 * Send message to service worker
 */
export async function sendMessageToSW(message: any): Promise<void> {
  const registration = await getServiceWorkerRegistration();

  if (registration && registration.active) {
    registration.active.postMessage(message);
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('[PWA] This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    return await Notification.requestPermission();
  }

  return Notification.permission;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(vapidPublicKey: string): Promise<PushSubscription | null> {
  try {
    const registration = await getServiceWorkerRegistration();

    if (!registration) {
      console.error('[PWA] No service worker registration found');
      return null;
    }

    const permission = await requestNotificationPermission();

    if (permission !== 'granted') {
      console.warn('[PWA] Notification permission not granted');
      return null;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    console.log('[PWA] Push subscription:', subscription);
    return subscription;
  } catch (error) {
    console.error('[PWA] Failed to subscribe to push notifications:', error);
    return null;
  }
}

/**
 * Convert VAPID key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray as Uint8Array<ArrayBuffer>;
}
