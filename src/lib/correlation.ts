import { MarketEvent, NewsImpact } from '@/types';

export interface CorrelatedNewsResult {
  event_name: string;
  impact: NewsImpact;
  time_diff_minutes: number;
  currency: string;
}

/**
 * Detects if a trade execution was near any macroeconomic event in market_events.
 * Per PRD Section 23:
 * Calculates Δt between trade entry/exit and news event time.
 * Matches on currency relevance (e.g. EURUSD matches EUR and USD, XAUUSD matches USD).
 */
export function detectNewsCorrelation(
  symbol: string,
  entryTimeStr: string,
  marketEvents: MarketEvent[],
  thresholdMinutes = 45
): CorrelatedNewsResult | undefined {
  if (!symbol || !entryTimeStr || !marketEvents || marketEvents.length === 0) {
    return undefined;
  }

  const tradeTime = new Date(entryTimeStr).getTime();
  if (isNaN(tradeTime)) return undefined;

  const symbolUpper = symbol.toUpperCase();

  let closestMatch: CorrelatedNewsResult | undefined;
  let minDiff = Infinity;

  for (const event of marketEvents) {
    const eventTime = new Date(event.event_time).getTime();
    if (isNaN(eventTime)) continue;

    const eventCurr = (event.currency || '').toUpperCase();
    
    // Currency relevance check
    const isCurrencyMatched = eventCurr && symbolUpper.includes(eventCurr);
    const isGold = (symbolUpper.includes('XAU') || symbolUpper.includes('GOLD')) && eventCurr === 'USD';
    const isCrypto = (symbolUpper.includes('BTC') || symbolUpper.includes('ETH')) && eventCurr === 'USD';
    const isIndex = (symbolUpper.includes('US30') || symbolUpper.includes('NAS100') || symbolUpper.includes('SPX')) && eventCurr === 'USD';

    if (isCurrencyMatched || isGold || isCrypto || isIndex) {
      const diffMs = Math.abs(tradeTime - eventTime);
      const diffMinutes = Math.round(diffMs / (60 * 1000));

      if (diffMinutes <= thresholdMinutes && diffMinutes < minDiff) {
        minDiff = diffMinutes;
        closestMatch = {
          event_name: event.event_name,
          impact: event.impact,
          time_diff_minutes: diffMinutes,
          currency: event.currency,
        };
      }
    }
  }

  return closestMatch;
}

export interface NearbyEventMatch {
  event: MarketEvent;
  time_diff_minutes: number;
  is_before_trade: boolean;
}

/**
 * Returns all macroeconomic events occurring near trade execution time (within threshold).
 */
export function getNearbyMarketEvents(
  symbol: string,
  tradeTimeStr: string,
  marketEvents: MarketEvent[],
  thresholdMinutes = 180
): NearbyEventMatch[] {
  if (!symbol || !tradeTimeStr || !marketEvents || marketEvents.length === 0) {
    return [];
  }

  const tradeTime = new Date(tradeTimeStr).getTime();
  if (isNaN(tradeTime)) return [];

  const symbolUpper = symbol.toUpperCase();
  const matches: NearbyEventMatch[] = [];

  for (const event of marketEvents) {
    const eventTime = new Date(event.event_time).getTime();
    if (isNaN(eventTime)) continue;

    const eventCurr = (event.currency || '').toUpperCase();
    const isCurrencyMatched = eventCurr && symbolUpper.includes(eventCurr);
    const isGold = (symbolUpper.includes('XAU') || symbolUpper.includes('GOLD')) && eventCurr === 'USD';
    const isCrypto = (symbolUpper.includes('BTC') || symbolUpper.includes('ETH')) && eventCurr === 'USD';
    const isIndex = (symbolUpper.includes('US30') || symbolUpper.includes('NAS100') || symbolUpper.includes('SPX')) && eventCurr === 'USD';

    if (isCurrencyMatched || isGold || isCrypto || isIndex) {
      const diffMs = eventTime - tradeTime;
      const absDiffMinutes = Math.round(Math.abs(diffMs) / (60 * 1000));

      if (absDiffMinutes <= thresholdMinutes) {
        matches.push({
          event,
          time_diff_minutes: absDiffMinutes,
          is_before_trade: diffMs <= 0,
        });
      }
    }
  }

  return matches.sort((a, b) => a.time_diff_minutes - b.time_diff_minutes);
}
