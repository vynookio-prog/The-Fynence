import test from 'node:test';
import assert from 'node:assert/strict';
import { MockWeatherProvider } from '../../../src/fynence/weather/providers/mockWeatherProvider';
import { WeatherSectionFormatter } from '../../../src/fynence/weather/formatter/weatherSectionFormatter';
import { WeatherService } from '../../../src/fynence/weather/service/weatherService';
import type { IWeatherProvider } from '../../../src/fynence/weather/providers/types';
import type { WeatherSnapshot } from '../../../src/fynence/weather/types';

test('Weather Engine: MockWeatherProvider returns structured snapshot', async () => {
  const provider = new MockWeatherProvider();
  const snapshot = await provider.getCurrentWeather('Magelang, Jawa Tengah, Indonesia');

  assert.equal(snapshot.location, 'Magelang, Jawa Tengah, Indonesia');
  assert.ok(typeof snapshot.currentTempC === 'number');
  assert.ok(snapshot.highTempC >= snapshot.lowTempC);
  assert.ok(snapshot.precipitationChancePercent >= 0 && snapshot.precipitationChancePercent <= 100);
  assert.equal(snapshot.condition, 'partly_cloudy');
  assert.ok(snapshot.summary.length > 10);
});

test('Weather Engine: WeatherSectionFormatter formats retro icon and condition', async () => {
  const formatter = new WeatherSectionFormatter();
  const snapshot: WeatherSnapshot = {
    location: 'London',
    capturedAt: new Date().toISOString(),
    condition: 'light_rain',
    conditionText: 'Intermittent Light Drizzle',
    currentTempC: 14.5,
    highTempC: 17.0,
    lowTempC: 11.0,
    humidityPercent: 82,
    precipitationChancePercent: 65,
    summary: 'Moist westerly airflow over the metropolitan area.',
    sourceProvider: 'test_provider',
  };

  const section = formatter.formatWeatherSection(snapshot);

  assert.equal(section.type, 'weather');
  assert.equal(section.location, 'London');
  assert.equal(section.currentCondition, 'Intermittent Light Drizzle');
  assert.equal(section.conditionIconText, '☂');
  assert.equal(section.currentTempC, 14.5);
  assert.equal(section.precipitationChancePercent, 65);
});

test('Weather Engine: WeatherService handles caching and fallback', async () => {
  let primaryCallCount = 0;
  const failingPrimary: IWeatherProvider = {
    providerName: 'failing_primary',
    async getCurrentWeather() {
      primaryCallCount++;
      throw new Error('Primary weather station unreachable');
    },
    async getForecast() {
      return [];
    },
  };

  const mockFallback = new MockWeatherProvider();
  const service = new WeatherService({
    primaryProvider: failingPrimary,
    fallbackProvider: mockFallback,
    cacheTtlSeconds: 60,
  });

  // First call should fall back to mockFallback
  const snapshot1 = await service.getWeatherSnapshot('Jakarta');
  assert.equal(primaryCallCount, 1);
  assert.ok(snapshot1.currentTempC > 0);

  // Second call within TTL should serve from cache without calling primary again
  const snapshot2 = await service.getWeatherSnapshot('Jakarta');
  assert.equal(primaryCallCount, 1);
  assert.equal(snapshot1.currentTempC, snapshot2.currentTempC);

  // Formatter integration
  const sectionData = await service.getWeatherSectionData('Jakarta');
  assert.equal(sectionData.type, 'weather');
  assert.ok(sectionData.forecastSummary.length > 5);
});
