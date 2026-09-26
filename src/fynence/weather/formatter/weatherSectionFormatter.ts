import type { WeatherSectionData } from '../../types/newspaper';
import type { CurrentWeather, WeatherCondition, WeatherSnapshot } from '../types';
import type { IWeatherSectionFormatter } from '../../contracts/weather.contract';
import {
  getRetroWeatherIcon,
  CONDITION_DISPLAY_LABELS,
  mapStringToNormalizedCondition,
  NormalizedWeatherCondition,
} from '../utils/conditionMapper';
import { getWeatherLocation } from '../config/locationRegistry';

export class WeatherSectionFormatter implements IWeatherSectionFormatter {
  formatWeatherSection(snapshot: WeatherSnapshot | (CurrentWeather & Partial<WeatherSnapshot>)): WeatherSectionData {
    const rawCondition = (snapshot as any).condition || 'partly_cloudy';
    const normCondition: NormalizedWeatherCondition =
      typeof rawCondition === 'string' && rawCondition in CONDITION_DISPLAY_LABELS
        ? (rawCondition as NormalizedWeatherCondition)
        : mapStringToNormalizedCondition(String(rawCondition));

    const icon = getRetroWeatherIcon(normCondition);
    const conditionText =
      (snapshot as WeatherSnapshot).conditionText ||
      CONDITION_DISPLAY_LABELS[normCondition] ||
      'Fair Weather';

    // Support both CurrentWeather and WeatherSnapshot naming
    const temp = typeof (snapshot as any).currentTempC === 'number'
      ? (snapshot as any).currentTempC
      : typeof (snapshot as CurrentWeather).temperature === 'number'
        ? (snapshot as CurrentWeather).temperature
        : 26.0;

    const high = typeof (snapshot as any).highTempC === 'number'
      ? (snapshot as any).highTempC
      : temp + 3;

    const low = typeof (snapshot as any).lowTempC === 'number'
      ? (snapshot as any).lowTempC
      : temp - 4;

    const rainProb = typeof (snapshot as any).precipitationChancePercent === 'number'
      ? (snapshot as any).precipitationChancePercent
      : typeof (snapshot as CurrentWeather).precipitationProbability === 'number'
        ? (snapshot as CurrentWeather).precipitationProbability!
        : 20;

    const humidity = typeof (snapshot as any).humidityPercent === 'number'
      ? (snapshot as any).humidityPercent
      : typeof (snapshot as CurrentWeather).humidity === 'number'
        ? (snapshot as CurrentWeather).humidity!
        : undefined;

    const wind = typeof (snapshot as any).windSpeedKmh === 'number'
      ? (snapshot as any).windSpeedKmh
      : typeof (snapshot as CurrentWeather).windSpeed === 'number'
        ? (snapshot as CurrentWeather).windSpeed!
        : undefined;

    const locIdOrName = (snapshot as any).locationId || (snapshot as any).location || 'Magelang';
    const resolvedLoc = getWeatherLocation(locIdOrName);
    const displayLocation = (snapshot as any).location || `${resolvedLoc.name}, ${resolvedLoc.region}`;

    let forecastSummary = (snapshot as any).summary;
    if (!forecastSummary && (snapshot as WeatherSnapshot).forecast && (snapshot as WeatherSnapshot).forecast!.length > 0) {
      const nextDay = (snapshot as WeatherSnapshot).forecast![0];
      forecastSummary = `Tomorrow: ${nextDay.summary} with highs of ${nextDay.highTempC}°C and lows of ${nextDay.lowTempC}°C.`;
    }

    if (!forecastSummary) {
      forecastSummary = `Barometer steady: ${low}°C to ${high}°C with ${rainProb}% chance of precipitation.`;
    }

    if (snapshot.isStale) {
      forecastSummary = `[Cached Dispatch] ${forecastSummary}`;
    }

    return {
      type: 'weather',
      location: displayLocation,
      currentCondition: conditionText,
      conditionIconText: icon,
      currentTempC: temp,
      highTempC: high,
      lowTempC: low,
      precipitationChancePercent: rainProb,
      humidityPercent: humidity,
      windKmh: wind,
      forecastSummary,
    };
  }
}
