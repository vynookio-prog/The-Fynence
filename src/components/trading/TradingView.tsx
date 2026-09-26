'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import {
  TrendingUp,
  TrendingDown,
  BookOpen,
  LineChart,
  Brain,
  ShieldCheck,
  PieChart,
  Plus,
  Filter,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronRight,
  Eye,
  Sliders,
  DollarSign,
  Activity,
  RefreshCw,
  Trash2,
  Building2,
  CreditCard,
  X,
  Server,
  Link2,
  Edit2,
  Clock,
  Download,
  Copy,
  Check,
  Sparkles,
  Bot,
} from 'lucide-react';
import { Trade, TradingAccount, TradingAccountType, Currency, TradeSyncRecord } from '@/types';
import { psychologyService } from '@/services/psychology';


export const TradingView: React.FC = () => {
  const {
    tradingSubTab,
    setTradingSubTab,
    trades,
    isLoadingTrades,
    tradesError,
    tradingAccounts,
    isLoadingTradingAccounts,
    addTradingAccount,
    updateTradingAccount,
    deleteTradingAccount,
    syncMT5Account,
    getSyncHistory,
    registerMT5Connector,
    syncingAccountIds,
    strategies,
    isLoadingStrategies,
    addStrategy,
    deleteStrategy,
    tradingSummary,
    deleteTrade,
    setIsAddTradeOpen,
    setSelectedTradeForDetail,
    formatCurrency,
  } = useApp();

  const [symbolFilter, setSymbolFilter] = useState<string>('all');
  const [directionFilter, setDirectionFilter] = useState<'all' | 'buy' | 'sell'>('all');
  const [strategyFilter, setStrategyFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'mt5' | 'manual'>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [resultFilter, setResultFilter] = useState<'all' | 'win' | 'loss' | 'breakeven'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7d' | '30d'>('all');

  // Modal State: Edit Trading Account
  const [isEditTradingAccOpen, setIsEditTradingAccOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<TradingAccount | null>(null);
  const [editTrName, setEditTrName] = useState('');
  const [editTrBroker, setEditTrBroker] = useState('');
  const [editTrType, setEditTrType] = useState<TradingAccountType>('prop');
  const [editTrCurrency, setEditTrCurrency] = useState<Currency>('USD');
  const [editTrInitBal, setEditTrInitBal] = useState('');
  const [editTrCurrentBal, setEditTrCurrentBal] = useState('');
  const [editTrCurrentEq, setEditTrCurrentEq] = useState('');
  const [editTrProfitTarget, setEditTrProfitTarget] = useState('');
  const [editTrDrawdownLimit, setEditTrDrawdownLimit] = useState('');
  const [isSubmittingEditTrAcc, setIsSubmittingEditTrAcc] = useState(false);

  // Modal State: View Account Details
  const [selectedAccountForDetail, setSelectedAccountForDetail] = useState<TradingAccount | null>(null);

  const handleOpenEditAccount = (acc: TradingAccount) => {
    setAccountToEdit(acc);
    setEditTrName(acc.name);
    setEditTrBroker(acc.broker);
    setEditTrType(acc.account_type);
    setEditTrCurrency(acc.currency);
    setEditTrInitBal(acc.initial_balance?.toString() || '100000');
    setEditTrCurrentBal(acc.current_balance?.toString() || '100000');
    setEditTrCurrentEq((acc.current_equity ?? acc.current_balance)?.toString() || '100000');
    setEditTrProfitTarget(acc.profit_target?.toString() || '');
    setEditTrDrawdownLimit(acc.max_drawdown_limit?.toString() || '');
    setIsEditTradingAccOpen(true);
  };

  // Modal State: Add Trading Account
  const [isAddTradingAccOpen, setIsAddTradingAccOpen] = useState(false);
  const [trName, setTrName] = useState('');
  const [trBroker, setTrBroker] = useState('');
  const [trType, setTrType] = useState<TradingAccountType>('prop');
  const [trCurrency, setTrCurrency] = useState<Currency>('USD');
  const [trInitBal, setTrInitBal] = useState('');
  const [trProfitTarget, setTrProfitTarget] = useState('');
  const [trDrawdownLimit, setTrDrawdownLimit] = useState('');
  const [trIsMT5, setTrIsMT5] = useState(true);
  const [trMt5Login, setTrMt5Login] = useState('');
  const [trMt5Server, setTrMt5Server] = useState('');
  const [trInvestorPassword, setTrInvestorPassword] = useState('');
  const [trConnectorMode, setTrConnectorMode] = useState<'investor' | 'ea'>('investor');
  const [trEaToken, setTrEaToken] = useState('');
  const [isSubmittingTrAcc, setIsSubmittingTrAcc] = useState(false);

  // Gemini AI Trading Assistant State
  const [isGeneratingCoach, setIsGeneratingCoach] = useState(false);
  const [psychologyCoachOutput, setPsychologyCoachOutput] = useState<string | null>(null);
  const [coachError, setCoachError] = useState<string | null>(null);

  const [isGeneratingDailySummary, setIsGeneratingDailySummary] = useState(false);
  const [dailySummaryOutput, setDailySummaryOutput] = useState<string | null>(null);
  const [dailySummaryTitle, setDailySummaryTitle] = useState<string>('');
  const [dailySummaryError, setDailySummaryError] = useState<string | null>(null);
  const [isDailySummaryModalOpen, setIsDailySummaryModalOpen] = useState(false);

  const handleRequestPsychologyCoach = async () => {
    setIsGeneratingCoach(true);
    setCoachError(null);
    try {
      const { analyzePsychologyAction } = await import('@/app/actions');
      const res = await analyzePsychologyAction();
      if (res.success && res.data) {
        setPsychologyCoachOutput(res.data.coachingText);
      } else {
        setCoachError(res.error || 'Gagal menghasilkan debrief psikologi.');
      }
    } catch (err: unknown) {
      setCoachError(err instanceof Error ? err.message : 'Error connecting to AI coach');
    } finally {
      setIsGeneratingCoach(false);
    }
  };

  const handleRequestDailySummary = async () => {
    setIsGeneratingDailySummary(true);
    setDailySummaryError(null);
    setIsDailySummaryModalOpen(true);
    try {
      const { generateDailyTradingSummaryAction } = await import('@/app/actions');
      const res = await generateDailyTradingSummaryAction();
      if (res.success && res.data) {
        setDailySummaryOutput(res.data.summaryText);
        setDailySummaryTitle(res.data.insight.title);
      } else {
        setDailySummaryError(res.error || 'Gagal menghasilkan rekap trading harian.');
      }
    } catch (err: unknown) {
      setDailySummaryError(err instanceof Error ? err.message : 'Error generating daily summary');
    } finally {
      setIsGeneratingDailySummary(false);
    }
  };

  // Modal State: Sync History Modal
  const [syncHistoryAccount, setSyncHistoryAccount] = useState<TradingAccount | null>(null);
  const [syncHistoryRecords, setSyncHistoryRecords] = useState<TradeSyncRecord[]>([]);
  const [isLoadingSyncHistory, setIsLoadingSyncHistory] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const handleOpenSyncHistory = async (acc: TradingAccount) => {
    setSyncHistoryAccount(acc);
    setIsLoadingSyncHistory(true);
    try {
      const { data } = await getSyncHistory(acc.id);
      setSyncHistoryRecords(data || []);
    } catch {
      setSyncHistoryRecords([]);
    } finally {
      setIsLoadingSyncHistory(false);
    }
  };

  // Modal State: Add Strategy
  const [isAddStrategyOpen, setIsAddStrategyOpen] = useState(false);
  const [stratName, setStratName] = useState('');
  const [stratDesc, setStratDesc] = useState('');
  const [stratRulesInput, setStratRulesInput] = useState('');
  const [isSubmittingStrat, setIsSubmittingStrat] = useState(false);

  // Filtered trades
  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      const matchesSymbol = symbolFilter === 'all' || t.symbol === symbolFilter;
      const matchesDirection = directionFilter === 'all' || t.direction === directionFilter;
      const matchesStrat = strategyFilter === 'all' || t.strategy_id === strategyFilter;
      const matchesSource =
        sourceFilter === 'all' ||
        (sourceFilter === 'mt5' && (t.source === 'mt5' || Boolean(t.external_trade_id))) ||
        (sourceFilter === 'manual' && t.source !== 'mt5' && !t.external_trade_id);
      const matchesAccount = accountFilter === 'all' || t.trading_account_id === accountFilter;

      // Result filter
      let matchesResult = true;
      const pnl = Number(t.net_profit_loss) || 0;
      if (resultFilter === 'win') matchesResult = pnl > 0;
      else if (resultFilter === 'loss') matchesResult = pnl < 0;
      else if (resultFilter === 'breakeven') matchesResult = pnl === 0;

      // Date filter
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const tradeTime = new Date(t.entry_time || t.open_time || t.created_at || Date.now()).getTime();
        const now = Date.now();
        if (dateFilter === 'today') {
          matchesDate = now - tradeTime <= 86400000;
        } else if (dateFilter === '7d') {
          matchesDate = now - tradeTime <= 7 * 86400000;
        } else if (dateFilter === '30d') {
          matchesDate = now - tradeTime <= 30 * 86400000;
        }
      }

      return matchesSymbol && matchesDirection && matchesStrat && matchesSource && matchesAccount && matchesResult && matchesDate;
    });
  }, [trades, symbolFilter, directionFilter, strategyFilter, sourceFilter, accountFilter, resultFilter, dateFilter]);

  // Unique symbols for filter
  const uniqueSymbols = Array.from(new Set(trades.map((t) => t.symbol)));

  // Performance Breakdown Filters (PRD Section 17.1)
  const [perfTimeframe, setPerfTimeframe] = useState<string>('all');
  const [perfSymbol, setPerfSymbol] = useState<string>('all');
  const [perfAccount, setPerfAccount] = useState<string>('all');
  const [perfStrategy, setPerfStrategy] = useState<string>('all');
  const [perfSession, setPerfSession] = useState<string>('all');

  const perfFilteredTrades = useMemo(() => {
    return trades.filter((t) => {
      if (t.status !== 'closed') return false;
      if (perfSymbol !== 'all' && t.symbol !== perfSymbol) return false;
      if (perfAccount !== 'all' && t.trading_account_id !== perfAccount) return false;
      if (perfStrategy !== 'all' && t.strategy_id !== perfStrategy) return false;
      if (perfSession !== 'all' && t.session !== perfSession) return false;
      if (perfTimeframe !== 'all') {
        const entryMs = new Date(t.entry_time).getTime();
        const nowMs = Date.now();
        if (perfTimeframe === '7D' && nowMs - entryMs > 7 * 86400000) return false;
        if (perfTimeframe === '30D' && nowMs - entryMs > 30 * 86400000) return false;
        if (perfTimeframe === '3M' && nowMs - entryMs > 90 * 86400000) return false;
        if (perfTimeframe === '1Y' && nowMs - entryMs > 365 * 86400000) return false;
      }
      return true;
    });
  }, [trades, perfSymbol, perfAccount, perfStrategy, perfSession, perfTimeframe]);

  // Chronological Dynamic Equity Progression (PRD Section 17.2)
  const equityPoints = useMemo(() => {
    const sorted = [...perfFilteredTrades].sort(
      (a, b) => new Date(a.entry_time).getTime() - new Date(b.entry_time).getTime()
    );

    let runningEquity = 100000;
    const selectedAcc = tradingAccounts.find((a) => a.id === perfAccount);
    if (selectedAcc && selectedAcc.initial_balance) {
      runningEquity = Number(selectedAcc.initial_balance);
    }

    const points = [
      {
        index: 0,
        date: 'Start',
        equity: runningEquity,
        pnl: 0,
        isWin: true,
        symbol: 'Baseline',
      },
    ];

    sorted.forEach((t, i) => {
      runningEquity += Number(t.net_profit_loss) || 0;
      points.push({
        index: i + 1,
        date: new Date(t.entry_time).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        equity: runningEquity,
        pnl: Number(t.net_profit_loss) || 0,
        isWin: (Number(t.net_profit_loss) || 0) >= 0,
        symbol: t.symbol,
      });
    });

    return points;
  }, [perfFilteredTrades, tradingAccounts, perfAccount]);

  const { pathD, areaD, svgPoints, minEq, maxEq, peakEquity, currentMaxDrawdown } = useMemo(() => {
    if (equityPoints.length <= 1) {
      return {
        pathD: 'M 30,100 L 670,100',
        areaD: 'M 30,100 L 670,100 L 670,190 L 30,190 Z',
        svgPoints: [],
        minEq: 100000,
        maxEq: 100000,
        peakEquity: 100000,
        currentMaxDrawdown: 0,
      };
    }

    const equities = equityPoints.map((p) => p.equity);
    const min = Math.min(...equities);
    const max = Math.max(...equities);
    const range = max - min === 0 ? 1000 : max - min;
    const padding = range * 0.15;
    const effectiveMin = min - padding;
    const effectiveMax = max + padding;
    const effectiveRange = effectiveMax - effectiveMin;

    const svgWidth = 700;
    const svgHeight = 200;
    const marginX = 35;
    const marginY = 25;
    const chartWidth = svgWidth - marginX * 2;
    const chartHeight = svgHeight - marginY * 2;

    const mapped = equityPoints.map((pt, i) => {
      const x = marginX + (i / (equityPoints.length - 1)) * chartWidth;
      const y = marginY + chartHeight - ((pt.equity - effectiveMin) / effectiveRange) * chartHeight;
      return { ...pt, x, y };
    });

    const pathD = mapped.reduce(
      (acc, curr, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${curr.x.toFixed(1)},${curr.y.toFixed(1)}`,
      ''
    );
    const firstX = mapped[0].x.toFixed(1);
    const lastX = mapped[mapped.length - 1].x.toFixed(1);
    const bottomY = (svgHeight - 10).toFixed(1);
    const areaD = `${pathD} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`;

    // Calculate drawdown
    let peak = equities[0];
    let maxDd = 0;
    equities.forEach((eq) => {
      if (eq > peak) peak = eq;
      const dd = peak > 0 ? ((peak - eq) / peak) * 100 : 0;
      if (dd > maxDd) maxDd = dd;
    });

    return {
      pathD,
      areaD,
      svgPoints: mapped,
      minEq: min,
      maxEq: max,
      peakEquity: peak,
      currentMaxDrawdown: maxDd,
    };
  }, [equityPoints]);

  const perfMetrics = useMemo(() => {
    const total = perfFilteredTrades.length;
    let wins = 0;
    let losses = 0;
    let winAmount = 0;
    let lossAmount = 0;
    let totalPnL = 0;
    let totalR = 0;
    const assetMap: Record<string, number> = {};

    perfFilteredTrades.forEach((t) => {
      const pnl = Number(t.net_profit_loss) || 0;
      totalPnL += pnl;
      totalR += Number(t.r_multiple) || 0;
      assetMap[t.symbol] = (assetMap[t.symbol] || 0) + pnl;

      if (pnl > 0) {
        wins++;
        winAmount += pnl;
      } else if (pnl < 0) {
        losses++;
        lossAmount += Math.abs(pnl);
      }
    });

    const winRate = total > 0 ? (wins / total) * 100 : 0;
    const profitFactor = lossAmount > 0 ? winAmount / lossAmount : winAmount > 0 ? 99 : 0;
    const avgWin = wins > 0 ? winAmount / wins : 0;
    const avgLoss = losses > 0 ? lossAmount / losses : 0;
    const avgRR = total > 0 ? totalR / total : 0;
    const expectancy = total > 0 ? totalPnL / total : 0;

    let bestAsset = 'N/A';
    let bestAssetPnL = -Infinity;
    Object.entries(assetMap).forEach(([sym, pnl]) => {
      if (pnl > bestAssetPnL) {
        bestAssetPnL = pnl;
        bestAsset = sym;
      }
    });

    return {
      total,
      wins,
      losses,
      totalPnL,
      winRate,
      profitFactor,
      avgWin,
      avgLoss,
      avgRR,
      expectancy,
      bestAsset: bestAsset !== 'N/A' ? `${bestAsset} (${bestAssetPnL >= 0 ? '+' : ''}$${bestAssetPnL.toFixed(0)})` : 'None',
    };
  }, [perfFilteredTrades]);

  // Dynamic Psychology Analytics (PRD Section 19)
  const psychologyMetrics = useMemo(() => {
    return psychologyService.calculatePsychologyMetrics(trades);
  }, [trades]);


  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Top Header & Sub-Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--glass-border)] pb-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-[var(--color-ocean)]">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>TRADING LAB & PSYCHOLOGY ENGINE // INSTITUTIONAL JOURNAL</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-ink)] font-mono mt-1">Trading Journal</h1>
          <p className="text-xs text-[var(--color-muted)]">
            Performance analytics, trade journaling with emotional telemetry, equity curve, and strategy playbook.
          </p>
        </div>

        {/* SubTab Pill Switcher - Swipeable / Scrollable */}
        <div className="w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center space-x-1 rounded-xl bg-[var(--glass-bg)] p-1 border border-[var(--glass-border)] text-xs font-mono min-w-max">
            <button
              onClick={() => setTradingSubTab('journal')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition shrink-0 whitespace-nowrap ${
                tradingSubTab === 'journal'
                  ? 'bg-[var(--color-ocean)]/20 text-[var(--color-ocean)] font-bold border border-[var(--color-ocean)]/30'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Journal</span>
            </button>

            <button
              onClick={() => setTradingSubTab('trades')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition shrink-0 whitespace-nowrap ${
                tradingSubTab === 'trades'
                  ? 'bg-[var(--color-ocean)]/20 text-[var(--color-ocean)] font-bold border border-[var(--color-ocean)]/30'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
              }`}
            >
              <LineChart className="h-3.5 w-3.5" />
              <span>Trades Log</span>
            </button>

            <button
              onClick={() => setTradingSubTab('performance')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition shrink-0 whitespace-nowrap ${
                tradingSubTab === 'performance'
                  ? 'bg-[var(--color-ocean)]/20 text-[var(--color-ocean)] font-bold border border-[var(--color-ocean)]/30'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
              }`}
            >
              <PieChart className="h-3.5 w-3.5" />
              <span>Performance</span>
            </button>

            <button
              onClick={() => setTradingSubTab('psychology')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition shrink-0 whitespace-nowrap ${
                tradingSubTab === 'psychology'
                  ? 'bg-[var(--color-ocean)]/20 text-[var(--color-ocean)] font-bold border border-[var(--color-ocean)]/30'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
              }`}
            >
              <Brain className="h-3.5 w-3.5 text-[var(--color-ocean)]" />
              <span>Psychology</span>
            </button>

            <button
              onClick={() => setTradingSubTab('strategies')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition shrink-0 whitespace-nowrap ${
                tradingSubTab === 'strategies'
                  ? 'bg-[var(--color-ocean)]/20 text-[var(--color-ocean)] font-bold border border-[var(--color-ocean)]/30'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Playbook</span>
            </button>

            <button
              onClick={() => setTradingSubTab('accounts')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition shrink-0 whitespace-nowrap ${
                tradingSubTab === 'accounts'
                  ? 'bg-[var(--color-ocean)]/20 text-[var(--color-ocean)] font-bold border border-[var(--color-ocean)]/30'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Accounts</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Performance Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="liquid-glass-card p-3.5">
          <span className="text-[10px] font-mono text-[var(--color-muted)] block uppercase">Net Profit</span>
          <span className={`text-lg font-bold font-mono mt-0.5 block ${
            tradingSummary.totalPnL >= 0 ? 'text-[var(--color-olive)]' : 'text-[var(--color-rust)]'
          }`}>
            {tradingSummary.totalPnL >= 0 ? '+' : ''}${tradingSummary.totalPnL.toLocaleString()}
          </span>
        </div>

        <div className="liquid-glass-card p-3.5">
          <span className="text-[10px] font-mono text-[var(--color-muted)] block uppercase">Win Rate</span>
          <span className="text-lg font-bold font-mono text-[var(--color-ocean)] mt-0.5 block">
            {tradingSummary.winRate.toFixed(1)}%
          </span>
        </div>

        <div className="liquid-glass-card p-3.5">
          <span className="text-[10px] font-mono text-[var(--color-muted)] block uppercase">Profit Factor</span>
          <span className="text-lg font-bold font-mono text-[var(--color-olive)] mt-0.5 block">
            {tradingSummary.profitFactor.toFixed(2)}
          </span>
        </div>

        <div className="liquid-glass-card p-3.5">
          <span className="text-[10px] font-mono text-[var(--color-muted)] block uppercase">Avg R:R</span>
          <span className="text-lg font-bold font-mono text-purple-300 mt-0.5 block">
            {tradingSummary.avgRR.toFixed(2)}R
          </span>
        </div>

        <div className="liquid-glass-card p-3.5">
          <span className="text-[10px] font-mono text-[var(--color-muted)] block uppercase">Max Drawdown</span>
          <span className="text-lg font-bold font-mono text-[var(--color-gold)] mt-0.5 block">
            {tradingSummary.maxDrawdown.toFixed(2)}%
          </span>
        </div>

        <div className="liquid-glass-card p-3.5">
          <span className="text-[10px] font-mono text-[var(--color-muted)] block uppercase">Discipline Score</span>
          <span className="text-lg font-bold font-mono text-[var(--color-olive)] mt-0.5 block">
            {tradingSummary.avgDiscipline.toFixed(1)} / 10
          </span>
        </div>
      </div>

      {/* Filter Bar for Journal and Trades views */}
      {(tradingSubTab === 'journal' || tradingSubTab === 'trades') && (
        <div className="liquid-glass-card p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={symbolFilter}
              onChange={(e) => setSymbolFilter(e.target.value)}
              className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-1.5 text-xs font-mono text-[var(--color-ink)] focus:outline-none"
            >
              <option value="all">All Symbols ({uniqueSymbols.length})</option>
              {uniqueSymbols.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value as any)}
              className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-1.5 text-xs font-mono text-[var(--color-ink)] focus:outline-none"
            >
              <option value="all">All Directions</option>
              <option value="buy">BUY Only</option>
              <option value="sell">SELL Only</option>
            </select>

            <select
              value={strategyFilter}
              onChange={(e) => setStrategyFilter(e.target.value)}
              className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-1.5 text-xs font-mono text-[var(--color-ink)] focus:outline-none"
            >
              <option value="all">All Strategies</option>
              {strategies.map((strat) => (
                <option key={strat.id} value={strat.id}>
                  {strat.name}
                </option>
              ))}
            </select>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as any)}
              className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-1.5 text-xs font-mono text-[var(--color-ink)] focus:outline-none"
            >
              <option value="all">All Sources (MT5 + Manual)</option>
              <option value="mt5">MT5 Synced Only</option>
              <option value="manual">Manual Journal Only</option>
            </select>

            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value as any)}
              className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-1.5 text-xs font-mono text-[var(--color-ink)] focus:outline-none"
            >
              <option value="all">All Outcomes</option>
              <option value="win">Wins Only</option>
              <option value="loss">Losses Only</option>
              <option value="breakeven">Breakeven</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-1.5 text-xs font-mono text-[var(--color-ink)] focus:outline-none"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>

            {tradingAccounts.length > 0 && (
              <select
                value={accountFilter}
                onChange={(e) => setAccountFilter(e.target.value)}
                className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-1.5 text-xs font-mono text-[var(--color-ink)] focus:outline-none"
              >
                <option value="all">All Accounts</option>
                {tradingAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} {acc.is_mt5_synced ? '(MT5)' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={handleRequestDailySummary}
              className="flex items-center space-x-1.5 rounded-xl border border-[var(--color-ocean)]/40 bg-[var(--surface-tint)] px-3.5 py-2 text-xs font-bold text-[var(--color-ocean)] hover:bg-[var(--color-ocean)]/20 transition shrink-0"
              title="Rekap performa trading harian dengan Google Gemini AI"
            >
              <Sparkles className="h-3.5 w-3.5 text-[var(--color-gold)]" />
              <span>AI Daily Summary</span>
            </button>

            <button
              onClick={() => setIsAddTradeOpen(true)}
              className="flex items-center space-x-1.5 rounded-xl liquid-glass-card border-[var(--glass-border)] px-4 py-2 text-xs font-bold text-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)] transition shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>+ LOG TRADE</span>
            </button>
          </div>
        </div>
      )}

      {/* SUB-VIEW 1: JOURNAL (Rich Cards with screenshot preview, notes, psychology, and news) */}
      {tradingSubTab === 'journal' && (
        <div className="space-y-4">
          {isLoadingTrades ? (
            <div className="liquid-glass-card p-12 text-center rounded-2xl border-[var(--glass-border)]">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-[var(--color-ocean)] mb-3" />
              <p className="font-mono text-sm text-[var(--color-ink)] font-bold">MEMUAT JURNAL TRADING...</p>
              <p className="font-mono text-xs text-[var(--color-muted)] mt-1">Mengambil data dari InsForge PostgreSQL</p>
            </div>
          ) : filteredTrades.length === 0 ? (
            <div className="liquid-glass-card p-12 text-center rounded-2xl border-[var(--glass-border)] space-y-3">
              <TrendingUp className="h-8 w-8 mx-auto text-[var(--color-muted)]/50" />
              <p className="font-mono text-sm text-[var(--color-ink)] font-bold">BELUM ADA JURNAL TRADING</p>
              <p className="font-mono text-xs text-[var(--color-muted)] max-w-sm mx-auto">
                {trades.length === 0 
                  ? 'Catat eksekusi trade pertama Anda untuk mulai melacak psikologi, R-multiple, dan performa akun.'
                  : 'Tidak ada trade yang cocok dengan filter yang Anda pilih.'}
              </p>
              <button
                onClick={() => setIsAddTradeOpen(true)}
                className="inline-flex items-center space-x-1.5 rounded-xl liquid-glass-card border-[var(--glass-border)] px-4 py-2 text-xs font-bold text-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)] transition mt-2"
              >
                <Plus className="h-4 w-4" />
                <span>+ LOG FIRST TRADE</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredTrades.map((trade) => {
              const isWin = trade.net_profit_loss > 0;
              const isFomo = trade.psychology?.fomo;

              return (
                <div
                  key={trade.id}
                  className="liquid-glass-card p-5 hover:border-[var(--color-ocean)]/40 transition flex flex-col justify-between cursor-pointer"
                  onClick={() => setSelectedTradeForDetail(trade)}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between pb-3 border-b border-[var(--glass-border)]">
                      <div className="flex items-center space-x-2.5">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs uppercase ${
                          trade.direction === 'buy'
                            ? 'bg-[var(--color-olive)]/20 text-[var(--color-olive)] border border-[var(--color-olive)]/30'
                            : 'bg-[var(--color-rust)]/20 text-[var(--color-rust)] border border-[var(--color-rust)]/30'
                        }`}>
                          {trade.direction}
                        </span>
                        <h3 className="text-base font-bold font-mono text-[var(--color-ink)] tracking-wide">
                          {trade.symbol}
                        </h3>
                        <span className="text-[10px] font-mono text-[var(--color-muted)] bg-white/[0.05] px-2 py-0.5 rounded">
                          {trade.timeframe} • {trade.session}
                        </span>
                        {trade.source === 'mt5' ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[9px] font-bold bg-[var(--color-ocean)]/20 text-[var(--color-ocean)] border border-[var(--color-ocean)]/30">
                            <Server className="h-2.5 w-2.5" />
                            <span>MT5 SYNCED TRADE #{trade.external_trade_id ? trade.external_trade_id.replace(/^MT5_/, '') : 'DEAL'}</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold text-[var(--color-muted)] bg-white/[0.04] border border-[var(--glass-border)]">
                            MANUAL TRADE
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <span className={`text-base font-bold font-mono ${
                            isWin ? 'text-[var(--color-olive)]' : 'text-[var(--color-rust)]'
                          }`}>
                            {isWin ? '+' : ''}${trade.net_profit_loss.toFixed(0)}
                          </span>
                          <span className="block text-[10px] font-mono text-[var(--color-muted)]">
                            {trade.r_multiple > 0 ? `+${trade.r_multiple.toFixed(2)}R` : `${trade.r_multiple.toFixed(2)}R`}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Hapus log trade ${trade.symbol} (${trade.direction.toUpperCase()}) ini?`)) {
                              deleteTrade(trade.id);
                            }
                          }}
                          className="p-1.5 text-[var(--color-muted)] hover:text-[var(--color-rust)] hover:bg-rose-950/20 rounded-lg transition"
                          title="Hapus Trade Log"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Proximity / News Warning if any */}
                    {trade.correlated_news && (
                      <div className="mt-3 rounded-lg bg-rose-950/40 border border-[var(--color-rust)]/30 p-2 text-xs flex items-center justify-between text-[var(--color-rust)] font-mono">
                        <span className="flex items-center">
                          <AlertTriangle className="h-3.5 w-3.5 mr-1 text-[var(--color-rust)]" />
                          <span>{trade.correlated_news.event_name}</span>
                        </span>
                        <span className="text-[10px] bg-[var(--color-rust)]/20 px-1.5 py-0.2 rounded">
                          ±{trade.correlated_news.time_diff_minutes}m Proximity
                        </span>
                      </div>
                    )}

                    {/* Screenshot image thumbnail if exists (PRD Section 16) */}
                    {(trade.screenshot_url || (trade.screenshots && trade.screenshots.length > 0)) && (
                      <div className="mt-3 relative h-36 w-full rounded-lg overflow-hidden border border-[var(--glass-border)] group">
                        <img
                          src={trade.screenshot_url || trade.screenshots?.[0]?.file_path}
                          alt="Chart setup"
                          className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                        />
                        <div className="absolute top-2 left-2">
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/70 border border-white/10 text-[var(--color-ocean)] font-bold">
                            {trade.screenshots && trade.screenshots.length > 1
                              ? `${trade.screenshots.length} Stage Charts`
                              : 'Chart Inspector'}
                          </span>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-2.5">
                          <span className="text-[10px] font-mono text-[var(--color-ink)] flex items-center">
                            <Eye className="h-3 w-3 mr-1 text-[var(--color-ocean)]" /> Click to view Before/During/After
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Trade Details & Notes */}
                    <div className="mt-3 space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-[var(--color-muted)] bg-[var(--glass-bg)] p-2 rounded-lg">
                        <div>Entry: <span className="text-[var(--color-ink)]">{trade.entry_price}</span></div>
                        <div>Exit: <span className="text-[var(--color-ink)]">{trade.exit_price}</span></div>
                        <div>SL: <span className="text-[var(--color-rust)]">{trade.stop_loss}</span></div>
                        <div>TP: <span className="text-[var(--color-olive)]">{trade.take_profit}</span></div>
                      </div>

                      <p className="text-xs text-[var(--color-ink)] italic line-clamp-2">
                        "{trade.entry_reason}"
                      </p>
                    </div>
                  </div>

                  {/* Psychology Badge Footer */}
                  <div className="mt-4 pt-3 border-t border-[var(--glass-border)] flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-violet-950/40 text-[var(--color-ocean)] border border-[var(--color-ocean)]/30 capitalize">
                        Emotion: {trade.psychology?.emotion || 'neutral'}
                      </span>
                      {isFomo && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-rust)]/20 text-[var(--color-rust)] border border-[var(--color-rust)]/30">
                          FOMO
                        </span>
                      )}
                    </div>
                    <span className="text-[var(--color-muted)] text-[11px]">
                      Discipline: <span className="text-[var(--color-olive)] font-bold">{trade.psychology?.discipline_score || 8}/10</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    )}

      {/* SUB-VIEW 2: TRADES TABLE LOG */}
      {tradingSubTab === 'trades' && (
        <div className="liquid-glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--glass-border)] bg-[var(--glass-bg)] text-[11px] font-mono uppercase text-[var(--color-muted)]">
                  <th className="py-3 px-4">Date / Time</th>
                  <th className="py-3 px-4">Symbol</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Account</th>
                  <th className="py-3 px-4">Entry / Exit</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Session</th>
                  <th className="py-3 px-4 text-right">R-Multiple</th>
                  <th className="py-3 px-4 text-right">Net P&L</th>
                  <th className="py-3 px-4 text-center">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-xs font-mono">
                {isLoadingTrades ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-[var(--color-muted)]">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto text-[var(--color-ocean)] mb-2" />
                      <span>Memuat data trades dari database...</span>
                    </td>
                  </tr>
                ) : filteredTrades.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-[var(--color-muted)]">
                      <span>Belum ada log trade tercatat. Tekan &quot;+ LOG TRADE&quot; untuk menambahkan.</span>
                    </td>
                  </tr>
                ) : (
                  filteredTrades.map((trade) => {
                    const isWin = trade.net_profit_loss > 0;
                    return (
                      <tr
                        key={trade.id}
                        onClick={() => setSelectedTradeForDetail(trade)}
                        className="hover:bg-white/[0.02] cursor-pointer transition"
                      >
                        <td className="py-3 px-4 text-[var(--color-muted)]">
                          {new Date(trade.entry_time).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-3 px-4 font-bold text-[var(--color-ink)]">
                          {trade.symbol}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            trade.direction === 'buy'
                              ? 'bg-[var(--color-olive)]/20 text-[var(--color-olive)]'
                              : 'bg-[var(--color-rust)]/20 text-[var(--color-rust)]'
                          }`}>
                            {trade.direction}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {trade.source === 'mt5' ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[9px] font-bold bg-[var(--color-ocean)]/15 text-[var(--color-ocean)] border border-[var(--color-ocean)]/30">
                              <Server className="h-2.5 w-2.5" />
                              <span>MT5 SYNCED #{trade.external_trade_id ? trade.external_trade_id.replace(/^MT5_/, '') : 'DEAL'}</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold text-[var(--color-muted)] bg-white/[0.04] border border-[var(--glass-border)]">
                              MANUAL TRADE
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-[var(--color-muted)]">
                          {trade.trading_account_name || 'Main Prop'}
                        </td>
                        <td className="py-3 px-4 text-[var(--color-ink)]">
                          {trade.entry_price} → {trade.exit_price}
                        </td>
                        <td className="py-3 px-4 text-[var(--color-muted)]">
                          {trade.position_size} Lots
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[11px] text-[var(--color-ocean)] bg-cyan-950/40 px-1.5 py-0.5 rounded border border-[var(--color-ocean)]/20">
                            {trade.session}
                          </span>
                        </td>
                        <td className={`py-3 px-4 text-right font-bold ${
                          trade.r_multiple > 0 ? 'text-[var(--color-olive)]' : 'text-[var(--color-rust)]'
                        }`}>
                          {trade.r_multiple > 0 ? `+${trade.r_multiple.toFixed(1)}R` : `${trade.r_multiple.toFixed(1)}R`}
                        </td>
                        <td className={`py-3 px-4 text-right font-bold ${
                          isWin ? 'text-[var(--color-olive)]' : 'text-[var(--color-rust)]'
                        }`}>
                          {isWin ? '+' : ''}${trade.net_profit_loss.toFixed(0)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTradeForDetail(trade);
                              }}
                              className="p-1 text-[var(--color-muted)] hover:text-[var(--color-ocean)] transition rounded"
                              title="Inspect Trade"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Hapus trade ${trade.symbol} (${trade.direction.toUpperCase()}) ini dari log?`)) {
                                  deleteTrade(trade.id);
                                }
                              }}
                              className="p-1 text-[var(--color-muted)] hover:text-[var(--color-rust)] hover:bg-rose-950/20 transition rounded"
                              title="Hapus Trade Log"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: PERFORMANCE ANALYTICS & EQUITY CURVE */}
      {tradingSubTab === 'performance' && (
        <div className="space-y-6">
          {/* Performance Breakdown Filters */}
          <div className="liquid-glass-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-[var(--color-ocean)]" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-ink)]">
                  Performance Filters
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--color-ocean)]/10 text-[var(--color-ocean)] border border-[var(--color-ocean)]/20">
                  {perfFilteredTrades.length} trades
                </span>
              </div>

              {/* Timeframe pill selector */}
              <div className="flex items-center space-x-1 rounded-lg bg-[var(--color-bg)]/80 p-1 border border-[var(--glass-border)]">
                {['all', '7D', '30D', '3M', '1Y'].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setPerfTimeframe(tf)}
                    className={`px-2.5 py-1 text-xs font-mono rounded transition ${
                      perfTimeframe === tf
                        ? 'bg-[var(--color-ocean)] text-slate-950 font-bold'
                        : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                    }`}
                  >
                    {tf === 'all' ? 'All Time' : tf}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-[var(--glass-border)]">
              <div>
                <label className="text-[10px] font-mono uppercase text-[var(--color-muted)] block mb-1">Symbol</label>
                <select
                  value={perfSymbol}
                  onChange={(e) => setPerfSymbol(e.target.value)}
                  className="w-full rounded-lg bg-[var(--color-bg)] px-2.5 py-1.5 text-xs font-mono text-[var(--color-ink)] border border-[var(--glass-border)] focus:outline-none focus:border-[var(--color-ocean)]"
                >
                  <option value="all">All Symbols</option>
                  {uniqueSymbols.map((sym) => (
                    <option key={sym} value={sym}>{sym}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-[var(--color-muted)] block mb-1">Trading Account</label>
                <select
                  value={perfAccount}
                  onChange={(e) => setPerfAccount(e.target.value)}
                  className="w-full rounded-lg bg-[var(--color-bg)] px-2.5 py-1.5 text-xs font-mono text-[var(--color-ink)] border border-[var(--glass-border)] focus:outline-none focus:border-[var(--color-ocean)]"
                >
                  <option value="all">All Accounts</option>
                  {tradingAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({acc.broker})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-[var(--color-muted)] block mb-1">Strategy Setup</label>
                <select
                  value={perfStrategy}
                  onChange={(e) => setPerfStrategy(e.target.value)}
                  className="w-full rounded-lg bg-[var(--color-bg)] px-2.5 py-1.5 text-xs font-mono text-[var(--color-ink)] border border-[var(--glass-border)] focus:outline-none focus:border-[var(--color-ocean)]"
                >
                  <option value="all">All Strategies</option>
                  {strategies.map((strat) => (
                    <option key={strat.id} value={strat.id}>{strat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-[var(--color-muted)] block mb-1">Session</label>
                <select
                  value={perfSession}
                  onChange={(e) => setPerfSession(e.target.value)}
                  className="w-full rounded-lg bg-[var(--color-bg)] px-2.5 py-1.5 text-xs font-mono text-[var(--color-ink)] border border-[var(--glass-border)] focus:outline-none focus:border-[var(--color-ocean)]"
                >
                  <option value="all">All Sessions</option>
                  <option value="London">London</option>
                  <option value="New York">New York</option>
                  <option value="Asian">Asian</option>
                  <option value="Overlap">Overlap</option>
                </select>
              </div>
            </div>
          </div>

          {/* Interactive Dynamic Equity Growth Curve */}
          <div className="liquid-glass-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold font-mono uppercase tracking-wider text-[var(--color-ink)]">
                  Interactive Equity Growth Curve
                </h3>
                <p className="text-xs text-[var(--color-muted)] mt-1">
                  Chronological progression across {perfFilteredTrades.length} executed trades.
                </p>
              </div>
              <div className="flex items-center space-x-3 text-xs font-mono">
                <div className="flex items-center space-x-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-olive)]" />
                  <span className="text-[var(--color-muted)]">Win Trade</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-rust)]" />
                  <span className="text-[var(--color-muted)]">Loss Trade</span>
                </div>
              </div>
            </div>

            <div className="mt-6 relative h-64 w-full">
              <svg className="h-full w-full overflow-visible" viewBox="0 0 700 200">
                <defs>
                  <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d={areaD} fill="url(#curveGradient)" />
                <path
                  d={pathD}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {svgPoints.map((pt, i) => (
                  <circle
                    key={i}
                    cx={pt.x}
                    cy={pt.y}
                    r={i === svgPoints.length - 1 ? 5.5 : 3.5}
                    fill={i === 0 ? '#06b6d4' : pt.isWin ? '#10b981' : '#f43f5e'}
                    stroke="rgba(0,0,0,0.4)"
                    strokeWidth="1"
                    className="cursor-pointer hover:r-6 transition-all"
                  >
                    <title>{`${pt.date} | ${pt.symbol}: ${pt.pnl >= 0 ? '+' : ''}$${pt.pnl.toFixed(0)} (Equity: $${pt.equity.toLocaleString()})`}</title>
                  </circle>
                ))}
              </svg>

              <div className="flex justify-between text-[11px] font-mono text-[var(--color-muted)] mt-3 pt-2 border-t border-[var(--glass-border)]">
                <span>Baseline: ${equityPoints[0]?.equity?.toLocaleString() ?? '100,000'}</span>
                <span>Peak: ${peakEquity.toLocaleString()}</span>
                <span>Total PnL: <strong className={perfMetrics.totalPnL >= 0 ? 'text-[var(--color-olive)]' : 'text-[var(--color-rust)]'}>
                  {perfMetrics.totalPnL >= 0 ? '+' : ''}${perfMetrics.totalPnL.toFixed(0)}
                </strong></span>
                <span className="text-[var(--color-ocean)] font-bold">
                  Final Equity: ${equityPoints[equityPoints.length - 1]?.equity?.toLocaleString() ?? '100,000'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="liquid-glass-card p-5">
              <h4 className="text-xs font-mono uppercase text-[var(--color-muted)]">Expectancy & Math</h4>
              <p className={`text-xl font-bold font-mono mt-2 ${perfMetrics.expectancy >= 0 ? 'text-[var(--color-olive)]' : 'text-[var(--color-rust)]'}`}>
                {perfMetrics.expectancy >= 0 ? '+' : ''}${perfMetrics.expectancy.toFixed(0)} / Trade
              </p>
              <p className="text-xs text-[var(--color-muted)] mt-1">
                With {perfMetrics.winRate.toFixed(1)}% win rate, Profit Factor {perfMetrics.profitFactor.toFixed(2)}, and {perfMetrics.avgRR.toFixed(1)}R average reward.
              </p>
            </div>

            <div className="liquid-glass-card p-5">
              <h4 className="text-xs font-mono uppercase text-[var(--color-muted)]">Drawdown Resilience</h4>
              <p className="text-xl font-bold font-mono text-[var(--color-ocean)] mt-2">
                {currentMaxDrawdown.toFixed(2)}% Max DD
              </p>
              <p className="text-xs text-[var(--color-muted)] mt-1">
                Peak equity reached ${peakEquity.toLocaleString()}. Trailing drawdown buffer remaining: {(10 - Math.min(10, currentMaxDrawdown)).toFixed(2)}%.
              </p>
            </div>

            <div className="liquid-glass-card p-5">
              <h4 className="text-xs font-mono uppercase text-[var(--color-muted)]">Best Asset Class</h4>
              <p className="text-xl font-bold font-mono text-purple-300 mt-2">
                {perfMetrics.bestAsset}
              </p>
              <p className="text-xs text-[var(--color-muted)] mt-1">
                Top individual performer within the selected filter criteria.
              </p>
            </div>
          </div>

          {/* Best Trade & Worst Trade Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Best Trade */}
            <div className="liquid-glass-card p-5 border-[var(--color-olive)]/30 bg-emerald-950/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[var(--color-olive)] font-bold uppercase tracking-wider flex items-center space-x-1.5">
                  <TrendingUp className="h-4 w-4" />
                  <span>Best Realized Trade</span>
                </span>
                {tradingSummary.bestTrade && (
                  <button
                    onClick={() => setSelectedTradeForDetail(tradingSummary.bestTrade)}
                    className="text-[11px] font-mono text-[var(--color-ocean)] hover:underline flex items-center space-x-1"
                  >
                    <span>Inspect</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </div>

              {tradingSummary.bestTrade ? (
                <div className="mt-3 flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold font-mono text-[var(--color-ink)]">
                        {tradingSummary.bestTrade.symbol}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        tradingSummary.bestTrade.direction === 'buy'
                          ? 'bg-[var(--color-olive)]/20 text-[var(--color-olive)]'
                          : 'bg-[var(--color-rust)]/20 text-[var(--color-rust)]'
                      }`}>
                        {tradingSummary.bestTrade.direction}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-muted)] font-mono mt-1">
                      {new Date(tradingSummary.bestTrade.entry_time).toLocaleDateString()} • {tradingSummary.bestTrade.strategy_name || 'No Strategy'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold font-mono text-[var(--color-olive)]">
                      +${Number(tradingSummary.bestTrade.net_profit_loss).toLocaleString()}
                    </span>
                    <span className="block text-xs font-mono text-[var(--color-muted)]">
                      +{tradingSummary.bestTrade.r_multiple}R
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs font-mono text-[var(--color-muted)] mt-2">No closed trades recorded yet.</p>
              )}
            </div>

            {/* Worst Trade */}
            <div className="liquid-glass-card p-5 border-[var(--color-rust)]/30 bg-rose-950/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[var(--color-rust)] font-bold uppercase tracking-wider flex items-center space-x-1.5">
                  <TrendingDown className="h-4 w-4" />
                  <span>Largest Drawdown Trade</span>
                </span>
                {tradingSummary.worstTrade && (
                  <button
                    onClick={() => setSelectedTradeForDetail(tradingSummary.worstTrade)}
                    className="text-[11px] font-mono text-[var(--color-ocean)] hover:underline flex items-center space-x-1"
                  >
                    <span>Inspect</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </div>

              {tradingSummary.worstTrade ? (
                <div className="mt-3 flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold font-mono text-[var(--color-ink)]">
                        {tradingSummary.worstTrade.symbol}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        tradingSummary.worstTrade.direction === 'buy'
                          ? 'bg-[var(--color-olive)]/20 text-[var(--color-olive)]'
                          : 'bg-[var(--color-rust)]/20 text-[var(--color-rust)]'
                      }`}>
                        {tradingSummary.worstTrade.direction}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-muted)] font-mono mt-1">
                      {new Date(tradingSummary.worstTrade.entry_time).toLocaleDateString()} • {tradingSummary.worstTrade.strategy_name || 'No Strategy'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold font-mono text-[var(--color-rust)]">
                      -${Math.abs(Number(tradingSummary.worstTrade.net_profit_loss)).toLocaleString()}
                    </span>
                    <span className="block text-xs font-mono text-[var(--color-muted)]">
                      {tradingSummary.worstTrade.r_multiple}R
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs font-mono text-[var(--color-muted)] mt-2">No closed trades recorded yet.</p>
              )}
            </div>
          </div>

          {/* Breakdown by Symbol and Strategy */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Symbol Breakdown */}
            <div className="liquid-glass-card p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--glass-border)]">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-ink)]">
                  Performance By Symbol
                </span>
                <span className="text-[10px] font-mono text-[var(--color-muted)]">
                  {tradingSummary.performanceBySymbol.length} Pairs
                </span>
              </div>

              {tradingSummary.performanceBySymbol.length === 0 ? (
                <p className="text-xs font-mono text-[var(--color-muted)] py-4 text-center">No trades recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="text-[10px] text-[var(--color-muted)] border-b border-[var(--glass-border)] text-left">
                        <th className="pb-2">SYMBOL</th>
                        <th className="pb-2">TRADES</th>
                        <th className="pb-2">WIN RATE</th>
                        <th className="pb-2">PROFIT FACTOR</th>
                        <th className="pb-2 text-right">NET P&L</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--glass-border)]">
                      {tradingSummary.performanceBySymbol.map((item) => (
                        <tr key={item.symbol} className="hover:bg-white/[0.02]">
                          <td className="py-2.5 font-bold text-[var(--color-ink)]">{item.symbol}</td>
                          <td className="py-2.5 text-[var(--color-muted)]">{item.totalTrades}</td>
                          <td className="py-2.5">
                            <span className={item.winRate >= 50 ? 'text-[var(--color-olive)]' : 'text-[var(--color-rust)]'}>
                              {item.winRate.toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-2.5 text-[var(--color-muted)]">{item.profitFactor.toFixed(2)}</td>
                          <td className={`py-2.5 text-right font-bold ${item.totalPnL >= 0 ? 'text-[var(--color-olive)]' : 'text-[var(--color-rust)]'}`}>
                            {item.totalPnL >= 0 ? '+' : ''}${item.totalPnL.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Strategy Breakdown */}
            <div className="liquid-glass-card p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--glass-border)]">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-ink)]">
                  Performance By Strategy
                </span>
                <span className="text-[10px] font-mono text-[var(--color-muted)]">
                  {tradingSummary.performanceByStrategy.length} Playbooks
                </span>
              </div>

              {tradingSummary.performanceByStrategy.length === 0 ? (
                <p className="text-xs font-mono text-[var(--color-muted)] py-4 text-center">No strategy data recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="text-[10px] text-[var(--color-muted)] border-b border-[var(--glass-border)] text-left">
                        <th className="pb-2">STRATEGY</th>
                        <th className="pb-2">TRADES</th>
                        <th className="pb-2">WIN RATE</th>
                        <th className="pb-2">PROFIT FACTOR</th>
                        <th className="pb-2 text-right">NET P&L</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--glass-border)]">
                      {tradingSummary.performanceByStrategy.map((item) => (
                        <tr key={item.strategyId} className="hover:bg-white/[0.02]">
                          <td className="py-2.5 font-bold text-[var(--color-ink)] truncate max-w-[140px]">{item.strategyName}</td>
                          <td className="py-2.5 text-[var(--color-muted)]">{item.totalTrades}</td>
                          <td className="py-2.5">
                            <span className={item.winRate >= 50 ? 'text-[var(--color-olive)]' : 'text-[var(--color-rust)]'}>
                              {item.winRate.toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-2.5 text-[var(--color-muted)]">{item.profitFactor.toFixed(2)}</td>
                          <td className={`py-2.5 text-right font-bold ${item.totalPnL >= 0 ? 'text-[var(--color-olive)]' : 'text-[var(--color-rust)]'}`}>
                            {item.totalPnL >= 0 ? '+' : ''}${item.totalPnL.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: PSYCHOLOGY ENGINE */}
      {tradingSubTab === 'psychology' && (
        <div className="space-y-6">
          <div className="liquid-glass-card p-6 border-[var(--color-ocean)]/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--glass-border)]">
              <div className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-[var(--color-ocean)]" />
                <h3 className="text-sm font-semibold font-mono uppercase tracking-wider text-[var(--color-ocean)]">
                  Behavioral Diagnostics & Psychological Telemetry
                </h3>
              </div>

              <button
                type="button"
                onClick={handleRequestPsychologyCoach}
                disabled={isGeneratingCoach}
                className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl border border-[var(--color-ocean)]/40 bg-[var(--surface-tint)] text-xs font-bold text-[var(--color-ocean)] hover:bg-[var(--color-ocean)]/20 transition shrink-0 disabled:opacity-50"
              >
                <Sparkles className={`h-3.5 w-3.5 text-[var(--color-gold)] ${isGeneratingCoach ? 'animate-spin' : ''}`} />
                <span>{isGeneratingCoach ? 'Menganalisis Pola Emosi...' : 'Minta Evaluasi Coach Gemini'}</span>
              </button>
            </div>

            <p className="text-xs text-[var(--color-ink)] mt-3 leading-relaxed">
              Vyno correlates mental states, FOMO impulses, revenge trading patterns, and discipline scores with realized P&L outcomes.
            </p>

            {/* Gemini AI Psychology Coach Output */}
            {isGeneratingCoach && (
              <div className="mt-4 p-6 rounded-2xl border border-[var(--color-ocean)]/30 bg-[var(--surface-tint)] text-center space-y-3">
                <Bot className="h-8 w-8 text-[var(--color-ocean)] animate-bounce mx-auto" />
                <p className="text-xs font-medium text-[var(--color-ink)]">
                  Google Gemini sedang menganalisis korelasi data emosi, FOMO, revenge trading, dan skor disiplin Anda...
                </p>
                <p className="text-[11px] text-[var(--color-muted)] font-mono">INSFORGE AI GATEWAY // BEHAVIORAL COACH</p>
              </div>
            )}

            {coachError && !isGeneratingCoach && (
              <div className="mt-4 p-4 rounded-xl bg-[var(--color-rust)]/20 border border-[var(--color-rust)]/40 text-xs text-[var(--color-rust)]">
                {coachError}
              </div>
            )}

            {psychologyCoachOutput && !isGeneratingCoach && (
              <div className="mt-4 p-5 rounded-2xl border border-[var(--color-ocean)]/40 bg-[var(--surface-tint)] space-y-3">
                <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-2">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-[var(--color-gold)]" />
                    <span className="text-xs font-bold font-mono uppercase text-[var(--color-ocean)]">
                      Laporan Evaluasi AI Psychology Coach (Google Gemini)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--color-muted)]">Saved to ai_insights</span>
                </div>
                <div className="text-xs text-[var(--color-ink)] whitespace-pre-wrap leading-relaxed font-sans">
                  {psychologyCoachOutput}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {/* Card 1: FOMO Impact */}
              <div className="rounded-xl border border-[var(--color-rust)]/30 bg-rose-950/20 p-4">
                <span className="text-[10px] font-mono text-[var(--color-rust)] uppercase tracking-wide block">
                  FOMO vs Planned Trades
                </span>
                <div className="flex justify-between items-baseline mt-2 font-mono">
                  <span className="text-2xl font-bold text-[var(--color-rust)]">
                    {psychologyMetrics.fomoWinRate.toFixed(0)}% WR
                  </span>
                  <span className="text-xs text-[var(--color-muted)]">{psychologyMetrics.fomoCount} FOMO trades</span>
                </div>
                <div className="mt-3 pt-2 border-t border-[var(--color-rust)]/20 text-xs text-[var(--color-ink)]">
                  Contrast: Planned trades ({psychologyMetrics.nonFomoCount}) achieved <span className="text-[var(--color-olive)] font-bold">{psychologyMetrics.nonFomoWinRate.toFixed(0)}% Win Rate</span>. Total FOMO losses: -${psychologyMetrics.fomoLossAmount.toFixed(0)}.
                </div>
              </div>

              {/* Card 2: Revenge Trading Flag */}
              <div className="rounded-xl border border-[var(--color-gold)]/30 bg-amber-950/20 p-4">
                <span className="text-[10px] font-mono text-[var(--color-gold)] uppercase tracking-wide block">
                  Revenge / Retaliation
                </span>
                <div className="flex justify-between items-baseline mt-2 font-mono">
                  <span className="text-2xl font-bold text-[var(--color-gold)]">{psychologyMetrics.revengeCount} Trades</span>
                  <span className="text-xs text-[var(--color-muted)]">Detected</span>
                </div>
                <div className="mt-3 pt-2 border-t border-[var(--color-gold)]/20 text-xs text-[var(--color-ink)]">
                  {psychologyMetrics.revengeCount > 0
                    ? `Entered rapidly following a losing trade. Caused -$${psychologyMetrics.revengeLossAmount.toFixed(0)} in preventable losses.`
                    : 'Zero revenge trades detected! Exceptional discipline adhering to cool-down rules.'}
                </div>
              </div>

              {/* Card 3: Discipline vs Outcome */}
              <div className="rounded-xl border border-[var(--color-olive)]/30 bg-emerald-950/20 p-4">
                <span className="text-[10px] font-mono text-[var(--color-olive)] uppercase tracking-wide block">
                  Discipline Correlation
                </span>
                <div className="flex justify-between items-baseline mt-2 font-mono">
                  <span className="text-2xl font-bold text-[var(--color-olive)]">
                    {psychologyMetrics.avgWinDisc.toFixed(1)} / 10
                  </span>
                  <span className="text-xs text-[var(--color-muted)]">Winning trades avg</span>
                </div>
                <div className="mt-3 pt-2 border-t border-[var(--color-olive)]/20 text-xs text-[var(--color-ink)]">
                  Discipline score on losing trades averaged <span className="font-mono text-[var(--color-rust)]">{psychologyMetrics.avgLossDisc.toFixed(1)} / 10</span>. Maintaining rules directly boosts profitability.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 5: STRATEGIES PLAYBOOK */}
      {tradingSubTab === 'strategies' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold font-mono text-[var(--color-ink)] uppercase tracking-wider">
                Strategy Playbook & Setups ({strategies.length})
              </h3>
              <p className="text-xs text-[var(--color-muted)]">
                Documented edge, systematic execution rules, and win rate telemetry.
              </p>
            </div>
            <button
              onClick={() => {
                setStratName('');
                setStratDesc('');
                setStratRulesInput('');
                setIsAddStrategyOpen(true);
              }}
              className="flex items-center space-x-1.5 rounded-lg border border-[var(--color-ocean)]/30 bg-sky-950/30 px-3 py-1.5 text-xs font-mono text-[var(--color-ocean)] hover:bg-[var(--color-ocean)]/20 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ Add Playbook Setup</span>
            </button>
          </div>

          {isLoadingStrategies ? (
            <div className="liquid-glass-card p-12 text-center rounded-2xl border-[var(--glass-border)]">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-[var(--color-ocean)] mb-3" />
              <p className="font-mono text-sm text-[var(--color-ink)] font-bold">MEMUAT PLAYBOOK STRATEGI...</p>
              <p className="font-mono text-xs text-[var(--color-muted)] mt-1">Mengambil data dari InsForge PostgreSQL</p>
            </div>
          ) : strategies.length === 0 ? (
            <div className="liquid-glass-card p-12 text-center rounded-2xl border-[var(--glass-border)] space-y-3">
              <ShieldCheck className="h-8 w-8 mx-auto text-[var(--color-muted)]/50" />
              <p className="font-mono text-sm text-[var(--color-ink)] font-bold">BELUM ADA STRATEGI DI PLAYBOOK</p>
              <p className="font-mono text-xs text-[var(--color-muted)] max-w-sm mx-auto">
                Tulis aturan main dan strategi trading Anda agar setiap trade tercatat dan terukur secara sistematis.
              </p>
              <button
                onClick={() => setIsAddStrategyOpen(true)}
                className="mt-2 inline-flex items-center space-x-2 rounded-xl bg-[var(--color-ocean)]/20 border border-[var(--color-ocean)]/40 text-[var(--color-ocean)] font-mono text-xs px-4 py-2 hover:bg-[var(--color-ocean)]/30 transition"
              >
                <Plus className="h-4 w-4" />
                <span>+ Buat Strategi Pertama</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {strategies.map((strat) => (
                <div key={strat.id} className="liquid-glass-card p-5 flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--glass-border)]">
                      <h4 className="font-bold text-[var(--color-ink)] font-mono text-sm">{strat.name}</h4>
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          strat.is_active
                            ? 'bg-[var(--color-olive)]/20 text-[var(--color-olive)] border border-[var(--color-olive)]/30'
                            : 'bg-[var(--color-rust)]/20 text-[var(--color-rust)] border border-[var(--color-rust)]/30'
                        }`}>
                          {strat.is_active ? 'ACTIVE SETUP' : 'RETIRED'}
                        </span>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus strategi "${strat.name}" dari Playbook?`)) {
                              deleteStrategy(strat.id);
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-[var(--color-muted)] hover:text-[var(--color-rust)] transition"
                          title="Hapus strategi"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-[var(--color-ink)] mt-2">{strat.description}</p>

                    <div className="mt-4 space-y-1">
                      <span className="text-[10px] font-mono uppercase text-[var(--color-muted)] block">Execution Rules:</span>
                      <ul className="list-disc list-inside text-xs text-[var(--color-ink)] space-y-1">
                        {(strat.rules || []).map((rule, idx) => (
                          <li key={idx}>{rule}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-6 pt-3 border-t border-[var(--glass-border)] flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="text-[var(--color-muted)] text-[10px] block">WIN RATE</span>
                      <span className="text-[var(--color-olive)] font-bold">{strat.win_rate}%</span>
                    </div>
                    <div>
                      <span className="text-[var(--color-muted)] text-[10px] block">TOTAL TRADES</span>
                      <span className="text-[var(--color-ink)] font-bold">{strat.total_trades}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[var(--color-muted)] text-[10px] block">NET CONTRIBUTION</span>
                      <span className={`font-bold ${strat.pnl >= 0 ? 'text-[var(--color-olive)]' : 'text-[var(--color-rust)]'}`}>
                        {strat.pnl >= 0 ? '+' : ''}${strat.pnl.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Strategy Modal */}
          {isAddStrategyOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
              <div className="liquid-glass-glow w-full max-w-md rounded-2xl p-6 border-[var(--glass-border)] relative">
                <button
                  onClick={() => setIsAddStrategyOpen(false)}
                  className="absolute top-5 right-5 text-[var(--color-muted)] hover:text-[var(--color-ink)] transition"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="flex items-center space-x-2 pb-4 border-b border-[var(--glass-border)]">
                  <ShieldCheck className="h-5 w-5 text-[var(--color-ocean)]" />
                  <h3 className="font-mono font-bold text-lg text-[var(--color-ink)]">Tambah Playbook Strategi</h3>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!stratName.trim()) return;
                    setIsSubmittingStrat(true);
                    const rulesArray = stratRulesInput
                      .split('\n')
                      .map((r) => r.trim())
                      .filter((r) => r.length > 0);

                    await addStrategy({
                      name: stratName.trim(),
                      description: stratDesc.trim(),
                      rules: rulesArray,
                      is_active: true,
                      win_rate: 0,
                      total_trades: 0,
                      pnl: 0,
                    });
                    setIsSubmittingStrat(false);
                    setIsAddStrategyOpen(false);
                  }}
                  className="space-y-4 mt-4 text-xs font-mono"
                >
                  <div>
                    <label className="block text-[var(--color-muted)] mb-1">NAMA STRATEGI / SETUP</label>
                    <input
                      type="text"
                      placeholder="Contoh: Liquidity Sweep + MSS, London Breakout"
                      value={stratName}
                      onChange={(e) => setStratName(e.target.value)}
                      required
                      className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-[var(--color-ink)] focus:border-[var(--color-ocean)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--color-muted)] mb-1">DESKRIPSI LOGIKA</label>
                    <textarea
                      placeholder="Jelaskan tesis entry dan kondisi pasar ideal..."
                      value={stratDesc}
                      onChange={(e) => setStratDesc(e.target.value)}
                      rows={2}
                      className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-[var(--color-ink)] focus:border-[var(--color-ocean)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--color-muted)] mb-1">ATURAN EKSEKUSI (1 ATURAN PER BARIS)</label>
                    <textarea
                      placeholder={"- Tunggu sweep Asia High/Low\n- Validasi Fair Value Gap di M5\n- Minimal Risk to Reward 1:2"}
                      value={stratRulesInput}
                      onChange={(e) => setStratRulesInput(e.target.value)}
                      rows={4}
                      className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-[var(--color-ink)] focus:border-[var(--color-ocean)] focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-3 border-t border-[var(--glass-border)]">
                    <button
                      type="button"
                      onClick={() => setIsAddStrategyOpen(false)}
                      className="px-4 py-2 rounded-xl text-[var(--color-muted)] hover:text-[var(--color-ink)] transition"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingStrat}
                      className="px-5 py-2 rounded-xl bg-[var(--color-ocean)]/20 border border-[var(--color-ocean)]/40 text-[var(--color-ocean)] font-bold hover:bg-[var(--color-ocean)]/30 transition disabled:opacity-50 flex items-center space-x-2"
                    >
                      {isSubmittingStrat && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                      <span>Simpan Strategi</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 6: TRADING ACCOUNTS */}
      {tradingSubTab === 'accounts' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2 text-xs font-mono text-[var(--color-ocean)]">
                <Server className="h-3.5 w-3.5" />
                <span>MT5 INTEGRATION LAYER // MULTI-ACCOUNT SYNC</span>
              </div>
              <h3 className="text-sm font-semibold font-mono text-[var(--color-ink)] uppercase tracking-wider mt-0.5">
                Connected Prop Firms & Trading Accounts ({tradingAccounts.length})
              </h3>
              <p className="text-xs text-[var(--color-muted)]">
                Connect and synchronize MT5 terminal accounts, prop firm challenges, and live broker equity.
              </p>
            </div>
            <button
              onClick={() => {
                setTrName('');
                setTrBroker('');
                setTrType('prop');
                setTrCurrency('USD');
                setTrInitBal('100000');
                setTrProfitTarget('10000');
                setTrDrawdownLimit('10000');
                setTrIsMT5(true);
                setTrMt5Login('');
                setTrMt5Server('');
                setTrInvestorPassword('');
                setIsAddTradingAccOpen(true);
              }}
              className="flex items-center space-x-1.5 rounded-lg border border-[var(--color-ocean)]/30 bg-sky-950/30 px-3 py-1.5 text-xs font-mono text-[var(--color-ocean)] hover:bg-[var(--color-ocean)]/20 transition shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ Connect MT5 / Add Account</span>
            </button>
          </div>

          {isLoadingTradingAccounts ? (
            <div className="liquid-glass-card p-12 text-center rounded-2xl border-[var(--glass-border)]">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-[var(--color-ocean)] mb-3" />
              <p className="font-mono text-sm text-[var(--color-ink)] font-bold">MEMUAT AKUN TRADING...</p>
              <p className="font-mono text-xs text-[var(--color-muted)] mt-1">Mengambil data dari InsForge PostgreSQL</p>
            </div>
          ) : tradingAccounts.length === 0 ? (
            <div className="liquid-glass-card p-12 text-center rounded-2xl border-[var(--glass-border)] space-y-3">
              <Building2 className="h-8 w-8 mx-auto text-[var(--color-muted)]/50" />
              <p className="font-mono text-sm text-[var(--color-ink)] font-bold">BELUM ADA AKUN TRADING</p>
              <p className="font-mono text-xs text-[var(--color-muted)] max-w-sm mx-auto">
                Hubungkan akun MT5 Prop Firm (FTMO, MFFU) atau Broker Live (IC Markets, Bybit) untuk sinkronisasi otomatis riwayat transaksi dan kurva ekuitas.
              </p>
              <button
                onClick={() => setIsAddTradingAccOpen(true)}
                className="mt-2 inline-flex items-center space-x-2 rounded-xl bg-[var(--color-ocean)]/20 border border-[var(--color-ocean)]/40 text-[var(--color-ocean)] font-mono text-xs px-4 py-2 hover:bg-[var(--color-ocean)]/30 transition"
              >
                <Plus className="h-4 w-4" />
                <span>+ Hubungkan Akun MT5 Pertama</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tradingAccounts.map((account) => {
                const isSyncing = syncingAccountIds[account.id] || account.connection_status === 'syncing';
                const isConnected = account.connection_status === 'connected';
                const isError = account.connection_status === 'error';
                const floating = (account.current_equity || account.current_balance) - account.current_balance;

                return (
                  <div key={account.id} className="liquid-glass-card p-5 relative overflow-hidden group flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-ocean)]/10 text-[var(--color-ocean)] border border-[var(--color-ocean)]/20">
                            <TrendingUp className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-[var(--color-ink)] font-mono text-sm">{account.name}</h4>
                            <p className="text-[11px] text-[var(--color-muted)] font-mono">{account.broker} • <span className="uppercase">{account.account_type}</span></p>
                            {account.mt5_login && (
                              <div className="flex items-center space-x-1 text-[10px] font-mono text-[var(--color-ocean)] mt-0.5">
                                <Server className="h-2.5 w-2.5 shrink-0" />
                                <span>{account.mt5_server || 'MT5'} • #{account.mt5_login}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          {/* Connection Status Pill */}
                          {isSyncing ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/40 text-[var(--color-ocean)] border border-[var(--color-ocean)]/30">
                              <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                              <span>Syncing</span>
                            </span>
                          ) : isConnected ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/40 text-[var(--color-olive)] border border-[var(--color-olive)]/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-olive)]" />
                              <span>Connected</span>
                            </span>
                          ) : isError ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950/40 text-[var(--color-rust)] border border-[var(--color-rust)]/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-rust)]" />
                              <span>Sync Error</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.04] text-[var(--color-muted)] border border-[var(--glass-border)]">
                              <span>Offline</span>
                            </span>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditAccount(account);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-[var(--color-muted)] hover:text-[var(--color-ocean)] transition"
                            title="Edit akun trading"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Hapus akun trading "${account.name}"?`)) {
                                deleteTradingAccount(account.id);
                                if (selectedAccountForDetail?.id === account.id) {
                                  setSelectedAccountForDetail(null);
                                }
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-[var(--color-muted)] hover:text-[var(--color-rust)] transition"
                            title="Hapus akun trading"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Error notice if present */}
                      {account.sync_error && (
                        <div className="mt-3 p-2 rounded-lg bg-rose-950/20 border border-[var(--color-rust)]/20 text-[10px] font-mono text-[var(--color-rust)]">
                          Alert: {account.sync_error}
                        </div>
                      )}

                      {/* Balance & Equity Grid */}
                      <div className="mt-5 grid grid-cols-2 gap-3 p-3 rounded-xl bg-white/[0.02] border border-[var(--glass-border)]">
                        <div>
                          <span className="text-[10px] font-mono text-[var(--color-muted)] uppercase tracking-wider block">
                            Balance
                          </span>
                          <span className="text-lg font-bold font-mono text-[var(--color-ink)]">
                            {account.currency === 'IDR'
                              ? `Rp ${account.current_balance.toLocaleString('id-ID')}`
                              : `$${account.current_balance.toLocaleString()}`}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-[var(--color-muted)] uppercase tracking-wider block">
                            Live Equity
                          </span>
                          <div className="flex items-baseline space-x-1.5">
                            <span className="text-lg font-bold font-mono text-[var(--color-ocean)]">
                              {account.currency === 'IDR'
                                ? `Rp ${(account.current_equity || account.current_balance).toLocaleString('id-ID')}`
                                : `$${(account.current_equity || account.current_balance).toLocaleString()}`}
                            </span>
                            {floating !== 0 && (
                              <span className={`text-[10px] font-mono ${floating >= 0 ? 'text-[var(--color-olive)]' : 'text-[var(--color-rust)]'}`}>
                                {floating >= 0 ? '+' : ''}${floating.toFixed(0)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {(account.profit_target || account.max_drawdown_limit) && (
                        <div className="mt-3 pt-2 border-t border-[var(--glass-border)] grid grid-cols-2 gap-2 text-[11px] font-mono">
                          {account.profit_target && (
                            <div>
                              <span className="text-[var(--color-muted)] block text-[10px]">PROFIT TARGET</span>
                              <span className="text-[var(--color-olive)] font-bold">${account.profit_target.toLocaleString()}</span>
                            </div>
                          )}
                          {account.max_drawdown_limit && (
                            <div>
                              <span className="text-[var(--color-muted)] block text-[10px]">MAX DRAWDOWN</span>
                              <span className="text-[var(--color-gold)] font-bold">${account.max_drawdown_limit.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-[var(--glass-border)] flex items-center justify-between text-[11px] font-mono">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedAccountForDetail(account)}
                          className="flex items-center space-x-1 text-[11px] font-mono text-[var(--color-ocean)] hover:underline"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Details</span>
                        </button>
                        <span className="text-[var(--color-muted)]">•</span>
                        <button
                          onClick={() => handleOpenSyncHistory(account)}
                          className="flex items-center space-x-1 text-[11px] font-mono text-[var(--color-ocean)] hover:underline"
                        >
                          <Clock className="h-3 w-3" />
                          <span>Sync Log</span>
                        </button>
                        <span className="text-[var(--color-muted)]">•</span>
                        <div className="text-[10px] text-[var(--color-muted)]">
                          <span>Sync: </span>
                          <span className="text-[var(--color-ink)]">
                            {account.last_synced_at
                              ? new Date(account.last_synced_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : 'Never'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => syncMT5Account(account.id)}
                        disabled={isSyncing}
                        className="flex items-center space-x-1.5 rounded-lg border border-[var(--color-ocean)]/30 bg-[var(--color-ocean)]/10 px-2.5 py-1 text-[11px] font-mono text-[var(--color-ocean)] hover:bg-[var(--color-ocean)]/20 transition disabled:opacity-50"
                      >
                        <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Trading Account Modal with MT5 Integration */}
          {isAddTradingAccOpen && (
            <div
              className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
              onClick={() => setIsAddTradingAccOpen(false)}
            >
              <div className="min-h-full flex items-center justify-center p-3 sm:p-6">
                <div
                  className="liquid-glass-glow w-full max-w-lg rounded-2xl p-5 sm:p-7 border-[var(--glass-border)] relative my-auto shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                <button
                  onClick={() => setIsAddTradingAccOpen(false)}
                  className="absolute top-5 right-5 text-[var(--color-muted)] hover:text-[var(--color-ink)] transition"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="flex items-center space-x-2 pb-4 border-b border-[var(--glass-border)]">
                  <TrendingUp className="h-5 w-5 text-[var(--color-ocean)]" />
                  <h3 className="font-mono font-bold text-lg text-[var(--color-ink)]">Hubungkan Akun Trading & MT5</h3>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!trName.trim() || !trBroker.trim()) return;
                    setIsSubmittingTrAcc(true);
                    const initBal = parseFloat(trInitBal) || 100000;
                    const pTarget = trProfitTarget ? parseFloat(trProfitTarget) : undefined;
                    const ddLimit = trDrawdownLimit ? parseFloat(trDrawdownLimit) : undefined;

                    const generatedEaToken =
                      trIsMT5 && trConnectorMode === 'ea'
                        ? (trEaToken.trim() || `ea_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`)
                        : undefined;

                    const passwordOrToken =
                      trIsMT5 && trConnectorMode === 'ea'
                        ? generatedEaToken
                        : trIsMT5 && trConnectorMode === 'investor'
                        ? trInvestorPassword
                        : undefined;

                    const newAcc = await addTradingAccount({
                      name: trName.trim(),
                      broker: trBroker.trim(),
                      account_type: trType,
                      currency: trCurrency,
                      initial_balance: initBal,
                      current_balance: initBal,
                      current_equity: initBal,
                      profit_target: pTarget,
                      max_drawdown_limit: ddLimit,
                      mt5_login: trIsMT5 ? (trMt5Login.trim() || '1084201') : undefined,
                      mt5_server: trIsMT5 ? (trMt5Server.trim() || 'FTMO-Server2') : undefined,
                      investor_password_encrypted: passwordOrToken,
                      connection_status: trIsMT5 ? 'connected' : 'disconnected',
                      is_mt5_synced: trIsMT5,
                      last_synced_at: trIsMT5 ? new Date().toISOString() : undefined,
                      is_active: true,
                    });

                    if (newAcc && newAcc.id && trIsMT5) {
                      // Trigger initial MT5 import in background
                      syncMT5Account(newAcc.id);
                    }

                    setIsSubmittingTrAcc(false);
                    setIsAddTradingAccOpen(false);
                  }}
                  className="space-y-4 mt-4 text-xs font-mono"
                >
                  <div>
                    <label className="block text-[var(--color-muted)] mb-1">NAMA AKUN</label>
                    <input
                      type="text"
                      placeholder="Contoh: FTMO $100K Funded, IC Markets ECN"
                      value={trName}
                      onChange={(e) => setTrName(e.target.value)}
                      required
                      className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-[var(--color-ink)] focus:border-[var(--color-ocean)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--color-muted)] mb-1">BROKER / PROP FIRM</label>
                    <input
                      type="text"
                      placeholder="Contoh: FTMO EU, IC Markets Global, FundedNext"
                      value={trBroker}
                      onChange={(e) => setTrBroker(e.target.value)}
                      required
                      className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-[var(--color-ink)] focus:border-[var(--color-ocean)] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[var(--color-muted)] mb-1">TIPE AKUN</label>
                      <select
                        value={trType}
                        onChange={(e) => setTrType(e.target.value as TradingAccountType)}
                        className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-[var(--color-ink)] focus:outline-none"
                      >
                        <option value="prop">Prop Firm</option>
                        <option value="broker">Broker Live</option>
                        <option value="demo">Demo / Paper</option>
                        <option value="personal">Personal Capital</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[var(--color-muted)] mb-1">MATA UANG</label>
                      <select
                        value={trCurrency}
                        onChange={(e) => setTrCurrency(e.target.value as Currency)}
                        className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-[var(--color-ink)] focus:outline-none"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="IDR">IDR (Rp)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[var(--color-muted)] mb-1">SALDO AWAL (STARTING BALANCE)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="100000"
                      value={trInitBal}
                      onChange={(e) => setTrInitBal(e.target.value)}
                      className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-[var(--color-ink)] focus:border-[var(--color-ocean)] focus:outline-none"
                    />
                  </div>

                  {/* MT5 Synchronization Box */}
                  <div className="p-3.5 rounded-xl border border-[var(--color-ocean)]/30 bg-sky-950/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Server className="h-4 w-4 text-[var(--color-ocean)]" />
                        <span className="font-bold text-[var(--color-ink)]">Sinkronisasi Otomatis MT5</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={trIsMT5}
                        onChange={(e) => setTrIsMT5(e.target.checked)}
                        className="h-4 w-4 rounded accent-[var(--color-ocean)] cursor-pointer"
                      />
                    </div>

                    {trIsMT5 && (
                      <div className="space-y-3 pt-2 border-t border-[var(--color-ocean)]/20">
                        {/* Connector Mode Switcher */}
                        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-black/40 border border-[var(--glass-border)] text-[10px]">
                          <button
                            type="button"
                            onClick={() => setTrConnectorMode('investor')}
                            className={`py-1 rounded text-center font-bold transition ${
                              trConnectorMode === 'investor'
                                ? 'bg-[var(--color-ocean)]/30 text-[var(--color-ocean)] border border-[var(--color-ocean)]/40'
                                : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                            }`}
                          >
                            Investor Password (Read-Only)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTrConnectorMode('ea');
                              if (!trEaToken) {
                                setTrEaToken(`ea_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`);
                              }
                            }}
                            className={`py-1 rounded text-center font-bold transition ${
                              trConnectorMode === 'ea'
                                ? 'bg-[var(--color-ocean)]/30 text-[var(--color-ocean)] border border-[var(--color-ocean)]/40'
                                : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                            }`}
                          >
                            MQL5 EA Bridge (Token)
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-[var(--color-muted)] block mb-1">MT5 LOGIN / NO. AKUN</label>
                            <input
                              type="text"
                              placeholder="1084201"
                              value={trMt5Login}
                              onChange={(e) => setTrMt5Login(e.target.value)}
                              className="w-full rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] px-2.5 py-1.5 text-xs text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ocean)]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-[var(--color-muted)] block mb-1">MT5 SERVER</label>
                            <input
                              type="text"
                              placeholder="FTMO-Server2, ICMarkets-Live"
                              value={trMt5Server}
                              onChange={(e) => setTrMt5Server(e.target.value)}
                              className="w-full rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] px-2.5 py-1.5 text-xs text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ocean)]"
                            />
                          </div>
                        </div>

                        {trConnectorMode === 'investor' ? (
                          <div>
                            <label className="text-[10px] text-[var(--color-muted)] block mb-1">
                              INVESTOR PASSWORD (READ-ONLY) <span className="text-[var(--color-olive)]">(AMAN)</span>
                            </label>
                            <input
                              type="password"
                              placeholder="Password investor read-only..."
                              value={trInvestorPassword}
                              onChange={(e) => setTrInvestorPassword(e.target.value)}
                              className="w-full rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] px-2.5 py-1.5 text-xs text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ocean)]"
                            />
                            <p className="text-[10px] text-[var(--color-muted)] mt-1">
                              Aman: Fynence hanya membaca riwayat transaksi tertutup untuk jurnal analitik. Password master trading tidak pernah diminta.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2 p-2.5 rounded-lg bg-black/30 border border-[var(--color-ocean)]/20">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-[10px] text-[var(--color-ocean)] font-bold">
                                  FYNENCE EA TOKEN
                                </label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (trEaToken) {
                                      navigator.clipboard.writeText(trEaToken);
                                      setCopiedToken(true);
                                      setTimeout(() => setCopiedToken(false), 2000);
                                    }
                                  }}
                                  className="text-[10px] text-[var(--color-ocean)] hover:underline flex items-center space-x-1"
                                >
                                  {copiedToken ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                  <span>{copiedToken ? 'Tersalin!' : 'Salin Token'}</span>
                                </button>
                              </div>
                              <input
                                type="text"
                                readOnly
                                value={trEaToken || 'ea_autogenerated_token'}
                                className="w-full rounded border border-[var(--glass-border)] bg-black/50 px-2 py-1 text-[11px] text-[var(--color-ink)] font-mono select-all"
                              />
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-[var(--color-muted)] pt-1">
                              <span>MQL5 Expert Advisor:</span>
                              <a
                                href="/mt5/FynenceSyncEA.mq5"
                                download="FynenceSyncEA.mq5"
                                className="text-[var(--color-ocean)] hover:underline flex items-center space-x-1"
                              >
                                <Download className="h-3 w-3" />
                                <span>Unduh FynenceSyncEA.mq5</span>
                              </a>
                            </div>
                          </div>
                        )}

                        <div className="p-2 rounded bg-white/[0.02] border border-[var(--glass-border)] text-[10px] text-[var(--color-muted)] space-y-0.5">
                          <p className="font-bold text-[var(--color-olive)]">✓ 100% Read-Only Security Guarantee</p>
                          <p>Fynence tidak menyimpan password master broker dan tidak memiliki hak membuka/menutup order.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[var(--color-muted)] mb-1">PROFIT TARGET (OPSIONAL)</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="10000"
                        value={trProfitTarget}
                        onChange={(e) => setTrProfitTarget(e.target.value)}
                        className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-[var(--color-ink)] focus:border-[var(--color-ocean)] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[var(--color-muted)] mb-1">MAX DRAWDOWN (OPSIONAL)</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="10000"
                        value={trDrawdownLimit}
                        onChange={(e) => setTrDrawdownLimit(e.target.value)}
                        className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-[var(--color-ink)] focus:border-[var(--color-ocean)] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-3 border-t border-[var(--glass-border)]">
                    <button
                      type="button"
                      onClick={() => setIsAddTradingAccOpen(false)}
                      className="px-4 py-2 rounded-xl text-[var(--color-muted)] hover:text-[var(--color-ink)] transition"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingTrAcc}
                      className="px-5 py-2 rounded-xl bg-[var(--color-ocean)]/20 border border-[var(--color-ocean)]/40 text-[var(--color-ocean)] font-bold hover:bg-[var(--color-ocean)]/30 transition disabled:opacity-50 flex items-center space-x-2"
                    >
                      {isSubmittingTrAcc && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                      <span>{trIsMT5 ? 'Hubungkan & Sinkron MT5' : 'Simpan Akun Trading'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

          {/* Edit Trading Account Modal */}
          {isEditTradingAccOpen && accountToEdit && (
            <div
              className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
              onClick={() => {
                setIsEditTradingAccOpen(false);
                setAccountToEdit(null);
              }}
            >
              <div className="min-h-full flex items-center justify-center p-3 sm:p-6">
                <div
                  className="liquid-glass-glow w-full max-w-lg rounded-2xl p-5 sm:p-7 border-[var(--glass-border)] relative my-auto shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                <button
                  onClick={() => {
                    setIsEditTradingAccOpen(false);
                    setAccountToEdit(null);
                  }}
                  className="absolute top-5 right-5 text-[var(--color-muted)] hover:text-[var(--color-ink)] transition"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="flex items-center space-x-2 pb-4 border-b border-[var(--glass-border)]">
                  <Edit2 className="h-5 w-5 text-[var(--color-ocean)]" />
                  <div>
                    <h3 className="font-mono font-bold text-lg text-[var(--color-ink)]">Edit Akun Trading</h3>
                    <p className="font-mono text-xs text-[var(--color-muted)]">{accountToEdit.name} • {accountToEdit.broker}</p>
                  </div>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!editTrName.trim() || !editTrBroker.trim()) return;
                    setIsSubmittingEditTrAcc(true);
                    const initBal = parseFloat(editTrInitBal) || 0;
                    const curBal = parseFloat(editTrCurrentBal) || 0;
                    const curEq = editTrCurrentEq ? parseFloat(editTrCurrentEq) : curBal;
                    const pTarget = editTrProfitTarget ? parseFloat(editTrProfitTarget) : undefined;
                    const ddLimit = editTrDrawdownLimit ? parseFloat(editTrDrawdownLimit) : undefined;

                    await updateTradingAccount(accountToEdit.id, {
                      name: editTrName.trim(),
                      broker: editTrBroker.trim(),
                      account_type: editTrType,
                      currency: editTrCurrency,
                      initial_balance: initBal,
                      current_balance: curBal,
                      current_equity: curEq,
                      profit_target: pTarget,
                      max_drawdown_limit: ddLimit,
                    });

                    setIsSubmittingEditTrAcc(false);
                    setIsEditTradingAccOpen(false);
                    setAccountToEdit(null);
                  }}
                  className="space-y-4 mt-4 text-xs font-mono"
                >
                  <div>
                    <label className="block text-[var(--color-muted)] mb-1">NAMA AKUN</label>
                    <input
                      type="text"
                      value={editTrName}
                      onChange={(e) => setEditTrName(e.target.value)}
                      required
                      className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-[var(--color-ink)] focus:border-[var(--color-ocean)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--color-muted)] mb-1">BROKER / PROP FIRM</label>
                    <input
                      type="text"
                      value={editTrBroker}
                      onChange={(e) => setEditTrBroker(e.target.value)}
                      required
                      className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-[var(--color-ink)] focus:border-[var(--color-ocean)] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[var(--color-muted)] mb-1">TIPE AKUN</label>
                      <select
                        value={editTrType}
                        onChange={(e) => setEditTrType(e.target.value as TradingAccountType)}
                        className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-[var(--color-ink)] focus:outline-none"
                      >
                        <option value="prop">Prop Firm</option>
                        <option value="broker">Broker Live</option>
                        <option value="demo">Demo / Paper</option>
                        <option value="personal">Personal Capital</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[var(--color-muted)] mb-1">MATA UANG</label>
                      <select
                        value={editTrCurrency}
                        onChange={(e) => setEditTrCurrency(e.target.value as Currency)}
                        className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-[var(--color-ink)] focus:outline-none"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="IDR">IDR (Rp)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[var(--color-muted)] mb-1">STARTING BALANCE</label>
                      <input
                        type="number"
                        step="any"
                        value={editTrInitBal}
                        onChange={(e) => setEditTrInitBal(e.target.value)}
                        className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-[var(--color-ink)] focus:border-[var(--color-ocean)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[var(--color-muted)] mb-1">CURRENT BALANCE</label>
                      <input
                        type="number"
                        step="any"
                        value={editTrCurrentBal}
                        onChange={(e) => setEditTrCurrentBal(e.target.value)}
                        className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-[var(--color-ink)] focus:border-[var(--color-ocean)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[var(--color-muted)] mb-1">CURRENT EQUITY</label>
                      <input
                        type="number"
                        step="any"
                        value={editTrCurrentEq}
                        onChange={(e) => setEditTrCurrentEq(e.target.value)}
                        className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-[var(--color-ink)] focus:border-[var(--color-ocean)] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[var(--color-muted)] mb-1">PROFIT TARGET (OPSIONAL)</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="10000"
                        value={editTrProfitTarget}
                        onChange={(e) => setEditTrProfitTarget(e.target.value)}
                        className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-[var(--color-ink)] focus:border-[var(--color-ocean)] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[var(--color-muted)] mb-1">MAX DRAWDOWN (OPSIONAL)</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="10000"
                        value={editTrDrawdownLimit}
                        onChange={(e) => setEditTrDrawdownLimit(e.target.value)}
                        className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-[var(--color-ink)] focus:border-[var(--color-ocean)] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-3 border-t border-[var(--glass-border)]">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditTradingAccOpen(false);
                        setAccountToEdit(null);
                      }}
                      className="px-4 py-2 rounded-xl text-[var(--color-muted)] hover:text-[var(--color-ink)] transition"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingEditTrAcc}
                      className="px-5 py-2 rounded-xl bg-[var(--color-ocean)]/20 border border-[var(--color-ocean)]/40 text-[var(--color-ocean)] font-bold hover:bg-[var(--color-ocean)]/30 transition disabled:opacity-50 flex items-center space-x-2"
                    >
                      {isSubmittingEditTrAcc && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                      <span>Perbarui Akun</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

          {/* Account Detail Modal */}
          {selectedAccountForDetail && (() => {
            const currentAcc = tradingAccounts.find((a) => a.id === selectedAccountForDetail.id) || selectedAccountForDetail;
            const accTrades = trades.filter((t) => t.trading_account_id === currentAcc.id);
            const accWins = accTrades.filter((t) => t.net_profit_loss > 0).length;
            const accLosses = accTrades.filter((t) => t.net_profit_loss < 0).length;
            const accWinRate = accTrades.length > 0 ? (accWins / accTrades.length) * 100 : 0;
            const accTotalPnL = accTrades.reduce((sum, t) => sum + (t.net_profit_loss || 0), 0);
            const floating = (currentAcc.current_equity ?? currentAcc.current_balance) - currentAcc.current_balance;
            const totalGain = (currentAcc.current_balance || 0) - (currentAcc.initial_balance || 0);
            const totalGainPct = currentAcc.initial_balance ? (totalGain / currentAcc.initial_balance) * 100 : 0;

            return (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
                <div className="liquid-glass-glow w-full max-w-3xl rounded-2xl p-6 border-[var(--glass-border)] relative max-h-[90vh] overflow-y-auto space-y-6">
                  <button
                    onClick={() => setSelectedAccountForDetail(null)}
                    className="absolute top-5 right-5 text-[var(--color-muted)] hover:text-[var(--color-ink)] transition"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--glass-border)]">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-ocean)]/10 text-[var(--color-ocean)] border border-[var(--color-ocean)]/30">
                        <Building2 className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-mono font-bold text-lg text-[var(--color-ink)]">{currentAcc.name}</h3>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-white/[0.05] border border-[var(--glass-border)] text-[var(--color-muted)]">
                            {currentAcc.account_type}
                          </span>
                        </div>
                        <p className="font-mono text-xs text-[var(--color-muted)] mt-0.5">
                          {currentAcc.broker} • Currency: {currentAcc.currency}
                          {currentAcc.mt5_login && ` • MT5 #${currentAcc.mt5_login} (${currentAcc.mt5_server || 'MT5'})`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          const acc = currentAcc;
                          setSelectedAccountForDetail(null);
                          handleOpenEditAccount(acc);
                        }}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-[var(--glass-border)] bg-white/[0.03] text-xs font-mono text-[var(--color-ink)] hover:border-[var(--color-ocean)]/40 transition"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus akun trading "${currentAcc.name}"?`)) {
                            deleteTradingAccount(currentAcc.id);
                            setSelectedAccountForDetail(null);
                          }
                        }}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-[var(--color-rust)]/30 bg-[var(--color-rust)]/10 text-xs font-mono text-[var(--color-rust)] hover:bg-[var(--color-rust)]/20 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>

                  {/* Financial Metrics Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-[var(--glass-border)]">
                      <span className="text-[10px] font-mono text-[var(--color-muted)] uppercase block">Starting Balance</span>
                      <span className="text-base font-bold font-mono text-[var(--color-ink)]">
                        ${currentAcc.initial_balance?.toLocaleString() ?? 0}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-[var(--glass-border)]">
                      <span className="text-[10px] font-mono text-[var(--color-muted)] uppercase block">Current Balance</span>
                      <span className="text-base font-bold font-mono text-[var(--color-ink)]">
                        ${currentAcc.current_balance?.toLocaleString() ?? 0}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-[var(--glass-border)]">
                      <span className="text-[10px] font-mono text-[var(--color-muted)] uppercase block">Live Equity</span>
                      <div className="flex items-baseline space-x-1.5">
                        <span className="text-base font-bold font-mono text-[var(--color-ocean)]">
                          ${(currentAcc.current_equity ?? currentAcc.current_balance)?.toLocaleString() ?? 0}
                        </span>
                        {floating !== 0 && (
                          <span className={`text-[10px] font-mono ${floating >= 0 ? 'text-[var(--color-olive)]' : 'text-[var(--color-rust)]'}`}>
                            {floating >= 0 ? '+' : ''}${floating.toFixed(0)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-[var(--glass-border)]">
                      <span className="text-[10px] font-mono text-[var(--color-muted)] uppercase block">Total Net Return</span>
                      <span className={`text-base font-bold font-mono ${totalGain >= 0 ? 'text-[var(--color-olive)]' : 'text-[var(--color-rust)]'}`}>
                        {totalGain >= 0 ? '+' : ''}${totalGain.toLocaleString()} ({totalGainPct >= 0 ? '+' : ''}{totalGainPct.toFixed(2)}%)
                      </span>
                    </div>
                  </div>

                  {/* Profit Target & Max Drawdown Progress if configured */}
                  {(currentAcc.profit_target || currentAcc.max_drawdown_limit) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-xl bg-white/[0.02] border border-[var(--glass-border)] font-mono text-xs">
                      {currentAcc.profit_target && (
                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[var(--color-muted)] text-[10px] uppercase">Profit Target</span>
                            <span className="text-[var(--color-olive)] font-bold">
                              ${Math.max(0, totalGain).toLocaleString()} / ${currentAcc.profit_target.toLocaleString()}
                            </span>
                          </div>
                          <div className="w-full bg-white/[0.06] rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-[var(--color-olive)] h-full rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, Math.max(0, (totalGain / currentAcc.profit_target) * 100))}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-[var(--color-muted)] mt-1 block">
                            {((totalGain / currentAcc.profit_target) * 100).toFixed(1)}% tercapai
                          </span>
                        </div>
                      )}

                      {currentAcc.max_drawdown_limit && (
                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[var(--color-muted)] text-[10px] uppercase">Max Drawdown Limit</span>
                            <span className="text-[var(--color-gold)] font-bold">
                              Limit: ${currentAcc.max_drawdown_limit.toLocaleString()}
                            </span>
                          </div>
                          <p className="text-[10px] text-[var(--color-muted)]">
                            Toleransi penurunan ekuitas maksimum sebelum melanggar aturan akun.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Account Trades Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-mono font-bold text-xs text-[var(--color-ink)] uppercase tracking-wider">
                          Riwayat Trade Akun Ini ({accTrades.length})
                        </h4>
                        <p className="font-mono text-[10px] text-[var(--color-muted)]">
                          Menampilkan semua eksekusi trade yang terikat dengan akun ini
                        </p>
                      </div>

                      <div className="flex items-center space-x-3 text-xs font-mono">
                        <span className="text-[var(--color-muted)]">
                          Win Rate: <strong className="text-[var(--color-ink)]">{accWinRate.toFixed(1)}%</strong> ({accWins}W / {accLosses}L)
                        </span>
                        <span className="text-[var(--color-muted)]">•</span>
                        <span className="text-[var(--color-muted)]">
                          Total PnL: <strong className={accTotalPnL >= 0 ? 'text-[var(--color-olive)]' : 'text-[var(--color-rust)]'}>
                            {accTotalPnL >= 0 ? '+' : ''}${accTotalPnL.toFixed(0)}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {accTrades.length === 0 ? (
                      <div className="p-8 text-center rounded-xl bg-white/[0.01] border border-[var(--glass-border)] font-mono text-xs text-[var(--color-muted)]">
                        Belum ada riwayat transaksi tercatat untuk akun ini. Tambahkan trade baru dan pilih akun ini saat pencatatan.
                      </div>
                    ) : (
                      <div className="max-h-60 overflow-y-auto rounded-xl border border-[var(--glass-border)] divide-y divide-[var(--glass-border)]">
                        {accTrades.map((t) => {
                          const isWin = t.net_profit_loss > 0;
                          return (
                            <div
                              key={t.id}
                              onClick={() => setSelectedTradeForDetail(t)}
                              className="p-3 bg-white/[0.01] hover:bg-white/[0.04] transition flex items-center justify-between cursor-pointer font-mono text-xs"
                            >
                              <div className="flex items-center space-x-2.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  t.direction === 'buy'
                                    ? 'bg-[var(--color-olive)]/20 text-[var(--color-olive)]'
                                    : 'bg-[var(--color-rust)]/20 text-[var(--color-rust)]'
                                }`}>
                                  {t.direction}
                                </span>
                                <span className="font-bold text-[var(--color-ink)]">{t.symbol}</span>
                                <span className="text-[10px] text-[var(--color-muted)]">
                                  {t.position_size} lots • {t.timeframe || 'H1'}
                                </span>
                                {(t.strategy_name || t.strategy_id) && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/[0.04] text-[var(--color-muted)]">
                                    {t.strategy_name || t.strategy_id}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center space-x-3">
                                <div className="text-right">
                                  <span className={`font-bold ${isWin ? 'text-[var(--color-olive)]' : 'text-[var(--color-rust)]'}`}>
                                    {isWin ? '+' : ''}${t.net_profit_loss.toFixed(0)}
                                  </span>
                                  <span className="block text-[10px] text-[var(--color-muted)]">
                                    {t.r_multiple ? `${t.r_multiple > 0 ? '+' : ''}${t.r_multiple.toFixed(2)}R` : ''}
                                  </span>
                                </div>
                                <Eye className="h-3.5 w-3.5 text-[var(--color-muted)] hover:text-[var(--color-ocean)]" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex justify-end pt-3 border-t border-[var(--glass-border)]">
                    <button
                      onClick={() => setSelectedAccountForDetail(null)}
                      className="px-5 py-2 rounded-xl border border-[var(--glass-border)] bg-white/[0.04] text-xs font-mono text-[var(--color-ink)] hover:bg-white/[0.08] transition"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* MT5 Sync History Modal */}
          {syncHistoryAccount && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
              <div className="liquid-glass-glow w-full max-w-xl rounded-2xl p-6 border-[var(--glass-border)] relative max-h-[85vh] overflow-y-auto space-y-4 font-mono">
                <button
                  onClick={() => setSyncHistoryAccount(null)}
                  className="absolute top-5 right-5 text-[var(--color-muted)] hover:text-[var(--color-ink)] transition"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="flex items-center justify-between pb-3 border-b border-[var(--glass-border)] pr-8">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-ocean)]/10 text-[var(--color-ocean)] border border-[var(--color-ocean)]/30">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-base text-[var(--color-ink)]">MT5 Sync History Log</h3>
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase bg-white/[0.05] border border-[var(--glass-border)] text-[var(--color-muted)]">
                          {syncHistoryAccount.connection_status || 'connected'}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--color-muted)]">
                        {syncHistoryAccount.name} • {syncHistoryAccount.broker} ({syncHistoryAccount.mt5_server || 'MT5'})
                      </p>
                    </div>
                  </div>

                  {syncHistoryRecords.length > 0 && (
                    <button
                      onClick={async () => {
                        if (confirm(`Hapus semua riwayat sinkronisasi akun ${syncHistoryAccount.name}?`)) {
                          const { clearMT5SyncHistoryAction } = await import('@/app/actions');
                          await clearMT5SyncHistoryAction(syncHistoryAccount.id);
                          setSyncHistoryRecords([]);
                        }
                      }}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-mono text-[var(--color-rust)] border border-[var(--color-rust)]/30 bg-rose-950/20 hover:bg-rose-950/40 transition"
                      title="Clear sync history"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Clear History</span>
                    </button>
                  )}
                </div>

                {/* Body */}
                {isLoadingSyncHistory ? (
                  <div className="py-12 text-center text-xs text-[var(--color-muted)]">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto text-[var(--color-ocean)] mb-2" />
                    <span>Memuat log riwayat sinkronisasi...</span>
                  </div>
                ) : syncHistoryRecords.length === 0 ? (
                  <div className="py-10 text-center rounded-xl bg-white/[0.01] border border-[var(--glass-border)] text-xs text-[var(--color-muted)] space-y-2">
                    <Clock className="h-6 w-6 mx-auto text-[var(--color-muted)]/50" />
                    <p>Belum ada riwayat sinkronisasi untuk akun ini.</p>
                    <p className="text-[11px]">Tekan &quot;Sync Now&quot; untuk menjalankan sinkronisasi pertama.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {syncHistoryRecords.map((rec) => {
                      const isSuccess = rec.status === 'success' || rec.sync_status === 'success';
                      return (
                        <div
                          key={rec.id}
                          className="p-3 rounded-xl bg-white/[0.02] border border-[var(--glass-border)] flex items-start justify-between text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  isSuccess
                                    ? 'bg-[var(--color-olive)]/20 text-[var(--color-olive)] border border-[var(--color-olive)]/30'
                                    : 'bg-[var(--color-rust)]/20 text-[var(--color-rust)] border border-[var(--color-rust)]/30'
                                }`}
                              >
                                {rec.status}
                              </span>
                              <span className="text-[var(--color-ink)] font-bold">
                                {rec.synced_trades_count} deals checked
                              </span>
                              <span className="text-[var(--color-olive)] text-[11px]">
                                (+{rec.new_trades_count} new)
                              </span>
                            </div>

                            {rec.external_trade_id && (
                              <p className="text-[11px] text-[var(--color-muted)]">
                                External Ticket: #{rec.external_trade_id}
                              </p>
                            )}

                            {rec.error_message && (
                              <div className="mt-1 p-2 rounded bg-rose-950/30 border border-[var(--color-rust)]/30 text-[10px] text-[var(--color-rust)]">
                                Error: {rec.error_message}
                              </div>
                            )}
                          </div>

                          <span className="text-[10px] text-[var(--color-muted)] whitespace-nowrap">
                            {new Date(rec.last_synced_timestamp || rec.created_at).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-[var(--glass-border)]">
                  <button
                    onClick={async () => {
                      if (syncHistoryAccount) {
                        await syncMT5Account(syncHistoryAccount.id);
                        handleOpenSyncHistory(syncHistoryAccount);
                      }
                    }}
                    disabled={Boolean(syncingAccountIds[syncHistoryAccount?.id || ''])}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-[var(--color-ocean)]/30 bg-[var(--color-ocean)]/10 text-xs text-[var(--color-ocean)] hover:bg-[var(--color-ocean)]/20 transition disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${syncingAccountIds[syncHistoryAccount?.id || ''] ? 'animate-spin' : ''}`} />
                    <span>{syncingAccountIds[syncHistoryAccount?.id || ''] ? 'Syncing...' : 'Sync Now'}</span>
                  </button>

                  <button
                    onClick={() => setSyncHistoryAccount(null)}
                    className="px-4 py-1.5 rounded-xl border border-[var(--glass-border)] bg-white/[0.04] text-xs text-[var(--color-ink)] hover:bg-white/[0.08] transition"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: AI Daily Trading Summary (Google Gemini) */}
      {isDailySummaryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="liquid-glass-card border-[var(--color-ocean)]/40 p-6 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-[var(--color-ocean)]/20 text-[var(--color-ocean)] border border-[var(--color-ocean)]/40">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] text-[var(--color-ocean)] tracking-wider uppercase font-mono font-bold block">
                    DAILY SESSION REVIEW // GOOGLE GEMINI ENGINE
                  </span>
                  <h3 className="text-sm font-bold text-[var(--color-ink)] font-sans">
                    {dailySummaryTitle || 'Rekap & Skor Kepatuhan Trading Harian'}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setIsDailySummaryModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/[0.08] text-[var(--color-muted)] hover:text-[var(--color-ink)] transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isGeneratingDailySummary && (
              <div className="py-12 text-center space-y-3">
                <div className="inline-flex p-3 rounded-full bg-[var(--color-ocean)]/20 border border-[var(--color-ocean)]/40 text-[var(--color-ocean)] animate-pulse">
                  <Bot className="h-8 w-8 animate-bounce" />
                </div>
                <p className="text-xs font-medium text-[var(--color-ink)] font-sans">
                  Google Gemini sedang menganalisis seluruh trade hari ini, mengukur R-Multiple, dan mengevaluasi disiplin eksekusi...
                </p>
                <p className="text-[11px] text-[var(--color-muted)] font-mono">INSFORGE AI GATEWAY // DAILY SUMMARY</p>
              </div>
            )}

            {dailySummaryError && !isGeneratingDailySummary && (
              <div className="p-4 rounded-xl bg-[var(--color-rust)]/20 border border-[var(--color-rust)]/40 text-xs text-[var(--color-rust)] space-y-2">
                <p className="font-bold">Gagal Membuat Rekap Harian</p>
                <p>{dailySummaryError}</p>
                <button
                  type="button"
                  onClick={handleRequestDailySummary}
                  className="px-3 py-1 rounded-lg bg-[var(--color-rust)]/30 hover:bg-[var(--color-rust)]/40 font-bold transition"
                >
                  Coba Lagi
                </button>
              </div>
            )}

            {dailySummaryOutput && !isGeneratingDailySummary && (
              <div className="space-y-4">
                <div className="rounded-xl bg-black/20 p-4 border border-[var(--glass-border)] text-xs text-[var(--color-ink)] whitespace-pre-wrap leading-relaxed font-sans">
                  {dailySummaryOutput}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[var(--glass-border)] font-mono text-xs">
                  <span className="text-[10px] text-[var(--color-muted)]">
                    Tersimpan otomatis ke database (ai_insights)
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleRequestDailySummary}
                      className="px-3 py-1.5 rounded-xl border border-[var(--glass-border)] bg-white/[0.04] text-[var(--color-muted)] hover:text-[var(--color-ink)] transition flex items-center space-x-1"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>Regenerate</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDailySummaryModalOpen(false)}
                      className="px-4 py-1.5 rounded-xl bg-[var(--color-ink)] text-[var(--color-paper)] hover:bg-[var(--color-rust)] transition font-bold"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
