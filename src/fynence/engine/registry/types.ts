import type { ArticleCategory, ArticleRegion } from '../../types/article';

export type NewsSourceType = 'rss' | 'atom' | 'api' | 'json_feed';

export interface NewsSourceConfig {
  id: string;
  name: string;
  type: NewsSourceType;
  url: string;
  category?: ArticleCategory;
  categories: ArticleCategory[];
  region?: ArticleRegion;
  regions: ArticleRegion[];
  language?: string;
  priority?: number;
  reliabilityScore?: number;
  enabled: boolean;
  rateLimitMs?: number;
  timeoutMs?: number;
  maxItemsPerFetch?: number;
  customHeaders?: Record<string, string>;
  description?: string;
  etag?: string;
  lastModified?: string;
  lastFetchedAt?: string;
  requiresApiKey?: boolean;
  apiKeyEnvVar?: string;
}

export interface NewsSourceRegistryState {
  sources: Map<string, NewsSourceConfig>;
}
