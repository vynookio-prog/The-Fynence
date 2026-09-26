import { ForexCalendarProvider } from './types';
import { ForexFactoryProvider } from './forexFactoryProvider';

export * from './types';
export * from './forexFactoryProvider';

// Pluggable provider registry
const providerRegistry: Record<string, () => ForexCalendarProvider> = {
  'forex-factory': () => new ForexFactoryProvider(),
  'default': () => new ForexFactoryProvider(),
};

/**
 * Register or replace a Forex calendar provider implementation at runtime
 */
export function registerForexCalendarProvider(name: string, factory: () => ForexCalendarProvider) {
  providerRegistry[name.toLowerCase()] = factory;
}

/**
 * Returns the configured Forex calendar provider.
 * Allows runtime replacement or configuration via environment variable.
 */
export function getForexCalendarProvider(providerName?: string): ForexCalendarProvider {
  const key = (providerName || process.env.FOREX_CALENDAR_PROVIDER || 'default').toLowerCase();
  const factory = providerRegistry[key] || providerRegistry['default'];
  return factory();
}
