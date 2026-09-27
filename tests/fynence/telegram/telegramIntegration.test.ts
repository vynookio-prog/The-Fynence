import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import { EditionPipelineService } from '../../../src/fynence/telegram/service/editionPipelineService';
import { TelegramDeliveryService } from '../../../src/fynence/telegram/service/telegramDeliveryService';
import { TelegramCommandParser } from '../../../src/fynence/telegram/parser/commandParser';
import { TelegramCallbackParser } from '../../../src/fynence/telegram/parser/callbackParser';
import { WeatherService } from '../../../src/fynence/weather/service/weatherService';
import { MarketService } from '../../../src/fynence/market/service/marketService';
import { MockWeatherProvider } from '../../../src/fynence/weather/providers/mockWeatherProvider';
import { MockMarketDataProvider } from '../../../src/fynence/market/providers/mockMarketProvider';
import { defaultPdfArtifactManager } from '../../../src/fynence/pdf/utils/tempArtifactManager';
import { createStartMenuKeyboard, createFormatSelectionKeyboard } from '../../../src/fynence/telegram/keyboard/inlineKeyboards';

test('Telegram Integration Test Suite (STEP 8)', async (t) => {
  const parser = new TelegramCommandParser();
  const callbackParser = new TelegramCallbackParser();

  // Create mock pipeline with deterministic mock providers
  const mockWeatherProvider = new MockWeatherProvider();
  const mockMarketProvider = new MockMarketDataProvider();
  const mockWeatherService = new WeatherService({ primaryProvider: mockWeatherProvider });
  const mockMarketService = new MarketService({ marketProvider: mockMarketProvider });

  const pipeline = new EditionPipelineService({
    weatherService: mockWeatherService,
    marketService: mockMarketService,
  });

  // Mock Telegram Api implementation
  const sentMessages: any[] = [];
  const sentPhotos: any[] = [];
  const sentDocuments: any[] = [];
  const editedMessages: any[] = [];

  const mockApi: any = {
    sendMessage: async (chatId: number, text: string, options?: any) => {
      const msg = { message_id: sentMessages.length + 1, chat: { id: chatId }, text, options };
      sentMessages.push(msg);
      return msg;
    },
    editMessageText: async (chatId: number, messageId: number, text: string) => {
      editedMessages.push({ chatId, messageId, text });
      return true;
    },
    sendPhoto: async (chatId: number, file: any, options?: any) => {
      const msg = { message_id: sentPhotos.length + 100, chat: { id: chatId }, file, options };
      sentPhotos.push(msg);
      return msg;
    },
    sendDocument: async (chatId: number, file: any, options?: any) => {
      const msg = { message_id: sentDocuments.length + 200, chat: { id: chatId }, file, options };
      sentDocuments.push(msg);
      return msg;
    },
  };

  const deliveryService = new TelegramDeliveryService(mockApi);

  await t.test('1. /start generates welcome menu with inline keyboard', () => {
    const keyboard = createStartMenuKeyboard();
    assert.ok(keyboard);
    assert.ok(keyboard.inline_keyboard.length >= 4);

    const buttons = keyboard.inline_keyboard.flat().map((b: any) => b.text);
    assert.ok(buttons.some(b => b.includes('Daily')));
    assert.ok(buttons.some(b => b.includes('Finance')));
    assert.ok(buttons.some(b => b.includes('Markets')));
    assert.ok(buttons.some(b => b.includes('Weather')));
  });

  await t.test('2. /help command and callback parsing', () => {
    const parsedCmd = parser.parse('/help');
    assert.equal(parsedCmd.command, 'help');

    const parsedCallback = callbackParser.parse('action:help');
    assert.deepEqual(parsedCallback, { type: 'action', action: 'help' });
  });

  await t.test('3. /daily: Generates single NewspaperDocument and renders both PNG and PDF', async () => {
    let progressUpdates: string[] = [];
    const result = await pipeline.generateEdition(
      {
        requestId: 'req-daily-test',
        source: 'telegram',
        chatId: 101,
        telegramUserId: 101,
        editionType: 'daily',
        sections: ['daily_news', 'world', 'national', 'business', 'finance', 'economy', 'markets', 'weather'],
        format: 'both',
        createdAt: new Date().toISOString(),
      },
      async (status) => {
        progressUpdates.push(status);
      }
    );

    assert.equal(result.success, true);
    assert.equal(result.editionType, 'daily');
    assert.ok(result.imageBuffer && result.imageBuffer.length > 0);
    assert.ok(result.pdfBuffer && result.pdfBuffer.length > 0);
    assert.ok(result.pdfFileName?.startsWith('THE_FYNENCE_'));
    assert.ok(progressUpdates.length >= 2);

    // Deliver image and PDF via mock delivery service
    const caption = deliveryService.buildCaption(result.title, result.subtitle, result.editionDate);
    const imgRecord = await deliveryService.deliverEditionImage(101, result, caption);
    assert.equal(imgRecord.status, 'sent');
    assert.equal(sentPhotos.length, 1);

    const pdfRecord = await deliveryService.deliverEditionPdf(101, result, caption);
    assert.equal(pdfRecord.status, 'sent');
    assert.equal(sentDocuments.length, 1);
  });

  await t.test('4. /finance: Generates unified Finance + Economy Edition', async () => {
    const result = await pipeline.generateEdition({
      requestId: 'req-finance-test',
      source: 'telegram',
      chatId: 101,
      telegramUserId: 101,
      editionType: 'finance_economy',
      sections: ['top_story', 'finance', 'economy', 'markets', 'economic_calendar'],
      format: 'both',
      createdAt: new Date().toISOString(),
    });

    assert.equal(result.success, true);
    assert.equal(result.editionType, 'finance_economy');
    assert.equal(result.title, 'THE FYNENCE');
    assert.equal(result.subtitle, 'FINANCE & ECONOMY INTELLIGENCE');
    assert.ok(result.imageBuffer);
    assert.ok(result.pdfBuffer);
  });

  await t.test('5. /market: Generates capital markets edition', async () => {
    const result = await pipeline.generateEdition({
      requestId: 'req-market-test',
      source: 'telegram',
      chatId: 101,
      telegramUserId: 101,
      editionType: 'market',
      sections: ['markets', 'forex', 'crypto'],
      format: 'both',
      createdAt: new Date().toISOString(),
    });

    assert.equal(result.success, true);
    assert.equal(result.editionType, 'market');
    assert.equal(result.subtitle, 'CAPITAL MARKETS CHRONICLE');
  });

  await t.test('6. /weather: Generates Magelang weather edition', async () => {
    const result = await pipeline.generateEdition({
      requestId: 'req-weather-test',
      source: 'telegram',
      chatId: 101,
      telegramUserId: 101,
      editionType: 'daily',
      sections: ['weather'],
      weatherLocationId: 'magelang',
      format: 'both',
      createdAt: new Date().toISOString(),
    });

    assert.equal(result.success, true);
  });

  await t.test('7. /newspaper custom sections and alias parsing', () => {
    const cmd1 = parser.parse('/newspaper finance markets');
    assert.deepEqual(cmd1.sections, ['finance', 'markets']);
    assert.equal(cmd1.unsupportedSections.length, 0);

    const cmd2 = parser.parse('/newspaper daily weather tech');
    assert.deepEqual(cmd2.sections, ['daily_news', 'weather', 'technology']);

    const cmd3 = parser.parse('/newspaper unknown_section');
    assert.deepEqual(cmd3.unsupportedSections, ['unknown_section']);
  });

  await t.test('8. Format selection (image only, pdf only, both)', async () => {
    const imageOnly = await pipeline.generateEdition({
      requestId: 'fmt-img',
      source: 'telegram',
      chatId: 101,
      telegramUserId: 101,
      editionType: 'daily',
      sections: ['daily_news'],
      format: 'image',
      createdAt: new Date().toISOString(),
    });
    assert.ok(imageOnly.imageBuffer);
    assert.equal(imageOnly.pdfBuffer, undefined);

    const pdfOnly = await pipeline.generateEdition({
      requestId: 'fmt-pdf',
      source: 'telegram',
      chatId: 101,
      telegramUserId: 101,
      editionType: 'daily',
      sections: ['daily_news'],
      format: 'pdf',
      createdAt: new Date().toISOString(),
    });
    assert.equal(pdfOnly.imageBuffer, undefined);
    assert.ok(pdfOnly.pdfBuffer);
  });

  await t.test('9. Article sources extraction & attribution delivery', async () => {
    const result = await pipeline.generateEdition({
      requestId: 'sources-test',
      source: 'telegram',
      chatId: 101,
      telegramUserId: 101,
      editionType: 'daily',
      sections: ['daily_news'],
      format: 'image',
      createdAt: new Date().toISOString(),
    });

    assert.ok(result.sources.length > 0);
    const sourceRes = await deliveryService.deliverArticleSources(101, result.sources);
    assert.ok(sourceRes.messageId > 0);
  });

  await t.test('10. Graceful degradation: Partial weather provider outage', async () => {
    const failingWeatherPipeline = new EditionPipelineService({
      weatherService: new WeatherService({
        primaryProvider: {
          providerName: 'outage_provider',
          attribution: { name: 'Outage', url: '' },
          getCurrentWeather: async () => { throw new Error('Station connection failed'); },
          getForecast: async () => [],
        },
      }),
      marketService: mockMarketService,
    });

    const res = await failingWeatherPipeline.generateEdition({
      requestId: 'weather-fail-test',
      source: 'telegram',
      chatId: 101,
      telegramUserId: 101,
      editionType: 'daily',
      sections: ['daily_news', 'weather'],
      format: 'both',
      createdAt: new Date().toISOString(),
    });

    // Should succeed with weather gracefully degraded
    assert.equal(res.success, true);
  });

  await t.test('11. Graceful degradation: Partial market provider outage', async () => {
    const failingMarketPipeline = new EditionPipelineService({
      weatherService: mockWeatherService,
      marketService: new MarketService({
        marketProvider: {
          name: 'failing_provider',
          getQuote: async () => ({ success: false, provider: 'failing', error: 'HTTP 503' }),
          getQuotes: async () => ({ success: false, provider: 'failing', error: 'HTTP 503' }),
        },
      }),
    });

    const res = await failingMarketPipeline.generateEdition({
      requestId: 'market-fail-test',
      source: 'telegram',
      chatId: 101,
      telegramUserId: 101,
      editionType: 'market',
      sections: ['markets'],
      format: 'both',
      createdAt: new Date().toISOString(),
    });

    // Pipeline catches and recovers with fallback market snapshot
    assert.equal(res.success, true);
  });

  await t.test('12. Telegram API failure handling', async () => {
    const failingApi: any = {
      sendPhoto: async () => { throw new Error('Telegram Bot API: 400 Bad Request'); },
      sendDocument: async () => { throw new Error('Telegram Bot API: 400 Bad Request'); },
      sendMessage: async () => { throw new Error('Telegram Bot API: 403 Forbidden'); },
    };

    const failingDelivery = new TelegramDeliveryService(failingApi);

    await assert.rejects(
      async () => {
        await failingDelivery.deliverEditionImage(101, { imageBuffer: Buffer.from('fake'), editionId: 'ed-1' });
      },
      /Telegram Bot API/
    );
  });

  await t.test('13. Storage cleanup after PDF generation', async () => {
    const tempDir = defaultPdfArtifactManager.getDirectory();
    const initialTempFiles = fs.existsSync(tempDir) ? fs.readdirSync(tempDir) : [];
    const result = await pipeline.generateEdition({
      requestId: 'cleanup-test',
      source: 'telegram',
      chatId: 101,
      telegramUserId: 101,
      editionType: 'daily',
      sections: ['daily_news'],
      format: 'pdf',
      createdAt: new Date().toISOString(),
    });

    assert.equal(result.success, true);
    // Pipeline cleans up temporary files in finally block
    const postTempFiles = fs.existsSync(tempDir) ? fs.readdirSync(tempDir) : [];
    assert.equal(postTempFiles.length, initialTempFiles.length);
  });
});
