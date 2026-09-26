export * from '../types/weather';
export * from '../contracts/weather.contract';
export * from './config/locationRegistry';
export * from './utils/conditionMapper';
export * from './utils/timezone';

import type { WeatherLocation } from './config/locationRegistry';
import type { CurrentWeather, DailyForecast, WeatherSourceAttribution } from '../types/weather';

export interface WeatherCoordinates {
  latitude: number;
  longitude: number;
  displayName: string;
}

export interface WeatherProviderResponse<T> {
  success: boolean;
  data?: T;
  provider: string;
  error?: string;
  latencyMs?: number;
}

export interface WeatherServiceOptions {
  cacheTtlSeconds?: number;
  defaultLocation?: string;
  primaryProvider?: WeatherProvider;
  fallbackProvider?: WeatherProvider;
  repository?: any;
  insforgeClient?: any;
}

export interface WeatherFetchOptions {
  forceRefresh?: boolean;
}

export interface WeatherProvider {
  readonly providerName: string;
  readonly attribution: WeatherSourceAttribution;

  /**
   * Retrieves verified current meteorological observations.
   */
  getCurrentWeather(location: WeatherLocation): Promise<CurrentWeather>;

  /**
   * Retrieves multi-day verified weather forecasts.
   */
  getForecast(location: WeatherLocation, days?: number): Promise<DailyForecast[]>;
}
