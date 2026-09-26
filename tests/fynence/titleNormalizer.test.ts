import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  calculateJaccardSimilarity,
  normalizeTitle,
  tokenizeTitle,
} from '../../src/fynence/engine/deduplicator/titleNormalizer';

describe('Title Normalizer & Similarity', () => {
  it('strips punctuation, quotes, and normalizes casing', () => {
    const raw = '  Fed\'s Powell: "Inflation Still High, 50bps Rate Hike Possible!"  ';
    const norm = normalizeTitle(raw);
    assert.strictEqual(norm, 'fed s powell inflation still high 50bps rate hike possible');
  });

  it('tokenizes headlines and removes common stopwords', () => {
    const title = 'The Federal Reserve announces a new rate cut for the economy';
    const tokens = tokenizeTitle(title);
    assert.ok(tokens.has('federal'));
    assert.ok(tokens.has('reserve'));
    assert.ok(tokens.has('announces'));
    assert.ok(tokens.has('rate'));
    assert.ok(tokens.has('cut'));
    assert.ok(tokens.has('economy'));
    assert.ok(!tokens.has('the'));
    assert.ok(!tokens.has('for'));
  });

  it('computes high Jaccard similarity for paraphrased headlines of the same event', () => {
    const titleA = 'Federal Reserve holds interest rates steady as inflation cools';
    const titleB = 'Fed holds rates steady as inflation cools in August';
    const tokensA = tokenizeTitle(titleA);
    const tokensB = tokenizeTitle(titleB);
    const similarity = calculateJaccardSimilarity(tokensA, tokensB);

    // Common tokens: holds, rates, steady, inflation, cools
    assert.ok(similarity >= 0.5, `Expected similarity >= 0.5, got ${similarity}`);
  });

  it('computes low similarity for distinct stories', () => {
    const titleA = 'Federal Reserve holds interest rates steady';
    const titleB = 'Apple unveils M5 silicon chips at annual tech developer summit';
    const tokensA = tokenizeTitle(titleA);
    const tokensB = tokenizeTitle(titleB);
    const similarity = calculateJaccardSimilarity(tokensA, tokensB);
    assert.strictEqual(similarity, 0.0);
  });
});
