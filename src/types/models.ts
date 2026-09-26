/**
 * Core domain models shared between Web (Next.js) and Mobile (React Native / Expo).
 * These types map directly to the InsForge PostgreSQL schema.
 */

export type {
  UserProfile,
  Profile,
  FinancialAccount,
  AccountType,
  Category,
  Transaction,
  TransactionType,
  Budget,
  FinancialGoal,
  TradingAccount,
  TradingAccountType,
  MT5ConnectionStatus,
  Trade,
  TradeDirection,
  TradeStatus,
  TradingSession,
  Timeframe,
  EmotionType,
  TradeSource,
  TradePsychology,
  TradeScreenshot,
  TradeImageType,
  TradeSyncRecord,
  Strategy,
  MarketEvent,
  NewsImpact,
  AppNotification,
  NotificationType,
  AIInsight,
  AIInsightType,
  AIInsightSeverity,
  Currency,
} from './index';
