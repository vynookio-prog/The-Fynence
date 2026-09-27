import type { NewspaperStory, MarketTickerItem, WeatherBlock, EconomicCalendarItem } from '../types/document';

export const MOCK_STORIES: NewspaperStory[] = [
  {
    id: 'story-lead-01',
    headline: 'Federal Reserve Holds Benchmark Rates Steady as Liquidity Adapts to Policy Shifts',
    kicker: 'MACRO DESK · WASHINGTON',
    summary:
      'The Federal Open Market Committee maintained benchmark overnight borrowing costs within the prevailing target range during its scheduled conclave, citing balanced risks between inflation persistence and labor market stabilization. Capital market participants observed muted reactions across benchmark sovereign yields, as institutional desks digested the post-meeting policy statement with restrained volatility across equity indices and foreign exchange pairs.',
    whyItMatters:
      'Prolonged rate stability preserves corporate borrowing cost visibility while anchoring benchmark yield spreads, dampening speculative extremes in cross-border capital flows.',
    keyPoints: [
      'Target range maintained following unanimous committee ballot',
      'Balance sheet runoff continues at calibrated historical cadence',
      'Term premium across 10-year paper compressed 4 basis points',
    ],
    source: 'Financial Times Wire',
    originalUrl: 'https://ft.com/dispatches/fed-policy-liquidity-anchor',
    author: 'Marcus Vance, Chief Macroeconomics Correspondent',
    publishedAt: '2026-09-27T00:30:00Z',
    section: 'finance',
    importance: 'high',
    columnSpan: 3,
    image: {
      url: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80',
      credit: 'Bloomberg / Pool Photo',
      source: 'Financial Times Wire',
      caption: 'Federal Reserve Board of Governors headquarters in Washington, D.C.',
      aspectRatio: '16:9',
      isAiGenerated: false,
    },
  },
  {
    id: 'story-world-02',
    headline: 'European Sovereign Debt Auctions Witness Resilient Institutional Demand',
    kicker: 'CONTINENTAL MARKETS',
    summary:
      'Bidding metrics across continental European sovereign auctions surpassed secondary market clearing expectations, as pension capital and sovereign wealth funds allocated capital into primary tranches. Italian and German ten-year yield differentials compressed toward twelve-month lows.',
    whyItMatters:
      'Compressed sovereign spreads signify institutional faith in European fiscal framework resilience and bolster interbank liquidity transmission across eurozone member states.',
    source: 'Reuters Financial Wires',
    originalUrl: 'https://reuters.com/markets/europe-debt-syndication',
    author: 'Elena Rostova, Zurich Bureau',
    publishedAt: '2026-09-26T21:45:00Z',
    section: 'world',
    importance: 'medium',
    columnSpan: 2,
    image: {
      url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
      credit: 'Reuters Press Bureau',
      source: 'Reuters Financial Wires',
      caption: 'Financial district towers in Frankfurt am Main.',
      aspectRatio: '3:2',
      isAiGenerated: false,
    },
  },
  {
    id: 'story-tech-03',
    headline: 'Semiconductor Fabrication Facilities Expand Regional Production Lines',
    kicker: 'GLOBAL TECHNOLOGY',
    summary:
      'High-bandwidth memory packaging and advanced semiconductor foundries reported quarterly volume increases exceeding eight percent, supported by long-term bilateral procurement contracts across enterprise enterprise computing sectors.',
    whyItMatters:
      'Upstream silicon output expansion alleviates hardware supply chain choke points, directly sustaining margins across multinational industrial hardware conglomerates.',
    source: 'Associated Press Syndicate',
    originalUrl: 'https://apnews.com/business/tech-foundry-capacity',
    author: 'Kenji Takahashi, Tokyo',
    publishedAt: '2026-09-26T18:15:00Z',
    section: 'technology',
    importance: 'medium',
    columnSpan: 1,
  },
  {
    id: 'story-national-04',
    headline: 'Bank Indonesia Deepens Foreign Exchange Term Deposit Facilities',
    kicker: 'NUSANTARA CAPITAL DESK',
    summary:
      'The central bank enhanced export earning retention incentives through its foreign currency term deposit windows, bolstering domestic interbank dollar liquidity and fostering rupiah exchange stability across Southeast Asian trading sessions.',
    whyItMatters:
      'Foreign reserve fortification shields the national currency from sudden global risk-off contagion while maintaining trade settlement predictability.',
    source: 'The Jakarta Post Wire',
    originalUrl: 'https://thejakartapost.com/business/bi-fx-term-deposits',
    author: 'Bambang Sastro, Jakarta',
    publishedAt: '2026-09-27T01:10:00Z',
    section: 'national',
    importance: 'medium',
    columnSpan: 2,
  },
  {
    id: 'story-economy-05',
    headline: 'Commodity Port Cargo Clearances Signal Expansion in Trade Balance',
    kicker: 'REAL ECONOMY',
    summary:
      'Deepwater freight terminals reported continuous throughput gains for manufactured commodities, with automated bulk cargo handling setting record clearance velocity.',
    whyItMatters:
      'Positive cargo momentum directly correlates with quarterly current account resilience and regional logistical employment stability.',
    source: 'Bloomberg News Service',
    originalUrl: 'https://bloomberg.com/news/cargo-trade-metrics',
    publishedAt: '2026-09-26T23:00:00Z',
    section: 'economy',
    importance: 'low',
    columnSpan: 1,
  },
  {
    id: 'story-markets-06',
    headline: 'Global Sovereign Wealth Funds Accelerate Allocations into Core Infrastructure',
    kicker: 'CAPITAL MARKETS CHRONICLE',
    summary:
      'Institutional fund managers reported substantial capital rotations toward regulated transmission grids and renewable logistics hubs, seeking predictable inflation-indexed cash yields amidst shifting central bank benchmark rates.',
    whyItMatters:
      'Long-term sovereign capital deployment stabilizes primary issuance markets and anchors long-term yield curves across global bond hubs.',
    source: 'Financial Times Wire',
    originalUrl: 'https://ft.com/markets/infrastructure-allocations',
    author: 'Julian Thorne, London',
    publishedAt: '2026-09-27T02:00:00Z',
    section: 'markets',
    importance: 'high',
    columnSpan: 2,
    image: {
      url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80',
      credit: 'Financial Times Syndicate',
      source: 'Financial Times Wire',
      caption: 'Trading floor activity during the morning opening bell.',
      aspectRatio: '16:9',
      isAiGenerated: false,
    },
  },
  {
    id: 'story-forex-07',
    headline: 'Major Currency Cross Pairs Settle in Compressed Trading Ranges',
    kicker: 'GLOBAL FOREIGN EXCHANGE',
    summary:
      'Implied foreign exchange volatility across the G10 currency basket declined to multi-month lows as commercial hedgers and institutional desks balanced currency forward exposures ahead of sovereign inflation readings.',
    whyItMatters:
      'Dampened currency fluctuations lower multinational transactional friction and decrease foreign currency hedging expenditure for international trade.',
    source: 'ForexLive Wires',
    originalUrl: 'https://forexlive.com/news/g10-fx-volatility-settles',
    author: 'Clara Oswald, Geneva',
    publishedAt: '2026-09-27T01:30:00Z',
    section: 'forex',
    importance: 'medium',
    columnSpan: 1,
  },
  {
    id: 'story-crypto-08',
    headline: 'Institutional Digital Asset Custody Protocols Obtain Regulatory Approvals',
    kicker: 'DIGITAL ASSETS & PROTOCOLS',
    summary:
      'Tier-one custodial platforms secured enhanced institutional licenses across international financial hubs, enabling regulated trust companies to hold spot digital collateral with bankruptcy-remote insurance protection.',
    whyItMatters:
      'Standardized institutional segregation mitigates counterparty vulnerabilities and facilitates pension participation in verified spot crypto instruments.',
    source: 'CoinDesk Syndicate',
    originalUrl: 'https://coindesk.com/policy/custodial-framework-clearance',
    author: 'Sarah Chen, Singapore',
    publishedAt: '2026-09-26T22:15:00Z',
    section: 'crypto',
    importance: 'medium',
    columnSpan: 2,
    image: {
      url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
      credit: 'CoinDesk Photo Bureau',
      source: 'CoinDesk Syndicate',
      caption: 'Secure hardware infrastructure at a financial data centre.',
      aspectRatio: '16:9',
      isAiGenerated: false,
    },
  },
  {
    id: 'story-biz-09',
    headline: 'Aerospace Engineering Consortia Finalize Multi-Year Commercial Orders',
    kicker: 'ENTERPRISE & COMMERCE',
    summary:
      'Global aerospace manufacturers announced firm contracts for next-generation turbofan systems and composite airframes, reflecting sustained medium-term international air freight and passenger capacity demand.',
    whyItMatters:
      'Long-cycle aerospace production backlogs provide multi-year revenue visibility for Tier-2 advanced materials and titanium sub-contractors.',
    source: 'Reuters Financial Wires',
    originalUrl: 'https://reuters.com/business/aerospace-contracts-expansion',
    publishedAt: '2026-09-26T20:00:00Z',
    section: 'business',
    importance: 'medium',
    columnSpan: 1,
  },
  {
    id: 'story-markets-10',
    headline: 'Crude Benchmarks Rebound Supported by Maritime Transport Clearances',
    kicker: 'COMMODITIES & ENERGY',
    summary:
      'Brent and WTI petroleum futures recorded moderate advances following inventory drawdowns at primary deepwater refining hubs and balanced refinery utilization schedules across Atlantic shipping lanes.',
    whyItMatters:
      'Energy benchmark equilibrium directly influences maritime freight indices, jet fuel cracking spreads, and consumer logistical cost indices.',
    source: 'MarketWatch Top Stories',
    originalUrl: 'https://marketwatch.com/story/crude-draws-anchor-energy-complex',
    publishedAt: '2026-09-27T00:15:00Z',
    section: 'markets',
    importance: 'low',
    columnSpan: 1,
  },
  {
    id: 'story-finance-11',
    headline: 'Commercial Lending Syndicates Expand Credit Windows for Industrial Modernization',
    kicker: 'CORPORATE BANKING',
    summary:
      'Consortiums of private and sovereign financial institutions finalized revolving credit extensions for automated manufacturing hubs, citing strong debt-service coverage ratios and collateral liquidity.',
    whyItMatters:
      'Prudent corporate lending transmission sustains capital expenditure growth without stressing bank Tier-1 common equity buffers.',
    source: 'The Financial Times',
    originalUrl: 'https://ft.com/banking/syndicated-lending-industrial',
    publishedAt: '2026-09-26T19:30:00Z',
    section: 'finance',
    importance: 'low',
    columnSpan: 1,
  },
  {
    id: 'story-national-12',
    headline: 'Sovereign Infrastructure Bonds Meet Strong Domestic Retail Uptake',
    kicker: 'NUSANTARA CAPITAL DESK',
    summary:
      'The ministry of finance reported complete subscription across green retail bond tranches, with domestic pension funds and individual savers actively allocating funds into sustainable provincial infrastructure projects.',
    whyItMatters:
      'Domestic retail bond absorption reduces dependence on offshore capital while deepening national financial market literacy and liquidity.',
    source: 'Antara News Ekonomi',
    originalUrl: 'https://antaranews.com/berita/sukuk-ritel-infrastruktur',
    publishedAt: '2026-09-27T02:45:00Z',
    section: 'national',
    importance: 'medium',
    columnSpan: 2,
  },
];

export const MOCK_TICKERS: MarketTickerItem[] = [
  { symbol: 'XAUUSD', name: 'Gold Spot', price: 2685.40, change: 12.30, changePercent: 0.46, direction: 'up', category: 'commodity' },
  { symbol: 'EURUSD', name: 'Euro / US Dollar', price: 1.0845, change: 0.0018, changePercent: 0.17, direction: 'up', category: 'forex' },
  { symbol: 'US100', name: 'Nasdaq 100', price: 20185.20, change: -45.60, changePercent: -0.23, direction: 'down', category: 'index' },
  { symbol: 'US30', name: 'Dow Jones', price: 42120.50, change: -92.40, changePercent: -0.22, direction: 'down', category: 'index' },
  { symbol: 'BTCUSD', name: 'Bitcoin', price: 65420.00, change: 840.00, changePercent: 1.30, direction: 'up', category: 'crypto' },
  { symbol: 'BRENT', name: 'Crude Oil', price: 74.80, change: 0.95, changePercent: 1.29, direction: 'up', category: 'commodity' },
];

export const MOCK_WEATHER_BLOCK: WeatherBlock = {
  type: 'weather_block',
  location: 'Magelang, Central Java',
  currentTempC: 28.0,
  condition: 'Partly Cloudy',
  conditionIcon: '⛅',
  highTempC: 31.0,
  lowTempC: 22.0,
  precipitationChancePercent: 40,
  humidityPercent: 78,
  windKmh: 12.0,
  forecastSummary: 'Passing afternoon cloud cover across the Borobudur basin with light south-easterly breezes.',
  source: 'Open-Meteo Meteorological Wires',
  isStale: false,
  observedAt: '2026-09-27T00:00:00Z',
};

export const MOCK_ECONOMIC_EVENTS: EconomicCalendarItem[] = [
  { time: '13:30 WIB', currency: 'USD', eventName: 'Core Personal Consumption Expenditure (PCE)', impact: 'high', forecast: '0.2%', previous: '0.2%' },
  { time: '15:00 WIB', currency: 'EUR', eventName: 'ECB Monetary Policy Minutes', impact: 'high', forecast: '--', previous: '--' },
  { time: '19:30 WIB', currency: 'USD', eventName: 'Initial Jobless Claims', impact: 'medium', forecast: '215K', previous: '219K' },
  { time: '21:00 WIB', currency: 'IDR', eventName: 'Foreign Exchange Reserves Position', impact: 'medium', forecast: '$150.2B', previous: '$149.8B' },
];
