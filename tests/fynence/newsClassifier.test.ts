import { describe, it } from 'node:test';
import assert from 'node:assert';
import { NewsClassifier } from '../../src/fynence/engine/classifier/newsClassifier';

describe('News Classifier & Importance Scorer', () => {
  const classifier = new NewsClassifier();

  it('classifies Federal Reserve interest rate decision as economy', () => {
    const article = {
      title: 'Federal Reserve Cuts Interest Rates by 50 Basis Points Amid Softening Inflation',
      description: 'The FOMC lowered the policy benchmark rate following the latest CPI print.',
    };

    const res = classifier.classify(article);
    assert.strictEqual(res.primaryCategory, 'economy');
    assert.strictEqual(res.importance, 'high'); // "rate cut" is high importance
  });

  it('classifies Wall Street equity index rally as markets', () => {
    const article = {
      title: 'S&P 500 and Nasdaq Reach New Record Highs in Broad Wall Street Rally',
      description: 'Equities surged across technology and industrial sectors following strong risk appetite.',
    };

    const res = classifier.classify(article);
    assert.strictEqual(res.primaryCategory, 'markets');
  });

  it('classifies semiconductor and AI chips as technology', () => {
    const article = {
      title: 'Nvidia Unveils Next-Generation AI Semiconductor Architecture for Data Centers',
      description: 'The chipmaker announced accelerated deep learning hardware partnerships.',
    };

    const res = classifier.classify(article);
    assert.strictEqual(res.primaryCategory, 'technology');
  });

  it('classifies cryptocurrency news as crypto', () => {
    const article = {
      title: 'Bitcoin Surpasses $70,000 as Ethereum Spot ETF Inflows Accelerate',
      description: 'Digital asset markets recorded strong institutional inflows across major tokens.',
    };

    const res = classifier.classify(article);
    assert.strictEqual(res.primaryCategory, 'crypto');
  });

  it('classifies Indonesian macroeconomic policy as national with indonesia region', () => {
    const article = {
      title: 'Bank Indonesia Siapkan Kebijakan Moneter Baru Jaga Stabilitas Nilai Tukar Rupiah',
      description: 'Gubernur BI menyampaikan langkah proaktif menghadapi ketidakpastian pasar global di Jakarta.',
    };

    const res = classifier.classify(article);
    assert.ok(res.primaryCategory === 'national' || res.primaryCategory === 'economy');
    assert.strictEqual(res.region, 'indonesia');
  });

  it('assigns high importance to urgent breaking news and market crashes', () => {
    const article = {
      title: 'BREAKING: Emergency Central Bank Rate Hike Announced Amid Currency Crisis',
      description: 'Policy makers gathered for unscheduled session to stabilize sovereign liquidity.',
    };

    const res = classifier.classify(article);
    assert.strictEqual(res.importance, 'high');
  });
});
