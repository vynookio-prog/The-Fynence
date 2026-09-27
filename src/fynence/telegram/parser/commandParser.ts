import type { NewspaperSectionName } from '../../renderer/types/document';
import type { ParsedCommand, TelegramBotCommand } from '../types';

export const SUPPORTED_SECTIONS: readonly NewspaperSectionName[] = [
  'daily_news',
  'world',
  'national',
  'business',
  'finance',
  'economy',
  'technology',
  'forex',
  'crypto',
  'markets',
  'weather',
] as const;

export const SECTION_ALIASES: Record<string, NewspaperSectionName> = {
  daily: 'daily_news',
  news: 'daily_news',
  daily_news: 'daily_news',
  world: 'world',
  national: 'national',
  business: 'business',
  finance: 'finance',
  fin: 'finance',
  economy: 'economy',
  econ: 'economy',
  economic: 'economy',
  technology: 'technology',
  tech: 'technology',
  forex: 'forex',
  fx: 'forex',
  crypto: 'crypto',
  kripto: 'crypto',
  market: 'markets',
  markets: 'markets',
  weather: 'weather',
  cuaca: 'weather',
};

export class TelegramCommandParser {
  /**
   * Parses raw user text into structured command and arguments.
   * Case-insensitive, robust against Telegram @botusername suffixes.
   */
  public parse(text: string): ParsedCommand {
    const trimmed = (text || '').trim();
    if (!trimmed.startsWith('/')) {
      return {
        command: 'unknown',
        rawArgs: trimmed,
        sections: [],
        unsupportedSections: [],
      };
    }

    // Split into command token and remaining args
    const parts = trimmed.split(/\s+/);
    const commandPart = parts[0].toLowerCase();
    const rawArgs = parts.slice(1).join(' ').trim();

    // Strip bot username suffix e.g. /daily@TheFynenceBot -> /daily
    const cleanCommand = commandPart.split('@')[0].slice(1) as TelegramBotCommand;

    switch (cleanCommand) {
      case 'start':
      case 'help':
      case 'daily':
      case 'finance':
      case 'market':
      case 'weather':
        return {
          command: cleanCommand,
          rawArgs,
          sections: this.getDefaultSectionsForCommand(cleanCommand),
          unsupportedSections: [],
        };

      case 'newspaper': {
        const { validSections, invalidTokens } = this.parseSectionsFromArgs(parts.slice(1));
        return {
          command: 'newspaper',
          rawArgs,
          sections: validSections,
          unsupportedSections: invalidTokens,
        };
      }

      default:
        return {
          command: 'unknown',
          rawArgs,
          sections: [],
          unsupportedSections: [],
        };
    }
  }

  public parseSectionsFromArgs(args: string[]): {
    validSections: NewspaperSectionName[];
    invalidTokens: string[];
  } {
    const validSections: NewspaperSectionName[] = [];
    const invalidTokens: string[] = [];
    const seen = new Set<string>();

    for (const rawToken of args) {
      const token = rawToken.toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (!token) continue;

      const normalized = SECTION_ALIASES[token];
      if (normalized) {
        if (!seen.has(normalized)) {
          seen.add(normalized);
          validSections.push(normalized);
        }
      } else {
        invalidTokens.push(rawToken);
      }
    }

    return { validSections, invalidTokens };
  }

  public getDefaultSectionsForCommand(cmd: TelegramBotCommand): NewspaperSectionName[] {
    switch (cmd) {
      case 'daily':
        return ['daily_news', 'world', 'national', 'business', 'finance', 'economy', 'markets', 'weather'];
      case 'finance':
        return ['finance', 'economy', 'markets'];
      case 'market':
        return ['markets', 'forex', 'crypto'];
      case 'weather':
        return ['weather'];
      default:
        return [];
    }
  }

  public getAvailableSectionsDisplay(): string {
    return 'daily, finance, economy, markets, weather, world, national, business, technology, forex, crypto';
  }
}

export const defaultTelegramCommandParser = new TelegramCommandParser();
