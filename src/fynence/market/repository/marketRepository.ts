import { insforge } from '@/lib/insforge';
import type { MarketQuote, MarketSnapshot } from '../types';
import type { DbMarketQuote, DbMarketSnapshot } from '../../types/database';

export class MarketRepository {
  /**
   * Persists individual verified quotes into the market_quotes table.
   */
  public async storeQuotes(quotes: MarketQuote[]): Promise<{ stored: number; errors: string[] }> {
    if (quotes.length === 0) return { stored: 0, errors: [] };

    const records: Omit<DbMarketQuote, 'id' | 'created_at'>[] = quotes.map(q => ({
      symbol: q.symbol,
      provider_symbol: q.providerSymbol,
      display_name: q.displayName,
      category: q.category,
      price: q.price,
      open: q.open,
      high: q.high,
      low: q.low,
      previous_close: q.previousClose,
      change: q.change,
      change_percent: q.changePercent,
      direction: q.direction,
      volume: q.volume,
      market_status: q.marketStatus,
      timestamp: q.timestamp,
      source: q.source,
    }));

    try {
      const res = await insforge.database
        .from('market_quotes')
        .insert(records);

      if (res.error) {
        return { stored: 0, errors: [res.error.message] };
      }

      return { stored: records.length, errors: [] };
    } catch (err: any) {
      return { stored: 0, errors: [err?.message || 'Database error storing market quotes'] };
    }
  }

  /**
   * Persists an aggregated market snapshot into the market_snapshots table.
   */
  public async storeSnapshot(snapshot: MarketSnapshot): Promise<{ stored: boolean; snapshotId?: string; error?: string }> {
    try {
      const record = {
        as_of_date: snapshot.asOfDate,
        overall_sentiment: snapshot.overallSentiment,
        sentiment_headline: snapshot.sentimentHeadline,
        quotes_data: snapshot.quotes,
        source_provider: snapshot.source,
        captured_at: snapshot.capturedAt,
      };

      const res = await insforge.database
        .from('market_snapshots')
        .insert([record])
        .select('id')
        .single();

      if (res.error) {
        return { stored: false, error: res.error.message };
      }

      return { stored: true, snapshotId: res.data?.id };
    } catch (err: any) {
      return { stored: false, error: err?.message || 'Database error storing market snapshot' };
    }
  }

  /**
   * Retrieves the most recent aggregated market snapshot.
   */
  public async getLatestSnapshot(): Promise<MarketSnapshot | null> {
    try {
      const res = await insforge.database
        .from('market_snapshots')
        .select()
        .order('captured_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (res.error || !res.data) return null;

      const row = res.data as unknown as DbMarketSnapshot;
      return {
        id: row.id,
        capturedAt: row.captured_at,
        asOfDate: row.as_of_date,
        overallSentiment: row.overall_sentiment as any,
        sentimentHeadline: row.sentiment_headline,
        quotes: row.quotes_data as any,
        source: row.source_provider,
      };
    } catch {
      return null;
    }
  }

  /**
   * Retrieves the most recent quotes for requested symbols.
   */
  public async getLatestQuotes(symbols?: string[]): Promise<MarketQuote[]> {
    try {
      let query = insforge.database
        .from('market_quotes')
        .select()
        .order('timestamp', { ascending: false });

      if (symbols && symbols.length > 0) {
        query = query.in('symbol', symbols);
      }

      const res = await query.limit(50);
      if (res.error || !res.data) return [];

      const rows = res.data as unknown as DbMarketQuote[];
      const latestMap = new Map<string, MarketQuote>();

      for (const row of rows) {
        if (!latestMap.has(row.symbol)) {
          latestMap.set(row.symbol, {
            symbol: row.symbol,
            providerSymbol: row.provider_symbol,
            displayName: row.display_name,
            category: row.category,
            price: Number(row.price),
            open: row.open !== null ? Number(row.open) : null,
            high: row.high !== null ? Number(row.high) : null,
            low: row.low !== null ? Number(row.low) : null,
            previousClose: row.previous_close !== null ? Number(row.previous_close) : null,
            change: row.change !== null ? Number(row.change) : null,
            changePercent: row.change_percent !== null ? Number(row.change_percent) : null,
            direction: row.direction,
            volume: row.volume !== null ? Number(row.volume) : null,
            marketStatus: row.market_status,
            timestamp: row.timestamp,
            source: row.source,
          });
        }
      }

      return Array.from(latestMap.values());
    } catch {
      return [];
    }
  }
}

export const marketRepository = new MarketRepository();
