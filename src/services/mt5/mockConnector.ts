import {
  MT5Connector,
  MT5AccountCredentials,
  MT5AccountInfo,
  MT5Position,
  MT5TradeHistoryItem,
  MT5SyncResult,
} from './types';

/**
 * Built-in Sandbox / Resilient Connector.
 * Enables full end-to-end testing of MT5 connection, duplicate protection,
 * positions, and balance/equity telemetry without requiring live third-party cloud API keys.
 */
export class MockMT5Connector implements MT5Connector {
  readonly providerName = 'Built-in MT5 Bridge';

  async connectAccount(
    credentials: MT5AccountCredentials
  ): Promise<{ success: boolean; error?: string; accountId?: string }> {
    const val = await this.validateConnection(credentials);
    if (!val.valid) {
      return { success: false, error: val.error };
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
    return { success: true, accountId: `mock_${credentials.login}` };
  }

  async validateConnection(
    credentials: MT5AccountCredentials
  ): Promise<{ valid: boolean; error?: string }> {
    if (!credentials.login || !credentials.server) {
      return { valid: false, error: 'MT5 Login number and Server are required.' };
    }
    if (credentials.login.length < 4) {
      return { valid: false, error: 'MT5 Login number must be at least 4 digits.' };
    }
    return { valid: true };
  }

  async getAccountInfo(credentials: MT5AccountCredentials): Promise<MT5AccountInfo> {
    const seed = parseInt(credentials.login.replace(/\D/g, '') || '100000', 10);
    const baseBalance = seed > 1000000 ? 100000 : (seed % 90000) + 10000;
    const balance = baseBalance + 3420;
    const equity = balance + 215; // Floating profit
    const margin = 1250;
    const freeMargin = equity - margin;

    return {
      login: credentials.login,
      server: credentials.server,
      balance,
      equity,
      margin,
      freeMargin,
      currency: 'USD',
      leverage: 100,
      name: `Account #${credentials.login}`,
    };
  }

  async getOpenPositions(credentials: MT5AccountCredentials): Promise<MT5Position[]> {
    return [
      {
        id: `${credentials.login}_pos_1`,
        symbol: 'XAUUSD',
        type: 'buy',
        volume: 0.5,
        openPrice: 2510.4,
        currentPrice: 2514.7,
        stopLoss: 2502.0,
        takeProfit: 2530.0,
        profit: 215.0,
        openTime: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
        swap: -3.5,
        commission: -7.0,
      },
    ];
  }

  async getTradeHistory(
    credentials: MT5AccountCredentials,
    fromDate?: string
  ): Promise<MT5TradeHistoryItem[]> {
    const baseId = credentials.login.replace(/\D/g, '') || '5001';

    const items: MT5TradeHistoryItem[] = [
      {
        ticket: `MT5_${baseId}_101`,
        symbol: 'EURUSD',
        type: 'buy',
        volume: 1.0,
        openPrice: 1.0845,
        closePrice: 1.0892,
        stopLoss: 1.082,
        takeProfit: 1.09,
        commission: -7.0,
        swap: -1.2,
        profit: 470.0,
        netProfit: 461.8,
        openTime: '2026-09-02T08:15:00Z',
        closeTime: '2026-09-02T13:42:00Z',
        comment: 'London Breakout [MT5-synced]',
      },
      {
        ticket: `MT5_${baseId}_102`,
        symbol: 'GBPUSD',
        type: 'sell',
        volume: 0.8,
        openPrice: 1.312,
        closePrice: 1.3165,
        stopLoss: 1.315,
        takeProfit: 1.305,
        commission: -5.6,
        swap: -0.8,
        profit: -360.0,
        netProfit: -366.4,
        openTime: '2026-09-03T12:30:00Z',
        closeTime: '2026-09-03T15:10:00Z',
        comment: 'SL hit pullback [MT5-synced]',
      },
      {
        ticket: `MT5_${baseId}_103`,
        symbol: 'XAUUSD',
        type: 'buy',
        volume: 0.5,
        openPrice: 2490.5,
        closePrice: 2515.2,
        stopLoss: 2482.0,
        takeProfit: 2520.0,
        commission: -7.0,
        swap: -4.5,
        profit: 1235.0,
        netProfit: 1223.5,
        openTime: '2026-09-04T13:35:00Z',
        closeTime: '2026-09-04T19:20:00Z',
        comment: 'NFP Expansion Run [MT5-synced]',
      },
      {
        ticket: `MT5_${baseId}_104`,
        symbol: 'USDJPY',
        type: 'buy',
        volume: 1.2,
        openPrice: 143.2,
        closePrice: 143.85,
        stopLoss: 142.9,
        takeProfit: 144.1,
        commission: -8.4,
        swap: 2.1,
        profit: 540.0,
        netProfit: 533.7,
        openTime: '2026-09-05T06:00:00Z',
        closeTime: '2026-09-05T11:45:00Z',
        comment: 'Asian Range Reversal [MT5-synced]',
      },
      {
        ticket: `MT5_${baseId}_105`,
        symbol: 'XAUUSD',
        type: 'sell',
        volume: 0.6,
        openPrice: 2522.0,
        closePrice: 2512.5,
        stopLoss: 2527.0,
        takeProfit: 2505.0,
        commission: -8.4,
        swap: -2.0,
        profit: 570.0,
        netProfit: 559.6,
        openTime: '2026-09-07T14:10:00Z',
        closeTime: '2026-09-07T18:30:00Z',
        comment: 'NY Session Liquidity Sweep [MT5-synced]',
      },
    ];

    if (!fromDate) return items;
    const fromMs = new Date(fromDate).getTime();
    return items.filter((it) => new Date(it.closeTime).getTime() >= fromMs);
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
