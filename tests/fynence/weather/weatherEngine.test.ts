import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  OpenMeteoWeatherProvider,
  WeatherApiProvider,
  MockWeatherProvider,
  WeatherService,
  WeatherUnavailableError,
  WeatherCache,
  mapWmoCodeToNormalizedCondition,
  mapStringToNormalizedCondition,
  getRetroWeatherIcon,
  toUtcIsoString,
  formatNewspaperDateLong,
  formatNewspaperDateShort,
  formatNewspaperTime,
  getDateKeyInTimezone,
  getWeatherLocation,
  WEATHER_LOCATIONS,
  type CurrentWeather,
  type DailyForecast,
  type NormalizedWeatherCondition,
} from '../../../src/fynence/weather';

describe('Weather Engine: Comprehensive STEP 5 Verification', () => {
  const magelangLoc = getWeatherLocation('magelang');

  // Sample verified Open-Meteo payload for Magelang
  const sampleOpenMeteoPayload = {
    latitude: -7.47,
    longitude: 110.22,
    timezone: 'Asia/Jakarta',
    current: {
      time: '2026-09-27T07:30',
      temperature_2m: 28.4,
      relative_humidity_2m: 78,
      apparent_temperature: 30.8,
      precipitation: 0.0,
      weather_code: 2, // partly_cloudy
      surface_pressure: 1012.3,
      wind_speed_10m: 11.2,
      wind_direction_10m: 135, // SE
    },
    daily: {
      time: ['2026-09-27', '2026-09-28', '2026-09-29'],
      weather_code: [2, 61, 95],
      temperature_2m_max: [31.5, 30.2, 29.0],
      temperature_2m_min: [22.1, 21.8, 21.5],
      precipitation_probability_max: [35, 65, 85],
      precipitation_sum: [0.0, 4.2, 12.8],
      wind_speed_10m_max: [14.0, 16.5, 22.0],
      uv_index_max: [8.5, 7.2, 6.0],
    },
  };

  // Sample WeatherAPI payload
  const sampleWeatherApiPayload = {
    location: {
      name: 'Magelang',
      region: 'Central Java',
      country: 'Indonesia',
      lat: -7.47,
      lon: 110.22,
      localtime: '2026-09-27 07:30',
    },
    current: {
      last_updated_epoch: 1790469000,
      temp_c: 28.0,
      feelslike_c: 30.5,
      condition: { text: 'Partly cloudy', code: 1003 },
      wind_kph: 12.0,
      wind_dir: 'ESE',
      pressure_mb: 1012.0,
      precip_mm: 0.0,
      humidity: 78,
      vis_km: 10.0,
      uv: 7.0,
    },
    forecast: {
      forecastday: [
        {
          date: '2026-09-27',
          day: {
            maxtemp_c: 31.0,
            mintemp_c: 22.0,
            daily_chance_of_rain: 40,
            totalprecip_mm: 1.5,
            maxwind_kph: 14.0,
            uv: 8.0,
            condition: { text: 'Partly cloudy' },
          },
        },
        {
          date: '2026-09-28',
          day: {
            maxtemp_c: 30.0,
            mintemp_c: 21.5,
            daily_chance_of_rain: 70,
            totalprecip_mm: 5.0,
            maxwind_kph: 18.0,
            uv: 6.0,
            condition: { text: 'Moderate rain' },
          },
        },
      ],
    },
  };

  // ==========================================
  // 1. PROVIDER RESPONSE NORMALIZATION
  // ==========================================
  describe('1. Provider Response Normalization', () => {
    it('normalizes Open-Meteo payload into CurrentWeather model without inventing values', () => {
      const provider = new OpenMeteoWeatherProvider();
      const normalized = provider.normalizeCurrentWeather(sampleOpenMeteoPayload, magelangLoc);

      assert.equal(normalized.locationId, 'magelang');
      assert.equal(normalized.temperature, 28.4);
      assert.equal(normalized.feelsLike, 30.8);
      assert.equal(normalized.condition, 'partly_cloudy');
      assert.equal(normalized.humidity, 78);
      assert.equal(normalized.windSpeed, 11.2);
      assert.equal(normalized.windDirection, 'SE');
      assert.equal(normalized.precipitation, 0.0);
      assert.equal(normalized.precipitationProbability, 35);
      assert.equal(normalized.pressure, 1012);
      assert.equal(normalized.visibility, null); // Open-Meteo doesn't provide; strictly null
      assert.equal(normalized.uvIndex, 8.5);
      assert.equal(normalized.source.name, 'Open-Meteo');
      assert.equal(normalized.isStale, false);
      assert.ok(normalized.observedAt.includes('T'));
      assert.ok(normalized.fetchedAt.includes('T'));
    });

    it('normalizes WeatherAPI payload into CurrentWeather model preserving attribution', () => {
      const provider = new WeatherApiProvider({ apiKey: 'test_key' });
      const normalized = provider.normalizePayload(sampleWeatherApiPayload, magelangLoc);

      assert.equal(normalized.locationId, 'magelang');
      assert.equal(normalized.temperature, 28.0);
      assert.equal(normalized.feelsLike, 30.5);
      assert.equal(normalized.condition, 'partly_cloudy');
      assert.equal(normalized.humidity, 78);
      assert.equal(normalized.windSpeed, 12.0);
      assert.equal(normalized.windDirection, 'ESE');
      assert.equal(normalized.precipitation, 0.0);
      assert.equal(normalized.precipitationProbability, 40);
      assert.equal(normalized.pressure, 1012.0);
      assert.equal(normalized.visibility, 10.0);
      assert.equal(normalized.uvIndex, 7.0);
      assert.equal(normalized.source.name, 'WeatherAPI');
      assert.equal(normalized.isStale, false);
    });
  });

  // ==========================================
  // 2. CONDITION MAPPING
  // ==========================================
  describe('2. Condition Mapping & Internal Vocabulary', () => {
    it('maps all 13 standard internal weather conditions properly', () => {
      const conditions: NormalizedWeatherCondition[] = [
        'clear',
        'mostly_clear',
        'partly_cloudy',
        'cloudy',
        'overcast',
        'rain',
        'heavy_rain',
        'thunderstorm',
        'drizzle',
        'fog',
        'haze',
        'snow',
        'unknown',
      ];

      for (const cond of conditions) {
        const icon = getRetroWeatherIcon(cond);
        assert.ok(icon.length > 0, `Icon should exist for ${cond}`);
      }
    });

    it('maps WMO codes deterministically to the normalized vocabulary', () => {
      assert.equal(mapWmoCodeToNormalizedCondition(0).condition, 'clear');
      assert.equal(mapWmoCodeToNormalizedCondition(1).condition, 'mostly_clear');
      assert.equal(mapWmoCodeToNormalizedCondition(2).condition, 'partly_cloudy');
      assert.equal(mapWmoCodeToNormalizedCondition(3).condition, 'overcast');
      assert.equal(mapWmoCodeToNormalizedCondition(45).condition, 'fog');
      assert.equal(mapWmoCodeToNormalizedCondition(51).condition, 'drizzle');
      assert.equal(mapWmoCodeToNormalizedCondition(61).condition, 'rain');
      assert.equal(mapWmoCodeToNormalizedCondition(65).condition, 'heavy_rain');
      assert.equal(mapWmoCodeToNormalizedCondition(71).condition, 'snow');
      assert.equal(mapWmoCodeToNormalizedCondition(95).condition, 'thunderstorm');
      assert.equal(mapWmoCodeToNormalizedCondition(null).condition, 'unknown');
      assert.equal(mapWmoCodeToNormalizedCondition(undefined).condition, 'unknown');
    });

    it('maps external condition string descriptions to internal normalized values', () => {
      assert.equal(mapStringToNormalizedCondition('Sunny and clear'), 'clear');
      assert.equal(mapStringToNormalizedCondition('Scattered thunderstorm with lightning'), 'thunderstorm');
      assert.equal(mapStringToNormalizedCondition('Heavy downpour with squalls'), 'heavy_rain');
      assert.equal(mapStringToNormalizedCondition('Patchy light drizzle'), 'drizzle');
      assert.equal(mapStringToNormalizedCondition('Thick morning fog'), 'fog');
      assert.equal(mapStringToNormalizedCondition('Dense haze and smoke'), 'haze');
      assert.equal(mapStringToNormalizedCondition('Blizzard and heavy snowfall'), 'snow');
      assert.equal(mapStringToNormalizedCondition(null), 'unknown');
      assert.equal(mapStringToNormalizedCondition(''), 'unknown');
    });
  });

  // ==========================================
  // 3. TEMPERATURE PARSING
  // ==========================================
  describe('3. Temperature Parsing & Number Precision', () => {
    it('accurately parses standard, negative, decimal, and zero temperatures', () => {
      const provider = new OpenMeteoWeatherProvider();

      // Decimal
      const res1 = provider.normalizeCurrentWeather({
        ...sampleOpenMeteoPayload,
        current: { ...sampleOpenMeteoPayload.current, temperature_2m: 27.65 },
      }, magelangLoc);
      assert.equal(res1.temperature, 27.7);

      // Zero degrees
      const res2 = provider.normalizeCurrentWeather({
        ...sampleOpenMeteoPayload,
        current: { ...sampleOpenMeteoPayload.current, temperature_2m: 0.0 },
      }, magelangLoc);
      assert.equal(res2.temperature, 0.0);

      // Negative temperature
      const res3 = provider.normalizeCurrentWeather({
        ...sampleOpenMeteoPayload,
        current: { ...sampleOpenMeteoPayload.current, temperature_2m: -3.42 },
      }, magelangLoc);
      assert.equal(res3.temperature, -3.4);
    });

    it('rejects invalid or NaN temperature without inventing values', () => {
      const provider = new OpenMeteoWeatherProvider();
      assert.throws(() => {
        provider.normalizeCurrentWeather({
          ...sampleOpenMeteoPayload,
          current: { ...sampleOpenMeteoPayload.current, temperature_2m: 'twenty-eight' },
        }, magelangLoc);
      }, /Invalid or missing temperature/);

      assert.throws(() => {
        provider.normalizeCurrentWeather({
          ...sampleOpenMeteoPayload,
          current: { ...sampleOpenMeteoPayload.current, temperature_2m: NaN },
        }, magelangLoc);
      }, /Invalid or missing temperature/);
    });
  });

  // ==========================================
  // 4. FORECAST PARSING
  // ==========================================
  describe('4. Forecast Parsing & Daily Models', () => {
    it('parses multi-day forecast with daily temperatures, precipitation probability and amount', () => {
      const provider = new OpenMeteoWeatherProvider();
      const forecasts = provider.normalizeForecast(sampleOpenMeteoPayload, 3);

      assert.equal(forecasts.length, 3);

      const day1 = forecasts[0];
      assert.equal(day1.date, '2026-09-27');
      assert.equal(day1.condition, 'partly_cloudy');
      assert.equal(day1.temperatureHigh, 31.5);
      assert.equal(day1.temperatureLow, 22.1);
      assert.equal(day1.precipitationProbability, 35);
      assert.equal(day1.precipitationAmount, 0.0);
      assert.equal(day1.windSpeed, 14.0);
      assert.equal(day1.uvIndex, 8.5);

      const day2 = forecasts[1];
      assert.equal(day2.date, '2026-09-28');
      assert.equal(day2.condition, 'rain');
      assert.equal(day2.temperatureHigh, 30.2);
      assert.equal(day2.precipitationProbability, 65);
      assert.equal(day2.precipitationAmount, 4.2);

      const day3 = forecasts[2];
      assert.equal(day3.date, '2026-09-29');
      assert.equal(day3.condition, 'thunderstorm');
      assert.equal(day3.temperatureHigh, 29.0);
      assert.equal(day3.precipitationProbability, 85);
      assert.equal(day3.precipitationAmount, 12.8);
    });

    it('clamps forecast count and handles missing daily array safely', () => {
      const provider = new OpenMeteoWeatherProvider();
      const clamped = provider.normalizeForecast(sampleOpenMeteoPayload, 2);
      assert.equal(clamped.length, 2);

      const empty = provider.normalizeForecast({}, 3);
      assert.deepEqual(empty, []);
    });
  });

  // ==========================================
  // 5. TIMEZONE CONVERSION
  // ==========================================
  describe('5. Timezone Conversion & Dateline Formatting', () => {
    it('normalizes dates to strict UTC ISO 8601 strings', () => {
      const utc = toUtcIsoString('2026-09-27T00:30:00Z');
      assert.equal(utc, '2026-09-27T00:30:00.000Z');
    });

    it('formats broadsheet date long and short in Asia/Jakarta timezone', () => {
      // 2026-09-27 00:30 UTC is 2026-09-27 07:30 WIB
      const isoUtc = '2026-09-27T00:30:00Z';
      const longFormat = formatNewspaperDateLong(isoUtc, 'Asia/Jakarta');
      const shortFormat = formatNewspaperDateShort(isoUtc, 'Asia/Jakarta');
      const timeFormat = formatNewspaperTime(isoUtc, 'Asia/Jakarta');

      assert.equal(longFormat, 'Sunday, 27 September 2026');
      assert.equal(shortFormat, '27 SEP 2026');
      assert.equal(timeFormat, '07:30 WIB');
    });

    it('extracts calendar date keys in designated timezone', () => {
      // 2026-09-26 23:00 UTC is 2026-09-27 06:00 in Asia/Jakarta
      const isoUtc = '2026-09-26T23:00:00Z';
      const keyJakarta = getDateKeyInTimezone(isoUtc, 'Asia/Jakarta');
      const keyUtc = getDateKeyInTimezone(isoUtc, 'UTC');

      assert.equal(keyJakarta, '2026-09-27');
      assert.equal(keyUtc, '2026-09-26');
    });
  });

  // ==========================================
  // 6. CACHE TTL
  // ==========================================
  describe('6. Cache TTL & Request Deduplication', () => {
    let testCache: WeatherCache;

    beforeEach(() => {
      testCache = new WeatherCache(2); // 2 second TTL
    });

    it('serves fresh cached entries within TTL and evicts when expired', async () => {
      const mockWeather: CurrentWeather = {
        locationId: 'magelang',
        temperature: 28.5,
        feelsLike: 30.0,
        condition: 'partly_cloudy',
        conditionCode: '2',
        humidity: 75,
        windSpeed: 10,
        windDirection: 'SE',
        precipitation: 0,
        precipitationProbability: 30,
        pressure: 1012,
        visibility: 10,
        uvIndex: 7,
        observedAt: new Date().toISOString(),
        fetchedAt: new Date().toISOString(),
        source: { name: 'TestBureau', url: 'https://test.weather' },
        isStale: false,
      };

      testCache.set('magelang', mockWeather);

      // Immediate lookup succeeds
      const hit = testCache.get('magelang');
      assert.ok(hit);
      assert.equal(hit.temperature, 28.5);
      assert.equal(hit.isStale, false);

      // Wait 2.1 seconds for TTL expiration
      await new Promise(r => setTimeout(r, 2100));

      // Fresh get() returns null after TTL
      const expired = testCache.get('magelang');
      assert.equal(expired, null);
    });

    it('deduplicates concurrent in-flight fetches for the same location', async () => {
      let networkFetchCount = 0;
      const fetchFn = async () => {
        networkFetchCount++;
        await new Promise(r => setTimeout(r, 50));
        return {
          locationId: 'magelang',
          temperature: 29.0,
          feelsLike: null,
          condition: 'clear' as const,
          conditionCode: '0',
          humidity: null,
          windSpeed: null,
          windDirection: null,
          precipitation: null,
          precipitationProbability: null,
          pressure: null,
          visibility: null,
          uvIndex: null,
          observedAt: new Date().toISOString(),
          fetchedAt: new Date().toISOString(),
          source: { name: 'Test', url: 'https://test' },
          isStale: false,
        };
      };

      // Launch 5 concurrent calls simultaneously
      const results = await Promise.all([
        testCache.deduplicateFetch('magelang', fetchFn),
        testCache.deduplicateFetch('magelang', fetchFn),
        testCache.deduplicateFetch('magelang', fetchFn),
        testCache.deduplicateFetch('magelang', fetchFn),
        testCache.deduplicateFetch('magelang', fetchFn),
      ]);

      assert.equal(networkFetchCount, 1); // Only 1 network fetch executed
      assert.equal(results.length, 5);
      assert.equal(results[0].temperature, 29.0);
    });
  });

  // ==========================================
  // 7. STALE-DATA BEHAVIOR
  // ==========================================
  describe('7. Stale-Data Fallback Behavior', () => {
    it('marks expired cache as stale and preserves original observedAt timestamp', async () => {
      const testCache = new WeatherCache(1); // 1 second TTL
      const pastTime = '2026-09-27T04:00:00.000Z';

      const mockWeather: CurrentWeather = {
        locationId: 'magelang',
        temperature: 27.5,
        feelsLike: 29.0,
        condition: 'cloudy',
        conditionCode: '3',
        humidity: 80,
        windSpeed: 8.0,
        windDirection: 'S',
        precipitation: 1.2,
        precipitationProbability: 50,
        pressure: 1010,
        visibility: 8.0,
        uvIndex: 5.0,
        observedAt: pastTime,
        fetchedAt: pastTime,
        source: { name: 'Open-Meteo', url: 'https://open-meteo.com' },
        isStale: false,
      };

      testCache.set('magelang', mockWeather);

      // Wait 1.1s for expiration
      await new Promise(r => setTimeout(r, 1100));

      const stale = testCache.getStale('magelang');
      assert.ok(stale);
      assert.equal(stale.isStale, true); // Marked as stale
      assert.equal(stale.observedAt, pastTime); // Strictly preserved timestamp
      assert.equal(stale.temperature, 27.5); // Values unchanged
    });

    it('falls back to stale cache when provider experiences temporary outage', async () => {
      const testCache = new WeatherCache(1); // 1s TTL
      const observedPast = '2026-09-27T01:00:00.000Z';

      testCache.set('magelang', {
        locationId: 'magelang',
        temperature: 26.0,
        feelsLike: 27.0,
        condition: 'drizzle',
        conditionCode: '51',
        humidity: 85,
        windSpeed: 9.0,
        windDirection: 'W',
        precipitation: 0.5,
        precipitationProbability: 60,
        pressure: 1013,
        visibility: 7.0,
        uvIndex: 4.0,
        observedAt: observedPast,
        fetchedAt: observedPast,
        source: { name: 'Open-Meteo', url: 'https://open-meteo.com' },
        isStale: false,
      });

      // Wait for expiration
      await new Promise(r => setTimeout(r, 1100));

      // Provider that always fails
      const failingProvider = new MockWeatherProvider({ shouldFail: true });
      const service = new WeatherService({
        primaryProvider: failingProvider,
        fallbackProvider: undefined,
        cache: testCache,
      });

      const fallbackWeather = await service.getCurrentWeather('magelang');
      assert.equal(fallbackWeather.isStale, true);
      assert.equal(fallbackWeather.observedAt, observedPast);
      assert.equal(fallbackWeather.temperature, 26.0);
    });
  });

  // ==========================================
  // 8. PROVIDER FAILURE & UNAVAILABLE STATE
  // ==========================================
  describe('8. Provider Failure & Explicit Unavailable State', () => {
    it('throws typed WeatherUnavailableError without fabricating weather when all sources fail', async () => {
      const emptyCache = new WeatherCache(60);
      const failingProvider = new MockWeatherProvider({ shouldFail: true });

      // Mock repository that returns null (no database snapshots)
      const mockEmptyRepo: any = {
        getLatestSnapshot: async () => null,
        storeSnapshot: async () => ({ stored: false }),
      };

      const service = new WeatherService({
        primaryProvider: failingProvider,
        fallbackProvider: undefined,
        cache: emptyCache,
        repository: mockEmptyRepo,
      });

      await assert.rejects(
        async () => {
          await service.getCurrentWeather('magelang');
        },
        (err: any) => {
          assert.ok(err instanceof WeatherUnavailableError);
          assert.equal(err.status, 'unavailable');
          assert.equal(err.locationId, 'magelang');
          assert.ok(err.message.includes('unavailable'));
          return true;
        }
      );
    });

    it('WeatherApiProvider returns clean configuration error when WEATHER_API_KEY is missing', async () => {
      const provider = new WeatherApiProvider({ apiKey: '' });
      await assert.rejects(
        async () => {
          await provider.getCurrentWeather('magelang');
        },
        /WEATHER_API_KEY is not configured/
      );
    });
  });

  // ==========================================
  // 9. MALFORMED RESPONSE HANDLING
  // ==========================================
  describe('9. Malformed Response & Corrupt JSON Handling', () => {
    it('rejects corrupt or non-object payloads cleanly without unhandled exceptions', () => {
      const provider = new OpenMeteoWeatherProvider();

      assert.throws(() => {
        provider.normalizeCurrentWeather(null, magelangLoc);
      }, /payload is not an object/);

      assert.throws(() => {
        provider.normalizeCurrentWeather('not a json object', magelangLoc);
      }, /payload is not an object/);

      assert.throws(() => {
        provider.normalizeCurrentWeather({}, magelangLoc);
      }, /Invalid or missing temperature/);
    });

    it('WeatherApiProvider rejects malformed payload cleanly', () => {
      const provider = new WeatherApiProvider({ apiKey: 'valid_key' });
      assert.throws(() => {
        provider.normalizePayload(null, magelangLoc);
      }, /Malformed WeatherAPI payload/);
    });
  });

  // ==========================================
  // 10. MISSING OPTIONAL FIELDS
  // ==========================================
  describe('10. Missing Optional Fields & AI Boundary', () => {
    it('sets optional fields to null when unavailable; NEVER invents numbers', () => {
      const provider = new OpenMeteoWeatherProvider();
      const minimalPayload = {
        current: {
          time: '2026-09-27T08:00',
          temperature_2m: 24.5,
          weather_code: 0,
          // feelsLike, humidity, wind, pressure are omitted
        },
        daily: {
          // daily fields omitted
        },
      };

      const normalized = provider.normalizeCurrentWeather(minimalPayload, magelangLoc);

      assert.equal(normalized.temperature, 24.5);
      assert.equal(normalized.condition, 'clear');
      assert.equal(normalized.feelsLike, null);
      assert.equal(normalized.humidity, null);
      assert.equal(normalized.windSpeed, null);
      assert.equal(normalized.windDirection, null);
      assert.equal(normalized.precipitation, null);
      assert.equal(normalized.precipitationProbability, null);
      assert.equal(normalized.pressure, null);
      assert.equal(normalized.visibility, null);
      assert.equal(normalized.uvIndex, null);
    });

    it('generates Section 8 NewspaperWeatherSummary conforming strictly to verified data', async () => {
      const mockProvider = new MockWeatherProvider({ customTemp: 28.0 });
      const service = new WeatherService({
        primaryProvider: mockProvider,
        defaultLocation: 'magelang',
      });

      const summary = await service.getNewspaperSummary('magelang');

      assert.equal(summary.location, 'Magelang');
      assert.equal(summary.temperature, 28.0);
      assert.equal(summary.condition, 'Partly Cloudy');
      assert.ok(typeof summary.high === 'number');
      assert.ok(typeof summary.low === 'number');
      assert.ok(summary.high >= summary.low);
      assert.ok(summary.rainProbability >= 0 && summary.rainProbability <= 100);
      assert.equal(summary.source, 'Fynence Meteorological Archive (Simulated)');
      assert.equal(summary.isStale, false);
      assert.ok(summary.updatedAt.length > 0);
    });
  });

  // ==========================================
  // 11. LOCATION REGISTRY & VERIFIED COORDINATES
  // ==========================================
  describe('11. Location Registry & Verified Coordinates', () => {
    it('verifies Magelang official coordinates and timezone', () => {
      const magelang = WEATHER_LOCATIONS['magelang'];
      assert.ok(magelang);
      assert.equal(magelang.name, 'Magelang');
      assert.equal(magelang.region, 'Central Java');
      assert.equal(magelang.country, 'Indonesia');
      assert.equal(magelang.latitude, -7.47056);
      assert.equal(magelang.longitude, 110.21778);
      assert.equal(magelang.timezone, 'Asia/Jakarta');
    });

    it('resolves location aliases case-insensitively', () => {
      assert.equal(getWeatherLocation('magelang').id, 'magelang');
      assert.equal(getWeatherLocation('magelang-central-java').id, 'magelang');
      assert.equal(getWeatherLocation('Magelang, Jawa Tengah, Indonesia').id, 'magelang');
      assert.equal(getWeatherLocation('Kota Magelang').id, 'magelang');
      assert.equal(getWeatherLocation('JAKARTA').id, 'jakarta');
      assert.equal(getWeatherLocation('yogyakarta').id, 'yogyakarta');
    });
  });
});
