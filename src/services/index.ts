/**
 * Unified service layer for Fynence.
 * Reusable across Next.js Web and future React Native / Expo Mobile applications.
 * Business logic is isolated from browser-specific APIs (window, document, localStorage).
 */

// 1. Transactions
export { transactionService, default as transactions } from './transactions';
export type { TransactionFilters } from './transactions';

// 2. Trading Accounts & Strategies
export { tradingService, default as trading } from './trading';

// 3. Journal & Trades
export { journalService, default as journal } from './journal';
export type { JournalTradeFilters } from './journal';

// 4. Psychology & Behavioral Analytics
export { psychologyService, default as psychology } from './psychology';
export type { PsychologyMetrics } from './psychology';

// 5. Market Events & News Calendar
export { newsService, default as news } from './news';
export type { MarketEventFilters } from './news';

// 6. AI Insights
export { aiInsightService } from './ai';

// 7. Profiles
export { profileService } from './profiles';

// Legacy / Specialized Service exports
export { financialAccountService } from './financialAccountService';
export { budgetService } from './budgetService';
export { goalService } from './goalService';
export { notificationService } from './notificationService';
export { calendarSyncService } from './calendarSyncService';
export { mt5SyncService } from './mt5SyncService';
export { tradeService } from './tradeService';
export { tradingAccountService } from './tradingAccountService';
export { strategyService } from './strategyService';
export { marketEventService } from './marketEventService';

// 8. THE FYNENCE Digital Retro Newspaper System
export * from '@/fynence';
