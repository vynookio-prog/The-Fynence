import type { WeatherProvider, IWeatherProvider } from './types';
import type {
  CurrentWeather,
  DailyForecast,
  WeatherDailyForecast,
  WeatherLocation,
  WeatherSnapshot,
  WeatherSourceAttribution,
} from '../types';
import { getWeatherLocation } from '../config/locationRegistry';
import { mapStringToNormalizedCondition, CONDITION_DISPLAY_LABELS } from '../utils/conditionMapper';
import { toUtcIsoString } from '../utils/timezone';

export const WEATHER_API_ATTRIBUTION: WeatherSourceAttribution = {
  name: 'WeatherAPI',
  url: 'https://weatherapi.com',
};

export class WeatherApiProvider implements WeatherProvider, IWeatherProvider {
  readonly providerName = 'weatherapi';
  readonly attribution = WEATHER_API_ATTRIBUTION;

  private apiKey: string;
  private apiBaseUrl: string;

  constructor(options?: { apiKey?: string; apiBaseUrl?: string }) {
    this.apiKey =
      options?.apiKey ||
      (typeof process !== 'undefined' ? process.env.WEATHER_API_KEY || '' : '');
    this.apiBaseUrl = options?.apiBaseUrl || 'https://api.weatherapi.com/v1';
  }

  private resolveLocation(locOrStr: WeatherLocation | string): WeatherLocation {
    if (typeof locOrStr === 'string') {
      return getWeatherLocation(locOrStr);
    }
    return locOrStr;
  }

  async getCurrentWeather(
    locOrStr: WeatherLocation | string
  ): Promise<CurrentWeather & WeatherSnapshot> {
    const loc = this.resolveLocation(locOrStr);

    if (!this.apiKey || this.apiKey.includes('your_weather_api_key')) {
      throw new Error('WEATHER_API_KEY is not configured with a valid key in the environment.');
    }

    const query = `${loc.latitude},${loc.longitude}`;
    const url = `${this.apiBaseUrl}/forecast.json?key=${encodeURIComponent(this.apiKey)}&q=${encodeURIComponent(query)}&days=3&aqi=no`;

    const maxRetries = 2;
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt <= maxRetries) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const status = response.status;
          if (status === 401 || status === 403) {
            throw new Error(`WeatherAPI authentication failed: Invalid or expired API key (HTTP ${status})`);
          }
          if ((status === 429 || status >= 500) && attempt < maxRetries) {
            attempt++;
            await new Promise(r => setTimeout(r, 600 * Math.pow(2, attempt)));
            continue;
          }
          throw new Error(`WeatherAPI HTTP error: ${status} ${response.statusText}`);
        }

        const data = await response.json();
        return this.normalizePayload(data, loc);
      } catch (err: any) {
        clearTimeout(timeoutId);
        lastError = err;
        if (attempt < maxRetries && (err?.name === 'AbortError' || err?.code === 'ECONNRESET')) {
          attempt++;
          await new Promise(r => setTimeout(r, 600 * Math.pow(2, attempt)));
          continue;
        }
        break;
      }
    }

    throw lastError || new Error(`WeatherAPI failed to retrieve weather for ${loc.name}`);
  }

  async getForecast(
    locOrStr: WeatherLocation | string,
    days = 3
  ): Promise<DailyForecast[]> {
    const weather = await this.getCurrentWeather(locOrStr);
    const loc = this.resolveLocation(locOrStr);
    const query = `${loc.latitude},${loc.longitude}`;
    const clampedDays = Math.max(1, Math.min(days, 7));
    const url = `${this.apiBaseUrl}/forecast.json?key=${encodeURIComponent(this.apiKey)}&q=${encodeURIComponent(query)}&days=${clampedDays}&aqi=no`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (!response.ok) return [];

      const data = await response.json();
      return this.extractDailyForecasts(data);
    } catch {
      return [];
    }
  }

  public normalizePayload(
    data: any,
    loc: WeatherLocation
  ): CurrentWeather & WeatherSnapshot {
    if (!data || typeof data !== 'object') {
      throw new Error('Malformed WeatherAPI payload');
    }

    const current = data.current || {};
    const forecastDays = data.forecast?.forecastday || [];
    const todayForecast = forecastDays[0]?.day || {};

    const rawTemp = current.temp_c;
    if (typeof rawTemp !== 'number' || isNaN(rawTemp)) {
      throw new Error('Invalid or missing temperature in WeatherAPI response');
    }

    const temperature = Math.round(rawTemp * 10) / 10;
    const feelsLike = typeof current.feelslike_c === 'number' && !isNaN(current.feelslike_c)
      ? Math.round(current.feelslike_c * 10) / 10
      : null;

    const conditionTextRaw = current.condition?.text || 'Clear';
    const condition = mapStringToNormalizedCondition(conditionTextRaw);
    const conditionCode = String(current.condition?.code || 'unknown');
    const displayLabel = CONDITION_DISPLAY_LABELS[condition] || conditionTextRaw;

    const humidity = typeof current.humidity === 'number' && !isNaN(current.humidity)
      ? Math.round(current.humidity)
      : null;

    const windSpeed = typeof current.wind_kph === 'number' && !isNaN(current.wind_kph)
      ? Math.round(current.wind_kph * 10) / 10
      : null;

    const windDirection = typeof current.wind_dir === 'string' ? current.wind_dir : null;

    const precipitation = typeof current.precip_mm === 'number' && !isNaN(current.precip_mm)
      ? Math.round(current.precip_mm * 10) / 10
      : null;

    const precipitationProbability = typeof todayForecast.daily_chance_of_rain === 'number'
      ? Math.round(todayForecast.daily_chance_of_rain)
      : typeof todayForecast.daily_chance_of_rain === 'string'
        ? parseInt(todayForecast.daily_chance_of_rain, 10)
        : null;

    const pressure = typeof current.pressure_mb === 'number' && !isNaN(current.pressure_mb)
      ? Math.round(current.pressure_mb)
      : null;

    const visibility = typeof current.vis_km === 'number' && !isNaN(current.vis_km)
      ? Math.round(current.vis_km * 10) / 10
      : null;

    const uvIndex = typeof current.uv === 'number' && !isNaN(current.uv)
      ? Math.round(current.uv * 10) / 10
      : null;

    const highTemp = typeof todayForecast.maxtemp_c === 'number'
      ? Math.round(todayForecast.maxtemp_c * 10) / 10
      : temperature;

    const lowTemp = typeof todayForecast.mintemp_c === 'number'
      ? Math.round(todayForecast.mintemp_c * 10) / 10
      : temperature;

    const observedAt = toUtcIsoString(current.last_updated_epoch ? current.last_updated_epoch * 1000 : new Date());
    const fetchedAt = new Date().toISOString();
    const summary = `Meteorological dispatch for ${loc.name}: ${displayLabel.toLowerCase()} at ${temperature}°C, barometer ${pressure ?? 1012} hPa.`;

    const forecasts = this.extractDailyForecasts(data);
    const legacyForecasts: WeatherDailyForecast[] = forecasts.map(f => ({
      date: f.date,
      condition: f.condition,
      summary: f.conditionText || displayLabel,
      highTempC: f.temperatureHigh,
      lowTempC: f.temperatureLow,
      precipitationChancePercent: f.precipitationProbability ?? 0,
    }));

    return {
      locationId: loc.id,
      temperature,
      feelsLike,
      condition,
      conditionCode,
      humidity,
      windSpeed,
      windDirection,
      precipitation,
      precipitationProbability,
      pressure,
      visibility,
      uvIndex,
      observedAt,
      fetchedAt,
      source: this.attribution,
      isStale: false,

      // WeatherSnapshot backwards compatibility
      location: `${loc.name}, ${loc.region}`,
      capturedAt: observedAt,
      conditionText: displayLabel,
      currentTempC: temperature,
      feelsLikeC: feelsLike ?? temperature,
      highTempC: highTemp,
      lowTempC: lowTemp,
      humidityPercent: humidity ?? 0,
      precipitationChancePercent: precipitationProbability ?? 0,
      windSpeedKmh: windSpeed ?? undefined,
      pressureHpa: pressure ?? undefined,
      visibilityKm: visibility ?? undefined,
      uvIndex: uvIndex ?? undefined,
      summary,
      forecast: legacyForecasts,
      sourceProvider: this.providerName,
      sourceAttribution: this.attribution,
    };
  }

  public extractDailyForecasts(data: any): DailyForecast[] {
    const forecastDays = data?.forecast?.forecastday;
    if (!Array.isArray(forecastDays)) return [];

    return forecastDays.map((fd: any) => {
      const day = fd.day || {};
      const condText = day.condition?.text || '';
      const condition = mapStringToNormalizedCondition(condText);

      return {
        date: fd.date || new Date().toISOString().split('T')[0],
        condition,
        conditionText: CONDITION_DISPLAY_LABELS[condition] || condText,
        temperatureHigh: typeof day.maxtemp_c === 'number' ? Math.round(day.maxtemp_c * 10) / 10 : 28,
        temperatureLow: typeof day.mintemp_c === 'number' ? Math.round(day.mintemp_c * 10) / 10 : 20,
        precipitationProbability: typeof day.daily_chance_of_rain === 'number'
          ? Math.round(day.daily_chance_of_rain)
          : null,
        precipitationAmount: typeof day.totalprecip_mm === 'number'
          ? Math.round(day.totalprecip_mm * 10) / 10
          : null,
        windSpeed: typeof day.maxwind_kph === 'number'
          ? Math.round(day.maxwind_kph * 10) / 10
          : null,
        uvIndex: typeof day.uv === 'number'
          ? Math.round(day.uv * 10) / 10
          : null,
      };
    });
  }
}
