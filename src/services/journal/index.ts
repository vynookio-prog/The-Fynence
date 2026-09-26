import { insforge } from '@/lib/insforge';
import { Trade, TradeStatus } from '@/types';

export interface JournalTradeFilters {
  tradingAccountId?: string;
  symbol?: string;
  status?: TradeStatus;
  startDate?: string;
  endDate?: string;
  strategyId?: string;
}

export const journalService = {
  /**
   * Fetch trades for the journal with optional filtering
   */
  getTrades: async (
    filters?: JournalTradeFilters
  ): Promise<{ data: Trade[]; error: Error | null }> => {
    try {
      try {
        const { getTradesAction } = await import('@/app/actions');
        const res = await getTradesAction(filters);
        if (!res.error && res.data) {
          return { data: res.data, error: null };
        }
      } catch {
        // Fallback to client SDK
      }

      let query = insforge.database
        .from('trades')
        .select()
        .order('entry_time', { ascending: false });

      if (filters?.tradingAccountId) {
        query = query.eq('trading_account_id', filters.tradingAccountId);
      }
      if (filters?.symbol) {
        query = query.eq('symbol', filters.symbol);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.strategyId) {
        query = query.eq('strategy_id', filters.strategyId);
      }
      if (filters?.startDate) {
        query = query.gte('entry_time', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('entry_time', filters.endDate);
      }

      const response = await query;
      if (response.error) {
        return { data: [], error: new Error(response.error.message || 'Failed to fetch trades') };
      }

      return { data: (response.data || []) as unknown as Trade[], error: null };
    } catch (error) {
      return { data: [], error: error instanceof Error ? error : new Error('Unknown error fetching trades') };
    }
  },

  /**
   * Fetch a single trade by ID
   */
  getTradeById: async (id: string): Promise<{ data: Trade | null; error: Error | null }> => {
    try {
      const response = await insforge.database
        .from('trades')
        .select()
        .eq('id', id)
        .single();

      if (response.error) {
        return { data: null, error: new Error(response.error.message || 'Trade not found') };
      }

      return { data: (response.data || null) as unknown as Trade | null, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error fetching trade') };
    }
  },

  /**
   * Create a new trade in the journal
   */
  createTrade: async (
    trade: Omit<Trade, 'id' | 'created_at' | 'updated_at'> & { id?: string }
  ): Promise<{ data: Trade | null; error: Error | null }> => {
    try {
      try {
        const { createTradeAction } = await import('@/app/actions');
        const res = await createTradeAction(trade);
        if (!res.error && res.data) {
          return { data: res.data, error: null };
        }
      } catch {
        // Fallback to client SDK
      }

      const response = await insforge.database
        .from('trades')
        .insert([trade])
        .select();

      if (response.error) {
        return { data: null, error: new Error(response.error.message || 'Failed to create trade') };
      }

      return { data: (response.data?.[0] || null) as unknown as Trade | null, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error creating trade') };
    }
  },

  /**
   * Update an existing journal trade
   */
  updateTrade: async (
    id: string,
    updates: Partial<Trade>
  ): Promise<{ data: Trade | null; error: Error | null }> => {
    try {
      try {
        const { updateTradeAction } = await import('@/app/actions');
        const res = await updateTradeAction(id, updates);
        if (!res.error && res.data) {
          return { data: res.data, error: null };
        }
      } catch {
        // Fallback to client SDK
      }

      const response = await insforge.database
        .from('trades')
        .update(updates)
        .eq('id', id)
        .select();

      if (response.error) {
        return { data: null, error: new Error(response.error.message || 'Failed to update trade') };
      }

      return { data: (response.data?.[0] || null) as unknown as Trade | null, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error updating trade') };
    }
  },

  /**
   * Delete a trade from the journal
   */
  deleteTrade: async (id: string): Promise<{ error: Error | null }> => {
    try {
      try {
        const { deleteTradeAction } = await import('@/app/actions');
        const res = await deleteTradeAction(id);
        if (res.success) {
          return { error: null };
        }
      } catch {
        // Fallback to client SDK
      }

      // Clean up dependent psychology records if any
      try {
        await insforge.database
          .from('trade_psychology')
          .delete()
          .eq('trade_id', id);
      } catch {
        // ignore if not present
      }

      // Clean up dependent screenshots if any
      try {
        await insforge.database
          .from('trade_screenshots')
          .delete()
          .eq('trade_id', id);
      } catch {
        // ignore
      }

      const response = await insforge.database
        .from('trades')
        .delete()
        .eq('id', id);

      if (response.error) {
        return { error: new Error(response.error.message || 'Failed to delete trade') };
      }

      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Unknown error deleting trade') };
    }
  },
};

export default journalService;
