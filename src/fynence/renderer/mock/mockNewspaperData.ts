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
  {
    id: 'story-finance-13',
    headline: 'Central Bank Liquidity Windows Record Balanced Collateral Utilization',
    kicker: 'MONETARY OPERATIONS',
    summary:
      'Commercial banking institutions balanced their overnight standing facility allocations, reflecting ample reserves across systemic interbank markets and minimal dependence on discount borrowing.',
    whyItMatters:
      'Balanced central bank facility usage indicates steady financial stability and predictable liquidity distribution across the domestic banking architecture.',
    source: 'Financial Times Syndicate',
    originalUrl: 'https://ft.com/central-banks/standing-facility-liquidity',
    author: 'David Sterling, London',
    publishedAt: '2026-09-27T03:15:00Z',
    section: 'finance',
    importance: 'low',
    columnSpan: 1,
  },
  {
    id: 'story-economy-14',
    headline: 'Quarterly Industrial Output Surpasses Consensus Projections on Strong Export Orders',
    kicker: 'REAL ECONOMY',
    summary:
      'Factory orders and machine tooling indicators registered accelerated expansion across manufacturing hubs, driven by resilient bilateral trade volumes and automated capital tooling investments.',
    whyItMatters:
      'Industrial acceleration bolsters macroeconomic gross domestic output and cushions balance-of-payments resilience.',
    source: 'Bloomberg News Service',
    originalUrl: 'https://bloomberg.com/news/industrial-production-expansion',
    publishedAt: '2026-09-27T01:45:00Z',
    section: 'economy',
    importance: 'medium',
    columnSpan: 2,
    image: {
      url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
      credit: 'Bloomberg Industrial Photo',
      source: 'Bloomberg News Service',
      caption: 'Automated factory floor during continuous tooling operations.',
      aspectRatio: '16:9',
      isAiGenerated: false,
    },
  },
  {
    id: 'story-markets-15',
    headline: 'Primary Corporate Bond Issuance Spreads Tighten Across Investment-Grade Names',
    kicker: 'DEBT CAPITAL MARKETS',
    summary:
      'Syndicated debt orderbooks recorded three-fold oversubscription for high-grade industrial notes, as institutional asset managers locked in attractive coupon yields prior to benchmark rate adjustments.',
    whyItMatters:
      'Tight credit spreads lower weighted average cost of capital for corporate balance sheets and support enterprise expansion projects.',
    source: 'Reuters Financial Wires',
    originalUrl: 'https://reuters.com/markets/bonds/spreads-tighten',
    author: 'Hannah Becker, Frankfurt',
    publishedAt: '2026-09-27T02:20:00Z',
    section: 'markets',
    importance: 'low',
    columnSpan: 1,
  },
  {
    id: 'story-forex-16',
    headline: 'Cross-Border Real-Time Payment Linkages Expand Regional Trade Bilaterals',
    kicker: 'FOREIGN EXCHANGE CHRONICLE',
    summary:
      'Multilateral central bank accords established direct local-currency settlement linkages between sovereign trade partners, bypassing intermediary conversion corridors and mitigating dollar dependency.',
    whyItMatters:
      'Local currency clearing reduces international transactional costs and insulates bilateral trade from global currency swings.',
    source: 'The Jakarta Post Wire',
    originalUrl: 'https://thejakartapost.com/business/local-currency-settlement',
    publishedAt: '2026-09-27T00:50:00Z',
    section: 'forex',
    importance: 'medium',
    columnSpan: 1,
  },
  {
    id: 'story-crypto-17',
    headline: 'Decentralized Settlement Networks Implement Enhanced Proof-of-Reserve Standards',
    kicker: 'DIGITAL LEDGER DISPATCH',
    summary:
      'Major blockchain infrastructure developers released verified cryptographic solvency attestations certified by accredited auditing entities, reinforcing transparency across cross-chain liquidity vaults.',
    whyItMatters:
      'Standardized reserve transparency mitigates platform insolvency contagion and supports regulated institutional settlement pilots.',
    source: 'CoinDesk Syndicate',
    originalUrl: 'https://coindesk.com/tech/proof-of-reserves-expansion',
    publishedAt: '2026-09-26T21:00:00Z',
    section: 'crypto',
    importance: 'low',
    columnSpan: 1,
  },
  {
    id: 'story-biz-18',
    headline: 'Global Maritime Shipping Rates Normalize as Container Supply Recovers',
    kicker: 'COMMERCE & LOGISTICS',
    summary:
      'Spot container rates along primary transpacific and trans-Suez shipping lanes stabilized to multi-month averages as newly built container carriers entered commercial service schedules.',
    whyItMatters:
      'Predictable container freight expenditure dampens headline cost-push import inflation across consumer retail and durable goods.',
    source: 'Associated Press Syndicate',
    originalUrl: 'https://apnews.com/business/maritime-shipping-rates',
    publishedAt: '2026-09-26T22:40:00Z',
    section: 'business',
    importance: 'medium',
    columnSpan: 2,
  },
  {
    id: 'story-finance-19',
    headline: 'Private Credit Funds Secure Commitments from Sovereign Wealth Portfolios',
    kicker: 'ASSET ALLOCATION DESK',
    summary:
      'Direct lending asset managers announced closed fund syndications exceeding forty billion dollars, with sovereign pension mandates seeking senior secured floating yields with equity downside covenants.',
    whyItMatters:
      'Institutional private debt provides alternative liquidity pipelines for mid-sized commercial enterprises during strict bank lending regimes.',
    source: 'Financial Times Wire',
    originalUrl: 'https://ft.com/markets/private-credit-allocations',
    author: 'Alistair Campbell, Edinburgh',
    publishedAt: '2026-09-27T03:00:00Z',
    section: 'finance',
    importance: 'low',
    columnSpan: 1,
  },
  {
    id: 'story-economy-20',
    headline: 'National Employment Metrics Exhibit Resilient Labor Market Absorptions',
    kicker: 'MACRO MONITOR',
    summary:
      'Government statistical agencies confirmed sustained employment growth across service and technical manufacturing domains, with prime-age workforce participation climbing toward cyclical peaks.',
    whyItMatters:
      'Durable employment figures provide consumer disposable income stability and underpin domestic household consumption expenditure.',
    source: 'Bloomberg News Service',
    originalUrl: 'https://bloomberg.com/news/labor-market-resilience',
    publishedAt: '2026-09-27T02:10:00Z',
    section: 'economy',
    importance: 'low',
    columnSpan: 1,
  },
  {
    id: 'story-markets-21',
    headline: 'Benchmark Precious Metals Benefit from Heightened Central Bank Reserve Accumulation',
    kicker: 'COMMODITIES & METALS',
    summary:
      'Physical bullion holdings across central banking reserve managers recorded consistent monthly accretions, sustaining gold benchmark pricing above long-term technical moving averages.',
    whyItMatters:
      'Official reserve diversification cushions emerging market balance sheets against geopolitical volatility and exchange reserve shocks.',
    source: 'MarketWatch Top Stories',
    originalUrl: 'https://marketwatch.com/story/central-bank-gold-purchases',
    publishedAt: '2026-09-27T01:25:00Z',
    section: 'markets',
    importance: 'low',
    columnSpan: 1,
  },
  {
    id: 'story-biz-22',
    headline: 'Renewable Power Transmission Grids Attract Multi-Billion Infrastructure Bids',
    kicker: 'ENERGY INFRASTRUCTURE',
    summary:
      'State utility operators awarded high-voltage direct-current transmission contracts to engineering consortiums, aiming to connect offshore generation directly to high-demand industrial metropolitan corridors.',
    whyItMatters:
      'Transmission grid expansion eliminates energy curtailment and accelerates regional commercial decarbonization targets.',
    source: 'Reuters Financial Wires',
    originalUrl: 'https://reuters.com/business/energy/transmission-grid-contracts',
    publishedAt: '2026-09-26T23:30:00Z',
    section: 'business',
    importance: 'low',
    columnSpan: 1,
  },
  {
    id: 'story-finance-23',
    headline: 'Sovereign Wealth Funds Increase Allocations to Core Infrastructure Assets',
    kicker: 'CAPITAL ALLOCATION',
    summary:
      'Global institutional asset owners committed record capital to regulated utilities, transportation corridors, and renewable power installations, seeking contractual yield that outpaces long-term inflationary benchmarks.',
    whyItMatters:
      'Direct infrastructure investment provides stable duration matching for pension liabilities while insulating balance sheets from equity market beta.',
    source: 'Financial Times Wire',
    originalUrl: 'https://ft.com/dispatches/sovereign-wealth-infrastructure',
    publishedAt: '2026-09-27T01:00:00Z',
    section: 'finance',
    importance: 'medium',
    columnSpan: 2,
  },
  {
    id: 'story-economy-24',
    headline: 'Global Supply Chain Pressure Index Drops to Three-Year Neutral Benchmark',
    kicker: 'GLOBAL TRADE DESK',
    summary:
      'Maritime freight backlogs, component lead times, and air cargo rates have fully normalized across transpacific and European lanes, substantially mitigating upside cost pressures on manufactured goods.',
    whyItMatters:
      'Normalized logistics friction allows central banks greater room to ease monetary restrictions without rekindling cost-push inflation.',
    source: 'Wall Street Journal',
    originalUrl: 'https://wsj.com/economy/trade/supply-chain-normalization',
    publishedAt: '2026-09-27T01:15:00Z',
    section: 'economy',
    importance: 'medium',
    columnSpan: 2,
  },
  {
    id: 'story-markets-25',
    headline: 'High-Yield Corporate Credit Default Swap Spreads Tighten on Low Default Rates',
    kicker: 'FIXED INCOME',
    summary:
      'North American and European synthetic credit indices traded at narrow margins as trailing default projections fell to historic lows, supported by solid corporate interest coverage ratios.',
    whyItMatters:
      'Tight credit spreads signal broad institutional risk appetite and frictionless refinancing access for sub-investment grade borrowers.',
    source: 'Bloomberg Markets',
    originalUrl: 'https://bloomberg.com/markets/credit/cds-spreads-compression',
    publishedAt: '2026-09-27T01:30:00Z',
    section: 'markets',
    importance: 'low',
    columnSpan: 1,
  },
  {
    id: 'story-business-26',
    headline: 'Semiconductor Fabrication Toolmakers Report Robust Multi-Quarter Order Backlogs',
    kicker: 'INDUSTRIAL TECH',
    summary:
      'Advanced photolithography and wafer packaging equipment vendors recorded significant new commitments from foundries expanding leading-edge process node fabrication capacity.',
    whyItMatters:
      'Equipment vendor backlogs serve as a leading indicator of global high-performance computing and artificial intelligence hardware deployment.',
    source: 'Reuters Financial Wires',
    originalUrl: 'https://reuters.com/business/tech/semiconductor-tool-orders',
    publishedAt: '2026-09-27T01:45:00Z',
    section: 'business',
    importance: 'low',
    columnSpan: 1,
  },
  {
    id: 'story-finance-27',
    headline: 'Commercial Paper Rates Rebound Moderately Following Quarterly Corporate Tax Date',
    kicker: 'MONEY MARKETS',
    summary:
      'Tier-1 financial commercial paper yields adjusted upward by 3 basis points as treasury desks rebalanced liquidity buffers to accommodate seasonal corporate fiscal obligations.',
    whyItMatters:
      'Short-term money market equilibrium demonstrates orderly cash distribution across primary dealers without requiring central bank intervention.',
    source: 'Financial Times Wire',
    originalUrl: 'https://ft.com/markets/money/commercial-paper-rates',
    publishedAt: '2026-09-27T02:00:00Z',
    section: 'finance',
    importance: 'low',
    columnSpan: 1,
  },
  {
    id: 'story-economy-28',
    headline: 'Wholesale Inventory-to-Sales Ratios Hold Steady Across Durable Goods Sectors',
    kicker: 'MACRO MONITOR',
    summary:
      'Warehouse inventory metrics remained stable throughout the third quarter as retail replenishment matched real-time electronic point-of-sale volume.',
    whyItMatters:
      'Balanced inventory ratios reduce the danger of sudden destocking cycles that historically trigger manufacturing contractions.',
    source: 'MarketWatch Top Stories',
    originalUrl: 'https://marketwatch.com/economy/inventory-sales-ratio',
    publishedAt: '2026-09-27T02:15:00Z',
    section: 'economy',
    importance: 'low',
    columnSpan: 1,
  },
  {
    id: 'story-markets-29',
    headline: 'Commodity Index Funds Rebalance Toward Agricultural and Base Metal Contracts',
    kicker: 'DERIVATIVES DESK',
    summary:
      'Passive benchmark index roll operations generated elevated liquidity in copper and wheat futures as multi-asset portfolios reweighted target exposures.',
    whyItMatters:
      'Contractual reweighting transfers structural liquidity into base metals essential for long-term power grid and transportation electrification.',
    source: 'Bloomberg Markets',
    originalUrl: 'https://bloomberg.com/markets/commodities/index-rebalancing',
    publishedAt: '2026-09-27T02:30:00Z',
    section: 'markets',
    importance: 'low',
    columnSpan: 1,
  },
  {
    id: 'story-forex-30',
    headline: 'Trade-Weighted Dollar Index Consolidates Inside Narrow Range Ahead of Trade Data',
    kicker: 'CURRENCIES',
    summary:
      'Major currency pairs showed subdued price movement in early London trading, with the Japanese yen and British pound trading within tight 20-pip ranges against the greenback.',
    whyItMatters:
      'Currency consolidation dampens cross-border hedging volatility and facilitates predictable transaction clearing for international trade accounts.',
    source: 'Reuters Financial Wires',
    originalUrl: 'https://reuters.com/markets/currencies/trade-weighted-dollar',
    publishedAt: '2026-09-27T02:45:00Z',
    section: 'forex',
    importance: 'low',
    columnSpan: 1,
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
