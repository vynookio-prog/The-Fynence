import { InputFile, type Api } from 'grammy';
import type {
  ITelegramDeliveryService,
  TelegramArticleSourceItem,
  TelegramDeliveryRecord,
  TelegramFormatOption,
} from '../types';
import { fynenceRepository } from '../../database/insforgeRepository';
import { formatNewspaperDateLong } from '../../weather/utils/timezone';

export class TelegramDeliveryService implements ITelegramDeliveryService {
  private api: Api;

  constructor(api: Api) {
    this.api = api;
  }

  /**
   * Sends user-facing text message, returning the messageId for later in-place updates.
   */
  public async sendMessage(
    chatId: number,
    text: string,
    options?: { replyMarkup?: any; parseMode?: 'HTML' | 'MarkdownV2' | 'Markdown' }
  ): Promise<{ messageId: number }> {
    const msg = await this.api.sendMessage(chatId, text, {
      reply_markup: options?.replyMarkup,
      parse_mode: options?.parseMode,
    });
    return { messageId: msg.message_id };
  }

  /**
   * Updates an existing message in-place to report progress without spamming the chat.
   */
  public async updateMessage(chatId: number, messageId: number, text: string): Promise<boolean> {
    try {
      await this.api.editMessageText(chatId, messageId, text);
      return true;
    } catch {
      // Ignore if message content is identical or edit fails
      return false;
    }
  }

  /**
   * Dispatches the broadsheet PNG/WebP image with editorial caption.
   */
  public async deliverEditionImage(
    chatId: number,
    renderResult: any,
    caption?: string
  ): Promise<TelegramDeliveryRecord> {
    const defaultCaption = caption || '🗞️ THE FYNENCE\nDAILY EDITION';
    const buffer = renderResult.imageBuffer || renderResult.buffer;
    const fileName = 'THE_FYNENCE_BROADSHEET.png';

    try {
      const file = new InputFile(buffer, fileName);
      let sentMsg: any;
      try {
        sentMsg = await this.api.sendPhoto(chatId, file, { caption: defaultCaption });
      } catch {
        // Fallback to sendDocument if photo exceeds dimensions or compressed limits
        sentMsg = await this.api.sendDocument(chatId, file, { caption: defaultCaption });
      }

      const record: TelegramDeliveryRecord = {
        editionId: renderResult.editionId || 'unknown',
        chatId,
        telegramUserId: chatId,
        messageId: sentMsg.message_id,
        formatSent: 'png',
        status: 'sent',
        sentAt: new Date().toISOString(),
      };

      await this.recordDeliverySafe(record);
      return record;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const record: TelegramDeliveryRecord = {
        editionId: renderResult.editionId || 'unknown',
        chatId,
        telegramUserId: chatId,
        messageId: 0,
        formatSent: 'png',
        status: 'failed',
        sentAt: new Date().toISOString(),
        errorMessage: errMsg,
      };
      await this.recordDeliverySafe(record);
      throw err;
    }
  }

  /**
   * Dispatches all broadsheet pages as images with page indicators.
   * If only one page exists, delegates directly to deliverEditionImage.
   */
  public async deliverEditionAllPages(
    chatId: number,
    renderResult: any,
    caption?: string
  ): Promise<TelegramDeliveryRecord[]> {
    const pages: Array<{ buffer: Buffer; mimeType?: string; pageNumber?: number }> =
      renderResult.imagePages || (renderResult.imageBuffer ? [{ buffer: renderResult.imageBuffer, pageNumber: 1 }] : []);

    if (pages.length <= 1) {
      const single = await this.deliverEditionImage(chatId, renderResult, caption);
      return [single];
    }

    const records: TelegramDeliveryRecord[] = [];
    const baseCaption = caption || '🗞️ THE FYNENCE BROADSHEET';

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const pageNum = page.pageNumber || i + 1;
      const pageCaption = `${baseCaption}\n📄 Page ${pageNum} of ${pages.length}`;
      const fileName = `THE_FYNENCE_PAGE_${pageNum}.png`;

      try {
        const file = new InputFile(page.buffer, fileName);
        let sentMsg: any;
        try {
          sentMsg = await this.api.sendPhoto(chatId, file, { caption: pageCaption });
        } catch {
          sentMsg = await this.api.sendDocument(chatId, file, { caption: pageCaption });
        }

        const record: TelegramDeliveryRecord = {
          editionId: renderResult.editionId || 'unknown',
          chatId,
          telegramUserId: chatId,
          messageId: sentMsg.message_id,
          formatSent: 'png',
          status: 'sent',
          sentAt: new Date().toISOString(),
        };

        await this.recordDeliverySafe(record);
        records.push(record);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        const record: TelegramDeliveryRecord = {
          editionId: renderResult.editionId || 'unknown',
          chatId,
          telegramUserId: chatId,
          messageId: 0,
          formatSent: 'png',
          status: 'failed',
          sentAt: new Date().toISOString(),
          errorMessage: errMsg,
        };
        await this.recordDeliverySafe(record);
        records.push(record);
      }
    }

    return records;
  }

  /**
   * Dispatches high-resolution vector PDF document.
   */
  public async deliverEditionPdf(
    chatId: number,
    renderResult: any,
    caption?: string
  ): Promise<TelegramDeliveryRecord> {
    const buffer = renderResult.pdfBuffer || renderResult.buffer;
    const fileName = renderResult.pdfFileName || renderResult.fileName || 'THE_FYNENCE_EDITION.pdf';
    const defaultCaption = caption || '📄 THE FYNENCE — Broadsheet Document';

    try {
      const file = new InputFile(buffer, fileName);
      const sentMsg = await this.api.sendDocument(chatId, file, { caption: defaultCaption });

      const record: TelegramDeliveryRecord = {
        editionId: renderResult.editionId || 'unknown',
        chatId,
        telegramUserId: chatId,
        messageId: sentMsg.message_id,
        formatSent: 'pdf',
        status: 'sent',
        sentAt: new Date().toISOString(),
      };

      await this.recordDeliverySafe(record);
      return record;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const record: TelegramDeliveryRecord = {
        editionId: renderResult.editionId || 'unknown',
        chatId,
        telegramUserId: chatId,
        messageId: 0,
        formatSent: 'pdf',
        status: 'failed',
        sentAt: new Date().toISOString(),
        errorMessage: errMsg,
      };
      await this.recordDeliverySafe(record);
      throw err;
    }
  }

  /**
   * Delivers verified clickable source article links with strict publisher attribution.
   */
  public async deliverArticleSources(
    chatId: number,
    sources: TelegramArticleSourceItem[]
  ): Promise<{ messageId: number }> {
    if (!sources || sources.length === 0) {
      return this.sendMessage(chatId, 'ℹ️ No external article sources cited in this edition.');
    }

    const lines: string[] = [
      '🗞️ *THE FYNENCE — Verified Sources & Attribution*',
      'All original reporting remains the intellectual property of its respective publishers:\n',
    ];

    sources.forEach((item, index) => {
      const escapedHeadline = this.escapeMarkdownV2(item.headline);
      const escapedSource = this.escapeMarkdownV2(item.sourceName);
      lines.push(`${index + 1}\\. [${escapedHeadline}](${item.articleUrl}) — _${escapedSource}_`);
    });

    const text = lines.join('\n');
    return this.sendMessage(chatId, text, { parseMode: 'MarkdownV2' });
  }

  /**
   * Generates standard retro caption matching Section 20 requirements:
   * 🗞️ THE FYNENCE
   * [EDITION NAME]
   * [DATE]
   */
  public buildCaption(title: string, subtitle: string, editionDate?: string): string {
    const dateFormatted = editionDate
      ? formatNewspaperDateLong(new Date(editionDate), 'Asia/Jakarta')
      : formatNewspaperDateLong(new Date(), 'Asia/Jakarta');

    return `🗞️ ${title}\n${subtitle.toUpperCase()}\n${dateFormatted}`;
  }

  private escapeMarkdownV2(text: string): string {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
  }

  private async recordDeliverySafe(record: TelegramDeliveryRecord): Promise<void> {
    try {
      await fynenceRepository.recordTelegramDelivery({
        edition_id: record.editionId,
        telegram_user_id: record.telegramUserId,
        chat_id: record.chatId,
        message_id: record.messageId,
        format_sent: record.formatSent,
        status: record.status,
        sent_at: record.sentAt,
        error_message: record.errorMessage || null,
      });
    } catch {
      // Non-fatal telemetry persistence error
    }
  }
}
