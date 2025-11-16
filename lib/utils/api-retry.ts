/**
 * Retry API call with exponential backoff
 */
export async function retryApiCall<T>(
  fn: () => Promise<Response>,
  maxAttempts: number = 3,
  initialDelay: number = 1000,
  backoffMultiplier: number = 2
): Promise<T> {
  let lastError: any = null;
  const delays = [initialDelay];

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fn();

      // If successful, return the response
      if (response.ok) {
        return response.json() as Promise<T>;
      }

      // Don't retry client errors (4xx) except specific ones
      if (response.status >= 400 && response.status < 500) {
        if (response.status !== 408 && response.status !== 429) {
          // 408 = timeout, 429 = too many requests
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }
      }

      lastError = new Error(`HTTP ${response.status}`);

      // If this is the last attempt, throw the error
      if (attempt === maxAttempts) {
        throw lastError;
      }

      // Calculate delay for next attempt
      const delay = initialDelay * Math.pow(backoffMultiplier, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    } catch (error) {
      lastError = error;

      // Don't retry if this is a client error (not retriable)
      if (error instanceof Error) {
        if (
          error.message.includes('HTTP 400') ||
          error.message.includes('HTTP 401') ||
          error.message.includes('HTTP 403') ||
          error.message.includes('HTTP 404')
        ) {
          throw error;
        }
      }

      // If this is the last attempt, throw the error
      if (attempt === maxAttempts) {
        throw lastError;
      }

      // Wait before retrying
      const delay = initialDelay * Math.pow(backoffMultiplier, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('API call failed after max attempts');
}
