import type { EditionFormat, NewspaperSectionType } from './edition';
import type { RenderResult } from './renderer';

export interface TelegramUserProfile {
  telegramUserId: number;
  chatId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  isSubscribedDaily: boolean;
  preferredWeatherLocation?: string;
  preferredSections?: NewspaperSectionType[];
  preferredFormat: EditionFormat;
}

export interface TelegramEditionRequest {
  chatId: number;
  telegramUserId: number;
  rawText: string;
  parsedSections?: NewspaperSectionType[];
  customWeatherLocation?: string;
  requestedFormat?: EditionFormat;
}

export interface TelegramDeliveryRecord {
  id?: string;
  editionId: string;
  chatId: number;
  telegramUserId: number;
  messageId: number;
  formatSent: EditionFormat;
  status: 'sent' | 'failed' | 'queued';
  sentAt: string;
  errorMessage?: string;
}

export interface TelegramArticleSourceItem {
  section: string;
  headline: string;
  sourceName: string;
  articleUrl: string;
}

export interface ITelegramDeliveryService {
  /**
   * Dispatches the rendered WebP broadsheet image to the designated Telegram chat.
   */
  deliverEditionImage(
    chatId: number,
    renderResult: RenderResult,
    caption?: string
  ): Promise<TelegramDeliveryRecord>;

  /**
   * Optionally sends the high-resolution broadsheet PDF document.
   */
  deliverEditionPdf(
    chatId: number,
    renderResult: RenderResult,
    caption?: string
  ): Promise<TelegramDeliveryRecord>;

  /**
   * Sends formatted clickable attribution links for every article cited in the edition.
   */
  deliverArticleSources(
    chatId: number,
    sources: TelegramArticleSourceItem[]
  ): Promise<{ messageId: number }>;

  /**
   * Sends user-facing status or processing messages.
   */
  sendMessage(chatId: number, text: string): Promise<{ messageId: number }>;
}
