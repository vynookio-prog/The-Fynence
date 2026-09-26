import test from 'node:test';
import assert from 'node:assert/strict';
import { RetroNewspaperRenderer } from '../../../src/fynence/renderer/service/retroNewspaperRenderer';
import { BroadsheetLayoutPlanner } from '../../../src/fynence/composer/layout/broadsheetLayoutPlanner';
import type { EditionConfig } from '../../../src/fynence/types/edition';
import type { StructuredNewspaperData } from '../../../src/fynence/types/newspaper';

function createSampleNewspaperData(): StructuredNewspaperData {
  const planner = new BroadsheetLayoutPlanner();
  const config: EditionConfig = {
    title: 'THE FYNENCE',
    subtitle: 'RETRO FINANCIAL CHRONICLE',
    theme: 'retro_black_cream',
    format: 'webp',
    sections: ['top_story', 'markets', 'weather', 'economic_calendar'],
  };

  return planner.planNewspaper(
    config,
    [
      {
        headline: 'Global Central Banks Coordinate Interbank Liquidity Facility',
        summary: 'Emergency currency swap agreements were extended across major monetary authorities.',
        whyItMatters: 'Currency stability prevents volatility spikes in cross-border settlements.',
        keyPoints: ['Swap lines bolstered by $50B', 'Three central banks participate'],
        primarySection: 'finance',
        importance: 'high',
        model: 'gemini-1.5-pro',
        promptVersion: '1.0.0',
        generatedAt: '2026-09-27T00:00:00Z',
      },
    ],
    {
      id: 'snap-1',
      capturedAt: '2026-09-27T00:00:00Z',
      asOfDate: '2026-09-27',
      overallSentiment: 'BULLISH',
      sentimentHeadline: 'Markets rally on monetary stability.',
      sourceProvider: 'twelve_data',
      quotesData: {
        XAUUSD: {
          symbol: 'XAUUSD',
          providerSymbol: 'XAU/USD',
          displayName: 'Gold',
          category: 'commodity',
          price: 2650.00,
          change: 12.00,
          changePercent: 0.45,
          direction: 'UP',
          timestamp: '2026-09-27T00:00:00Z',
          source: 'twelve_data',
        },
      },
    },
    {
      location: 'Magelang, Jawa Tengah',
      capturedAt: '2026-09-27T00:00:00Z',
      condition: 'clear_day',
      conditionText: 'Fair & Sunny',
      currentTempC: 27.5,
      highTempC: 31.0,
      lowTempC: 22.0,
      humidityPercent: 70,
      precipitationChancePercent: 10,
      summary: 'Equable meteorological conditions prevailing.',
      sourceProvider: 'mock_weather',
    },
    [
      { event_time: '2026-09-27T13:30:00Z', currency: 'USD', event_name: 'Core Retail Sales', impact: 'HIGH', forecast: '0.4%' },
    ],
    '2026-09-27T00:00:00Z'
  );
}

test('RetroNewspaperRenderer: validateContract checks required schema fields', () => {
  const renderer = new RetroNewspaperRenderer();
  const validData = createSampleNewspaperData();

  assert.equal(renderer.validateContract(validData), true);

  // Missing metadata schema
  const invalidData1 = { ...validData, metadata: { ...validData.metadata, schemaVersion: '2.0.0' as any } };
  assert.equal(renderer.validateContract(invalidData1), false);

  // Missing sections
  const invalidData2 = { ...validData, sections: [] };
  assert.equal(renderer.validateContract(invalidData2), false);

  // Null input
  assert.equal(renderer.validateContract(null as any), false);
});

test('RetroNewspaperRenderer: renderToHtml generates self-contained retro HTML broadsheet', async () => {
  const renderer = new RetroNewspaperRenderer();
  const data = createSampleNewspaperData();

  const html = await renderer.renderToHtml(data);

  assert.ok(html.includes('<!DOCTYPE html>'));
  assert.ok(html.includes('THE FYNENCE'));
  assert.ok(html.includes('VERITAS IN NUMERIS'));
  assert.ok(html.includes('Global Central Banks Coordinate Interbank Liquidity Facility'));
  assert.ok(html.includes('XAUUSD'));
  assert.ok(html.includes('Core Retail Sales'));
  assert.ok(html.includes('Magelang, Jawa Tengah'));
  assert.ok(html.includes('broadsheet'));
  assert.ok(html.includes('#fbf8ef')); // Vintage paper tone
});

test('RetroNewspaperRenderer: renderEdition compiles to WebP binary', async () => {
  const renderer = new RetroNewspaperRenderer();
  const data = createSampleNewspaperData();

  const result = await renderer.renderEdition(data, {
    format: 'webp',
    viewportWidth: 800,
    viewportHeight: 1100,
  });

  assert.equal(result.format, 'webp');
  assert.equal(result.mimeType, 'image/webp');
  assert.ok(result.fileSizeBytes > 1000);
  assert.equal(result.dimensions.width, 800);
  assert.equal(result.dimensions.height, 1100);
  assert.ok(result.renderDurationMs >= 0);
  assert.ok(Buffer.isBuffer(result.buffer) || result.buffer instanceof Uint8Array);
});

test('RetroNewspaperRenderer: renderEdition compiles to PNG binary', async () => {
  const renderer = new RetroNewspaperRenderer();
  const data = createSampleNewspaperData();

  const result = await renderer.renderEdition(data, {
    format: 'png',
    viewportWidth: 800,
    viewportHeight: 1100,
  });

  assert.equal(result.format, 'png');
  assert.equal(result.mimeType, 'image/png');
  assert.ok(result.fileSizeBytes > 1000);
});

test('RetroNewspaperRenderer: renderEdition compiles to PDF binary', async () => {
  const renderer = new RetroNewspaperRenderer();
  const data = createSampleNewspaperData();

  const result = await renderer.renderEdition(data, {
    format: 'pdf',
    viewportWidth: 800,
    viewportHeight: 1100,
  });

  assert.equal(result.format, 'pdf');
  assert.equal(result.mimeType, 'application/pdf');
  assert.ok(result.fileSizeBytes > 1000);

  // Assert PDF header magic bytes (%PDF-1.4)
  const headerStr = Buffer.from(result.buffer).subarray(0, 8).toString('utf-8');
  assert.ok(headerStr.startsWith('%PDF-1.'));
});
