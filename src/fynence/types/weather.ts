export type NormalizedWeatherCondition =
  | 'clear'
  | 'mostly_clear'
  | 'partly_cloudy'
  | 'cloudy'
  | 'overcast'
  | 'rain'
  | 'heavy_rain'
  | 'thunderstorm'
  | 'drizzle'
  | 'fog'
  | 'haze'
  | 'snow'
  | 'unknown';

export type WeatherCondition =
  | NormalizedWeatherCondition
  | 'clear_day'
  | 'clear_night'
  | 'light_rain'
  | 'moderate_rain'
  | 'foggy';

export interface WeatherSourceAttribution {
  name: string;
  url: string;
}

export interface CurrentWeather {
  locationId: string;
  temperature: number; // °C
  feelsLike: number | null; // °C
  condition: NormalizedWeatherCondition;
  conditionCode: string;
  humidity: number | null; // %
  windSpeed: number | null; // km/h
  windDirection: string | null;
  precipitation: number | null; // mm
  precipitationProbability: number | null; // %
  pressure: number | null; // hPa
  visibility: number | null; // km
  uvIndex: number | null;
  observedAt: string; // ISO 8601 UTC
  fetchedAt: string; // ISO 8601 UTC
  source: WeatherSourceAttribution;
  isStale: boolean;
}

export interface DailyForecast {
  date: string; // YYYY-MM-DD
  condition: NormalizedWeatherCondition;
  conditionText?: string;
  temperatureHigh: number;
  temperatureLow: number;
  precipitationProbability: number | null;
  precipitationAmount: number | null; // mm
  windSpeed: number | null; // km/h
  uvIndex: number | null;
}

export interface NewspaperWeatherSummary {
  location: string;
  temperature: number;
  condition: string;
  high: number;
  low: number;
  rainProbability: number;
  humidity: number | null;
  updatedAt: string;
  source: string;
  isStale: boolean;
}

export interface WeatherDailyForecast {
  date: string;
  condition: WeatherCondition;
  summary: string;
  highTempC: number;
  lowTempC: number;
  precipitationChancePercent: number;
}

export interface WeatherSnapshot {
  id?: string;
  location: string;
  capturedAt: string;
  condition: WeatherCondition;
  conditionText: string;
  currentTempC: number;
  feelsLikeC?: number;
  highTempC: number;
  lowTempC: number;
  humidityPercent: number;
  precipitationChancePercent: number;
  windSpeedKmh?: number;
  windDirection?: string;
  pressureHpa?: number;
  visibilityKm?: number;
  uvIndex?: number;
  airQualityIndex?: number;
  summary: string;
  forecast?: WeatherDailyForecast[];
  sourceProvider: string;
  sourceAttribution?: WeatherSourceAttribution;
  isStale?: boolean;
}

export interface IWeatherProvider {
  readonly providerName: string;
  getCurrentWeather(location: string): Promise<WeatherSnapshot>;
  getForecast(location: string, days?: number): Promise<WeatherDailyForecast[]>;
}
