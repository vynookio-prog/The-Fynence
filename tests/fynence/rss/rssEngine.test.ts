import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseRssOrAtom } from '../../../src/fynence/engine/parser/rssParser';
import { newsValidator } from '../../../src/fynence/engine/validator/newsValidator';
import { NewsDeduplicator } from '../../../src/fynence/engine/deduplicator/newsDeduplicator';
import { newsRanker } from '../../../src/fynence/engine/ranking/newsRanker';
import { editorialCandidateSelector } from '../../../src/fynence/editorial/engine/editorialCandidateSelector';
import { formatRssDiagnosticsReport, type RssDiagnosticsReport } from '../../../src/fynence/engine/observability/rssReport';
import { CONFIGURED_RSS_FEEDS } from '../../../src/fynence/engine/registry/feeds';
import { sourceRegistry } from '../../../src/fynence/engine/registry/sourceRegistry';
import type { Article } from '../../../src/fynence/types/article';

// Mock RSS / Atom payloads
const MOCK_RSS_VALID = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Financial Chronicle Wire</title>
    <link>https://chronicle.example.com</link>
    <description>Daily financial dispatches</description>
    <item>
      <title>Central Bank Holds Benchmark Interest Rates Unchanged</title>
      <link>https://chronicle.example.com/rates-steady</link>
      <description>The monetary committee voted unanimously to maintain benchmark overnight rates.</description>
      <pubDate>Sun, 27 Sep 2026 01:00:00 GMT</pubDate>
      <category>economy</category>
      <media:content url="https://chronicle.example.com/images/central-bank.jpg" type="image/jpeg" />
    </item>
    <item>
      <title>Sovereign Bond Yields Compress Amid Institutional Allocations</title>
      <link>https://chronicle.example.com/bonds-compress</link>
      <description>Ten-year benchmark paper compressed 4 basis points across major exchanges.</description>
      <pubDate>Sun, 27 Sep 2026 00:30:00 GMT</pubDate>
      <category>finance</category>
    </item>
  </channel>
</rss>`;

const MOCK_ATOM_VALID = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Global Technology &amp; Markets Dispatch</title>
  <link href="https://techmarkets.example.com" />
  <updated>2026-09-27T02:00:00Z</updated>
  <entry>
    <title>Advanced Foundry Expands Semiconductor Wafer Packaging Capacity</title>
    <link href="https://techmarkets.example.com/foundry-expansion" />
    <summary>High-bandwidth memory foundries announced new regional fabrication packaging lines.</summary>
    <published>2026-09-27T01:15:00Z</published>
    <author><name>Elena Vance</name></author>
    <category term="technology" />
  </entry>
</feed>`;

const MOCK_MALFORMED_RSS = `<<<not xml <rss><channel><item><title>Broken Title Without End Link`;

function makeMockArticle(overrides: Partial<Article> = {}): Article {
  const id = overrides.id || `art-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    title: overrides.title || `Financial Dispatch ${id}: Institutional Capital Developments`,
    description: overrides.description || 'Major industrial indices advanced during trading as leading conglomerates reported solid revenue.',
    content: overrides.content || undefined,
    url: overrides.url || `https://reuters.example.com/news/${id}`,
    source: overrides.source || 'Reuters',
    sourceId: overrides.sourceId || 'reuters_business',
    author: overrides.author !== undefined ? overrides.author : 'Staff Reporter',
    category: overrides.category || 'markets',
    region: overrides.region || 'global',
    publishedAt: overrides.publishedAt || new Date().toISOString(),
    imageUrl: overrides.imageUrl !== undefined ? overrides.imageUrl : 'https://images.example.com/photo.jpg',
    imageSource: overrides.imageSource || 'Reuters Archive',
    imageCredit: overrides.imageCredit || 'Reuters Wire',
    imageUsageStatus: overrides.imageUsageStatus || 'source_provided',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe('RSS News Engine — Step 9 Implementation Suite', () => {
  // ==========================================
  // 1. Central Feed Registry
  // ==========================================
  it('1. Central feed registry contains diverse feeds across all required categories', () => {
    assert.ok(CONFIGURED_RSS_FEEDS.length >= 15, `Expected >= 15 feeds, got ${CONFIGURED_RSS_FEEDS.length}`);

    const categories = new Set(CONFIGURED_RSS_FEEDS.map(f => f.category));
    const requiredCategories = ['markets', 'finance', 'economy', 'world', 'national', 'business', 'technology', 'forex', 'crypto'];

    for (const req of requiredCategories) {
      assert.ok(categories.has(req as any), `Feed registry missing category: ${req}`);
    }

    // Verify sourceRegistry is synced with feeds
    const enabledInRegistry = sourceRegistry.getEnabled();
    assert.ok(enabledInRegistry.length >= 15);
  });

  // ==========================================
  // 2. RSS & Atom Normalization
  // ==========================================
  it('2. Normalizes RSS 2.0 and Atom feeds into unified structure', () => {
    const rssParsed = parseRssOrAtom(MOCK_RSS_VALID);
    assert.strictEqual(rssParsed.items.length, 2);
    assert.strictEqual(rssParsed.items[0].title, 'Central Bank Holds Benchmark Interest Rates Unchanged');
    assert.strictEqual(rssParsed.items[0].imageUrl, 'https://chronicle.example.com/images/central-bank.jpg');
    assert.strictEqual(rssParsed.items[1].imageUrl, undefined);

    const atomParsed = parseRssOrAtom(MOCK_ATOM_VALID);
    assert.strictEqual(atomParsed.items.length, 1);
    assert.strictEqual(atomParsed.items[0].title, 'Advanced Foundry Expands Semiconductor Wafer Packaging Capacity');
    assert.strictEqual(atomParsed.items[0].author, 'Elena Vance');
    assert.strictEqual(atomParsed.items[0].link, 'https://techmarkets.example.com/foundry-expansion');
  });

  // ==========================================
  // 3. Malformed Feed Handling
  // ==========================================
  it('3. Handles malformed or corrupt XML gracefully without crashing', () => {
    const parsed = parseRssOrAtom(MOCK_MALFORMED_RSS);
    assert.ok(Array.isArray(parsed.items));
    assert.strictEqual(parsed.items.length, 0);
  });

  // ==========================================
  // 4. Lenient Article Validation
  // ==========================================
  it('4. Rejects only clearly invalid articles; accepts text-only and missing author', () => {
    // Missing title -> reject
    const noTitle = newsValidator.validate({ url: 'https://example.com/1', source: 'Wire' });
    assert.strictEqual(noTitle.isValid, false);

    // Missing URL -> reject
    const noUrl = newsValidator.validate({ title: 'Federal Reserve Monetary Conclave Concludes', source: 'Wire' });
    assert.strictEqual(noUrl.isValid, false);

    // Malformed URL -> reject
    const badUrl = newsValidator.validate({ title: 'Valid Headline With Substance', url: 'not-a-valid-url', source: 'Wire' });
    assert.strictEqual(badUrl.isValid, false);

    // Text-only article without image or author -> ACCEPT
    const textOnly = newsValidator.validate({
      title: 'Treasury Department Announces Quarterly Refunding Schedule',
      url: 'https://treasury.gov/refunding',
      source: 'Treasury Wire',
      description: 'The department details issuance sizes across 3-year, 10-year, and 30-year bond maturities.',
      author: null,
      imageUrl: null,
    });
    assert.strictEqual(textOnly.isValid, true);
  });

  // ==========================================
  // 5. Deduplication: Exact Duplicate vs Similar Story
  // ==========================================
  it('5. Distinguishes exact duplicates from similar stories (does not discard similar stories)', () => {
    const deduplicator = new NewsDeduplicator();
    const baseArt = makeMockArticle({
      id: 'art-original',
      url: 'https://cnbc.com/fed-decision-2026?utm_source=rss',
      title: 'Federal Reserve Holds Interest Rates Steady at Policy Meeting',
    });
    deduplicator.indexArticle(baseArt);

    // Exact canonical URL match
    const exactUrl = deduplicator.checkDuplicate({
      url: 'https://cnbc.com/fed-decision-2026?utm_medium=twitter&fbclid=123',
      title: 'Different Title',
    });
    assert.strictEqual(exactUrl.isExactDuplicate, true);
    assert.strictEqual(exactUrl.isSimilarStory, false);

    // Exact normalized title match
    const exactTitle = deduplicator.checkDuplicate({
      url: 'https://other-site.com/fed',
      title: 'federal reserve holds interest rates steady at policy meeting!',
    });
    assert.strictEqual(exactTitle.isExactDuplicate, true);
    assert.strictEqual(exactTitle.isSimilarStory, false);

    // Similar story from another reputable publisher
    const similarStory = deduplicator.checkDuplicate({
      url: 'https://bloomberg.com/news/fed-holds-rates',
      title: 'Federal Reserve holds interest rates steady during monetary conclave',
      publishedAt: baseArt.publishedAt,
    });
    assert.strictEqual(similarStory.isExactDuplicate, false);
    assert.strictEqual(similarStory.isSimilarStory, true);
  });

  // ==========================================
  // 6. Topic Clustering & Story Similarity Grouping
  // ==========================================
  it('6. Groups similar stories covering the same event to preserve multiple source candidates', () => {
    const articles: Article[] = [
      makeMockArticle({
        id: 'fed-reuters',
        source: 'Reuters',
        title: 'Federal Reserve leaves interest rates unchanged at 5.25 percent',
      }),
      makeMockArticle({
        id: 'fed-ft',
        source: 'Financial Times',
        title: 'Federal Reserve leaves interest rates unchanged as inflation cools',
      }),
      makeMockArticle({
        id: 'fed-cnbc',
        source: 'CNBC',
        title: 'Federal Reserve leaves interest rates unchanged in unanimous vote',
      }),
      makeMockArticle({
        id: 'unrelated-tech',
        source: 'TechCrunch',
        title: 'Cloud Computing Consortium Standardizes AI Datacenter Interconnects',
        category: 'technology',
      }),
    ];

    const { primaryArticles, clusters } = newsRanker.clusterSimilarStories(articles);

    // 3 Fed articles grouped together + 1 tech article = 2 distinct primary stories
    assert.strictEqual(primaryArticles.length, 2);
    const fedPrimary = primaryArticles.find(a => a.id.startsWith('fed-'));
    assert.ok(fedPrimary);

    const corroborating = clusters.get(fedPrimary.id);
    assert.ok(corroborating);
    assert.strictEqual(corroborating.length, 2);
  });

  // ==========================================
  // 7. Source Diversity Capping
  // ==========================================
  it('7. Enforces source diversity capping so no single publisher dominates', () => {
    // Generate 15 distinct topic articles from the same publisher
    const topics = [
      'Industrial Manufacturing Production Expands Across Midwest Hubs',
      'Corporate Credit Spreads Compress to Multi-Year Lows',
      'Commercial Real Estate Syndication Closes Record Tranche',
      'Sovereign Yields Contract in Primary European Syndications',
      'Quarterly Dividend Distributions Beat Consensus Forecasts',
      'Shipping Freight Indices Stabilize Following Port Modernization',
      'Enterprise Software Firms Report Resilient Recurring Revenue',
      'Consumer Confidence Index Advances on Moderate Wage Growth',
      'Automated Clearing House Payment Volumes Hit New Milestone',
      'Automotive Supply Chains Overcome Semiconductor Packaging Delays',
      'Regional Banking Liquidity Ratios Remain Well Above Basle Mandates',
      'Aerospace Propulsion Contracts Finalized for International Carriers',
      'Petrochemical Feedstock Inventories Reach Seasonal Equilibrium',
      'Telecommunications Infrastructure Providers Deepen Fiber Deployments',
      'Packaging Material Suppliers Note Strong Seasonal Agricultural Order Flow',
    ];
    const articles: Article[] = [];
    for (let i = 0; i < 15; i++) {
      articles.push(makeMockArticle({
        id: `dominant-${i}`,
        source: 'DominantWire',
        title: topics[i],
        category: 'finance',
      }));
    }

    const poolResult = newsRanker.buildCandidatePool(articles, {
      editionType: 'finance_economy',
      maxArticlesPerSource: 8,
    });

    const dominantCount = poolResult.candidates.filter(c => c.article.source === 'DominantWire').length;
    assert.strictEqual(dominantCount, 8, `Expected max 8 articles from single source, got ${dominantCount}`);
    assert.strictEqual(poolResult.sourceCapped, 7);
  });

  // ==========================================
  // 8. Category-Aware Filtering
  // ==========================================
  it('8. Applies edition-aware category filtering', () => {
    const articles: Article[] = [
      makeMockArticle({ id: 'fin-1', category: 'finance', title: 'Syndicated Corporate Lending Facilities Expand Across Centers' }),
      makeMockArticle({ id: 'eco-1', category: 'economy', title: 'Consumer Price Index Increases at Slower Annual Pace' }),
      makeMockArticle({ id: 'mkt-1', category: 'markets', title: 'S&P 500 Closes Higher in Broad Afternoon Rally' }),
      makeMockArticle({ id: 'world-1', category: 'world', title: 'Diplomatic Delegations Convene for Bilateral Trade Summit' }),
      makeMockArticle({ id: 'tech-1', category: 'technology', title: 'Semiconductor Foundries Report Higher Wafer Volume' }),
      makeMockArticle({ id: 'crypto-1', category: 'crypto', title: 'Institutional Bitcoin Custody Framework Finalized' }),
      makeMockArticle({ id: 'nat-1', category: 'national', title: 'Bank Indonesia Holds Seven-Day Reverse Repo Rate' }),
    ];

    // Finance + Economy Edition excludes pure tech and world news
    const finEcoPool = newsRanker.buildCandidatePool(articles, { editionType: 'finance_economy' });
    const finEcoCats = finEcoPool.candidates.map(c => c.article.category);
    assert.ok(finEcoCats.includes('finance'));
    assert.ok(finEcoCats.includes('economy'));
    assert.ok(!finEcoCats.includes('world'));
    assert.ok(!finEcoCats.includes('technology'));

    // Daily Edition includes world, national, tech, business, finance, etc.
    const dailyPool = newsRanker.buildCandidatePool(articles, { editionType: 'daily' });
    const dailyCats = dailyPool.candidates.map(c => c.article.category);
    assert.ok(dailyCats.includes('world'));
    assert.ok(dailyCats.includes('technology'));
    assert.ok(dailyCats.includes('finance'));
  });

  // ==========================================
  // 9. Freshness Window Filtering
  // ==========================================
  it('9. Retains articles within 36h freshness window and filters older ones', () => {
    const nowMs = Date.now();
    const fresh2h = new Date(nowMs - 2 * 60 * 60 * 1000).toISOString();
    const fresh24h = new Date(nowMs - 24 * 60 * 60 * 1000).toISOString();
    const stale48h = new Date(nowMs - 48 * 60 * 60 * 1000).toISOString();

    const articles: Article[] = [
      makeMockArticle({ id: 'art-2h', publishedAt: fresh2h, title: 'Central Bank Convenes Policy Assembly' }),
      makeMockArticle({ id: 'art-24h', publishedAt: fresh24h, title: 'Energy Pipelines Complete Scheduled Maintenance' }),
      makeMockArticle({ id: 'art-48h', publishedAt: stale48h, title: 'Outdated Quarterly Refunding Document' }),
    ];

    const pool = newsRanker.buildCandidatePool(articles, { freshnessHours: 36 });
    const poolIds = pool.candidates.map(c => c.article.id);

    assert.ok(poolIds.includes('art-2h'));
    assert.ok(poolIds.includes('art-24h'));
    assert.ok(!poolIds.includes('art-48h'));
    assert.strictEqual(pool.freshnessFiltered, 1);
  });

  // ==========================================
  // 10. Image Handling: Text-Only and Original Preservation
  // ==========================================
  it('10. Preserves original images with isAiGenerated: false and supports text-only stories', async () => {
    const withImage = makeMockArticle({
      id: 'art-img',
      imageUrl: 'https://images.example.com/verified-photo.jpg',
      imageUsageStatus: 'source_provided',
      title: 'Premier Financial Journal Dispatch With Image',
    });

    const withoutImage = makeMockArticle({
      id: 'art-no-img',
      imageUrl: null,
      imageUsageStatus: 'unavailable',
      title: 'Text Only Breaking Financial Report',
    });

    const candidates = [
      {
        article: withImage,
        score: 90,
        breakdown: { freshness: 25, sourcePriority: 25, categoryRelevance: 20, completeness: 10, sourceDiversity: 10, total: 90 },
        corroboratingSources: [],
      },
      {
        article: withoutImage,
        score: 85,
        breakdown: { freshness: 22, sourcePriority: 25, categoryRelevance: 20, completeness: 8, sourceDiversity: 10, total: 85 },
        corroboratingSources: [],
      },
    ];

    // Use deterministic selector to inspect story objects
    const stories = editorialCandidateSelector.selectDeterministically(candidates, 2);
    assert.strictEqual(stories.length, 2);

    // Article with image preserves original photo and flags isAiGenerated as false
    assert.ok(stories[0].image);
    assert.strictEqual(stories[0].image.url, 'https://images.example.com/verified-photo.jpg');
    assert.strictEqual(stories[0].image.isAiGenerated, false);

    // Article without image renders cleanly without photo
    assert.strictEqual(stories[1].image, undefined);
  });

  // ==========================================
  // 11. Low Article Count Handling
  // ==========================================
  it('11. Handles low article count gracefully without throwing or fabricating', async () => {
    const articles = [
      makeMockArticle({ id: 'single-1', title: 'Solitary Verified Market Headline' }),
    ];

    const pool = newsRanker.buildCandidatePool(articles, { editionType: 'daily' });
    assert.strictEqual(pool.candidates.length, 1);

    const stories = await editorialCandidateSelector.selectStories(pool.candidates, {
      editionType: 'daily',
      useAi: false,
    });
    assert.strictEqual(stories.length, 1);
    assert.strictEqual(stories[0].headline, 'Solitary Verified Market Headline');
  });

  // ==========================================
  // 12. High Article Count & Target Pool Capping
  // ==========================================
  it('12. Aggregates large candidate pool and caps to configured target limits', () => {
    const categories: Article['category'][] = ['finance', 'economy', 'markets', 'world', 'technology', 'business'];
    const subjects = [
      'Treasury Yield Curve Inverts on Jobs Surge',
      'Crude Tanker Rates Spike Post Canal Closure',
      'Battery Foundry Expands Cathode Output',
      'Retail Spending Advances Heading Into Winter',
      'Sovereign Fund Buys Fiber Optic Network',
      'Semiconductor Cleanroom Capacity Doubles',
      'Central Bank Injects Overnight Repo Cash',
      'Airframe Deliveries Beat Analyst Targets',
      'Container Terminal Sets Monthly Tonnage Mark',
      'Biotech License Cleared by Trust Commission',
      'Forex Desk Sees Unprecedented Dollar Bid',
      'Grain Silos Overflow Following Bumper Harvest',
      'Steel Mill Modernization Nears Final Phase',
      'Uranium Enrichment Facility Restarts Centrifuges',
      'Electric Grid Adds Mega Battery Storage',
      'Mortgage Refinance Index Rebounds Strongly',
      'Automated Clearing Network Volume Jumps',
      'Paper Packaging Demand Reflects Solid Trade',
      'Gold Bullion Reserves Hit Historic Apex',
      'Lithium Brine Extraction Wells Completed',
      'Corporate Debt Spread Compresses Near Bottom',
      'Automotive Assembly Plants Resume Normal Shifts',
      'Commercial Property Foreclosure Rate Drops',
      'Software Enterprise Billings Exceed Guidance',
      'Maritime Shipping Lane Opens Icebreaker Route',
      'Aluminum Smelter Signs Renewable Power Pact',
      'Rare Earth Mining Concession Approved by State',
      'Pension Fund Shifts Capital to Sovereign Bills',
      'Chemical Synthesis Plant Debottlenecks Pipeline',
      'Broadband Satellite Constellation Deploys Batch',
      'Copper Warehouses Experience Inventory Outflow',
      'Consumer Confidence Index Registers Uptick',
      'Titanium Forging Presses Begin Full Operation',
      'Wind Turbine Farm Cleared for Offshore Grid',
      'Petrochemical Cracker Resumes Ethylene Delivery',
      'Hydroelectric Reservoir Levels Replenished',
      'Industrial Robot Installations Hit New High',
      'Air Cargo Ton-Kilometers Rise Sequentially',
      'Subsea Telecom Cable Landed on Island Coast',
      'Coffee Bean Futures Rally Amid Frost Concerns',
      'Natural Gas Storage Injections Outpace Norms',
      'Heavy Truck Orders Indicate Freight Vitality',
      'Commercial Bank Capital Adequacy Strengthens',
      'Cement Manufacturer Cuts Clinker Factor',
      'Railway Carloadings Reflect Robust Bulk Haulage',
      'Solar Cell Efficiency Record Certified in Lab',
      'Lumber Mills Report Steady Homebuilding Orders',
      'Desalination Infrastructure Project Breaks Ground',
      'Export Credit Agency Backs Locomotive Sale',
      'Rubber Commodity Clearing Volumes Expand',
    ];

    const articles: Article[] = [];
    for (let i = 0; i < subjects.length; i++) {
      articles.push(makeMockArticle({
        id: `large-batch-${i}`,
        title: subjects[i],
        category: categories[i % categories.length],
        source: `Publisher_${i % 12}`, // 12 distinct publishers
      }));
    }

    const pool = newsRanker.buildCandidatePool(articles, {
      editionType: 'daily',
      maxPoolSize: 50,
    });

    assert.ok(pool.candidates.length <= 50, `Pool size ${pool.candidates.length} exceeded maxPoolSize 50`);
    assert.ok(pool.candidates.length >= 30, `Pool size ${pool.candidates.length} under target`);
  });

  // ==========================================
  // 13. Deterministic Candidate Ranking
  // ==========================================
  it('13. Deterministically ranks candidates giving priority to freshness, source reputation, and completeness', () => {
    const nowMs = Date.now();
    const freshArticle = makeMockArticle({
      id: 'fresh-high-prio',
      sourceId: 'bbc_world', // Priority 92
      publishedAt: new Date(nowMs - 1 * 60 * 60 * 1000).toISOString(), // 1h ago
      title: 'Major Sovereign Treaty Finalized Across Western Hemisphere',
      description: 'Comprehensive detailed text describing the multilateral fiscal and economic provisions of the agreement.',
    });

    const olderArticle = makeMockArticle({
      id: 'older-low-prio',
      sourceId: 'unknown_blog',
      publishedAt: new Date(nowMs - 30 * 60 * 60 * 1000).toISOString(), // 30h ago
      title: 'Brief Unverified Rumor',
      description: 'Short note.',
    });

    const pool = newsRanker.buildCandidatePool([olderArticle, freshArticle], { editionType: 'daily' });
    assert.strictEqual(pool.candidates[0].article.id, 'fresh-high-prio');
    assert.ok(pool.candidates[0].score > pool.candidates[1].score);
  });

  // ==========================================
  // 14. Observability Diagnostics Report Formatter
  // ==========================================
  it('14. Formats complete RSS diagnostics report accurately for development observability', () => {
    const report: RssDiagnosticsReport = {
      feedsConfigured: 18,
      feedsSuccessful: 17,
      feedsFailed: 1,
      failedFeedsList: [{ id: 'mock_timeout_feed', error: 'Timeout after 8000ms' }],
      rawArticlesFetched: 195,
      invalidArticles: 4,
      exactDuplicatesRemoved: 16,
      uniqueArticles: 175,
      similarityGroups: 24,
      articlesAfterFiltering: 42,
      articlesPerCategory: { finance: 12, markets: 11, economy: 10, world: 9 },
      articlesPerSource: { Bloomberg: 8, Reuters: 7, CNBC: 6 },
      editorialCandidatePoolSize: 42,
      finalSelectedStoriesCount: 15,
      durationMs: 3420,
    };

    const text = formatRssDiagnosticsReport(report);
    assert.ok(text.includes('18 configured'));
    assert.ok(text.includes('17 successful'));
    assert.ok(text.includes('1 failed'));
    assert.ok(text.includes('mock_timeout_feed: Timeout after 8000ms'));
    assert.ok(text.includes('195 fetched'));
    assert.ok(text.includes('16 exact duplicates removed'));
    assert.ok(text.includes('Editorial Candidate Pool: 42'));
    assert.ok(text.includes('Final Selected Stories: 15'));
  });
});
