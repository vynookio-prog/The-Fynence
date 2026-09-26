import {
  DEFAULT_DAILY_SECTIONS,
  DEFAULT_WEATHER_LOCATION,
  type EditionConfig,
  type EditionFormat,
  type EditionTheme,
  type NewspaperSectionType,
} from '../types/edition';

export const ALL_NEWSPAPER_SECTIONS: readonly NewspaperSectionType[] = [
  'top_story',
  'world',
  'national',
  'business',
  'technology',
  'finance',
  'economy',
  'forex',
  'crypto',
  'markets',
  'economic_calendar',
  'weather',
  'tomorrow_watch',
] as const;

export function createEditionConfig(options: {
  title?: string;
  subtitle?: string;
  sections?: NewspaperSectionType[];
  weatherLocation?: string;
  weatherEnabled?: boolean;
  format?: EditionFormat;
  theme?: EditionTheme;
}): EditionConfig {
  return {
    type: 'daily',
    title: options.title || 'THE FYNENCE',
    subtitle: options.subtitle || 'DAILY EDITION',
    sections: options.sections ? [...options.sections] : [...DEFAULT_DAILY_SECTIONS],
    weather: {
      enabled: options.weatherEnabled ?? true,
      location: options.weatherLocation || DEFAULT_WEATHER_LOCATION,
    },
    format: options.format || 'webp',
    theme: options.theme || 'retro_black_cream',
  };
}

export const EDITION_PRESETS: Record<string, EditionConfig> = {
  daily: createEditionConfig({
    title: 'THE FYNENCE',
    subtitle: 'DAILY FINANCIAL DISPATCH',
    sections: [...DEFAULT_DAILY_SECTIONS],
    weatherEnabled: true,
    weatherLocation: DEFAULT_WEATHER_LOCATION,
    format: 'webp',
    theme: 'retro_black_cream',
  }),
  finance_economy: createEditionConfig({
    title: 'THE FYNENCE',
    subtitle: 'MACRO & MARKETS INTELLIGENCE',
    sections: ['top_story', 'finance', 'economy', 'markets', 'economic_calendar'],
    weatherEnabled: false,
    format: 'webp',
    theme: 'retro_black_cream',
  }),
  tech_world: createEditionConfig({
    title: 'THE FYNENCE',
    subtitle: 'GLOBAL TECHNOLOGY & CAPITAL',
    sections: ['top_story', 'technology', 'business', 'world', 'tomorrow_watch'],
    weatherEnabled: false,
    format: 'webp',
    theme: 'retro_black_cream',
  }),
};
