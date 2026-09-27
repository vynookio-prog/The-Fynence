import type { NewspaperSectionName, EditionType, EditionTheme } from '../renderer/types/document';
import type {
  TelegramUserProfile,
  TelegramDeliveryRecord,
  TelegramArticleSourceItem,
  ITelegramDeliveryService,
} from '../types/telegram';

export type {
  TelegramUserProfile,
  TelegramDeliveryRecord,
  TelegramArticleSourceItem,
  ITelegramDeliveryService,
};

export type TelegramFormatOption = 'image' | 'pdf' | 'both';

export type TelegramBotCommand =
  | 'start'
  | 'help'
  | 'daily'
  | 'finance'
  | 'market'
  | 'weather'
  | 'newspaper';

export interface TelegramEditionRequest {
  requestId: string;
  source: 'telegram';
  chatId: number;
  telegramUserId: number;
  username?: string;
  firstName?: string;
  editionType: EditionType;
  sections: NewspaperSectionName[];
  weatherLocationId?: string;
  format: TelegramFormatOption;
  theme?: EditionTheme;
  rawText?: string;
  createdAt: string;
}

export interface ParsedCommand {
  command: TelegramBotCommand | 'unknown';
  rawArgs: string;
  sections: NewspaperSectionName[];
  unsupportedSections: string[];
  weatherLocation?: string;
  format?: TelegramFormatOption;
}

export type ParsedCallback =
  | { type: 'edition'; edition: 'daily' | 'finance' | 'market' | 'weather' | 'custom' }
  | { type: 'format'; format: TelegramFormatOption; edition?: string }
  | { type: 'action'; action: 'help' | 'custom' | 'sources' }
  | { type: 'unknown'; raw: string };

export interface EditionPipelineResult {
  success: boolean;
  requestId: string;
  editionId: string;
  editionType: EditionType;
  title: string;
  subtitle: string;
  editionDate: string;
  format: TelegramFormatOption;
  imageBuffer?: Buffer;
  imageMimeType?: string;
  pdfBuffer?: Buffer;
  pdfFileName?: string;
  sources: TelegramArticleSourceItem[];
  error?: string;
  durationMs: number;
}

export interface RateLimitCheckResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
}

export interface TelegramBotConfig {
  botToken: string;
  webhookUrl?: string;
  webhookSecret?: string;
  rateLimitPerMinute: number;
  defaultFormat: TelegramFormatOption;
  defaultWeatherLocation: string;
}
