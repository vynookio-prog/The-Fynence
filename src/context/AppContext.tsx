'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserProfile,
  FinancialAccount,
  Transaction,
  Budget,
  FinancialGoal,
  TradingAccount,
  Trade,
  Strategy,
  MarketEvent,
  AIInsight,
  Currency,
  ActiveTab,
  MoneySubTab,
  TradingSubTab,
  AISubTab,
  Category,
  AppNotification,
  TradingSummary,
  TradeSyncRecord,
} from '@/types';
import { tradingService } from '@/services/trading';
import { transactionService } from '@/services/transactions';
import { detectNewsCorrelation } from '@/lib/correlation';
import { getStoredTimezone, setStoredTimezone } from '@/lib/timezone';
import { resetInsForgeClient } from '@/lib/insforge';

import {
  mockUserProfile,
  mockFinancialAccounts,
  mockTransactions,
  mockBudgets,
  mockGoals,
  mockTradingAccounts,
  mockStrategies,
  mockTrades,
  mockMarketEvents,
  mockAIInsights,
  mockCategories,
} from '@/lib/mockData';

// Constant conversion rate for consolidated analytics
export const USD_TO_IDR = 16000;

interface AppContextType {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  isLoadingAuth: boolean;
  logout: () => Promise<void>;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSidebar: () => void;
  moneySubTab: MoneySubTab;
  setMoneySubTab: (subTab: MoneySubTab) => void;
  tradingSubTab: TradingSubTab;
  setTradingSubTab: (subTab: TradingSubTab) => void;
  aiSubTab: AISubTab;
  setAiSubTab: (subTab: AISubTab) => void;
  displayCurrency: Currency;
  toggleCurrency: () => void;
  setDisplayCurrency: (curr: Currency) => void;

  // Data
  categories: Category[];
  financialAccounts: FinancialAccount[];
  isLoadingFinancialAccounts: boolean;
  financialAccountsError: string | null;
  loadFinancialAccounts: () => Promise<void>;
  tradingAccounts: TradingAccount[];
  isLoadingTradingAccounts: boolean;
  tradingAccountsError: string | null;
  loadTradingAccounts: () => Promise<void>;
  transactions: Transaction[];
  isLoadingTransactions: boolean;
  transactionsError: string | null;
  trades: Trade[];
  isLoadingTrades: boolean;
  tradesError: string | null;
  loadTrades: () => Promise<void>;
  budgets: Budget[];
  isLoadingBudgets: boolean;
  budgetsError: string | null;
  loadBudgets: () => Promise<void>;
  addBudget: (b: Omit<Budget, 'id' | 'user_id'>) => Promise<Budget | null>;
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  goals: FinancialGoal[];
  isLoadingGoals: boolean;
  goalsError: string | null;
  loadGoals: () => Promise<void>;
  addGoal: (goal: Omit<FinancialGoal, 'id' | 'user_id'>) => Promise<FinancialGoal | null>;
  updateGoal: (id: string, updates: Partial<FinancialGoal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  strategies: Strategy[];
  isLoadingStrategies: boolean;
  strategiesError: string | null;
  loadStrategies: () => Promise<void>;
  marketEvents: MarketEvent[];
  isLoadingMarketEvents: boolean;
  loadMarketEvents: () => Promise<void>;
  aiInsights: AIInsight[];
  notifications: AppNotification[];
  isLoadingNotifications: boolean;
  unreadNotificationsCount: number;
  loadNotifications: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  addNotification: (notif: Omit<AppNotification, 'id' | 'created_at' | 'user_id'>) => Promise<AppNotification | null>;

  // Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addTrade: (trade: Omit<Trade, 'id' | 'user_id'>) => Promise<void>;
  updateTrade: (id: string, updates: Partial<Trade>) => Promise<void>;
  deleteTrade: (id: string) => Promise<void>;
  addFinancialAccount: (acc: Omit<FinancialAccount, 'id' | 'user_id'>) => Promise<FinancialAccount | null>;
  updateFinancialAccount: (id: string, updates: Partial<FinancialAccount>) => Promise<void>;
  deleteFinancialAccount: (id: string) => Promise<void>;
  addTradingAccount: (acc: Omit<TradingAccount, 'id' | 'user_id'>) => Promise<TradingAccount | null>;
  updateTradingAccount: (id: string, updates: Partial<TradingAccount>) => Promise<void>;
  deleteTradingAccount: (id: string) => Promise<void>;
  addStrategy: (strat: Omit<Strategy, 'id' | 'user_id'>) => Promise<Strategy | null>;
  updateStrategy: (id: string, updates: Partial<Strategy>) => Promise<void>;
  deleteStrategy: (id: string) => Promise<void>;
  syncMT5Account: (accountId: string) => Promise<{ success: boolean; error?: string; newTradesCount?: number }>;
  getSyncHistory: (accountId: string) => Promise<{ data: TradeSyncRecord[]; error: string | null }>;
  registerMT5Connector: (accountId: string, options?: any) => Promise<{ success: boolean; eaToken?: string; error?: string }>;
  syncingAccountIds: Record<string, boolean>;
  syncMarketData: (
    optionsOrPeriod?:
      | 'today'
      | 'tomorrow'
      | 'this_week'
      | 'previous_week'
      | 'custom'
      | {
          period?: 'today' | 'tomorrow' | 'this_week' | 'previous_week' | 'custom';
          startDate?: string;
          endDate?: string;
          provider?: string;
        }
  ) => Promise<void>;
  isSyncingMarket: boolean;

  // Modals & Drawers
  isAddTransactionOpen: boolean;
  setIsAddTransactionOpen: (open: boolean) => void;
  isAddTradeOpen: boolean;
  setIsAddTradeOpen: (open: boolean) => void;
  selectedTradeForDetail: Trade | null;
  setSelectedTradeForDetail: (trade: Trade | null) => void;
  isProfileSettingsOpen: boolean;
  setIsProfileSettingsOpen: (open: boolean) => void;
  profileSettingsTab: 'profile' | 'settings' | 'appearance';
  setProfileSettingsTab: (tab: 'profile' | 'settings' | 'appearance') => void;
  openProfileSettings: (tab?: 'profile' | 'settings' | 'appearance') => void;
  timezone: string;
  setTimezone: (tz: string) => void;
  updateUserProfile: (updates: { display_name?: string; avatar_url?: string; timezone?: string }) => Promise<{ success: boolean; error?: string }>;

  // Computed Summaries
  financialSummary: {
    totalNetWorthUSD: number;
    totalNetWorthIDR: number;
    totalInitialBalanceUSD: number;
    netWorthGrowthPercent: number;
    monthlyIncomeUSD: number;
    monthlyExpenseUSD: number;
    netCashFlowUSD: number;
    totalSavingsUSD: number;
  };

  tradingSummary: TradingSummary;

  formatCurrency: (amount: number, currencyOverride?: Currency) => string;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  resolvedTheme: 'light' | 'dark';
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 jam timeout
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fynence_user_profile');
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as UserProfile;
          if (parsed && parsed.id) return parsed;
        } catch {}
      }
    }
    return mockUserProfile;
  });
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  const handleSetActiveTab = (tab: ActiveTab) => {
    setActiveTab(tab);
  };

  // ─── Desktop Collapsible Sidebar System ───
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('fynence_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('fynence_sidebar_collapsed', String(next));
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input, textarea, or contentEditable
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  const [moneySubTab, setMoneySubTab] = useState<MoneySubTab>('overview');
  const [tradingSubTab, setTradingSubTab] = useState<TradingSubTab>('journal');
  const [aiSubTab, setAiSubTab] = useState<AISubTab>('financial');
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('USD');

  // ─── Theme Preference System ───
  type ThemePreference = 'light' | 'dark' | 'system';
  const getInitialTheme = (): ThemePreference => {
    if (typeof window === 'undefined') return 'system';
    const stored = localStorage.getItem('fynence_theme') as ThemePreference | null;
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
    return 'system'; // Default for new users
  };

  const [theme, setThemeState] = useState<ThemePreference>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Compute the resolved theme (what's actually applied)
  const getResolvedTheme = (pref: ThemePreference): 'light' | 'dark' => {
    if (pref === 'system') {
      if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'light';
    }
    return pref;
  };

  // Apply theme class to <html> element
  const applyTheme = (resolved: 'light' | 'dark') => {
    if (typeof document !== 'undefined') {
      if (resolved === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const initialPref = getInitialTheme();
    setThemeState(initialPref);
    const resolved = getResolvedTheme(initialPref);
    setResolvedTheme(resolved);
    applyTheme(resolved);

    // Listen for system preference changes (only when theme is 'system')
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handleSystemChange = () => {
        setThemeState((currentPref) => {
          if (currentPref === 'system') {
            const newResolved = mq.matches ? 'dark' : 'light';
            setResolvedTheme(newResolved);
            applyTheme(newResolved);
          }
          return currentPref;
        });
      };
      mq.addEventListener('change', handleSystemChange);
      return () => mq.removeEventListener('change', handleSystemChange);
    }
  }, []);

  const setTheme = (newPref: ThemePreference) => {
    setThemeState(newPref);
    const resolved = getResolvedTheme(newPref);
    setResolvedTheme(resolved);
    applyTheme(resolved);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fynence_theme', newPref);
      // Add transition class briefly for smooth animation
      document.documentElement.classList.add('theme-transition');
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transition');
      }, 400);
    }
  };

  const toggleTheme = () => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  const [timezone, setTimezoneState] = useState<string>(() => getStoredTimezone());
  const [profileSettingsTab, setProfileSettingsTab] = useState<'profile' | 'settings' | 'appearance'>('profile');

  const setSessionUser = (newUser: UserProfile | null) => {
    setUser(newUser);
    if (typeof window !== 'undefined') {
      try {
        resetInsForgeClient();
      } catch {}
      if (newUser) {
        localStorage.setItem('fynence_user_profile', JSON.stringify(newUser));
        localStorage.setItem('fynence_session_timestamp', Date.now().toString());
      } else {
        localStorage.removeItem('fynence_user_profile');
        localStorage.removeItem('fynence_session_timestamp');
      }
    }
  };

  const logout = async () => {
    try {
      const { signOutAction } = await import('@/app/actions');
      await signOutAction();
    } catch (e) {
      console.error('Sign out error:', e);
    } finally {
      setSessionUser(null);
      if (typeof window !== 'undefined') {
        router.push('/login');
      }
    }
  };

  useEffect(() => {
    const initSession = async () => {
      try {
        const now = Date.now();
        const savedTimeStr = typeof window !== 'undefined' ? localStorage.getItem('fynence_session_timestamp') : null;
        const savedProfileStr = typeof window !== 'undefined' ? localStorage.getItem('fynence_user_profile') : null;

        // 1. Cek apakah sesi sudah melewati batas 24 jam tanpa aktivitas/login
        if (savedTimeStr) {
          const savedTime = Number(savedTimeStr);
          if (!isNaN(savedTime) && now - savedTime > SESSION_TIMEOUT_MS) {
            // Sesi kedaluwarsa (> 24 jam) -> paksa logout & bersihkan cache
            if (typeof window !== 'undefined') {
              localStorage.removeItem('fynence_session_timestamp');
              localStorage.removeItem('fynence_user_profile');
            }
            const { signOutAction } = await import('@/app/actions');
            await signOutAction();
            setUser(null);
            setIsLoadingAuth(false);
            return;
          }
        }

        // 2. Hidrasi instan dari cache lokal jika masih valid (< 24 jam)
        if (savedProfileStr) {
          try {
            const cachedUser = JSON.parse(savedProfileStr) as UserProfile;
            if (cachedUser && cachedUser.id) {
              const currentSavedTz = getStoredTimezone();
              if (currentSavedTz && (!cachedUser.timezone || cachedUser.timezone === 'UTC')) {
                cachedUser.timezone = currentSavedTz;
              }
              setUser(cachedUser);
            }
          } catch {
            // Abaikan kesalahan parse JSON
          }
        }

        // 2b. Hidrasi preferensi mata uang tampilan
        const savedCurrency = typeof window !== 'undefined' ? localStorage.getItem('fynence_display_currency') : null;
        if (savedCurrency === 'USD' || savedCurrency === 'IDR') {
          setDisplayCurrency(savedCurrency as Currency);
        }

        // 3. Verifikasi sesi otoritatif dari server via Server Action
        const { getCurrentUserAction } = await import('@/app/actions');
        const { user: authUser } = await getCurrentUserAction();

        if (authUser) {
          const profile = authUser.profile as Record<string, unknown> | null;
          const userMeta = (authUser as Record<string, unknown>).user_metadata as Record<string, unknown> | undefined;

          // Priority for restoring user's preferred timezone:
          // 1. profile.timezone from auth backend
          // 2. user_metadata.timezone from auth backend
          // 3. getStoredTimezone() from localStorage (fynence_timezone)
          // 4. Default to 'UTC'
          const storedTz = getStoredTimezone();
          const serverTz = (typeof profile?.timezone === 'string' && profile.timezone)
            ? profile.timezone
            : ((typeof userMeta?.timezone === 'string' && userMeta.timezone)
                ? userMeta.timezone
                : null);

          const effectiveTimezone = (serverTz && serverTz !== 'UTC')
            ? serverTz
            : (storedTz || serverTz || 'UTC');

          const verifiedUser: UserProfile = {
            id: authUser.id,
            email: authUser.email || '',
            display_name: (typeof profile?.name === 'string' && profile.name) ? profile.name : 'Fynence User',
            avatar_url: (typeof profile?.avatar_url === 'string' && profile.avatar_url) ? profile.avatar_url : 'https://i.pravatar.cc/150?u=fynence',
            default_currency: 'USD',
            timezone: effectiveTimezone,
            tier: 'FREE',
          };
          setSessionUser(verifiedUser);
          setTimezoneState(effectiveTimezone);
          setStoredTimezone(effectiveTimezone);
        } else {
          // Jika server menyatakan tidak ada sesi aktif
          if (savedTimeStr && now - Number(savedTimeStr) > SESSION_TIMEOUT_MS) {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('fynence_session_timestamp');
              localStorage.removeItem('fynence_user_profile');
            }
            setUser(mockUserProfile);
          } else if (!savedProfileStr) {
            setUser(mockUserProfile);
          }
        }
      } catch (err) {
        console.error('Session initialization error:', err);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    initSession();
  }, []);

  // Rolling activity tracker: perbarui timestamp aktivitas setiap ada interaksi (throttle 2 menit)
  useEffect(() => {
    if (!user || typeof window === 'undefined') return;

    const updateLastActive = () => {
      const now = Date.now();
      const last = Number(localStorage.getItem('fynence_session_timestamp') || '0');
      if (now - last > 2 * 60 * 1000) {
        localStorage.setItem('fynence_session_timestamp', now.toString());
      }
    };

    window.addEventListener('click', updateLastActive, { passive: true });
    window.addEventListener('keydown', updateLastActive, { passive: true });
    window.addEventListener('scroll', updateLastActive, { passive: true });
    window.addEventListener('focus', updateLastActive);

    return () => {
      window.removeEventListener('click', updateLastActive);
      window.removeEventListener('keydown', updateLastActive);
      window.removeEventListener('scroll', updateLastActive);
      window.removeEventListener('focus', updateLastActive);
    };
  }, [user]);

  // Synchronize timezone if user profile provides one
  useEffect(() => {
    if (user?.timezone && user.timezone !== timezone) {
      // If user profile has UTC but stored timezone is specific (e.g. Asia/Jakarta),
      // do not overwrite the specific stored timezone with default UTC.
      if (user.timezone === 'UTC' && timezone && timezone !== 'UTC') {
        setUser((prev) => (prev ? { ...prev, timezone } : null));
        return;
      }
      setTimezoneState(user.timezone);
      setStoredTimezone(user.timezone);
    }
  }, [user?.timezone, timezone]);

  // Listen to external timezone changes (e.g. from CustomEvent)
  useEffect(() => {
    const handleTzChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail && customEvent.detail !== timezone) {
        setTimezoneState(customEvent.detail);
      }
    };
    window.addEventListener('fynence_timezone_change', handleTzChange);
    return () => window.removeEventListener('fynence_timezone_change', handleTzChange);
  }, [timezone]);

  const setTimezone = (newTz: string) => {
    setTimezoneState(newTz);
    setStoredTimezone(newTz);
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, timezone: newTz };
      if (typeof window !== 'undefined') {
        localStorage.setItem('fynence_user_profile', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const openProfileSettings = (tab: 'profile' | 'settings' | 'appearance' = 'profile') => {
    setProfileSettingsTab(tab);
    if (typeof window !== 'undefined') {
      router.push(`/profile?tab=${tab}`);
    }
  };

  // Entities state
  const [categories] = useState<Category[]>(mockCategories);

  // Financial Accounts
  const [financialAccounts, setFinancialAccounts] = useState<FinancialAccount[]>(mockFinancialAccounts);
  const [isLoadingFinancialAccounts, setIsLoadingFinancialAccounts] = useState(false);
  const [financialAccountsError, setFinancialAccountsError] = useState<string | null>(null);

  const loadFinancialAccounts = async () => {
    setIsLoadingFinancialAccounts(true);
    setFinancialAccountsError(null);
    try {
      const userKey = user?.id || 'demo';
      const isSeeded = typeof window !== 'undefined' && user?.id
        ? localStorage.getItem(`fynence_seeded_financial_accounts_${user.id}`) === 'true'
        : false;
      const deletedAccountIds = typeof window !== 'undefined'
        ? new Set<string>(JSON.parse(localStorage.getItem(`fynence_deleted_financial_accounts_${userKey}`) || '[]'))
        : new Set<string>();

      const { financialAccountService } = await import('@/services/financialAccountService');
      const { data, error } = await financialAccountService.getAccounts();
      if (error) {
        setFinancialAccountsError(error.message || 'Failed to load accounts');
      } else if (data && data.length > 0) {
        const filtered = data.filter((a) => !deletedAccountIds.has(a.id));
        setFinancialAccounts(filtered);
        if (typeof window !== 'undefined' && user?.id) {
          localStorage.setItem(`fynence_seeded_financial_accounts_${user.id}`, 'true');
        }
      } else if (isSeeded) {
        setFinancialAccounts([]);
      } else {
        const seedAccounts: Omit<FinancialAccount, 'id' | 'user_id'>[] = [
          {
            name: 'BCA Main Checking',
            institution: 'Bank Central Asia',
            account_number: '•••• 8920',
            account_type: 'bank',
            currency: 'IDR',
            initial_balance: 35000000,
            current_balance: 48250000,
            is_active: true,
          },
          {
            name: 'GoPay & OVO E-Wallet',
            institution: 'GoTo Financial',
            account_number: '0812••••441',
            account_type: 'ewallet',
            currency: 'IDR',
            initial_balance: 2000000,
            current_balance: 3650000,
            is_active: true,
          },
          {
            name: 'USD Reserve & Crypto',
            institution: 'Wise & Binance',
            account_number: 'alex.p@wise',
            account_type: 'investment',
            currency: 'USD',
            initial_balance: 4000,
            current_balance: 6240,
            is_active: true,
          },
        ];
        const created: FinancialAccount[] = [];
        for (const sa of seedAccounts) {
          const res = await financialAccountService.createAccount(sa);
          if (res.data) created.push(res.data);
        }
        setFinancialAccounts(created.filter((a) => !deletedAccountIds.has(a.id)));
        if (typeof window !== 'undefined' && user?.id) {
          localStorage.setItem(`fynence_seeded_financial_accounts_${user.id}`, 'true');
        }
      }
    } catch {
      setFinancialAccountsError('An unexpected error occurred loading financial accounts');
    } finally {
      setIsLoadingFinancialAccounts(false);
    }
  };

  // Trading Accounts
  const [tradingAccounts, setTradingAccounts] = useState<TradingAccount[]>(mockTradingAccounts);
  const [isLoadingTradingAccounts, setIsLoadingTradingAccounts] = useState(false);
  const [tradingAccountsError, setTradingAccountsError] = useState<string | null>(null);

  const loadTradingAccounts = async () => {
    setIsLoadingTradingAccounts(true);
    setTradingAccountsError(null);
    try {
      const userKey = user?.id || 'demo';
      const isSeeded = typeof window !== 'undefined' && user?.id
        ? localStorage.getItem(`fynence_seeded_trading_accounts_${user.id}`) === 'true'
        : false;
      const deletedAccountIds = typeof window !== 'undefined'
        ? new Set<string>(JSON.parse(localStorage.getItem(`fynence_deleted_trading_accounts_${userKey}`) || '[]'))
        : new Set<string>();

      const { tradingAccountService } = await import('@/services/tradingAccountService');
      const { data, error } = await tradingAccountService.getAccounts();
      if (error) {
        setTradingAccountsError(error.message || 'Failed to load trading accounts');
      } else if (data && data.length > 0) {
        const filtered = data.filter((a) => !deletedAccountIds.has(a.id));
        setTradingAccounts(filtered);
        if (typeof window !== 'undefined' && user?.id) {
          localStorage.setItem(`fynence_seeded_trading_accounts_${user.id}`, 'true');
        }
      } else if (isSeeded) {
        setTradingAccounts([]);
      } else {
        const seedTrading: Omit<TradingAccount, 'id' | 'user_id'>[] = [
          {
            name: 'FTMO $100K Funded',
            broker: 'FTMO EU Server',
            account_type: 'prop',
            currency: 'USD',
            initial_balance: 100000,
            current_balance: 106420,
            current_equity: 106635,
            mt5_login: '1084201',
            mt5_server: 'FTMO-Server2',
            connection_status: 'connected',
            is_mt5_synced: true,
            last_synced_at: new Date().toISOString(),
            is_active: true,
            profit_target: 10000,
            max_drawdown_limit: 10000,
          },
          {
            name: 'IC Markets Raw ECN',
            broker: 'IC Markets Global',
            account_type: 'broker',
            currency: 'USD',
            initial_balance: 10000,
            current_balance: 13840,
            current_equity: 13840,
            mt5_login: '5029148',
            mt5_server: 'ICMarketsSC-Live01',
            connection_status: 'connected',
            is_mt5_synced: true,
            last_synced_at: new Date().toISOString(),
            is_active: true,
          },
        ];
        const created: TradingAccount[] = [];
        for (const sa of seedTrading) {
          const res = await tradingAccountService.createAccount(sa);
          if (res.data) created.push(res.data);
        }
        setTradingAccounts(created.filter((a) => !deletedAccountIds.has(a.id)));
        if (typeof window !== 'undefined' && user?.id) {
          localStorage.setItem(`fynence_seeded_trading_accounts_${user.id}`, 'true');
        }
      }
    } catch {
      setTradingAccountsError('An unexpected error occurred loading trading accounts');
    } finally {
      setIsLoadingTradingAccounts(false);
    }
  };

  // Strategies
  const [strategies, setStrategies] = useState<Strategy[]>(mockStrategies);
  const [isLoadingStrategies, setIsLoadingStrategies] = useState(false);
  const [strategiesError, setStrategiesError] = useState<string | null>(null);

  const loadStrategies = async () => {
    setIsLoadingStrategies(true);
    setStrategiesError(null);
    try {
      const userKey = user?.id || 'demo';
      const isSeeded = typeof window !== 'undefined' && user?.id
        ? localStorage.getItem(`fynence_seeded_strategies_${user.id}`) === 'true'
        : false;
      const deletedStrategyIds = typeof window !== 'undefined'
        ? new Set<string>(JSON.parse(localStorage.getItem(`fynence_deleted_strategies_${userKey}`) || '[]'))
        : new Set<string>();

      const { strategyService } = await import('@/services/strategyService');
      const { data, error } = await strategyService.getStrategies();
      if (error) {
        setStrategiesError(error.message || 'Failed to load strategies');
      } else if (data && data.length > 0) {
        const filtered = data.filter((s) => !deletedStrategyIds.has(s.id));
        setStrategies(filtered);
        if (typeof window !== 'undefined' && user?.id) {
          localStorage.setItem(`fynence_seeded_strategies_${user.id}`, 'true');
        }
      } else if (isSeeded) {
        setStrategies([]);
      } else {
        const seedStrategies: Omit<Strategy, 'id' | 'user_id'>[] = [
          {
            name: 'Liquidity Sweep + MSS',
            description: 'Purge of previous Asian high/low followed by Market Structure Shift on M5.',
            rules: [
              'Look for key liquidity pool grab during London/NY open',
              'Confirm displacement candle with Fair Value Gap',
              'Stop loss placed behind the sweep wick (max 15 pips)',
              'Minimum RR requirement of 1:2.5',
              'Do not trade 15 mins before or after Red Folder News',
            ],
            is_active: true,
            win_rate: 72.7,
            total_trades: 22,
            pnl: 5840,
          },
          {
            name: 'London Breakout Continuation',
            description: 'Break of pre-market consolidation with strong volume expansion.',
            rules: [
              'Mark 06:00 - 08:00 GMT consolidation box',
              'Enter on retest of breakout level',
              'Target 1.5x ADR or opposing liquidity pool',
            ],
            is_active: true,
            win_rate: 58.3,
            total_trades: 12,
            pnl: 1720,
          },
        ];
        const created: Strategy[] = [];
        for (const ss of seedStrategies) {
          const res = await strategyService.createStrategy(ss);
          if (res.data) created.push(res.data);
        }
        setStrategies(created.filter((s) => !deletedStrategyIds.has(s.id)));
        if (typeof window !== 'undefined' && user?.id) {
          localStorage.setItem(`fynence_seeded_strategies_${user.id}`, 'true');
        }
      }
    } catch {
      setStrategiesError('An unexpected error occurred loading strategies');
    } finally {
      setIsLoadingStrategies(false);
    }
  };

  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);

  const loadTransactions = async () => {
    setIsLoadingTransactions(true);
    setTransactionsError(null);
    try {
      const userKey = user?.id || 'demo';
      const isSeeded = typeof window !== 'undefined' && user?.id
        ? localStorage.getItem(`fynence_seeded_txs_${user.id}`) === 'true'
        : false;
      const deletedTxIds = typeof window !== 'undefined'
        ? new Set<string>(JSON.parse(localStorage.getItem(`fynence_deleted_txs_${userKey}`) || '[]'))
        : new Set<string>();

      const { transactionService } = await import('@/services/transactionService');
      const { data, error } = await transactionService.getTransactions();

      if (error) {
        setTransactionsError(error.message || 'Failed to load transactions');
        if (!isSeeded) {
          setTransactions(mockTransactions.filter((tx) => !deletedTxIds.has(tx.id)));
        }
      } else if (data && data.length > 0) {
        const filtered = data.filter((tx) => !deletedTxIds.has(tx.id));
        setTransactions(filtered);
        if (typeof window !== 'undefined' && user?.id) {
          localStorage.setItem(`fynence_seeded_txs_${user.id}`, 'true');
        }
      } else if (isSeeded) {
        // User has already initialized previously; empty DB table means transactions were deleted
        setTransactions([]);
      } else {
        // First-time seed into database with real foreign keys
        const { financialAccountService } = await import('@/services/financialAccountService');
        let currentFinAccs = financialAccounts;
        if (!currentFinAccs || currentFinAccs.length === 0) {
          const finRes = await financialAccountService.getAccounts();
          currentFinAccs = finRes.data || [];
        }
        const primaryFinAcc = currentFinAccs[0];

        const seedTxs: Transaction[] = [];
        for (const mt of mockTransactions) {
          if (deletedTxIds.has(mt.id)) continue;
          const { id, user_id, account_id, ...rest } = mt;
          const res = await transactionService.createTransaction({
            account_id: primaryFinAcc?.id || 'default_account',
            category_id: rest.category_id,
            type: rest.type,
            amount: rest.amount,
            currency: rest.currency,
            description: rest.description,
            transaction_date: rest.transaction_date,
            user_id: user?.id || 'default_user',
          } as any);
          if (res.data) seedTxs.push(res.data);
        }

        if (typeof window !== 'undefined' && user?.id) {
          localStorage.setItem(`fynence_seeded_txs_${user.id}`, 'true');
        }

        if (seedTxs.length > 0) {
          setTransactions(seedTxs.filter((tx) => !deletedTxIds.has(tx.id)));
        } else {
          setTransactions(mockTransactions.filter((tx) => !deletedTxIds.has(tx.id)));
        }
      }
    } catch (err) {
      setTransactionsError('An unexpected error occurred');
      const userKey = user?.id || 'demo';
      const deletedTxIds = typeof window !== 'undefined'
        ? new Set<string>(JSON.parse(localStorage.getItem(`fynence_deleted_txs_${userKey}`) || '[]'))
        : new Set<string>();
      setTransactions(mockTransactions.filter((tx) => !deletedTxIds.has(tx.id)));
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const [trades, setTrades] = useState<Trade[]>(mockTrades);
  const [isLoadingTrades, setIsLoadingTrades] = useState(false);
  const [tradesError, setTradesError] = useState<string | null>(null);

  const loadTrades = async () => {
    setIsLoadingTrades(true);
    setTradesError(null);
    try {
      const userKey = user?.id || 'demo';
      const isSeeded = typeof window !== 'undefined' && user?.id
        ? localStorage.getItem(`fynence_seeded_trades_${user.id}`) === 'true'
        : false;
      const deletedTradeIds = typeof window !== 'undefined'
        ? new Set<string>(JSON.parse(localStorage.getItem(`fynence_deleted_trades_${userKey}`) || '[]'))
        : new Set<string>();

      const { tradeService } = await import('@/services/tradeService');
      const { data, error } = await tradeService.getTrades();

      if (error) {
        setTradesError(error.message || 'Failed to load trades');
        if (!isSeeded) {
          setTrades(mockTrades.filter((t) => !deletedTradeIds.has(t.id)));
        }
      } else if (data && data.length > 0) {
        const filtered = data.filter((t) => !deletedTradeIds.has(t.id));
        setTrades(filtered);
        if (typeof window !== 'undefined' && user?.id) {
          localStorage.setItem(`fynence_seeded_trades_${user.id}`, 'true');
        }
      } else if (isSeeded) {
        // User has already initialized previously; empty DB table means trades were deleted
        setTrades([]);
      } else {
        // First-time seed into database with real foreign keys
        const { tradingAccountService } = await import('@/services/tradingAccountService');
        let currentTradingAccs = tradingAccounts;
        if (!currentTradingAccs || currentTradingAccs.length === 0) {
          const accRes = await tradingAccountService.getAccounts();
          currentTradingAccs = accRes.data || [];
        }
        const primaryTradingAcc = currentTradingAccs[0];

        const { strategyService } = await import('@/services/strategyService');
        let currentStrats = strategies;
        if (!currentStrats || currentStrats.length === 0) {
          const stratRes = await strategyService.getStrategies();
          currentStrats = stratRes.data || [];
        }
        const primaryStrat = currentStrats[0];

        const seedTrades: Trade[] = [];
        for (const t of mockTrades) {
          if (deletedTradeIds.has(t.id)) continue;
          const { id, user_id, trading_account_id, strategy_id, ...rest } = t;
          const res = await tradeService.createTrade({
            ...rest,
            trading_account_id: primaryTradingAcc?.id || 'manual_account',
            trading_account_name: primaryTradingAcc?.name || t.trading_account_name,
            strategy_id: primaryStrat?.id,
            strategy_name: primaryStrat?.name || t.strategy_name,
            source: rest.source || 'manual',
            user_id: user?.id || 'default_user',
          } as any);
          if (res.data) seedTrades.push(res.data);
        }

        if (typeof window !== 'undefined' && user?.id) {
          localStorage.setItem(`fynence_seeded_trades_${user.id}`, 'true');
        }

        if (seedTrades.length > 0) {
          setTrades(seedTrades.filter((t) => !deletedTradeIds.has(t.id)));
        } else {
          setTrades(mockTrades.filter((t) => !deletedTradeIds.has(t.id)));
        }
      }
    } catch {
      setTradesError('An unexpected error occurred loading trades');
      const userKey = user?.id || 'demo';
      const deletedTradeIds = typeof window !== 'undefined'
        ? new Set<string>(JSON.parse(localStorage.getItem(`fynence_deleted_trades_${userKey}`) || '[]'))
        : new Set<string>();
      setTrades(mockTrades.filter((t) => !deletedTradeIds.has(t.id)));
    } finally {
      setIsLoadingTrades(false);
    }
  };

  // Budgets
  const [budgets, setBudgets] = useState<Budget[]>(mockBudgets);
  const [isLoadingBudgets, setIsLoadingBudgets] = useState(false);
  const [budgetsError, setBudgetsError] = useState<string | null>(null);

  const loadBudgets = async () => {
    setIsLoadingBudgets(true);
    setBudgetsError(null);
    try {
      const isSeeded = typeof window !== 'undefined' && user?.id
        ? localStorage.getItem(`fynence_seeded_budgets_${user.id}`) === 'true'
        : false;

      const { budgetService } = await import('@/services/budgetService');
      const { data, error } = await budgetService.getBudgets();
      if (error) {
        setBudgetsError(error.message || 'Failed to load budgets');
      } else if (data && data.length > 0) {
        setBudgets(data);
        if (typeof window !== 'undefined' && user?.id) {
          localStorage.setItem(`fynence_seeded_budgets_${user.id}`, 'true');
        }
      } else if (isSeeded) {
        setBudgets([]);
      } else {
        const seedBudgets: Omit<Budget, 'id' | 'user_id'>[] = [
          {
            category_id: 'cat_housing',
            category_name: 'Housing & Living',
            amount: 700,
            spent: 531.25,
            currency: 'USD',
            period: 'monthly',
            start_date: '2026-09-01',
            end_date: '2026-09-30',
          },
          {
            category_id: 'cat_food',
            category_name: 'Food & Groceries',
            amount: 400,
            spent: 245.0,
            currency: 'USD',
            period: 'monthly',
            start_date: '2026-09-01',
            end_date: '2026-09-30',
          },
          {
            category_id: 'cat_subscriptions',
            category_name: 'Software & Tools',
            amount: 120,
            spent: 108.5,
            currency: 'USD',
            period: 'monthly',
            start_date: '2026-09-01',
            end_date: '2026-09-30',
          },
          {
            category_id: 'cat_lifestyle',
            category_name: 'Lifestyle & Fitness',
            amount: 250,
            spent: 130.0,
            currency: 'USD',
            period: 'monthly',
            start_date: '2026-09-01',
            end_date: '2026-09-30',
          },
        ];
        const created: Budget[] = [];
        for (const sb of seedBudgets) {
          const res = await budgetService.createBudget(sb);
          if (res.data) created.push(res.data);
        }
        if (typeof window !== 'undefined' && user?.id) {
          localStorage.setItem(`fynence_seeded_budgets_${user.id}`, 'true');
        }
        setBudgets(created.length > 0 ? created : []);
      }
    } catch {
      setBudgetsError('An unexpected error occurred loading budgets');
    } finally {
      setIsLoadingBudgets(false);
    }
  };

  // Financial Goals
  const [goals, setGoals] = useState<FinancialGoal[]>(mockGoals);
  const [isLoadingGoals, setIsLoadingGoals] = useState(false);
  const [goalsError, setGoalsError] = useState<string | null>(null);

  const loadGoals = async () => {
    setIsLoadingGoals(true);
    setGoalsError(null);
    try {
      const isSeeded = typeof window !== 'undefined' && user?.id
        ? localStorage.getItem(`fynence_seeded_goals_${user.id}`) === 'true'
        : false;

      const { goalService } = await import('@/services/goalService');
      const { data, error } = await goalService.getGoals();
      if (error) {
        setGoalsError(error.message || 'Failed to load financial goals');
      } else if (data && data.length > 0) {
        setGoals(data);
        if (typeof window !== 'undefined' && user?.id) {
          localStorage.setItem(`fynence_seeded_goals_${user.id}`, 'true');
        }
      } else if (isSeeded) {
        setGoals([]);
      } else {
        const seedGoals: Omit<FinancialGoal, 'id' | 'user_id'>[] = [
          {
            name: '6-Month Runway Emergency Fund',
            target_amount: 15000,
            current_amount: 11450,
            currency: 'USD',
            deadline: '2026-12-31',
            status: 'active',
            category: 'Safety Net',
          },
          {
            name: 'Prop Firm Scaling Buffer ($200k Acc)',
            target_amount: 8000,
            current_amount: 5700,
            currency: 'USD',
            deadline: '2026-11-15',
            status: 'active',
            category: 'Trading Capital',
          },
          {
            name: 'Triple Ultrawide Bloomberg/Trading Rig',
            target_amount: 3200,
            current_amount: 3200,
            currency: 'USD',
            deadline: '2026-08-30',
            status: 'completed',
            category: 'Equipment',
          },
        ];
        const created: FinancialGoal[] = [];
        for (const sg of seedGoals) {
          const res = await goalService.createGoal(sg);
          if (res.data) created.push(res.data);
        }
        if (typeof window !== 'undefined' && user?.id) {
          localStorage.setItem(`fynence_seeded_goals_${user.id}`, 'true');
        }
        setGoals(created.length > 0 ? created : []);
      }
    } catch {
      setGoalsError('An unexpected error occurred loading financial goals');
    } finally {
      setIsLoadingGoals(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (user && user.id !== 'usr_vyno_001') {
      loadTransactions();
      loadTrades();
      loadFinancialAccounts();
      loadTradingAccounts();
      loadStrategies();
      loadBudgets();
      loadGoals();
      loadMarketEvents();
      loadNotifications();
    } else if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTransactions([]);
      setTrades([]);
      setFinancialAccounts([]);
      setTradingAccounts([]);
      setStrategies([]);
      setBudgets([]);
      setGoals([]);
      setNotifications([]);
    }
  }, [user]);

  // Market Events
  const [marketEvents, setMarketEvents] = useState<MarketEvent[]>(mockMarketEvents);
  const [isLoadingMarketEvents, setIsLoadingMarketEvents] = useState(false);

  const loadMarketEvents = async () => {
    setIsLoadingMarketEvents(true);
    try {
      const { marketEventService } = await import('@/services/marketEventService');
      const { data } = await marketEventService.getMarketEvents();
      if (data && data.length >= mockMarketEvents.length) {
        setMarketEvents(data);
      } else {
        // Seed missing market events from mockMarketEvents to PostgreSQL
        const existingKeys = new Set((data || []).map((e) => `${e.event_name}_${e.event_time}`));
        const newEventsToSeed = mockMarketEvents
          .filter((e) => !existingKeys.has(`${e.event_name}_${e.event_time}`))
          .map(({ id, ...rest }) => rest);

        if (newEventsToSeed.length > 0) {
          await marketEventService.seedMarketEvents(newEventsToSeed);
        }
        const refreshed = await marketEventService.getMarketEvents();
        setMarketEvents(refreshed.data?.length ? refreshed.data : mockMarketEvents);
      }
    } catch (err) {
      console.error('Failed to load market events:', err);
      setMarketEvents(mockMarketEvents);
    } finally {
      setIsLoadingMarketEvents(false);
    }
  };

  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  const loadNotifications = async () => {
    setIsLoadingNotifications(true);
    try {
      const { notificationService } = await import('@/services/notificationService');
      const { data } = await notificationService.getNotifications();
      if (data && data.length > 0) {
        setNotifications(data);
      } else {
        // Fallback demo notifications for rich initial preview
        const initialSeed: AppNotification[] = [
          {
            id: 'notif_init_1',
            user_id: user?.id || 'demo_user',
            type: 'news_proximity',
            title: 'High-Impact Forex News',
            message: 'US Core CPI m/m & ECB Rate Decisions scheduled in upcoming trading session.',
            is_read: false,
            link_tab: 'market',
            created_at: new Date().toISOString(),
          },
          {
            id: 'notif_init_2',
            user_id: user?.id || 'demo_user',
            type: 'budget_warning',
            title: 'Monthly Cash Flow Target',
            message: 'Operational expenses at 64% of budget limit. Scaling buffer healthy.',
            is_read: false,
            link_tab: 'money',
            created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
          },
          {
            id: 'notif_init_3',
            user_id: user?.id || 'demo_user',
            type: 'psychology_pattern',
            title: 'Trading Discipline Note',
            message: 'Win rate 85% maintained over the last 15 trade setups. Solid risk execution.',
            is_read: true,
            link_tab: 'trading',
            created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
          },
        ];
        setNotifications(initialSeed);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const addNotification = async (notifData: Omit<AppNotification, 'id' | 'created_at' | 'user_id'>) => {
    try {
      const { notificationService } = await import('@/services/notificationService');
      const { data } = await notificationService.createNotification(notifData);
      if (data) {
        setNotifications((prev) => [data, ...prev]);
        return data;
      }
      return null;
    } catch (err) {
      console.error('Failed to add notification:', err);
      return null;
    }
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      const { notificationService } = await import('@/services/notificationService');
      await notificationService.markAsRead(id);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      if (user?.id) {
        const { notificationService } = await import('@/services/notificationService');
        await notificationService.markAllAsRead(user.id);
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      const { notificationService } = await import('@/services/notificationService');
      await notificationService.deleteNotification(id);
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.is_read).length;
  }, [notifications]);

  const [aiInsights] = useState<AIInsight[]>(mockAIInsights);

  // Modals
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isAddTradeOpen, setIsAddTradeOpen] = useState(false);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  const [selectedTradeForDetail, setSelectedTradeForDetail] = useState<Trade | null>(null);
  const [isSyncingMarket, setIsSyncingMarket] = useState(false);

  const toggleCurrency = () => {
    setDisplayCurrency((prev) => {
      const next = prev === 'USD' ? 'IDR' : 'USD';
      if (typeof window !== 'undefined') {
        localStorage.setItem('fynence_display_currency', next);
      }
      return next;
    });
  };

  // Helper for formatting
  const formatCurrency = (amount: number, currencyOverride?: Currency): string => {
    const targetCurrency = currencyOverride || displayCurrency;
    let convertedAmount = amount;

    if (currencyOverride === undefined) {
      // Amount is assumed in USD base if not specified
      if (targetCurrency === 'IDR') {
        convertedAmount = amount * USD_TO_IDR;
      }
    }

    if (targetCurrency === 'IDR') {
      return `Rp ${Math.round(convertedAmount).toLocaleString('id-ID')}`;
    }
    return `$${convertedAmount.toLocaleString('en-US', {
      minimumFractionDigits: Math.abs(convertedAmount % 1) > 0 ? 2 : 0,
      maximumFractionDigits: 2,
    })}`;
  };

  // Computed Financial Metrics
  const financialSummary = useMemo(() => {
    let totalNetWorthUSD = 0;
    let totalInitialBalanceUSD = 0;

    financialAccounts.forEach((acc) => {
      const isIDR = acc.currency === 'IDR';
      const current = Number(acc.current_balance) || 0;
      const initial = Number(acc.initial_balance) || 0;

      if (isIDR) {
        totalNetWorthUSD += current / USD_TO_IDR;
        totalInitialBalanceUSD += initial / USD_TO_IDR;
      } else {
        totalNetWorthUSD += current;
        totalInitialBalanceUSD += initial;
      }
    });

    let monthlyIncomeUSD = 0;
    let monthlyExpenseUSD = 0;

    transactions.forEach((tx) => {
      const txUSD = tx.currency === 'IDR' ? Number(tx.amount) / USD_TO_IDR : Number(tx.amount);
      if (tx.type === 'income') {
        monthlyIncomeUSD += txUSD;
      } else {
        monthlyExpenseUSD += txUSD;
      }
    });

    const netCashFlowUSD = monthlyIncomeUSD - monthlyExpenseUSD;
    const totalNetWorthIDR = totalNetWorthUSD * USD_TO_IDR;

    const netWorthGrowthPercent =
      totalInitialBalanceUSD > 0
        ? ((totalNetWorthUSD - totalInitialBalanceUSD) / totalInitialBalanceUSD) * 100
        : 0;

    const totalSavingsUSD = financialAccounts
      .filter((a) => a.account_type === 'savings' || a.account_type === 'investment')
      .reduce((acc, curr) => acc + (curr.currency === 'IDR' ? Number(curr.current_balance) / USD_TO_IDR : Number(curr.current_balance)), 0);

    return {
      totalNetWorthUSD,
      totalNetWorthIDR,
      totalInitialBalanceUSD,
      netWorthGrowthPercent,
      monthlyIncomeUSD,
      monthlyExpenseUSD,
      netCashFlowUSD,
      totalSavingsUSD,
    };
  }, [financialAccounts, transactions]);

  // Computed Trading Metrics
  const tradingSummary = useMemo(() => {
    return tradingService.calculateTradingSummary(trades);
  }, [trades]);


  // Action: Add Transaction
  const addTransaction = async (txData: Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    // 1. Generate client UUID for instant autosave
    const tempId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tx_${Date.now()}`;
    const optimisticTx: Transaction = {
      ...txData,
      id: tempId,
      user_id: user?.id || 'usr_current',
    };

    // 2. Optimistically push to state immediately
    setTransactions((prev) => [optimisticTx, ...prev]);

    // 3. Immediate local balance update
    const targetAcc = financialAccounts.find((a) => a.id === txData.account_id);
    if (targetAcc) {
      const modifier = txData.type === 'income' ? 1 : -1;
      let txAmountInAccountCurrency = Number(txData.amount);
      if (txData.currency === 'USD' && targetAcc.currency === 'IDR') {
        txAmountInAccountCurrency = Number(txData.amount) * USD_TO_IDR;
      } else if (txData.currency === 'IDR' && targetAcc.currency === 'USD') {
        txAmountInAccountCurrency = Number(txData.amount) / USD_TO_IDR;
      }

      const newBalance = Number(targetAcc.current_balance) + txAmountInAccountCurrency * modifier;

      setFinancialAccounts((prev) =>
        prev.map((acc) =>
          acc.id === targetAcc.id ? { ...acc, current_balance: newBalance } : acc
        )
      );

      const isAccUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetAcc.id);
      if (isAccUUID) {
        import('@/services/financialAccountService').then(({ financialAccountService }) => {
          financialAccountService.updateAccount(targetAcc.id, { current_balance: newBalance }).catch(console.error);
        });
      }
    }

    // 4. Budget envelope check
    if (txData.type === 'expense') {
      const matchingBudget = budgets.find((b) => b.category_id === txData.category_id);
      if (matchingBudget) {
        const newSpent = Number(matchingBudget.spent) + Number(txData.amount);
        updateBudget(matchingBudget.id, { spent: newSpent });

        const ratio = matchingBudget.amount > 0 ? newSpent / matchingBudget.amount : 0;
        if (ratio >= 0.85) {
          addNotification({
            type: 'budget_warning',
            title: `Budget Alert: ${matchingBudget.category_name}`,
            message: `You've used ${(ratio * 100).toFixed(0)}% ($${newSpent.toFixed(0)} / $${matchingBudget.amount.toFixed(0)}) of your monthly envelope for ${matchingBudget.category_name}.`,
            is_read: false,
            link_tab: 'money',
          });
        }
      }
    }

    // 5. Persist to database via transactionService (which uses Server Action first)
    try {
      const { transactionService } = await import('@/services/transactionService');
      const payload = {
        ...txData,
        ...(user?.id ? { user_id: user.id } : {}),
      };
      const { data, error } = await transactionService.createTransaction(payload as any);
      if (data) {
        setTransactions((prev) => prev.map((tx) => (tx.id === tempId ? data : tx)));
      } else if (error) {
        console.warn('Transaction persisted locally, DB sync error:', error.message);
      }
    } catch (err) {
      console.error('Autosave transaction background error:', err);
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    // Optimistically update in state immediately
    setTransactions((prev) => prev.map((tx) => (tx.id === id ? { ...tx, ...updates } : tx)));

    try {
      const { transactionService } = await import('@/services/transactionService');
      const { data, error } = await transactionService.updateTransaction(id, updates);
      if (data) {
        setTransactions((prev) => prev.map((tx) => (tx.id === id ? { ...tx, ...data } : tx)));
      }
    } catch (err) {
      console.error('Autosave updateTransaction error:', err);
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const txToDelete = transactions.find((t) => t.id === id);
      
      // 1. Optimistically remove from state immediately
      setTransactions((prev) => prev.filter((t) => t.id !== id));

      // 2. Persist deleted ID in localStorage so it never reappears on refresh
      if (typeof window !== 'undefined') {
        const userKey = user?.id || 'demo';
        const delKey = `fynence_deleted_txs_${userKey}`;
        try {
          const existing: string[] = JSON.parse(localStorage.getItem(delKey) || '[]');
          if (!existing.includes(id)) {
            localStorage.setItem(delKey, JSON.stringify([...existing, id]));
          }
          if (user?.id) {
            localStorage.setItem(`fynence_seeded_txs_${user.id}`, 'true');
          }
        } catch (e) {
          console.error(e);
        }
      }
      
      if (txToDelete) {
        // Reverse balance impact and persist to DB & state
        const targetAcc = financialAccounts.find((a) => a.id === txToDelete.account_id);
        if (targetAcc) {
          const modifier = txToDelete.type === 'income' ? -1 : 1; // Reverse effect
          let txAmountInAccountCurrency = Number(txToDelete.amount);
          if (txToDelete.currency === 'USD' && targetAcc.currency === 'IDR') {
            txAmountInAccountCurrency = Number(txToDelete.amount) * USD_TO_IDR;
          } else if (txToDelete.currency === 'IDR' && targetAcc.currency === 'USD') {
            txAmountInAccountCurrency = Number(txToDelete.amount) / USD_TO_IDR;
          }

          const newBalance = Number(targetAcc.current_balance) + txAmountInAccountCurrency * modifier;

          setFinancialAccounts((prev) =>
            prev.map((acc) =>
              acc.id === targetAcc.id ? { ...acc, current_balance: newBalance } : acc
            )
          );

          const isAccUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetAcc.id);
          if (isAccUUID) {
            const { financialAccountService } = await import('@/services/financialAccountService');
            financialAccountService.updateAccount(targetAcc.id, {
              current_balance: newBalance,
            }).catch(console.error);
          }
        }
      }

      // Check if real database UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (!isUUID) {
        return; // local or mock transaction removed from state & recorded in deleted list
      }

      // Delete from DB via server action and client SDK fallback
      const { deleteTransactionAction } = await import('@/app/actions');
      const actionRes = await deleteTransactionAction(id);
      if (!actionRes?.success) {
        const { transactionService } = await import('@/services/transactionService');
        await transactionService.deleteTransaction(id);
      }
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    }
  };

  // Action: Add Trade
  const addTrade = async (tradeData: Omit<Trade, 'id' | 'user_id'>) => {
    // 1. Generate client UUID for instant autosave
    const tempId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tr_${Date.now()}`;
    const correlated = detectNewsCorrelation(tradeData.symbol, tradeData.entry_time, marketEvents);

    const payload = {
      ...tradeData,
      ...(correlated ? { correlated_news: correlated } : {}),
      user_id: user?.id || 'usr_current',
    };

    const optimisticTrade: Trade = {
      ...payload,
      id: tempId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 2. Optimistically push to state immediately
    setTrades((prev) => [optimisticTrade, ...prev]);
    setIsAddTradeOpen(false);

    // 3. Trigger news proximity alert if within high impact news window (PRD #32)
    if (correlated) {
      addNotification({
        type: 'news_proximity',
        title: `News Proximity Alert: ${tradeData.symbol}`,
        message: `Trade on ${tradeData.symbol} was opened within ${correlated.time_diff_minutes}m of "${correlated.event_name}" (${correlated.currency}). High volatility risk recorded.`,
        is_read: false,
        link_tab: 'trading',
      });
    }

    // 4. Drawdown risk alert check (PRD #32)
    if (tradeData.net_profit_loss < 0 && Math.abs(tradeData.net_profit_loss) >= 500) {
      addNotification({
        type: 'drawdown_alert',
        title: `Drawdown Alert: Loss on ${tradeData.symbol}`,
        message: `Realized loss of -$${Math.abs(tradeData.net_profit_loss).toFixed(0)} on ${tradeData.symbol}. Ensure risk limit per trade stays within plan.`,
        is_read: false,
        link_tab: 'trading',
      });
    }

    // 5. Update trading account balance immediately
    if (tradeData.trading_account_id) {
      const targetAcc = tradingAccounts.find((a) => a.id === tradeData.trading_account_id);
      if (targetAcc) {
        const newBal = (Number(targetAcc.current_balance) || 0) + Number(tradeData.net_profit_loss);
        const newEq = (Number(targetAcc.current_equity ?? targetAcc.current_balance) || 0) + Number(tradeData.net_profit_loss);
        const { tradingAccountService } = await import('@/services/tradingAccountService');
        tradingAccountService.updateAccount(targetAcc.id, {
          current_balance: newBal,
          current_equity: newEq,
        }).catch(console.error);

        setTradingAccounts((prev) =>
          prev.map((acc) =>
            acc.id === targetAcc.id
              ? { ...acc, current_balance: newBal, current_equity: newEq }
              : acc
          )
        );
      }
    }

    // 6. Persist to database via tradeService (uses Server Action first)
    try {
      const { tradeService } = await import('@/services/tradeService');
      const { data, error } = await tradeService.createTrade(payload as any);
      if (data) {
        setTrades((prev) => prev.map((t) => (t.id === tempId ? data : t)));

        // Persist to trade_psychology table
        if (tradeData.psychology) {
          try {
            const { psychologyService } = await import('@/services/psychology');
            await psychologyService.saveTradePsychology({
              ...tradeData.psychology,
              trade_id: data.id,
              user_id: user?.id,
            });
          } catch (pErr) {
            console.error('Failed to sync to trade_psychology table', pErr);
          }
        }

        // Persist to trade_screenshots table (PRD Section 16)
        if (Array.isArray(tradeData.screenshots) && tradeData.screenshots.length > 0) {
          try {
            const { tradeScreenshotService } = await import('@/services/trading/tradeScreenshotService');
            for (const sc of tradeData.screenshots) {
              await tradeScreenshotService.saveTradeScreenshot({
                trade_id: data.id,
                user_id: user?.id || '',
                file_path: sc.file_path,
                image_type: sc.image_type || 'before',
              });
            }
          } catch (scErr) {
            console.error('Failed to sync to trade_screenshots table', scErr);
          }
        } else if (tradeData.screenshot_url) {
          try {
            const { tradeScreenshotService } = await import('@/services/trading/tradeScreenshotService');
            await tradeScreenshotService.saveTradeScreenshot({
              trade_id: data.id,
              user_id: user?.id || '',
              file_path: tradeData.screenshot_url,
              image_type: 'before',
            });
          } catch (scErr) {
            console.error('Failed to sync fallback screenshot to trade_screenshots table', scErr);
          }
        }
      } else if (error) {
        console.warn('Trade persisted locally, DB sync error:', error.message);
      }
    } catch (err) {
      console.error('Autosave trade background error:', err);
    }
  };

  const updateTrade = async (id: string, updates: Partial<Trade>) => {
    // Optimistically update in state immediately
    setTrades((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    setSelectedTradeForDetail((prev) => (prev && prev.id === id ? { ...prev, ...updates } : prev));

    try {
      const { tradeService } = await import('@/services/tradeService');
      const { data, error } = await tradeService.updateTrade(id, updates);
      if (data) {
        setTrades((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
        setSelectedTradeForDetail((prev) => (prev && prev.id === id ? { ...prev, ...data } : prev));

        if (updates.psychology) {
          try {
            const { psychologyService } = await import('@/services/psychology');
            await psychologyService.saveTradePsychology({
              ...updates.psychology,
              trade_id: id,
              user_id: user?.id,
            });
          } catch (pErr) {
            console.error('Failed to update trade_psychology table', pErr);
          }
        }
      }
    } catch (err) {
      console.error('Autosave updateTrade error:', err);
    }
  };

  const deleteTrade = async (id: string) => {
    try {
      const tradeToDelete = trades.find((t) => t.id === id);

      // 1. Optimistically remove from state immediately so UI updates instantly
      setTrades((prev) => prev.filter((t) => t.id !== id));

      // 2. Persist to deleted IDs set in localStorage
      if (typeof window !== 'undefined') {
        const userKey = user?.id || 'demo';
        const delKey = `fynence_deleted_trades_${userKey}`;
        try {
          const existing: string[] = JSON.parse(localStorage.getItem(delKey) || '[]');
          if (!existing.includes(id)) {
            localStorage.setItem(delKey, JSON.stringify([...existing, id]));
          }
          if (user?.id) {
            localStorage.setItem(`fynence_seeded_trades_${user.id}`, 'true');
          }
        } catch (e) {
          console.error(e);
        }
      }

      if (tradeToDelete && tradeToDelete.trading_account_id) {
        // Reverse trading account balance in state & database
        const targetAcc = tradingAccounts.find((a) => a.id === tradeToDelete.trading_account_id);
        if (targetAcc) {
          const newBal = (Number(targetAcc.current_balance) || 0) - Number(tradeToDelete.net_profit_loss);
          const newEq = (Number(targetAcc.current_equity ?? targetAcc.current_balance) || 0) - Number(tradeToDelete.net_profit_loss);
          const { tradingAccountService } = await import('@/services/tradingAccountService');
          tradingAccountService.updateAccount(targetAcc.id, {
            current_balance: newBal,
            current_equity: newEq,
          }).catch(console.error);

          setTradingAccounts((prev) =>
            prev.map((acc) =>
              acc.id === tradeToDelete.trading_account_id
                ? { ...acc, current_balance: newBal, current_equity: newEq }
                : acc
            )
          );
        }
      }

      // Check if real database UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (!isUUID) {
        return; // local or mock trade removed from state & recorded in deleted list
      }

      // Try server action first (has server cookie access)
      const { deleteTradeAction } = await import('@/app/actions');
      const actionRes = await deleteTradeAction(id);
      if (!actionRes?.success) {
        // Fallback to tradeService
        const { tradeService } = await import('@/services/tradeService');
        await tradeService.deleteTrade(id);
      }
    } catch (err) {
      console.error('Failed to delete trade:', err);
    }
  };

  // Action: Add Financial Account
  const addFinancialAccount = async (accData: Omit<FinancialAccount, 'id' | 'user_id'>): Promise<FinancialAccount | null> => {
    const tempId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `facc_${Date.now()}`;
    const optimisticAccount: FinancialAccount = {
      ...accData,
      id: tempId,
      user_id: user?.id || '',
    };

    setFinancialAccounts((prev) => [optimisticAccount, ...prev]);

    if (typeof window !== 'undefined' && user?.id) {
      localStorage.setItem(`fynence_seeded_financial_accounts_${user.id}`, 'true');
    }

    try {
      const { financialAccountService } = await import('@/services/financialAccountService');
      const { data, error } = await financialAccountService.createAccount(accData);
      if (error) {
        console.error('Failed to create financial account in DB', error);
        return optimisticAccount;
      }
      if (data) {
        setFinancialAccounts((prev) => prev.map((a) => (a.id === tempId ? data : a)));
        return data;
      }
      return optimisticAccount;
    } catch (err) {
      console.error(err);
      return optimisticAccount;
    }
  };

  const updateFinancialAccount = async (id: string, updates: Partial<FinancialAccount>) => {
    // Sinkronisasi lokal instan agar UI (Overview, Money, Accounts) langsung update tanpa jeda
    setFinancialAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
    try {
      const { financialAccountService } = await import('@/services/financialAccountService');
      const { data, error } = await financialAccountService.updateAccount(id, updates);
      if (error) {
        console.error('Failed to update financial account in backend', error);
        return;
      }
      if (data) {
        setFinancialAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteFinancialAccount = async (id: string) => {
    try {
      // 1. Instant optimistic state update
      setFinancialAccounts((prev) => prev.filter((a) => a.id !== id));

      // 2. Persist to local suppression list
      if (typeof window !== 'undefined') {
        const userKey = user?.id || 'demo';
        const delKey = `fynence_deleted_financial_accounts_${userKey}`;
        try {
          const stored: string[] = JSON.parse(localStorage.getItem(delKey) || '[]');
          if (!stored.includes(id)) {
            stored.push(id);
            localStorage.setItem(delKey, JSON.stringify(stored));
          }
          if (user?.id) {
            localStorage.setItem(`fynence_seeded_financial_accounts_${user.id}`, 'true');
          }
        } catch (e) {
          console.error(e);
        }
      }

      // 3. Delete from DB via server action with client SDK fallback
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (isUUID) {
        const { deleteFinancialAccountAction } = await import('@/app/actions');
        const actionRes = await deleteFinancialAccountAction(id);
        if (!actionRes?.success) {
          const { financialAccountService } = await import('@/services/financialAccountService');
          await financialAccountService.deleteAccount(id);
        }
      }
    } catch (err) {
      console.error('Failed to delete financial account:', err);
    }
  };

  // Action: Add Trading Account
  const addTradingAccount = async (accData: Omit<TradingAccount, 'id' | 'user_id'>): Promise<TradingAccount | null> => {
    const tempId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tacc_${Date.now()}`;
    const optimisticAccount: TradingAccount = {
      ...accData,
      id: tempId,
      user_id: user?.id || '',
    };

    setTradingAccounts((prev) => [optimisticAccount, ...prev]);

    if (typeof window !== 'undefined' && user?.id) {
      localStorage.setItem(`fynence_seeded_trading_accounts_${user.id}`, 'true');
    }

    try {
      const { tradingAccountService } = await import('@/services/tradingAccountService');
      const { data, error } = await tradingAccountService.createAccount(accData);
      if (error || !data) {
        console.error('Failed to create trading account in DB', error);
        setTradingAccounts((prev) => prev.filter((a) => a.id !== tempId));
        addNotification({
          type: 'drawdown_alert',
          title: 'Gagal Menambah Akun Trading',
          message: error?.message || 'Gagal menyimpan akun trading ke server.',
        });
        return null;
      }
      setTradingAccounts((prev) => prev.map((a) => (a.id === tempId ? data : a)));
      return data;
    } catch (err) {
      console.error(err);
      setTradingAccounts((prev) => prev.filter((a) => a.id !== tempId));
      addNotification({
        type: 'drawdown_alert',
        title: 'Gagal Menambah Akun Trading',
        message: err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan akun.',
      });
      return null;
    }
  };

  const updateTradingAccount = async (id: string, updates: Partial<TradingAccount>) => {
    setTradingAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
    try {
      const { tradingAccountService } = await import('@/services/tradingAccountService');
      const { data, error } = await tradingAccountService.updateAccount(id, updates);
      if (error) {
        console.error('Failed to update trading account in DB', error);
        return;
      }
      if (data) {
        setTradingAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTradingAccount = async (id: string) => {
    try {
      // 1. Instant optimistic state update
      setTradingAccounts((prev) => prev.filter((a) => a.id !== id));

      // 2. Persist to local suppression list
      if (typeof window !== 'undefined') {
        const userKey = user?.id || 'demo';
        const delKey = `fynence_deleted_trading_accounts_${userKey}`;
        try {
          const stored: string[] = JSON.parse(localStorage.getItem(delKey) || '[]');
          if (!stored.includes(id)) {
            stored.push(id);
            localStorage.setItem(delKey, JSON.stringify(stored));
          }
          if (user?.id) {
            localStorage.setItem(`fynence_seeded_trading_accounts_${user.id}`, 'true');
          }
        } catch (e) {
          console.error(e);
        }
      }

      // 3. Delete from DB via server action with client SDK fallback
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (isUUID) {
        const { deleteTradingAccountAction } = await import('@/app/actions');
        const actionRes = await deleteTradingAccountAction(id);
        if (!actionRes?.success) {
          const { tradingAccountService } = await import('@/services/tradingAccountService');
          await tradingAccountService.deleteAccount(id);
        }
      }
    } catch (err) {
      console.error('Failed to delete trading account:', err);
    }
  };

  // Action: Add Strategy
  const addStrategy = async (stratData: Omit<Strategy, 'id' | 'user_id'>): Promise<Strategy | null> => {
    const tempId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `strat_${Date.now()}`;
    const optimisticStrategy: Strategy = {
      ...stratData,
      id: tempId,
      user_id: user?.id || '',
    };

    setStrategies((prev) => [optimisticStrategy, ...prev]);

    if (typeof window !== 'undefined' && user?.id) {
      localStorage.setItem(`fynence_seeded_strategies_${user.id}`, 'true');
    }

    try {
      const { strategyService } = await import('@/services/strategyService');
      const { data, error } = await strategyService.createStrategy(stratData);
      if (error) {
        console.error('Failed to create strategy in DB', error);
        return optimisticStrategy;
      }
      if (data) {
        setStrategies((prev) => prev.map((s) => (s.id === tempId ? data : s)));
        return data;
      }
      return optimisticStrategy;
    } catch (err) {
      console.error(err);
      return optimisticStrategy;
    }
  };

  const updateStrategy = async (id: string, updates: Partial<Strategy>) => {
    setStrategies((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    try {
      const { strategyService } = await import('@/services/strategyService');
      const { data, error } = await strategyService.updateStrategy(id, updates);
      if (error) {
        console.error('Failed to update strategy', error);
        return;
      }
      if (data) {
        setStrategies((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteStrategy = async (id: string) => {
    try {
      setStrategies((prev) => prev.filter((s) => s.id !== id));
      if (typeof window !== 'undefined') {
        const userKey = user?.id || 'demo';
        const delKey = `fynence_deleted_strategies_${userKey}`;
        try {
          const stored: string[] = JSON.parse(localStorage.getItem(delKey) || '[]');
          if (!stored.includes(id)) {
            stored.push(id);
            localStorage.setItem(delKey, JSON.stringify(stored));
          }
          if (user?.id) {
            localStorage.setItem(`fynence_seeded_strategies_${user.id}`, 'true');
          }
        } catch (e) {
          console.error(e);
        }
      }

      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (isUUID) {
        const { strategyService } = await import('@/services/strategyService');
        await strategyService.deleteStrategy(id);
      }
    } catch (err) {
      console.error('Failed to delete strategy:', err);
    }
  };

  // Action: Add Budget
  const addBudget = async (bData: Omit<Budget, 'id' | 'user_id'>): Promise<Budget | null> => {
    try {
      const { budgetService } = await import('@/services/budgetService');
      const { data, error } = await budgetService.createBudget(bData);
      if (error) {
        console.error('Failed to create budget', error);
        return null;
      }
      if (data) {
        setBudgets((prev) => [data, ...prev]);
        return data;
      }
      return null;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    try {
      const { budgetService } = await import('@/services/budgetService');
      const { data, error } = await budgetService.updateBudget(id, updates);
      if (error) {
        console.error('Failed to update budget', error);
        return;
      }
      if (data) {
        setBudgets((prev) => prev.map((b) => (b.id === id ? { ...b, ...data } : b)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteBudget = async (id: string) => {
    try {
      setBudgets((prev) => prev.filter((b) => b.id !== id));
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (isUUID) {
        const { budgetService } = await import('@/services/budgetService');
        await budgetService.deleteBudget(id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Action: Add Financial Goal
  const addGoal = async (goalData: Omit<FinancialGoal, 'id' | 'user_id'>): Promise<FinancialGoal | null> => {
    try {
      const { goalService } = await import('@/services/goalService');
      const { data, error } = await goalService.createGoal(goalData);
      if (error) {
        console.error('Failed to create goal', error);
        return null;
      }
      if (data) {
        setGoals((prev) => [data, ...prev]);
        return data;
      }
      return null;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const updateGoal = async (id: string, updates: Partial<FinancialGoal>) => {
    try {
      const { goalService } = await import('@/services/goalService');
      const { data, error } = await goalService.updateGoal(id, updates);
      if (error) {
        console.error('Failed to update goal', error);
        return;
      }
      if (data) {
        setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...data } : g)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      setGoals((prev) => prev.filter((g) => g.id !== id));
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (isUUID) {
        const { goalService } = await import('@/services/goalService');
        await goalService.deleteGoal(id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // MT5 Account Syncing State & Action
  const [syncingAccountIds, setSyncingAccountIds] = useState<Record<string, boolean>>({});

  const syncMT5Account = async (accountId: string) => {
    setSyncingAccountIds((prev) => ({ ...prev, [accountId]: true }));
    try {
      const { syncMT5AccountAction } = await import('@/app/actions');
      const res = await syncMT5AccountAction(accountId);
      if (res && res.success) {
        const syncedCount = 'syncedTradesCount' in res ? Number((res as any).syncedTradesCount) : 0;
        const newCount = 'newTradesCount' in res ? Number((res as any).newTradesCount) : 0;
        await Promise.all([loadTradingAccounts(), loadTrades()]);
        addNotification({
          type: 'info',
          title: 'MT5 Synchronized',
          message: `Synchronized ${syncedCount} trades (${newCount} new) from MT5.`,
        });
        return { success: true, newTradesCount: newCount };
      } else {
        const errorMsg = (res && 'error' in res && res.error) ? res.error : 'Failed to sync MT5 account.';
        setTradingAccounts((prev) =>
          prev.map((a) =>
            a.id === accountId
              ? { ...a, connection_status: 'error', sync_error: errorMsg }
              : a
          )
        );
        addNotification({
          type: 'drawdown_alert',
          title: 'MT5 Sync Warning',
          message: errorMsg,
        });
        await loadTradingAccounts();
        return { success: false, error: errorMsg };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sync failed';
      setTradingAccounts((prev) =>
        prev.map((a) =>
          a.id === accountId
            ? { ...a, connection_status: 'error', sync_error: msg }
            : a
        )
      );
      return { success: false, error: msg };
    } finally {
      setSyncingAccountIds((prev) => ({ ...prev, [accountId]: false }));
    }
  };

  const getSyncHistory = async (accountId: string) => {
    try {
      const { getMT5SyncHistoryAction } = await import('@/app/actions');
      const res = await getMT5SyncHistoryAction(accountId);
      return { data: (res.data || []) as TradeSyncRecord[], error: res.error || null };
    } catch (err: unknown) {
      return { data: [], error: err instanceof Error ? err.message : 'Failed to fetch history' };
    }
  };

  const registerMT5Connector = async (
    accountId: string,
    options?: { connectorType?: 'builtin' | 'metaapi' | 'ea'; customServer?: string; customLogin?: string }
  ) => {
    try {
      const { registerMT5ConnectorAction } = await import('@/app/actions');
      const res = await registerMT5ConnectorAction(accountId, options);
      if (res.success) {
        await loadTradingAccounts();
      }
      return res;
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Registration failed' };
    }
  };

  // Action: Forex Factory Economic Calendar Sync
  const syncMarketData = async (
    optionsOrPeriod:
      | 'today'
      | 'tomorrow'
      | 'this_week'
      | 'previous_week'
      | 'custom'
      | {
          period?: 'today' | 'tomorrow' | 'this_week' | 'previous_week' | 'custom';
          startDate?: string;
          endDate?: string;
          provider?: string;
        } = 'this_week'
  ) => {
    setIsSyncingMarket(true);
    try {
      const { syncForexCalendarAction } = await import('@/app/actions');
      const res = await syncForexCalendarAction(optionsOrPeriod);
      if (res.success) {
        await loadMarketEvents();
        addNotification({
          type: 'info',
          title: 'Forex Calendar Synchronized',
          message: `Economic events updated (${res.newCount} new events recorded).`,
        });
      } else {
        addNotification({
          type: 'system',
          title: 'Forex Calendar Sync Notice',
          message: res.error || 'Active calendar schedule loaded.',
        });
      }
    } catch (err) {
      console.error('Calendar sync error:', err);
    } finally {
      setIsSyncingMarket(false);
    }
  };

  // Action: Update User Profile
  const updateUserProfile = async (updates: { display_name?: string; avatar_url?: string; timezone?: string }) => {
    try {
      // 1. Immediately apply to local state and persistent storage
      if (updates.timezone) {
        setTimezoneState(updates.timezone);
        setStoredTimezone(updates.timezone);
      }

      setUser((prev) => {
        if (!prev) return null;
        const updated = {
          ...prev,
          display_name: updates.display_name ?? prev.display_name,
          avatar_url: updates.avatar_url ?? prev.avatar_url,
          timezone: updates.timezone ?? prev.timezone,
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem('fynence_user_profile', JSON.stringify(updated));
        }
        return updated;
      });

      // 2. Synchronize with server if authenticated
      const { updateProfileAction } = await import('@/app/actions');
      const res = await updateProfileAction({
        name: updates.display_name,
        avatar_url: updates.avatar_url,
        timezone: updates.timezone,
      });

      if (res.error) {
        console.warn('Backend profile sync note (local profile preserved):', res.error);
      }

      return { success: true };
    } catch (err: unknown) {
      console.warn('Update profile server sync note (local profile preserved):', err);
      return { success: true };
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser: setSessionUser,
        isLoadingAuth,
        logout,
        activeTab,
        setActiveTab: handleSetActiveTab,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        toggleSidebar,
        moneySubTab,
        setMoneySubTab,
        tradingSubTab,
        setTradingSubTab,
        aiSubTab,
        setAiSubTab,
        displayCurrency,
        toggleCurrency,
        setDisplayCurrency,
        categories,
        financialAccounts,
        isLoadingFinancialAccounts,
        financialAccountsError,
        loadFinancialAccounts,
        addFinancialAccount,
        updateFinancialAccount,
        deleteFinancialAccount,
        tradingAccounts,
        isLoadingTradingAccounts,
        tradingAccountsError,
        loadTradingAccounts,
        addTradingAccount,
        updateTradingAccount,
        deleteTradingAccount,
        syncMT5Account,
        getSyncHistory,
        registerMT5Connector,
        syncingAccountIds,
        transactions,
        trades,
        isLoadingTrades,
        tradesError,
        loadTrades,
        isLoadingTransactions,
        transactionsError,
        strategies,
        isLoadingStrategies,
        strategiesError,
        loadStrategies,
        addStrategy,
        updateStrategy,
        deleteStrategy,
        budgets,
        isLoadingBudgets,
        budgetsError,
        loadBudgets,
        addBudget,
        updateBudget,
        deleteBudget,
        goals,
        isLoadingGoals,
        goalsError,
        loadGoals,
        addGoal,
        updateGoal,
        deleteGoal,
        marketEvents,
        isLoadingMarketEvents,
        loadMarketEvents,
        aiInsights,
        notifications,
        isLoadingNotifications,
        unreadNotificationsCount,
        loadNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        addNotification,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addTrade,
        updateTrade,
        deleteTrade,
        syncMarketData,
        isSyncingMarket,
        isAddTransactionOpen,
        setIsAddTransactionOpen,
        isAddTradeOpen,
        setIsAddTradeOpen,
        selectedTradeForDetail,
        setSelectedTradeForDetail,
        isProfileSettingsOpen,
        setIsProfileSettingsOpen,
        profileSettingsTab,
        setProfileSettingsTab,
        openProfileSettings,
        timezone,
        setTimezone,
        updateUserProfile,
        financialSummary,
        tradingSummary,
        formatCurrency,
        theme,
        setTheme,
        resolvedTheme,
        toggleTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
