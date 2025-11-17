/**
 * Centralized error handling utilities
 */

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

export class AppError extends Error {
  status: number;
  code: string;
  details?: any;

  constructor(message: string, status = 500, code = 'INTERNAL_ERROR', details?: any) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Parse error from API response or thrown error
 */
export function parseError(error: unknown): ApiError {
  // AppError instance
  if (error instanceof AppError) {
    return {
      message: error.message,
      status: error.status,
      code: error.code,
      details: error.details,
    };
  }

  // Standard Error instance
  if (error instanceof Error) {
    return {
      message: error.message,
      status: 500,
      code: 'UNKNOWN_ERROR',
    };
  }

  // Response error from fetch
  if (typeof error === 'object' && error !== null) {
    const obj = error as any;
    return {
      message: obj.message || obj.error || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ',
      status: obj.status || obj.statusCode || 500,
      code: obj.code || 'UNKNOWN_ERROR',
      details: obj.details,
    };
  }

  // Unknown error type
  return {
    message: 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ',
    status: 500,
    code: 'UNKNOWN_ERROR',
  };
}

/**
 * Get user-friendly error message in Thai
 */
export function getErrorMessage(error: unknown): string {
  const parsed = parseError(error);

  // Map common HTTP status codes to Thai messages
  const statusMessages: Record<number, string> = {
    400: 'ข้อมูลที่ส่งมาไม่ถูกต้อง',
    401: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ',
    403: 'คุณไม่มีสิทธิ์ในการดำเนินการนี้',
    404: 'ไม่พบข้อมูลที่ต้องการ',
    409: 'ข้อมูลซ้ำกับที่มีอยู่แล้ว',
    422: 'ข้อมูลไม่ถูกต้องตามรูปแบบที่กำหนด',
    429: 'คำขอมากเกินไป กรุณาลองใหม่อีกครั้งในภายหลัง',
    500: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์',
    502: 'เซิร์ฟเวอร์ไม่สามารถเชื่อมต่อได้',
    503: 'บริการไม่พร้อมใช้งานในขณะนี้',
  };

  // Return status-based message if available
  if (parsed.status && statusMessages[parsed.status]) {
    return statusMessages[parsed.status];
  }

  // Return original message or default
  return parsed.message || 'เกิดข้อผิดพลาด';
}

/**
 * Retry async function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
    onRetry?: (attempt: number, error: unknown) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    onRetry,
  } = options;

  let lastError: unknown;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Don't retry on client errors (4xx)
      const parsed = parseError(error);
      if (parsed.status && parsed.status >= 400 && parsed.status < 500) {
        throw error;
      }

      // Call retry callback
      if (onRetry) {
        onRetry(attempt + 1, error);
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Increase delay for next attempt
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError;
}

/**
 * Fetch with error handling and retry
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retryOptions?: Parameters<typeof retry>[1]
): Promise<Response> {
  return retry(async () => {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new AppError(
        errorData.message || response.statusText,
        response.status,
        errorData.code
      );
    }

    return response;
  }, retryOptions);
}

/**
 * Log error to external service (placeholder)
 */
export function logError(error: unknown, context?: Record<string, any>) {
  const parsed = parseError(error);

  // In production, send to error tracking service (e.g., Sentry, LogRocket)
  if (process.env.NODE_ENV === 'production') {
    // TODO: Implement error logging service
    console.error('Error logged:', {
      ...parsed,
      context,
      timestamp: new Date().toISOString(),
    });
  } else {
    console.error('Error:', parsed, 'Context:', context);
  }
}

/**
 * Toast notification helper (to be used with a toast library)
 */
export function showErrorToast(error: unknown) {
  const message = getErrorMessage(error);

  // TODO: Integrate with toast library (e.g., react-hot-toast, sonner)
  // For now, use alert as fallback
  if (typeof window !== 'undefined') {
    // This would be replaced with: toast.error(message)
    console.error('Error toast:', message);
  }
}
