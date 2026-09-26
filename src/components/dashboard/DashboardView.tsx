'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  Quote,
} from 'lucide-react';
import {
  getGreetingForTimezone,
} from '@/lib/timezone';
import { DashboardChart } from './DashboardChart';
import { MacroDesk } from './MacroDesk';
import { DisciplineGauge } from './DisciplineGauge';
import { PsychologyAuditCard } from './PsychologyAuditCard';
import { DashboardPulseRadar } from './DashboardPulseRadar';
import { AskAiFrame } from './AskAiFrame';

interface FinancialQuote {
  quote: string;
  author: string;
}

const DAILY_QUOTES: FinancialQuote[] = [
  {
    quote: 'In the short run, the market is a voting machine, but in the long run, it is a weighing machine.',
    author: 'Benjamin Graham',
  },
  {
    quote: 'Price is what you pay. Value is what you get.',
    author: 'Warren Buffett',
  },
  {
    quote: 'Most people overestimate what they can do in one year and underestimate what they can do in ten years.',
    author: 'Bill Gates',
  },
  {
    quote: 'Let your joy be in your journey, not in some distant goal.',
    author: 'Tim Cook',
  },
  {
    quote: 'The individual investor should act consistently as an investor and not as a speculator.',
    author: 'Benjamin Graham',
  },
  {
    quote: 'The stock market is a device to transfer money from the impatient to the patient.',
    author: 'Warren Buffett',
  },
  {
    quote: 'Patience is a key element of success.',
    author: 'Bill Gates',
  },
  {
    quote: 'You can focus on things that are barriers or you can focus on scaling the wall or redefining the problem.',
    author: 'Tim Cook',
  },
  {
    quote: 'Rule No. 1: Never lose money. Rule No. 2: Never forget rule No. 1.',
    author: 'Warren Buffett',
  },
  {
    quote: 'To achieve satisfactory investment results is easier than most people realize; to achieve superior results is harder than it looks.',
    author: 'Benjamin Graham',
  },
  {
    quote: 'The big money is not in the buying and the selling, but in the waiting.',
    author: 'Charlie Munger',
  },
  {
    quote: 'Know what you own, and know why you own it.',
    author: 'Peter Lynch',
  },
];

export const DashboardView: React.FC = () => {
  const {
    user,
    tradingSummary,
    tradingAccounts,
    formatCurrency,
    displayCurrency,
    trades,
    timezone,
    openProfileSettings,
  } = useApp();

  const [timeFilter, setTimeFilter] = useState('30D');
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const greeting = useMemo(() => {
    return getGreetingForTimezone(timezone, currentDate);
  }, [timezone, currentDate]);

  const dailyQuote = useMemo(() => {
    const dayOfYear = Math.floor(
      (Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()) -
        Date.UTC(currentDate.getFullYear(), 0, 0)) /
        24 / 60 / 60 / 1000
    );
    return DAILY_QUOTES[Math.abs(dayOfYear) % DAILY_QUOTES.length];
  }, [currentDate]);

  // Dynamic Trading Equity Chart Points Calculation
  const chartData = useMemo(() => {
    const now = Date.now();
    const daysMap: Record<string, number> = {
      '7D': 7,
      '30D': 30,
      '3M': 90,
      '6M': 180,
      '1Y': 365,
    };
    const maxDays = daysMap[timeFilter] || 30;
    const cutoffMs = maxDays * 86400000;

    const sortedTrades = [...trades]
      .filter((t) => t.status === 'closed')
      .sort((a, b) => new Date(a.entry_time).getTime() - new Date(b.entry_time).getTime());

    const latestMs = sortedTrades.length > 0
      ? Math.max(...sortedTrades.map((t) => new Date(t.entry_time).getTime()))
      : now;

    const filtered = sortedTrades.filter((t) => {
      const tMs = new Date(t.entry_time).getTime();
      return latestMs - tMs <= cutoffMs;
    });

    const activeTrades = filtered.length > 0 ? filtered : sortedTrades;

    const initialBaseUSD = 100000;
    const initialEquity = displayCurrency === 'IDR' ? initialBaseUSD * 16000 : initialBaseUSD;
    let currentEquity = initialEquity;

    const firstDate = activeTrades[0]
      ? new Date(activeTrades[0].entry_time).toLocaleDateString([], { month: 'short', day: 'numeric' })
      : 'Start';
    const points = [{ label: 'Starting Equity', value: initialEquity, date: firstDate }];

    activeTrades.forEach((t) => {
      const pnl = Number(t.net_profit_loss) || 0;
      const pnlInDisplay = displayCurrency === 'IDR' ? pnl * 16000 : pnl;
      currentEquity += pnlInDisplay;
      points.push({
        label: `${t.symbol} (${pnl >= 0 ? '+' : ''}${formatCurrency(pnl, 'USD')})`,
        value: currentEquity,
        date: new Date(t.exit_time || t.entry_time).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      });
    });

    return { points, label: 'Trading Equity', isPositive: currentEquity >= initialEquity, latestVal: currentEquity };
  }, [timeFilter, trades, displayCurrency, formatCurrency]);

  const closedTrades = trades.filter((t) => t.status === 'closed');

  const pnlReturnText = useMemo(() => {
    const base = 100000;
    const percent = (tradingSummary.totalPnL / base) * 100;
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(1)}% Return`;
  }, [tradingSummary.totalPnL]);

  const calculatedDisciplineScore = useMemo(() => {
    if (tradingSummary.avgDiscipline > 0) {
      return Math.round(tradingSummary.avgDiscipline);
    }
    if (closedTrades.length > 0) {
      const breaches = (tradingSummary.revengeTradesCount || 0) + (tradingSummary.fomoTradesCount || 0);
      return Math.max(0, Math.min(100, Math.round(100 - (breaches / closedTrades.length) * 50)));
    }
    return 100;
  }, [tradingSummary.avgDiscipline, tradingSummary.revengeTradesCount, tradingSummary.fomoTradesCount, closedTrades.length]);

  return (
    <div className="flex flex-col w-full gap-6 sm:gap-8 pb-12 animate-in fade-in duration-300">
      {/* 1. Top Operator Banner & Live Synchronicity */}
      <div className="relative overflow-hidden rounded-xl bg-[#17212B]/60 border border-white/[0.06] p-5 sm:p-7 shadow-2xl backdrop-blur-2xl">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#00F2C2]/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 h-56 w-56 rounded-full bg-[#FF8A00]/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col gap-3 sm:gap-4">
          {/* Greeting Heading (GOOD NIGHT / GOOD MORNING) */}
          <div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#F8FAFC] leading-none">
              {greeting.replace(/\.+$/, '')}
              <span className="text-[#00F2C2]">.</span>
            </h1>
          </div>

          {/* Quote of the Day (dibawah Goodnight) */}
          <div className="flex items-start gap-2.5 max-w-3xl pt-1">
            <Quote className="h-4 w-4 text-[#00F2C2] shrink-0 mt-0.5 opacity-75" />
            <div className="flex flex-col gap-0.5 min-w-0">
              <p className="text-xs sm:text-sm text-[#94A3B8] italic font-normal leading-relaxed">
                &ldquo;{dailyQuote.quote}&rdquo;
              </p>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#64748B] font-medium">
                - {dailyQuote.author}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Macro Desk: Horizontal Scrollable Frame for Market AI Bias & Regime */}
      <MacroDesk />

      {/* 3. Secondary Row: Trading Performance Ratios */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Trading P&L */}
        <div className="rounded-xl bg-[#121920]/70 border border-white/[0.06] p-4 sm:p-5 backdrop-blur-xl shadow-lg flex flex-col justify-between">
          <span className="font-mono text-[10px] uppercase text-[#64748B] tracking-wider">
            TRADING P&L (MTD)
          </span>
          <div className="my-1.5">
            <span
              className={`text-xl sm:text-2xl font-bold font-mono ${
                tradingSummary.totalPnL >= 0 ? 'text-[#00F2C2]' : 'text-[#F43F5E]'
              }`}
            >
              {tradingSummary.totalPnL >= 0 ? '+' : ''}${tradingSummary.totalPnL.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00F2C2]" />
            <span className="text-[#00F2C2] font-medium">{pnlReturnText}</span>
          </div>
        </div>

        {/* Win Rate */}
        <div className="rounded-xl bg-[#121920]/70 border border-white/[0.06] p-4 sm:p-5 backdrop-blur-xl shadow-lg flex flex-col justify-between">
          <span className="font-mono text-[10px] uppercase text-[#64748B] tracking-wider">
            WIN RATE
          </span>
          <div className="my-1.5">
            <span className="text-xl sm:text-2xl font-bold font-mono text-[#F8FAFC]">
              {tradingSummary.winRate.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            <span className="text-[#10B981] font-medium">
              {tradingSummary.winningTrades} Wins / {tradingSummary.losingTrades} Loss
            </span>
          </div>
        </div>

        {/* Profit Factor */}
        <div className="rounded-xl bg-[#121920]/70 border border-white/[0.06] p-4 sm:p-5 backdrop-blur-xl shadow-lg flex flex-col justify-between">
          <span className="font-mono text-[10px] uppercase text-[#64748B] tracking-wider">
            PROFIT FACTOR
          </span>
          <div className="my-1.5">
            <span className="text-xl sm:text-2xl font-bold font-mono text-[#F8FAFC]">
              {tradingSummary.profitFactor.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00F2C2]" />
            <span className="text-[#94A3B8]">Threshold &gt; 1.50</span>
          </div>
        </div>

        {/* Max Drawdown */}
        <div className="rounded-xl bg-[#121920]/70 border border-white/[0.06] p-4 sm:p-5 backdrop-blur-xl shadow-lg flex flex-col justify-between">
          <span className="font-mono text-[10px] uppercase text-[#64748B] tracking-wider">
            MAX DRAWDOWN
          </span>
          <div className="my-1.5">
            <span className="text-xl sm:text-2xl font-bold font-mono text-[#F8FAFC]">
              -{tradingSummary.maxDrawdown.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4EDEA3]" />
            <span className="text-[#4EDEA3]">Optimal Risk Profile</span>
          </div>
        </div>
      </div>

      {/* 4. Central Analytical Hub: Chart (~70-75%) + Right Panel (~25-30% split in 2) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-stretch">
        {/* Trading Equity Visualizer (~70-75% width) */}
        <div className="md:col-span-8 xl:col-span-9 flex flex-col">
          <DashboardChart
            className="w-full h-full"
            timeFilter={timeFilter}
            setTimeFilter={setTimeFilter}
            chartData={chartData}
            tradesCount={closedTrades.length}
            displayCurrency={displayCurrency}
            formatCurrency={formatCurrency}
          />
        </div>

        {/* Right Panel: Discipline Gauge & Psychology Audit (~25-30% width, split 50/50 vertically) */}
        <div className="md:col-span-4 xl:col-span-3 flex flex-col gap-3 sm:gap-4 justify-between">
          <div className="flex-1 flex flex-col">
            <DisciplineGauge
              score={calculatedDisciplineScore}
              className="h-full"
            />
          </div>
          <div className="flex-1 flex flex-col">
            <PsychologyAuditCard
              revengeTradesCount={tradingSummary.revengeTradesCount}
              fomoTradesCount={tradingSummary.fomoTradesCount}
              totalTrades={closedTrades.length}
              className="h-full"
            />
          </div>
        </div>
      </div>

      {/* 5. Fynence Pulse Radar & Economic Events */}
      <DashboardPulseRadar className="w-full" />

      {/* 6. Ask AI Minimalist Copilot Frame */}
      <AskAiFrame />
    </div>
  );
};
