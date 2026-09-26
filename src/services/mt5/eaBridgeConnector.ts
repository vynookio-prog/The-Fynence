import {
  MT5Connector,
  MT5AccountCredentials,
  MT5AccountInfo,
  MT5Position,
  MT5TradeHistoryItem,
  MT5SyncResult,
} from './types';
import { insforge } from '@/lib/insforge';

/**
 * Direct MQL5 Expert Advisor (EA) Bridge Connector.
 * Enables live MT5 terminals (desktop / VPS) to securely push real-time closed deals,
 * balance, equity, and margin using an EA token via WebRequest().
 * 100% read-only, zero trade execution permissions.
 */
export class EABridgeConnector implements MT5Connector {
  readonly providerName = 'MQL5 Expert Advisor Bridge';

  async validateConnection(
    credentials: MT5AccountCredentials
  ): Promise<{ valid: boolean; error?: string }> {
    if (!credentials.eaToken && !credentials.login) {
      return { valid: false, error: 'EA token or MT5 login is required for EA Bridge connector.' };
    }
    return { valid: true };
  }

  async connectAccount(
    credentials: MT5AccountCredentials
  ): Promise<{ success: boolean; error?: string; accountId?: string }> {
    const val = await this.validateConnection(credentials);
    if (!val.valid) {
      return { success: false, error: val.error };
    }

    // Verify account exists in InsForge DB by ea_token or login
    let query = insforge.database.from('trading_accounts').select('id, name, ea_token, connection_status');
    if (credentials.eaToken) {
      query = query.eq('ea_token', credentials.eaToken);
    } else {
      query = query.eq('mt5_login', credentials.login);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return {
        success: false,
        error: 'No trading account matches this EA token. Register token in Fynence first.',
      };
    }

    return { success: true, accountId: data[0].id };
  }

  async getAccountInfo(credentials: MT5AccountCredentials): Promise<MT5AccountInfo> {
    let query = insforge.database
      .from('trading_accounts')
      .select('id, name, broker, current_balance, current_equity, margin, free_margin, currency, mt5_login, mt5_server');

    if (credentials.eaToken) {
      query = query.eq('ea_token', credentials.eaToken);
    } else {
      query = query.eq('mt5_login', credentials.login);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      throw new Error('EA connected account record not found in database.');
    }

    const acc = data[0];
    const balance = Number(acc.current_balance) || 0;
    const equity = Number(acc.current_equity) || balance;
    const margin = Number(acc.margin) || 0;
    const freeMargin = Number(acc.free_margin) || equity - margin;

    return {
      login: acc.mt5_login || credentials.login,
      server: acc.mt5_server || credentials.server,
      balance,
      equity,
      margin,
      freeMargin,
      currency: acc.currency || 'USD',
      leverage: 100,
      name: acc.name,
    };
  }

  async getOpenPositions(credentials: MT5AccountCredentials): Promise<MT5Position[]> {
    // Read cached positions from the latest sync record details
    let query = insforge.database
      .from('trading_accounts')
      .select('id');

    if (credentials.eaToken) {
      query = query.eq('ea_token', credentials.eaToken);
    } else {
      query = query.eq('mt5_login', credentials.login);
    }

    const { data: accounts } = await query;
    if (!accounts || accounts.length === 0) return [];

    const accountId = accounts[0].id;
    const { data: syncRecords } = await insforge.database
      .from('trade_sync_records')
      .select('details')
      .eq('trading_account_id', accountId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (syncRecords && syncRecords.length > 0 && syncRecords[0].details?.openPositions) {
      return syncRecords[0].details.openPositions as MT5Position[];
    }

    return [];
  }

  async getTradeHistory(
    credentials: MT5AccountCredentials,
    fromDate?: string
  ): Promise<MT5TradeHistoryItem[]> {
    // Read trades imported with source mt5
    let query = insforge.database
      .from('trading_accounts')
      .select('id');

    if (credentials.eaToken) {
      query = query.eq('ea_token', credentials.eaToken);
    } else {
      query = query.eq('mt5_login', credentials.login);
    }

    const { data: accounts } = await query;
    if (!accounts || accounts.length === 0) return [];

    const accountId = accounts[0].id;
    let tradesQuery = insforge.database
      .from('trades')
      .select('external_trade_id, symbol, direction, position_size, entry_price, exit_price, stop_loss, take_profit, commission, swap, profit_loss, net_profit_loss, open_time, close_time, entry_reason')
      .eq('trading_account_id', accountId)
      .eq('source', 'mt5');

    if (fromDate) {
      tradesQuery = tradesQuery.gte('close_time', fromDate);
    }

    const { data: trades } = await tradesQuery;
    if (!trades) return [];

    return trades.map((t: any) => ({
      ticket: t.external_trade_id || '',
      symbol: t.symbol,
      type: t.direction,
      volume: Number(t.position_size) || 0,
      openPrice: Number(t.entry_price) || 0,
      closePrice: Number(t.exit_price) || 0,
      stopLoss: Number(t.stop_loss) || 0,
      takeProfit: Number(t.take_profit) || 0,
      commission: Number(t.commission) || 0,
      swap: Number(t.swap) || 0,
      profit: Number(t.profit_loss) || 0,
      netProfit: Number(t.net_profit_loss) || 0,
      openTime: t.open_time || new Date().toISOString(),
      closeTime: t.close_time || new Date().toISOString(),
      comment: t.entry_reason,
    }));
  }

  async syncTrades(
    credentials: MT5AccountCredentials,
    options?: { fromDate?: string; existingTickets?: Set<string> }
  ): Promise<MT5SyncResult> {
    const info = await this.getAccountInfo(credentials);
    const history = await this.getTradeHistory(credentials, options?.fromDate);
    const existing = options?.existingTickets || new Set<string>();

    let newTradesCount = 0;
    for (const item of history) {
      if (!existing.has(item.ticket)) {
        newTradesCount++;
      }
    }

    return {
      success: true,
      syncedTradesCount: history.length,
      newTradesCount,
      currentBalance: info.balance,
      currentEquity: info.equity,
      margin: info.margin,
      freeMargin: info.freeMargin,
    };
  }
}
