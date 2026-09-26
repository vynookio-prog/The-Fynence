import { insforge } from '@/lib/insforge';
import { getMT5Connector, MT5SyncResult, ConnectorProvider } from './mt5';
import { detectNewsCorrelation } from '@/lib/correlation';
import { AssetType, TradingSession } from '@/types';

function detectAssetType(symbol: string): AssetType {
  const s = symbol.toUpperCase();
  if (s.includes('XAU') || s.includes('GOLD') || s.includes('OIL') || s.includes('XAG') || s.includes('BRENT')) {
    return 'commodities';
  }
  if (s.includes('BTC') || s.includes('ETH') || s.includes('SOL') || s.includes('CRYPTO')) {
    return 'crypto';
  }
  if (s.includes('US30') || s.includes('NAS') || s.includes('SPX') || s.includes('GER30') || s.includes('DAX')) {
    return 'indices';
  }
  return 'forex';
}

function detectSession(dateIso: string): TradingSession {
  const date = new Date(dateIso);
  const hourUtc = date.getUTCHours();
  if (hourUtc >= 7 && hourUtc < 12) return 'London';
  if (hourUtc >= 12 && hourUtc < 16) return 'Overlap';
  if (hourUtc >= 16 && hourUtc < 21) return 'New York';
  return 'Asian';
}

async function getDbClient(clientOverride?: any) {
  if (clientOverride) return clientOverride;
  if (typeof window === 'undefined') {
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const { createConfiguredServerClient } = await import('@/lib/insforge');
      return createConfiguredServerClient({ cookies: cookieStore });
    } catch {
      // Fallback to client SDK
    }
  }
  return insforge;
}

export const mt5SyncService = {
  /**
   * Synchronize an MT5 trading account (telemetry + closed trade history).
   * Idempotent: duplicates are detected and skipped.
   */
  syncAccount: async (
    tradingAccountId: string,
    userId?: string,
    clientOverride?: any
  ): Promise<MT5SyncResult> => {
    let client: any;
    let ownerId = userId;
    try {
      client = await getDbClient(clientOverride);

      // 1. Fetch account details from database
      const { data: accounts, error: fetchErr } = await client.database
        .from('trading_accounts')
        .select()
        .eq('id', tradingAccountId);

      if (fetchErr || !accounts || accounts.length === 0) {
        throw new Error(fetchErr?.message || 'Trading account not found.');
      }

      const account = accounts[0];
      ownerId = userId || account.user_id;

      const eaToken =
        account.ea_token ||
        (account.investor_password_encrypted?.startsWith('ea_')
          ? account.investor_password_encrypted
          : undefined);

      if (!account.mt5_login && !eaToken && !account.investor_password_encrypted) {
        throw new Error('Account does not have MT5 login or EA token configured.');
      }

      // 2. Mark account as syncing
      await client.database
        .from('trading_accounts')
        .update({ connection_status: 'syncing' })
        .eq('id', tradingAccountId);

      // Select connector based on account configuration
      let connectorType: ConnectorProvider = 'builtin';
      if (eaToken) {
        connectorType = 'ea';
      } else if (process.env.MT5_CONNECTOR_TYPE === 'metaapi' && process.env.METAAPI_TOKEN) {
        connectorType = 'metaapi';
      }

      const connector = getMT5Connector(connectorType);
      const credentials = {
        login: account.mt5_login || '1084201',
        server: account.mt5_server || 'MT5-Server',
        password: account.investor_password_encrypted,
        eaToken: eaToken,
        externalAccountId: account.external_account_id,
        type: account.account_type,
      };

      // 3. Validate connection & authenticate
      const validation = await connector.validateConnection(credentials);
      if (!validation.valid) {
        throw new Error(validation.error || 'Connection validation failed.');
      }

      const connectRes = await connector.connectAccount(credentials);
      if (!connectRes.success) {
        throw new Error(connectRes.error || 'Failed to authenticate with MT5 connector.');
      }

      // 4. Retrieve latest account metrics (balance, equity, margin, free margin)
      const accountInfo = await connector.getAccountInfo(credentials);

      // 5. Fetch closed deals trade history
      const tradeHistory = await connector.getTradeHistory(
        credentials,
        account.last_synced_at || undefined
      );

      // 6. Duplicate Protection: Query existing external trade IDs for this account
      const { data: existingTrades } = await client.database
        .from('trades')
        .select('external_trade_id')
        .eq('trading_account_id', tradingAccountId);

      const existingTicketSet = new Set(
        (existingTrades || []).map((t: any) => t.external_trade_id).filter(Boolean)
      );

      // 7. Fetch macro news events for proximity correlation
      const { data: marketEvents } = await client.database.from('market_events').select();

      let newCount = 0;
      let lastTicket = '';
      const tradesToInsert: any[] = [];

      for (const deal of tradeHistory) {
        if (existingTicketSet.has(deal.ticket)) {
          // Idempotency check: skip already imported deals
          continue;
        }

        const risk =
          Math.abs(deal.openPrice - (deal.stopLoss || deal.openPrice * 0.99)) * deal.volume * 100;
        const reward =
          Math.abs((deal.takeProfit || deal.openPrice * 1.02) - deal.openPrice) * deal.volume * 100;
        const rMult =
          risk > 0 ? Number((deal.netProfit / risk).toFixed(2)) : deal.netProfit > 0 ? 1.5 : -1.0;

        // Correlate with Forex Calendar news events
        const correlation = detectNewsCorrelation(deal.symbol, deal.openTime, marketEvents || []);

        tradesToInsert.push({
          user_id: ownerId,
          trading_account_id: tradingAccountId,
          trading_account_name: account.name,
          external_trade_id: deal.ticket,
          source: 'mt5',
          symbol: deal.symbol,
          asset_type: detectAssetType(deal.symbol),
          direction: deal.type,
          entry_price: deal.openPrice,
          exit_price: deal.closePrice,
          stop_loss: deal.stopLoss || 0,
          take_profit: deal.takeProfit || 0,
          position_size: deal.volume,
          leverage: accountInfo.leverage || 100,
          timeframe: 'M15',
          session: detectSession(deal.openTime),
          entry_time: deal.openTime,
          exit_time: deal.closeTime,
          open_time: deal.openTime,
          close_time: deal.closeTime,
          risk_amount: Number(risk.toFixed(2)),
          reward_amount: Number(reward.toFixed(2)),
          profit_loss: deal.profit,
          profit_loss_percent: Number(
            ((deal.netProfit / (account.initial_balance || 100000)) * 100).toFixed(2)
          ),
          r_multiple: rMult,
          commission: deal.commission,
          swap: deal.swap,
          net_profit_loss: deal.netProfit,
          status: 'closed',
          entry_reason: `Imported via ${connector.providerName} (Ticket #${deal.ticket})`,
          exit_reason: deal.comment || 'MT5 Terminal Execution',
          trading_plan: 'Systematic MT5 Execution',
          psychology: {
            emotion: 'neutral',
            confidence: 8,
            fomo: false,
            revenge_trading: false,
            greed: false,
            fear: false,
            followed_plan: true,
            discipline_score: 8,
            before_trade_note: `MT5 Ticket #${deal.ticket}`,
            during_trade_note: '',
            after_trade_note: deal.comment ? `MT5 Comment: ${deal.comment}` : '',
          },
          correlated_news: correlation
            ? {
                event_name: correlation.event_name,
                impact: correlation.impact,
                time_diff_minutes: correlation.time_diff_minutes,
                currency: correlation.currency,
              }
            : undefined,
        });

        newCount++;
        lastTicket = deal.ticket;
        existingTicketSet.add(deal.ticket);
      }

      // 8. Insert new trades in batches if new trades found
      if (tradesToInsert.length > 0) {
        const { error: insertErr } = await client.database
          .from('trades')
          .insert(tradesToInsert);

        if (insertErr) {
          // If error is unique constraint collision, handle gracefully
          if (!insertErr.message?.includes('duplicate key') && !insertErr.message?.includes('unique')) {
            throw new Error(`Failed to insert MT5 trades: ${insertErr.message}`);
          }
        }
      }

      // 9. Update trading account telemetry (strictly existing columns)
      const nowIso = new Date().toISOString();
      await client.database
        .from('trading_accounts')
        .update({
          current_balance: accountInfo.balance,
          current_equity: accountInfo.equity,
          connection_status: 'connected',
          last_synced_at: nowIso,
          sync_error: null,
          is_mt5_synced: true,
        })
        .eq('id', tradingAccountId);

      // 10. Record sync log in trade_sync_records (strictly existing columns)
      try {
        await client.database.from('trade_sync_records').insert([
          {
            user_id: ownerId,
            trading_account_id: tradingAccountId,
            synced_trades_count: tradeHistory.length,
            new_trades_count: newCount,
            status: 'success',
            error_message: null,
          },
        ]);
      } catch (recErr) {
        console.warn('Sync log insert warning:', recErr);
      }

      return {
        success: true,
        syncedTradesCount: tradeHistory.length,
        newTradesCount: newCount,
        currentBalance: accountInfo.balance,
        currentEquity: accountInfo.equity,
        margin: accountInfo.margin,
        freeMargin: accountInfo.freeMargin,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown MT5 synchronization failure';
      const nowIso = new Date().toISOString();

      try {
        const errClient = client || (await getDbClient(clientOverride));
        // Update account status to error
        await errClient.database
          .from('trading_accounts')
          .update({
            connection_status: 'error',
            sync_error: message,
          })
          .eq('id', tradingAccountId);

        // Log failure row in trade_sync_records
        if (ownerId) {
          await errClient.database.from('trade_sync_records').insert([
            {
              user_id: ownerId,
              trading_account_id: tradingAccountId,
              synced_trades_count: 0,
              new_trades_count: 0,
              status: 'failed',
              error_message: message,
            },
          ]);
        }
      } catch {}

      return {
        success: false,
        syncedTradesCount: 0,
        newTradesCount: 0,
        currentBalance: 0,
        currentEquity: 0,
        error: message,
      };
    }
  },

  /**
   * Retrieve historical sync logs for a trading account
   */
  getSyncHistory: async (tradingAccountId: string, limit = 10, clientOverride?: any) => {
    try {
      const client = await getDbClient(clientOverride);
      const { data, error } = await client.database
        .from('trade_sync_records')
        .select()
        .eq('trading_account_id', tradingAccountId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return { data: [], error: new Error(error.message) };
      }
      return { data: data || [], error: null };
    } catch (err: unknown) {
      return {
        data: [],
        error: err instanceof Error ? err : new Error('Failed to retrieve sync history'),
      };
    }
  },

  /**
   * Clear historical sync logs for a trading account
   */
  clearSyncHistory: async (tradingAccountId: string, clientOverride?: any) => {
    try {
      const client = await getDbClient(clientOverride);
      const { error } = await client.database
        .from('trade_sync_records')
        .delete()
        .eq('trading_account_id', tradingAccountId);

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error('Failed to clear sync history'),
      };
    }
  },

  /**
   * Register or generate an MT5 connector EA token for an account
   */
  registerMT5Connector: async (
    tradingAccountId: string,
    options?: { connectorType?: ConnectorProvider; customServer?: string; customLogin?: string },
    clientOverride?: any
  ) => {
    try {
      const client = await getDbClient(clientOverride);
      const eaToken = `ea_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
      const updates: Record<string, any> = {
        connection_status: 'connected',
        is_mt5_synced: true,
        investor_password_encrypted: eaToken,
      };
      if (options?.customServer) updates.mt5_server = options.customServer;
      if (options?.customLogin) updates.mt5_login = options.customLogin;

      const { data, error } = await client.database
        .from('trading_accounts')
        .update(updates)
        .eq('id', tradingAccountId)
        .select();

      if (error) throw new Error(error.message);
      return { success: true, eaToken, account: data?.[0] };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to register MT5 connector',
      };
    }
  },

  /**
   * Synchronize open positions for an account
   */
  syncOpenPositions: async (tradingAccountId: string, clientOverride?: any) => {
    try {
      const client = await getDbClient(clientOverride);
      const { data: accounts } = await client.database
        .from('trading_accounts')
        .select()
        .eq('id', tradingAccountId);

      if (!accounts || accounts.length === 0) {
        throw new Error('Account not found');
      }

      const account = accounts[0];
      const eaToken =
        account.ea_token ||
        (account.investor_password_encrypted?.startsWith('ea_')
          ? account.investor_password_encrypted
          : undefined);
      const connector = getMT5Connector(eaToken ? 'ea' : 'builtin');
      const credentials = {
        login: account.mt5_login || '1084201',
        server: account.mt5_server || 'MT5-Server',
        password: account.investor_password_encrypted,
        eaToken: eaToken,
      };

      const positions = await connector.getOpenPositions(credentials);
      return { success: true, positions };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to sync open positions',
        positions: [],
      };
    }
  },

  /**
   * Batch synchronization for all active MT5 accounts (for scheduled / background execution)
   */
  syncAllActiveAccounts: async (clientOverride?: any) => {
    try {
      const client = await getDbClient(clientOverride);
      const { data: accounts, error } = await client.database
        .from('trading_accounts')
        .select('id, name, is_mt5_synced, connection_status')
        .or('is_mt5_synced.eq.true,connection_status.eq.connected');

      if (error || !accounts) return { syncedCount: 0, results: [] };

      const results = [];
      for (const acc of accounts) {
        const res = await mt5SyncService.syncAccount(acc.id, undefined, client);
        results.push({ accountId: acc.id, name: acc.name, ...res });
      }

      return { syncedCount: accounts.length, results };
    } catch (err: unknown) {
      return {
        syncedCount: 0,
        error: err instanceof Error ? err.message : 'Scheduled sync failed',
        results: [],
      };
    }
  },
};
