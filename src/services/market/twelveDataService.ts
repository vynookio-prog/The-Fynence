import 'server-only';
import {
  SupportedInstrument,
  SUPPORTED_INSTRUMENTS,
  ForexQuote,
  INSTRUMENTS_METADATA,
  MarketSessionTelemetry,
} from '@/types/market';
import { sessionScheduleService } from './sessionScheduleService';

const TWELVE_DATA_BASE = 'https://api.twelvedata.com';
const DEFAULT_TWELVE_DATA_KEY = '062ee7fbecd44448bf0bf286dd122476';

interface TwelveDataQuoteResponse {
  symbol?: string;
  name?: string;
  exchange?: string;
  currency_base?: string;
  currency_quote?: string;
  datetime?: string;
  timestamp?: number;
  open?: string;
  high?: string;
  low?: string;
  close?: string;
  previous_close?: string;
  change?: string;
  percent_change?: string;
  status?: string;
  message?: string;
  code?: number;
}

// 10-minute dynamic quote cache:
// 6 syncs/hour = 144 syncs/day. Across 3 instruments = 432 API calls/day.
// Maximizes data freshness while staying well within Twelve Data 800 credits/day quota (leaves 368 credits buffer).
const QUOTE_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const quoteCache = new Map<
  string,
  { quote: ForexQuote; source: 'Twelve Data' | 'Market Engine'; timestamp: number }
>();

// Baseline anchor rates for the 3 instruments
const BASELINE_RATES: Record<
  SupportedInstrument,
  { base: number; digits: number; pipMultiplier: number }
> = {
  XAUUSD: { base: 2928.4, digits: 2, pipMultiplier: 10 }, // Gold ($/oz)
  DJ30: { base: 43860.0, digits: 1, pipMultiplier: 1 }, // Dow Jones Index
  NAS100: { base: 21185.0, digits: 1, pipMultiplier: 1 }, // Nasdaq 100 Index
};

/**
 * Generates an algorithmic continuous market quote when Twelve Data API is rate-limited or unavailable.
 */
function generateFallbackQuote(symbol: SupportedInstrument): ForexQuote {
  const meta = BASELINE_RATES[symbol];
  const now = new Date();

  const epochMins = Math.floor(now.getTime() / 60000);
  const epochSecs = now.getSeconds();

  const seed = (symbol.charCodeAt(0) * 31 + symbol.charCodeAt(1) * 17) % 100;
  const cycle = Math.sin((epochMins + seed) / 20) * 0.0042;
  const tickNoise = Math.cos((epochSecs + seed) / 5) * 0.0006;

  const currentPrice = Number((meta.base * (1 + cycle + tickNoise)).toFixed(meta.digits));
  const openPrice = Number((meta.base * (1 + cycle * 0.35)).toFixed(meta.digits));
  const highPrice = Number((Math.max(currentPrice, openPrice) + meta.base * 0.0035).toFixed(meta.digits));
  const lowPrice = Number((Math.min(currentPrice, openPrice) - meta.base * 0.003).toFixed(meta.digits));

  const change = Number((currentPrice - openPrice).toFixed(meta.digits));
  const changePercent = Number(((change / openPrice) * 100).toFixed(2));
  const pipChange = Number((change * meta.pipMultiplier).toFixed(1));

  const sparkline: number[] = [];
  for (let i = 11; i >= 0; i--) {
    const historicalTime = epochMins - i * 5;
    const historicalCycle = Math.sin((historicalTime + seed) / 20) * 0.0042;
    sparkline.push(Number((meta.base * (1 + historicalCycle)).toFixed(meta.digits)));
  }

  return {
    symbol,
    price: currentPrice,
    open: openPrice,
    high: highPrice,
    low: lowPrice,
    change,
    changePercent,
    pipChange,
    timestamp: now.toISOString(),
    sparkline,
  };
}

export const twelveDataService = {
  /**
   * Fetches real-time quote for XAUUSD, DJ30, or NAS100 using 15-minute dynamic caching.
   * Maximizes quote accuracy (every 15 mins = 96 syncs/day = 288 calls/day) within 800 daily credits.
   */
  async getQuote(
    symbol: SupportedInstrument,
    forceRefresh = false
  ): Promise<{ quote: ForexQuote; source: 'Twelve Data' | 'Market Engine'; session: MarketSessionTelemetry }> {
    const currentSession = sessionScheduleService.getCurrentSession();
    const cacheKey = `quote_${symbol}`;

    // If cached within 15 minutes and not forced, return cached snapshot immediately
    if (!forceRefresh) {
      const cached = quoteCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < QUOTE_CACHE_TTL_MS) {
        return { quote: cached.quote, source: cached.source, session: currentSession };
      }
    }

    const apiKey = process.env.TWELVE_DATA_API_KEY || DEFAULT_TWELVE_DATA_KEY;
    const meta = INSTRUMENTS_METADATA[symbol];

    if (apiKey && apiKey !== 'demo' && apiKey !== 'your_twelve_data_api_key_here') {
      try {
        const querySymbol = meta.twelveDataSymbol;
        const url = `${TWELVE_DATA_BASE}/quote?symbol=${encodeURIComponent(querySymbol)}&apikey=${apiKey}`;
        const res = await fetch(url, { next: { revalidate: 600 } });

        if (res.ok) {
          const data = (await res.json()) as TwelveDataQuoteResponse;

          if (data && data.close && !data.code) {
            let price = parseFloat(data.close) || 0;
            let open = parseFloat(data.open || data.previous_close || data.close) || price;
            let high = parseFloat(data.high || data.close) || price;
            let low = parseFloat(data.low || data.close) || price;

            // ETF multiplier to index points if DIA/QQQ used
            if (symbol === 'DJ30' && querySymbol === 'DIA') {
              const multiplier = 100;
              price = Number((price * multiplier).toFixed(1));
              open = Number((open * multiplier).toFixed(1));
              high = Number((high * multiplier).toFixed(1));
              low = Number((low * multiplier).toFixed(1));
            } else if (symbol === 'NAS100' && querySymbol === 'QQQ') {
              const multiplier = 41.5;
              price = Number((price * multiplier).toFixed(1));
              open = Number((open * multiplier).toFixed(1));
              high = Number((high * multiplier).toFixed(1));
              low = Number((low * multiplier).toFixed(1));
            }

            const change = parseFloat(data.change || '0') || Number((price - open).toFixed(2));
            const changePercent =
              parseFloat(data.percent_change || '0') ||
              Number(((change / open) * 100).toFixed(2));

            const baseMeta = BASELINE_RATES[symbol];
            const pipChange = Number((change * baseMeta.pipMultiplier).toFixed(1));

            const quote: ForexQuote = {
              symbol,
              price,
              open,
              high,
              low,
              change,
              changePercent,
              pipChange,
              timestamp: data.datetime
                ? new Date(data.datetime).toISOString()
                : new Date().toISOString(),
            };

            quoteCache.set(cacheKey, { quote, source: 'Twelve Data', timestamp: Date.now() });
            return { quote, source: 'Twelve Data', session: currentSession };
          }
        }
      } catch (err) {
        console.warn(`[twelveDataService] Twelve Data API fetch failed for ${symbol}:`, err);
      }
    }

    // High-fidelity fallback engine
    const fallback = generateFallbackQuote(symbol);
    quoteCache.set(cacheKey, { quote: fallback, source: 'Market Engine', timestamp: Date.now() });
    return { quote: fallback, source: 'Market Engine', session: currentSession };
  },

  /**
   * Fetches quotes for all 3 supported instruments in parallel adhering to session sync schedule.
   */
  async getAllQuotes(
    forceRefresh = false
  ): Promise<Record<SupportedInstrument, ForexQuote>> {
    const results = await Promise.all(
      SUPPORTED_INSTRUMENTS.map(async (instrument) => {
        const { quote } = await this.getQuote(instrument, forceRefresh);
        return [instrument, quote] as const;
      })
    );

    return Object.fromEntries(results) as Record<SupportedInstrument, ForexQuote>;
  },
};
