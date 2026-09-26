export type NewspaperMarketSymbol =
  | 'XAUUSD'
  | 'EURUSD'
  | 'GBPUSD'
  | 'USDJPY'
  | 'DXY'
  | 'US30'
  | 'US100'
  | 'SPX500'
  | 'BTCUSD'
  | 'ETHUSD'
  | 'BRENT_OIL';

export interface MarketAssetQuote {
  symbol: NewspaperMarketSymbol;
  displayName: string;
  price: number;
  change: number;
  changePercent: number;
  high24h?: number;
  low24h?: number;
  openPrice?: number;
  currency: string;
  timestamp: string;
}

export interface MarketSnapshot {
  id?: string;
  capturedAt: string;
  asOfDate: string;
  overallSentiment: 'bullish' | 'bearish' | 'neutral' | 'cautious' | 'risk_on' | 'risk_off';
  sentimentHeadline: string;
  quotes: Record<NewspaperMarketSymbol, MarketAssetQuote>;
  sourceProvider: string;
}

export interface IMarketDataProvider {
  readonly providerName: string;
  getLatestSnapshot(symbols?: NewspaperMarketSymbol[]): Promise<MarketSnapshot>;
  getQuote(symbol: NewspaperMarketSymbol): Promise<MarketAssetQuote>;
  getSupportedSymbols(): NewspaperMarketSymbol[];
}
