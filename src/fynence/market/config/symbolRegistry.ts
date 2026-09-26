import type { MarketSymbolConfig } from '../types';

export const SYMBOL_REGISTRY: Record<string, MarketSymbolConfig> = {
  // Forex Pairs
  XAUUSD: {
    internalSymbol: 'XAUUSD',
    displayName: 'Gold (XAU/USD)',
    category: 'commodity',
    provider: 'twelve_data',
    providerSymbol: 'XAU/USD',
    decimals: 2,
    description: 'Gold Spot price per troy ounce quoted in US Dollars',
    currency: 'USD',
  },
  EURUSD: {
    internalSymbol: 'EURUSD',
    displayName: 'EUR/USD',
    category: 'forex',
    provider: 'twelve_data',
    providerSymbol: 'EUR/USD',
    decimals: 4,
    description: 'Euro against the US Dollar',
    currency: 'USD',
  },
  GBPUSD: {
    internalSymbol: 'GBPUSD',
    displayName: 'GBP/USD',
    category: 'forex',
    provider: 'twelve_data',
    providerSymbol: 'GBP/USD',
    decimals: 4,
    description: 'British Pound Sterling against the US Dollar',
    currency: 'USD',
  },
  USDJPY: {
    internalSymbol: 'USDJPY',
    displayName: 'USD/JPY',
    category: 'forex',
    provider: 'twelve_data',
    providerSymbol: 'USD/JPY',
    decimals: 3,
    description: 'US Dollar against the Japanese Yen',
    currency: 'JPY',
  },
  AUDUSD: {
    internalSymbol: 'AUDUSD',
    displayName: 'AUD/USD',
    category: 'forex',
    provider: 'twelve_data',
    providerSymbol: 'AUD/USD',
    decimals: 4,
    description: 'Australian Dollar against the US Dollar',
    currency: 'USD',
  },

  // Equity Indices
  US30: {
    internalSymbol: 'US30',
    displayName: 'Dow Jones (US30)',
    category: 'index',
    provider: 'twelve_data',
    providerSymbol: 'DJI',
    decimals: 2,
    description: 'Dow Jones Industrial Average 30 leading US blue-chip corporations',
    currency: 'USD',
  },
  US100: {
    internalSymbol: 'US100',
    displayName: 'Nasdaq Composite (US100)',
    category: 'index',
    provider: 'twelve_data',
    providerSymbol: 'IXIC',
    decimals: 2,
    description: 'Nasdaq Composite technology and growth equity benchmark',
    currency: 'USD',
  },
  SPX: {
    internalSymbol: 'SPX',
    displayName: 'S&P 500',
    category: 'index',
    provider: 'twelve_data',
    providerSymbol: 'SPX',
    decimals: 2,
    description: 'Standard and Poor 500 leading large-cap US equities',
    currency: 'USD',
  },

  // Crypto
  BTCUSD: {
    internalSymbol: 'BTCUSD',
    displayName: 'Bitcoin (BTC/USD)',
    category: 'crypto',
    provider: 'twelve_data',
    providerSymbol: 'BTC/USD',
    decimals: 2,
    description: 'Bitcoin institutional spot exchange rate against the US Dollar',
    currency: 'USD',
  },
  ETHUSD: {
    internalSymbol: 'ETHUSD',
    displayName: 'Ethereum (ETH/USD)',
    category: 'crypto',
    provider: 'twelve_data',
    providerSymbol: 'ETH/USD',
    decimals: 2,
    description: 'Ethereum institutional spot exchange rate against the US Dollar',
    currency: 'USD',
  },

  // Energy & Commodities
  WTI: {
    internalSymbol: 'WTI',
    displayName: 'WTI Crude Oil',
    category: 'commodity',
    provider: 'twelve_data',
    providerSymbol: 'WTI/USD',
    decimals: 2,
    description: 'West Texas Intermediate crude oil spot barrel price in US Dollars',
    currency: 'USD',
  },
  BRENT: {
    internalSymbol: 'BRENT',
    displayName: 'Brent Crude Oil',
    category: 'commodity',
    provider: 'twelve_data',
    providerSymbol: 'BRENT',
    decimals: 2,
    description: 'North Sea Brent crude oil international benchmark in US Dollars',
    currency: 'USD',
  },
};

export function getSymbolConfig(symbol: string): MarketSymbolConfig | undefined {
  const normalized = symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (SYMBOL_REGISTRY[normalized]) {
    return SYMBOL_REGISTRY[normalized];
  }
  // Search by provider symbol
  return Object.values(SYMBOL_REGISTRY).find(
    cfg => cfg.providerSymbol.toUpperCase().replace(/[^A-Z0-9]/g, '') === normalized
  );
}

export function getProviderSymbol(internalSymbol: string): string {
  const config = getSymbolConfig(internalSymbol);
  return config ? config.providerSymbol : internalSymbol;
}
