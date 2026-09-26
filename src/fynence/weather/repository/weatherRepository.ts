import { insforge } from '@/lib/insforge';
import type { CurrentWeather, DailyForecast } from '../types';
import { getWeatherLocation } from '../config/locationRegistry';

export class WeatherRepository {
  /**
   * Persists a verified meteorological snapshot into the InsForge weather_snapshots table.
   */
  public async storeSnapshot(
    snapshot: CurrentWeather,
    forecasts?: DailyForecast[]
  ): Promise<{ stored: boolean; id?: string; error?: string }> {
    try {
      const loc = getWeatherLocation(snapshot.locationId);
      const highTemp = forecasts && forecasts.length > 0
        ? forecasts[0].temperatureHigh
        : snapshot.temperature;
      const lowTemp = forecasts && forecasts.length > 0
        ? forecasts[0].temperatureLow
        : snapshot.temperature;

      const record: Record<string, any> = {
        location: `${loc.name}, ${loc.region}`,
        location_id: loc.id,
        condition: snapshot.condition,
        current_temp_c: snapshot.temperature,
        temperature: snapshot.temperature,
        feels_like: snapshot.feelsLike,
        high_temp_c: highTemp,
        low_temp_c: lowTemp,
        humidity_percent: snapshot.humidity ?? 0,
        humidity: snapshot.humidity,
        wind_speed: snapshot.windSpeed,
        precipitation_chance_percent: snapshot.precipitationProbability ?? 0,
        precipitation_probability: snapshot.precipitationProbability,
        pressure: snapshot.pressure,
        summary: `Meteorological observations for ${loc.name} at ${snapshot.temperature}°C, condition: ${snapshot.condition}.`,
        source_provider: snapshot.source.name,
        source: snapshot.source.name,
        observed_at: snapshot.observedAt,
        fetched_at: snapshot.fetchedAt,
        captured_at: snapshot.observedAt,
        is_stale: snapshot.isStale,
      };

      const res = await insforge.database
        .from('weather_snapshots')
        .insert([record])
        .select('id')
        .single();

      if (res.error) {
        // If columns from new migration are missing, fallback to standard schema
        const fallbackRecord = {
          location: `${loc.name}, ${loc.region}`,
          condition: snapshot.condition,
          current_temp_c: snapshot.temperature,
          high_temp_c: highTemp,
          low_temp_c: lowTemp,
          humidity_percent: snapshot.humidity ?? 0,
          precipitation_chance_percent: snapshot.precipitationProbability ?? 0,
          summary: `Meteorological observations for ${loc.name} at ${snapshot.temperature}°C.`,
          source_provider: snapshot.source.name,
          captured_at: snapshot.observedAt,
        };

        const fallbackRes = await insforge.database
          .from('weather_snapshots')
          .insert([fallbackRecord])
          .select('id')
          .single();

        if (fallbackRes.error) {
          return { stored: false, error: fallbackRes.error.message };
        }
        return { stored: true, id: fallbackRes.data?.id };
      }

      return { stored: true, id: res.data?.id };
    } catch (err: any) {
      return { stored: false, error: err?.message || 'Database error storing weather snapshot' };
    }
  }

  /**
   * Retrieves the most recent historical weather snapshot for fallback purposes.
   * Returns marked as isStale: true.
   */
  public async getLatestSnapshot(locationId: string): Promise<CurrentWeather | null> {
    try {
      const loc = getWeatherLocation(locationId);

      // Try querying by location_id or matching location text
      const res = await insforge.database
        .from('weather_snapshots')
        .select()
        .or(`location_id.eq.${loc.id},location.ilike.%${loc.name}%`)
        .order('captured_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (res.error || !res.data) {
        return null;
      }

      const row = res.data as any;
      const temp = Number(row.temperature ?? row.current_temp_c ?? 25.0);

      return {
        locationId: loc.id,
        temperature: temp,
        feelsLike: row.feels_like !== null && row.feels_like !== undefined ? Number(row.feels_like) : null,
        condition: row.condition || 'partly_cloudy',
        conditionCode: String(row.condition || 'unknown'),
        humidity: row.humidity !== null && row.humidity !== undefined ? Number(row.humidity) : (row.humidity_percent ?? null),
        windSpeed: row.wind_speed !== null && row.wind_speed !== undefined ? Number(row.wind_speed) : null,
        windDirection: null,
        precipitation: null,
        precipitationProbability: row.precipitation_probability !== null && row.precipitation_probability !== undefined
          ? Number(row.precipitation_probability)
          : (row.precipitation_chance_percent ?? null),
        pressure: row.pressure !== null && row.pressure !== undefined ? Number(row.pressure) : null,
        visibility: null,
        uvIndex: null,
        observedAt: row.observed_at || row.captured_at || new Date().toISOString(),
        fetchedAt: row.fetched_at || new Date().toISOString(),
        source: {
          name: row.source_provider || row.source || 'insforge_database_archive',
          url: 'https://thefynence.internal/archive',
        },
        isStale: true, // Historical snapshot from DB is always stale
      };
    } catch {
      return null;
    }
  }
}

export const weatherRepository = new WeatherRepository();
