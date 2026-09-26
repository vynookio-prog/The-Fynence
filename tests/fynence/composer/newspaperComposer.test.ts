import test from 'node:test';
import assert from 'node:assert/strict';
import { BroadsheetLayoutPlanner } from '../../../src/fynence/composer/layout/broadsheetLayoutPlanner';
import { NewspaperComposerService } from '../../../src/fynence/composer/service/newspaperComposerService';
import type { ArticleEditorialSummary } from '../../../src/fynence/types/article';
import type { EditionConfig } from '../../../src/fynence/types/edition';
import type { MarketSnapshot } from '../../../src/fynence/types/market';
import type { WeatherSnapshot } from '../../../src/fynence/types/weather';

function createMockArticles(): ArticleEditorialSummary[] {
  return [
    {
      headline: 'Sovereign Debt Demand Surges Across Continental European Hubs',
      summary: 'Institutional appetite for ten-year benchmark issues marked significant expansion during morning fixings.',
      whyItMatters: 'Lower sovereign financing costs provide tailwinds for capital expenditure and trade balance.',
      keyPoints: ['Italian and German spread narrowed 12 basis points', 'Auction recorded 2.8x cover ratio'],
      primarySection: 'finance',
      importance: 'high',
      sourceArticles: [{ id: '1', title: 'Debt Surges', source: 'Reuters', url: 'https://example.com/1' }],
      model: 'gemini-1.5-pro',
      promptVersion: '1.0.0',
      generatedAt: '2026-09-27T00:00:00Z',
    },
    {
      headline: 'Semiconductor Fabrication Facilities Expand Domestic Output',
      summary: 'Advanced chip manufacturing capacity rose 8% quarterly in newly commissioned regional hubs.',
      whyItMatters: 'Supply chain resilience mitigates historical electronic bottleneck risks.',
      primarySection: 'technology',
      importance: 'medium',
      sourceArticles: [{ id: '2', title: 'Chip Capacity', source: 'AP', url: 'https://example.com/2' }],
      model: 'gemini-1.5-pro',
      promptVersion: '1.0.0',
      generatedAt: '2026-09-27T00:00:00Z',
    },
  ];
}

function createMockMarketSnapshot(): MarketSnapshot {
  return {
    id: 'snap-001',
    capturedAt: '2026-09-27T00:00:00Z',
    asOfDate: '2026-09-27',
    overallSentiment: 'BULLISH',
    sentimentHeadline: 'Equity indices advance as sovereign yields stabilize.',
    sourceProvider: 'twelve_data',
    quotesData: {
      XAUUSD: {
        symbol: 'XAUUSD',
        providerSymbol: 'XAU/USD',
        displayName: 'Gold (Troy Ounce)',
        category: 'commodity',
        price: 2650.50,
        change: 15.20,
        changePercent: 0.58,
        direction: 'UP',
        timestamp: '2026-09-27T00:00:00Z',
        source: 'twelve_data',
      },
      US30: {
        symbol: 'US30',
        providerSymbol: 'DJI',
        displayName: 'Dow Jones Industrial Average',
        category: 'index',
        price: 42100.00,
        change: 220.00,
        changePercent: 0.53,
        direction: 'UP',
        timestamp: '2026-09-27T00:00:00Z',
        source: 'twelve_data',
      },
    },
  };
}

function createMockWeatherSnapshot(): WeatherSnapshot {
  return {
    location: 'Magelang, Jawa Tengah, Indonesia',
    capturedAt: '2026-09-27T00:00:00Z',
    condition: 'partly_cloudy',
    conditionText: 'Partly Cloudy with Humid Breeze',
    currentTempC: 28.0,
    highTempC: 32.0,
    lowTempC: 23.0,
    humidityPercent: 75,
    precipitationChancePercent: 30,
    summary: 'Mild tropical trade winds.',
    sourceProvider: 'open_meteo',
  };
}

test('BroadsheetLayoutPlanner: constructs complete structured newspaper JSON', () => {
  const planner = new BroadsheetLayoutPlanner();
  const config: EditionConfig = {
    title: 'THE FYNENCE',
    subtitle: 'RETRO FINANCIAL CHRONICLE',
    theme: 'retro_black_cream',
    format: 'webp',
    sections: ['top_story', 'finance', 'technology', 'markets', 'weather', 'economic_calendar'],
  };

  const articles = createMockArticles();
  const marketSnapshot = createMockMarketSnapshot();
  const weatherSnapshot = createMockWeatherSnapshot();
  const economicEvents = [
    { event_time: '2026-09-27T12:30:00Z', currency: 'USD', event_name: 'Core CPI Index', impact: 'HIGH', forecast: '0.3%' },
  ];

  const structuredData = planner.planNewspaper(
    config,
    articles,
    marketSnapshot,
    weatherSnapshot,
    economicEvents,
    '2026-09-27T00:00:00Z'
  );

  // Validate Header
  assert.equal(structuredData.header.title, 'THE FYNENCE');
  assert.ok(structuredData.header.volumeNumber?.startsWith('VOL.'));
  assert.equal(structuredData.header.motto, 'VERITAS IN NUMERIS');
  assert.equal(structuredData.header.dayOfWeek, 'SUNDAY');

  // Validate Lead Story
  const lead = structuredData.sections.find((s) => s.type === 'top_story');
  assert.ok(lead);
  if (lead && lead.type === 'top_story') {
    assert.equal(lead.columnSpan, 3);
    assert.equal(lead.headline, 'Sovereign Debt Demand Surges Across Continental European Hubs');
  }

  // Validate Market Tickers
  const marketSection = structuredData.sections.find((s) => s.type === 'markets');
  assert.ok(marketSection);
  if (marketSection && marketSection.type === 'markets') {
    assert.equal(marketSection.marketMood, 'BULLISH');
    assert.equal(marketSection.tickers.length, 2);
    assert.equal(marketSection.tickers[0].symbol, 'XAUUSD');
    assert.equal(marketSection.tickers[0].direction, 'up');
  }

  // Validate Weather Section
  const weatherSection = structuredData.sections.find((s) => s.type === 'weather');
  assert.ok(weatherSection);
  if (weatherSection && weatherSection.type === 'weather') {
    assert.equal(weatherSection.currentTempC, 28.0);
    assert.equal(weatherSection.conditionIconText, '⛅');
  }

  // Validate Footer
  assert.ok(structuredData.footer.colophon.includes('THE FYNENCE'));
});

test('NewspaperComposerService: validates composition completeness against configuration', async () => {
  const composer = new NewspaperComposerService();
  const config: EditionConfig = {
    title: 'THE FYNENCE',
    subtitle: 'RETRO FINANCIAL CHRONICLE',
    theme: 'retro_black_cream',
    format: 'webp',
    sections: ['top_story', 'markets', 'weather', 'economic_calendar'],
  };

  const payload = {
    config,
    articles: createMockArticles(),
    marketSnapshot: createMockMarketSnapshot(),
    weatherSnapshot: createMockWeatherSnapshot(),
    economicEvents: [{ currency: 'USD', event_name: 'Fed Rate Decision', impact: 'high' }],
    publicationDate: '2026-09-27T00:00:00Z',
  };

  const edition = await composer.composeEdition(payload);
  const completeness = composer.validateCompositionCompleteness(config, edition);

  assert.equal(completeness.isComplete, true);
  assert.equal(completeness.missingSections.length, 0);

  // When config demands a section not present in edition
  const strictConfig: EditionConfig = {
    ...config,
    sections: [...config.sections, 'custom_missing_section' as any],
  };

  const missingCheck = composer.validateCompositionCompleteness(strictConfig, edition);
  assert.equal(missingCheck.isComplete, false);
  assert.ok(missingCheck.missingSections.includes('custom_missing_section'));
});
