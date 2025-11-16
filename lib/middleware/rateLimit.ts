import { NextRequest, NextResponse } from 'next/server';

// Rate limit configuration interface
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum number of requests per window
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  keyGenerator?: (request: NextRequest) => string; // Custom key generator
}

// Rate limit store interface
interface RateLimitStore {
  get(key: string): Promise<{ count: number; resetTime: number } | null>;
  set(key: string, value: { count: number; resetTime: number }): Promise<void>;
  increment(key: string, resetTime: number): Promise<number>;
}

// In-memory store implementation
class InMemoryStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.store.entries()) {
        if (value.resetTime < now) {
          this.store.delete(key);
        }
      }
    }, 60000);
  }

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    const value = this.store.get(key);
    if (!value) return null;

    // Check if expired
    if (value.resetTime < Date.now()) {
      this.store.delete(key);
      return null;
    }

    return value;
  }

  async set(key: string, value: { count: number; resetTime: number }): Promise<void> {
    this.store.set(key, value);
  }

  async increment(key: string, resetTime: number): Promise<number> {
    const existing = await this.get(key);

    if (!existing) {
      await this.set(key, { count: 1, resetTime });
      return 1;
    }

    const newCount = existing.count + 1;
    await this.set(key, { count: newCount, resetTime: existing.resetTime });
    return newCount;
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Redis store implementation (for production)
class RedisStore implements RateLimitStore {
  private client: any;

  constructor(redisClient: any) {
    this.client = redisClient;
  }

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    try {
      const data = await this.client.get(key);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(key: string, value: { count: number; resetTime: number }): Promise<void> {
    try {
      const ttl = Math.ceil((value.resetTime - Date.now()) / 1000);
      if (ttl > 0) {
        await this.client.setex(key, ttl, JSON.stringify(value));
      }
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async increment(key: string, resetTime: number): Promise<number> {
    try {
      const existing = await this.get(key);

      if (!existing) {
        await this.set(key, { count: 1, resetTime });
        return 1;
      }

      const newCount = existing.count + 1;
      await this.set(key, { count: newCount, resetTime: existing.resetTime });
      return newCount;
    } catch (error) {
      console.error('Redis increment error:', error);
      // Fallback: allow the request if Redis fails
      return 0;
    }
  }
}

// Global store instance
let globalStore: RateLimitStore | null = null;

// Initialize store
export function initializeStore(redisClient?: any): RateLimitStore {
  if (globalStore) return globalStore;

  if (redisClient && process.env.RATE_LIMIT_STORE === 'redis') {
    globalStore = new RedisStore(redisClient);
    console.log('Rate limiting using Redis store');
  } else {
    globalStore = new InMemoryStore();
    console.log('Rate limiting using in-memory store');
  }

  return globalStore;
}

// Get or create store
function getStore(): RateLimitStore {
  if (!globalStore) {
    return initializeStore();
  }
  return globalStore;
}

// Default key generator - uses IP address
function defaultKeyGenerator(request: NextRequest): string {
  // Try to get real IP from headers (for proxies/load balancers)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  const ip = cfConnectingIp || realIp || forwardedFor?.split(',')[0] || 'unknown';
  return `rate-limit:${ip}`;
}

// Default configuration
const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests
  message: 'Too many requests, please try again later.',
  keyGenerator: defaultKeyGenerator,
};

// Main rate limit middleware
export function rateLimit(config: Partial<RateLimitConfig> = {}) {
  const finalConfig: RateLimitConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  return async function rateLimitMiddleware(
    request: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    // Skip rate limiting if disabled
    if (process.env.RATE_LIMIT_ENABLED === 'false') {
      return handler(request);
    }

    const store = getStore();
    const key = finalConfig.keyGenerator!(request);
    const now = Date.now();
    const resetTime = now + finalConfig.windowMs;

    try {
      // Get or increment count
      const count = await store.increment(key, resetTime);

      // Get current data for headers
      const currentData = await store.get(key);
      const remaining = Math.max(0, finalConfig.maxRequests - count);
      const retryAfter = currentData
        ? Math.ceil((currentData.resetTime - now) / 1000)
        : Math.ceil(finalConfig.windowMs / 1000);

      // Check if limit exceeded
      if (count > finalConfig.maxRequests) {
        return NextResponse.json(
          {
            error: finalConfig.message,
            retryAfter,
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': finalConfig.maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': currentData?.resetTime.toString() || resetTime.toString(),
              'Retry-After': retryAfter.toString(),
            },
          }
        );
      }

      // Execute handler
      const response = await handler(request);

      // Add rate limit headers to response
      response.headers.set('X-RateLimit-Limit', finalConfig.maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', remaining.toString());
      response.headers.set('X-RateLimit-Reset', currentData?.resetTime.toString() || resetTime.toString());

      return response;
    } catch (error) {
      console.error('Rate limit error:', error);
      // On error, allow the request to proceed
      return handler(request);
    }
  };
}

// Preset configurations for different route types
export const rateLimitPresets = {
  // Strict limit for authentication routes
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 requests per 15 minutes
    message: 'Too many authentication attempts, please try again later.',
  },

  // Standard limit for API routes
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per 15 minutes
    message: 'API rate limit exceeded, please try again later.',
  },

  // More permissive for read operations
  read: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 200, // 200 requests per 15 minutes
    message: 'Too many requests, please try again later.',
  },

  // Stricter for write operations
  write: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 50, // 50 requests per 15 minutes
    message: 'Too many write requests, please try again later.',
  },

  // Very strict for sensitive operations
  sensitive: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 requests per hour
    message: 'Rate limit exceeded for sensitive operation.',
  },
};

// Helper to create rate-limited route handler
export function withRateLimit<T extends any[]>(
  config: Partial<RateLimitConfig>,
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  const limiter = rateLimit(config);

  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    return limiter(request, (req) => handler(req, ...args));
  };
}
