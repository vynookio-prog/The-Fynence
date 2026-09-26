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
import {
  mapWmoCodeToNormalizedCondition,
  CONDITION_DISPLAY_LABELS,
} from '../utils/conditionMapper';
import { toUtcIsoString } from '../utils/timezone';

export const OPEN_METEO_ATTRIBUTION: WeatherSourceAttribution = {
  name: 'Open-Meteo',
  url: 'https://open-meteo.com',
};

function degreesToCompass(deg: number | null | undefined): string | null {
  if (deg === null || deg === undefined || isNaN(deg)) return null;
  const val = Math.floor((deg / 22.5) + 0.5);
  const compassArr = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
  ];
  return compassArr[val % 16] || null;
}

export class OpenMeteoWeatherProvider implements WeatherProvider, IWeatherProvider {
  readonly providerName = 'open_meteo';
  readonly attribution = OPEN_METEO_ATTRIBUTION;

  private apiBaseUrl: string;

  constructor(options?: { apiBaseUrl?: string }) {
    this.apiBaseUrl = options?.apiBaseUrl || 'https://api.open-meteo.com/v1';
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
    const timezoneParam = encodeURIComponent(loc.timezone || 'Asia/Jakarta');
    const url = `${this.apiBaseUrl}/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,uv_index_max&timezone=${timezoneParam}&forecast_days=3`;

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
          if ((status === 429 || status >= 500) && attempt < maxRetries) {
            attempt++;
            await new Promise(r => setTimeout(r, 600 * Math.pow(2, attempt)));
            continue;
          }
          throw new Error(`Open-Meteo HTTP error: ${status} ${response.statusText}`);
        }

        const data = await response.json();
        return this.normalizeCurrentWeather(data, loc);
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

    throw lastError || new Error(`Open-Meteo failed to retrieve weather for ${loc.name}`);
  }

  async getForecast(
    locOrStr: WeatherLocation | string,
    days = 3
  ): Promise<DailyForecast[]> {
    const loc = this.resolveLocation(locOrStr);
    const timezoneParam = encodeURIComponent(loc.timezone || 'Asia/Jakarta');
    const clampedDays = Math.max(1, Math.min(days, 7));
    const url = `${this.apiBaseUrl}/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,uv_index_max&timezone=${timezoneParam}&forecast_days=${clampedDays}`;

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
        throw new Error(`Open-Meteo HTTP error: ${response.status}`);
      }

      const data = await response.json();
      return this.normalizeForecast(data, clampedDays);
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  /**
   * Normalizes raw Open-Meteo response into CurrentWeather and legacy WeatherSnapshot.
   */
  public normalizeCurrentWeather(
    data: any,
    loc: WeatherLocation
  ): CurrentWeather & WeatherSnapshot {
    if (!data || typeof data !== 'object') {
      throw new Error('Malformed Open-Meteo response: payload is not an object');
    }

    const current = data.current || {};
    const daily = data.daily || {};

    const rawTemp = current.temperature_2m;
    if (typeof rawTemp !== 'number' || isNaN(rawTemp)) {
      throw new Error('Invalid or missing temperature in Open-Meteo response');
    }

    const temperature = Math.round(rawTemp * 10) / 10;
    const rawFeelsLike = current.apparent_temperature;
    const feelsLike = typeof rawFeelsLike === 'number' && !isNaN(rawFeelsLike)
      ? Math.round(rawFeelsLike * 10) / 10
      : null;

    const wmoCode = typeof current.weather_code === 'number' ? current.weather_code : null;
    const { condition, conditionCode, displayLabel } = mapWmoCodeToNormalizedCondition(wmoCode);

    const humidity = typeof current.relative_humidity_2m === 'number' && !isNaN(current.relative_humidity_2m)
      ? Math.round(current.relative_humidity_2m)
      : null;

    const windSpeed = typeof current.wind_speed_10m === 'number' && !isNaN(current.wind_speed_10m)
      ? Math.round(current.wind_speed_10m * 10) / 10
      : null;

    const windDirection = degreesToCompass(current.wind_direction_10m);

    const precipitation = typeof current.precipitation === 'number' && !isNaN(current.precipitation)
      ? Math.round(current.precipitation * 10) / 10
      : null;

    const precipitationProbability = Array.isArray(daily.precipitation_probability_max) &&
      typeof daily.precipitation_probability_max[0] === 'number'
        ? Math.round(daily.precipitation_probability_max[0])
        : null;

    const pressure = typeof current.surface_pressure === 'number' && !isNaN(current.surface_pressure)
      ? Math.round(current.surface_pressure)
      : null;

    const uvIndex = Array.isArray(daily.uv_index_max) && typeof daily.uv_index_max[0] === 'number'
      ? Math.round(daily.uv_index_max[0] * 10) / 10
      : null;

    const highTemp = Array.isArray(daily.temperature_2m_max) && typeof daily.temperature_2m_max[0] === 'number'
      ? Math.round(daily.temperature_2m_max[0] * 10) / 10
      : temperature;

    const lowTemp = Array.isArray(daily.temperature_2m_min) && typeof daily.temperature_2m_min[0] === 'number'
      ? Math.round(daily.temperature_2m_min[0] * 10) / 10
      : temperature;

    const observedAt = toUtcIsoString(current.time ? new Date(current.time) : new Date());
    const fetchedAt = new Date().toISOString();

    const summary = `Atmospheric observations for ${loc.name} record ${displayLabel.toLowerCase()} at ${temperature}°C, with daily range of ${lowTemp}°C to ${highTemp}°C.`;

    const forecasts = this.normalizeForecast(data, 3);
    const legacyForecasts: WeatherDailyForecast[] = forecasts.map(f => ({
      date: f.date,
      condition: f.condition,
      summary: f.conditionText || displayLabel,
      highTempC: f.temperatureHigh,
      lowTempC: f.temperatureLow,
      precipitationChancePercent: f.precipitationProbability ?? 0,
    }));

    return {
      // CurrentWeather fields
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
      visibility: null, // Open-Meteo does not provide surface visibility in this endpoint
      uvIndex,
      observedAt,
      fetchedAt,
      source: this.attribution,
      isStale: false,

      // WeatherSnapshot backwards-compatibility fields
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
      summary,
      forecast: legacyForecasts,
      sourceProvider: this.providerName,
      sourceAttribution: this.attribution,
    };
  }

  /**
   * Normalizes daily forecast array.
   */
  public normalizeForecast(data: any, days = 3): DailyForecast[] {
    if (!data || !data.daily || !Array.isArray(data.daily.time)) {
      return [];
    }

    const daily = data.daily;
    const dates: string[] = daily.time || [];
    const codes: number[] = daily.weather_code || [];
    const highs: number[] = daily.temperature_2m_max || [];
    const lows: number[] = daily.temperature_2m_min || [];
    const probs: number[] = daily.precipitation_probability_max || [];
    const precips: number[] = daily.precipitation_sum || [];
    const winds: number[] = daily.wind_speed_10m_max || [];
    const uvs: number[] = daily.uv_index_max || [];

    const forecasts: DailyForecast[] = [];
    const count = Math.min(days, dates.length);

    for (let i = 0; i < count; i++) {
      const wmoCode = typeof codes[i] === 'number' ? codes[i] : null;
      const { condition, displayLabel } = mapWmoCodeToNormalizedCondition(wmoCode);

      const high = typeof highs[i] === 'number' && !isNaN(highs[i]) ? Math.round(highs[i] * 10) / 10 : 25;
      const low = typeof lows[i] === 'number' && !isNaN(lows[i]) ? Math.round(lows[i] * 10) / 10 : 18;
      const prob = typeof probs[i] === 'number' && !isNaN(probs[i]) ? Math.round(probs[i]) : null;
      const precip = typeof precips[i] === 'number' && !isNaN(precips[i]) ? Math.round(precips[i] * 10) / 10 : null;
      const wind = typeof winds[i] === 'number' && !isNaN(winds[i]) ? Math.round(winds[i] * 10) / 10 : null;
      const uv = typeof uvs[i] === 'number' && !isNaN(uvs[i]) ? Math.round(uvs[i] * 10) / 10 : null;

      forecasts.push({
        date: dates[i] || new Date().toISOString().split('T')[0],
        condition,
        conditionText: displayLabel,
        temperatureHigh: high,
        temperatureLow: low,
        precipitationProbability: prob,
        precipitationAmount: precip,
        windSpeed: wind,
        uvIndex: uv,
      });
    }

    return forecasts;
  }
}
