if (typeof process !== 'undefined' && typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {}
}

import { TelegramBotController } from '../src/fynence/telegram/controller/telegramBotController';
import { getTelegramConfig, validateTelegramConfig } from '../src/fynence/telegram/config/telegramConfig';

async function startLocalBot() {
  const config = getTelegramConfig();
  const validation = validateTelegramConfig(config);

  if (!validation.isValid) {
    console.error('❌ Cannot start local bot: TELEGRAM_BOT_TOKEN is missing or not configured.');
    console.error('Please configure TELEGRAM_BOT_TOKEN in your .env file.');
    process.exit(1);
  }

  console.log('🗞️ Initializing THE FYNENCE Telegram Bot (Local Polling Mode)...');

  const controller = new TelegramBotController({ config });

  // Check if webhook is active to prevent conflicts
  try {
    const webhookInfo = await controller.bot.api.getWebhookInfo();
    if (webhookInfo.url) {
      console.warn(`⚠️ Warning: An active webhook is registered (${webhookInfo.url}).`);
      console.warn('Deleting webhook temporarily for local long polling...');
      await controller.bot.api.deleteWebhook();
      console.log('✓ Webhook cleared for polling.');
    }
  } catch (err: any) {
    console.error('Error checking webhook info:', err.message);
  }

  console.log('✅ Bot started! Listening for Telegram commands: /start, /daily, /finance, /market, /weather, /newspaper');

  await controller.bot.start({
    onStart: (botInfo) => {
      console.log(`🤖 Connected as @${botInfo.username} (ID: ${botInfo.id})`);
    },
  });
}

startLocalBot().catch((err) => {
  console.error('Fatal error in local bot:', err);
  process.exit(1);
});
