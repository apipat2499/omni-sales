/**
 * API Mock Helpers
 * Provides utilities for mocking API responses in tests
 */

/**
 * Create a successful API response
 */
export function createSuccessResponse<T>(data: T, status: number = 200): Response {
  return {
    ok: true,
    status,
    statusText: 'OK',
    headers: new Headers({ 'Content-Type': 'application/json' }),
    json: async () => data,
    text: async () => JSON.stringify(data),
    blob: async () => new Blob([JSON.stringify(data)]),
    arrayBuffer: async () => new ArrayBuffer(0),
    formData: async () => new FormData(),
    clone: function() { return this; },
    body: null,
    bodyUsed: false,
    redirected: false,
    type: 'basic',
    url: '',
  } as Response;
}

/**
 * Create an error API response
 */
export function createErrorResponse(
  error: string | { message: string; code?: string },
  status: number = 400
): Response {
  const errorData = typeof error === 'string' ? { error } : error;

  return {
    ok: false,
    status,
    statusText: 'Error',
    headers: new Headers({ 'Content-Type': 'application/json' }),
    json: async () => errorData,
    text: async () => JSON.stringify(errorData),
    blob: async () => new Blob([JSON.stringify(errorData)]),
    arrayBuffer: async () => new ArrayBuffer(0),
    formData: async () => new FormData(),
    clone: function() { return this; },
    body: null,
    bodyUsed: false,
    redirected: false,
    type: 'basic',
    url: '',
  } as Response;
}

/**
 * Mock fetch to return specific response
 */
export function mockFetch(response: Response): jest.Mock {
  const mock = global.fetch as jest.Mock;
  mock.mockResolvedValueOnce(response);
  return mock;
}

/**
 * Mock fetch to return success
 */
export function mockFetchSuccess<T>(data: T, status: number = 200): jest.Mock {
  return mockFetch(createSuccessResponse(data, status));
}

/**
 * Mock fetch to return error
 */
export function mockFetchError(error: string, status: number = 400): jest.Mock {
  return mockFetch(createErrorResponse(error, status));
}

/**
 * Mock fetch with delay
 */
export async function mockFetchWithDelay<T>(
  data: T,
  delayMs: number,
  status: number = 200
): Promise<jest.Mock> {
  const mock = global.fetch as jest.Mock;
  mock.mockImplementation(
    () =>
      new Promise((resolve) =>
        setTimeout(() => resolve(createSuccessResponse(data, status)), delayMs)
      )
  );
  return mock;
}

/**
 * Mock paginated API response
 */
export function mockPaginatedResponse<T>(
  items: T[],
  page: number,
  limit: number,
  total: number
): Response {
  const start = (page - 1) * limit;
  const end = start + limit;
  const pageItems = items.slice(start, end);

  return createSuccessResponse({
    data: pageItems,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: end < total,
      hasPrev: page > 1,
    },
  });
}

/**
 * Mock API call sequence
 */
export function mockFetchSequence(responses: Response[]): jest.Mock {
  const mock = global.fetch as jest.Mock;
  responses.forEach((response) => {
    mock.mockResolvedValueOnce(response);
  });
  return mock;
}

/**
 * Create mock Supabase client
 */
export function createMockSupabaseClient() {
  return {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    auth: {
      signIn: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      getUser: jest.fn(),
    },
    storage: {
      from: jest.fn().mockReturnThis(),
      upload: jest.fn(),
      download: jest.fn(),
      list: jest.fn(),
    },
  };
}

/**
 * Create mock Stripe client
 */
export function createMockStripeClient() {
  return {
    paymentIntents: {
      create: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn(),
      cancel: jest.fn(),
    },
    customers: {
      create: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    charges: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
    refunds: {
      create: jest.fn(),
    },
  };
}

/**
 * Wait for all pending fetch calls to complete
 */
export async function flushFetchCalls(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Verify fetch was called with specific parameters
 */
export function expectFetchCalledWith(
  url: string,
  options?: RequestInit
): void {
  const mock = global.fetch as jest.Mock;
  expect(mock).toHaveBeenCalledWith(url, expect.objectContaining(options || {}));
}

/**
 * Get all fetch calls
 */
export function getFetchCalls(): Array<[string, RequestInit?]> {
  const mock = global.fetch as jest.Mock;
  return mock.mock.calls;
}

/**
 * Clear fetch mock
 */
export function clearFetchMock(): void {
  const mock = global.fetch as jest.Mock;
  mock.mockClear();
}

/**
 * Mock network error
 */
export function mockNetworkError(message: string = 'Network error'): jest.Mock {
  const mock = global.fetch as jest.Mock;
  mock.mockRejectedValueOnce(new Error(message));
  return mock;
}

/**
 * Mock timeout error
 */
export function mockTimeoutError(): jest.Mock {
  const error = new Error('Request timeout');
  error.name = 'TimeoutError';
  const mock = global.fetch as jest.Mock;
  mock.mockRejectedValueOnce(error);
  return mock;
}
