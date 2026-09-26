import { describe, it } from 'node:test';
import assert from 'node:assert';
import { NewsDeduplicator } from '../../src/fynence/engine/deduplicator/newsDeduplicator';
import type { Article } from '../../src/fynence/types/article';

describe('News Deduplicator', () => {
  const sampleArticle: Article = {
    id: 'art-001',
    title: 'Treasury Yields Rise to 4.5 Percent Following Jobs Report',
    description: 'Benchmark 10-year yields climbed after stronger employment numbers.',
    url: 'https://cnbc.com/2026/09/26/treasury-yields.html?utm_source=feed',
    source: 'CNBC',
    author: 'Reporter',
    category: 'finance',
    region: 'us',
    publishedAt: '2026-09-26T14:00:00Z',
    imageUrl: null,
    imageSource: null,
    imageCredit: null,
    imageUsageStatus: 'unavailable',
    createdAt: '2026-09-26T14:00:00Z',
    updatedAt: '2026-09-26T14:00:00Z',
  };

  it('detects duplicate on exact canonical URL match', () => {
    const deduplicator = new NewsDeduplicator();
    deduplicator.indexArticle(sampleArticle);

    // Same article link but with different UTM tracking tags
    const duplicate = {
      url: 'https://cnbc.com/2026/09/26/treasury-yields.html?utm_medium=twitter&fbclid=xyz',
      title: 'Different Title Text',
    };

    const result = deduplicator.checkDuplicate(duplicate);
    assert.strictEqual(result.isDuplicate, true);
    assert.strictEqual(result.existingArticleId, 'art-001');
    assert.strictEqual(result.reason, 'canonical_url_match');
  });

  it('detects duplicate on normalized title match', () => {
    const deduplicator = new NewsDeduplicator();
    deduplicator.indexArticle(sampleArticle);

    // Different URL but identical normalized headline
    const duplicate = {
      url: 'https://another-source.com/article/999',
      title: 'treasury yields rise to 4.5 percent following jobs report!',
    };

    const result = deduplicator.checkDuplicate(duplicate);
    assert.strictEqual(result.isDuplicate, true);
    assert.strictEqual(result.existingArticleId, 'art-001');
    assert.strictEqual(result.reason, 'normalized_title_match');
  });

  it('detects duplicate on high token overlap within time window', () => {
    const deduplicator = new NewsDeduplicator({ similarityThreshold: 0.70 });
    deduplicator.indexArticle(sampleArticle);

    // Highly overlapping tokens published on the same day
    const candidate = {
      url: 'https://reuters.com/news/article-3344',
      title: 'Treasury yields rise to 4.5 percent on jobs report surge',
      publishedAt: '2026-09-26T15:30:00Z',
    };

    const result = deduplicator.checkDuplicate(candidate);
    assert.strictEqual(result.isDuplicate, true);
    assert.strictEqual(result.reason, 'title_token_similarity');
    assert.ok(result.similarityScore >= 0.70);
  });

  it('allows stories outside the temporal window even if tokens overlap', () => {
    const deduplicator = new NewsDeduplicator({ maxTimeDifferenceHours: 24 });
    deduplicator.indexArticle(sampleArticle);

    // Same title 2 weeks later represents a different market cycle/event
    const futureArticle = {
      url: 'https://reuters.com/news/article-future',
      title: 'Treasury yields rise to 4.5 percent on jobs report',
      publishedAt: '2026-10-15T14:00:00Z',
    };

    const result = deduplicator.checkDuplicate(futureArticle);
    assert.strictEqual(result.isDuplicate, false);
  });
});
