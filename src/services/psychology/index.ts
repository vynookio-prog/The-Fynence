import { insforge } from '@/lib/insforge';
import { Trade, TradePsychology } from '@/types';

export interface PsychologyMetrics {
  fomoCount: number;
  fomoWinRate: number;
  fomoLossAmount: number;
  nonFomoCount: number;
  nonFomoWinRate: number;
  revengeCount: number;
  revengeLossAmount: number;
  avgWinDisc: number;
  avgLossDisc: number;
}

export const psychologyService = {
  /**
   * Fetch psychology records for a user or specific trade
   */
  getTradePsychology: async (
    tradeId?: string
  ): Promise<{ data: TradePsychology[]; error: Error | null }> => {
    try {
      let query = insforge.database
        .from('trade_psychology')
        .select()
        .order('created_at', { ascending: false });

      if (tradeId) {
        query = query.eq('trade_id', tradeId);
      }

      const response = await query;
      if (response.error) {
        return { data: [], error: new Error(response.error.message || 'Failed to fetch trade psychology') };
      }

      return { data: (response.data || []) as unknown as TradePsychology[], error: null };
    } catch (error) {
      return { data: [], error: error instanceof Error ? error : new Error('Unknown error fetching psychology') };
    }
  },

  /**
   * Save or update trade psychology entry in PostgreSQL (upsert support on trade_id or id)
   */
  saveTradePsychology: async (
    entry: Omit<TradePsychology, 'id' | 'created_at' | 'updated_at'> & { id?: string }
  ): Promise<{ data: TradePsychology | null; error: Error | null }> => {
    try {
      let targetId = entry.id;

      if (!targetId && entry.trade_id) {
        const existing = await insforge.database
          .from('trade_psychology')
          .select('id')
          .eq('trade_id', entry.trade_id)
          .limit(1);

        if (existing.data && existing.data.length > 0) {
          targetId = existing.data[0].id;
        }
      }

      if (targetId) {
        const payload = { ...entry };
        delete payload.id;
        const response = await insforge.database
          .from('trade_psychology')
          .update({
            ...payload,
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetId)
          .select();

        if (response.error) {
          return { data: null, error: new Error(response.error.message || 'Failed to update trade psychology') };
        }

        return { data: (response.data?.[0] || null) as unknown as TradePsychology | null, error: null };
      }

      const response = await insforge.database
        .from('trade_psychology')
        .insert([entry])
        .select();

      if (response.error) {
        return { data: null, error: new Error(response.error.message || 'Failed to save trade psychology') };
      }

      return { data: (response.data?.[0] || null) as unknown as TradePsychology | null, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error saving trade psychology') };
    }
  },

  /**
   * Update existing trade psychology record by ID
   */
  updateTradePsychology: async (
    id: string,
    updates: Partial<TradePsychology>
  ): Promise<{ data: TradePsychology | null; error: Error | null }> => {
    try {
      const response = await insforge.database
        .from('trade_psychology')
        .update(updates)
        .eq('id', id)
        .select();

      if (response.error) {
        return { data: null, error: new Error(response.error.message || 'Failed to update trade psychology') };
      }

      return { data: (response.data?.[0] || null) as unknown as TradePsychology | null, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error updating trade psychology') };
    }
  },

  /**
   * Delete trade psychology record
   */
  deleteTradePsychology: async (id: string): Promise<{ error: Error | null }> => {
    try {
      const response = await insforge.database
        .from('trade_psychology')
        .delete()
        .eq('id', id);

      if (response.error) {
        return { error: new Error(response.error.message || 'Failed to delete trade psychology') };
      }

      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Unknown error deleting trade psychology') };
    }
  },

  /**
   * Calculate behavioral psychology metrics across closed trades.
   * Pure domain logic reusable across Web and React Native mobile clients.
   */
  calculatePsychologyMetrics: (trades: Trade[]): PsychologyMetrics => {
    let fomoCount = 0;
    let fomoWins = 0;
    let fomoLossAmount = 0;
    let nonFomoCount = 0;
    let nonFomoWins = 0;
    let revengeCount = 0;
    let revengeLossAmount = 0;
    let totalWinDiscipline = 0;
    let winCountWithDiscipline = 0;
    let totalLossDiscipline = 0;
    let lossCountWithDiscipline = 0;

    trades.forEach((t) => {
      const isWin = (Number(t.net_profit_loss) || 0) > 0;
      const isFomo = t.psychology?.fomo;
      const isRevenge = t.psychology?.revenge_trading;
      const disc = t.psychology?.discipline_score || 0;

      if (isFomo) {
        fomoCount++;
        if (isWin) fomoWins++;
        else fomoLossAmount += Math.abs(Number(t.net_profit_loss) || 0);
      } else {
        nonFomoCount++;
        if (isWin) nonFomoWins++;
      }

      if (isRevenge) {
        revengeCount++;
        if (!isWin) revengeLossAmount += Math.abs(Number(t.net_profit_loss) || 0);
      }

      if (disc > 0) {
        if (isWin) {
          totalWinDiscipline += disc;
          winCountWithDiscipline++;
        } else {
          totalLossDiscipline += disc;
          lossCountWithDiscipline++;
        }
      }
    });

    const fomoWinRate = fomoCount > 0 ? (fomoWins / fomoCount) * 100 : 0;
    const nonFomoWinRate = nonFomoCount > 0 ? (nonFomoWins / nonFomoCount) * 100 : 0;
    const avgWinDisc = winCountWithDiscipline > 0 ? totalWinDiscipline / winCountWithDiscipline : 8.5;
    const avgLossDisc = lossCountWithDiscipline > 0 ? totalLossDiscipline / lossCountWithDiscipline : 5.2;

    return {
      fomoCount,
      fomoWinRate,
      fomoLossAmount,
      nonFomoCount,
      nonFomoWinRate,
      revengeCount,
      revengeLossAmount,
      avgWinDisc,
      avgLossDisc,
    };
  },
};

export default psychologyService;

