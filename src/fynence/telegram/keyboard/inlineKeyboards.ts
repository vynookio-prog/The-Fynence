import { InlineKeyboard } from 'grammy';
import type { TelegramFormatOption } from '../types';

export function createStartMenuKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('📰 Daily Edition', 'edition:daily')
    .row()
    .text('💰 Finance + Economy', 'edition:finance')
    .row()
    .text('📊 Capital Markets', 'edition:market')
    .text('🌦️ Magelang Weather', 'edition:weather')
    .row()
    .text('⚙️ Custom Edition', 'action:custom')
    .text('❓ Help', 'action:help');
}

export function createFormatSelectionKeyboard(editionKey: string): InlineKeyboard {
  return new InlineKeyboard()
    .text('🖼️ Image', `format:image:${editionKey}`)
    .text('📄 PDF', `format:pdf:${editionKey}`)
    .text('🖼️ + 📄 Both', `format:both:${editionKey}`);
}

export function createSourcesKeyboard(articleCount: number): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  if (articleCount > 0) {
    keyboard.text('🔗 View Article Sources', 'action:sources');
  }
  keyboard.text('🗞️ Another Edition', 'edition:daily');
  return keyboard;
}
