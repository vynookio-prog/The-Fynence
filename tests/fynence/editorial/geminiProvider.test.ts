import { describe, it } from 'node:test';
import assert from 'node:assert';
import { GeminiProvider } from '../../../src/fynence/editorial/providers/geminiProvider';

describe('Gemini Provider Abstraction & Retry Logic', () => {
  it('returns clean error when GEMINI_API_KEY is not configured', async () => {
    const provider = new GeminiProvider({ apiKey: '' });
    const res = await provider.generateStructured('Test prompt', { type: 'object' });

    assert.strictEqual(res.success, false);
    assert.ok(res.error?.includes('GEMINI_API_KEY is not configured'));
    assert.strictEqual(res.model, 'gemini-2.5-flash');
  });

  it('retries on simulated transient HTTP 429 rate limit before succeeding', async () => {
    let callCount = 0;

    // Create a local mock server using native fetch intercept or custom apiBaseUrl
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = (async (url: string | URL | Request) => {
        callCount++;
        if (callCount === 1) {
          // First attempt: simulate 429 Too Many Requests
          return new Response(JSON.stringify({ error: { message: 'Resource exhausted' } }), {
            status: 429,
            statusText: 'Too Many Requests',
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Second attempt: succeed with valid response
        const candidateText = JSON.stringify({
          headline: 'Central Bank Rate Decisions Anchor Global Markets',
          summary: 'Global monetary authorities concluded quarterly sessions by stabilizing target benchmark rates. Currency crosses remained within normal volatility ranges.',
          whyItMatters: 'Policy stability provides clear planning baselines for institutional capital allocators.',
          primarySection: 'economy',
          secondarySections: [],
          importance: 'high',
          entities: [],
          metrics: [],
        });

        return new Response(
          JSON.stringify({
            candidates: [{ content: { parts: [{ text: candidateText }] } }],
            usageMetadata: { promptTokenCount: 150, candidatesTokenCount: 50, totalTokenCount: 200 },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }) as any;

      const provider = new GeminiProvider({ apiKey: 'test_key_xyz' });
      const res = await provider.generateStructured('Test prompt', { type: 'object' }, { retries: 2 });

      assert.strictEqual(res.success, true);
      assert.strictEqual(callCount, 2); // Attempted twice, succeeded on second attempt
      assert.ok(res.data);
      assert.strictEqual((res.data as any).headline, 'Central Bank Rate Decisions Anchor Global Markets');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('strips markdown codeblock fences from JSON output cleanly', async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = (async () => {
        const fencedText = '```json\n{\n  "headline": "Cleaned JSON Headline"\n}\n```';
        return new Response(
          JSON.stringify({
            candidates: [{ content: { parts: [{ text: fencedText }] } }],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }) as any;

      const provider = new GeminiProvider({ apiKey: 'test_key_xyz' });
      const res = await provider.generateStructured<{ headline: string }>('Test prompt', { type: 'object' });

      assert.strictEqual(res.success, true);
      assert.strictEqual(res.data?.headline, 'Cleaned JSON Headline');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
