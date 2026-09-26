import { describe, it } from 'node:test';
import assert from 'node:assert';
import { MarketCache } from '../../../src/fynence/market/cache/marketCache';
import type { MarketQuote } from '../../../src/fynence/market/types';

describe('Market Cache & TTL Policy', () => {
  const dummyQuote: MarketQuote = {
    symbol: 'XAUUSD',
    providerSymbol: 'XAU/USD',
    displayName: 'Gold',
    category: 'commodity',
    price: 2650.00,
    open: 2640.00,
    high: 2660.00,
    low: 2635.00,
    previousClose: 2640.00,
    change: 10.00,
    changePercent: 0.3788,
    direction: 'up',
    volume: 50000,
    marketStatus: 'open',
    timestamp: new Date().toISOString(),
    source: 'test',
  };

  it('stores and retrieves cached quotes within TTL', () => {
    const cache = new MarketCache(60);
    cache.set('XAUUSD', dummyQuote);

    const hit = cache.get('XAUUSD');
    assert.ok(hit);
    assert.strictEqual(hit?.symbol, 'XAUUSD');
    assert.strictEqual(hit?.price, 2650.00);
  });

  it('returns null on cache miss', () => {
    const cache = new MarketCache(60);
    const miss = cache.get('UNKNOWN_SYMBOL');
    assert.strictEqual(miss, null);
  });

  it('evicts quotes after TTL expires', async () => {
    // 0.05 second TTL (50ms)
    const shortCache = new MarketCache(1);
    shortCache.set('XAUUSD', dummyQuote, 0.05);

    // Immediate lookup hits
    assert.ok(shortCache.get('XAUUSD'));

    // Wait 70ms for TTL expiration
    await new Promise(r => setTimeout(r, 70));

    // Post-TTL lookup misses
    assert.strictEqual(shortCache.get('XAUUSD'), null);
  });

  it('partitions batch lookups into cached and missing lists', () => {
    const cache = new MarketCache(60);
    cache.set('XAUUSD', dummyQuote);
    cache.set('EURUSD', { ...dummyQuote, symbol: 'EURUSD', price: 1.0850 });

    const { cached, missing } = cache.getMany(['XAUUSD', 'EURUSD', 'USDJPY', 'US30']);

    assert.strictEqual(cached.length, 2);
    assert.ok(cached.some(q => q.symbol === 'XAUUSD'));
    assert.ok(cached.some(q => q.symbol === 'EURUSD'));

    assert.strictEqual(missing.length, 2);
    assert.deepStrictEqual(missing, ['USDJPY', 'US30']);
  });
});
