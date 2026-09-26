import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  getProviderSymbol,
  getSymbolConfig,
  SYMBOL_REGISTRY,
} from '../../../src/fynence/market/config/symbolRegistry';
import { DEFAULT_MARKET_WATCHLIST } from '../../../src/fynence/market/config/watchlist';

describe('Symbol Registry & Watchlist Mapping', () => {
  it('maps Forex pairs accurately to Twelve Data notation', () => {
    assert.strictEqual(getProviderSymbol('XAUUSD'), 'XAU/USD');
    assert.strictEqual(getProviderSymbol('EURUSD'), 'EUR/USD');
    assert.strictEqual(getProviderSymbol('GBPUSD'), 'GBP/USD');
    assert.strictEqual(getProviderSymbol('USDJPY'), 'USD/JPY');
    assert.strictEqual(getProviderSymbol('AUDUSD'), 'AUD/USD');
  });

  it('maps Equity Indices to Twelve Data identifiers', () => {
    assert.strictEqual(getProviderSymbol('US30'), 'DJI');
    assert.strictEqual(getProviderSymbol('US100'), 'IXIC');
    assert.strictEqual(getProviderSymbol('SPX'), 'SPX');
  });

  it('maps Cryptocurrencies to Twelve Data currency pairs', () => {
    assert.strictEqual(getProviderSymbol('BTCUSD'), 'BTC/USD');
    assert.strictEqual(getProviderSymbol('ETHUSD'), 'ETH/USD');
  });

  it('maps Energy commodities to spot symbols', () => {
    assert.strictEqual(getProviderSymbol('WTI'), 'WTI/USD');
    assert.strictEqual(getProviderSymbol('BRENT'), 'BRENT');
  });

  it('resolves symbol configurations case-insensitively and with slashes', () => {
    const configA = getSymbolConfig('xauusd');
    const configB = getSymbolConfig('XAU/USD');
    assert.ok(configA);
    assert.ok(configB);
    assert.strictEqual(configA?.internalSymbol, 'XAUUSD');
    assert.strictEqual(configB?.internalSymbol, 'XAUUSD');
    assert.strictEqual(configA?.category, 'commodity');
  });

  it('contains essential financial assets in the default watchlist', () => {
    assert.ok(DEFAULT_MARKET_WATCHLIST.includes('XAUUSD'));
    assert.ok(DEFAULT_MARKET_WATCHLIST.includes('EURUSD'));
    assert.ok(DEFAULT_MARKET_WATCHLIST.includes('USDJPY'));
    assert.ok(DEFAULT_MARKET_WATCHLIST.includes('US30'));
    assert.ok(DEFAULT_MARKET_WATCHLIST.includes('SPX'));
    assert.ok(DEFAULT_MARKET_WATCHLIST.includes('BTCUSD'));
  });
});
