if (typeof process !== 'undefined' && typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {}
}

import { Bot } from 'grammy';
import { getTelegramConfig, validateTelegramConfig } from '../src/fynence/telegram/config/telegramConfig';

async function main() {
  const action = process.argv[2] || 'info';
  const config = getTelegramConfig();
  const validation = validateTelegramConfig(config);

  if (!validation.isValid) {
    console.error('❌ Cannot perform webhook operations: TELEGRAM_BOT_TOKEN is missing or not configured.');
    process.exit(1);
  }

  const bot = new Bot(config.botToken);

  try {
    switch (action) {
      case 'set': {
        const webhookUrl = process.argv[3] || config.webhookUrl;
        if (!webhookUrl) {
          console.error('❌ Please specify a webhook URL or set TELEGRAM_WEBHOOK_URL.');
          console.log('Usage: npm run telegram:webhook:set https://your-domain.com/api/telegram/webhook');
          process.exit(1);
        }

        console.log(`Setting Telegram webhook to: ${webhookUrl}...`);
        await bot.api.setWebhook(webhookUrl, {
          secret_token: config.webhookSecret,
          allowed_updates: ['message', 'callback_query'],
          drop_pending_updates: false,
        });
        console.log('✅ Webhook successfully configured with Telegram!');
        break;
      }

      case 'info': {
        const info = await bot.api.getWebhookInfo();
        console.log('--- Telegram Webhook Status ---');
        console.log(`URL: ${info.url || '(none - polling mode)'}`);
        console.log(`Has Custom Certificate: ${info.has_custom_certificate}`);
        console.log(`Pending Update Count: ${info.pending_update_count}`);
        if (info.last_error_date) {
          console.log(`Last Error Date: ${new Date(info.last_error_date * 1000).toISOString()}`);
          console.log(`Last Error Message: ${info.last_error_message}`);
        }
        console.log(`Max Connections: ${info.max_connections || 'default'}`);
        break;
      }

      case 'delete': {
        console.log('Deleting Telegram webhook...');
        await bot.api.deleteWebhook({ drop_pending_updates: false });
        console.log('✅ Webhook successfully deleted. Bot can now use long polling.');
        break;
      }

      default:
        console.log('Usage: npx tsx scripts/telegram-webhook.ts [set|info|delete] [optional-url]');
    }
  } catch (err: any) {
    console.error('❌ Telegram Webhook API Error:', err.message || err);
    process.exit(1);
  }
}

main();
