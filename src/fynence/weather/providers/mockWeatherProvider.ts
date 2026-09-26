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

export const MOCK_WEATHER_ATTRIBUTION: WeatherSourceAttribution = {
  name: 'Fynence Meteorological Archive (Simulated)',
  url: 'https://thefynence.internal/weather',
};

export class MockWeatherProvider implements WeatherProvider, IWeatherProvider {
  readonly providerName = 'mock_weather';
  readonly attribution = MOCK_WEATHER_ATTRIBUTION;

  private shouldFail = false;
  private callCount = 0;
  private customTemp?: number;

  constructor(options?: { shouldFail?: boolean; customTemp?: number }) {
    this.shouldFail = options?.shouldFail ?? false;
    this.customTemp = options?.customTemp;
  }

  public setShouldFail(fail: boolean): void {
    this.shouldFail = fail;
  }

  public getCallCount(): number {
    return this.callCount;
  }

  public reset(): void {
    this.callCount = 0;
    this.shouldFail = false;
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
    this.callCount++;

    if (this.shouldFail) {
      throw new Error('Simulated meteorological station outage');
    }

    const loc = this.resolveLocation(locOrStr);
    const nowIso = new Date().toISOString();
    const isTropical = /indonesia|jakarta|magelang|bali|semarang|surabaya|yogyakarta/i.test(
      `${loc.name} ${loc.region} ${loc.country}`
    );

    const temp = this.customTemp ?? (isTropical ? 28.5 : 19.2);
    const high = isTropical ? 32.0 : 22.0;
    const low = isTropical ? 23.5 : 13.0;

    const condition = isTropical ? 'partly_cloudy' : 'clear';
    const conditionText = isTropical
      ? 'Partly Cloudy with Humid Breeze'
      : 'Crisp & Clear Skies';

    const forecasts = await this.getForecast(loc, 3);
    const legacyForecasts: WeatherDailyForecast[] = forecasts.map(f => ({
      date: f.date,
      condition: f.condition,
      summary: f.conditionText || conditionText,
      highTempC: f.temperatureHigh,
      lowTempC: f.temperatureLow,
      precipitationChancePercent: f.precipitationProbability ?? 0,
    }));

    return {
      locationId: loc.id,
      temperature: temp,
      feelsLike: isTropical ? 31.0 : 18.5,
      condition,
      conditionCode: isTropical ? '2' : '0',
      humidity: isTropical ? 78 : 54,
      windSpeed: isTropical ? 14.5 : 16.0,
      windDirection: isTropical ? 'ESE' : 'NW',
      precipitation: 0.0,
      precipitationProbability: isTropical ? 35 : 10,
      pressure: 1012,
      visibility: 10.0,
      uvIndex: isTropical ? 7.5 : 4.0,
      observedAt: nowIso,
      fetchedAt: nowIso,
      source: this.attribution,
      isStale: false,

      // WeatherSnapshot backwards compatibility
      location: typeof locOrStr === 'string' ? locOrStr : `${loc.name}, ${loc.region}, ${loc.country}`,
      capturedAt: nowIso,
      conditionText,
      currentTempC: temp,
      feelsLikeC: isTropical ? 31.0 : 18.5,
      highTempC: high,
      lowTempC: low,
      humidityPercent: isTropical ? 78 : 54,
      precipitationChancePercent: isTropical ? 35 : 10,
      windSpeedKmh: isTropical ? 14.5 : 16.0,
      windDirection: isTropical ? 'ESE' : 'NW',
      pressureHpa: 1012,
      visibilityKm: 10.0,
      uvIndex: isTropical ? 7.5 : 4.0,
      summary: isTropical
        ? 'Warm tropical conditions with afternoon thermal cloudiness over the Borobudur basin.'
        : 'High pressure ridge bringing clear skies and stable mercantile conditions.',
      forecast: legacyForecasts,
      sourceProvider: this.providerName,
      sourceAttribution: this.attribution,
    };
  }

  async getForecast(
    locOrStr: WeatherLocation | string,
    days = 3
  ): Promise<DailyForecast[]> {
    const loc = this.resolveLocation(locOrStr);
    const result: DailyForecast[] = [];
    const baseDate = new Date();

    for (let i = 1; i <= days; i++) {
      const forecastDate = new Date(baseDate);
      forecastDate.setDate(forecastDate.getDate() + i);
      const dateStr = forecastDate.toISOString().split('T')[0];

      result.push({
        date: dateStr,
        condition: i % 2 === 0 ? 'partly_cloudy' : 'clear',
        conditionText: i % 2 === 0 ? 'Passing clouds with mild breeze' : 'Fair and sunny skies',
        temperatureHigh: 28 + i,
        temperatureLow: 21 + i,
        precipitationProbability: 20 + i * 5,
        precipitationAmount: i * 0.5,
        windSpeed: 10 + i,
        uvIndex: 7.0,
      });
    }

    return result;
  }
}
