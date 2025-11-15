/**
 * PWA Utility Functions
 * Client-side utilities for Progressive Web App features
 */

/**
 * Check if the app is running in standalone mode (installed as PWA)
 */
export function isPWAInstalled(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Check if the app can be installed (beforeinstallprompt supported)
 */
export function canInstallPWA(): boolean {
  if (typeof window === 'undefined') return false;

  // This is a basic check; actual installability is determined by the browser
  return 'BeforeInstallPromptEvent' in window || 'onbeforeinstallprompt' in window;
}

/**
 * Check if service workers are supported
 */
export function isServiceWorkerSupported(): boolean {
  if (typeof window === 'undefined') return false;

  return 'serviceWorker' in navigator;
}

/**
 * Check if the device is online
 */
export function isOnline(): boolean {
  if (typeof window === 'undefined') return true;

  return navigator.onLine;
}

/**
 * Check if the device is iOS
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;

  const ua = window.navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua);
}

/**
 * Check if the device is Android
 */
export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false;

  const ua = window.navigator.userAgent;
  return /Android/.test(ua);
}

/**
 * Check if running on mobile device
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Get the install prompt text based on the platform
 */
export function getInstallPromptText(): {
  title: string;
  description: string;
  buttonText: string;
} {
  if (isIOS()) {
    return {
      title: 'ติดตั้งแอปบน iOS',
      description: 'ใช้ปุ่ม Share ใน Safari และเลือก "Add to Home Screen"',
      buttonText: 'ดูวิธีการ',
    };
  }

  return {
    title: 'ติดตั้ง Omni Sales',
    description: 'ติดตั้งแอปบนอุปกรณ์ของคุณเพื่อประสบการณ์ที่ดีขึ้น',
    buttonText: 'ติดตั้ง',
  };
}

/**
 * Get display mode (browser, standalone, etc.)
 */
export function getDisplayMode(): 'browser' | 'standalone' | 'minimal-ui' | 'fullscreen' {
  if (typeof window === 'undefined') return 'browser';

  if (window.matchMedia('(display-mode: standalone)').matches) {
    return 'standalone';
  }
  if (window.matchMedia('(display-mode: minimal-ui)').matches) {
    return 'minimal-ui';
  }
  if (window.matchMedia('(display-mode: fullscreen)').matches) {
    return 'fullscreen';
  }
  return 'browser';
}

/**
 * Add event listener for online/offline events
 */
export function addOnlineListener(callback: (online: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Add event listener for app installed event
 */
export function addAppInstalledListener(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  window.addEventListener('appinstalled', callback);

  // Return cleanup function
  return () => {
    window.removeEventListener('appinstalled', callback);
  };
}

/**
 * Check if notifications are supported
 */
export function isNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;

  return 'Notification' in window;
}

/**
 * Get notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';

  return Notification.permission;
}

/**
 * Show a local notification (requires permission)
 */
export async function showNotification(
  title: string,
  options?: NotificationOptions
): Promise<boolean> {
  if (!isNotificationSupported()) {
    console.warn('[PWA] Notifications not supported');
    return false;
  }

  if (Notification.permission !== 'granted') {
    console.warn('[PWA] Notification permission not granted');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.showNotification(title, options);
      return true;
    }
  } catch (error) {
    console.error('[PWA] Failed to show notification:', error);
  }

  return false;
}

/**
 * Vibrate the device (if supported)
 */
export function vibrate(pattern: number | number[]): boolean {
  if (typeof window === 'undefined') return false;

  if ('vibrate' in navigator) {
    return navigator.vibrate(pattern);
  }

  return false;
}

/**
 * Share content using Web Share API
 */
export async function share(data: ShareData): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  if ('share' in navigator) {
    try {
      await navigator.share(data);
      return true;
    } catch (error) {
      // User cancelled or share failed
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('[PWA] Share failed:', error);
      }
      return false;
    }
  }

  console.warn('[PWA] Web Share API not supported');
  return false;
}

/**
 * Check if Web Share API is supported
 */
export function isShareSupported(): boolean {
  if (typeof window === 'undefined') return false;

  return 'share' in navigator;
}

/**
 * Get battery status (if supported)
 */
export async function getBatteryStatus(): Promise<{
  level: number;
  charging: boolean;
} | null> {
  if (typeof window === 'undefined') return null;

  if ('getBattery' in navigator) {
    try {
      const battery = await (navigator as any).getBattery();
      return {
        level: battery.level,
        charging: battery.charging,
      };
    } catch (error) {
      console.error('[PWA] Failed to get battery status:', error);
    }
  }

  return null;
}

/**
 * Check if the app should show install prompt
 * (Not installed, prompt available, not dismissed)
 */
export function shouldShowInstallPrompt(): boolean {
  if (typeof window === 'undefined') return false;

  // Don't show if already installed
  if (isPWAInstalled()) return false;

  // Don't show if dismissed in this session
  if (sessionStorage.getItem('pwa-install-dismissed')) return false;

  return true;
}

/**
 * Dismiss install prompt for this session
 */
export function dismissInstallPrompt(): void {
  if (typeof window === 'undefined') return;

  sessionStorage.setItem('pwa-install-dismissed', 'true');
}

/**
 * Clear install prompt dismissal
 */
export function clearInstallPromptDismissal(): void {
  if (typeof window === 'undefined') return;

  sessionStorage.removeItem('pwa-install-dismissed');
}

/**
 * Get estimated storage quota and usage
 */
export async function getStorageEstimate(): Promise<{
  usage: number;
  quota: number;
  percentage: number;
} | null> {
  if (typeof window === 'undefined') return null;

  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentage = quota > 0 ? (usage / quota) * 100 : 0;

      return {
        usage,
        quota,
        percentage,
      };
    } catch (error) {
      console.error('[PWA] Failed to get storage estimate:', error);
    }
  }

  return null;
}

/**
 * Request persistent storage
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  if ('storage' in navigator && 'persist' in navigator.storage) {
    try {
      return await navigator.storage.persist();
    } catch (error) {
      console.error('[PWA] Failed to request persistent storage:', error);
    }
  }

  return false;
}

/**
 * Check if storage is persistent
 */
export async function isPersistentStorage(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  if ('storage' in navigator && 'persisted' in navigator.storage) {
    try {
      return await navigator.storage.persisted();
    } catch (error) {
      console.error('[PWA] Failed to check persistent storage:', error);
    }
  }

  return false;
}
