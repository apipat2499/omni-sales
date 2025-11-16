/**
 * Jest Test Setup
 * Configures test environment, mocks, and utilities
 */

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock performance.now() for consistent timing tests
let mockTime = 0;
const originalPerformanceNow = performance.now.bind(performance);

Object.defineProperty(performance, 'now', {
  writable: true,
  value: jest.fn(() => {
    return mockTime;
  }),
});

// Helper to advance mock time
global.advanceMockTime = (ms: number) => {
  mockTime += ms;
};

// Helper to reset mock time
global.resetMockTime = () => {
  mockTime = 0;
};

// Mock fetch globally
global.fetch = jest.fn();

// Reset all mocks before each test
beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
  resetMockTime();
  (global.fetch as jest.Mock).mockReset();
});

// Extend Jest matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// Declare global types
declare global {
  function advanceMockTime(ms: number): void;
  function resetMockTime(): void;
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
    }
  }
}

export {};
