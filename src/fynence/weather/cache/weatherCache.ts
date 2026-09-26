import type { CurrentWeather, DailyForecast } from '../types';

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  ttlMs: number;
}

export class WeatherCache {
  private currentWeatherCache: Map<string, CacheEntry<CurrentWeather>> = new Map();
  private forecastCache: Map<string, CacheEntry<DailyForecast[]>> = new Map();
  private pendingWeatherRequests: Map<string, Promise<CurrentWeather>> = new Map();
  private defaultTtlMs: number;

  constructor(defaultTtlSeconds = 900) {
    const envTtl =
      typeof process !== 'undefined' && process.env.WEATHER_CACHE_TTL_SECONDS
        ? parseInt(process.env.WEATHER_CACHE_TTL_SECONDS, 10)
        : defaultTtlSeconds;

    this.defaultTtlMs = (isNaN(envTtl) || envTtl <= 0 ? defaultTtlSeconds : envTtl) * 1000;
  }

  private normalizeKey(locationId: string): string {
    return locationId.toLowerCase().trim();
  }

  /**
   * Retrieves fresh cached weather data. Returns null if expired or missing.
   */
  public get(locationId: string): CurrentWeather | null {
    const key = this.normalizeKey(locationId);
    const entry = this.currentWeatherCache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.cachedAt > entry.ttlMs) {
      return null;
    }

    return entry.data;
  }

  /**
   * Retrieves last-known cached weather data even if expired.
   * Marks isStale: true while strictly preserving observedAt and data values.
   */
  public getStale(locationId: string): CurrentWeather | null {
    const key = this.normalizeKey(locationId);
    const entry = this.currentWeatherCache.get(key);
    if (!entry) return null;

    return {
      ...entry.data,
      isStale: true,
    };
  }

  /**
   * Stores fresh weather observations into cache.
   */
  public set(locationId: string, weather: CurrentWeather, ttlSeconds?: number): void {
    const key = this.normalizeKey(locationId);
    const ttlMs = ttlSeconds !== undefined && ttlSeconds > 0 ? ttlSeconds * 1000 : this.defaultTtlMs;

    this.currentWeatherCache.set(key, {
      data: { ...weather, isStale: false },
      cachedAt: Date.now(),
      ttlMs,
    });
  }

  /**
   * Retrieves fresh cached forecast data.
   */
  public getForecast(locationId: string): DailyForecast[] | null {
    const key = this.normalizeKey(locationId);
    const entry = this.forecastCache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.cachedAt > entry.ttlMs) {
      return null;
    }

    return entry.data;
  }

  /**
   * Retrieves last-known cached forecast data even if expired.
   */
  public getStaleForecast(locationId: string): DailyForecast[] | null {
    const key = this.normalizeKey(locationId);
    const entry = this.forecastCache.get(key);
    if (!entry) return null;
    return entry.data;
  }

  /**
   * Stores forecast data into cache.
   */
  public setForecast(locationId: string, forecasts: DailyForecast[], ttlSeconds?: number): void {
    const key = this.normalizeKey(locationId);
    const ttlMs = ttlSeconds !== undefined && ttlSeconds > 0 ? ttlSeconds * 1000 : this.defaultTtlMs;

    this.forecastCache.set(key, {
      data: forecasts,
      cachedAt: Date.now(),
      ttlMs,
    });
  }

  /**
   * Deduplicates concurrent fetch requests for the same location.
   */
  public async deduplicateFetch(
    locationId: string,
    fetchFn: () => Promise<CurrentWeather>
  ): Promise<CurrentWeather> {
    const key = this.normalizeKey(locationId);
    const existing = this.pendingWeatherRequests.get(key);
    if (existing) {
      return existing;
    }

    const promise = (async () => {
      try {
        return await fetchFn();
      } finally {
        this.pendingWeatherRequests.delete(key);
      }
    })();

    this.pendingWeatherRequests.set(key, promise);
    return promise;
  }

  /**
   * Clears all in-memory caches and pending requests.
   */
  public clear(): void {
    this.currentWeatherCache.clear();
    this.forecastCache.clear();
    this.pendingWeatherRequests.clear();
  }

  public size(): number {
    return this.currentWeatherCache.size;
  }
}

export const weatherCache = new WeatherCache();
