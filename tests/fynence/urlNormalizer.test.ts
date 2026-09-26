import { describe, it } from 'node:test';
import assert from 'node:assert';
import { normalizeCanonicalUrl } from '../../src/fynence/engine/normalizer/urlNormalizer';

describe('URL Normalizer', () => {
  it('strips UTM tracking parameters while preserving functional query params', () => {
    const raw = 'https://www.cnbc.com/2026/09/26/markets-rally.html?utm_source=twitter&utm_medium=social&utm_campaign=breaking&id=99281';
    const canonical = normalizeCanonicalUrl(raw);
    assert.strictEqual(canonical, 'https://www.cnbc.com/2026/09/26/markets-rally.html?id=99281');
  });

  it('strips social click trackers like fbclid and gclid', () => {
    const raw = 'https://reuters.com/business/finance-news/?fbclid=IwAR2314_random&gclid=test1234';
    const canonical = normalizeCanonicalUrl(raw);
    assert.strictEqual(canonical, 'https://reuters.com/business/finance-news');
  });

  it('removes URL hash fragments', () => {
    const raw = 'https://ft.com/content/12345#comments-section';
    const canonical = normalizeCanonicalUrl(raw);
    assert.strictEqual(canonical, 'https://ft.com/content/12345');
  });

  it('normalizes trailing slashes for non-root paths', () => {
    const raw = 'https://bloomberg.com/news/articles/2026-09-26/yields-surge/';
    const canonical = normalizeCanonicalUrl(raw);
    assert.strictEqual(canonical, 'https://bloomberg.com/news/articles/2026-09-26/yields-surge');
  });

  it('sorts query parameters consistently', () => {
    const url1 = 'https://api.source.com/news?z=1&a=2&m=3';
    const url2 = 'https://api.source.com/news?m=3&z=1&a=2';
    assert.strictEqual(normalizeCanonicalUrl(url1), normalizeCanonicalUrl(url2));
  });
});
