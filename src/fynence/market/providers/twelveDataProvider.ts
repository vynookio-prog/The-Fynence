import type { MarketDataProvider } from './types';
import type { MarketProviderResponse, MarketQuote } from '../types';
import { getProviderSymbol } from '../config/symbolRegistry';
import { marketValidator } from '../validator/marketValidator';

const TWELVE_DATA_API_BASE = 'https://api.twelvedata.com';

export class TwelveDataProvider implements MarketDataProvider {
  public readonly name = 'twelve_data';

  private apiKey: string;
  private apiBaseUrl: string;

  constructor(options?: { apiKey?: string; apiBaseUrl?: string }) {
    this.apiKey =
      options?.apiKey ||
      (typeof process !== 'undefined' ? process.env.TWELVE_DATA_API_KEY || '' : '');
    this.apiBaseUrl = options?.apiBaseUrl || TWELVE_DATA_API_BASE;
  }

  public async getQuote(symbol: string): Promise<MarketProviderResponse<MarketQuote>> {
    const quotesRes = await this.getQuotes([symbol]);
    if (!quotesRes.success || !quotesRes.data || quotesRes.data.length === 0) {
      return {
        success: false,
        provider: this.name,
        error: quotesRes.error || `Failed fetching quote for ${symbol}`,
        latencyMs: quotesRes.latencyMs,
      };
    }

    return {
      success: true,
      data: quotesRes.data[0],
      provider: this.name,
      latencyMs: quotesRes.latencyMs,
    };
  }

  public async getQuotes(symbols: string[]): Promise<MarketProviderResponse<MarketQuote[]>> {
    const startTime = Date.now();

    if (symbols.length === 0) {
      return {
        success: true,
        data: [],
        provider: this.name,
        latencyMs: 0,
      };
    }

    if (!this.apiKey || this.apiKey.includes('your_twelve_data_api_key')) {
      return {
        success: false,
        provider: this.name,
        error: 'TWELVE_DATA_API_KEY is not configured with a valid key in the environment.',
        latencyMs: Date.now() - startTime,
      };
    }

    const providerSymbols = symbols.map(s => getProviderSymbol(s));
    const symbolQuery = providerSymbols.join(',');
    const url = `${this.apiBaseUrl}/quote?symbol=${encodeURIComponent(symbolQuery)}&apikey=${this.apiKey}`;

    const maxRetries = 2;
    let attempt = 0;
    let lastError = '';

    while (attempt <= maxRetries) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(url, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));

        if (!res.ok) {
          const status = res.status;
          if ((status === 429 || status >= 500) && attempt < maxRetries) {
            attempt++;
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
            continue;
          }
          return {
            success: false,
            provider: this.name,
            error: `Twelve Data HTTP ${status}: ${res.statusText}`,
            latencyMs: Date.now() - startTime,
          };
        }

        const json = await res.json();

        // Check Twelve Data API error payload
        if (json.status === 'error') {
          return {
            success: false,
            provider: this.name,
            error: json.message || 'Twelve Data API returned an error status',
            latencyMs: Date.now() - startTime,
          };
        }

        const quotes: MarketQuote[] = [];

        if (symbols.length === 1 && json.symbol) {
          // Single symbol response format
          const valRes = this.parseRawTwelveDataQuote(symbols[0], json);
          if (valRes.isValid && valRes.quote) {
            quotes.push(valRes.quote);
          }
        } else {
          // Batch response format (object keyed by providerSymbol)
          for (let i = 0; i < symbols.length; i++) {
            const internalSym = symbols[i];
            const provSym = providerSymbols[i];
            const rawQuote = json[provSym] || json[internalSym];

            if (rawQuote && rawQuote.status !== 'error') {
              const valRes = this.parseRawTwelveDataQuote(internalSym, rawQuote);
              if (valRes.isValid && valRes.quote) {
                quotes.push(valRes.quote);
              }
            }
          }
        }

        return {
          success: true,
          data: quotes,
          provider: this.name,
          latencyMs: Date.now() - startTime,
        };
      } catch (err: any) {
        lastError = err?.message || 'Network error';
        if (attempt < maxRetries) {
          attempt++;
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
          continue;
        }
        break;
      }
    }

    return {
      success: false,
      provider: this.name,
      error: `Twelve Data request failed after ${maxRetries} retries: ${lastError}`,
      latencyMs: Date.now() - startTime,
    };
  }

  private parseRawTwelveDataQuote(internalSymbol: string, raw: any) {
    return marketValidator.normalizeAndValidate({
      symbol: internalSymbol,
      price: raw.close || raw.price,
      previousClose: raw.previous_close,
      open: raw.open,
      high: raw.high,
      low: raw.low,
      volume: raw.volume,
      timestamp: raw.timestamp ? raw.timestamp * 1000 : raw.datetime,
      isMarketOpen: typeof raw.is_market_open === 'boolean' ? raw.is_market_open : null,
      source: this.name,
    });
  }
}
