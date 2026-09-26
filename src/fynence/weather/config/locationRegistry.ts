export interface WeatherLocation {
  id: string;
  name: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  aliases?: string[];
}

/**
 * Official geographic registry for THE FYNENCE Weather Engine.
 * Coordinates are verified against official geocoding databases (Open-Meteo Geocoding / BMKG).
 * Default: Magelang, Central Java, Indonesia.
 */
export const WEATHER_LOCATIONS: Record<string, WeatherLocation> = {
  magelang: {
    id: 'magelang',
    name: 'Magelang',
    region: 'Central Java',
    country: 'Indonesia',
    latitude: -7.47056,
    longitude: 110.21778,
    timezone: 'Asia/Jakarta',
    aliases: [
      'magelang-central-java',
      'magelang, central java',
      'magelang, jawa tengah',
      'magelang, central java, indonesia',
      'magelang, jawa tengah, indonesia',
      'kota magelang',
    ],
  },
  jakarta: {
    id: 'jakarta',
    name: 'Jakarta',
    region: 'Special Capital Region',
    country: 'Indonesia',
    latitude: -6.2088,
    longitude: 106.8456,
    timezone: 'Asia/Jakarta',
    aliases: ['dki jakarta', 'jakarta special capital region', 'jakarta, indonesia'],
  },
  yogyakarta: {
    id: 'yogyakarta',
    name: 'Yogyakarta',
    region: 'Special Region of Yogyakarta',
    country: 'Indonesia',
    latitude: -7.7956,
    longitude: 110.3695,
    timezone: 'Asia/Jakarta',
    aliases: ['jogja', 'daerah istimewa yogyakarta', 'yogyakarta, indonesia'],
  },
  semarang: {
    id: 'semarang',
    name: 'Semarang',
    region: 'Central Java',
    country: 'Indonesia',
    latitude: -6.9667,
    longitude: 110.4167,
    timezone: 'Asia/Jakarta',
    aliases: ['semarang, central java', 'semarang, jawa tengah'],
  },
  surabaya: {
    id: 'surabaya',
    name: 'Surabaya',
    region: 'East Java',
    country: 'Indonesia',
    latitude: -7.2575,
    longitude: 112.7521,
    timezone: 'Asia/Jakarta',
    aliases: ['surabaya, east java', 'surabaya, jawa timur'],
  },
  singapore: {
    id: 'singapore',
    name: 'Singapore',
    region: 'Central Region',
    country: 'Singapore',
    latitude: 1.3521,
    longitude: 103.8198,
    timezone: 'Asia/Singapore',
    aliases: ['singapore financial district', 'sg'],
  },
  tokyo: {
    id: 'tokyo',
    name: 'Tokyo',
    region: 'Kanto',
    country: 'Japan',
    latitude: 35.6762,
    longitude: 139.6503,
    timezone: 'Asia/Tokyo',
    aliases: ['tokyo financial district', 'tokyo, japan'],
  },
};

export const DEFAULT_WEATHER_LOCATION_ID = 'magelang';

/**
 * Resolves a location identifier or search query to a normalized WeatherLocation.
 * Falls back to default location (Magelang) if not found.
 */
export function getWeatherLocation(idOrQuery?: string): WeatherLocation {
  if (!idOrQuery || !idOrQuery.trim()) {
    return WEATHER_LOCATIONS[DEFAULT_WEATHER_LOCATION_ID];
  }

  const query = idOrQuery.toLowerCase().trim();

  // 1. Direct key match
  if (WEATHER_LOCATIONS[query]) {
    return WEATHER_LOCATIONS[query];
  }

  // 2. Check aliases or substrings
  for (const loc of Object.values(WEATHER_LOCATIONS)) {
    if (loc.id === query || loc.name.toLowerCase() === query) {
      return loc;
    }
    if (loc.aliases && loc.aliases.some(alias => alias.toLowerCase() === query || query.includes(alias.toLowerCase()))) {
      return loc;
    }
    if (query.includes(loc.id) || query.includes(loc.name.toLowerCase())) {
      return loc;
    }
  }

  // Default fallback to Magelang
  return WEATHER_LOCATIONS[DEFAULT_WEATHER_LOCATION_ID];
}

/**
 * Resolves a location string to its normalized canonical ID.
 */
export function resolveLocationId(idOrQuery?: string): string {
  return getWeatherLocation(idOrQuery).id;
}

/**
 * Returns all configured weather locations.
 */
export function listWeatherLocations(): WeatherLocation[] {
  return Object.values(WEATHER_LOCATIONS);
}
