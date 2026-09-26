import type { MarketDataProvider } from './types';
import type { MarketProviderResponse, MarketQuote } from '../types';
import { marketValidator } from '../validator/marketValidator';

export class MockMarketDataProvider implements MarketDataProvider {
  public readonly name = 'mock_market_provider';

  private quotes: Map<string, MarketQuote> = new Map();
  private shouldFail = false;
  private failureError = 'Simulated market provider outage';
  private callCount = 0;

  constructor(options?: { shouldFail?: boolean; failureError?: string }) {
    this.shouldFail = !!options?.shouldFail;
    if (options?.failureError) this.failureError = options.failureError;
    this.seedDefaultQuotes();
  }

  public setShouldFail(fail: boolean, error?: string): void {
    this.shouldFail = fail;
    if (error) this.failureError = error;
  }

  public setQuote(symbol: string, raw: Parameters<typeof marketValidator.normalizeAndValidate>[0]): void {
    const res = marketValidator.normalizeAndValidate(raw);
    if (res.isValid && res.quote) {
      this.quotes.set(symbol.toUpperCase(), res.quote);
    }
  }

  public getCallCount(): number {
    return this.callCount;
  }

  public reset(): void {
    this.callCount = 0;
    this.shouldFail = false;
    this.seedDefaultQuotes();
  }

  public async getQuote(symbol: string): Promise<MarketProviderResponse<MarketQuote>> {
    this.callCount++;
    if (this.shouldFail) {
      return {
        success: false,
        provider: this.name,
        error: this.failureError,
        latencyMs: 5,
      };
    }

    const normalized = symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const quote = this.quotes.get(normalized);

    if (!quote) {
      return {
        success: false,
        provider: this.name,
        error: `Asset symbol "${symbol}" not found in mock market provider`,
        latencyMs: 5,
      };
    }

    return {
      success: true,
      data: quote,
      provider: this.name,
      latencyMs: 5,
    };
  }

  public async getQuotes(symbols: string[]): Promise<MarketProviderResponse<MarketQuote[]>> {
    this.callCount++;
    if (this.shouldFail) {
      return {
        success: false,
        provider: this.name,
        error: this.failureError,
        latencyMs: 5,
      };
    }

    const result: MarketQuote[] = [];
    for (const sym of symbols) {
      const normalized = sym.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const quote = this.quotes.get(normalized);
      if (quote) {
        result.push(quote);
      }
    }

    return {
      success: true,
      data: result,
      provider: this.name,
      latencyMs: 8,
    };
  }

  private seedDefaultQuotes(): void {
    const nowIso = new Date().toISOString();

    const seeds = [
      {
        symbol: 'XAUUSD',
        price: 2658.30,
        previousClose: 2645.00,
        open: 2648.00,
        high: 2665.50,
        low: 2642.10,
        volume: 185400,
        isMarketOpen: true,
        timestamp: nowIso,
      },
      {
        symbol: 'EURUSD',
        price: 1.0855,
        previousClose: 1.0820,
        open: 1.0825,
        high: 1.0870,
        low: 1.0815,
        volume: 950000,
        isMarketOpen: true,
        timestamp: nowIso,
      },
      {
        symbol: 'GBPUSD',
        price: 1.3025,
        previousClose: 1.2980,
        open: 1.2985,
        high: 1.3045,
        low: 1.2970,
        volume: 720000,
        isMarketOpen: true,
        timestamp: nowIso,
      },
      {
        symbol: 'USDJPY',
        price: 149.25,
        previousClose: 148.80,
        open: 148.90,
        high: 149.50,
        low: 148.60,
        volume: 680000,
        isMarketOpen: true,
        timestamp: nowIso,
      },
      {
        symbol: 'US30',
        price: 42125.50,
        previousClose: 41950.00,
        open: 42000.00,
        high: 42200.00,
        low: 41900.00,
        volume: 240000000,
        isMarketOpen: true,
        timestamp: nowIso,
      },
      {
        symbol: 'US100',
        price: 18150.25,
        previousClose: 18020.00,
        open: 18050.00,
        high: 18220.00,
        low: 18010.00,
        volume: 890000000,
        isMarketOpen: true,
        timestamp: nowIso,
      },
      {
        symbol: 'SPX',
        price: 5745.20,
        previousClose: 5715.00,
        open: 5720.00,
        high: 5755.00,
        low: 5710.00,
        volume: 450000000,
        isMarketOpen: true,
        timestamp: nowIso,
      },
      {
        symbol: 'BTCUSD',
        price: 66450.00,
        previousClose: 65200.00,
        open: 65300.00,
        high: 66800.00,
        low: 65100.00,
        volume: 28000,
        isMarketOpen: true,
        timestamp: nowIso,
      },
      {
        symbol: 'WTI',
        price: 71.40,
        previousClose: 70.80,
        open: 70.90,
        high: 71.95,
        low: 70.50,
        volume: 410000,
        isMarketOpen: true,
        timestamp: nowIso,
      },
    ];

    this.quotes.clear();
    for (const seed of seeds) {
      const res = marketValidator.normalizeAndValidate({
        ...seed,
        source: this.name,
      });
      if (res.isValid && res.quote) {
        this.quotes.set(seed.symbol, res.quote);
      }
    }
  }
}
