import test from 'node:test';
import assert from 'node:assert/strict';
import { TelegramRateLimiter } from '../../../src/fynence/telegram/security/rateLimiter';

test('TelegramRateLimiter: Per-user request throttling', async (t) => {
  await t.test('1. Allows requests within configured rate limit (3 req/min)', () => {
    const limiter = new TelegramRateLimiter(3, 60_000);
    const userId = 12345;

    const res1 = limiter.check(userId);
    assert.equal(res1.allowed, true);
    assert.equal(res1.remaining, 2);

    const res2 = limiter.check(userId);
    assert.equal(res2.allowed, true);
    assert.equal(res2.remaining, 1);

    const res3 = limiter.check(userId);
    assert.equal(res3.allowed, true);
    assert.equal(res3.remaining, 0);

    // 4th request exceeds rate limit
    const res4 = limiter.check(userId);
    assert.equal(res4.allowed, false);
    assert.equal(res4.remaining, 0);
    assert.ok(res4.resetSeconds > 0);
  });

  await t.test('2. Independent rate limits per user', () => {
    const limiter = new TelegramRateLimiter(2, 60_000);
    const userA = 1001;
    const userB = 1002;

    limiter.check(userA);
    limiter.check(userA);
    assert.equal(limiter.check(userA).allowed, false);

    // User B should still be allowed
    assert.equal(limiter.check(userB).allowed, true);
  });

  await t.test('3. Reset clears rate limit state', () => {
    const limiter = new TelegramRateLimiter(1, 60_000);
    const user = 555;

    limiter.check(user);
    assert.equal(limiter.check(user).allowed, false);

    limiter.reset(user);
    assert.equal(limiter.check(user).allowed, true);
  });
});
