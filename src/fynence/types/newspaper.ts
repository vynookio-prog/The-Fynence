import type { EditionFormat, EditionTheme, NewspaperSectionType } from './edition';
import type { ProcessedArticleImage } from './image';

export interface NewspaperHeaderData {
  title: string;
  subtitle: string;
  volumeNumber?: string;
  editionNumber?: string;
  date: string;
  dayOfWeek: string;
  cityOrRegion: string;
  priceTag?: string;
  motto?: string;
}

export interface StorySectionData {
  type:
    | 'top_story'
    | 'world'
    | 'national'
    | 'business'
    | 'technology'
    | 'finance'
    | 'economy'
    | 'forex'
    | 'crypto';
  headline: string;
  kicker?: string;
  summary: string;
  whyItMatters?: string;
  keyPoints?: string[];
  source: string;
  articleUrl: string;
  author?: string;
  publishedAt?: string;
  image?: ProcessedArticleImage;
  columnSpan?: 1 | 2 | 3 | 4;
}

export interface MarketTickerItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  direction: 'up' | 'down' | 'flat';
  category: 'metal' | 'index' | 'forex' | 'crypto' | 'commodity';
}

export interface MarketSectionData {
  type: 'markets';
  marketMood: string;
  moodDescription: string;
  asOfTimestamp: string;
  tickers: MarketTickerItem[];
  macroSummary?: string;
}

export interface EconomicCalendarItem {
  time: string;
  currency: string;
  eventName: string;
  impact: 'low' | 'medium' | 'high';
  forecast?: string;
  previous?: string;
  actual?: string;
}

export interface EconomicCalendarSectionData {
  type: 'economic_calendar';
  title: string;
  date: string;
  events: EconomicCalendarItem[];
}

export interface WeatherSectionData {
  type: 'weather';
  location: string;
  currentCondition: string;
  conditionIconText: string;
  currentTempC: number;
  highTempC: number;
  lowTempC: number;
  precipitationChancePercent: number;
  humidityPercent?: number;
  windKmh?: number;
  forecastSummary: string;
}

export interface TomorrowWatchItem {
  timeOrSession: string;
  catalyst: string;
  expectedSignificance: string;
  affectedSectors: string[];
}

export interface TomorrowWatchSectionData {
  type: 'tomorrow_watch';
  title: string;
  items: TomorrowWatchItem[];
}

export type NewspaperSectionItem =
  | StorySectionData
  | MarketSectionData
  | EconomicCalendarSectionData
  | WeatherSectionData
  | TomorrowWatchSectionData;

export interface StructuredNewspaperData {
  metadata: {
    editionId: string;
    schemaVersion: '1.0.0';
    generatedAt: string;
    targetFormat: EditionFormat;
    theme: EditionTheme;
    language: string;
  };
  header: NewspaperHeaderData;
  sections: NewspaperSectionItem[];
  footer: {
    colophon: string;
    disclaimer: string;
    sourceAttribution: string;
  };
}
