import type {
  CurrentWeather,
  DailyForecast,
  WeatherDailyForecast,
  WeatherLocation,
  WeatherSnapshot,
  WeatherSourceAttribution,
} from '../types';

export interface WeatherProvider {
  readonly providerName: string;
  readonly attribution: WeatherSourceAttribution;

  /**
   * Retrieves verified current meteorological observations.
   */
  getCurrentWeather(location: WeatherLocation | string): Promise<CurrentWeather>;

  /**
   * Retrieves multi-day verified weather forecasts.
   */
  getForecast(location: WeatherLocation | string, days?: number): Promise<DailyForecast[]>;
}

/**
 * Backwards compatible provider interface.
 */
export interface IWeatherProvider {
  readonly providerName: string;
  getCurrentWeather(location: string): Promise<WeatherSnapshot>;
  getForecast(location: string, days?: number): Promise<WeatherDailyForecast[]>;
}
