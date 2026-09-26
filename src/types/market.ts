/**
 * Fynence Market Intelligence Types
 * Focused strictly on the top 3 global instruments:
 * 1. XAUUSD (Gold Spot / USD)
 * 2. DJ30 (Dow Jones Industrial Average)
 * 3. NAS100 (Nasdaq 100 Tech Index)
 */

export type SupportedInstrument = 'XAUUSD' | 'DJ30' | 'NAS100';

export const SUPPORTED_INSTRUMENTS: SupportedInstrument[] = [
  'XAUUSD',
  'DJ30',
  'NAS100',
];

// Backwards-compatible aliases
export type SupportedForexPair = SupportedInstrument;
export const SUPPORTED_FOREX_PAIRS = SUPPORTED_INSTRUMENTS;

export interface InstrumentMetadata {
  id: SupportedInstrument;
  name: string;
  subtitle: string;
  category: 'Precious Metal' | 'US Benchmark Index' | 'Technology Index';
  iconColor: string;
  badgeLabel: string;
  twelveDataSymbol: string;
}

export const INSTRUMENTS_METADATA: Record<SupportedInstrument, InstrumentMetadata> = {
  XAUUSD: {
    id: 'XAUUSD',
    name: 'XAUUSD',
    subtitle: 'Gold Spot / US Dollar',
    category: 'Precious Metal',
    iconColor: '#eab308',
    badgeLabel: 'Gold Haven',
    twelveDataSymbol: 'XAU/USD',
  },
  DJ30: {
    id: 'DJ30',
    name: 'DJ30',
    subtitle: 'Dow Jones Industrial Average',
    category: 'US Benchmark Index',
    iconColor: '#38bdf8',
    badgeLabel: 'US Blue Chip',
    twelveDataSymbol: 'DIA',
  },
  NAS100: {
    id: 'NAS100',
    name: 'NAS100',
    subtitle: 'Nasdaq 100 Tech Index',
    category: 'Technology Index',
    iconColor: '#a855f7',
    badgeLabel: 'Tech Growth',
    twelveDataSymbol: 'QQQ',
  },
};

export type MarketBias =
  | 'Strong Bullish'
  | 'Bullish'
  | 'Neutral'
  | 'Bearish'
  | 'Strong Bearish';

export type AnalyticalConfidence = 'Low' | 'Medium' | 'High';

export type TrendDirection = 'Bullish' | 'Bearish' | 'Neutral';
export type MomentumStrength = 'Strong' | 'Moderate' | 'Weak';
export type VolatilityLevel = 'Low' | 'Medium' | 'High';
export type MarketRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ForexQuote {
  symbol: SupportedInstrument;
  price: number;
  open: number;
  high: number;
  low: number;
  change: number;
  changePercent: number;
  pipChange: number;
  timestamp: string;
  sparkline?: number[];
}

export interface TechnicalIndicators {
  ema50: number;
  ema200: number;
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  atr: number;
  volatilityPips: number;
  trend: TrendDirection;
  momentum: MomentumStrength;
  volatility: VolatilityLevel;
}

export interface MarketPsychologyAnalysis {
  buyerDominance: number; // percentage 0 - 100
  sellerDominance: number; // percentage 0 - 100
  marketUncertainty: 'Low' | 'Moderate' | 'Elevated' | 'Extreme';
  fomoRisk: 'Low' | 'Medium' | 'High';
  overconfidenceRisk: 'Low' | 'Medium' | 'High';
  fearSentiment: 'Low' | 'Medium' | 'High';
  // Asset-specific psychology
  safeHavenDemand?: 'Low' | 'Moderate' | 'High' | 'Extreme'; // XAUUSD
  dollarPressure?: 'Bullish USD' | 'Bearish USD' | 'Neutral'; // XAUUSD
  riskAppetite?: 'Risk-On' | 'Risk-Off' | 'Neutral'; // DJ30 & NAS100
  institutionalConfidence?: 'Low' | 'Moderate' | 'High'; // DJ30 & NAS100
  panicSellingRisk?: 'Low' | 'Medium' | 'High'; // DJ30 & NAS100
  insight: string;
}

export interface MarketRiskAssessment {
  riskLevel: MarketRiskLevel;
  reasons: string[];
  mitigationRule: string;
}

export type MarketSessionId =
  | 'TOKYO_OPEN'
  | 'LONDON_OPEN'
  | 'NEW_YORK_OPEN'
  | 'NEW_YORK_MIDDAY'
  | 'NEW_YORK_CLOSE';

export interface MarketSessionTelemetry {
  currentSessionId: MarketSessionId;
  currentSessionName: string;
  sessionNumber: number; // 1 to 5
  totalSessions: number; // 5
  sessionWindow: string; // e.g. "13:30 - 17:00 UTC"
  lastSyncTime: string;
  nextSyncTime: string;
  nextSyncSessionName: string;
  isNewYorkSession: boolean;
}

export interface MarketIntelligenceData {
  pair: SupportedInstrument;
  quote: ForexQuote;
  technicals: TechnicalIndicators;
  bias: MarketBias;
  confidence: AnalyticalConfidence;
  biasExplanation: string;
  psychology: MarketPsychologyAnalysis;
  risk: MarketRiskAssessment;
  upcomingEvents: Array<{
    currency: string;
    event_name: string;
    impact: 'high' | 'medium' | 'low' | 'non-economic';
    event_time: string;
    forecast?: string;
    previous?: string;
  }>;
  aiReport?: string;
  source: 'Twelve Data' | 'Market Engine';
  session?: MarketSessionTelemetry;
  updatedAt: string;
}
