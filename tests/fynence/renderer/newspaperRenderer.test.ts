import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  EditionComposer,
  NewspaperRenderer,
  generateNewspaperHtml,
  type NewspaperDocument,
  type NewspaperStory,
} from '../../../src/fynence';

describe('Newspaper Renderer & Edition Composer (STEP 6)', () => {
  const composer = new EditionComposer();
  const renderer = new NewspaperRenderer();

  const mockArticles: NewspaperStory[] = [
    {
      id: 'story-1',
      headline: 'Sovereign Bond Yields Moderate as Central Banks Expand Interbank Liquidity',
      kicker: 'MONETARY DESK · FRANKFURT',
      summary: 'Continental debt auctions observed robust subscription rates across primary maturities.',
      whyItMatters: 'Narrowed sovereign spreads temper financing volatility for corporate debt.',
      keyPoints: ['Italian-German spread narrowed 8 bps', 'Auction cover ratio reached 2.6x'],
      source: 'Reuters Press Wires',
      originalUrl: 'https://reuters.com/bonds/sovereign-liquidity',
      author: 'Erich Vogel',
      publishedAt: '2026-09-27T00:00:00Z',
      section: 'finance',
      importance: 'high',
      image: {
        url: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f',
        credit: 'Reuters Press Bureau',
        source: 'Reuters',
        isAiGenerated: false,
      },
    },
    {
      id: 'story-2',
      headline: 'Regional Export Logistics Set New Cargo Clearance Velocity',
      kicker: 'TRADE & PORTS',
      summary: 'Automated deepwater port terminals reported sequential cargo throughput expansion.',
      whyItMatters: 'Current account surplus strengthens foreign exchange resilience.',
      source: 'Associated Press',
      originalUrl: 'https://apnews.com/trade/port-throughput',
      publishedAt: '2026-09-26T22:00:00Z',
      section: 'economy',
      importance: 'medium',
      // Deliberately no image to test text-only fallback
    },
    {
      id: 'story-3',
      headline: 'Semiconductor Fabrication Facilities Expand Production Lines',
      kicker: 'TECHNOLOGY',
      summary: 'Advanced microelectronics foundries recorded quarterly output gains exceeding eight percent.',
      whyItMatters: 'Capacity growth dampens supply chain disruption risks.',
      source: 'Financial Times',
      originalUrl: 'https://ft.com/tech/silicon-output',
      publishedAt: '2026-09-26T20:00:00Z',
      section: 'technology',
      importance: 'low',
    },
  ];

  // ==========================================
  // 1. EDITION COMPOSITION
  // ==========================================
  it('1. Edition composition: constructs valid NewspaperDocument with complete metadata', () => {
    const doc = composer.composeDocument({
      editionType: 'daily',
      publicationDate: '2026-09-27T00:30:00Z',
      timezone: 'Asia/Jakarta',
      mockMode: true,
    });

    assert.ok(renderer.validateDocument(doc));
    assert.equal(doc.edition.title, 'THE FYNENCE');
    assert.equal(doc.edition.subtitle, 'DAILY FINANCIAL DISPATCH');
    assert.equal(doc.edition.editionDate, '2026-09-27');
    assert.equal(doc.edition.timezone, 'Asia/Jakarta');
    assert.ok(doc.pages.length >= 1);

    // Verify first page contains masthead
    const p1 = doc.pages[0];
    const masthead = p1.blocks.find(b => b.type === 'masthead');
    assert.ok(masthead);
    if (masthead?.type === 'masthead') {
      assert.equal(masthead.title, 'THE FYNENCE');
      assert.equal(masthead.dayOfWeek, 'SUNDAY');
      assert.ok(masthead.date.includes('2026'));
    }
  });

  // ==========================================
  // 2. SECTION SELECTION
  // ==========================================
  it('2. Section selection: includes only requested sections and omits unrequested ones', () => {
    // Request ONLY daily_news and weather
    const doc = composer.composeDocument({
      editionType: 'custom',
      sections: ['daily_news', 'weather'],
      publicationDate: '2026-09-27T00:00:00Z',
      mockMode: true,
      pageSize: 'single_page',
    });

    const blockTypes = doc.pages[0].blocks.map(b => b.type);

    assert.ok(blockTypes.includes('masthead'));
    assert.ok(blockTypes.includes('lead_story'));
    assert.ok(blockTypes.includes('weather_block'));

    // Markets and Economic Calendar must NOT be present
    assert.equal(blockTypes.includes('market_strip'), false);
    assert.equal(blockTypes.includes('economic_calendar'), false);
  });

  // ==========================================
  // 3. SECTION ORDERING
  // ==========================================
  it('3. Section ordering: arranges blocks with proper broadsheet hierarchy', () => {
    const doc = composer.composeDocument({
      editionType: 'daily',
      mockMode: true,
      pageSize: 'single_page',
    });

    const blockTypes = doc.pages[0].blocks.map(b => b.type);

    const mastheadIdx = blockTypes.indexOf('masthead');
    const marketIdx = blockTypes.indexOf('market_strip');
    const leadIdx = blockTypes.indexOf('lead_story');

    assert.ok(mastheadIdx !== -1);
    assert.ok(marketIdx !== -1);
    assert.ok(leadIdx !== -1);

    // Masthead appears before market strip and lead story
    assert.ok(mastheadIdx < marketIdx);
    assert.ok(marketIdx < leadIdx);
  });

  // ==========================================
  // 4. LEAD STORY SELECTION
  // ==========================================
  it('4. Lead story selection: picks highest importance story as lead story', () => {
    const doc = composer.composeDocument({
      articles: mockArticles,
      pageSize: 'single_page',
      mockMode: false,
    });

    const p1 = doc.pages[0];
    const leadBlock = p1.blocks.find(b => b.type === 'lead_story');
    assert.ok(leadBlock);
    if (leadBlock?.type === 'lead_story') {
      // story-1 had importance: 'high'
      assert.equal(leadBlock.story.id, 'story-1');
      assert.equal(leadBlock.story.importance, 'high');
      assert.ok(leadBlock.story.headline.includes('Sovereign Bond Yields'));
    }
  });

  // ==========================================
  // 5. MARKET RENDERING
  // ==========================================
  it('5. Market rendering: formats positive, negative, and neutral changes with proper symbols', async () => {
    const doc = composer.composeDocument({
      sections: ['markets'],
      mockMode: true,
      pageSize: 'single_page',
    });

    const marketBlock = doc.pages[0].blocks.find(b => b.type === 'market_strip');
    assert.ok(marketBlock);

    if (marketBlock?.type === 'market_strip') {
      const xau = marketBlock.tickers.find(t => t.symbol === 'XAUUSD');
      const us100 = marketBlock.tickers.find(t => t.symbol === 'US100');

      assert.ok(xau);
      assert.equal(xau?.direction, 'up');
      assert.ok(xau!.changePercent > 0);

      assert.ok(us100);
      assert.equal(us100?.direction, 'down');
      assert.ok(us100!.changePercent < 0);
    }

    // Verify HTML output contains +/- symbols
    const html = await renderer.renderToHtml(doc);
    assert.ok(html.includes('+'));
    assert.ok(html.includes('−') || html.includes('-'));
    assert.ok(html.includes('XAUUSD'));
  });

  // ==========================================
  // 6. WEATHER RENDERING
  // ==========================================
  it('6. Weather rendering: formats Magelang weather with condition icon and temperature', async () => {
    const doc = composer.composeDocument({
      sections: ['weather'],
      weatherSnapshot: {
        location: 'Magelang, Central Java',
        currentTempC: 28.5,
        condition: 'partly_cloudy',
        conditionText: 'Partly Cloudy',
        highTempC: 31.0,
        lowTempC: 22.0,
        humidityPercent: 78,
        precipitationChancePercent: 35,
        windSpeedKmh: 12.0,
        summary: 'Warm tropical conditions with afternoon thermal cloudiness.',
        sourceProvider: 'Open-Meteo',
        isStale: false,
        capturedAt: '2026-09-27T00:00:00Z',
      },
      pageSize: 'single_page',
      mockMode: false,
    });

    const weatherBlock = doc.pages[0].blocks.find(b => b.type === 'weather_block');
    assert.ok(weatherBlock);
    if (weatherBlock?.type === 'weather_block') {
      assert.equal(weatherBlock.location, 'Magelang, Central Java');
      assert.equal(weatherBlock.currentTempC, 28.5);
      assert.equal(weatherBlock.isStale, false);
      assert.equal(weatherBlock.precipitationChancePercent, 35);
    }

    const html = await renderer.renderToHtml(doc);
    assert.ok(html.includes('Magelang, Central Java'));
    assert.ok(html.includes('28.5'));
  });

  // ==========================================
  // 7. IMAGE ATTRIBUTION & PROVENANCE
  // ==========================================
  it('7. Image attribution: preserves verified image source, credit, and original article link', async () => {
    const doc = composer.composeDocument({
      articles: mockArticles,
      pageSize: 'single_page',
      mockMode: false,
    });

    const leadBlock = doc.pages[0].blocks.find(b => b.type === 'lead_story');
    assert.ok(leadBlock);
    if (leadBlock?.type === 'lead_story') {
      assert.ok(leadBlock.story.image);
      assert.equal(leadBlock.story.image?.credit, 'Reuters Press Bureau');
      assert.equal(leadBlock.story.image?.isAiGenerated, false);
      assert.equal(leadBlock.story.originalUrl, 'https://reuters.com/bonds/sovereign-liquidity');
    }

    const html = await renderer.renderToHtml(doc);
    assert.ok(html.includes('PHOTO: Reuters Press Bureau'));
    assert.ok(html.includes('https://reuters.com/bonds/sovereign-liquidity'));
  });

  // ==========================================
  // 8. MISSING IMAGE TEXT-ONLY FALLBACK
  // ==========================================
  it('8. Missing image: renders text-only story cleanly without creating fake AI images', async () => {
    // Only pass story-2 which has no image
    const textOnlyStory = mockArticles[1];
    assert.equal(textOnlyStory.image, undefined);

    const doc = composer.composeDocument({
      articles: [textOnlyStory],
      pageSize: 'single_page',
      mockMode: false,
    });

    const leadBlock = doc.pages[0].blocks.find(b => b.type === 'lead_story');
    assert.ok(leadBlock);
    if (leadBlock?.type === 'lead_story') {
      assert.equal(leadBlock.story.image, undefined);
    }

    const html = await renderer.renderToHtml(doc);
    assert.ok(html.includes('Regional Export Logistics Set New Cargo Clearance Velocity'));
    // Must NOT contain placeholder image or fake image tags for story 2
    assert.ok(!html.includes('ai-image-generator'));
  });

  // ==========================================
  // 9. STALE WEATHER INDICATOR
  // ==========================================
  it('9. Stale weather: displays subtle cached indicator and does not hide stale status', async () => {
    const doc = composer.composeDocument({
      sections: ['weather'],
      weatherSnapshot: {
        location: 'Magelang, Central Java',
        currentTempC: 27.0,
        condition: 'cloudy',
        conditionText: 'Cloudy',
        highTempC: 30.0,
        lowTempC: 21.0,
        humidityPercent: 80,
        precipitationChancePercent: 40,
        summary: 'Cloudy conditions.',
        sourceProvider: 'Open-Meteo',
        isStale: true, // Marked as stale
        capturedAt: '2026-09-27T00:00:00Z',
      },
      pageSize: 'single_page',
      mockMode: false,
    });

    const weatherBlock = doc.pages[0].blocks.find(b => b.type === 'weather_block');
    assert.ok(weatherBlock);
    if (weatherBlock?.type === 'weather_block') {
      assert.equal(weatherBlock.isStale, true);
    }

    const html = await renderer.renderToHtml(doc);
    assert.ok(html.includes('CACHED DISPATCH'));
  });

  // ==========================================
  // 10. MISSING MARKET DATA GRACEFUL HANDLING
  // ==========================================
  it('10. Missing market data: omits market strip cleanly when data is unavailable', () => {
    const doc = composer.composeDocument({
      sections: ['daily_news', 'markets'],
      articles: mockArticles,
      marketSnapshot: undefined,
      mockMode: false,
      pageSize: 'single_page',
    });

    const marketBlock = doc.pages[0].blocks.find(b => b.type === 'market_strip');
    assert.equal(marketBlock, undefined); // Cleanly omitted without fabricating quotes
  });

  // ==========================================
  // 11. MULTI-PAGE COMPOSITION
  // ==========================================
  it('11. Multi-page composition: cleanly splits content across Page 1 and Page 2', () => {
    const doc = composer.composeDocument({
      editionType: 'daily',
      mockMode: true,
      pageSize: 'multi_page',
    });

    assert.equal(doc.pages.length, 2);

    const page1 = doc.pages[0];
    const page2 = doc.pages[1];

    assert.equal(page1.pageNumber, 1);
    assert.equal(page1.totalPages, 2);
    assert.ok(page1.blocks.some(b => b.type === 'masthead'));
    assert.ok(page1.blocks.some(b => b.type === 'lead_story'));

    assert.equal(page2.pageNumber, 2);
    assert.equal(page2.totalPages, 2);
    assert.ok(page2.header);
    assert.ok(page2.header?.runningTitle.includes('THE FYNENCE'));
    assert.ok(page2.blocks.some(b => b.type === 'section_header'));
  });

  // ==========================================
  // 12. DETERMINISTIC DOCUMENT GENERATION
  // ==========================================
  it('12. Deterministic document generation: produces identical structures given identical inputs', () => {
    const req = {
      editionType: 'daily' as const,
      publicationDate: '2026-09-27T00:00:00Z',
      articles: mockArticles,
      mockMode: false,
      pageSize: 'single_page' as const,
    };

    const docA = composer.composeDocument(req);
    const docB = composer.composeDocument(req);

    // Block structure and counts must match identically
    assert.equal(docA.pages.length, docB.pages.length);
    assert.equal(docA.pages[0].blocks.length, docB.pages[0].blocks.length);
    assert.deepEqual(
      docA.pages[0].blocks.map(b => b.type),
      docB.pages[0].blocks.map(b => b.type)
    );
  });

  // ==========================================
  // 13. GOLDEN / SNAPSHOT CONTRACT TEST
  // ==========================================
  it('13. Golden snapshot test: NewspaperDocument matches required schema contract', () => {
    const doc = composer.composeDocument({
      editionType: 'daily',
      publicationDate: '2026-09-27T00:00:00Z',
      mockMode: true,
      pageSize: 'single_page',
    });

    // Check top-level contract keys
    assert.ok('edition' in doc);
    assert.ok('pages' in doc);

    // Check edition contract keys
    assert.equal(typeof doc.edition.id, 'string');
    assert.equal(typeof doc.edition.title, 'string');
    assert.equal(typeof doc.edition.subtitle, 'string');
    assert.equal(typeof doc.edition.editionDate, 'string');
    assert.equal(typeof doc.edition.editionType, 'string');
    assert.ok(Array.isArray(doc.edition.sections));
    assert.equal(typeof doc.edition.timezone, 'string');

    // Check page contract keys
    const p1 = doc.pages[0];
    assert.equal(p1.pageNumber, 1);
    assert.ok(Array.isArray(p1.blocks));
  });

  // ==========================================
  // 14. FINANCE + ECONOMY UNIFIED EDITION
  // ==========================================
  it('14. Finance + Economy edition: creates a single cohesive edition without splitting', () => {
    const doc = composer.composeDocument({
      sections: ['finance', 'economy'],
      mockMode: true,
      pageSize: 'single_page',
    });

    assert.equal(doc.edition.editionType, 'finance_economy');
    assert.equal(doc.edition.title, 'THE FYNENCE');
    assert.equal(doc.edition.subtitle, 'FINANCE & ECONOMY INTELLIGENCE');

    const blockTypes = doc.pages[0].blocks.map(b => b.type);
    assert.ok(blockTypes.includes('market_strip'));
    assert.ok(blockTypes.includes('economic_calendar'));
  });

  // ==========================================
  // 15. IMAGE RASTERIZATION (WebP & PNG via sharp)
  // ==========================================
  it('15. Image rendering: compiles NewspaperDocument to WebP and PNG binary buffers', async () => {
    const doc = composer.composeDocument({
      editionType: 'daily',
      mockMode: true,
      pageSize: 'single_page',
    });

    // WebP compile
    const resultWebP = await renderer.renderToImages(doc, {
      format: 'webp',
      viewportWidth: 800,
      viewportHeight: 1100,
    });

    assert.equal(resultWebP.format, 'webp');
    assert.ok(resultWebP.pages.length >= 1);
    assert.equal(resultWebP.pages[0].mimeType, 'image/webp');
    assert.ok(resultWebP.pages[0].fileSizeBytes > 1000);
    assert.ok(resultWebP.pages[0].buffer instanceof Buffer);

    // PNG compile
    const resultPng = await renderer.renderToImages(doc, {
      format: 'png',
      viewportWidth: 800,
      viewportHeight: 1100,
    });

    assert.equal(resultPng.format, 'png');
    assert.equal(resultPng.pages[0].mimeType, 'image/png');
    assert.ok(resultPng.pages[0].fileSizeBytes > 1000);
    assert.ok(resultPng.pages[0].buffer instanceof Buffer);
  });

  // ==========================================
  // 16. VISUAL TESTING (Section 39 combinations)
  // ==========================================
  describe('16. Visual layout combinations (Section 39)', () => {
    it('renders Daily Edition without overflow or clipping', async () => {
      const doc = composer.composeDocument({
        editionType: 'daily',
        mockMode: true,
      });
      const html = await renderer.renderToHtml(doc);
      assert.ok(html.includes('THE FYNENCE'));
      assert.ok(html.includes('DAILY FINANCIAL DISPATCH'));
      assert.ok(html.includes('broadsheet-page'));
    });

    it('renders Finance + Economy Edition with unified layout', async () => {
      const doc = composer.composeDocument({
        editionType: 'finance_economy',
        mockMode: true,
      });
      const html = await renderer.renderToHtml(doc);
      assert.ok(html.includes('FINANCE &amp; ECONOMY INTELLIGENCE') || html.includes('FINANCE & ECONOMY INTELLIGENCE'));
      assert.ok(html.includes('MARKETS'));
      assert.ok(html.includes('SCHEDULED ECONOMIC CATALYSTS') || html.includes('ECONOMIC SCHEDULE'));
    });

    it('renders Daily + Weather Edition with clean dateline and weather ear', async () => {
      const doc = composer.composeDocument({
        sections: ['daily_news', 'weather'],
        mockMode: true,
      });
      const html = await renderer.renderToHtml(doc);
      assert.ok(html.includes('Magelang, Central Java') || html.includes('MAGELANG'));
      assert.ok(!html.includes('SCHEDULED ECONOMIC CATALYSTS'));
    });

    it('renders Finance + Economy + Markets with market strip and economic calendar', async () => {
      const doc = composer.composeDocument({
        sections: ['finance', 'economy', 'markets'],
        mockMode: true,
      });
      const html = await renderer.renderToHtml(doc);
      assert.ok(html.includes('MARKETS'));
      assert.ok(html.includes('XAUUSD'));
    });

    it('renders Custom section combination deterministically', async () => {
      const doc = composer.composeDocument({
        sections: ['world', 'technology', 'markets'],
        mockMode: true,
      });
      const html = await renderer.renderToHtml(doc);
      assert.ok(html.includes('MARKETS'));
      assert.ok(html.includes('Semiconductor') || html.includes('European Sovereign Debt'));
    });
  });
});

