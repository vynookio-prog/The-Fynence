export type Currency = 'USD' | 'IDR' | 'EUR';

export type AccountType = 'bank' | 'cash' | 'ewallet' | 'savings' | 'investment';

export interface FinancialAccount {
  id: string;
  user_id: string;
  name: string;
  account_type: AccountType;
  currency: Currency;
  initial_balance: number;
  current_balance: number;
  is_active: boolean;
  institution?: string;
  account_number?: string;
}

export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  description: string;
  transaction_date: string;
  attachment_url?: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  category_name: string;
  amount: number;
  spent: number;
  currency: Currency;
  period: 'monthly' | 'weekly';
  start_date: string;
  end_date: string;
}

export interface FinancialGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  currency: Currency;
  deadline: string;
  status: 'active' | 'completed' | 'archived';
  category?: string;
}

export type TradingAccountType = 'prop' | 'broker' | 'demo' | 'personal';
export type MT5ConnectionStatus = 'connected' | 'disconnected' | 'syncing' | 'error';

export interface TradingAccount {
  id: string;
  user_id: string;
  name: string;
  broker: string;
  account_type: TradingAccountType;
  currency: Currency;
  initial_balance: number;
  current_balance: number;
  current_equity?: number;
  is_active: boolean;
  profit_target?: number;
  max_drawdown_limit?: number;
  mt5_login?: string;
  mt5_server?: string;
  external_account_id?: string;
  ea_token?: string;
  margin?: number;
  free_margin?: number;
  connection_status?: MT5ConnectionStatus;
  last_synced_at?: string;
  last_sync_time?: string;
  sync_error?: string;
  investor_password_encrypted?: string;
  is_mt5_synced?: boolean;
}

export type AssetType = 'forex' | 'crypto' | 'indices' | 'commodities';
export type TradeDirection = 'buy' | 'sell';
export type TradeStatus = 'open' | 'closed' | 'cancelled';
export type TradingSession = 'London' | 'New York' | 'Asian' | 'Overlap';
export type Timeframe = 'M1' | 'M5' | 'M15' | 'H1' | 'H4' | 'D1';
export type EmotionType = 'neutral' | 'confident' | 'anxious' | 'greedy' | 'fearful' | 'euphoric';
export type TradeSource = 'manual' | 'mt5';

export type TradeImageType = 'before' | 'during' | 'after';

export interface TradeScreenshot {
  id: string;
  trade_id: string;
  user_id: string;
  file_path: string;
  image_type: TradeImageType;
  created_at?: string;
}

export interface TradePsychology {
  id?: string;
  user_id?: string;
  trade_id?: string;
  emotion: EmotionType;
  confidence: number; // 1-10
  fomo: boolean;
  revenge_trading: boolean;
  greed: boolean;
  fear: boolean;
  followed_plan: boolean;
  discipline_score: number; // 1-10
  before_trade_note: string;
  during_trade_note: string;
  after_trade_note: string;
  lessons_learned?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Trade {
  id: string;
  user_id: string;
  trading_account_id: string;
  trading_account_name?: string;
  external_trade_id?: string;
  source?: TradeSource;
  symbol: string;
  asset_type: AssetType;
  direction: TradeDirection;
  entry_price: number;
  exit_price: number;
  stop_loss: number;
  take_profit: number;
  position_size: number; // lots or units
  leverage: number;
  timeframe: Timeframe;
  session: TradingSession;
  entry_time: string;
  exit_time: string;
  open_time?: string;
  close_time?: string;
  risk_amount: number;
  reward_amount: number;
  profit_loss: number;
  profit_loss_percent: number;
  r_multiple: number;
  commission: number;
  swap: number;
  net_profit_loss: number;
  status: TradeStatus;
  entry_reason: string;
  exit_reason: string;
  trading_plan?: string;
  strategy_id?: string;
  strategy_name?: string;
  psychology: TradePsychology;
  screenshot_url?: string;
  screenshots?: TradeScreenshot[];
  correlated_news?: {
    event_name: string;
    impact: 'high' | 'medium' | 'low' | 'non-economic';
    time_diff_minutes: number;
    currency: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface TradeSyncRecord {
  id: string;
  user_id: string;
  trading_account_id: string;
  synced_trades_count: number;
  new_trades_count: number;
  status: 'success' | 'failed' | 'partial' | 'syncing';
  sync_status?: 'success' | 'failed' | 'partial' | 'syncing';
  external_trade_id?: string;
  last_synced_timestamp?: string;
  details?: Record<string, any>;
  error_message?: string;
  created_at: string;
}

export interface Strategy {
  id: string;
  user_id: string;
  name: string;
  description: string;
  rules: string[];
  is_active: boolean;
  win_rate: number;
  total_trades: number;
  pnl: number;
}

export type NewsImpact = 'low' | 'medium' | 'high' | 'non-economic';

export interface MarketEvent {
  id: string;
  external_event_id?: string;
  source: string;
  event_name: string;
  currency: string;
  country: string;
  impact: NewsImpact;
  event_time: string;
  timezone?: string;
  actual?: string;
  forecast?: string;
  previous?: string;
  description?: string;
  source_event_id?: string;
  source_url?: string;
  created_at?: string;
  updated_at?: string;
}

export type NotificationType = 'budget_warning' | 'drawdown_alert' | 'news_proximity' | 'psychology_pattern' | 'info' | 'system';

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read?: boolean;
  link_tab?: ActiveTab;
  created_at: string;
}

export type AIInsightType = 'financial' | 'trading' | 'psychology' | 'weekly_review' | 'monthly_review';
export type AIInsightSeverity = 'info' | 'warning' | 'success' | 'alert';

export interface AIInsight {
  id: string;
  user_id: string;
  insight_type: AIInsightType;
  title: string;
  content: string;
  source_period?: string;
  created_at: string;
  severity?: AIInsightSeverity;
}

export interface UserProfile {
  id: string;
  email?: string;
  display_name: string;
  avatar_url: string;
  default_currency: Currency;
  timezone: string;
  tier: 'PRO' | 'FREE';
  created_at?: string;
  updated_at?: string;
}

export type Profile = UserProfile;

export type ActiveTab = 'dashboard' | 'market' | 'money' | 'trading' | 'news' | 'calendar' | 'report' | 'ai' | 'profile';
export type MoneySubTab = 'overview' | 'accounts' | 'budgets' | 'goals';
export type TradingSubTab = 'journal' | 'trades' | 'performance' | 'strategies' | 'psychology' | 'accounts';
export type AISubTab = 'financial' | 'psychology' | 'weekly_review';

export * from './market';

export interface SymbolPerformance {
  symbol: string;
  totalTrades: number;
  winningTrades: number;
  winRate: number;
  totalPnL: number;
  profitFactor: number;
}

export interface StrategyPerformance {
  strategyId: string;
  strategyName: string;
  totalTrades: number;
  winningTrades: number;
  winRate: number;
  totalPnL: number;
  profitFactor: number;
}

export interface TradingSummary {
  totalPnL: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  avgRR: number;
  maxDrawdown: number;
  avgDiscipline: number;
  fomoTradesCount: number;
  revengeTradesCount: number;
  bestTrade: Trade | null;
  worstTrade: Trade | null;
  performanceBySymbol: SymbolPerformance[];
  performanceByStrategy: StrategyPerformance[];
}

export * from './pulse';
export * from '@/fynence/types';
