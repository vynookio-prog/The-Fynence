import { describe, it } from 'node:test';
import assert from 'node:assert';
import { marketValidator } from '../../../src/fynence/market/validator/marketValidator';

describe('Market Validator & Deterministic Calculations', () => {
  it('normalizes a fully populated quote and calculates positive change deterministically', () => {
    const raw = {
      symbol: 'XAUUSD',
      price: 2658.30,
      previousClose: 2645.00,
      open: 2648.00,
      high: 2665.50,
      low: 2642.10,
      volume: 185400,
      isMarketOpen: true,
      timestamp: '2026-09-26T16:00:00Z',
    };

    const res = marketValidator.normalizeAndValidate(raw);
    assert.strictEqual(res.isValid, true);
    assert.ok(res.quote);

    const q = res.quote;
    assert.strictEqual(q.symbol, 'XAUUSD');
    assert.strictEqual(q.providerSymbol, 'XAU/USD');
    assert.strictEqual(q.category, 'commodity');
    assert.strictEqual(q.price, 2658.30);
    assert.strictEqual(q.previousClose, 2645.00);

    // Deterministic change check: 2658.30 - 2645.00 = 13.30
    assert.strictEqual(q.change, 13.30);
    // Deterministic percent check: (13.30 / 2645.00) * 100 = 0.5028%
    assert.strictEqual(q.changePercent, 0.5028);
    assert.strictEqual(q.direction, 'up');
    assert.strictEqual(q.marketStatus, 'open');
  });

  it('calculates negative change and down direction accurately', () => {
    const raw = {
      symbol: 'EURUSD',
      price: 1.0820,
      previousClose: 1.0850,
      timestamp: '2026-09-26T16:00:00Z',
    };

    const res = marketValidator.normalizeAndValidate(raw);
    assert.strictEqual(res.isValid, true);
    assert.ok(res.quote);

    const q = res.quote;
    // 1.0820 - 1.0850 = -0.0030
    assert.strictEqual(q.change, -0.0030);
    // (-0.0030 / 1.0850) * 100 = -0.2765%
    assert.strictEqual(q.changePercent, -0.2765);
    assert.strictEqual(q.direction, 'down');
  });

  it('handles flat zero change correctly', () => {
    const raw = {
      symbol: 'US30',
      price: 42000.00,
      previousClose: 42000.00,
      timestamp: '2026-09-26T16:00:00Z',
    };

    const res = marketValidator.normalizeAndValidate(raw);
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.quote?.change, 0);
    assert.strictEqual(res.quote?.changePercent, 0);
    assert.strictEqual(res.quote?.direction, 'flat');
  });

  it('handles missing or zero previous close safely without dividing by zero', () => {
    const raw = {
      symbol: 'BTCUSD',
      price: 66000.00,
      previousClose: null,
      timestamp: '2026-09-26T16:00:00Z',
    };

    const res = marketValidator.normalizeAndValidate(raw);
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.quote?.change, null);
    assert.strictEqual(res.quote?.changePercent, null);
    assert.strictEqual(res.quote?.direction, 'flat');
  });

  it('rejects invalid or non-numeric price', () => {
    const nanRes = marketValidator.normalizeAndValidate({
      symbol: 'XAUUSD',
      price: 'not_a_price',
    });
    assert.strictEqual(nanRes.isValid, false);
    assert.ok(nanRes.errors.some(e => e.includes('not a valid number')));

    const negativeRes = marketValidator.normalizeAndValidate({
      symbol: 'XAUUSD',
      price: -500,
    });
    assert.strictEqual(negativeRes.isValid, false);
    assert.ok(negativeRes.errors.some(e => e.includes('must be positive')));

    const zeroRes = marketValidator.normalizeAndValidate({
      symbol: 'XAUUSD',
      price: 0,
    });
    assert.strictEqual(zeroRes.isValid, false);
    assert.ok(zeroRes.errors.some(e => e.includes('must be positive')));
  });

  it('rejects empty symbol', () => {
    const res = marketValidator.normalizeAndValidate({
      symbol: '',
      price: 100,
    });
    assert.strictEqual(res.isValid, false);
    assert.ok(res.errors.some(e => e.includes('Symbol is missing')));
  });

  it('normalizes unix timestamps in seconds to ISO UTC', () => {
    const res = marketValidator.normalizeAndValidate({
      symbol: 'USDJPY',
      price: 149.25,
      timestamp: 1727366400, // Unix timestamp in seconds
    });
    assert.strictEqual(res.isValid, true);
    assert.ok(res.quote?.timestamp.endsWith('Z'));
    assert.strictEqual(new Date(res.quote!.timestamp).getUTCFullYear(), 2024);
  });

  it('defaults market status to unknown when provider provides no status data', () => {
    const res = marketValidator.normalizeAndValidate({
      symbol: 'SPX',
      price: 5750.00,
      isMarketOpen: null,
    });
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.quote?.marketStatus, 'unknown');
  });
});
