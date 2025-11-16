/**
 * Integration Test Setup
 * Configures environment for API integration tests
 */

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
process.env.STRIPE_SECRET_KEY = 'sk_test_123';
process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_123';

// Increase timeout for integration tests
jest.setTimeout(30000);

// Global test data cleanup
afterEach(() => {
  jest.clearAllMocks();
});

// Mock fetch for API calls
global.fetch = jest.fn();

export const mockApiResponse = <T>(data: T, status: number = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers({ 'Content-Type': 'application/json' }),
  } as Response);
};

export const mockApiError = (message: string, status: number = 400) => {
  return Promise.resolve({
    ok: false,
    status,
    json: async () => ({ error: message }),
    text: async () => JSON.stringify({ error: message }),
    headers: new Headers({ 'Content-Type': 'application/json' }),
  } as Response);
};

export {};
