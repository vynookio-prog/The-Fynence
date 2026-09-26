import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { MarketService } from '../../../src/fynence/market/service/marketService';
import { MockMarketDataProvider } from '../../../src/fynence/market/providers/mockMarketProvider';
import { MockEconomicDataProvider } from '../../../src/fynence/market/providers/economicProvider';
import { marketCache } from '../../../src/fynence/market/cache/marketCache';

describe('Market Service & Aggregated Snapshots', () => {
  const mockMarketProvider = new MockMarketDataProvider();
  const mockEconomicProvider = new MockEconomicDataProvider();

  const service = new MarketService({
    marketProvider: mockMarketProvider,
    economicProvider: mockEconomicProvider,
  });

  beforeEach(() => {
    mockMarketProvider.reset();
    marketCache.clear();
  });

  it('retrieves a single verified quote for Gold (XAUUSD)', async () => {
    const quote = await service.getQuote('XAUUSD');

    assert.strictEqual(quote.symbol, 'XAUUSD');
    assert.strictEqual(quote.category, 'commodity');
    assert.strictEqual(quote.price, 2658.30);
    assert.strictEqual(quote.previousClose, 2645.00);
    assert.strictEqual(quote.change, 13.30);
    assert.strictEqual(quote.direction, 'up');
  });

  it('retrieves quotes in batch and preserves request order', async () => {
    const requested = ['BTCUSD', 'US100', 'EURUSD'];
    const quotes = await service.getQuotes(requested);

    assert.strictEqual(quotes.length, 3);
    assert.strictEqual(quotes[0].symbol, 'BTCUSD');
    assert.strictEqual(quotes[1].symbol, 'US100');
    assert.strictEqual(quotes[2].symbol, 'EURUSD');
  });

  it('bypasses provider and utilizes cache on subsequent lookups', async () => {
    // First call queries mock provider
    await service.getQuote('XAUUSD');
    assert.strictEqual(mockMarketProvider.getCallCount(), 1);

    // Second call hits marketCache
    await service.getQuote('XAUUSD');
    assert.strictEqual(mockMarketProvider.getCallCount(), 1); // No second provider call
  });

  it('retrieves entire default watchlist with all key assets', async () => {
    const watchlist = await service.getWatchlist();

    assert.ok(watchlist.length >= 6);
    const symbols = watchlist.map(q => q.symbol);
    assert.ok(symbols.includes('XAUUSD'));
    assert.ok(symbols.includes('EURUSD'));
    assert.ok(symbols.includes('US30'));
    assert.ok(symbols.includes('BTCUSD'));
  });

  it('refreshes aggregated snapshot and calculates bullish sentiment when equities advance', async () => {
    const snapshot = await service.refreshSnapshot(['US30', 'US100', 'SPX', 'XAUUSD']);

    assert.ok(snapshot.capturedAt);
    assert.ok(snapshot.asOfDate);
    assert.strictEqual(snapshot.overallSentiment, 'bullish');
    assert.ok(snapshot.sentimentHeadline.includes('Indices Advance'));
    assert.ok(snapshot.quotes.XAUUSD);
    assert.ok(snapshot.quotes.US30);
  });

  it('calculates risk-off sentiment when equities decline and gold advances', async () => {
    // Set US30 and SPX negative, Gold positive
    mockMarketProvider.setQuote('US30', {
      symbol: 'US30',
      price: 41000.00,
      previousClose: 41500.00, // -500 change
    });
    mockMarketProvider.setQuote('SPX', {
      symbol: 'SPX',
      price: 5600.00,
      previousClose: 5700.00, // -100 change
    });
    mockMarketProvider.setQuote('XAUUSD', {
      symbol: 'XAUUSD',
      price: 2700.00,
      previousClose: 2650.00, // +50 change (+1.88%)
    });

    const snapshot = await service.refreshSnapshot(['US30', 'SPX', 'XAUUSD']);

    assert.strictEqual(snapshot.overallSentiment, 'risk_off');
    assert.ok(snapshot.sentimentHeadline.includes('Haven in Gold'));
  });

  it('falls back to database quotes when provider experiences outage for existing assets', async () => {
    mockMarketProvider.setShouldFail(true, 'Twelve Data gateway timeout');

    // XAUUSD was stored in previous test with price 2700.00, so getQuote succeeds via database fallback
    const quote = await service.getQuote('XAUUSD', { forceRefresh: true });
    assert.strictEqual(quote.symbol, 'XAUUSD');
    assert.strictEqual(quote.price, 2700.00);
  });

  it('handles provider outage gracefully and propagates error when no database fallback exists', async () => {
    mockMarketProvider.setShouldFail(true, 'Twelve Data gateway timeout');

    await assert.rejects(
      async () => {
        await service.getQuote('UNSEEDED_ASSET_XYZ', { forceRefresh: true });
      },
      /Twelve Data gateway timeout/
    );
  });

  it('retrieves upcoming verified economic calendar events', async () => {
    const events = await service.getEconomicEvents({ minImportance: 'high' });

    assert.ok(events.length > 0);
    assert.ok(events.every(e => e.importance === 'high'));

    const cpi = events.find(e => e.title.includes('CPI'));
    assert.ok(cpi);
    assert.strictEqual(cpi?.country, 'United States');
    assert.strictEqual(cpi?.currency, 'USD');
    assert.strictEqual(cpi?.forecast, '2.5%');
  });
});
