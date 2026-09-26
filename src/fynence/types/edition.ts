export type NewspaperSectionType =
  | 'top_story'
  | 'world'
  | 'national'
  | 'business'
  | 'technology'
  | 'finance'
  | 'economy'
  | 'forex'
  | 'crypto'
  | 'markets'
  | 'economic_calendar'
  | 'weather'
  | 'tomorrow_watch';

export type EditionType =
  | 'daily'
  | 'custom'
  | 'breaking'
  | 'weekly_digest';

export type EditionFormat = 'webp' | 'png' | 'pdf';

export type EditionTheme =
  | 'retro_black_cream'
  | 'vintage_sepia'
  | 'classic_monochrome';

export interface WeatherSectionConfig {
  enabled: boolean;
  location: string;
}

export interface EditionConfig {
  id?: string;
  type: EditionType;
  title: string;
  subtitle: string;
  date?: string;
  sections: NewspaperSectionType[];
  weather: WeatherSectionConfig;
  format: EditionFormat;
  theme: EditionTheme;
}

export type EditionStatus =
  | 'draft'
  | 'processing'
  | 'composed'
  | 'rendered'
  | 'delivered'
  | 'failed';

export const DEFAULT_WEATHER_LOCATION = 'Magelang, Jawa Tengah, Indonesia';

export const DEFAULT_DAILY_SECTIONS: NewspaperSectionType[] = [
  'top_story',
  'world',
  'national',
  'business',
  'technology',
  'finance',
  'economy',
  'weather',
  'markets',
  'economic_calendar',
  'tomorrow_watch',
];

export const DEFAULT_DAILY_EDITION_CONFIG: Readonly<EditionConfig> = {
  type: 'daily',
  title: 'THE FYNENCE',
  subtitle: 'DAILY FINANCIAL DISPATCH',
  sections: DEFAULT_DAILY_SECTIONS,
  weather: {
    enabled: true,
    location: DEFAULT_WEATHER_LOCATION,
  },
  format: 'webp',
  theme: 'retro_black_cream',
};
