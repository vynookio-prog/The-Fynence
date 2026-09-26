import type {
  EconomicDataProvider,
  EconomicDataProviderOptions,
  MarketDataProvider,
} from '../providers/types';
import type { EconomicEvent, MarketQuote, MarketSnapshot } from '../types';
import { TwelveDataProvider } from '../providers/twelveDataProvider';
import { InsforgeEconomicDataProvider } from '../providers/economicProvider';
import { DEFAULT_MARKET_WATCHLIST } from '../config/watchlist';
import { marketCache } from '../cache/marketCache';
import { marketRepository } from '../repository/marketRepository';

export class MarketService {
  private marketProvider: MarketDataProvider;
  private economicProvider: EconomicDataProvider;

  constructor(options?: {
    marketProvider?: MarketDataProvider;
    economicProvider?: EconomicDataProvider;
  }) {
    this.marketProvider = options?.marketProvider || new TwelveDataProvider();
    this.economicProvider = options?.economicProvider || new InsforgeEconomicDataProvider();
  }

  public setMarketProvider(provider: MarketDataProvider): void {
    this.marketProvider = provider;
  }

  public setEconomicProvider(provider: EconomicDataProvider): void {
    this.economicProvider = provider;
  }

  /**
   * Retrieves a verified market quote for a single asset symbol.
   * Utilizes the marketCache unless forceRefresh is explicitly specified.
   */
  public async getQuote(
    symbol: string,
    options?: { forceRefresh?: boolean }
  ): Promise<MarketQuote> {
    const quotes = await this.getQuotes([symbol], options);
    if (quotes.length === 0) {
      throw new Error(`Failed to retrieve quote for asset "${symbol}"`);
    }
    return quotes[0];
  }

  /**
   * Retrieves verified market quotes for multiple asset symbols.
   * Merges cached quotes with newly fetched provider data.
   */
  public async getQuotes(
    symbols: string[],
    options?: { forceRefresh?: boolean }
  ): Promise<MarketQuote[]> {
    if (symbols.length === 0) return [];

    const resultQuotes: MarketQuote[] = [];
    let symbolsToFetch: string[] = [];

    if (!options?.forceRefresh) {
      const { cached, missing } = marketCache.getMany(symbols);
      resultQuotes.push(...cached);
      symbolsToFetch = missing;
    } else {
      symbolsToFetch = [...symbols];
    }

    if (symbolsToFetch.length > 0) {
      const providerRes = await this.marketProvider.getQuotes(symbolsToFetch);
      if (providerRes.success && providerRes.data) {
        // Cache and store newly fetched quotes
        marketCache.setMany(providerRes.data);
        await marketRepository.storeQuotes(providerRes.data);
        resultQuotes.push(...providerRes.data);
      } else {
        // If provider fetch failed, fallback to database for missing symbols
        const dbFallback = await marketRepository.getLatestQuotes(symbolsToFetch);
        resultQuotes.push(...dbFallback);

        if (resultQuotes.length === 0 && providerRes.error) {
          throw new Error(`MarketDataProvider error: ${providerRes.error}`);
        }
      }
    }

    // Sort to match original symbols order
    const orderMap = new Map(symbols.map((s, i) => [s.toUpperCase(), i]));
    return resultQuotes.sort((a, b) => {
      const idxA = orderMap.get(a.symbol.toUpperCase()) ?? 999;
      const idxB = orderMap.get(b.symbol.toUpperCase()) ?? 999;
      return idxA - idxB;
    });
  }

  /**
   * Retrieves current quotes for the default market watchlist.
   */
  public async getWatchlist(options?: { forceRefresh?: boolean }): Promise<MarketQuote[]> {
    return this.getQuotes(DEFAULT_MARKET_WATCHLIST, options);
  }

  /**
   * Captures an aggregated market snapshot suitable for inclusion in THE FYNENCE edition.
   */
  public async refreshSnapshot(symbols: string[] = DEFAULT_MARKET_WATCHLIST): Promise<MarketSnapshot> {
    const quotes = await this.getQuotes(symbols, { forceRefresh: true });
    const quotesMap: Record<string, MarketQuote> = {};
    for (const q of quotes) {
      quotesMap[q.symbol] = q;
    }

    // Deterministically assess overall market sentiment from benchmark indices & gold
    const sentimentAnalysis = this.assessSentiment(quotes);

    const snapshot: MarketSnapshot = {
      capturedAt: new Date().toISOString(),
      asOfDate: new Date().toISOString().slice(0, 10),
      overallSentiment: sentimentAnalysis.sentiment,
      sentimentHeadline: sentimentAnalysis.headline,
      quotes: quotesMap,
      source: this.marketProvider.name,
    };

    await marketRepository.storeSnapshot(snapshot);
    return snapshot;
  }

  /**
   * Retrieves verified scheduled economic events.
   */
  public async getEconomicEvents(options?: EconomicDataProviderOptions): Promise<EconomicEvent[]> {
    return this.economicProvider.getUpcomingEvents(options);
  }

  private assessSentiment(quotes: MarketQuote[]): {
    sentiment: MarketSnapshot['overallSentiment'];
    headline: string;
  } {
    const indices = quotes.filter(q => q.category === 'index');
    const positiveIndices = indices.filter(q => (q.change || 0) > 0);
    const negativeIndices = indices.filter(q => (q.change || 0) < 0);

    const gold = quotes.find(q => q.symbol === 'XAUUSD');
    const goldChange = gold?.changePercent || 0;

    if (positiveIndices.length > negativeIndices.length && positiveIndices.length >= 2) {
      return {
        sentiment: 'bullish',
        headline: 'Equity Indices Advance Across Broad Session as Risk Appetite Holds Steady',
      };
    } else if (negativeIndices.length > positiveIndices.length && negativeIndices.length >= 2) {
      if (goldChange > 0.5) {
        return {
          sentiment: 'risk_off',
          headline: 'Equities Retreat as Investors Seek Sovereign Haven in Gold',
        };
      }
      return {
        sentiment: 'bearish',
        headline: 'Equities Face Broad Selling Pressure Amid Benchmark Yield Adjustments',
      };
    }

    return {
      sentiment: 'neutral',
      headline: 'Financial Markets Steady Across Major Indices and Foreign Exchange Crosses',
    };
  }
}

export const marketService = new MarketService();
