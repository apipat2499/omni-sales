import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  data?: any;
  timestamp: number;
}

export class OfflineService {
  private isOnline: boolean = true;
  private requestQueue: QueuedRequest[] = [];

  async initialize(): Promise<void> {
    // Load queued requests from storage
    await this.loadQueue();

    // Subscribe to network state changes
    NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      // If we just came online, process the queue
      if (wasOffline && this.isOnline) {
        this.processQueue();
      }
    });
  }

  async saveForOffline<T>(key: string, data: T): Promise<void> {
    try {
      await AsyncStorage.setItem(`offline_${key}`, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  }

  async getOfflineData<T>(key: string): Promise<T | null> {
    try {
      const data = await AsyncStorage.getItem(`offline_${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting offline data:', error);
      return null;
    }
  }

  async removeOfflineData(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`offline_${key}`);
    } catch (error) {
      console.error('Error removing offline data:', error);
    }
  }

  async queueRequest(url: string, method: string, data?: any): Promise<void> {
    const request: QueuedRequest = {
      id: `${Date.now()}_${Math.random()}`,
      url,
      method,
      data,
      timestamp: Date.now(),
    };

    this.requestQueue.push(request);
    await this.saveQueue();
  }

  private async loadQueue(): Promise<void> {
    try {
      const queueJson = await AsyncStorage.getItem('request_queue');
      if (queueJson) {
        this.requestQueue = JSON.parse(queueJson);
      }
    } catch (error) {
      console.error('Error loading request queue:', error);
    }
  }

  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem('request_queue', JSON.stringify(this.requestQueue));
    } catch (error) {
      console.error('Error saving request queue:', error);
    }
  }

  private async processQueue(): Promise<void> {
    if (this.requestQueue.length === 0) return;

    const queue = [...this.requestQueue];
    this.requestQueue = [];

    for (const request of queue) {
      try {
        // Process request
        // You would integrate this with your API client
        console.log('Processing queued request:', request);
      } catch (error) {
        // If request fails, add it back to the queue
        this.requestQueue.push(request);
      }
    }

    await this.saveQueue();
  }

  getConnectionStatus(): boolean {
    return this.isOnline;
  }

  getQueueLength(): number {
    return this.requestQueue.length;
  }

  async clearQueue(): Promise<void> {
    this.requestQueue = [];
    await AsyncStorage.removeItem('request_queue');
  }
}

export const offlineService = new OfflineService();
