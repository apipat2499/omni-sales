/**
 * Email Rate Limiter
 * Implements token bucket algorithm for rate limiting email sending
 */
export class EmailRateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per second
  private readonly refillInterval: number; // milliseconds

  constructor(maxPerSecond: number = 100) {
    this.maxTokens = maxPerSecond;
    this.tokens = maxPerSecond;
    this.refillRate = maxPerSecond;
    this.refillInterval = 1000; // 1 second
    this.lastRefill = Date.now();
  }

  /**
   * Try to consume tokens for sending emails
   * Returns true if tokens available, false otherwise
   */
  async tryConsume(count: number = 1): Promise<boolean> {
    this.refillTokens();

    if (this.tokens >= count) {
      this.tokens -= count;
      return true;
    }

    return false;
  }

  /**
   * Wait until tokens are available and consume them
   */
  async consume(count: number = 1): Promise<void> {
    while (!(await this.tryConsume(count))) {
      // Calculate wait time
      const tokensNeeded = count - this.tokens;
      const waitTime = (tokensNeeded / this.refillRate) * this.refillInterval;

      // Wait for tokens to refill
      await this.sleep(Math.ceil(waitTime));
    }
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refillTokens(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = (timePassed / this.refillInterval) * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  /**
   * Get current available tokens
   */
  getAvailableTokens(): number {
    this.refillTokens();
    return Math.floor(this.tokens);
  }

  /**
   * Reset rate limiter
   */
  reset(): void {
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
let rateLimiterInstance: EmailRateLimiter | null = null;

export function getEmailRateLimiter(maxPerSecond?: number): EmailRateLimiter {
  if (!rateLimiterInstance) {
    const limit = maxPerSecond || parseInt(process.env.EMAIL_RATE_LIMIT || '100');
    rateLimiterInstance = new EmailRateLimiter(limit);
  }
  return rateLimiterInstance;
}
