import { NextResponse } from 'next/server';
import { TelegramBotController } from '@/fynence/telegram/controller/telegramBotController';
import { TelegramWebhookHandler } from '@/fynence/telegram/webhook/webhookHandler';
import { getTelegramConfig } from '@/fynence/telegram/config/telegramConfig';

// Initialize singleton bot controller and webhook handler
let botController: TelegramBotController | null = null;
let webhookHandler: TelegramWebhookHandler | null = null;

function getHandler(): TelegramWebhookHandler {
  if (!webhookHandler) {
    botController = new TelegramBotController();
    webhookHandler = new TelegramWebhookHandler({ controller: botController });
  }
  return webhookHandler;
}

export async function POST(request: Request) {
  const handler = getHandler();
  const result = await handler.handleRequest(request);
  return NextResponse.json(result.body, { status: result.status });
}

export async function GET() {
  const config = getTelegramConfig();
  return NextResponse.json({
    status: 'active',
    service: 'THE FYNENCE Telegram Bot Webhook Endpoint',
    configured: Boolean(config.botToken && !config.botToken.includes('your_')),
    rateLimitPerMinute: config.rateLimitPerMinute,
    defaultFormat: config.defaultFormat,
  });
}
