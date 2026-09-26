export type PulseSentiment = 'bullish' | 'bearish' | 'neutral';
export type OverallPulseSentiment = 'bullish' | 'bearish' | 'neutral' | 'mixed';
export type EconomicImpact = 'high' | 'medium' | 'low';

export interface PulseArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  urlToImage?: string;
  sourceName: string;
  publishedAt: string;
  topicCategory: string;
  marketSentiment: PulseSentiment;
  sentimentScore: number; // -100 to +100
  economicImpact: EconomicImpact;
  affectedAssets: string[];
  shortSummary: string;
  aiInsight: string;
}

export interface TrendingTopic {
  topic: string;
  count: number;
  sentiment: PulseSentiment;
  impact: EconomicImpact;
}

export interface FynencePulseData {
  macroHeadline: string;
  executiveSummary: string;
  overallSentiment: OverallPulseSentiment;
  sentimentScore: number; // -100 (extreme bearish) to +100 (extreme bullish)
  sentimentDistribution: {
    bullish: number;
    bearish: number;
    neutral: number;
  };
  trendingTopics: TrendingTopic[];
  keyAffectedAssets: string[];
  articles: PulseArticle[];
  lastUpdated: string;
  status: 'live' | 'cached' | 'fallback';
  newsSourceCount: number;
}
