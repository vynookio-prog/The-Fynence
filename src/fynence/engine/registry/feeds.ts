import type { ArticleCategory, ArticleRegion } from '../../types/article';
import type { NewsSourceConfig, NewsSourceType } from './types';

export interface RssFeedConfig {
  id: string;
  name: string;
  url: string;
  category: ArticleCategory;
  language: string;
  region: ArticleRegion;
  priority: number; // 1-100 (higher = more reputable / primary wire)
  enabled: boolean;
  type?: NewsSourceType;
  description?: string;
  rateLimitMs?: number;
  timeoutMs?: number;
}

export const CONFIGURED_RSS_FEEDS: RssFeedConfig[] = [
  // ==========================================
  // 1. Markets & Macro Finance
  // ==========================================
  {
    id: 'marketwatch_top',
    name: 'MarketWatch Top Stories',
    url: 'http://feeds.marketwatch.com/marketwatch/topstories/',
    category: 'markets',
    language: 'en',
    region: 'global',
    priority: 88,
    enabled: true,
    description: 'Premier financial journal dispatches, market indices, and economic analyses.',
  },
  {
    id: 'marketwatch_bulletins',
    name: 'MarketWatch Real-time Bulletins',
    url: 'http://feeds.marketwatch.com/marketwatch/bulletins',
    category: 'markets',
    language: 'en',
    region: 'us',
    priority: 85,
    enabled: true,
    description: 'Fast-breaking corporate and equity market alerts.',
  },
  {
    id: 'cnbc_markets',
    name: 'CNBC Markets',
    url: 'https://search.cnbc.com/rs/search/view.html?partnerId=2000&keywords=markets&sort=date',
    category: 'markets',
    language: 'en',
    region: 'global',
    priority: 86,
    enabled: true,
    description: 'Real-time equity index and institutional market dispatches.',
  },
  {
    id: 'cnbc_economy',
    name: 'CNBC Economy',
    url: 'https://search.cnbc.com/rs/search/view.html?partnerId=2000&keywords=economy&sort=date',
    category: 'economy',
    language: 'en',
    region: 'global',
    priority: 88,
    enabled: true,
    description: 'Central bank rate decisions, macroeconomic inflation, and labor indicators.',
  },
  {
    id: 'cnbc_finance',
    name: 'CNBC Finance & Banking',
    url: 'https://search.cnbc.com/rs/search/view.html?partnerId=2000&keywords=finance&sort=date',
    category: 'finance',
    language: 'en',
    region: 'global',
    priority: 86,
    enabled: true,
    description: 'Wall Street investment banking, lending, and sovereign yields.',
  },
  {
    id: 'yahoo_finance',
    name: 'Yahoo Finance Top News',
    url: 'https://finance.yahoo.com/news/rssindex',
    category: 'finance',
    language: 'en',
    region: 'global',
    priority: 82,
    enabled: true,
    description: 'Comprehensive financial journal coverage across Wall Street and corporate earnings.',
  },
  {
    id: 'investing_news',
    name: 'Investing.com Financial News',
    url: 'https://www.investing.com/rss/news.rss',
    category: 'markets',
    language: 'en',
    region: 'global',
    priority: 80,
    enabled: true,
    description: 'Broad cross-asset market intelligence and commodity news.',
  },

  // ==========================================
  // 2. Forex & Currency Markets
  // ==========================================
  {
    id: 'forexlive',
    name: 'ForexLive Macro & FX',
    url: 'https://www.forexlive.com/feed/news',
    category: 'forex',
    language: 'en',
    region: 'global',
    priority: 85,
    enabled: true,
    description: 'Real-time foreign exchange pricing, central bank commentary, and currency cross pairs.',
  },
  {
    id: 'fxstreet_news',
    name: 'FXStreet Currency News',
    url: 'https://www.fxstreet.com/rss/news',
    category: 'forex',
    language: 'en',
    region: 'global',
    priority: 82,
    enabled: true,
    description: 'Technical and fundamental currency intelligence covering G10 and emerging FX.',
  },

  // ==========================================
  // 3. Crypto & Digital Assets
  // ==========================================
  {
    id: 'coindesk',
    name: 'CoinDesk',
    url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
    category: 'crypto',
    language: 'en',
    region: 'global',
    priority: 85,
    enabled: true,
    description: 'Digital asset market developments, protocol governance, and crypto regulation.',
  },
  {
    id: 'cointelegraph',
    name: 'Cointelegraph',
    url: 'https://cointelegraph.com/rss',
    category: 'crypto',
    language: 'en',
    region: 'global',
    priority: 82,
    enabled: true,
    description: 'Blockchain innovation, institutional crypto adoption, and decentralized finance.',
  },
  {
    id: 'decrypt',
    name: 'Decrypt Media',
    url: 'https://decrypt.co/feed',
    category: 'crypto',
    language: 'en',
    region: 'global',
    priority: 80,
    enabled: true,
    description: 'Cryptocurrency markets and web3 institutional developments.',
  },

  // ==========================================
  // 4. National / Indonesia News
  // ==========================================
  {
    id: 'antara_ekonomi',
    name: 'Antara News Ekonomi & Keuangan',
    url: 'https://www.antaranews.com/rss/ekonomi.xml',
    category: 'economy',
    language: 'id',
    region: 'indonesia',
    priority: 90,
    enabled: true,
    description: 'National macroeconomic, banking, and government fiscal policy in Indonesia.',
  },
  {
    id: 'antara_terkini',
    name: 'Antara News Terkini',
    url: 'https://www.antaranews.com/rss/terkini.xml',
    category: 'national',
    language: 'id',
    region: 'indonesia',
    priority: 88,
    enabled: true,
    description: 'Official national news dispatch from the Indonesian National News Agency.',
  },
  {
    id: 'cnbc_indonesia_market',
    name: 'CNBC Indonesia Market',
    url: 'https://www.cnbcindonesia.com/market/rss',
    category: 'markets',
    language: 'id',
    region: 'indonesia',
    priority: 87,
    enabled: true,
    description: 'Indonesia Stock Exchange (IDX) equities, bonds, and domestic corporate actions.',
  },
  {
    id: 'cnbc_indonesia_news',
    name: 'CNBC Indonesia News',
    url: 'https://www.cnbcindonesia.com/news/rss',
    category: 'national',
    language: 'id',
    region: 'indonesia',
    priority: 85,
    enabled: true,
    description: 'Indonesian macro policy, infrastructure developments, and national affairs.',
  },

  // ==========================================
  // 5. Global & World News
  // ==========================================
  {
    id: 'bbc_world',
    name: 'BBC World News',
    url: 'http://feeds.bbci.co.uk/news/world/rss.xml',
    category: 'world',
    language: 'en',
    region: 'global',
    priority: 92,
    enabled: true,
    description: 'International geopolitical events and sovereign diplomatic coverage.',
  },
  {
    id: 'aljazeera_world',
    name: 'Al Jazeera English',
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    category: 'world',
    language: 'en',
    region: 'global',
    priority: 88,
    enabled: true,
    description: 'Global geopolitical dispatches and international diplomacy.',
  },
  {
    id: 'france24_world',
    name: 'France 24 World',
    url: 'https://www.france24.com/en/rss',
    category: 'world',
    language: 'en',
    region: 'europe',
    priority: 85,
    enabled: true,
    description: 'European and international geopolitical reporting.',
  },

  // ==========================================
  // 6. Business & Corporate
  // ==========================================
  {
    id: 'fortune_business',
    name: 'Fortune Business',
    url: 'https://fortune.com/feed/',
    category: 'business',
    language: 'en',
    region: 'global',
    priority: 86,
    enabled: true,
    description: 'Corporate leadership, executive strategy, and enterprise developments.',
  },
  {
    id: 'economist_business',
    name: 'The Economist Business',
    url: 'https://www.economist.com/business/rss.xml',
    category: 'business',
    language: 'en',
    region: 'global',
    priority: 90,
    enabled: true,
    description: 'In-depth global business insights, commerce, and corporate strategy.',
  },

  // ==========================================
  // 7. Technology & Innovation
  // ==========================================
  {
    id: 'ars_technica',
    name: 'Ars Technica',
    url: 'https://feeds.arstechnica.com/arstechnica/index',
    category: 'technology',
    language: 'en',
    region: 'global',
    priority: 86,
    enabled: true,
    description: 'Semiconductor architecture, enterprise software, AI, and cybersecurity.',
  },
  {
    id: 'techcrunch',
    name: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    category: 'technology',
    language: 'en',
    region: 'global',
    priority: 85,
    enabled: true,
    description: 'Venture technology financing, startups, enterprise platforms, and AI hardware.',
  },
  {
    id: 'the_verge',
    name: 'The Verge',
    url: 'https://www.theverge.com/rss/index.xml',
    category: 'technology',
    language: 'en',
    region: 'global',
    priority: 84,
    enabled: true,
    description: 'Consumer technology, computing infrastructure, and digital policy.',
  },
];

/**
 * Converts an RssFeedConfig to the legacy NewsSourceConfig interface for seamless compatibility.
 */
export function rssFeedToSourceConfig(feed: RssFeedConfig): NewsSourceConfig {
  return {
    id: feed.id,
    name: feed.name,
    type: feed.type || 'rss',
    url: feed.url,
    category: feed.category,
    categories: [feed.category],
    region: feed.region,
    regions: [feed.region],
    language: feed.language,
    priority: feed.priority,
    reliabilityScore: feed.priority / 100,
    enabled: feed.enabled,
    rateLimitMs: feed.rateLimitMs || 1000,
    timeoutMs: feed.timeoutMs || 8000,
    maxItemsPerFetch: 25,
    description: feed.description,
  };
}
