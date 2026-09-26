import { insforge } from '@/lib/insforge';
import { MarketEvent, NewsImpact } from '@/types';
import { detectNewsCorrelation } from '@/lib/correlation';
import { calendarSyncService } from '../calendarSyncService';

export interface MarketEventFilters {
  currency?: string;
  impact?: NewsImpact;
  startDate?: string;
  endDate?: string;
}

export const newsService = {
  /**
   * Fetch market events / economic calendar items
   */
  getMarketEvents: async (
    filters?: MarketEventFilters
  ): Promise<{ data: MarketEvent[]; error: Error | null }> => {
    try {
      let query = insforge.database
        .from('market_events')
        .select()
        .order('event_time', { ascending: true });

      if (filters?.currency) {
        query = query.eq('currency', filters.currency);
      }
      if (filters?.impact) {
        query = query.eq('impact', filters.impact);
      }
      if (filters?.startDate) {
        query = query.gte('event_time', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('event_time', filters.endDate);
      }

      const response = await query;
      if (response.error) {
        return { data: [], error: new Error(response.error.message || 'Failed to fetch market events') };
      }

      return { data: (response.data || []) as unknown as MarketEvent[], error: null };
    } catch (error) {
      return { data: [], error: error instanceof Error ? error : new Error('Unknown error fetching market events') };
    }
  },

  /**
   * Create a single market event
   */
  createMarketEvent: async (
    event: Omit<MarketEvent, 'id'> & { id?: string }
  ): Promise<{ data: MarketEvent | null; error: Error | null }> => {
    try {
      const response = await insforge.database
        .from('market_events')
        .insert([event])
        .select();

      if (response.error) {
        return { data: null, error: new Error(response.error.message || 'Failed to create market event') };
      }

      return { data: (response.data?.[0] || null) as unknown as MarketEvent | null, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error creating market event') };
    }
  },

  /**
   * Batch seed market events
   */
  seedMarketEvents: async (
    events: Omit<MarketEvent, 'id'>[]
  ): Promise<{ count: number; error: Error | null }> => {
    try {
      const response = await insforge.database
        .from('market_events')
        .insert(events)
        .select();

      if (response.error) {
        return { count: 0, error: new Error(response.error.message || 'Failed to seed market events') };
      }

      return { count: response.data?.length || 0, error: null };
    } catch (error) {
      return { count: 0, error: error instanceof Error ? error : new Error('Unknown error seeding market events') };
    }
  },

  /**
   * Synchronize economic calendar via the calendar sync service
   */
  syncForexCalendar: async (
    period: 'today' | 'tomorrow' | 'this_week' | 'previous_week' | 'custom' = 'this_week'
  ) => {
    return calendarSyncService.syncForexCalendar(period);
  },

  /**
   * Pure correlation detection between trade symbol/time and economic events
   */
  detectNewsCorrelation,
};

export default newsService;
