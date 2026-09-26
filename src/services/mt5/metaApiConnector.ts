import {
  MT5Connector,
  MT5AccountCredentials,
  MT5AccountInfo,
  MT5Position,
  MT5TradeHistoryItem,
  MT5SyncResult,
} from './types';

/**
 * MetaApi cloud MT5 provider implementation.
 * Integrates with MetaApi REST services when METAAPI_TOKEN is configured.
 */
export class MetaApiConnector implements MT5Connector {
  readonly providerName = 'MetaApi';
  private token: string | undefined;

  constructor() {
    this.token = process.env.METAAPI_TOKEN;
  }

  private ensureConfigured() {
    if (!this.token) {
      throw new Error(
        'MetaApi configuration missing: process.env.METAAPI_TOKEN is not set. ' +
        'Please supply METAAPI_TOKEN in your environment or use the Built-in MT5 Connector.'
      );
    }
  }

  async validateConnection(
    credentials: MT5AccountCredentials
  ): Promise<{ valid: boolean; error?: string }> {
    if (!credentials.login || !credentials.server) {
      return { valid: false, error: 'MT5 Login number and Server are required.' };
    }
    if (!this.token) {
      return { valid: false, error: 'MetaApi provider requires METAAPI_TOKEN.' };
    }
    return { valid: true };
  }

  async connectAccount(
    credentials: MT5AccountCredentials
  ): Promise<{ success: boolean; error?: string; accountId?: string }> {
    this.ensureConfigured();
    try {
      const response = await fetch(
        'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts',
        {
          method: 'POST',
          headers: {
            'auth-token': this.token!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: `Fynence_${credentials.login}`,
            type: 'cloud',
            login: credentials.login,
            server: credentials.server,
            password: credentials.password,
            platform: 'mt5',
            magic: 0,
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: response.statusText }));
        return {
          success: false,
          error: err.message || 'Failed to authenticate MT5 account with MetaApi',
        };
      }

      const resData = await response.json().catch(() => ({}));
      return { success: true, accountId: resData.id || credentials.login };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Connection failed' };
    }
  }

  async getAccountInfo(credentials: MT5AccountCredentials): Promise<MT5AccountInfo> {
    this.ensureConfigured();
    const accountId = credentials.externalAccountId || credentials.login;
    const res = await fetch(
      `https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts/${accountId}/information`,
      {
        headers: { 'auth-token': this.token! },
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch MT5 account info: ${res.statusText}`);
    }

    const data = await res.json();
    const balance = Number(data.balance) || 0;
    const equity = Number(data.equity) || balance;
    const margin = Number(data.margin) || 0;
    const freeMargin = Number(data.freeMargin) || equity - margin;

    return {
      login: credentials.login,
      server: credentials.server,
      balance,
      equity,
      margin,
      freeMargin,
      currency: data.currency || 'USD',
      leverage: Number(data.leverage) || 100,
      name: data.name || credentials.login,
    };
  }

  async getOpenPositions(credentials: MT5AccountCredentials): Promise<MT5Position[]> {
    this.ensureConfigured();
    const accountId = credentials.externalAccountId || credentials.login;
    const res = await fetch(
      `https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts/${accountId}/positions`,
      {
        headers: { 'auth-token': this.token! },
      }
    );

    if (!res.ok) return [];
    const data = await res.json();

    return (data || []).map((p: any) => ({
      id: String(p.id || p.ticket),
      symbol: p.symbol,
      type: p.type === 'POSITION_TYPE_BUY' ? 'buy' : 'sell',
      volume: Number(p.volume) || 0.1,
      openPrice: Number(p.openPrice) || 0,
      currentPrice: Number(p.currentPrice) || 0,
      stopLoss: p.stopLoss ? Number(p.stopLoss) : undefined,
      takeProfit: p.takeProfit ? Number(p.takeProfit) : undefined,
      profit: Number(p.profit) || 0,
      openTime: p.time || new Date().toISOString(),
      swap: Number(p.swap) || 0,
      commission: Number(p.commission) || 0,
    }));
  }

  async getTradeHistory(
    credentials: MT5AccountCredentials,
    fromDate?: string
  ): Promise<MT5TradeHistoryItem[]> {
    this.ensureConfigured();
    const accountId = credentials.externalAccountId || credentials.login;
    const startTime = fromDate
      ? new Date(fromDate).toISOString()
      : new Date(Date.now() - 90 * 86400000).toISOString();
    const res = await fetch(
      `https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts/${accountId}/history-deals/time/${startTime}/${new Date().toISOString()}`,
      {
        headers: { 'auth-token': this.token! },
      }
    );

    if (!res.ok) return [];
    const deals = await res.json();

    return (deals || [])
      .filter((d: any) => d.entryType === 'DEAL_ENTRY_OUT' || d.profit !== 0)
      .map((d: any) => ({
        ticket: String(d.id || d.orderId),
        symbol: d.symbol,
        type: d.type === 'DEAL_TYPE_BUY' ? 'buy' : 'sell',
        volume: Number(d.volume) || 0.1,
        openPrice: Number(d.price) || 0,
        closePrice: Number(d.price) || 0,
        commission: Number(d.commission) || 0,
        swap: Number(d.swap) || 0,
        profit: Number(d.profit) || 0,
        netProfit:
          (Number(d.profit) || 0) + (Number(d.commission) || 0) + (Number(d.swap) || 0),
        openTime: d.time || new Date().toISOString(),
        closeTime: d.time || new Date().toISOString(),
        comment: d.comment,
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
