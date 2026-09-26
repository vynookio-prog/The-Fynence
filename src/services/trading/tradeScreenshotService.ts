import { insforge } from '@/lib/insforge';
import { TradeScreenshot, TradeImageType } from '@/types';

export const tradeScreenshotService = {
  /**
   * Fetch all screenshots for a specific trade
   */
  getScreenshotsForTrade: async (
    tradeId: string
  ): Promise<{ data: TradeScreenshot[]; error: Error | null }> => {
    try {
      const response = await insforge.database
        .from('trade_screenshots')
        .select()
        .eq('trade_id', tradeId)
        .order('created_at', { ascending: true });

      if (response.error) {
        return { data: [], error: new Error(response.error.message || 'Failed to fetch trade screenshots') };
      }

      return { data: (response.data || []) as unknown as TradeScreenshot[], error: null };
    } catch (error) {
      return { data: [], error: error instanceof Error ? error : new Error('Unknown error fetching screenshots') };
    }
  },

  /**
   * Insert a new trade screenshot metadata record
   */
  saveTradeScreenshot: async (
    screenshot: Omit<TradeScreenshot, 'id' | 'created_at'> & { id?: string }
  ): Promise<{ data: TradeScreenshot | null; error: Error | null }> => {
    try {
      const response = await insforge.database
        .from('trade_screenshots')
        .insert([screenshot])
        .select();

      if (response.error) {
        return { data: null, error: new Error(response.error.message || 'Failed to save trade screenshot') };
      }

      return { data: (response.data?.[0] || null) as unknown as TradeScreenshot | null, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error saving trade screenshot') };
    }
  },

  /**
   * Delete a screenshot by ID and optionally from storage
   */
  deleteTradeScreenshot: async (
    id: string,
    filePath?: string
  ): Promise<{ error: Error | null }> => {
    try {
      try {
        const { deleteTradeScreenshotAction } = await import('@/app/actions');
        const res = await deleteTradeScreenshotAction(id, filePath);
        if (!res.success && res.error) {
          return { error: new Error(res.error) };
        }
        return { error: null };
      } catch {
        // Fallback to client SDK directly
      }

      if (filePath) {
        try {
          await insforge.storage.from('trading-screenshots').remove(filePath);
        } catch (storageErr) {
          console.warn('[tradeScreenshotService] Could not delete from storage:', storageErr);
        }
      }

      const response = await insforge.database
        .from('trade_screenshots')
        .delete()
        .eq('id', id);

      if (response.error) {
        return { error: new Error(response.error.message || 'Failed to delete trade screenshot') };
      }

      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Unknown error deleting trade screenshot') };
    }
  },
};

export default tradeScreenshotService;
