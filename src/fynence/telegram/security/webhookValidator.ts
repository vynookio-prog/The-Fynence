import type { TelegramBotConfig } from '../types';
import { getTelegramConfig } from '../config/telegramConfig';

export class WebhookSecurityValidator {
  private config: TelegramBotConfig;

  constructor(config: TelegramBotConfig = getTelegramConfig()) {
    this.config = config;
  }

  /**
   * Validates the secret token header sent by Telegram in webhook mode.
   * Header name: 'X-Telegram-Bot-Api-Secret-Token'
   */
  public validateSecretToken(secretHeader?: string | null): boolean {
    const expectedSecret = this.config.webhookSecret;

    // If no secret is configured, allow in development or fallback mode
    if (!expectedSecret) {
      return true;
    }

    if (!secretHeader) {
      return false;
    }

    // Constant-time length comparison to prevent timing leaks
    if (secretHeader.length !== expectedSecret.length) {
      return false;
    }

    let match = 0;
    for (let i = 0; i < secretHeader.length; i++) {
      match |= secretHeader.charCodeAt(i) ^ expectedSecret.charCodeAt(i);
    }

    return match === 0;
  }

  /**
   * Validates that the body represents a minimally valid Telegram Update object.
   */
  public validateUpdatePayload(body: any): { isValid: boolean; error?: string } {
    if (!body || typeof body !== 'object') {
      return { isValid: false, error: 'Request body must be a non-null JSON object.' };
    }

    if (typeof body.update_id !== 'number') {
      return { isValid: false, error: 'Payload missing valid integer update_id.' };
    }

    const hasExpectedField =
      'message' in body ||
      'callback_query' in body ||
      'edited_message' in body ||
      'channel_post' in body ||
      'my_chat_member' in body;

    if (!hasExpectedField) {
      return { isValid: false, error: 'Payload does not contain a recognized Telegram event type.' };
    }

    return { isValid: true };
  }
}

export const defaultWebhookSecurityValidator = new WebhookSecurityValidator();
