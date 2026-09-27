import { getFynenceEnvironment } from '../../config/environment';
import type { TelegramBotConfig, TelegramFormatOption } from '../types';

export function getTelegramConfig(): TelegramBotConfig {
  const env = getFynenceEnvironment();

  const envRateLimit = typeof process !== 'undefined' ? process.env.TELEGRAM_RATE_LIMIT_PER_MINUTE : undefined;
  const parsedRateLimit = envRateLimit ? parseInt(envRateLimit, 10) : 3;

  const envWebhookUrl = typeof process !== 'undefined' ? process.env.TELEGRAM_WEBHOOK_URL : undefined;
  const envWebhookSecret = typeof process !== 'undefined' ? process.env.TELEGRAM_WEBHOOK_SECRET : undefined;

  const defaultFormat: TelegramFormatOption = 'both';

  return {
    botToken: env.telegramBotToken || '',
    webhookUrl: envWebhookUrl,
    webhookSecret: envWebhookSecret,
    rateLimitPerMinute: Number.isFinite(parsedRateLimit) && parsedRateLimit > 0 ? parsedRateLimit : 3,
    defaultFormat,
    defaultWeatherLocation: 'magelang',
  };
}

export function validateTelegramConfig(config: TelegramBotConfig = getTelegramConfig()): {
  isValid: boolean;
  missing: string[];
} {
  const missing: string[] = [];
  if (!config.botToken || config.botToken.includes('your_telegram_bot_token')) {
    missing.push('TELEGRAM_BOT_TOKEN');
  }
  return {
    isValid: missing.length === 0,
    missing,
  };
}
