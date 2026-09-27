import type { NewspaperStory, MarketTickerItem, WeatherBlock, EconomicCalendarItem } from '../types/document';

export const MOCK_STORIES: NewspaperStory[] = [
  {
    id: 'story-lead-01',
    headline: 'Federal Reserve Holds Benchmark Rates Steady as Liquidity Adapts to Policy Shifts',
    subheadline: 'Central bank maintains policy stance while sovereign yields compress across benchmark ten-year maturities',
    kicker: 'MACRO DESK · WASHINGTON',
    whatHappened:
      'The Federal Open Market Committee maintained benchmark overnight borrowing costs within the prevailing target range during its scheduled conclave, citing balanced risks between inflation persistence and labor market stabilization. Capital market participants observed muted reactions across benchmark sovereign yields, as institutional trading desks absorbed policy projections without disruptive spreads.',
    details:
      'Trading activity across overnight index swaps indicated minimal divergence from official guidance, with benchmark 10-year Treasury yields easing four basis points in afternoon settlement. Primary government bond dealers reported solid order absorption during morning liquidity windows, noting that quantitative tightening continues along the calibrated monthly pace established earlier in the fiscal cycle. Fed officials emphasized in their accompanying statement that economic growth remains solid, while commercial banking institutions maintain sufficient reserves to navigate intermediate funding requirements without extraordinary liquidity facilities.',
    whyItMatters:
      'Prolonged rate stability preserves corporate borrowing cost visibility while anchoring benchmark yield spreads, dampening speculative extremes in cross-border capital flows and providing institutional CFOs with reliable forward curves.',
    summary:
      'The Federal Open Market Committee maintained benchmark overnight borrowing costs within the prevailing target range, citing balanced macroeconomic risks. Primary government bond dealers reported orderly liquidity absorption with benchmark yields easing four basis points.',
    keyPoints: [
      'Target range maintained following unanimous committee ballot',
      'Balance sheet runoff continues at calibrated historical cadence',
      'Term premium across 10-year paper compressed 4 basis points',
    ],
    source: 'Financial Times Wire',
    originalUrl: 'https://www.ft.com/markets',
    resolvedUrl: 'https://www.ft.com/markets',
    linkStatus: 'PAYWALLED',
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
    headline: 'European Sovereign Debt Auctions Witness Resilient Institutional Demand Across Primary Tranches',
    subheadline: 'Continental yield differentials narrow toward twelve-month lows following multi-billion euro syndication orders',
    kicker: 'CONTINENTAL MARKETS',
    whatHappened:
      'Bidding metrics across continental European sovereign auctions surpassed secondary market clearing expectations, as pension capital and sovereign wealth funds allocated capital into primary tranches. Italian and German ten-year yield differentials compressed toward twelve-month lows.',
    details:
      'The debt issuance syndicate reported a bid-to-cover ratio of 2.65 times, driven by heightened demand from Scandinavian pension funds and Asian central bank reserve managers. Sovereign spread compression between Italian BTPs and German Bunds settled at 112 basis points, reflecting heightened confidence in macroeconomic resilience. Cross-border banking consortia noted that demand was particularly pronounced in the 7-to-12-year maturity bucket.',
    whyItMatters:
      'Compressed sovereign spreads signify institutional faith in European fiscal framework resilience and bolster interbank liquidity transmission across eurozone member states.',
    summary:
      'Bidding metrics across continental European sovereign auctions surpassed expectations as pension capital and sovereign funds allocated into primary tranches, compressing Italian and German ten-year differentials.',
    source: 'Reuters Financial Wires',
    originalUrl: 'https://www.reuters.com/markets/',
    resolvedUrl: 'https://www.reuters.com/markets/',
    linkStatus: 'VALID',
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
    headline: 'Semiconductor Fabrication Facilities Expand Regional Production Lines to Meet Enterprise Computing Demand',
    subheadline: 'High-bandwidth memory packaging plants ramp up capital expenditures across Asia and North America',
    kicker: 'GLOBAL TECHNOLOGY',
    whatHappened:
      'High-bandwidth memory packaging and advanced semiconductor foundries reported quarterly volume increases exceeding eight percent, supported by long-term bilateral procurement contracts across enterprise computing and cloud infrastructure sectors.',
    details:
      'Leading chip fabricators reported that cleanroom expansions in Japan, Taiwan, and the American Midwest are reaching commercial yield ahead of target milestones. Equipment vendors noted book-to-bill ratios climbing to 1.18, with extreme ultraviolet lithography shipments accelerating. Long-term multi-year purchase commitments from hyperscalers have secured over 70 percent of projected advanced packaging capacity through next year.',
    whyItMatters:
      'Upstream silicon output expansion alleviates hardware supply chain choke points, directly sustaining margins across multinational industrial hardware conglomerates.',
    summary:
      'High-bandwidth memory packaging and advanced semiconductor foundries reported volume increases exceeding eight percent, supported by multi-year enterprise contracts.',
    source: 'Associated Press Syndicate',
    originalUrl: 'https://apnews.com/hub/technology',
    resolvedUrl: 'https://apnews.com/hub/technology',
    linkStatus: 'VALID',
    author: 'Kenji Takahashi, Tokyo',
    publishedAt: '2026-09-26T18:15:00Z',
    section: 'technology',
    importance: 'medium',
    columnSpan: 1,
  },
  {
    id: 'story-national-04',
    headline: 'Bank Indonesia Deepens Foreign Exchange Term Deposit Facilities to Stabilize Trade Liquidity',
    subheadline: 'Monetary authority strengthens export proceeds retention with competitive yields and local currency settlements',
    kicker: 'NUSANTARA CAPITAL DESK',
    whatHappened:
      'The central bank enhanced export earning retention incentives through its foreign currency term deposit windows, bolstering domestic interbank dollar liquidity and fostering rupiah exchange stability across Southeast Asian trading sessions.',
    details:
      'Bank Indonesia reported that outstanding placements in export proceed facilities rose by $1.8 billion over the past month. The central bank expanded bilateral local currency transaction frameworks with regional trading partners, allowing cross-border business invoices to settle directly in domestic currencies rather than intermediate clearing dollars. Domestic exporters welcomed the competitive term rates offered on 3-month and 6-month tenors.',
    whyItMatters:
      'Foreign reserve fortification shields the national currency from sudden global risk-off contagion while maintaining trade settlement predictability.',
    summary:
      'The central bank enhanced export earning retention incentives through foreign currency term deposits, bolstering interbank liquidity and fostering currency stability.',
    source: 'The Jakarta Post Wire',
    originalUrl: 'https://www.thejakartapost.com/business',
    resolvedUrl: 'https://www.thejakartapost.com/business',
    linkStatus: 'VALID',
    author: 'Bambang Sastro, Jakarta',
    publishedAt: '2026-09-27T01:10:00Z',
    section: 'national',
    importance: 'medium',
    columnSpan: 2,
  },
  {
    id: 'story-economy-05',
    headline: 'Commodity Port Cargo Clearances Signal Expansion in Regional Manufacturing and Trade Balance',
    subheadline: 'Deepwater container throughput and automated logistics terminals register record turnaround metrics',
    kicker: 'REAL ECONOMY',
    whatHappened:
      'Deepwater freight terminals reported continuous throughput gains for manufactured commodities, with automated bulk cargo handling setting record clearance velocity across major international shipping corridors.',
    details:
      'Port authority data indicated an annualized 6.4 percent increase in containerized merchandise volumes. Supply chain operators cited streamlined customs automation and upgraded crane infrastructure as pivotal factors in reducing average berth dwell times to under 18 hours. Strongest clearance increases were logged in industrial electrical equipment, specialized chemicals, and intermediate consumer goods.',
    whyItMatters:
      'Positive cargo momentum directly correlates with quarterly current account resilience and regional logistical employment stability.',
    summary:
      'Deepwater freight terminals reported continuous throughput gains for manufactured commodities, setting record clearance velocity and signaling export resilience.',
    source: 'Bloomberg News Service',
    originalUrl: 'https://www.bloomberg.com/markets',
    resolvedUrl: 'https://www.bloomberg.com/markets',
    linkStatus: 'PAYWALLED',
    publishedAt: '2026-09-26T23:00:00Z',
    section: 'economy',
    importance: 'low',
    columnSpan: 1,
  },
  {
    id: 'story-markets-06',
    headline: 'Global Sovereign Wealth Funds Accelerate Allocations into Core Infrastructure and Energy Grids',
    subheadline: 'Institutional investors deploy patient capital into high-yield regulated utilities amidst macroeconomic shifts',
    kicker: 'CAPITAL MARKETS CHRONICLE',
    whatHappened:
      'Institutional fund managers reported substantial capital rotations toward regulated transmission grids and renewable logistics hubs, seeking predictable inflation-indexed cash yields amidst shifting central bank benchmark rates.',
    details:
      'Surveys of sovereign wealth funds overseeing more than $4 trillion in combined assets revealed that over 65 percent intend to expand private market allocations to vital public utilities over the coming two years. Long-term concession agreements provide defensible cash flows that hedge against broader index volatility while delivering structural equity returns exceeding 9 percent annually.',
    whyItMatters:
      'Long-term sovereign capital deployment stabilizes primary issuance markets and anchors long-term yield curves across global bond hubs.',
    summary:
      'Institutional fund managers reported substantial capital rotations toward regulated transmission grids and logistics hubs, seeking predictable inflation-indexed cash yields.',
    source: 'Financial Times Wire',
    originalUrl: 'https://www.ft.com/global-economy',
    resolvedUrl: 'https://www.ft.com/global-economy',
    linkStatus: 'PAYWALLED',
    author: 'Julian Thorne, London',
    publishedAt: '2026-09-27T02:00:00Z',
    section: 'markets',
    importance: 'high',
    columnSpan: 2,
    image: {
      url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80',
      credit: 'Financial Times / Archive Wire',
      source: 'Financial Times Wire',
      caption: 'Energy transmission tower and infrastructure distribution network.',
      aspectRatio: '16:9',
      isAiGenerated: false,
    },
  },
  {
    id: 'story-forex-07',
    headline: 'Foreign Exchange Volatility Compresses Across G10 Pairs as Cross-Border Spreads Narrow',
    subheadline: 'Implied options volatility drops to multi-quarter lows as central bank monetary trajectories converge',
    kicker: 'CURRENCIES & FLOWS',
    whatHappened:
      'Implied options volatility across major currency pairs settled to its lowest level in eighteen months, as central bank interest rate differentials stabilized and sovereign trade balances maintained balanced momentum.',
    details:
      'Three-month implied volatility in EUR/USD and GBP/USD dropped below 5.2 percent, while one-month risk reversals reflected balanced positioning between commercial importers and multinational hedging desks. Algorithmic execution desks reported that cross-border trade flows were predominantly matched within tight 10-pip intraday corridors.',
    whyItMatters:
      'Muted currency volatility reduces corporate foreign exchange hedging overhead and supports predictable international cash-flow planning for global supply chains.',
    summary:
      'Implied options volatility across major currency pairs settled to multi-quarter lows as rate differentials stabilized across G10 economies.',
    source: 'ForexLive Financial Wire',
    originalUrl: 'https://www.forexlive.com/',
    resolvedUrl: 'https://www.forexlive.com/',
    linkStatus: 'VALID',
    publishedAt: '2026-09-26T22:30:00Z',
    section: 'forex',
    importance: 'medium',
    columnSpan: 1,
  },
  {
    id: 'story-crypto-08',
    headline: 'Institutional Custody Platforms Report Growth in Regulated Digital Asset Settlement Volumes',
    subheadline: 'Tier-1 custodial banks clear record spot exchange-traded transactions with automated audit trails',
    kicker: 'DIGITAL ASSETS',
    whatHappened:
      'Regulated digital asset custodians registered significant inflows from sovereign endowments and asset managers, with cleared settlement volumes expanding as compliance frameworks matured in key financial capitals.',
    details:
      'Audited quarterly reports from institutional trust companies revealed that assets held under custody reached record heights, buoyed by regulated spot exchange-traded products. Multi-party computation protocols and real-time cryptographic reserve verifications have largely mitigated counterparty risks that historically constrained institutional allocations.',
    whyItMatters:
      'Institutional custodial integration bridges decentralized asset networks with traditional capital markets, dampening liquidity fragmentation.',
    summary:
      'Regulated digital asset custodians registered significant institutional inflows, with cleared volumes expanding under mature compliance frameworks.',
    source: 'CoinDesk Institutional Wires',
    originalUrl: 'https://www.coindesk.com/markets/',
    resolvedUrl: 'https://www.coindesk.com/markets/',
    linkStatus: 'VALID',
    publishedAt: '2026-09-26T20:15:00Z',
    section: 'crypto',
    importance: 'medium',
    columnSpan: 1,
    image: {
      url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
      credit: 'CoinDesk Media Group',
      source: 'CoinDesk Institutional Wires',
      caption: 'Digital cryptographic hardware security modules in server facility.',
      aspectRatio: '16:9',
      isAiGenerated: false,
    },
  },
  {
    id: 'story-biz-09',
    headline: 'Commercial Aerospace Suppliers Secure Multi-Year Delivery Backlogs on Global Fleet Renewals',
    subheadline: 'Aviation component manufacturers report full order books through 2030 as airlines upgrade fuel efficiency',
    kicker: 'INDUSTRIAL DISPATCH',
    whatHappened:
      'Aerospace manufacturers announced long-term delivery agreements with international commercial carriers, committing production lines through the end of the decade as airlines prioritize fuel-efficient twin-aisle airframes.',
    details:
      'Component manufacturers in Europe and North America reported that backlog values reached new multi-year highs. Engine fabricators and composite materials producers confirmed that long-term supply agreements have cushioned profit margins against raw metal fluctuations. Airlines are accelerating older aircraft retirements to achieve corporate decarbonization targets.',
    whyItMatters:
      'Extended industrial backlogs sustain capital expenditure cycles, high-skilled manufacturing employment, and long-range supplier financing lines.',
    summary:
      'Aerospace manufacturers announced multi-year delivery agreements with commercial carriers, locking in production through 2030 to upgrade global fleet efficiency.',
    source: 'Reuters Business Wires',
    originalUrl: 'https://www.reuters.com/markets/',
    resolvedUrl: 'https://www.reuters.com/markets/',
    linkStatus: 'VALID',
    publishedAt: '2026-09-26T17:40:00Z',
    section: 'business',
    importance: 'low',
    columnSpan: 1,
  },
  {
    id: 'story-markets-10',
    headline: 'Crude Oil Inventory Draws Anchor Energy Complex as Refining Margins Stabilize',
    subheadline: 'Commercial petroleum storage declines for the fourth consecutive week amidst steady transportation demand',
    kicker: 'ENERGY & COMMODITIES',
    whatHappened:
      'Crude benchmarks found firm footing near recent ranges following federal inventory data showing sustained reductions in commercial petroleum reserves, balanced by steady refinery utilization rates.',
    details:
      'Government energy statistics revealed a 3.4-million-barrel reduction in commercial crude storage, exceeding consensus estimates. Distillate and gasoline inventories contracted moderately as seasonal driving demand and industrial freight operations sustained fuel consumption. Offshore producers maintained steady output without signaling abrupt supply adjustments.',
    whyItMatters:
      'Energy benchmark equilibrium anchors macroeconomic input costs, preventing sudden inflationary spikes in manufacturing and logistics.',
    summary:
      'Crude benchmarks found firm support following federal inventory data showing a 3.4-million-barrel decline in commercial storage and steady refining runs.',
    source: 'MarketWatch Top Stories',
    originalUrl: 'https://www.marketwatch.com/markets',
    resolvedUrl: 'https://www.marketwatch.com/markets',
    linkStatus: 'VALID',
    publishedAt: '2026-09-27T01:50:00Z',
    section: 'markets',
    importance: 'medium',
    columnSpan: 1,
  },
  {
    id: 'story-finance-11',
    headline: 'Syndicated Corporate Lending Markets Experience Elevated Volume in Investment-Grade Facilities',
    subheadline: 'Multinational corporations refinance term debt with tight credit spreads and favorable covenant structures',
    kicker: 'BANKING & DEBT',
    whatHappened:
      'Global corporate treasury desks capitalized on stable credit spreads to refinance maturing credit facilities, pushing syndicated loan volume past quarterly milestones without widening dealer balance sheet risk.',
    details:
      'Arranging banks reported oversubscribed syndication books on senior revolving facilities, with blue-chip corporate borrowers locking in multi-year credit lines. Investor appetite was bolstered by strong interest coverage ratios and corporate balance sheet liquidity. Investment-grade credit default swap indices tightened by 3 basis points across the week.',
    whyItMatters:
      'Orderly corporate debt refinancing shields real-economy employers from refinancing cliffs, securing corporate capital investment continuity.',
    summary:
      'Corporate treasury desks capitalized on stable spreads to refinance credit facilities, pushing syndicated loan volumes past quarterly benchmarks.',
    source: 'Financial Times Wire',
    originalUrl: 'https://www.ft.com/markets',
    resolvedUrl: 'https://www.ft.com/markets',
    linkStatus: 'PAYWALLED',
    publishedAt: '2026-09-27T02:05:00Z',
    section: 'finance',
    importance: 'low',
    columnSpan: 1,
  },
  {
    id: 'story-national-12',
    headline: 'Sovereign Sukuk Retail Issuance Attracts Widespread Domestic Household Participation',
    subheadline: 'Ministry of Finance records strong retail absorption for Sharia-compliant state infrastructure bonds',
    kicker: 'DOMESTIC DEBT DESK',
    whatHappened:
      'The government completed its latest issuance of retail sovereign Islamic bonds with high subscription demand from individual investors, reinforcing financial inclusion and expanding the sovereign domestic funding base.',
    details:
      'The Ministry of Finance reported that total orders from over 45,000 individual investors reached 14.5 trillion rupiah, fully absorbing the allocated quota before the close of the official offer period. Proceeds will be directed exclusively toward national green infrastructure projects, including clean water transmission pipelines and regional public transit corridors.',
    whyItMatters:
      'Expanding the domestic retail investor base reduces sovereign debt vulnerability to volatile foreign capital outflows while providing citizens with secure, inflation-resilient savings.',
    summary:
      'The state completed its retail sovereign sukuk issuance with 14.5 trillion rupiah in orders, channeling household savings into green infrastructure.',
    source: 'Antara National News',
    originalUrl: 'https://www.antaranews.com/ekonomi',
    resolvedUrl: 'https://www.antaranews.com/ekonomi',
    linkStatus: 'VALID',
    publishedAt: '2026-09-27T00:50:00Z',
    section: 'national',
    importance: 'low',
    columnSpan: 1,
  },
  {
    id: 'story-finance-13',
    headline: 'Central Bank Standing Facilities Maintain Equilibrium as Overnight Interbank Rates Anchor',
    subheadline: 'Commercial bank liquidity reserves remain well balanced within official policy corridors',
    kicker: 'LIQUIDITY OPERATIONS',
    whatHappened:
      'Monetary authorities confirmed that daily operational liquidity absorption remained within standard seasonal ranges, keeping effective overnight financing rates firmly anchored to target policy benchmarks.',
    details:
      'Interbank liquidity monitoring desks reported that reserve balances held at the central bank exceeded statutory reserve requirements by a comfortable 4.2 percent margin. The secured overnight financing rate traded within a narrow two-basis-point corridor, confirming that cash distribution across primary clearing dealers and regional banking institutions remains unconstrained.',
    whyItMatters:
      'Unfettered interbank liquidity ensures smooth payments settlement across the commercial banking system, preventing sudden spikes in commercial lending rates.',
    summary:
      'Central bank operational facilities reported well-balanced daily liquidity absorption, maintaining overnight interbank financing rates tightly on target.',
    source: 'Financial Times Wire',
    originalUrl: 'https://www.ft.com/markets',
    resolvedUrl: 'https://www.ft.com/markets',
    linkStatus: 'PAYWALLED',
    publishedAt: '2026-09-27T02:10:00Z',
    section: 'finance',
    importance: 'low',
    columnSpan: 1,
  },
  {
    id: 'story-economy-14',
    headline: 'Industrial Output and Factory Automation Shipments Register Resilient Expansion in Autumn Quarter',
    subheadline: 'Advanced robotics integration and precision machinery demand support manufacturing productivity gains',
    kicker: 'MANUFACTURING MONITOR',
    whatHappened:
      'National manufacturing data indicated continuing expansion in factory output, led by strong production volume in electrical machinery, precision automotive components, and automated sorting technologies.',
    details:
      'The manufacturing production index rose 0.7 percent month-on-month, marking the third consecutive period of industrial expansion. Industrial equipment manufacturers noted that order books for high-precision CNC equipment and automated warehouse robotics grew by 5.1 percent over the quarter, as enterprises seek productivity gains in response to regional wage stabilization.',
    whyItMatters:
      'Factory productivity gains generate non-inflationary economic growth, directly sustaining industrial sector employment and capital expenditure budgets.',
    summary:
      'National manufacturing data indicated ongoing output expansion led by electrical equipment and precision robotics, with output rising 0.7 percent.',
    source: 'Bloomberg News Service',
    originalUrl: 'https://www.bloomberg.com/markets',
    resolvedUrl: 'https://www.bloomberg.com/markets',
    linkStatus: 'PAYWALLED',
    publishedAt: '2026-09-26T23:45:00Z',
    section: 'economy',
    importance: 'medium',
    columnSpan: 2,
    image: {
      url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
      credit: 'Bloomberg Industrial Archive',
      source: 'Bloomberg News Service',
      caption: 'Automated precision robotic arm assembly line in manufacturing plant.',
      aspectRatio: '16:9',
      isAiGenerated: false,
    },
  },
  {
    id: 'story-markets-15',
    headline: 'High-Yield Credit Spreads Tighten to Multi-Year Lows as Corporate Defaults Remain Contained',
    subheadline: 'Secondary market pricing reflects institutional confidence in enterprise cash flows and interest coverage',
    kicker: 'FIXED INCOME',
    whatHappened:
      'High-yield corporate bond spreads narrowed further against underlying government benchmarks, settling near multi-year lows as corporate earnings announcements confirmed stable free cash flow generation.',
    details:
      'The average risk premium on corporate debt tightened 8 basis points to 312 basis points over comparable Treasuries. Credit rating agencies noted that upgrade-to-downgrade ratios remained positive throughout the second half, with speculative-grade default forecasts for the next twelve months holding below 2.5 percent.',
    whyItMatters:
      'Tight credit spreads lower marginal funding costs for growing mid-sized enterprises, stimulating employment and research capital deployment.',
    summary:
      'High-yield corporate bond spreads narrowed to multi-year lows as corporate earnings confirmed stable interest coverage and low default rates.',
    source: 'Reuters Financial Wires',
    originalUrl: 'https://www.reuters.com/markets/',
    resolvedUrl: 'https://www.reuters.com/markets/',
    linkStatus: 'VALID',
    publishedAt: '2026-09-27T01:15:00Z',
    section: 'markets',
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
