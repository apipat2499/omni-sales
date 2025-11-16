/**
 * Test Utilities and Helper Functions
 */

/**
 * Sleep/delay utility for async tests
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Retry a function until it succeeds or max attempts reached
 */
export async function retry<T>(
  fn: () => T | Promise<T>,
  options: {
    maxAttempts?: number;
    delayMs?: number;
    onRetry?: (attempt: number, error: any) => void;
  } = {}
): Promise<T> {
  const { maxAttempts = 3, delayMs = 1000, onRetry } = options;

  let lastError: any;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        if (onRetry) {
          onRetry(attempt, error);
        }
        await sleep(delayMs);
      }
    }
  }

  throw lastError;
}

/**
 * Wait for a condition to be true
 */
export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  options: {
    timeoutMs?: number;
    intervalMs?: number;
    timeoutMessage?: string;
  } = {}
): Promise<void> {
  const { timeoutMs = 5000, intervalMs = 100, timeoutMessage = 'Condition not met within timeout' } = options;

  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    if (await condition()) {
      return;
    }
    await sleep(intervalMs);
  }

  throw new Error(timeoutMessage);
}

/**
 * Generate random string
 */
export function randomString(length: number = 10): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * Generate random number in range
 */
export function randomNumber(min: number = 0, max: number = 100): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate random email
 */
export function randomEmail(): string {
  return `test-${randomString(8)}@example.com`;
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Assert that function throws specific error
 */
export async function expectThrowsAsync(
  fn: () => Promise<any>,
  errorMessage?: string | RegExp
): Promise<void> {
  let thrownError: any;

  try {
    await fn();
  } catch (error) {
    thrownError = error;
  }

  if (!thrownError) {
    throw new Error('Expected function to throw, but it did not');
  }

  if (errorMessage) {
    if (typeof errorMessage === 'string') {
      expect(thrownError.message).toContain(errorMessage);
    } else {
      expect(thrownError.message).toMatch(errorMessage);
    }
  }
}

/**
 * Mock console methods
 */
export function mockConsole() {
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
  };

  const mocks = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  };

  beforeEach(() => {
    console.log = mocks.log;
    console.error = mocks.error;
    console.warn = mocks.warn;
    console.info = mocks.info;
  });

  afterEach(() => {
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.info = originalConsole.info;
    jest.clearAllMocks();
  });

  return mocks;
}

/**
 * Suppress console output during tests
 */
export function suppressConsole() {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
}

/**
 * Create a deferred promise
 */
export function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: any) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

/**
 * Measure execution time
 */
export async function measureTime<T>(fn: () => T | Promise<T>): Promise<{ result: T; durationMs: number }> {
  const start = Date.now();
  const result = await fn();
  const durationMs = Date.now() - start;

  return { result, durationMs };
}

/**
 * Create a spy that tracks all calls
 */
export function createCallTracker<T extends (...args: any[]) => any>() {
  const calls: Array<{ args: Parameters<T>; result?: ReturnType<T>; error?: any }> = [];

  const tracker = jest.fn((...args: Parameters<T>) => {
    const call = { args } as any;
    calls.push(call);

    try {
      // You can customize behavior here
      const result = undefined;
      call.result = result;
      return result;
    } catch (error) {
      call.error = error;
      throw error;
    }
  });

  return {
    tracker,
    calls,
    reset: () => {
      calls.length = 0;
      tracker.mockReset();
    },
  };
}

/**
 * Batch execute promises with concurrency limit
 */
export async function batchExecute<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency: number = 5
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<void>[] = [];

  for (const item of items) {
    const promise = fn(item).then((result) => {
      results.push(result);
    });

    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      executing.splice(
        executing.findIndex((p) => p === promise),
        1
      );
    }
  }

  await Promise.all(executing);
  return results;
}

/**
 * Assert array contains items in order
 */
export function expectArrayContainsInOrder<T>(array: T[], items: T[]): void {
  let lastIndex = -1;

  for (const item of items) {
    const index = array.indexOf(item, lastIndex + 1);
    expect(index).toBeGreaterThan(lastIndex);
    lastIndex = index;
  }
}

/**
 * Create mock timestamp
 */
export function createMockDate(dateString?: string): Date {
  return dateString ? new Date(dateString) : new Date('2024-01-01T00:00:00.000Z');
}

/**
 * Freeze time for tests
 */
export function freezeTime(date: Date | string = '2024-01-01T00:00:00.000Z') {
  const mockDate = typeof date === 'string' ? new Date(date) : date;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  return mockDate;
}
