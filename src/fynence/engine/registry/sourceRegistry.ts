import type { ArticleCategory, ArticleRegion } from '../../types/article';
import type { NewsSourceConfig } from './types';

export const DEFAULT_CONFIGURED_SOURCES: NewsSourceConfig[] = [
  // 1. Markets & Macro Finance
  {
    id: 'marketwatch_top',
    name: 'MarketWatch Top Stories',
    type: 'rss',
    url: 'http://feeds.marketwatch.com/marketwatch/topstories/',
    categories: ['markets', 'finance', 'business'],
    regions: ['global', 'us'],
    enabled: true,
    rateLimitMs: 1500,
    timeoutMs: 12000,
    maxItemsPerFetch: 25,
    description: 'Premier financial journal dispatches, market indices, and economic analyses.',
  },
  {
    id: 'cnbc_markets',
    name: 'CNBC Markets',
    type: 'rss',
    url: 'https://search.cnbc.com/rs/search/view.html?partnerId=2000&keywords=markets&sort=date',
    categories: ['markets', 'finance'],
    regions: ['global', 'us'],
    enabled: true,
    rateLimitMs: 1500,
    timeoutMs: 12000,
    maxItemsPerFetch: 25,
    description: 'Real-time equity index and institutional market dispatches.',
  },
  {
    id: 'cnbc_economy',
    name: 'CNBC Economy',
    type: 'rss',
    url: 'https://search.cnbc.com/rs/search/view.html?partnerId=2000&keywords=economy&sort=date',
    categories: ['economy', 'finance'],
    regions: ['global', 'us'],
    enabled: true,
    rateLimitMs: 1500,
    timeoutMs: 12000,
    maxItemsPerFetch: 25,
    description: 'Central bank rate decisions, macroeconomic inflation, and labor indicators.',
  },
  {
    id: 'yahoo_finance',
    name: 'Yahoo Finance Top News',
    type: 'rss',
    url: 'https://finance.yahoo.com/news/rssindex',
    categories: ['finance', 'markets', 'business'],
    regions: ['global', 'us'],
    enabled: true,
    rateLimitMs: 2000,
    timeoutMs: 12000,
    maxItemsPerFetch: 30,
    description: 'Comprehensive financial journal coverage across Wall Street and corporate earnings.',
  },

  // 2. Global & World News
  {
    id: 'bbc_world',
    name: 'BBC World News',
    type: 'rss',
    url: 'http://feeds.bbci.co.uk/news/world/rss.xml',
    categories: ['world'],
    regions: ['global'],
    enabled: true,
    rateLimitMs: 2000,
    timeoutMs: 10000,
    maxItemsPerFetch: 25,
    description: 'International geopolitical events and sovereign diplomatic coverage.',
  },

  // 3. National / Indonesia News
  {
    id: 'antara_ekonomi',
    name: 'Antara News Ekonomi & Keuangan',
    type: 'rss',
    url: 'https://www.antaranews.com/rss/ekonomi.xml',
    categories: ['national', 'economy', 'finance'],
    regions: ['indonesia', 'asia_pacific'],
    enabled: true,
    rateLimitMs: 2000,
    timeoutMs: 12000,
    maxItemsPerFetch: 25,
    description: 'National macroeconomic, banking, and government fiscal policy in Indonesia.',
  },
  {
    id: 'cnbc_indonesia_market',
    name: 'CNBC Indonesia Market',
    type: 'rss',
    url: 'https://www.cnbcindonesia.com/market/rss',
    categories: ['national', 'markets', 'finance'],
    regions: ['indonesia', 'asia_pacific'],
    enabled: true,
    rateLimitMs: 2000,
    timeoutMs: 12000,
    maxItemsPerFetch: 25,
    description: 'Indonesia Stock Exchange (IDX) and domestic corporate financial news.',
  },

  // 4. Technology
  {
    id: 'ars_technica',
    name: 'Ars Technica',
    type: 'rss',
    url: 'https://feeds.arstechnica.com/arstechnica/index',
    categories: ['technology', 'business'],
    regions: ['global', 'us'],
    enabled: true,
    rateLimitMs: 1500,
    timeoutMs: 10000,
    maxItemsPerFetch: 25,
    description: 'Semiconductor architecture, enterprise software, AI, and cybersecurity.',
  },

  // 5. Crypto
  {
    id: 'coindesk',
    name: 'CoinDesk',
    type: 'rss',
    url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
    categories: ['crypto', 'finance'],
    regions: ['global'],
    enabled: true,
    rateLimitMs: 2000,
    timeoutMs: 12000,
    maxItemsPerFetch: 20,
    description: 'Digital asset market developments, protocol governance, and crypto regulation.',
  },

  // 6. NewsAPI (Structured API Source)
  {
    id: 'news_api_business',
    name: 'NewsAPI Business & Macro',
    type: 'api',
    url: 'https://newsapi.org/v2/top-headlines?category=business&language=en',
    categories: ['business', 'finance', 'economy'],
    regions: ['global', 'us'],
    enabled: false, // Activated dynamically when NEWS_API_KEY is configured
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

  public getByCategory(category: ArticleCategory): NewsSourceConfig[] {
    return this.getEnabled().filter(s => s.categories.includes(category));
  }

  public getByRegion(region: ArticleRegion): NewsSourceConfig[] {
    return this.getEnabled().filter(s => s.regions.includes(region));
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
