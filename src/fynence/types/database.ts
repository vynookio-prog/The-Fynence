import type { ArticleCategory, ArticleRegion } from './article';
import type { EditionFormat, EditionStatus, EditionTheme, EditionType, NewspaperSectionType, WeatherSectionConfig } from './edition';
import type { ImageUsageStatus } from './image';
import type { NewspaperMarketSymbol } from './market';
import type { StructuredNewspaperData } from './newspaper';
import type { WeatherCondition } from './weather';

export interface DbNewsSource {
  id: string;
  name: string;
  slug: string;
  base_url: string;
  feed_url: string | null;
  category: ArticleCategory;
  region: ArticleRegion;
  is_active: boolean;
  reliability_score: number;
  created_at: string;
  updated_at: string;
}

export interface DbArticle {
  id: string;
  title: string;
  description: string;
  content: string | null;
  url: string;
  source: string;
  source_id: string | null;
  author: string | null;
  category: ArticleCategory;
  region: ArticleRegion;
  published_at: string;
  image_url: string | null;
  image_source: string | null;
  image_credit: string | null;
  image_usage_status: ImageUsageStatus;
  created_at: string;
  updated_at: string;
}

export interface DbArticleImage {
  id: string;
  article_id: string;
  image_url: string;
  image_source: string;
  image_credit: string;
  original_article_url: string;
  usage_status: ImageUsageStatus;
  fetched_at: string;
  width: number | null;
  height: number | null;
  mime_type: string | null;
  storage_path: string | null;
  created_at: string;
}

export interface DbMarketSnapshot {
  id: string;
  captured_at: string;
  as_of_date: string;
  overall_sentiment: string;
  sentiment_headline: string;
  quotes_data: Record<NewspaperMarketSymbol, any>;
  source_provider: string;
  created_at: string;
}

export interface DbMarketQuote {
  id: string;
  symbol: string;
  provider_symbol: string;
  display_name: string;
  category: 'forex' | 'index' | 'crypto' | 'commodity';
  price: number;
  open: number | null;
  high: number | null;
  low: number | null;
  previous_close: number | null;
  change: number | null;
  change_percent: number | null;
  direction: 'up' | 'down' | 'flat';
  volume: number | null;
  market_status: 'open' | 'closed' | 'pre-market' | 'after-hours' | 'unknown';
  timestamp: string;
  source: string;
  created_at: string;
}

export interface DbWeatherSnapshot {
  id: string;
  location: string;
  captured_at: string;
  condition: WeatherCondition;
  current_temp_c: number;
  high_temp_c: number;
  low_temp_c: number;
  humidity_percent: number;
  precipitation_chance_percent: number;
  summary: string;
  source_provider: string;
  created_at: string;
}

export interface DbEdition {
  id: string;
  user_id: string | null; // references auth.users(id)
  type: EditionType;
  title: string;
  subtitle: string;
  sections: NewspaperSectionType[];
  format: EditionFormat;
  theme: EditionTheme;
  weather_config: WeatherSectionConfig;
  status: EditionStatus;
  structured_data: StructuredNewspaperData | null;
  created_at: string;
  updated_at: string;
}

export interface DbEditionArticle {
  id: string;
  edition_id: string;
  article_id: string;
  section_type: NewspaperSectionType;
  order_index: number;
  created_at: string;
}

export interface DbTelegramDelivery {
  id: string;
  edition_id: string;
  user_id: string | null;
  telegram_user_id: number;
  chat_id: number;
  message_id: number | null;
  format_sent: EditionFormat;
  status: 'sent' | 'failed' | 'queued';
  sent_at: string;
  error_message: string | null;
}

export interface DbStoryCluster {
  id: string;
  topic: string;
  primary_article_id: string | null;
  article_ids: string[];
  first_reported_at: string;
  significance: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
}

export interface DbEditorialStory {
  id: string;
  cluster_id: string | null;
  primary_article_id: string;
  headline: string;
  summary: string;
  why_it_matters: string;
  primary_section: NewspaperSectionType;
  secondary_sections: NewspaperSectionType[];
  importance: 'low' | 'medium' | 'high';
  source_articles: any[];
  image_data: any | null;
  entities: any[];
  metrics: any[];
  content_hash: string;
  model: string;
  prompt_version: string;
  generated_at: string;
  created_at: string;
}

export interface DbEditorialRun {
  id: string;
  started_at: string;
  completed_at: string | null;
  articles_processed: number;
  stories_created: number;
  failed: number;
  model: string;
  prompt_version: string;
  status: 'in_progress' | 'completed' | 'failed';
  error_message: string | null;
  created_at: string;
}
