import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, API_TIMEOUT } from '@env';

interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  key: string;
}

class ApiClient {
  private instance: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    this.instance = axios.create({
      baseURL: API_URL || 'http://localhost:3000',
      timeout: parseInt(API_TIMEOUT) || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.instance.interceptors.request.use(
      async (config) => {
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired, handle re-authentication
          await this.handleAuthError();
        }
        return Promise.reject(this.normalizeError(error));
      }
    );
  }

  private normalizeError(error: AxiosError): ApiError {
    if (error.response) {
      return {
        message: (error.response.data as any)?.message || 'An error occurred',
        code: (error.response.data as any)?.code || error.response.status.toString(),
        details: error.response.data,
      };
    } else if (error.request) {
      return {
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR',
      };
    } else {
      return {
        message: error.message || 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
      };
    }
  }

  private async handleAuthError() {
    this.authToken = null;
    await AsyncStorage.removeItem('auth_token');
    // Emit event for logout
  }

  public setAuthToken(token: string) {
    this.authToken = token;
    AsyncStorage.setItem('auth_token', token);
  }

  public async loadAuthToken() {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      this.authToken = token;
    }
  }

  public clearAuthToken() {
    this.authToken = null;
    AsyncStorage.removeItem('auth_token');
  }

  // Generic request method with offline support
  private async request<T>(
    config: AxiosRequestConfig,
    cacheConfig?: CacheConfig
  ): Promise<T> {
    try {
      // Check cache first for GET requests
      if (config.method === 'GET' && cacheConfig) {
        const cachedData = await this.getFromCache<T>(cacheConfig.key);
        if (cachedData) {
          return cachedData;
        }
      }

      const response: AxiosResponse<T> = await this.instance.request(config);

      // Cache successful GET responses
      if (config.method === 'GET' && cacheConfig) {
        await this.saveToCache(cacheConfig.key, response.data, cacheConfig.ttl);
      }

      return response.data;
    } catch (error) {
      // If offline and cache exists, return cached data
      if (
        (error as ApiError).code === 'NETWORK_ERROR' &&
        cacheConfig
      ) {
        const cachedData = await this.getFromCache<T>(cacheConfig.key, true);
        if (cachedData) {
          return cachedData;
        }
      }
      throw error;
    }
  }

  private async getFromCache<T>(key: string, ignoreExpiry = false): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(`cache_${key}`);
      if (!cached) return null;

      const { data, expiry } = JSON.parse(cached);

      if (!ignoreExpiry && Date.now() > expiry) {
        await AsyncStorage.removeItem(`cache_${key}`);
        return null;
      }

      return data as T;
    } catch {
      return null;
    }
  }

  private async saveToCache(key: string, data: any, ttl: number) {
    try {
      const cacheData = {
        data,
        expiry: Date.now() + ttl,
      };
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }

  // HTTP Methods
  public async get<T>(url: string, config?: AxiosRequestConfig, cacheConfig?: CacheConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url }, cacheConfig);
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  public async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PATCH', url, data });
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }
}

export const apiClient = new ApiClient();
export type { ApiError };
