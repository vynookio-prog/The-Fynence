export interface FynenceEnvironmentConfig {
  insforgeUrl: string;
  insforgeAnonKey: string;
  geminiApiKey?: string;
  newsApiKey?: string;
  twelveDataApiKey?: string;
  weatherApiKey?: string;
  telegramBotToken?: string;
  appUrl?: string;
  nodeEnv: string;
}

function readEnvVar(key: string): string | undefined {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env[key];
  }
  return undefined;
}

export function getFynenceEnvironment(): FynenceEnvironmentConfig {
  return {
    insforgeUrl:
      readEnvVar('NEXT_PUBLIC_INSFORGE_URL') ||
      readEnvVar('VITE_INSFORGE_URL') ||
      'https://4pzud87j.ap-southeast.insforge.app',
    insforgeAnonKey:
      readEnvVar('NEXT_PUBLIC_INSFORGE_ANON_KEY') ||
      readEnvVar('NEXT_PUBLIC_INSFORGE_KEY') ||
      readEnvVar('VITE_INSFORGE_ANON_KEY') ||
      '',
    geminiApiKey: readEnvVar('GEMINI_API_KEY'),
    newsApiKey: readEnvVar('NEWS_API_KEY'),
    twelveDataApiKey: readEnvVar('TWELVE_DATA_API_KEY'),
    weatherApiKey: readEnvVar('WEATHER_API_KEY'),
    telegramBotToken: readEnvVar('TELEGRAM_BOT_TOKEN'),
    appUrl: readEnvVar('APP_URL') || 'http://localhost:3000',
    nodeEnv: readEnvVar('NODE_ENV') || 'development',
  };
}

export interface EnvironmentValidationReport {
  isReadyForNewsIngestion: boolean;
  isReadyForAiProcessing: boolean;
  isReadyForMarketData: boolean;
  isReadyForWeatherData: boolean;
  isReadyForTelegramDelivery: boolean;
  missingVariables: string[];
}

export function validateFynenceEnvironment(): EnvironmentValidationReport {
  const env = getFynenceEnvironment();
  const missing: string[] = [];

  if (!env.geminiApiKey) missing.push('GEMINI_API_KEY');
  if (!env.newsApiKey) missing.push('NEWS_API_KEY');
  if (!env.twelveDataApiKey) missing.push('TWELVE_DATA_API_KEY');
  if (!env.weatherApiKey) missing.push('WEATHER_API_KEY');
  if (!env.telegramBotToken) missing.push('TELEGRAM_BOT_TOKEN');

  return {
    isReadyForNewsIngestion: Boolean(env.newsApiKey),
    isReadyForAiProcessing: Boolean(env.geminiApiKey),
    isReadyForMarketData: Boolean(env.twelveDataApiKey),
    isReadyForWeatherData: Boolean(env.weatherApiKey),
    isReadyForTelegramDelivery: Boolean(env.telegramBotToken),
    missingVariables: missing,
  };
}
