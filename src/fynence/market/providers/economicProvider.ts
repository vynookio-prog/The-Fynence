import { insforge } from '@/lib/insforge';
import type { EconomicDataProvider, EconomicDataProviderOptions } from './types';
import type { EconomicEvent, EconomicEventImportance } from '../types';

export class InsforgeEconomicDataProvider implements EconomicDataProvider {
  public readonly name = 'insforge_economic_calendar';

  public async getUpcomingEvents(options?: EconomicDataProviderOptions): Promise<EconomicEvent[]> {
    try {
      const limit = options?.limit ?? 15;
      const nowIso = new Date().toISOString();

      let query = insforge.database
        .from('market_events')
        .select()
        .gte('event_time', options?.startDate || nowIso)
        .order('event_time', { ascending: true })
        .limit(limit);

      if (options?.endDate) {
        query = query.lte('event_time', options.endDate);
      }
      if (options?.currency) {
        query = query.eq('currency', options.currency.toUpperCase());
      }
      if (options?.minImportance) {
        if (options.minImportance === 'high') {
          query = query.eq('impact', 'high');
        } else if (options.minImportance === 'medium') {
          query = query.in('impact', ['high', 'medium']);
        }
      }

      const res = await query;
      if (res.error || !res.data) {
        return [];
      }

      return (res.data as any[]).map(row => this.mapRowToEconomicEvent(row));
    } catch {
      return [];
    }
  }

  private mapRowToEconomicEvent(row: any): EconomicEvent {
    let importance: EconomicEventImportance = 'medium';
    if (row.impact === 'high') importance = 'high';
    else if (row.impact === 'low') importance = 'low';

    return {
      id: row.id,
      title: row.event_name || 'Economic Indicator',
      country: row.country || 'Global',
      currency: row.currency || 'USD',
      importance,
      scheduledAt: row.event_time ? new Date(row.event_time).toISOString() : new Date().toISOString(),
      actual: row.actual !== null && row.actual !== undefined ? String(row.actual) : null,
      forecast: row.forecast !== null && row.forecast !== undefined ? String(row.forecast) : null,
      previous: row.previous !== null && row.previous !== undefined ? String(row.previous) : null,
      impact: row.impact ? (row.impact === 'high' ? 'positive' : 'neutral') : 'unknown',
      source: row.source_event_id ? 'forex_factory_calendar' : 'market_calendar',
    };
  }
}

export class MockEconomicDataProvider implements EconomicDataProvider {
  public readonly name = 'mock_economic_calendar';

  private events: EconomicEvent[] = [];

  constructor(initialEvents?: EconomicEvent[]) {
    if (initialEvents) {
      this.events = [...initialEvents];
    } else {
      this.seedDefaultEvents();
    }
  }

  public setEvents(events: EconomicEvent[]): void {
    this.events = [...events];
  }

  public async getUpcomingEvents(options?: EconomicDataProviderOptions): Promise<EconomicEvent[]> {
    const limit = options?.limit ?? 10;
    let filtered = [...this.events];

    if (options?.currency) {
      filtered = filtered.filter(e => e.currency === options.currency);
    }
    if (options?.minImportance) {
      if (options.minImportance === 'high') {
        filtered = filtered.filter(e => e.importance === 'high');
      } else if (options.minImportance === 'medium') {
        filtered = filtered.filter(e => e.importance === 'high' || e.importance === 'medium');
      }
    }

    return filtered.slice(0, limit);
  }

  private seedDefaultEvents(): void {
    const now = new Date();
    const plusHours = (h: number) => new Date(now.getTime() + h * 60 * 60 * 1000).toISOString();

    this.events = [
      {
        id: 'econ_01',
        title: 'US Consumer Price Index (CPI) YoY',
        country: 'United States',
        currency: 'USD',
        importance: 'high',
        scheduledAt: plusHours(3),
        actual: null,
        forecast: '2.5%',
        previous: '2.6%',
        impact: 'unknown',
        source: 'us_bureau_of_labor_statistics',
      },
      {
        id: 'econ_02',
        title: 'FOMC Interest Rate Decision',
        country: 'United States',
        currency: 'USD',
        importance: 'high',
        scheduledAt: plusHours(8),
        actual: null,
        forecast: '5.00%',
        previous: '5.25%',
        impact: 'unknown',
        source: 'federal_reserve',
      },
      {
        id: 'econ_03',
        title: 'Eurozone Harmonised Index of Consumer Prices (HICP)',
        country: 'Eurozone',
        currency: 'EUR',
        importance: 'medium',
        scheduledAt: plusHours(14),
        actual: null,
        forecast: '2.1%',
        previous: '2.2%',
        impact: 'unknown',
        source: 'eurostat',
      },
      {
        id: 'econ_04',
        title: 'Bank Indonesia 7-Day Reverse Repo Rate',
        country: 'Indonesia',
        currency: 'IDR',
        importance: 'high',
        scheduledAt: plusHours(24),
        actual: null,
        forecast: '6.00%',
        previous: '6.25%',
        impact: 'unknown',
        source: 'bank_indonesia',
      },
    ];
  }
}
