/**
 * API Client for Omni-Sales Application
 * ไคลเอนต์ API สำหรับแอปพลิเคชัน Omni-Sales
 *
 * Provides a centralized HTTP client with:
 * - Authentication token management
 * - Request/response interceptors
 * - Error handling
 * - Type safety
 */

export interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  onError?: (error: ApiError) => void;
  onUnauthorized?: () => void;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string | number | boolean>;
  signal?: AbortSignal;
}

type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
type ResponseInterceptor = (response: Response) => Response | Promise<Response>;
type ErrorInterceptor = (error: ApiError) => ApiError | Promise<ApiError>;

/**
 * Main API Client Class
 * คลาสหลักสำหรับ API Client
 */
export class ApiClient {
  private baseURL: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;
  private authToken: string | null = null;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];
  private onError?: (error: ApiError) => void;
  private onUnauthorized?: () => void;

  constructor(config: ApiClientConfig = {}) {
    this.baseURL = config.baseURL || '/api';
    this.timeout = config.timeout || 30000;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...config.headers,
    };
    this.onError = config.onError;
    this.onUnauthorized = config.onUnauthorized;
  }

  /**
   * Set authentication token
   * ตั้งค่า token สำหรับการยืนยันตัวตน
   */
  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  /**
   * Get current authentication token
   * รับ token ปัจจุบัน
   */
  getAuthToken(): string | null {
    return this.authToken;
  }

  /**
   * Add request interceptor
   * เพิ่ม interceptor สำหรับ request
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   * เพิ่ม interceptor สำหรับ response
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Add error interceptor
   * เพิ่ม interceptor สำหรับ error
   */
  addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor);
  }

  /**
   * Build URL with query parameters
   * สร้าง URL พร้อม query parameters
   */
  private buildURL(endpoint: string, params?: Record<string, string | number | boolean>): string {
    const url = new URL(endpoint, this.baseURL.startsWith('http') ? this.baseURL : `${window.location.origin}${this.baseURL}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Apply request interceptors
   * ประมวลผล request interceptors
   */
  private async applyRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
    let modifiedConfig = { ...config };

    for (const interceptor of this.requestInterceptors) {
      modifiedConfig = await interceptor(modifiedConfig);
    }

    return modifiedConfig;
  }

  /**
   * Apply response interceptors
   * ประมวลผล response interceptors
   */
  private async applyResponseInterceptors(response: Response): Promise<Response> {
    let modifiedResponse = response;

    for (const interceptor of this.responseInterceptors) {
      modifiedResponse = await interceptor(modifiedResponse);
    }

    return modifiedResponse;
  }

  /**
   * Apply error interceptors
   * ประมวลผล error interceptors
   */
  private async applyErrorInterceptors(error: ApiError): Promise<ApiError> {
    let modifiedError = error;

    for (const interceptor of this.errorInterceptors) {
      modifiedError = await interceptor(modifiedError);
    }

    return modifiedError;
  }

  /**
   * Handle API errors
   * จัดการข้อผิดพลาดจาก API
   */
  private async handleError(error: any, response?: Response): Promise<never> {
    let apiError: ApiError;

    if (response) {
      let errorData: any = {};

      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          errorData = { message: await response.text() };
        }
      } catch (e) {
        errorData = { message: response.statusText };
      }

      apiError = {
        message: errorData.error || errorData.message || `HTTP ${response.status}`,
        status: response.status,
        code: errorData.code,
        details: errorData.details || errorData,
      };

      // Handle unauthorized
      if (response.status === 401 && this.onUnauthorized) {
        this.onUnauthorized();
      }
    } else {
      apiError = {
        message: error.message || 'Network error occurred',
        details: error,
      };
    }

    // Apply error interceptors
    const modifiedError = await this.applyErrorInterceptors(apiError);

    // Call global error handler
    if (this.onError) {
      this.onError(modifiedError);
    }

    throw modifiedError;
  }

  /**
   * Make HTTP request
   * ทำการ request HTTP
   */
  async request<T = any>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    try {
      // Apply request interceptors
      const modifiedConfig = await this.applyRequestInterceptors(config);

      // Build headers
      const headers: Record<string, string> = {
        ...this.defaultHeaders,
        ...modifiedConfig.headers,
      };

      // Add auth token if available
      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      // Build URL with params
      const url = this.buildURL(endpoint, modifiedConfig.params);

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      // Make request
      const response = await fetch(url, {
        method: modifiedConfig.method || 'GET',
        headers,
        body: modifiedConfig.body ? JSON.stringify(modifiedConfig.body) : undefined,
        signal: modifiedConfig.signal || controller.signal,
      });

      clearTimeout(timeoutId);

      // Apply response interceptors
      const modifiedResponse = await this.applyResponseInterceptors(response);

      // Check if response is ok
      if (!modifiedResponse.ok) {
        return this.handleError(null, modifiedResponse);
      }

      // Parse response
      const contentType = modifiedResponse.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await modifiedResponse.json();
      }

      return await modifiedResponse.text() as any;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return this.handleError(new Error('Request timeout'));
      }

      // Re-throw if already an ApiError
      if (error.status !== undefined) {
        throw error;
      }

      return this.handleError(error);
    }
  }

  /**
   * GET request
   * ส่ง GET request
   */
  async get<T = any>(endpoint: string, params?: Record<string, string | number | boolean>, config?: Omit<RequestConfig, 'method' | 'params'>): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'GET',
      params,
    });
  }

  /**
   * POST request
   * ส่ง POST request
   */
  async post<T = any>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body,
    });
  }

  /**
   * PUT request
   * ส่ง PUT request
   */
  async put<T = any>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body,
    });
  }

  /**
   * PATCH request
   * ส่ง PATCH request
   */
  async patch<T = any>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body,
    });
  }

  /**
   * DELETE request
   * ส่ง DELETE request
   */
  async delete<T = any>(endpoint: string, config?: Omit<RequestConfig, 'method'>): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'DELETE',
    });
  }
}

/**
 * Create default API client instance
 * สร้าง instance เริ่มต้นของ API client
 */
export const apiClient = new ApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  onError: (error) => {
    // Log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', error);
    }
  },
  onUnauthorized: () => {
    // Handle unauthorized access
    if (typeof window !== 'undefined') {
      // Redirect to login or show auth modal
      console.warn('Unauthorized access detected');
    }
  },
});

/**
 * Create a new API client instance
 * สร้าง instance ใหม่ของ API client
 */
export function createApiClient(config?: ApiClientConfig): ApiClient {
  return new ApiClient(config);
}

export default apiClient;
