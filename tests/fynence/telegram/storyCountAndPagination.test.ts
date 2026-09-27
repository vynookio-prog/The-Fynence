import test from 'node:test';
import assert from 'node:assert/strict';
import { EditionComposer } from '../../../src/fynence/composer/editionComposer';
import { EditionPipelineService } from '../../../src/fynence/telegram/service/editionPipelineService';
import { TelegramDeliveryService } from '../../../src/fynence/telegram/service/telegramDeliveryService';
import { editorialCandidateSelector } from '../../../src/fynence/editorial/engine/editorialCandidateSelector';
import { newsRanker } from '../../../src/fynence/engine/ranking/newsRanker';
import { MockWeatherProvider } from '../../../src/fynence/weather/providers/mockWeatherProvider';
import { MockMarketDataProvider } from '../../../src/fynence/market/providers/mockMarketProvider';
import { WeatherService } from '../../../src/fynence/weather/service/weatherService';
import { MarketService } from '../../../src/fynence/market/service/marketService';
import type { Article } from '../../../src/fynence/types/article';
import type { NewspaperStory } from '../../../src/fynence/renderer/types/document';

test('Newspaper Story Count (10-15 Stories) & Broadsheet Pagination Suite', async (t) => {
  const composer = new EditionComposer();
  const mockWeatherService = new WeatherService({ primaryProvider: new MockWeatherProvider() });
  const mockMarketService = new MarketService({ marketProvider: new MockMarketDataProvider() });
  const pipeline = new EditionPipelineService({
    weatherService: mockWeatherService,
    marketService: mockMarketService,
  });

  // 1. Daily Edition: 15 stories target across 3 broadsheet pages
  await t.test('1. Daily Edition composes 15 stories across 3 pages', async () => {
    const doc = composer.composeDocument({
      editionType: 'daily',
      sections: ['daily_news', 'world', 'national', 'business', 'finance', 'economy', 'markets'],
      targetStoryCount: 15,
      mockMode: true,
    });

    assert.equal(doc.stories?.length, 15, 'Daily edition must contain exactly 15 stories');
    assert.equal(doc.pages.length, 3, '15 stories must paginate cleanly across 3 broadsheet pages');

    // Page 1: 5 stories (1 lead + 4 grid)
    // Page 2: 5 stories (1 lead + 4 grid)
    // Page 3: 5 stories (1 lead + 4 grid)
    for (let i = 0; i < doc.pages.length; i++) {
      const page = doc.pages[i];
      let pageStoryCount = 0;
      for (const block of page.blocks) {
        if (block.type === 'lead_story' || block.type === 'story') {
          pageStoryCount++;
        } else if (block.type === 'story_grid') {
          pageStoryCount += block.stories.length;
        }
      }
      assert.equal(pageStoryCount, 5, `Page ${i + 1} must contain exactly 5 stories`);
    }
  });

  // 2. Finance + Economy Edition: 15 stories target across 3 broadsheet pages
  await t.test('2. Finance + Economy Edition composes 15 stories across 3 pages', async () => {
    const doc = composer.composeDocument({
      editionType: 'finance_economy',
      sections: ['finance', 'economy', 'business', 'markets'],
      targetStoryCount: 15,
      mockMode: true,
    });

    assert.equal(doc.stories?.length, 15, 'Finance + Economy edition must contain 15 stories');
    assert.equal(doc.pages.length, 3, 'Finance + Economy edition must paginate across 3 pages');
  });

  // 3. Markets Edition: 12 stories target across pages
  await t.test('3. Markets Edition composes 12 stories', async () => {
    const doc = composer.composeDocument({
      editionType: 'market',
      sections: ['markets', 'forex', 'finance', 'economy'],
      targetStoryCount: 12,
      mockMode: true,
    });

    assert.equal(doc.stories?.length, 12, 'Markets edition must target 12 stories');
    assert.ok(doc.pages.length >= 2, '12 stories should span at least 2-3 pages');
  });

  // 4. Strict Non-Fabrication: If only 7 valid stories exist, return exactly 7 (do not invent)
  await t.test('4. Non-fabrication: Never invents stories when fewer than target exist', async () => {
    const titles = [
      'Federal Reserve Holds Overnight Lending Rate Steady at Conclave',
      'European Sovereign Debt Auction Witnesses Robust Bidding Metrics',
      'Bank of Japan Considers Gradual Policy Normalization Pathway',
      'Crude Oil Futures Advance Following Commercial Inventory Drawdown',
      'Syndicated Corporate Lending Facilities Expand Across Centers',
      'Consumer Price Index Advances at Slower Annual Pace',
      'Institutional Investment Mandates Shift Toward Renewable Infrastructure',
    ];
    const limitedArticles: Article[] = titles.map((title, i) => ({
      id: `real-art-${i + 1}`,
      title,
      description: `Verified reporting on fiscal and monetary policy developments regarding ${title}.`,
      url: `https://reuters.example.com/story-${i + 1}`,
      source: `Publisher_${i % 3}`,
      category: 'finance',
      publishedAt: new Date().toISOString(),
    }));

    const pool = newsRanker.buildCandidatePool(limitedArticles, { editionType: 'finance_economy' });
    const selected = await editorialCandidateSelector.selectStories(pool.candidates, {
      editionType: 'finance_economy',
      targetCount: 15, // target is 15, but only 7 exist
      useAi: false,
    });

    assert.equal(selected.length, 7, 'Must return exactly 7 stories when only 7 exist (no hallucination/fabrication)');
  });

  // 5. Fallback Backfill: If initial AI selection is partial, backfills to target from candidates
  await t.test('5. Fallback Selection: Deterministically backfills remaining candidates to reach target', async () => {
    const distinctTopics = [
      'Federal Reserve Holds Overnight Lending Rate Steady at Conclave',
      'European Sovereign Debt Auction Witnesses Robust Bidding Metrics',
      'Bank of Japan Considers Gradual Policy Normalization Pathway',
      'Crude Oil Futures Advance Following Commercial Inventory Drawdown',
      'Syndicated Corporate Lending Facilities Expand Across Centers',
      'Consumer Price Index Advances at Slower Annual Pace',
      'Institutional Investment Mandates Shift Toward Renewable Infrastructure',
      'Corporate Credit Spreads Compress to Multi-Year Historic Lows',
      'Treasury Yield Curve Steepens Following Employment Statistics',
      'Wholesale Trade Inventories Match Electronic Point-of-Sale Pace',
      'Commercial Real Estate Syndication Closes Structured Senior Tranche',
      'Global Semiconductor Foundry Capacity Expands on Packaging Orders',
      'Maritime Shipping Freight Tariffs Normalize on Pacific Lanes',
      'Commercial Paper Clearing Volume Expands Past Seasonal Averages',
      'Automotive Supply Chain Assembly Bottlenecks Resolved',
      'Central Bank Digital Currency Pilot Completes Interbank Test',
      'Petrochemical Feedstock Spot Quotations Stabilize Near Support',
      'Aerospace Manufacturer Finalizes Widebody Engine Procurement',
      'Retail Disposable Income Advances on Modest Average Hourly Earnings',
      'Sovereign Wealth Syndicate Allocates Fresh Tranche to Clean Power',
    ];
    const poolArticles: Article[] = distinctTopics.map((title, i) => ({
      id: `pool-art-${i + 1}`,
      title,
      description: `Detailed economic analysis covering sovereign debt and markets regarding ${title}.`,
      url: `https://wire.example.com/story-${i + 1}`,
      source: `Publisher_${i % 5}`,
      category: i % 2 === 0 ? 'finance' : 'economy',
      publishedAt: new Date().toISOString(),
    }));

    const pool = newsRanker.buildCandidatePool(poolArticles, { editionType: 'finance_economy' });
    assert.ok(pool.candidates.length >= 15, 'Candidate pool must be large enough');

    const selected = await editorialCandidateSelector.selectStories(pool.candidates, {
      editionType: 'finance_economy',
      targetCount: 15,
      useAi: false,
    });

    assert.equal(selected.length, 15, 'Must reach full target count of 15 stories from candidate pool');
    // Verify all 15 are distinct
    const ids = new Set(selected.map(s => s.originalUrl));
    assert.equal(ids.size, 15, 'All 15 stories must be distinct');
  });

  // 6. Telegram Pipeline: Multi-page edition generation & all-page image delivery
  await t.test('6. Telegram Pipeline generates 3-page edition and delivers all pages', async () => {
    const sentPhotos: any[] = [];
    const mockApi: any = {
      sendPhoto: async (chatId: number, file: any, options?: any) => {
        const msg = { message_id: sentPhotos.length + 1, chat: { id: chatId }, file, options };
        sentPhotos.push(msg);
        return msg;
      },
      sendDocument: async (chatId: number, file: any, options?: any) => {
        const msg = { message_id: sentPhotos.length + 1, chat: { id: chatId }, file, options };
        sentPhotos.push(msg);
        return msg;
      },
    };
    const deliveryService = new TelegramDeliveryService(mockApi);

    const result = await pipeline.generateEdition({
      requestId: 'req-multi-page-test',
      source: 'telegram',
      chatId: 999,
      telegramUserId: 999,
      editionType: 'daily',
      sections: ['daily_news', 'world', 'national', 'business', 'finance', 'economy', 'markets'],
      format: 'both',
      targetStoryCount: 15,
      mockMode: true,
      createdAt: new Date().toISOString(),
    });

    assert.equal(result.success, true);
    assert.ok(result.imagePages, 'Result must contain imagePages array');
    assert.equal(result.imagePages!.length, 3, 'Must render exactly 3 image pages for 15 stories');
    assert.ok(result.pdfBuffer && result.pdfBuffer.length > 0, 'PDF buffer must be generated');

    // Deliver all pages
    const deliveryRecords = await deliveryService.deliverEditionAllPages(999, result, 'Complete Broadsheet Edition');
    assert.equal(deliveryRecords.length, 3, 'All 3 broadsheet pages must be delivered');
    assert.equal(sentPhotos.length, 3, '3 photo messages must be dispatched to Telegram');
  });
});
