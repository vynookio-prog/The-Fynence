/**
 * Central configuration for the News & RSS Ingestion Engine.
 * Supports environment variable overrides while providing robust defaults.
 */

export interface NewsEngineConfig {
  /** Maximum number of articles parsed per individual RSS feed */
  itemsPerFeed: number;
  /** Global maximum budget of raw articles ingested per run */
  maxRawArticles: number;
  /** Maximum freshness window in hours for candidate consideration */
  freshnessHours: number;
  /** Maximum number of articles a single source/publisher may contribute to candidate pool */
  maxArticlesPerSource: number;
  /** Target number of stories for a Daily Edition */
  dailyNewsTarget: number;
  /** Target number of stories for a Finance Edition */
  financeTarget: number;
  /** Target number of stories for an Economy Edition */
  economyTarget: number;
  /** Target number of stories for a Markets Edition */
  marketsTarget: number;
  /** Request timeout per feed fetch in milliseconds */
  feedTimeoutMs: number;
  /** Max retries for transient HTTP errors */
  feedMaxRetries: number;
  /** In-memory feed cache TTL in milliseconds */
  cacheTtlMs: number;
  /** Max concurrent HTTP feed requests */
  maxConcurrentFetches: number;
}

function parseEnvInt(key: string, defaultValue: number): number {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    const parsed = parseInt(process.env[key]!, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return defaultValue;
}

export function getNewsEngineConfig(): NewsEngineConfig {
  return {
    itemsPerFeed: parseEnvInt('RSS_ITEMS_PER_FEED', 15),
    maxRawArticles: parseEnvInt('RSS_MAX_RAW_ARTICLES', 200),
    freshnessHours: parseEnvInt('RSS_FRESHNESS_HOURS', 36),
    maxArticlesPerSource: parseEnvInt('MAX_ARTICLES_PER_SOURCE', 8),
    dailyNewsTarget: parseEnvInt('DAILY_NEWS_TARGET', 15),
    financeTarget: parseEnvInt('FINANCE_TARGET', 10),
    economyTarget: parseEnvInt('ECONOMY_TARGET', 8),
    marketsTarget: parseEnvInt('MARKETS_TARGET', 10),
    feedTimeoutMs: parseEnvInt('RSS_FEED_TIMEOUT_MS', 8000),
    feedMaxRetries: parseEnvInt('RSS_FEED_MAX_RETRIES', 1),
    cacheTtlMs: parseEnvInt('RSS_CACHE_TTL_MS', 15 * 60 * 1000), // 15 minutes
    maxConcurrentFetches: parseEnvInt('RSS_MAX_CONCURRENT_FETCHES', 6),
  };
}

export const defaultNewsEngineConfig = getNewsEngineConfig();
