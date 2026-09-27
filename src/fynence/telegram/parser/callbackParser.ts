import type { ParsedCallback, TelegramFormatOption } from '../types';

export class TelegramCallbackParser {
  /**
   * Safely parses and validates callback_data strings.
   * Format expectations:
   *   edition:<editionType>
   *   format:<formatType>[:<editionType>]
   *   action:<actionName>
   */
  public parse(data?: string | null): ParsedCallback {
    if (!data || typeof data !== 'string') {
      return { type: 'unknown', raw: '' };
    }

    const trimmed = data.trim();
    const parts = trimmed.split(':');
    const prefix = parts[0]?.toLowerCase();
    const value = parts[1]?.toLowerCase();

    if (prefix === 'edition') {
      if (['daily', 'finance', 'market', 'weather', 'custom'].includes(value)) {
        return {
          type: 'edition',
          edition: value as 'daily' | 'finance' | 'market' | 'weather' | 'custom',
        };
      }
    } else if (prefix === 'format') {
      if (['image', 'pdf', 'both'].includes(value)) {
        const edition = parts[2]?.toLowerCase();
        return {
          type: 'format',
          format: value as TelegramFormatOption,
          edition,
        };
      }
    } else if (prefix === 'action') {
      if (['help', 'custom', 'sources'].includes(value)) {
        return {
          type: 'action',
          action: value as 'help' | 'custom' | 'sources',
        };
      }
    }

    return { type: 'unknown', raw: trimmed };
  }
}

export const defaultTelegramCallbackParser = new TelegramCallbackParser();
