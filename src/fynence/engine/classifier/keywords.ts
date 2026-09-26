import type { ArticleCategory, ArticleRegion } from '../../types/article';

export const CATEGORY_KEYWORDS: Record<ArticleCategory, string[]> = {
  economy: [
    'cpi', 'inflation', 'deflation', 'interest rate', 'federal reserve', 'fed',
    'fomc', 'gdp', 'employment', 'unemployment', 'jobless claims', 'nonfarm', 'nfp',
    'central bank', 'monetary policy', 'pce', 'recession', 'macroeconomic', 'stagflation',
    'powell', 'lagarde', 'rate cut', 'rate hike', 'tightening', 'liquidity',
  ],
  markets: [
    'stocks', 'stock market', 'equities', 's&p 500', 's&p', 'nasdaq', 'dow jones', 'djia',
    'wall street', 'rally', 'sell-off', 'plunge', 'bull market', 'bear market', 'bonds',
    'treasury yield', 'benchmark', 'gold', 'crude oil', 'brent', 'wti', 'commodities',
    'trading session', 'volatility', 'vix',
  ],
  finance: [
    'banking', 'bank', 'jpmorgan', 'goldman sachs', 'morgan stanley', 'sovereign debt',
    'yield curve', 'credit rating', 'liquidity', 'bond market', 'private equity',
    'hedge fund', 'asset management', 'blackrock', 'vanguard', 'commercial bank',
    'lending', 'mortgage rate', 'debt ceiling',
  ],
  forex: [
    'forex', 'fx', 'currency', 'dollar index', 'dxy', 'eurusd', 'gbpusd', 'usdjpy',
    'exchange rate', 'devaluation', 'foreign exchange', 'yen', 'euro', 'sterling',
    'rupiah', 'idr', 'currency intervention', 'carry trade',
  ],
  crypto: [
    'bitcoin', 'btc', 'ethereum', 'eth', 'cryptocurrency', 'crypto', 'blockchain',
    'token', 'stablecoin', 'tether', 'usdt', 'binance', 'coinbase', 'sec crypto',
    'halving', 'spot etf', 'altcoin', 'defi', 'solana',
  ],
  technology: [
    'ai', 'artificial intelligence', 'semiconductor', 'chipmaker', 'nvidia', 'openai',
    'microsoft', 'apple', 'google', 'alphabet', 'meta', 'tsmc', 'asml', 'cloud computing',
    'cybersecurity', 'enterprise software', 'deep learning', 'llm', 'data center',
  ],
  business: [
    'earnings', 'revenue', 'quarterly profit', 'q1', 'q2', 'q3', 'q4', 'ceo', 'cfo',
    'merger', 'acquisition', 'm&a', 'ipo', 'shareholders', 'dividend', 'antitrust',
    'layoffs', 'retail sales', 'supply chain', 'corporate restructuring',
  ],
  national: [
    'indonesia', 'jakarta', 'rupiah', 'ihsg', 'idx', 'bank indonesia', 'bi', 'kemenkeu',
    'sri mulyani', 'jokowi', 'prabowo', 'ikn', 'bumn', 'ojk', 'pertamina', 'pln',
    'surabaya', 'bandung', 'semarang', 'yogyakarta', 'magelang', 'jawa tengah',
  ],
  world: [
    'geopolitical', 'united nations', 'un', 'summit', 'diplomacy', 'foreign policy',
    'middle east', 'ukraine', 'russia', 'china', 'taiwan', 'nato', 'european union',
    'sanctions', 'treaty', 'g7', 'g20', 'international relations', 'cross-border',
  ],
};

export const REGION_KEYWORDS: Record<ArticleRegion, string[]> = {
  indonesia: [
    'indonesia', 'jakarta', 'rupiah', 'ihsg', 'idx', 'bank indonesia', 'jawa',
    'magelang', 'sumatera', 'bali', 'kalimantan', 'sulawesi',
  ],
  asia_pacific: [
    'china', 'beijing', 'shanghai', 'japan', 'tokyo', 'boj', 'pboc', 'korea', 'seoul',
    'singapore', 'hong kong', 'india', 'australia', 'asean',
  ],
  us: [
    'united states', 'u.s.', 'us', 'washington', 'wall street', 'new york', 'federal reserve',
    'white house', 'congress', 'pentagon',
  ],
  europe: [
    'europe', 'european union', 'eu', 'germany', 'berlin', 'france', 'paris',
    'uk', 'britain', 'london', 'ecb', 'bank of england', 'brussels',
  ],
  global: [
    'global', 'worldwide', 'international', 'cross-border', 'multinational',
  ],
};

export const HIGH_IMPORTANCE_KEYWORDS = [
  'breaking', 'urgent', 'war', 'invasion', 'market crash', 'emergency rate',
  'emergency meeting', 'rate cut', 'rate cuts', 'cuts interest rate', 'cuts interest rates',
  'cuts interest', 'cuts rate', 'cuts rates', 'interest rate cut', 'interest rate hike',
  'rate hike', 'rate hikes', 'hikes rate', 'hikes rates', 'hikes interest',
  'fomc statement', 'cpi surge', 'crisis', 'default', 'bankruptcy', 'sanctions',
  'collapse', 'black swan',
];

export const MEDIUM_IMPORTANCE_KEYWORDS = [
  'quarterly earnings', 'beats expectations', 'misses expectations', 'policy shift',
  'regulatory probe', 'partnership', 'forecast', 'outlook', 'jobless claims',
];
