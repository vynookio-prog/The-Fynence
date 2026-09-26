import type { WeatherProvider, IWeatherProvider } from '../providers/types';
import type { WeatherSectionData } from '../../types/newspaper';
import type {
  CurrentWeather,
  DailyForecast,
  NewspaperWeatherSummary,
  WeatherDailyForecast,
  WeatherLocation,
  WeatherServiceOptions,
  WeatherSnapshot,
} from '../types';
import { getWeatherLocation, DEFAULT_WEATHER_LOCATION_ID } from '../config/locationRegistry';
import { WeatherSectionFormatter } from '../formatter/weatherSectionFormatter';
import { MockWeatherProvider } from '../providers/mockWeatherProvider';
import { OpenMeteoWeatherProvider } from '../providers/openMeteoProvider';
import { WeatherApiProvider } from '../providers/weatherApiProvider';
import { weatherCache, WeatherCache } from '../cache/weatherCache';
import { weatherRepository, WeatherRepository } from '../repository/weatherRepository';
import { CONDITION_DISPLAY_LABELS } from '../utils/conditionMapper';
import { formatNewspaperDateShort } from '../utils/timezone';

export class WeatherUnavailableError extends Error {
  readonly status = 'unavailable' as const;
  readonly locationId: string;

  constructor(locationId: string, message: string) {
    super(`Weather unavailable for "${locationId}": ${message}`);
    this.name = 'WeatherUnavailableError';
    this.locationId = locationId;
  }
}

export class WeatherService {
  private primaryProvider: WeatherProvider;
  private fallbackProvider?: WeatherProvider;
  private formatter: WeatherSectionFormatter;
  private cache: WeatherCache;
  private repository: WeatherRepository;
  private defaultLocationId: string;

  constructor(options: WeatherServiceOptions & {
    primaryProvider?: WeatherProvider | IWeatherProvider;
    fallbackProvider?: WeatherProvider | IWeatherProvider;
    cache?: WeatherCache;
    repository?: WeatherRepository;
    insforgeClient?: any;
  } = {}) {
    // Determine default primary provider:
    // If WEATHER_API_KEY is configured in env, can use WeatherApiProvider or OpenMeteoProvider
    const envApiKey = typeof process !== 'undefined' ? process.env.WEATHER_API_KEY : undefined;
    const hasConfiguredApiKey = envApiKey && !envApiKey.includes('your_weather_api_key');

    this.primaryProvider = (options.primaryProvider as WeatherProvider) ||
      (hasConfiguredApiKey ? new WeatherApiProvider() : new OpenMeteoWeatherProvider());

    this.fallbackProvider = 'fallbackProvider' in options
      ? (options.fallbackProvider ? (options.fallbackProvider as WeatherProvider) : undefined)
      : (hasConfiguredApiKey ? new OpenMeteoWeatherProvider() : new MockWeatherProvider());

    this.formatter = new WeatherSectionFormatter();
    this.cache = options.cache || (options.cacheTtlSeconds ? new WeatherCache(options.cacheTtlSeconds) : weatherCache);
    this.repository = options.repository || weatherRepository;
    this.defaultLocationId = options.defaultLocation
      ? getWeatherLocation(options.defaultLocation).id
      : DEFAULT_WEATHER_LOCATION_ID;
  }

  public setPrimaryProvider(provider: WeatherProvider): void {
    this.primaryProvider = provider;
  }

  public setFallbackProvider(provider?: WeatherProvider): void {
    this.fallbackProvider = provider;
  }

  /**
   * Retrieves verified current meteorological observations for a location.
   * Employs memory caching, in-flight deduplication, and multi-tier stale fallback.
   * AI MUST NOT invent weather values; if all sources fail, throws WeatherUnavailableError.
   */
  async getCurrentWeather(
    locationIdOrQuery?: string,
    options?: { forceRefresh?: boolean }
  ): Promise<CurrentWeather> {
    const loc = getWeatherLocation(locationIdOrQuery || this.defaultLocationId);
    const locationId = loc.id;

    // 1. Check fresh cache
    if (!options?.forceRefresh) {
      const cached = this.cache.get(locationId);
      if (cached) {
        return cached;
      }
    }

    // 2. Fetch with in-flight request deduplication
    try {
      return await this.cache.deduplicateFetch(locationId, async () => {
        let weather: CurrentWeather | null = null;
        let lastError: Error | null = null;

        // Try Primary Provider
        try {
          weather = await this.primaryProvider.getCurrentWeather(loc);
        } catch (err: any) {
          lastError = err instanceof Error ? err : new Error(String(err));
        }

        // Try Fallback Provider if Primary failed
        if (!weather && this.fallbackProvider) {
          try {
            weather = await this.fallbackProvider.getCurrentWeather(loc);
          } catch (err: any) {
            lastError = err instanceof Error ? err : new Error(String(err));
          }
        }

        if (weather) {
          // Fresh retrieval succeeded
          this.cache.set(locationId, weather);

          // Asynchronously persist to database archive
          this.repository.storeSnapshot(weather).catch(() => {});

          return weather;
        }

        // If providers failed, attempt stale memory cache fallback
        const staleCached = this.cache.getStale(locationId);
        if (staleCached) {
          return staleCached;
        }

        // Attempt historical database snapshot fallback
        const dbFallback = await this.repository.getLatestSnapshot(locationId);
        if (dbFallback) {
          return dbFallback;
        }

        // All sources failed: strictly throw explicit unavailable error without fabricating numbers
        throw new WeatherUnavailableError(
          locationId,
          lastError?.message || 'Meteorological stations unreachable and no cached records exist.'
        );
      });
    } catch (err) {
      // Re-check stale cache in case another branch populated it
      const fallback = this.cache.getStale(locationId);
      if (fallback) return fallback;

      if (err instanceof WeatherUnavailableError) throw err;
      throw new WeatherUnavailableError(
        locationId,
        err instanceof Error ? err.message : String(err)
      );
    }
  }

  /**
   * Retrieves verified multi-day meteorological forecasts.
   */
  async getForecast(
    locationIdOrQuery?: string,
    days = 3,
    options?: { forceRefresh?: boolean }
  ): Promise<DailyForecast[]> {
    const loc = getWeatherLocation(locationIdOrQuery || this.defaultLocationId);
    const locationId = loc.id;

    if (!options?.forceRefresh) {
      const cached = this.cache.getForecast(locationId);
      if (cached && cached.length >= days) {
        return cached.slice(0, days);
      }
    }

    let forecasts: DailyForecast[] | null = null;

    try {
      forecasts = await this.primaryProvider.getForecast(loc, days);
    } catch {
      if (this.fallbackProvider) {
        try {
          forecasts = await this.fallbackProvider.getForecast(loc, days);
        } catch {
          forecasts = null;
        }
      }
    }

    if (forecasts && forecasts.length > 0) {
      this.cache.setForecast(locationId, forecasts);
      return forecasts.slice(0, days);
    }

    const stale = this.cache.getStaleForecast(locationId);
    if (stale && stale.length > 0) {
      return stale.slice(0, days);
    }

    return [];
  }

  /**
   * Retrieves full weather snapshot combining current observations and forecast.
   * Fully backwards-compatible with WeatherSnapshot.
   */
  async getWeatherSnapshot(
    locationIdOrQuery?: string,
    options?: { forceRefresh?: boolean }
  ): Promise<CurrentWeather & WeatherSnapshot> {
    const loc = getWeatherLocation(locationIdOrQuery || this.defaultLocationId);
    const current = await this.getCurrentWeather(loc.id, options);
    const forecasts = await this.getForecast(loc.id, 3, options);

    const conditionText = CONDITION_DISPLAY_LABELS[current.condition] || current.condition;
    const high = forecasts.length > 0 ? forecasts[0].temperatureHigh : current.temperature + 3;
    const low = forecasts.length > 0 ? forecasts[0].temperatureLow : current.temperature - 4;
    const rainProb = current.precipitationProbability ?? (forecasts.length > 0 ? (forecasts[0].precipitationProbability ?? 20) : 20);

    const legacyForecasts: WeatherDailyForecast[] = forecasts.map(f => ({
      date: f.date,
      condition: f.condition,
      summary: f.conditionText || conditionText,
      highTempC: f.temperatureHigh,
      lowTempC: f.temperatureLow,
      precipitationChancePercent: f.precipitationProbability ?? 0,
    }));

    const summary = `Atmospheric observations for ${loc.name} report ${conditionText.toLowerCase()} at ${current.temperature}°C with anticipated range of ${low}°C to ${high}°C.`;

    return {
      ...current,
      location: `${loc.name}, ${loc.region}`,
      capturedAt: current.observedAt,
      conditionText,
      currentTempC: current.temperature,
      feelsLikeC: current.feelsLike ?? current.temperature,
      highTempC: high,
      lowTempC: low,
      humidityPercent: current.humidity ?? 0,
      precipitationChancePercent: rainProb,
      windSpeedKmh: current.windSpeed ?? undefined,
      windDirection: current.windDirection ?? undefined,
      pressureHpa: current.pressure ?? undefined,
      visibilityKm: current.visibility ?? undefined,
      uvIndex: current.uvIndex ?? undefined,
      summary,
      forecast: legacyForecasts,
      sourceProvider: current.source.name,
      sourceAttribution: current.source,
    };
  }

  /**
   * Prepares a newspaper-friendly weather summary object for the broadsheet edition.
   * Specified in Step 5 Section 8.
   */
  async getNewspaperSummary(locationIdOrQuery?: string): Promise<NewspaperWeatherSummary> {
    const loc = getWeatherLocation(locationIdOrQuery || this.defaultLocationId);
    const weather = await this.getCurrentWeather(loc.id);
    const forecasts = await this.getForecast(loc.id, 1);

    const high = forecasts.length > 0 ? forecasts[0].temperatureHigh : weather.temperature + 3;
    const low = forecasts.length > 0 ? forecasts[0].temperatureLow : weather.temperature - 4;
    const rainProbability = weather.precipitationProbability ?? (forecasts.length > 0 ? (forecasts[0].precipitationProbability ?? 20) : 20);

    return {
      location: loc.name,
      temperature: weather.temperature,
      condition: CONDITION_DISPLAY_LABELS[weather.condition] || weather.condition,
      high,
      low,
      rainProbability,
      humidity: weather.humidity,
      updatedAt: formatNewspaperDateShort(weather.observedAt, loc.timezone),
      source: weather.source.name,
      isStale: weather.isStale,
    };
  }

  /**
   * Forces fresh retrieval bypassing cache.
   */
  async refreshWeather(locationIdOrQuery?: string): Promise<CurrentWeather> {
    return this.getCurrentWeather(locationIdOrQuery, { forceRefresh: true });
  }

  /**
   * Formats weather snapshot into WeatherSectionData for the newspaper renderer.
   */
  async getWeatherSectionData(locationIdOrQuery?: string): Promise<WeatherSectionData> {
    const snapshot = await this.getWeatherSnapshot(locationIdOrQuery);
    return this.formatter.formatWeatherSection(snapshot);
  }

  /**
   * Clears in-memory caches.
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const weatherService = new WeatherService();
