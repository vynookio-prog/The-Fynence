import type {
  IMarketDataProvider,
  MarketAssetQuote,
  MarketSnapshot,
  NewspaperMarketSymbol,
} from '../types/market';
import type { MarketSectionData } from '../types/newspaper';

export type { IMarketDataProvider, MarketAssetQuote, MarketSnapshot, NewspaperMarketSymbol };

export interface IMarketSectionFormatter {
  /**
   * Formats a raw market snapshot into structured data suitable for the newspaper layout renderer.
   */
  formatMarketSection(snapshot: MarketSnapshot): MarketSectionData;
}
