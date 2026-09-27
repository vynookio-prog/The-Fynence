import type { TelegramBotController } from '../controller/telegramBotController';
import { defaultWebhookSecurityValidator, WebhookSecurityValidator } from '../security/webhookValidator';

export interface WebhookHandlerOptions {
  controller: TelegramBotController;
  validator?: WebhookSecurityValidator;
}

export class TelegramWebhookHandler {
  private controller: TelegramBotController;
  private validator: WebhookSecurityValidator;

  constructor(options: WebhookHandlerOptions) {
    this.controller = options.controller;
    this.validator = options.validator || defaultWebhookSecurityValidator;
  }

  /**
   * Handles incoming HTTP POST requests representing Telegram updates.
   * Compatible with Next.js App Router Request, Express, or standard web standard Request.
   */
  public async handleRequest(
    request: Request
  ): Promise<{ status: number; body: Record<string, any> }> {
    // 1. Verify HTTP Method
    if (request.method !== 'POST') {
      return { status: 405, body: { error: 'Method Not Allowed' } };
    }

    // 2. Validate Security Secret Token Header
    const secretHeader = request.headers.get('x-telegram-bot-api-secret-token');
    const isSecretValid = this.validator.validateSecretToken(secretHeader);
    if (!isSecretValid) {
      return { status: 403, body: { error: 'Invalid or missing secret token' } };
    }

    // 3. Parse JSON Body
    let payload: any;
    try {
      payload = await request.json();
    } catch {
      return { status: 400, body: { error: 'Malformed JSON payload' } };
    }

    // 4. Validate Telegram Update Schema
    const validation = this.validator.validateUpdatePayload(payload);
    if (!validation.isValid) {
      return { status: 400, body: { error: validation.error || 'Invalid Telegram update schema' } };
    }

    // 5. Dispatch Update to Bot
    try {
      // Process update safely
      await this.controller.bot.handleUpdate(payload);
      return { status: 200, body: { ok: true } };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[TelegramWebhook] Error handling update:', msg);
      // Return 200 to prevent Telegram from retrying failing messages endlessly
      return { status: 200, body: { ok: false, error: 'Update processed with error' } };
    }
  }
}
