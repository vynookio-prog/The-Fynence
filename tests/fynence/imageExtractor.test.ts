import { describe, it } from 'node:test';
import assert from 'node:assert';
import { NewsImageExtractor } from '../../src/fynence/engine/extractor/imageExtractor';

describe('Image Extractor & Strict Anti-AI Policy', () => {
  const extractor = new NewsImageExtractor();

  it('extracts valid original publisher image from enclosure and marks source_provided', () => {
    const res = extractor.extractFromFeed({
      articleUrl: 'https://cnbc.com/news/123',
      sourceName: 'CNBC',
      enclosureUrl: 'https://image.cnbcfm.com/api/v1/image/10712345-market.jpg?v=1',
    });

    assert.strictEqual(res.hasImage, true);
    assert.strictEqual(res.status, 'source_provided');
    assert.ok(res.metadata !== null);
    assert.strictEqual(res.metadata.isAiGenerated, false); // Strict anti-AI guard
    assert.strictEqual(res.metadata.imageSource, 'CNBC');
  });

  it('extracts image from HTML img tag when enclosure is missing', () => {
    const html = '<p>Breaking news story.</p><img src="https://assets.bwbx.io/images/users/iqjWHBFdfxIU/photo.webp" width="600"/>';
    const res = extractor.extractFromFeed({
      articleUrl: 'https://bloomberg.com/news/article',
      sourceName: 'Bloomberg',
      htmlContent: html,
    });

    assert.strictEqual(res.hasImage, true);
    assert.strictEqual(res.status, 'source_provided');
    assert.ok(res.metadata?.imageUrl.includes('photo.webp'));
    assert.strictEqual(res.metadata?.isAiGenerated, false);
  });

  it('rejects unsafe local or internal IP addresses', () => {
    const res = extractor.extractFromFeed({
      articleUrl: 'https://source.com/article',
      sourceName: 'Test',
      mediaContentUrl: 'http://127.0.0.1/admin-secret.png',
    });

    assert.strictEqual(res.hasImage, false);
    assert.strictEqual(res.status, 'unavailable');
    assert.ok(res.rejectionReason?.includes('Private or loopback address blocked'));
  });

  it('returns unavailable when no image is present without fabricating AI replacement', () => {
    const res = extractor.extractFromFeed({
      articleUrl: 'https://source.com/text-only',
      sourceName: 'Text Source',
    });

    assert.strictEqual(res.hasImage, false);
    assert.strictEqual(res.status, 'unavailable');
    assert.strictEqual(res.metadata, null);
  });
});
