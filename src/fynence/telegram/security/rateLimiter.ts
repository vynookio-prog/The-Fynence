import type { RateLimitCheckResult } from '../types';

export class TelegramRateLimiter {
  private requestsByUser: Map<number, number[]> = new Map();
  private maxRequestsPerMinute: number;
  private windowMs: number;

  constructor(maxRequestsPerMinute = 3, windowMs = 60_000) {
    this.maxRequestsPerMinute = maxRequestsPerMinute;
    this.windowMs = windowMs;
  }

  public check(userId: number): RateLimitCheckResult {
    const now = Date.now();
    const timestamps = this.requestsByUser.get(userId) || [];

    // Filter out timestamps outside current sliding window
    const validTimestamps = timestamps.filter(t => now - t < this.windowMs);

    if (validTimestamps.length >= this.maxRequestsPerMinute) {
      const oldest = validTimestamps[0];
      const resetSeconds = Math.max(1, Math.ceil((oldest + this.windowMs - now) / 1000));
      this.requestsByUser.set(userId, validTimestamps);
      return {
        allowed: false,
        remaining: 0,
        resetSeconds,
      };
    }

    validTimestamps.push(now);
    this.requestsByUser.set(userId, validTimestamps);

    const remaining = this.maxRequestsPerMinute - validTimestamps.length;
    const oldest = validTimestamps[0];
    const resetSeconds = Math.max(1, Math.ceil((oldest + this.windowMs - now) / 1000));

    return {
      allowed: true,
      remaining,
      resetSeconds,
    };
  }

  public reset(userId?: number): void {
    if (userId !== undefined) {
      this.requestsByUser.delete(userId);
    } else {
      this.requestsByUser.clear();
    }
  }

  public pruneStaleEntries(): void {
    const now = Date.now();
    for (const [userId, timestamps] of this.requestsByUser.entries()) {
      const valid = timestamps.filter(t => now - t < this.windowMs);
      if (valid.length === 0) {
        this.requestsByUser.delete(userId);
      } else {
        this.requestsByUser.set(userId, valid);
      }
    }
  }
}

export const defaultTelegramRateLimiter = new TelegramRateLimiter();
