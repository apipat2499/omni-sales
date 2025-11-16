/**
 * Offline Detection Utilities
 * Detects and manages network status
 */

export type NetworkStatus = 'online' | 'offline' | 'slow';

export interface NetworkInfo {
  online: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

export interface OfflineDetectorOptions {
  pingUrl?: string;
  pingInterval?: number;
  pingTimeout?: number;
  onStatusChange?: (status: NetworkStatus) => void;
  onNetworkChange?: (info: NetworkInfo) => void;
}

// ============================================================================
// OFFLINE DETECTOR CLASS
// ============================================================================

export class OfflineDetector {
  private status: NetworkStatus = 'online';
  private pingInterval?: NodeJS.Timeout;
  private options: Required<OfflineDetectorOptions>;
  private listeners: Set<(status: NetworkStatus) => void> = new Set();

  constructor(options: OfflineDetectorOptions = {}) {
    this.options = {
      pingUrl: '/api/health',
      pingInterval: 30000, // 30 seconds
      pingTimeout: 5000, // 5 seconds
      onStatusChange: () => {},
      onNetworkChange: () => {},
      ...options,
    };

    this.initialize();
  }

  /**
   * Initialize offline detection
   */
  private initialize(): void {
    if (typeof window === 'undefined') return;

    // Initial status
    this.updateStatus(navigator.onLine ? 'online' : 'offline');

    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Listen for connection changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection?.addEventListener('change', this.handleConnectionChange);
    }

    // Start ping monitoring
    this.startPing();

    console.log('[OfflineDetector] Initialized');
  }

  /**
   * Handle online event
   */
  private handleOnline = (): void => {
    console.log('[OfflineDetector] Online event detected');
    this.updateStatus('online');
    this.verifyConnection();
  };

  /**
   * Handle offline event
   */
  private handleOffline = (): void => {
    console.log('[OfflineDetector] Offline event detected');
    this.updateStatus('offline');
  };

  /**
   * Handle connection change
   */
  private handleConnectionChange = (): void => {
    console.log('[OfflineDetector] Connection changed');
    this.options.onNetworkChange(this.getNetworkInfo());
    this.verifyConnection();
  };

  /**
   * Update network status
   */
  private updateStatus(newStatus: NetworkStatus): void {
    if (this.status !== newStatus) {
      const oldStatus = this.status;
      this.status = newStatus;

      console.log('[OfflineDetector] Status changed:', oldStatus, '->', newStatus);

      // Notify listeners
      this.options.onStatusChange(newStatus);
      this.listeners.forEach(listener => listener(newStatus));

      // Dispatch custom event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('networkstatus', {
          detail: { status: newStatus, info: this.getNetworkInfo() },
        }));
      }
    }
  }

  /**
   * Start periodic ping to verify connection
   */
  private startPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    this.pingInterval = setInterval(() => {
      if (navigator.onLine) {
        this.verifyConnection();
      }
    }, this.options.pingInterval);
  }

  /**
   * Verify actual connection with server
   */
  private async verifyConnection(): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.options.pingTimeout);

      const start = Date.now();
      const response = await fetch(this.options.pingUrl, {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal,
      });
      const duration = Date.now() - start;

      clearTimeout(timeoutId);

      if (response.ok) {
        // Check if connection is slow
        if (duration > 2000) {
          this.updateStatus('slow');
        } else {
          this.updateStatus('online');
        }
      } else {
        this.updateStatus('offline');
      }
    } catch (error) {
      console.warn('[OfflineDetector] Ping failed:', error);
      this.updateStatus('offline');
    }
  }

  /**
   * Get current network status
   */
  public getStatus(): NetworkStatus {
    return this.status;
  }

  /**
   * Check if online
   */
  public isOnline(): boolean {
    return this.status === 'online' || this.status === 'slow';
  }

  /**
   * Check if offline
   */
  public isOffline(): boolean {
    return this.status === 'offline';
  }

  /**
   * Check if connection is slow
   */
  public isSlow(): boolean {
    return this.status === 'slow';
  }

  /**
   * Get detailed network information
   */
  public getNetworkInfo(): NetworkInfo {
    if (typeof navigator === 'undefined') {
      return { online: true };
    }

    const info: NetworkInfo = {
      online: navigator.onLine,
    };

    // Get connection info if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      info.effectiveType = connection?.effectiveType;
      info.downlink = connection?.downlink;
      info.rtt = connection?.rtt;
      info.saveData = connection?.saveData;
    }

    return info;
  }

  /**
   * Add status change listener
   */
  public addListener(listener: (status: NetworkStatus) => void): void {
    this.listeners.add(listener);
  }

  /**
   * Remove status change listener
   */
  public removeListener(listener: (status: NetworkStatus) => void): void {
    this.listeners.delete(listener);
  }

  /**
   * Force check connection status
   */
  public async checkNow(): Promise<NetworkStatus> {
    await this.verifyConnection();
    return this.status;
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);

      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        connection?.removeEventListener('change', this.handleConnectionChange);
      }
    }

    this.listeners.clear();
    console.log('[OfflineDetector] Destroyed');
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let offlineDetectorInstance: OfflineDetector | null = null;

export function getOfflineDetector(options?: OfflineDetectorOptions): OfflineDetector {
  if (!offlineDetectorInstance) {
    offlineDetectorInstance = new OfflineDetector(options);
  }
  return offlineDetectorInstance;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Simple check if device is online
 */
export function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

/**
 * Simple check if device is offline
 */
export function isOffline(): boolean {
  return !isOnline();
}

/**
 * Wait for online status
 */
export function waitForOnline(timeout?: number): Promise<boolean> {
  return new Promise((resolve) => {
    if (isOnline()) {
      resolve(true);
      return;
    }

    const timeoutId = timeout
      ? setTimeout(() => {
          window.removeEventListener('online', handleOnline);
          resolve(false);
        }, timeout)
      : undefined;

    const handleOnline = () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('online', handleOnline);
      resolve(true);
    };

    window.addEventListener('online', handleOnline);
  });
}

/**
 * Execute callback when online
 */
export function whenOnline(callback: () => void): void {
  if (isOnline()) {
    callback();
  } else {
    const handleOnline = () => {
      window.removeEventListener('online', handleOnline);
      callback();
    };
    window.addEventListener('online', handleOnline);
  }
}

/**
 * Get connection quality
 */
export function getConnectionQuality(): 'excellent' | 'good' | 'poor' | 'offline' {
  if (!isOnline()) return 'offline';

  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    const effectiveType = connection?.effectiveType;

    switch (effectiveType) {
      case '4g':
        return 'excellent';
      case '3g':
        return 'good';
      case '2g':
      case 'slow-2g':
        return 'poor';
      default:
        return 'good';
    }
  }

  return 'good';
}

/**
 * Check if data saver mode is enabled
 */
export function isDataSaverEnabled(): boolean {
  if (typeof navigator === 'undefined') return false;

  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    return connection?.saveData === true;
  }

  return false;
}

/**
 * Get estimated bandwidth (in Mbps)
 */
export function getEstimatedBandwidth(): number | null {
  if (typeof navigator === 'undefined') return null;

  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    return connection?.downlink || null;
  }

  return null;
}

/**
 * Get round-trip time (in ms)
 */
export function getRoundTripTime(): number | null {
  if (typeof navigator === 'undefined') return null;

  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    return connection?.rtt || null;
  }

  return null;
}
