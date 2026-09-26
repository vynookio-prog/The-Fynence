export type MarketCategory = 'forex' | 'index' | 'crypto' | 'commodity';

export type MarketStatus = 'open' | 'closed' | 'pre-market' | 'after-hours' | 'unknown';

export type MarketDirection = 'up' | 'down' | 'flat';

export interface MarketSymbolConfig {
  internalSymbol: string;
  displayName: string;
  category: MarketCategory;
  provider: 'twelve_data';
  providerSymbol: string;
  decimals: number;
  description: string;
  currency: string;
}

export interface MarketQuote {
  symbol: string;
  providerSymbol: string;
  displayName: string;
  category: MarketCategory;
  price: number;
  open: number | null;
  high: number | null;
  low: number | null;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
  direction: MarketDirection;
  volume: number | null;
  marketStatus: MarketStatus;
  timestamp: string;
  source: string;
}

export interface MarketSnapshot {
  id?: string;
  capturedAt: string;
  asOfDate: string;
  overallSentiment: 'bullish' | 'bearish' | 'neutral' | 'cautious' | 'risk_on' | 'risk_off';
  sentimentHeadline: string;
  quotes: Record<string, MarketQuote>;
  source: string;
}

export type EconomicEventImportance = 'low' | 'medium' | 'high';

export interface EconomicEvent {
  id: string;
  title: string;
  country: string;
  currency: string;
  importance: EconomicEventImportance;
  scheduledAt: string;
  actual: string | null;
  forecast: string | null;
  previous: string | null;
  impact?: 'positive' | 'negative' | 'neutral' | 'unknown';
  source: string;
}

export interface MarketProviderResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  latencyMs: number;
  provider: string;
  cached?: boolean;
}
