import type { MarketDirection, MarketQuote, MarketStatus } from '../types';
import { getSymbolConfig } from '../config/symbolRegistry';

export interface ValidationQuoteResult {
  isValid: boolean;
  errors: string[];
  quote?: MarketQuote;
}

export class MarketValidator {
  /**
   * Validates and normalizes raw provider market values into a verified MarketQuote.
   * Calculations for change, changePercent, and direction are strictly deterministic.
   */
  public normalizeAndValidate(raw: {
    symbol: string;
    price: number | string;
    previousClose?: number | string | null;
    open?: number | string | null;
    high?: number | string | null;
    low?: number | string | null;
    volume?: number | string | null;
    timestamp?: number | string;
    isMarketOpen?: boolean | null;
    source?: string;
  }): ValidationQuoteResult {
    const errors: string[] = [];

    // 1. Symbol verification
    const rawSymbol = (raw.symbol || '').trim();
    if (!rawSymbol) {
      return { isValid: false, errors: ['Symbol is missing or empty'] };
    }

    const config = getSymbolConfig(rawSymbol);
    const internalSymbol = config ? config.internalSymbol : rawSymbol.toUpperCase();
    const displayName = config ? config.displayName : internalSymbol;
    const category = config ? config.category : 'forex';
    const providerSymbol = config ? config.providerSymbol : rawSymbol;
    const decimals = config ? config.decimals : 2;

    // 2. Price validation
    const numPrice = typeof raw.price === 'number' ? raw.price : parseFloat(String(raw.price || ''));
    if (!Number.isFinite(numPrice) || isNaN(numPrice)) {
      errors.push(`Price is not a valid number: "${raw.price}"`);
    } else if (numPrice <= 0) {
      errors.push(`Price must be positive: ${numPrice}`);
    }

    // 3. Optional open, high, low, volume
    const open = this.parseOptionalNumber(raw.open);
    const high = this.parseOptionalNumber(raw.high);
    const low = this.parseOptionalNumber(raw.low);
    const volume = this.parseOptionalNumber(raw.volume);
    const previousClose = this.parseOptionalNumber(raw.previousClose);

    // 4. Timestamp normalization (Strictly UTC ISO)
    let timestampIso: string;
    if (raw.timestamp) {
      if (typeof raw.timestamp === 'number') {
        // Handle unix timestamp in seconds or milliseconds
        const ms = raw.timestamp < 10000000000 ? raw.timestamp * 1000 : raw.timestamp;
        timestampIso = new Date(ms).toISOString();
      } else {
        const parsedDate = new Date(raw.timestamp);
        if (isNaN(parsedDate.getTime())) {
          errors.push(`Malformed timestamp: "${raw.timestamp}"`);
          timestampIso = new Date().toISOString();
        } else {
          timestampIso = parsedDate.toISOString();
        }
      }
    } else {
      timestampIso = new Date().toISOString();
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    // 5. Deterministic change & percentage calculation
    let change: number | null = null;
    let changePercent: number | null = null;
    let direction: MarketDirection = 'flat';

    if (previousClose !== null && previousClose > 0) {
      const rawChange = numPrice - previousClose;
      const rawPercent = (rawChange / previousClose) * 100;

      change = Number(rawChange.toFixed(decimals));
      changePercent = Number(rawPercent.toFixed(4));

      if (change > 0) {
        direction = 'up';
      } else if (change < 0) {
        direction = 'down';
      } else {
        direction = 'flat';
      }
    }

    // 6. Market status
    let marketStatus: MarketStatus = 'unknown';
    if (raw.isMarketOpen === true) {
      marketStatus = 'open';
    } else if (raw.isMarketOpen === false) {
      marketStatus = 'closed';
    }

    const quote: MarketQuote = {
      symbol: internalSymbol,
      providerSymbol,
      displayName,
      category,
      price: Number(numPrice.toFixed(decimals)),
      open: open !== null ? Number(open.toFixed(decimals)) : null,
      high: high !== null ? Number(high.toFixed(decimals)) : null,
      low: low !== null ? Number(low.toFixed(decimals)) : null,
      previousClose: previousClose !== null ? Number(previousClose.toFixed(decimals)) : null,
      change,
      changePercent,
      direction,
      volume,
      marketStatus,
      timestamp: timestampIso,
      source: raw.source || 'twelve_data',
    };

    return {
      isValid: true,
      errors: [],
      quote,
    };
  }

  private parseOptionalNumber(val: any): number | null {
    if (val === null || val === undefined || val === '') return null;
    const parsed = typeof val === 'number' ? val : parseFloat(String(val));
    return Number.isFinite(parsed) && !isNaN(parsed) ? parsed : null;
  }
}

export const marketValidator = new MarketValidator();
