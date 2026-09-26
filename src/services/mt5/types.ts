export interface MT5AccountCredentials {
  login: string;
  server: string;
  password?: string; // Investor/read-only password preferred for security
  type?: 'demo' | 'live' | 'prop';
  eaToken?: string; // Secure token for MT5 Expert Advisor (EA) authentication
  externalAccountId?: string; // External provider account ID
}

export interface MT5AccountInfo {
  login: string;
  server: string;
  balance: number;
  equity: number;
  margin?: number;
  freeMargin?: number;
  currency: string;
  leverage?: number;
  name?: string;
}

export interface MT5Position {
  id: string; // position ticket
  symbol: string;
  type: 'buy' | 'sell';
  volume: number; // lots
  openPrice: number;
  currentPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  profit: number;
  openTime: string;
  swap: number;
  commission: number;
}

export interface MT5TradeHistoryItem {
  ticket: string; // Stable external MT5 order/deal identifier
  symbol: string;
  type: 'buy' | 'sell';
  volume: number; // lots
  openPrice: number;
  closePrice: number;
  stopLoss?: number;
  takeProfit?: number;
  commission: number;
  swap: number;
  profit: number;
  netProfit: number;
  openTime: string;
  closeTime: string;
  comment?: string;
}

export interface MT5SyncResult {
  success: boolean;
  syncedTradesCount: number;
  newTradesCount: number;
  currentBalance: number;
  currentEquity: number;
  margin?: number;
  freeMargin?: number;
  error?: string;
}

/**
 * Replaceable MT5 Adapter Interface.
 * Implementations:
 * - MockMT5Connector (Local Sandbox / Development)
 * - MetaApiConnector (Cloud Gateway)
 * - EABridgeConnector (Direct MQL5 EA Webhook)
 */
export interface MT5Connector {
  readonly providerName: string;
  connectAccount(credentials: MT5AccountCredentials): Promise<{ success: boolean; error?: string; accountId?: string }>;
  validateConnection(credentials: MT5AccountCredentials): Promise<{ valid: boolean; error?: string }>;
  getAccountInfo(credentials: MT5AccountCredentials): Promise<MT5AccountInfo>;
  getOpenPositions(credentials: MT5AccountCredentials): Promise<MT5Position[]>;
  getTradeHistory(credentials: MT5AccountCredentials, fromDate?: string): Promise<MT5TradeHistoryItem[]>;
  syncTrades(
    credentials: MT5AccountCredentials,
    options?: { fromDate?: string; existingTickets?: Set<string> }
  ): Promise<MT5SyncResult>;
}
