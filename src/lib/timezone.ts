export interface TimezoneOption {
  value: string;
  label: string;
  short: string;
}

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { value: 'UTC', label: 'UTC / GMT (UTC+0)', short: 'UTC' },
  { value: 'Asia/Jakarta', label: 'WIB - Jakarta / Bangkok (UTC+7)', short: 'WIB' },
  { value: 'Asia/Makassar', label: 'WITA - Bali / Makassar (UTC+8)', short: 'WITA' },
  { value: 'Asia/Jayapura', label: 'WIT - Jayapura / Papua (UTC+9)', short: 'WIT' },
  { value: 'Asia/Singapore', label: 'SGT - Singapore / KL (UTC+8)', short: 'SGT' },
  { value: 'America/New_York', label: 'EST/EDT - New York (UTC-5/-4)', short: 'EST' },
  { value: 'America/Chicago', label: 'CST/CDT - Chicago (UTC-6/-5)', short: 'CST' },
  { value: 'America/Los_Angeles', label: 'PST/PDT - Los Angeles (UTC-8/-7)', short: 'PST' },
  { value: 'Europe/London', label: 'GMT/BST - London (UTC+0/+1)', short: 'LDN' },
  { value: 'Europe/Frankfurt', label: 'CET/CEST - Frankfurt / Paris (UTC+1/+2)', short: 'CET' },
  { value: 'Asia/Tokyo', label: 'JST - Tokyo / Seoul (UTC+9)', short: 'JST' },
  { value: 'Australia/Sydney', label: 'AEST/AEDT - Sydney (UTC+10/+11)', short: 'AEST' },
  { value: 'Asia/Dubai', label: 'GST - Dubai (UTC+4)', short: 'GST' },
  { value: 'local', label: 'Local Device Time (Waktu Perangkat)', short: 'LOCAL' },
];

export const STORAGE_KEY_TIMEZONE = 'fynence_timezone';
export const LEGACY_STORAGE_KEY_TIMEZONE = 'fynence_news_timezone';

export function getStoredTimezone(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY_TIMEZONE) || localStorage.getItem(LEGACY_STORAGE_KEY_TIMEZONE);
    if (saved) return saved;

    // Check cookie fallback
    try {
      const match = document.cookie.match(/(?:^|;\s*)fynence_tz=([^;]+)/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
    } catch {}

    // Check user profile cache in localStorage
    const profileStr = localStorage.getItem('fynence_user_profile');
    if (profileStr) {
      try {
        const parsed = JSON.parse(profileStr);
        if (typeof parsed?.timezone === 'string' && parsed.timezone) {
          return parsed.timezone;
        }
      } catch {}
    }
  }
  return 'UTC';
}

export function setStoredTimezone(tz: string): void {
  if (typeof window !== 'undefined' && tz) {
    localStorage.setItem(STORAGE_KEY_TIMEZONE, tz);
    localStorage.setItem(LEGACY_STORAGE_KEY_TIMEZONE, tz);

    // Synchronize to cookie for multi-tab and SSR consistency
    try {
      document.cookie = `fynence_tz=${encodeURIComponent(tz)}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {}

    // Keep cached user profile synchronized so refresh never overwrites it
    const profileStr = localStorage.getItem('fynence_user_profile');
    if (profileStr) {
      try {
        const parsed = JSON.parse(profileStr);
        parsed.timezone = tz;
        localStorage.setItem('fynence_user_profile', JSON.stringify(parsed));
      } catch {}
    }

    window.dispatchEvent(new CustomEvent('fynence_timezone_change', { detail: tz }));
  }
}

export function getTimezoneShort(timeZone: string): string {
  const found = TIMEZONE_OPTIONS.find((t) => t.value === timeZone);
  return found ? found.short : timeZone;
}

export interface FormattedDateTime {
  date: string;
  time: string;
  full: string;
}

export function formatEventDateTime(dateStr: string, timeZone: string = 'UTC'): FormattedDateTime {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    return { date: '--', time: '--', full: '--' };
  }

  const tzOption: Intl.DateTimeFormatOptions = timeZone === 'local' ? {} : { timeZone };

  try {
    const date = new Intl.DateTimeFormat('en-US', {
      ...tzOption,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(d);

    const time = new Intl.DateTimeFormat('en-GB', {
      ...tzOption,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d);

    const full = new Intl.DateTimeFormat('en-US', {
      ...tzOption,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d);

    return { date, time, full };
  } catch {
    return {
      date: d.toLocaleDateString(),
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      full: d.toLocaleString(),
    };
  }
}

/**
 * Returns current hour (0-23) in the specified timezone
 */
export function getCurrentHourForTimezone(timeZone: string = 'UTC', date: Date = new Date()): number {
  const tzOption: Intl.DateTimeFormatOptions = timeZone === 'local' ? {} : { timeZone };
  try {
    const hourStr = new Intl.DateTimeFormat('en-GB', {
      ...tzOption,
      hour: 'numeric',
      hour12: false,
    }).format(date);
    const parsed = parseInt(hourStr, 10);
    return isNaN(parsed) ? date.getHours() : parsed;
  } catch {
    return date.getHours();
  }
}

/**
 * Generates context-aware greeting ("GOOD MORNING.", "GOOD AFTERNOON.", "GOOD EVENING.", "GOOD NIGHT.")
 * calibrated to the given timezone
 */
export function getGreetingForTimezone(timeZone: string = 'UTC', date: Date = new Date()): string {
  const hour = getCurrentHourForTimezone(timeZone, date);
  if (hour >= 5 && hour < 12) {
    return 'GOOD MORNING.';
  } else if (hour >= 12 && hour < 17) {
    return 'GOOD AFTERNOON.';
  } else if (hour >= 17 && hour < 21) {
    return 'GOOD EVENING.';
  } else {
    return 'GOOD NIGHT.';
  }
}

/**
 * Returns localized date string in the specified timezone (e.g. "Wednesday, September 9, 2026")
 */
export function getFormattedDateForTimezone(timeZone: string = 'UTC', date: Date = new Date()): string {
  const tzOption: Intl.DateTimeFormatOptions = timeZone === 'local' ? {} : { timeZone };
  try {
    return new Intl.DateTimeFormat('en-US', {
      ...tzOption,
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }
}

/**
 * Returns localized time string in the specified timezone (e.g. "14:25:08")
 */
export function getFormattedTimeForTimezone(timeZone: string = 'UTC', date: Date = new Date(), withSeconds = false): string {
  const tzOption: Intl.DateTimeFormatOptions = timeZone === 'local' ? {} : { timeZone };
  try {
    return new Intl.DateTimeFormat('en-GB', {
      ...tzOption,
      hour: '2-digit',
      minute: '2-digit',
      ...(withSeconds ? { second: '2-digit' } : {}),
      hour12: false,
    }).format(date);
  } catch {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }
}
