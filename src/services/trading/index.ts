import { insforge } from '@/lib/insforge';
import { TradingAccount, Strategy, Trade } from '@/types';
import { mt5SyncService } from '../mt5SyncService';

export const tradingService = {
  // --- TRADING ACCOUNTS ---
  getAccounts: async (): Promise<{ data: TradingAccount[]; error: Error | null }> => {
    try {
      try {
        const { getTradingAccountsAction } = await import('@/app/actions');
        const res = await getTradingAccountsAction();
        if (!res.error && res.data) {
          return { data: res.data, error: null };
        }
      } catch {
        // Fallback to client SDK
      }

      const response = await insforge.database
        .from('trading_accounts')
        .select()
        .order('created_at', { ascending: false });

      if (response.error) {
        return { data: [], error: new Error(response.error.message || 'Failed to fetch trading accounts') };
      }

      return { data: (response.data || []) as unknown as TradingAccount[], error: null };
    } catch (error) {
      return { data: [], error: error instanceof Error ? error : new Error('Unknown error fetching trading accounts') };
    }
  },

  createAccount: async (
    account: Omit<TradingAccount, 'id' | 'created_at' | 'updated_at' | 'user_id'> & { id?: string; user_id?: string }
  ): Promise<{ data: TradingAccount | null; error: Error | null }> => {
    try {
      try {
        const { createTradingAccountAction } = await import('@/app/actions');
        const res = await createTradingAccountAction(account);
        if (!res.error && res.data) {
          return { data: res.data, error: null };
        }
        if (res.error) {
          return { data: null, error: new Error(res.error) };
        }
      } catch {
        // Fallback to client SDK
      }

      const { id, created_at, updated_at, margin, free_margin, ea_token, last_sync_time, external_account_id, ...clean } = account as any;
      const sanitizedPayload: Record<string, any> = {
        name: clean.name,
        broker: clean.broker,
        account_type: clean.account_type || 'demo',
        currency: clean.currency || 'USD',
        initial_balance: Number(clean.initial_balance) || 0,
        current_balance: Number(clean.current_balance ?? clean.initial_balance) || 0,
        current_equity: Number(clean.current_equity ?? clean.initial_balance) || 0,
        profit_target: clean.profit_target ? Number(clean.profit_target) : null,
        max_drawdown_limit: clean.max_drawdown_limit ? Number(clean.max_drawdown_limit) : null,
        mt5_login: clean.mt5_login || null,
        mt5_server: clean.mt5_server || null,
        investor_password_encrypted:
          clean.investor_password_encrypted ||
          clean.investor_password ||
          ea_token ||
          null,
        connection_status: clean.connection_status || (clean.is_mt5_synced ? 'connected' : 'disconnected'),
        is_mt5_synced: Boolean(clean.is_mt5_synced),
        last_synced_at: clean.last_synced_at || last_sync_time || null,
        sync_error: clean.sync_error || null,
        is_active: clean.is_active !== undefined ? Boolean(clean.is_active) : true,
      };

      const response = await insforge.database
        .from('trading_accounts')
        .insert([sanitizedPayload])
        .select();

      if (response.error) {
        return { data: null, error: new Error(response.error.message || 'Failed to create trading account') };
      }

      return { data: (response.data?.[0] || null) as unknown as TradingAccount | null, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error creating trading account') };
    }
  },

  updateAccount: async (
    id: string,
    updates: Partial<TradingAccount>
  ): Promise<{ data: TradingAccount | null; error: Error | null }> => {
    try {
      try {
        const { updateTradingAccountAction } = await import('@/app/actions');
        const res = await updateTradingAccountAction(id, updates);
        if (!res.error && res.data) {
          return { data: res.data, error: null };
        }
        if (res.error) {
          return { data: null, error: new Error(res.error) };
        }
      } catch {
        // Fallback to client SDK
      }

      const { id: _id, created_at, updated_at, user_id, margin, free_margin, ea_token, external_account_id, last_sync_time, ...cleanUpdates } = updates as any;
      const payload: Record<string, any> = { ...cleanUpdates };
      if (last_sync_time && !payload.last_synced_at) {
        payload.last_synced_at = last_sync_time;
      }
      if (ea_token && !payload.investor_password_encrypted) {
        payload.investor_password_encrypted = ea_token;
      }

      const response = await insforge.database
        .from('trading_accounts')
        .update(payload)
        .eq('id', id)
        .select();

      if (response.error) {
        return { data: null, error: new Error(response.error.message || 'Failed to update trading account') };
      }

      return { data: (response.data?.[0] || null) as unknown as TradingAccount | null, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error updating trading account') };
    }
  },

  deleteAccount: async (id: string): Promise<{ error: Error | null }> => {
    try {
      try {
        const { deleteTradingAccountAction } = await import('@/app/actions');
        const res = await deleteTradingAccountAction(id);
        if (res.success) {
          return { error: null };
        }
      } catch {
        // Fallback to client SDK
      }

      const response = await insforge.database
        .from('trading_accounts')
        .delete()
        .eq('id', id);

      if (response.error) {
        return { error: new Error(response.error.message || 'Failed to delete trading account') };
      }

      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Unknown error deleting trading account') };
    }
  },

  // --- STRATEGIES ---
  getStrategies: async (): Promise<{ data: Strategy[]; error: Error | null }> => {
    try {
      const response = await insforge.database
        .from('strategies')
        .select()
        .order('created_at', { ascending: false });

      if (response.error) {
        return { data: [], error: new Error(response.error.message || 'Failed to fetch strategies') };
      }

      return { data: (response.data || []) as unknown as Strategy[], error: null };
    } catch (error) {
      return { data: [], error: error instanceof Error ? error : new Error('Unknown error fetching strategies') };
    }
  },

  createStrategy: async (
    strategy: Omit<Strategy, 'id' | 'created_at' | 'updated_at' | 'user_id'> & { id?: string; user_id?: string }
  ): Promise<{ data: Strategy | null; error: Error | null }> => {
    try {
      const response = await insforge.database
        .from('strategies')
        .insert([strategy])
        .select();

      if (response.error) {
        return { data: null, error: new Error(response.error.message || 'Failed to create strategy') };
      }

      return { data: (response.data?.[0] || null) as unknown as Strategy | null, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error creating strategy') };
    }
  },

  updateStrategy: async (
    id: string,
    updates: Partial<Strategy>
  ): Promise<{ data: Strategy | null; error: Error | null }> => {
    try {
      const response = await insforge.database
        .from('strategies')
        .update(updates)
        .eq('id', id)
        .select();

      if (response.error) {
        return { data: null, error: new Error(response.error.message || 'Failed to update strategy') };
      }

      return { data: (response.data?.[0] || null) as unknown as Strategy | null, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error updating strategy') };
    }
  },

  deleteStrategy: async (id: string): Promise<{ error: Error | null }> => {
    try {
      const response = await insforge.database
        .from('strategies')
        .delete()
        .eq('id', id);

      if (response.error) {
        return { error: new Error(response.error.message || 'Failed to delete strategy') };
      }

      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Unknown error deleting strategy') };
    }
  },

  // --- MT5 SYNCHRONIZATION ---
  syncMT5Account: async (tradingAccountId: string, userId?: string) => {
    return mt5SyncService.syncAccount(tradingAccountId, userId);
  },

  // --- PURE ANALYTICS & METRICS CALCULATION ---
  calculateTradingSummary: (trades: Trade[]) => {
    const closedTrades = trades.filter((t) => t.status === 'closed');
    const totalTrades = closedTrades.length;

    let totalPnL = 0;
    let winningTrades = 0;
    let losingTrades = 0;
    let totalWinAmount = 0;
    let totalLossAmount = 0;
    let totalR = 0;
    let totalDiscipline = 0;
    let fomoTradesCount = 0;
    let revengeTradesCount = 0;
    let bestTrade: Trade | null = null;
    let worstTrade: Trade | null = null;

    const symbolMap: Record<string, { total: number; wins: number; winAmount: number; lossAmount: number; pnl: number }> = {};
    const strategyMap: Record<string, { name: string; total: number; wins: number; winAmount: number; lossAmount: number; pnl: number }> = {};

    closedTrades.forEach((trade) => {
      const pnl = Number(trade.net_profit_loss) || 0;
      totalPnL += pnl;
      totalR += Number(trade.r_multiple) || 0;
      totalDiscipline += trade.psychology?.discipline_score || 0;
      if (trade.psychology?.fomo) fomoTradesCount++;
      if (trade.psychology?.revenge_trading) revengeTradesCount++;

      if (pnl > 0) {
        winningTrades++;
        totalWinAmount += pnl;
      } else if (pnl < 0) {
        losingTrades++;
        totalLossAmount += Math.abs(pnl);
      }

      // Best & Worst trade determination
      if (!bestTrade || pnl > (Number(bestTrade.net_profit_loss) || 0)) {
        bestTrade = trade;
      }
      if (!worstTrade || pnl < (Number(worstTrade.net_profit_loss) || 0)) {
        worstTrade = trade;
      }

      // Performance by Symbol
      if (trade.symbol) {
        if (!symbolMap[trade.symbol]) {
          symbolMap[trade.symbol] = { total: 0, wins: 0, winAmount: 0, lossAmount: 0, pnl: 0 };
        }
        symbolMap[trade.symbol].total++;
        symbolMap[trade.symbol].pnl += pnl;
        if (pnl > 0) {
          symbolMap[trade.symbol].wins++;
          symbolMap[trade.symbol].winAmount += pnl;
        } else if (pnl < 0) {
          symbolMap[trade.symbol].lossAmount += Math.abs(pnl);
        }
      }

      // Performance by Strategy
      const stratKey = trade.strategy_id || 'unassigned';
      const stratName = trade.strategy_name || 'No Strategy';
      if (!strategyMap[stratKey]) {
        strategyMap[stratKey] = { name: stratName, total: 0, wins: 0, winAmount: 0, lossAmount: 0, pnl: 0 };
      }
      strategyMap[stratKey].total++;
      strategyMap[stratKey].pnl += pnl;
      if (pnl > 0) {
        strategyMap[stratKey].wins++;
        strategyMap[stratKey].winAmount += pnl;
      } else if (pnl < 0) {
        strategyMap[stratKey].lossAmount += Math.abs(pnl);
      }
    });

    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : totalWinAmount > 0 ? 99 : 0;
    const avgWin = winningTrades > 0 ? totalWinAmount / winningTrades : 0;
    const avgLoss = losingTrades > 0 ? totalLossAmount / losingTrades : 0;
    const avgRR = totalTrades > 0 ? totalR / totalTrades : 0;
    const avgDiscipline = totalTrades > 0 ? totalDiscipline / totalTrades : 0;

    let peak = 0;
    let maxDrawdown = 0;
    let runningEquity = 100000;
    closedTrades.forEach((trade) => {
      runningEquity += trade.net_profit_loss;
      if (runningEquity > peak) {
        peak = runningEquity;
      }
      const dd = peak > 0 ? ((peak - runningEquity) / peak) * 100 : 0;
      if (dd > maxDrawdown) {
        maxDrawdown = dd;
      }
    });

    const performanceBySymbol = Object.entries(symbolMap).map(([sym, stats]) => ({
      symbol: sym,
      totalTrades: stats.total,
      winningTrades: stats.wins,
      winRate: stats.total > 0 ? (stats.wins / stats.total) * 100 : 0,
      totalPnL: stats.pnl,
      profitFactor: stats.lossAmount > 0 ? stats.winAmount / stats.lossAmount : stats.winAmount > 0 ? 99 : 0,
    })).sort((a, b) => b.totalPnL - a.totalPnL);

    const performanceByStrategy = Object.entries(strategyMap).map(([id, stats]) => ({
      strategyId: id,
      strategyName: stats.name,
      totalTrades: stats.total,
      winningTrades: stats.wins,
      winRate: stats.total > 0 ? (stats.wins / stats.total) * 100 : 0,
      totalPnL: stats.pnl,
      profitFactor: stats.lossAmount > 0 ? stats.winAmount / stats.lossAmount : stats.winAmount > 0 ? 99 : 0,
    })).sort((a, b) => b.totalPnL - a.totalPnL);

    return {
      totalPnL,
      totalTrades,
      winningTrades,
      losingTrades,
      winRate,
      profitFactor,
      avgWin,
      avgLoss,
      avgRR,
      maxDrawdown,
      avgDiscipline,
      fomoTradesCount,
      revengeTradesCount,
      bestTrade,
      worstTrade,
      performanceBySymbol,
      performanceByStrategy,
    };
  },
};

export default tradingService;

