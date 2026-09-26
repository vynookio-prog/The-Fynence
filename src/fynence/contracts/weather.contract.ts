import type {
  IWeatherProvider,
  WeatherDailyForecast,
  WeatherSnapshot,
} from '../types/weather';
import type { WeatherSectionData } from '../types/newspaper';

export type { IWeatherProvider, WeatherDailyForecast, WeatherSnapshot };

export interface IWeatherSectionFormatter {
  /**
   * Formats a raw weather snapshot into structured data suitable for the newspaper layout renderer.
   */
  formatWeatherSection(snapshot: WeatherSnapshot): WeatherSectionData;
}
