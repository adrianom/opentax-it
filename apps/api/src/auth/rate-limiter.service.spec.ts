import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { RateLimiterService } from './rate-limiter.service.js';

describe('RateLimiterService', () => {
  let service: RateLimiterService;

  beforeEach(() => {
    service = new RateLimiterService();
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('should allow requests within limit', () => {
    const key = 'test:ip:1';
    const limit = 3;
    const windowMs = 60_000;

    const res1 = service.check(key, limit, windowMs);
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = service.check(key, limit, windowMs);
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = service.check(key, limit, windowMs);
    expect(res3.allowed).toBe(true);
    expect(res3.remaining).toBe(0);

    const res4 = service.check(key, limit, windowMs);
    expect(res4.allowed).toBe(false);
    expect(res4.remaining).toBe(0);
    expect(res4.retryAfter).toBeGreaterThan(0);
  });

  it('should reset rate limit for a key', () => {
    const key = 'test:reset';
    service.check(key, 1, 60_000);
    expect(service.check(key, 1, 60_000).allowed).toBe(false);

    service.reset(key);
    expect(service.check(key, 1, 60_000).allowed).toBe(true);
  });
});
