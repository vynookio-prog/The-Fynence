import { describe, it } from 'node:test';
import assert from 'node:assert';
import { editorialValidator } from '../../../src/fynence/editorial/validator/editorialValidator';

describe('Editorial Schema & Content Validator', () => {
  const validAnalysis = {
    headline: 'Federal Reserve Holds Benchmark Rate Steady at 5.25 Percent',
    summary: 'The Federal Open Market Committee concluded its policy gathering by maintaining target borrowing rates. Committee officials noted measured progress on core inflation while underscoring labor market resilience. Equities and benchmark yields held stable following the policy statement.',
    whyItMatters: 'The decision leaves borrowing costs steady for commercial lending and focuses investor attention on upcoming labor prints.',
    primarySection: 'economy',
    secondarySections: ['markets', 'finance'],
    importance: 'high',
    entities: [
      { type: 'organization', name: 'Federal Reserve' },
      { type: 'country', name: 'United States' },
    ],
    metrics: [
      { name: 'policy_rate', value: '5.25%', context: 'Target benchmark rate' },
    ],
  };

  it('validates a compliant structured editorial analysis', () => {
    const res = editorialValidator.validate(validAnalysis);
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.errors.length, 0);
    assert.strictEqual(res.data?.headline, validAnalysis.headline);
    assert.strictEqual(res.data?.primarySection, 'economy');
    assert.strictEqual(res.data?.importance, 'high');
    assert.strictEqual(res.data?.entities.length, 2);
    assert.strictEqual(res.data?.metrics.length, 1);
  });

  it('rejects an empty or missing headline', () => {
    const invalid = { ...validAnalysis, headline: '' };
    const res = editorialValidator.validate(invalid);
    assert.strictEqual(res.isValid, false);
    assert.ok(res.errors.some(e => e.includes('Headline is missing')));
  });

  it('rejects clickbait question headlines', () => {
    const invalid = { ...validAnalysis, headline: 'Will the Fed Crash the Stock Market Tomorrow?' };
    const res = editorialValidator.validate(invalid);
    assert.strictEqual(res.isValid, false);
    assert.ok(res.errors.some(e => e.includes('clickbait rule')));
  });

  it('rejects headline that is too short', () => {
    const invalid = { ...validAnalysis, headline: 'Fed' };
    const res = editorialValidator.validate(invalid);
    assert.strictEqual(res.isValid, false);
    assert.ok(res.errors.some(e => e.includes('too short')));
  });

  it('rejects empty summary or summary with fewer than 30 characters', () => {
    const invalid = { ...validAnalysis, summary: 'Fed held rates.' };
    const res = editorialValidator.validate(invalid);
    assert.strictEqual(res.isValid, false);
    assert.ok(res.errors.some(e => e.includes('Summary is too brief')));
  });

  it('rejects empty whyItMatters section', () => {
    const invalid = { ...validAnalysis, whyItMatters: '' };
    const res = editorialValidator.validate(invalid);
    assert.strictEqual(res.isValid, false);
    assert.ok(res.errors.some(e => e.includes('Why It Matters is missing')));
  });

  it('rejects unsupported primary section', () => {
    const invalid = { ...validAnalysis, primarySection: 'horoscope_and_astrology' };
    const res = editorialValidator.validate(invalid);
    assert.strictEqual(res.isValid, false);
    assert.ok(res.errors.some(e => e.includes('Invalid primary section')));
  });

  it('rejects invalid importance level', () => {
    const invalid = { ...validAnalysis, importance: 'critical_emergency' };
    const res = editorialValidator.validate(invalid);
    assert.strictEqual(res.isValid, false);
    assert.ok(res.errors.some(e => e.includes('Invalid importance level')));
  });

  it('filters out malformed entities and metrics safely', () => {
    const withBadEntities = {
      ...validAnalysis,
      entities: [{ type: 'organization', name: '' }, { type: 'unknown_type', name: 'Valid Bank' }],
      metrics: [{ name: '', value: '' }, { name: 'cpi', value: '2.5%', context: 'August YoY' }],
    };
    const res = editorialValidator.validate(withBadEntities);
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.data?.entities.length, 1);
    assert.strictEqual(res.data?.entities[0].name, 'Valid Bank');
    assert.strictEqual(res.data?.metrics.length, 1);
    assert.strictEqual(res.data?.metrics[0].name, 'cpi');
  });
});
