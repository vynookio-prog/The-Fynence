export const DEFAULT_DISPLAY_TIMEZONE = 'Asia/Jakarta';

const TIMEZONE_ABBREVIATIONS: Record<string, string> = {
  'Asia/Jakarta': 'WIB',
  'Asia/Bangkok': 'ICT',
  'Asia/Makassar': 'WITA',
  'Asia/Jayapura': 'WIT',
  'Asia/Singapore': 'SGT',
  'Asia/Tokyo': 'JST',
  'Europe/London': 'GMT',
  'America/New_York': 'EST',
  UTC: 'UTC',
};

/**
 * Normalizes any timestamp or Date object into a strict UTC ISO 8601 string.
 */
export function toUtcIsoString(input?: Date | string | number | null): string {
  if (!input) {
    return new Date().toISOString();
  }
  const date = input instanceof Date ? input : new Date(input);
  if (isNaN(date.getTime())) {
    return new Date().toISOString();
  }
  return date.toISOString();
}

/**
 * Gets a friendly timezone abbreviation (e.g. WIB for Asia/Jakarta).
 */
export function getTimezoneAbbreviation(timezone: string = DEFAULT_DISPLAY_TIMEZONE): string {
  return TIMEZONE_ABBREVIATIONS[timezone] || timezone;
}

/**
 * Formats a date into classic broadsheet newspaper long format:
 * Example: "Sunday, 27 September 2026"
 */
export function formatNewspaperDateLong(
  input: Date | string | number,
  timezone: string = DEFAULT_DISPLAY_TIMEZONE
): string {
  const date = input instanceof Date ? input : new Date(input);
  if (isNaN(date.getTime())) return 'Invalid Date';

  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return formatter.format(date);
}

/**
 * Formats a date into concise uppercase newspaper dateline format:
 * Example: "27 SEP 2026"
 */
export function formatNewspaperDateShort(
  input: Date | string | number,
  timezone: string = DEFAULT_DISPLAY_TIMEZONE
): string {
  const date = input instanceof Date ? input : new Date(input);
  if (isNaN(date.getTime())) return 'INVALID DATE';

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).formatToParts(date);

  const day = parts.find(p => p.type === 'day')?.value || '';
  let month = (parts.find(p => p.type === 'month')?.value || '').toUpperCase();
  if (month.length > 3) {
    month = month.slice(0, 3);
  }
  const year = parts.find(p => p.type === 'year')?.value || '';

  return `${day} ${month} ${year}`.trim();
}

/**
 * Formats time for dispatch ear:
 * Example: "07:30 WIB"
 */
export function formatNewspaperTime(
  input: Date | string | number,
  timezone: string = DEFAULT_DISPLAY_TIMEZONE
): string {
  const date = input instanceof Date ? input : new Date(input);
  if (isNaN(date.getTime())) return '--:--';

  const timeStr = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);

  const tzAbbr = getTimezoneAbbreviation(timezone);
  return `${timeStr} ${tzAbbr}`.trim();
}

/**
 * Extracts a calendar YYYY-MM-DD key for a given timestamp in the specified timezone.
 */
export function getDateKeyInTimezone(
  input: Date | string | number,
  timezone: string = DEFAULT_DISPLAY_TIMEZONE
): string {
  const date = input instanceof Date ? input : new Date(input);
  if (isNaN(date.getTime())) return new Date().toISOString().split('T')[0];

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}
