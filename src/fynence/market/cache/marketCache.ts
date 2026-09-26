import type { MarketQuote } from '../types';

interface CacheEntry {
  quote: MarketQuote;
  cachedAt: number;
  ttlMs: number;
}

export class MarketCache {
  private cache: Map<string, CacheEntry> = new Map();
  private defaultTtlMs: number;

  constructor(defaultTtlSeconds = 60) {
    const envTtl =
      typeof process !== 'undefined' && process.env.MARKET_DATA_CACHE_TTL_SECONDS
        ? parseInt(process.env.MARKET_DATA_CACHE_TTL_SECONDS, 10)
        : defaultTtlSeconds;

    this.defaultTtlMs = (isNaN(envTtl) ? defaultTtlSeconds : envTtl) * 1000;
  }

  public get(symbol: string): MarketQuote | null {
    const key = symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.cachedAt > entry.ttlMs) {
      this.cache.delete(key);
      return null;
    }

    return entry.quote;
  }

  public set(symbol: string, quote: MarketQuote, ttlSeconds?: number): void {
    const key = symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const ttlMs = ttlSeconds !== undefined ? ttlSeconds * 1000 : this.defaultTtlMs;
    this.cache.set(key, {
      quote,
      cachedAt: Date.now(),
      ttlMs,
    });
  }

  public getMany(symbols: string[]): { cached: MarketQuote[]; missing: string[] } {
    const cached: MarketQuote[] = [];
    const missing: string[] = [];

    for (const sym of symbols) {
      const q = this.get(sym);
      if (q) {
        cached.push(q);
      } else {
        missing.push(sym);
      }
    }

    return { cached, missing };
  }

  public setMany(quotes: MarketQuote[], ttlSeconds?: number): void {
    for (const q of quotes) {
      this.set(q.symbol, q, ttlSeconds);
    }
  }

  public clear(): void {
    this.cache.clear();
  }

  public size(): number {
    return this.cache.size;
  }
}

export const marketCache = new MarketCache();
