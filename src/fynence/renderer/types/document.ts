import type { EditionFormat, EditionTheme } from '../../types/edition';

export type EditionType = 'daily' | 'finance_economy' | 'market' | 'finance' | 'economy' | 'custom';

export type NewspaperSectionName =
  | 'daily_news'
  | 'world'
  | 'national'
  | 'business'
  | 'finance'
  | 'economy'
  | 'technology'
  | 'forex'
  | 'crypto'
  | 'markets'
  | 'weather'
  | 'economic_calendar'
  | 'tomorrow_watch';

export interface NewspaperStoryImage {
  url: string;
  assetDataUri?: string;
  assetBuffer?: Buffer;
  width?: number;
  height?: number;
  mimeType?: string;
  credit: string;
  source: string;
  caption?: string;
  aspectRatio?: '16:9' | '4:3' | '1:1' | '3:2';
  readonly isAiGenerated: false; // STRICT: AI news images are strictly forbidden
}

export interface NewspaperStory {
  id: string;
  title?: string;
  headline: string;
  subheadline?: string;
  whatHappened?: string;
  details?: string;
  kicker?: string;
  summary: string;
  whyItMatters?: string;
  keyPoints?: string[];
  source: string;
  originalUrl: string;
  resolvedUrl?: string;
  linkStatus?: 'VALID' | 'REDIRECTED' | 'PAYWALLED' | 'BLOCKED' | 'BROKEN' | 'UNKNOWN';
  author?: string;
  publishedAt?: string;
  image?: NewspaperStoryImage;
  section: string;
  importance: 'high' | 'medium' | 'low';
  columnSpan?: 1 | 2 | 3 | 4;
}

export interface MarketTickerItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  direction: 'up' | 'down' | 'flat';
  category?: 'metal' | 'index' | 'forex' | 'crypto' | 'commodity';
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

export interface MastheadEar {
  title: string;
  line1: string;
  line2: string;
}

export interface MastheadBlock {
  type: 'masthead';
  title: string;
  subtitle: string;
  volumeNumber: string;
  editionNumber: string;
  date: string;
  dayOfWeek: string;
  cityOrRegion: string;
  priceTag: string;
  motto: string;
  leftEar?: MastheadEar;
  rightEar?: MastheadEar;
}

export interface LeadStoryBlock {
  type: 'lead_story';
  story: NewspaperStory;
}

export interface StoryBlock {
  type: 'story';
  story: NewspaperStory;
  columnSpan: 1 | 2 | 3 | 4;
}

export interface StoryGridBlock {
  type: 'story_grid';
  stories: NewspaperStory[];
  columns: 2 | 3 | 4;
}

export interface MarketStripBlock {
  type: 'market_strip';
  title?: string;
  tickers: MarketTickerItem[];
  asOfTimestamp: string;
  marketMood?: string;
  moodDescription?: string;
}

export interface WeatherBlock {
  type: 'weather_block';
  location: string;
  currentTempC: number;
  condition: string;
  conditionIcon: string;
  highTempC: number;
  lowTempC: number;
  precipitationChancePercent: number;
  humidityPercent?: number;
  windKmh?: number;
  forecastSummary: string;
  source: string;
  isStale: boolean;
  observedAt: string;
}

export interface EconomicCalendarBlock {
  type: 'economic_calendar';
  title: string;
  events: EconomicCalendarItem[];
}

export interface SectionHeaderBlock {
  type: 'section_header';
  title: string;
  subtitle?: string;
  kicker?: string;
  ornament?: boolean;
}

export interface DividerBlock {
  type: 'divider';
  variant: 'thick' | 'double' | 'thin' | 'ornamental';
}

export interface ColophonBlock {
  type: 'colophon';
  colophon: string;
  disclaimer: string;
  sourceAttribution: string;
}

export type NewspaperBlock =
  | MastheadBlock
  | LeadStoryBlock
  | StoryBlock
  | StoryGridBlock
  | MarketStripBlock
  | WeatherBlock
  | EconomicCalendarBlock
  | SectionHeaderBlock
  | DividerBlock
  | ColophonBlock;

export interface NewspaperPageHeader {
  runningTitle: string;
  pageDate: string;
  sectionName?: string;
}

export interface NewspaperPageFooter {
  colophon: string;
  pageNumber: number;
  totalPages: number;
}

export interface NewspaperPage {
  pageNumber: number;
  totalPages: number;
  pageTitle?: string;
  header?: NewspaperPageHeader;
  blocks: NewspaperBlock[];
  footer?: NewspaperPageFooter;
}

export interface NewspaperEditionMetadata {
  id: string;
  title: string;
  subtitle: string;
  editionDate: string;
  editionType: EditionType;
  sections: NewspaperSectionName[];
  generatedAt: string;
  timezone: string;
  volumeNumber?: string;
  editionNumber?: string;
  motto?: string;
  theme?: EditionTheme;
  format?: EditionFormat;
}

export interface NewspaperDocument {
  edition: NewspaperEditionMetadata;
  pages: NewspaperPage[];
  stories?: NewspaperStory[];
}
