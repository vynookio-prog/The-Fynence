import { describe, it } from 'node:test';
import assert from 'node:assert';
import { NewsValidator } from '../../src/fynence/engine/validator/newsValidator';
import type { Article } from '../../src/fynence/types/article';

describe('News Validator', () => {
  const validator = new NewsValidator();

  const validArticle: Article = {
    id: 'art-valid-1',
    title: 'Bank Indonesia Holds Benchmark 7-Day Reverse Repo Rate at 6.00%',
    description: 'Bank Indonesia maintained its policy rate to support the stability of the rupiah and ensure inflation remains contained.',
    url: 'https://antaranews.com/berita/12345/bi-holds-rate',
    source: 'Antara News',
    author: 'Staff Writer',
    category: 'national',
    region: 'indonesia',
    publishedAt: '2026-09-26T10:00:00Z',
    imageUrl: 'https://antaranews.com/images/bank-indonesia.jpg',
    imageSource: 'Antara News',
    imageCredit: 'Antara Photo',
    imageUsageStatus: 'source_provided',
    createdAt: '2026-09-26T10:00:00Z',
    updatedAt: '2026-09-26T10:00:00Z',
  };

  it('passes a fully populated valid article', () => {
    const res = validator.validate(validArticle);
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.errors.length, 0);
  });

  it('rejects an article with missing or short title', () => {
    const shortTitle = { ...validArticle, title: 'Hi' };
    const resShort = validator.validate(shortTitle);
    assert.strictEqual(resShort.isValid, false);
    assert.ok(resShort.errors.some(e => e.includes('too short')));

    const noTitle = { ...validArticle, title: '' };
    const resNo = validator.validate(noTitle);
    assert.strictEqual(resNo.isValid, false);
  });

  it('rejects an article with malformed or unsafe URL', () => {
    const badUrl = { ...validArticle, url: 'not-a-valid-url' };
    const res = validator.validate(badUrl);
    assert.strictEqual(res.isValid, false);
    assert.ok(res.errors.some(e => e.includes('Malformed URL') || e.includes('protocol')));
  });

  it('rejects an article with far-future publication date', () => {
    const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
    const futureArticle = { ...validArticle, publishedAt: futureDate };
    const res = validator.validate(futureArticle);
    assert.strictEqual(res.isValid, false);
    assert.ok(res.errors.some(e => e.includes('future')));
  });

  it('rejects an article with completely empty description and content', () => {
    const emptyBody = { ...validArticle, title: 'Short title', description: '', content: '' };
    const res = validator.validate(emptyBody);
    assert.strictEqual(res.isValid, false);
    assert.ok(res.errors.some(e => e.includes('lacks substantive text')));
  });
});
