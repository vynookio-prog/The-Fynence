import type {
  EconomicEvent,
  EconomicEventImportance,
  MarketProviderResponse,
  MarketQuote,
} from '../types';

export interface MarketDataProvider {
  readonly name: string;

  /**
   * Fetches the current quote for a single asset symbol.
   */
  getQuote(symbol: string): Promise<MarketProviderResponse<MarketQuote>>;

  /**
   * Fetches current quotes for multiple asset symbols in batch.
   */
  getQuotes(symbols: string[]): Promise<MarketProviderResponse<MarketQuote[]>>;
}

export interface EconomicDataProviderOptions {
  limit?: number;
  minImportance?: EconomicEventImportance;
  currency?: string;
  startDate?: string;
  endDate?: string;
}

export interface EconomicDataProvider {
  readonly name: string;

  /**
   * Retrieves verified scheduled economic calendar events.
   */
  getUpcomingEvents(options?: EconomicDataProviderOptions): Promise<EconomicEvent[]>;
}
