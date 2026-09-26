import { describe, it } from 'node:test';
import assert from 'node:assert';
import { TwelveDataProvider } from '../../../src/fynence/market/providers/twelveDataProvider';

describe('Twelve Data Provider Abstraction & Error Handling', () => {
  it('returns clean error when TWELVE_DATA_API_KEY is missing or placeholder', async () => {
    const provider = new TwelveDataProvider({ apiKey: '' });
    const res = await provider.getQuote('XAUUSD');

    assert.strictEqual(res.success, false);
    assert.ok(res.error?.includes('TWELVE_DATA_API_KEY is not configured'));
    assert.strictEqual(res.provider, 'twelve_data');
  });

  it('retries on simulated transient HTTP 429 rate limit before succeeding', async () => {
    let callCount = 0;
    const originalFetch = globalThis.fetch;

    try {
      globalThis.fetch = (async (url: string | URL | Request) => {
        callCount++;
        if (callCount === 1) {
          // First attempt: simulate 429 Too Many Requests
          return new Response(JSON.stringify({ message: 'Rate limit exceeded' }), {
            status: 429,
            statusText: 'Too Many Requests',
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Second attempt: succeed with valid Twelve Data response
        const sampleQuote = {
          symbol: 'XAU/USD',
          name: 'Gold',
          exchange: 'Forex',
          currency: 'USD',
          datetime: '2026-09-26',
          timestamp: 1727366400,
          open: '2645.00',
          high: '2665.00',
          low: '2640.00',
          close: '2658.30',
          previous_close: '2645.00',
          change: '13.30',
          percent_change: '0.5028',
          is_market_open: true,
        };

        return new Response(JSON.stringify(sampleQuote), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }) as any;

      const provider = new TwelveDataProvider({ apiKey: 'valid_mock_api_key_123' });
      const res = await provider.getQuote('XAUUSD');

      assert.strictEqual(res.success, true);
      assert.strictEqual(callCount, 2); // Retried once on 429, succeeded on 2nd try
      assert.ok(res.data);
      assert.strictEqual(res.data?.symbol, 'XAUUSD');
      assert.strictEqual(res.data?.price, 2658.30);
      assert.strictEqual(res.data?.change, 13.30);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('handles Twelve Data error JSON payload gracefully without throwing', async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = (async () => {
        return new Response(
          JSON.stringify({
            status: 'error',
            code: 401,
            message: 'Invalid API key provided.',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }) as any;

      const provider = new TwelveDataProvider({ apiKey: 'invalid_key_xyz' });
      const res = await provider.getQuote('EURUSD');

      assert.strictEqual(res.success, false);
      assert.ok(res.error?.includes('Invalid API key provided'));
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('parses batch quote response mapping multiple provider symbols', async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = (async () => {
        const batchResponse = {
          'XAU/USD': {
            symbol: 'XAU/USD',
            close: '2655.00',
            previous_close: '2640.00',
            timestamp: 1727366400,
            is_market_open: true,
          },
          'EUR/USD': {
            symbol: 'EUR/USD',
            close: '1.0850',
            previous_close: '1.0820',
            timestamp: 1727366400,
            is_market_open: true,
          },
        };

        return new Response(JSON.stringify(batchResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }) as any;

      const provider = new TwelveDataProvider({ apiKey: 'valid_mock_api_key_123' });
      const res = await provider.getQuotes(['XAUUSD', 'EURUSD']);

      assert.strictEqual(res.success, true);
      assert.strictEqual(res.data?.length, 2);
      assert.strictEqual(res.data?.[0].symbol, 'XAUUSD');
      assert.strictEqual(res.data?.[0].price, 2655.00);
      assert.strictEqual(res.data?.[1].symbol, 'EURUSD');
      assert.strictEqual(res.data?.[1].price, 1.0850);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
