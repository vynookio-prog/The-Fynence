import 'server-only';

export interface RawNewsArticle {
  title: string;
  description: string;
  content?: string;
  url: string;
  urlToImage?: string;
  sourceName: string;
  publishedAt: string;
}

export interface NewsFetchResult {
  articles: RawNewsArticle[];
  source: 'live' | 'fallback';
  error?: string;
}

// Macroeconomic and financial keywords
const MACRO_KEYWORDS_QUERY =
  '("inflation" OR "interest rates" OR "Federal Reserve" OR "central bank" OR "GDP" OR "treasury yields" OR "recession" OR "market volatility") AND (economy OR market OR stocks OR forex OR dollar)';

// High-fidelity curated fallback macroeconomic articles
const FALLBACK_MACRO_ARTICLES: RawNewsArticle[] = [
  {
    title: 'Federal Reserve Holds Rates Steady, Highlights Progress on Core PCE Inflation',
    description:
      'Federal Open Market Committee policymakers maintained the benchmark policy rate range, emphasizing balanced risks to both inflation and employment goals while monitoring liquidity conditions.',
    content:
      'Federal Reserve officials reiterated a data-dependent stance following their recent policy meeting. With core PCE inflation trending toward the 2% target and labor markets moderating from peak tightness, the committee noted that future adjustments will depend on incoming prints.',
    url: 'https://www.reuters.com/markets/us/fed-rates-steady-inflation-monitoring',
    urlToImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80',
    sourceName: 'Reuters Financial',
    publishedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(), // 35m ago
  },
  {
    title: 'US 10-Year Treasury Yield Eases as Bond Markets Reprice Rate Cut Trajectory',
    description:
      'Benchmark 10-year Treasury yields retreated towards 4.15% as bond investors weighed softer manufacturing sentiment against resilient consumer balance sheets.',
    content:
      'Sovereign debt markets saw heightened positioning as the yield curve flattened. Traders in interest rate swaps trimmed expectations for aggressive monetary easing, opting for a higher-for-longer regime narrative.',
    url: 'https://www.bloomberg.com/news/articles/us-treasury-yields-bond-market-reprice',
    urlToImage: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80',
    sourceName: 'Bloomberg Markets',
    publishedAt: new Date(Date.now() - 1000 * 60 * 85).toISOString(), // 1h 25m ago
  },
  {
    title: 'Gold Tests Key Resistance Near $2,650 as Geopolitical Hedging Offsets Strong Dollar',
    description:
      'Spot bullion prices showed persistent institutional bids, sustained by central bank reserve accumulation and heightened macroeconomic volatility.',
    content:
      'Spot Gold (XAU/USD) consolidated above major moving averages. Market participants cited steady central bank bullion purchases and structural demand for safe-haven liquid assets despite real interest rate headwinds.',
    url: 'https://www.ft.com/content/gold-tests-resistance-central-bank-hedging',
    urlToImage: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=800&q=80',
    sourceName: 'Financial Times',
    publishedAt: new Date(Date.now() - 1000 * 60 * 140).toISOString(), // 2h 20m ago
  },
  {
    title: 'European Central Bank Signals Measured Approach Amid Divergent Eurozone Growth',
    description:
      'ECB officials expressed caution regarding wage pressures and services inflation while manufacturing sectors across Germany and France show modest contractions.',
    content:
      'The European Central Bank stressed policy autonomy, noting that Eurozone disinflation remains uneven across southern and northern economies. The EUR/USD exchange rate fluctuated near recent ranges.',
    url: 'https://www.wsj.com/economy/central-banks/ecb-cautious-eurozone-growth-divergence',
    urlToImage: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80',
    sourceName: 'Wall Street Journal',
    publishedAt: new Date(Date.now() - 1000 * 60 * 210).toISOString(), // 3h 30m ago
  },
  {
    title: 'Global Manufacturing PMI Flashes Mixed Signals as Supply Chain Pressures Subside',
    description:
      'Factory output indices stabilized across North America and Emerging Asia, but forward export orders remain subdued amidst cautious enterprise spending.',
    content:
      'Purchasing managers indexes reflected mild expansion in high-tech manufacturing, while energy and heavy industrial sectors faced drag from high financing costs.',
    url: 'https://www.cnbc.com/2026/global-pmi-factory-output-supply-chains',
    urlToImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
    sourceName: 'CNBC International',
    publishedAt: new Date(Date.now() - 1000 * 60 * 310).toISOString(), // 5h ago
  },
  {
    title: 'Crude Oil Recovers Towards $76 as Middle East Supply Risk Balances Demand Headwinds',
    description:
      'Brent and WTI crude contracts found technical support as OPEC+ compliance remained steady and strategic reserve replenishments offered a price floor.',
    content:
      'Energy markets balanced global growth revisions against regional transport risks. Refined product inventories showed seasonal draws in distillate fuels, cushioning price downside.',
    url: 'https://www.reuters.com/business/energy/crude-oil-rebound-opec-supply-risk',
    urlToImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    sourceName: 'Reuters Commodities',
    publishedAt: new Date(Date.now() - 1000 * 60 * 420).toISOString(), // 7h ago
  },
  {
    title: 'Bank of Japan Weighs Additional Rate Hikes as Wage-Price Virtuous Cycle Takes Root',
    description:
      'BOJ leadership reiterated that financial conditions remain supportive, though persistent service wage growth may warrant steady normalization of benchmark rates.',
    content:
      'The Yen consolidated against the greenback as traders priced in a higher probability of another quarter-point hike before year-end. Sovereign Japanese bond yields inched higher.',
    url: 'https://www.nikkei.com/economy/boj-rate-hike-wages',
    sourceName: 'Nikkei Asia',
    publishedAt: new Date(Date.now() - 1000 * 60 * 500).toISOString(),
  },
  {
    title: 'US Retail Sales Hold Steady Amid Resilient Consumer Spending on Core Services',
    description:
      'Advance retail figures surpassed consensus expectations, demonstrating consumer durability despite elevated revolving credit rates.',
    content:
      'Consumer discretionary spending proved sturdier than forecasted, reducing market anxiety over near-term recessionary headwinds.',
    url: 'https://www.wsj.com/economy/consumers/us-retail-sales-resilient',
    sourceName: 'Wall Street Journal',
    publishedAt: new Date(Date.now() - 1000 * 60 * 620).toISOString(),
  },
  {
    title: 'Dollar Index Consolidates as Currency Traders Await Fresh Macro Guidance',
    description:
      'The DXY hovered around 103.80 as foreign exchange desks balanced transatlantic interest rate differentials against risk-on equity momentum.',
    content:
      'Currencies traded in tight ranges with implied volatility indices reflecting a summer lull across major G10 currency crosses.',
    url: 'https://www.bloomberg.com/news/articles/dollar-index-consolidation-fx-traders',
    sourceName: 'Bloomberg FX',
    publishedAt: new Date(Date.now() - 1000 * 60 * 750).toISOString(),
  },
];

/**
 * Fetch latest macroeconomic & financial news from NewsAPI with automatic fallback.
 */
export async function fetchMacroEconomicNews(): Promise<NewsFetchResult> {
  const apiKey = process.env.NEWS_API_KEY;

  if (!apiKey || apiKey === 'your_newsapi_key_here') {
    return {
      articles: FALLBACK_MACRO_ARTICLES,
      source: 'fallback',
      error: 'NEWS_API_KEY is not configured; using high-fidelity curated macro feed.',
    };
  }

  try {
    const params = new URLSearchParams({
      q: MACRO_KEYWORDS_QUERY,
      language: 'en',
      sortBy: 'publishedAt',
      pageSize: '15',
    });

    const url = `https://newsapi.org/v2/everything?${params.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Api-Key': apiKey,
        'User-Agent': 'FynencePulse/1.0 (Institutional Finance Intelligence)',
        Accept: 'application/json',
      },
      next: { revalidate: 1800 }, // 30 min cache
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const msg = errorBody?.message || `NewsAPI error status ${response.status}`;
      console.warn(`[NewsAPI] Request failed (${response.status}): ${msg}. Reverting to fallback.`);
      return {
        articles: FALLBACK_MACRO_ARTICLES,
        source: 'fallback',
        error: msg,
      };
    }

    const data = await response.json();
    const rawArticles: any[] = data.articles || [];

    // Filter and normalize
    const validArticles: RawNewsArticle[] = rawArticles
      .filter((a) => a.title && a.title !== '[Removed]' && (a.description || a.content))
      .slice(0, 13)
      .map((a) => ({
        title: a.title.replace(/\s*-\s*[^-]+$/, '').trim(), // Remove trailing source if repeated in title
        description: a.description || a.content || '',
        content: a.content || undefined,
        url: a.url || '#',
        urlToImage: a.urlToImage || undefined,
        sourceName: a.source?.name || 'Financial Wire',
        publishedAt: a.publishedAt || new Date().toISOString(),
      }));

    if (validArticles.length === 0) {
      return {
        articles: FALLBACK_MACRO_ARTICLES,
        source: 'fallback',
        error: 'NewsAPI returned 0 valid articles. Using curated fallback.',
      };
    }

    return {
      articles: validArticles,
      source: 'live',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to reach NewsAPI';
    console.error('[NewsAPI] Network error:', message);
    return {
      articles: FALLBACK_MACRO_ARTICLES,
      source: 'fallback',
      error: message,
    };
  }
}
