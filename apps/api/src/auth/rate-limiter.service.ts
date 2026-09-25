import { Injectable, OnModuleDestroy } from '@nestjs/common';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number; // in seconds
}

@Injectable()
export class RateLimiterService implements OnModuleDestroy {
  private readonly hits = new Map<string, number[]>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000);
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Checks whether an action keyed by `key` is allowed under `limit` calls per `windowMs`.
   */
  check(key: string, limit: number, windowMs: number): RateLimitResult {
    const now = Date.now();
    const windowStart = now - windowMs;

    const timestamps = this.hits.get(key) ?? [];
    const validTimestamps = timestamps.filter((t) => t > windowStart);

    if (validTimestamps.length >= limit) {
      const oldestInWindow = validTimestamps[0];
      const retryAfter = Math.ceil((oldestInWindow + windowMs - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        retryAfter: Math.max(1, retryAfter),
      };
    }

    validTimestamps.push(now);
    this.hits.set(key, validTimestamps);

    return {
      allowed: true,
      remaining: limit - validTimestamps.length,
      retryAfter: 0,
    };
  }

  /**
   * Resets the hits for a specific key (e.g. after successful login).
   */
  reset(key: string): void {
    this.hits.delete(key);
  }

  private cleanup(): void {
    const now = Date.now();
    // 1 hour max window for cleanup
    const maxWindow = 3600_000;
    const cutoff = now - maxWindow;

    for (const [key, timestamps] of this.hits.entries()) {
      const valid = timestamps.filter((t) => t > cutoff);
      if (valid.length === 0) {
        this.hits.delete(key);
      } else {
        this.hits.set(key, valid);
      }
    }
  }
}
