import { Bot, Context, session } from 'grammy';
import type {
  ParsedCallback,
  TelegramBotConfig,
  TelegramEditionRequest,
  TelegramFormatOption,
} from '../types';
import { getTelegramConfig } from '../config/telegramConfig';
import { defaultTelegramCommandParser, TelegramCommandParser } from '../parser/commandParser';
import { defaultTelegramCallbackParser, TelegramCallbackParser } from '../parser/callbackParser';
import {
  createFormatSelectionKeyboard,
  createSourcesKeyboard,
  createStartMenuKeyboard,
} from '../keyboard/inlineKeyboards';
import { defaultTelegramRateLimiter, TelegramRateLimiter } from '../security/rateLimiter';
import { defaultTelegramDeduplicator, TelegramRequestDeduplicator } from '../security/deduplicator';
import { defaultEditionPipelineService, EditionPipelineService } from '../service/editionPipelineService';
import { TelegramDeliveryService } from '../service/telegramDeliveryService';
import type { EditionType } from '../../renderer/types/document';

export class TelegramBotController {
  public bot: Bot;
  private config: TelegramBotConfig;
  private commandParser: TelegramCommandParser;
  private callbackParser: TelegramCallbackParser;
  private rateLimiter: TelegramRateLimiter;
  private deduplicator: TelegramRequestDeduplicator;
  private pipelineService: EditionPipelineService;
  private deliveryService: TelegramDeliveryService;
  private lastEditionSourcesByChat: Map<number, any[]> = new Map();

  constructor(options?: {
    config?: TelegramBotConfig;
    commandParser?: TelegramCommandParser;
    callbackParser?: TelegramCallbackParser;
    rateLimiter?: TelegramRateLimiter;
    deduplicator?: TelegramRequestDeduplicator;
    pipelineService?: EditionPipelineService;
    deliveryService?: TelegramDeliveryService;
  }) {
    this.config = options?.config || getTelegramConfig();
    const token = this.config.botToken || 'mock_telegram_token_for_tests';
    this.bot = new Bot(token);

    this.commandParser = options?.commandParser || defaultTelegramCommandParser;
    this.callbackParser = options?.callbackParser || defaultTelegramCallbackParser;
    this.rateLimiter = options?.rateLimiter || defaultTelegramRateLimiter;
    this.deduplicator = options?.deduplicator || defaultTelegramDeduplicator;
    this.pipelineService = options?.pipelineService || defaultEditionPipelineService;
    this.deliveryService = options?.deliveryService || new TelegramDeliveryService(this.bot.api);

    this.setupMiddleware();
    this.setupCommands();
    this.setupCallbacks();
  }

  private setupMiddleware(): void {
    // 1. Error Handler
    this.bot.catch((err) => {
      // Structured logging without exposing bot token or private user secrets
      const ctx = err.ctx;
      console.error('[TelegramBot] Error handling update:', {
        updateId: ctx?.update?.update_id,
        message: err.message,
      });
    });
  }

  private setupCommands(): void {
    // /start command
    this.bot.command('start', async (ctx) => {
      const welcomeText =
        '🗞️ *THE FYNENCE*\n\n' +
        'Your personal financial & daily broadsheet newspaper.\n\n' +
        'Choose an edition to generate:';

      await ctx.reply(welcomeText, {
        parse_mode: 'Markdown',
        reply_markup: createStartMenuKeyboard(),
      });
    });

    // /help command
    this.bot.command('help', async (ctx) => {
      await this.sendHelpMessage(ctx);
    });

    // /daily command
    this.bot.command('daily', async (ctx) => {
      await this.handleEditionCommand(ctx, 'daily', ['daily_news', 'world', 'national', 'business', 'finance', 'economy', 'markets', 'weather']);
    });

    // /finance command
    this.bot.command('finance', async (ctx) => {
      await this.handleEditionCommand(ctx, 'finance_economy', ['top_story', 'finance', 'economy', 'markets', 'economic_calendar']);
    });

    // /market command
    this.bot.command('market', async (ctx) => {
      await this.handleEditionCommand(ctx, 'market', ['markets', 'forex', 'crypto']);
    });

    // /weather command
    this.bot.command('weather', async (ctx) => {
      await this.handleEditionCommand(ctx, 'daily', ['weather'], 'magelang');
    });

    // /newspaper [custom sections...]
    this.bot.command('newspaper', async (ctx) => {
      const text = ctx.message?.text || '';
      const parsed = this.commandParser.parse(text);

      if (parsed.unsupportedSections.length > 0) {
        const invalidList = parsed.unsupportedSections.join(', ');
        await ctx.reply(
          `⚠️ Section "${invalidList}" isn't available yet.\n\n` +
          `Available sections:\n${this.commandParser.getAvailableSectionsDisplay()}\n\n` +
          `Example: /newspaper finance economy markets`
        );
        return;
      }

      if (parsed.sections.length === 0) {
        await ctx.reply(
          '🗞️ *Custom Newspaper Generator*\n\n' +
          'Specify one or more sections to tailor your edition.\n\n' +
          'Examples:\n' +
          '• `/newspaper finance economy`\n' +
          '• `/newspaper daily weather`\n' +
          '• `/newspaper finance economy markets`\n' +
          '• `/newspaper daily finance economy weather markets`\n\n' +
          `Available sections: ${this.commandParser.getAvailableSectionsDisplay()}`,
          { parse_mode: 'Markdown' }
        );
        return;
      }

      // Check if it qualifies as finance_economy
      const hasFin = parsed.sections.includes('finance');
      const hasEcon = parsed.sections.includes('economy');
      const editionType: EditionType = hasFin && hasEcon ? 'finance_economy' : 'custom';

      await this.handleEditionCommand(ctx, editionType, parsed.sections);
    });

    // Catch-all for unrecognized slash commands
    this.bot.on('message:text', async (ctx, next) => {
      const text = ctx.message.text.trim();
      if (text.startsWith('/')) {
        await ctx.reply(
          "I don't recognize that command.\n\n" +
          "Try /daily, /finance, /market, /weather, or /newspaper."
        );
        return;
      }
      return next();
    });
  }

  private setupCallbacks(): void {
    this.bot.on('callback_query:data', async (ctx) => {
      const parsed = this.callbackParser.parse(ctx.callbackQuery.data);

      try {
        await ctx.answerCallbackQuery();
      } catch {
        // Safe callback query ack
      }

      if (parsed.type === 'action') {
        if (parsed.action === 'help') {
          await this.sendHelpMessage(ctx);
        } else if (parsed.action === 'custom') {
          await ctx.reply(
            '⚙️ *Custom Edition Request*\n\n' +
            'Send a message with your desired sections:\n' +
            'Example: `/newspaper finance economy markets`\n\n' +
            `Available: ${this.commandParser.getAvailableSectionsDisplay()}`,
            { parse_mode: 'Markdown' }
          );
        } else if (parsed.action === 'sources') {
          const chatId = ctx.chat?.id;
          if (chatId) {
            const sources = this.lastEditionSourcesByChat.get(chatId) || [];
            await this.deliveryService.deliverArticleSources(chatId, sources);
          }
        }
        return;
      }

      if (parsed.type === 'edition') {
        switch (parsed.edition) {
          case 'daily':
            await this.handleEditionCommand(ctx, 'daily', ['daily_news', 'world', 'national', 'business', 'finance', 'economy', 'markets', 'weather']);
            break;
          case 'finance':
            await this.handleEditionCommand(ctx, 'finance_economy', ['top_story', 'finance', 'economy', 'markets', 'economic_calendar']);
            break;
          case 'market':
            await this.handleEditionCommand(ctx, 'market', ['markets', 'forex', 'crypto']);
            break;
          case 'weather':
            await this.handleEditionCommand(ctx, 'daily', ['weather'], 'magelang');
            break;
          case 'custom':
            await ctx.reply(
              'Specify sections: `/newspaper finance economy markets`',
              { parse_mode: 'Markdown' }
            );
            break;
        }
        return;
      }

      if (parsed.type === 'format') {
        const edition = parsed.edition || 'daily';
        const format = parsed.format;
        const sections = this.commandParser.getDefaultSectionsForCommand(edition as any);
        const editionType: EditionType = edition === 'finance' ? 'finance_economy' : (edition as EditionType);
        await this.handleEditionCommand(ctx, editionType, sections, undefined, format);
      }
    });
  }

  private async sendHelpMessage(ctx: Context): Promise<void> {
    const helpText =
      '🗞️ *THE FYNENCE — Command Guide*\n\n' +
      'Available editions:\n' +
      '• `/daily` — Daily Broadsheet Edition\n' +
      '• `/finance` — Finance & Macro Economy Edition\n' +
      '• `/market` — Capital Markets & Commodities\n' +
      '• `/weather` — Magelang, Central Java Weather\n' +
      '• `/newspaper` — Build custom multi-section edition\n\n' +
      'Custom editions:\n' +
      '`/newspaper finance economy markets`\n' +
      '`/newspaper daily weather`\n\n' +
      'Formats delivered: Image (PNG) and Vector Document (PDF).';

    await ctx.reply(helpText, { parse_mode: 'Markdown' });
  }

  public async handleEditionCommand(
    ctx: Context,
    editionType: EditionType,
    sections: any[],
    weatherLocation = 'magelang',
    format: TelegramFormatOption = 'both'
  ): Promise<void> {
    const chatId = ctx.chat?.id;
    const userId = ctx.from?.id;

    if (!chatId || !userId) return;

    // 1. Rate Limiting Check
    const rateCheck = this.rateLimiter.check(userId);
    if (!rateCheck.allowed) {
      await ctx.reply(
        `⚠️ You've reached the generation limit (${this.config.rateLimitPerMinute} requests per minute).\n` +
        `Please wait ${rateCheck.resetSeconds}s before requesting another edition.`
      );
      return;
    }

    // 2. Duplicate Request Check
    const dupCheck = this.deduplicator.check(chatId, editionType, sections);
    if (dupCheck.isDuplicate) {
      await ctx.reply(`⏳ ${dupCheck.message}`);
      return;
    }

    // 3. Mark in-flight
    this.deduplicator.startRequest(chatId, editionType, sections);

    // 4. Initial status message
    let statusMessageId: number | undefined;
    try {
      const initialStatus = await ctx.reply('🗞️ Preparing your edition...');
      statusMessageId = initialStatus.message_id;
    } catch {
      // Ignore if reply fails
    }

    const progressCallback = async (text: string) => {
      if (statusMessageId) {
        await this.deliveryService.updateMessage(chatId, statusMessageId, text);
      }
    };

    const editionRequest: TelegramEditionRequest = {
      requestId: `tg-${Date.now()}-${userId}`,
      source: 'telegram',
      chatId,
      telegramUserId: userId,
      username: ctx.from?.username,
      firstName: ctx.from?.first_name,
      editionType,
      sections,
      weatherLocationId: weatherLocation,
      format,
      createdAt: new Date().toISOString(),
    };

    // 5. Run Generation Pipeline Asynchronously
    try {
      const result = await this.pipelineService.generateEdition(editionRequest, progressCallback);

      if (!result.success) {
        await ctx.reply(`⚠️ Edition generation encountered an error: ${result.error || 'Unknown error'}`);
        return;
      }

      // Store sources for later retrieval
      this.lastEditionSourcesByChat.set(chatId, result.sources);

      const caption = this.deliveryService.buildCaption(result.title, result.subtitle, result.editionDate);

      // 6. Deliver Image if requested (delivers all pages for multi-page editions)
      if ((format === 'image' || format === 'both') && (result.imageBuffer || (result.imagePages && result.imagePages.length > 0))) {
        if (result.imagePages && result.imagePages.length > 1) {
          await this.deliveryService.deliverEditionAllPages(chatId, result, caption);
        } else {
          await this.deliveryService.deliverEditionImage(chatId, result, caption);
        }
      }

      // 7. Deliver PDF if requested
      if ((format === 'pdf' || format === 'both') && result.pdfBuffer) {
        await this.deliveryService.deliverEditionPdf(chatId, result, caption);
      }

      // 8. Send sources button or completion notice
      if (result.sources.length > 0) {
        await ctx.reply('🗞️ Press below to inspect citations and verified sources:', {
          reply_markup: createSourcesKeyboard(result.sources.length, result.sources),
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await ctx.reply(`⚠️ Could not complete delivery: ${msg}`);
    } finally {
      this.deduplicator.completeRequest(chatId, editionType, sections);
    }
  }
}
