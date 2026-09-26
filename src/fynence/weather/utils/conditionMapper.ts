export type NormalizedWeatherCondition =
  | 'clear'
  | 'mostly_clear'
  | 'partly_cloudy'
  | 'cloudy'
  | 'overcast'
  | 'rain'
  | 'heavy_rain'
  | 'thunderstorm'
  | 'drizzle'
  | 'fog'
  | 'haze'
  | 'snow'
  | 'unknown';

export const RETRO_WEATHER_ICONS: Record<NormalizedWeatherCondition, string> = {
  clear: '☼',
  mostly_clear: '☼',
  partly_cloudy: '⛅',
  cloudy: '☁',
  overcast: '☁☁',
  rain: '☂',
  heavy_rain: '☔',
  thunderstorm: '⚡',
  drizzle: '☂',
  fog: '≡',
  haze: '≡',
  snow: '❄',
  unknown: '☼',
};

export const CONDITION_DISPLAY_LABELS: Record<NormalizedWeatherCondition, string> = {
  clear: 'Fair & Sunny',
  mostly_clear: 'Mostly Clear Skies',
  partly_cloudy: 'Partly Cloudy',
  cloudy: 'Cloudy Skies',
  overcast: 'Dense Overcast',
  rain: 'Moderate Rain',
  heavy_rain: 'Heavy Downpours',
  thunderstorm: 'Thunderstorms & Squalls',
  drizzle: 'Light Drizzle',
  fog: 'Ground Fog & Mist',
  haze: 'Atmospheric Haze',
  snow: 'Snowfall',
  unknown: 'Variable Conditions',
};

/**
 * Maps WMO (World Meteorological Organization) weather interpretation codes (0-99)
 * into THE FYNENCE normalized condition vocabulary.
 */
export function mapWmoCodeToNormalizedCondition(code: number | null | undefined): {
  condition: NormalizedWeatherCondition;
  conditionCode: string;
  displayLabel: string;
} {
  if (code === null || code === undefined || typeof code !== 'number' || isNaN(code)) {
    return {
      condition: 'unknown',
      conditionCode: 'unknown',
      displayLabel: CONDITION_DISPLAY_LABELS.unknown,
    };
  }

  const strCode = String(code);

  switch (code) {
    case 0:
      return { condition: 'clear', conditionCode: strCode, displayLabel: CONDITION_DISPLAY_LABELS.clear };
    case 1:
      return { condition: 'mostly_clear', conditionCode: strCode, displayLabel: CONDITION_DISPLAY_LABELS.mostly_clear };
    case 2:
      return { condition: 'partly_cloudy', conditionCode: strCode, displayLabel: CONDITION_DISPLAY_LABELS.partly_cloudy };
    case 3:
      return { condition: 'overcast', conditionCode: strCode, displayLabel: CONDITION_DISPLAY_LABELS.overcast };
    case 45:
    case 48:
      return { condition: 'fog', conditionCode: strCode, displayLabel: CONDITION_DISPLAY_LABELS.fog };
    case 51:
    case 53:
    case 55:
    case 56:
    case 57:
      return { condition: 'drizzle', conditionCode: strCode, displayLabel: CONDITION_DISPLAY_LABELS.drizzle };
    case 61:
    case 63:
    case 80:
    case 81:
      return { condition: 'rain', conditionCode: strCode, displayLabel: CONDITION_DISPLAY_LABELS.rain };
    case 65:
    case 66:
    case 67:
    case 82:
      return { condition: 'heavy_rain', conditionCode: strCode, displayLabel: CONDITION_DISPLAY_LABELS.heavy_rain };
    case 71:
    case 73:
    case 75:
    case 77:
    case 85:
    case 86:
      return { condition: 'snow', conditionCode: strCode, displayLabel: CONDITION_DISPLAY_LABELS.snow };
    case 95:
    case 96:
    case 99:
      return { condition: 'thunderstorm', conditionCode: strCode, displayLabel: CONDITION_DISPLAY_LABELS.thunderstorm };
    default:
      if (code > 0 && code < 40) {
        return { condition: 'cloudy', conditionCode: strCode, displayLabel: CONDITION_DISPLAY_LABELS.cloudy };
      }
      return { condition: 'unknown', conditionCode: strCode, displayLabel: CONDITION_DISPLAY_LABELS.unknown };
  }
}

/**
 * Maps free-form text or external provider condition strings to normalized conditions.
 */
export function mapStringToNormalizedCondition(rawStr?: string | null): NormalizedWeatherCondition {
  if (!rawStr || typeof rawStr !== 'string') return 'unknown';

  const s = rawStr.toLowerCase().trim();

  if (s.includes('thunder') || s.includes('lightning') || s.includes('storm')) return 'thunderstorm';
  if (s.includes('heavy rain') || s.includes('downpour') || s.includes('torrential') || s.includes('shower')) return 'heavy_rain';
  if (s.includes('drizzle') || s.includes('sprinkle') || s.includes('mist')) return 'drizzle';
  if (s.includes('rain') || s.includes('precipitation')) return 'rain';
  if (s.includes('snow') || s.includes('blizzard') || s.includes('sleet')) return 'snow';
  if (s.includes('fog')) return 'fog';
  if (s.includes('haze') || s.includes('smoke') || s.includes('dust')) return 'haze';
  if (s.includes('overcast')) return 'overcast';
  if (s.includes('partly cloudy') || s.includes('scattered clouds') || s.includes('broken clouds')) return 'partly_cloudy';
  if (s.includes('mostly clear') || s.includes('few clouds')) return 'mostly_clear';
  if (s.includes('cloud')) return 'cloudy';
  if (s.includes('clear') || s.includes('sunny') || s.includes('fair')) return 'clear';

  return 'unknown';
}

/**
 * Retrieves the retro Unicode icon for a given condition.
 */
export function getRetroWeatherIcon(condition: NormalizedWeatherCondition | string): string {
  const norm = (condition as NormalizedWeatherCondition) in RETRO_WEATHER_ICONS
    ? (condition as NormalizedWeatherCondition)
    : mapStringToNormalizedCondition(condition);
  return RETRO_WEATHER_ICONS[norm] || '☼';
}
