import type { ArticleCategory, ArticleRegion } from '../../types/article';
import type { NewsSourceConfig } from './types';
import { CONFIGURED_RSS_FEEDS, rssFeedToSourceConfig } from './feeds';

export const DEFAULT_CONFIGURED_SOURCES: NewsSourceConfig[] = [
  ...CONFIGURED_RSS_FEEDS.map(rssFeedToSourceConfig),
  // Structured NewsAPI Source (Activated dynamically when NEWS_API_KEY is configured)
  {
    id: 'news_api_business',
    name: 'NewsAPI Business & Macro',
    type: 'api',
    url: 'https://newsapi.org/v2/top-headlines?category=business&language=en',
    category: 'business',
    categories: ['business', 'finance', 'economy'],
    region: 'global',
    regions: ['global', 'us'],
    language: 'en',
    priority: 85,
    reliabilityScore: 0.85,
    enabled: false,
    requiresApiKey: true,
    apiKeyEnvVar: 'NEWS_API_KEY',
    rateLimitMs: 3000,
    timeoutMs: 10000,
    maxItemsPerFetch: 30,
    description: 'Aggregated commercial and financial headlines from certified global publishers.',
  },
];

export class NewsSourceRegistry {
  private sources: Map<string, NewsSourceConfig> = new Map();

  constructor(initialSources: NewsSourceConfig[] = DEFAULT_CONFIGURED_SOURCES) {
    for (const source of initialSources) {
      this.register(source);
    }
  }

  public register(source: NewsSourceConfig): void {
    this.sources.set(source.id, { ...source });
  }

  public get(id: string): NewsSourceConfig | undefined {
    const source = this.sources.get(id);
    return source ? { ...source } : undefined;
  }

  public getAll(): NewsSourceConfig[] {
    return Array.from(this.sources.values()).map(s => ({ ...s }));
  }

  public getEnabled(): NewsSourceConfig[] {
    return this.getAll().filter(s => s.enabled);
  }

  public registerFeed(feed: import('./feeds').RssFeedConfig): void {
    this.register(rssFeedToSourceConfig(feed));
  }

  public unregister(id: string): boolean {
    return this.sources.delete(id);
  }

  public getByLanguage(language: string): NewsSourceConfig[] {
    return this.getEnabled().filter(s => s.language === language);
  }

  public getByPriority(minPriority: number = 80): NewsSourceConfig[] {
    return this.getEnabled().filter(s => (s.priority || 0) >= minPriority);
  }

  public getByCategory(category: ArticleCategory): NewsSourceConfig[] {
    return this.getEnabled().filter(s => s.categories.includes(category) || s.category === category);
  }

  public getByRegion(region: ArticleRegion): NewsSourceConfig[] {
    return this.getEnabled().filter(s => s.regions.includes(region) || s.region === region);
  }

  public enableSource(id: string): boolean {
    const s = this.sources.get(id);
    if (!s) return false;
    s.enabled = true;
    return true;
  }

  public disableSource(id: string): boolean {
    const s = this.sources.get(id);
    if (!s) return false;
    s.enabled = false;
    return true;
  }

  public updateFetchMetadata(
    id: string,
    metadata: { etag?: string; lastModified?: string; lastFetchedAt?: string }
  ): void {
    const s = this.sources.get(id);
    if (!s) return;
    if (metadata.etag !== undefined) s.etag = metadata.etag;
    if (metadata.lastModified !== undefined) s.lastModified = metadata.lastModified;
    if (metadata.lastFetchedAt !== undefined) s.lastFetchedAt = metadata.lastFetchedAt;
  }
}

export const sourceRegistry = new NewsSourceRegistry();
