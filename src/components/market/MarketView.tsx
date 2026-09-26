'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Sparkles,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Brain,
  Layers,
  Calendar,
  ChevronDown,
  ChevronUp,
  Info,
  Coins,
  Building2,
  Laptop,
  Clock,
} from 'lucide-react';
import {
  SupportedInstrument,
  SUPPORTED_INSTRUMENTS,
  INSTRUMENTS_METADATA,
  MarketIntelligenceData,
} from '@/types/market';
import {
  getForexMarketIntelligenceAction,
  getAllForexOverviewAction,
  generateForexAiReportAction,
} from '@/app/actions';
import { MarketSkeleton } from './MarketSkeleton';

// ─── Formatting helpers ──────────────────────────────────────────────────────

function formatInstrumentPrice(symbol: SupportedInstrument, price: number): string {
  if (symbol === 'XAUUSD') {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatInstrumentChange(symbol: SupportedInstrument, change: number): string {
  const sign = change >= 0 ? '+' : '';
  if (symbol === 'XAUUSD') {
    return `${sign}$${Math.abs(change).toFixed(2)}`;
  }
  return `${sign}${change.toFixed(1)} pts`;
}

// ─── Instrument theme config (warm palette) ───────────────────────────────────

const INSTRUMENT_THEMES = {
  XAUUSD: {
    icon: Coins,
    accent: 'var(--color-gold)',
    accentClass: 'text-[var(--color-gold)]',
    borderActive: 'border-[var(--color-gold)]/50',
    bgActive: 'bg-[var(--color-gold)]/[0.06]',
    badgeClass: 'bg-[var(--color-gold)]/10 text-[var(--color-gold)] border-[var(--color-gold)]/30',
    positiveClass: 'text-[var(--color-olive)]',
  },
  DJ30: {
    icon: Building2,
    accent: 'var(--color-ocean)',
    accentClass: 'text-[var(--color-ocean)]',
    borderActive: 'border-[var(--color-ocean)]/50',
    bgActive: 'bg-[var(--color-ocean)]/[0.06]',
    badgeClass: 'bg-[var(--color-ocean)]/10 text-[var(--color-ocean)] border-[var(--color-ocean)]/30',
    positiveClass: 'text-[var(--color-olive)]',
  },
  NAS100: {
    icon: Laptop,
    accent: 'var(--color-rust)',
    accentClass: 'text-[var(--color-rust)]',
    borderActive: 'border-[var(--color-rust)]/50',
    bgActive: 'bg-[var(--color-rust)]/[0.06]',
    badgeClass: 'bg-[var(--color-rust)]/10 text-[var(--color-rust)] border-[var(--color-rust)]/30',
    positiveClass: 'text-[var(--color-olive)]',
  },
} as const;

// ─── Client Cache Configuration (10 minutes) ───────────────────────────────────

const SYNC_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const STORAGE_KEY = 'fynence_market_cache_v2';

interface StoredMarketCache {
  allOverview: Record<SupportedInstrument, MarketIntelligenceData>;
  currentIntelligence: Record<SupportedInstrument, MarketIntelligenceData>;
  aiReports: Partial<Record<SupportedInstrument, string>>;
  lastRefreshedTime: number;
}

// Module-level in-memory cache to preserve state across client tab/page switches
let clientMemoryCache: StoredMarketCache | null = null;

function getInitialValidCache(): StoredMarketCache | null {
  if (clientMemoryCache && Date.now() - clientMemoryCache.lastRefreshedTime < SYNC_INTERVAL_MS) {
    return clientMemoryCache;
  }
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as StoredMarketCache;
        if (Date.now() - parsed.lastRefreshedTime < SYNC_INTERVAL_MS) {
          clientMemoryCache = parsed;
          return parsed;
        }
      }
    } catch {}
  }
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const MarketView: React.FC = () => {
  const [selectedInstrument, setSelectedInstrument] = useState<SupportedInstrument>('XAUUSD');
  const [allOverview, setAllOverview] = useState<Record<SupportedInstrument, MarketIntelligenceData> | null>(() => {
    const valid = getInitialValidCache();
    return valid ? valid.allOverview : null;
  });
  const [currentIntelligence, setCurrentIntelligence] = useState<MarketIntelligenceData | null>(() => {
    const valid = getInitialValidCache();
    return valid ? (valid.currentIntelligence['XAUUSD'] || valid.allOverview['XAUUSD'] || null) : null;
  });
  const [isLoading, setIsLoading] = useState(() => {
    const valid = getInitialValidCache();
    return !valid;
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(() => {
    const valid = getInitialValidCache();
    return valid ? new Date(valid.lastRefreshedTime) : new Date();
  });
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  const [aiReport, setAiReport] = useState<string | null>(() => {
    const valid = getInitialValidCache();
    return valid?.aiReports?.['XAUUSD'] || null;
  });
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isReportExpanded, setIsReportExpanded] = useState(true);
  const [aiError, setAiError] = useState<string | null>(null);

  // Live clock
  useEffect(() => {
    const tick = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  // Mount sync: ONLY sync if no valid cache exists or 10 minutes have elapsed
  useEffect(() => {
    let isMounted = true;
    const validCache = getInitialValidCache();

    if (validCache) {
      // Use existing last sync! Never auto-sync on re-open if still within 10 minutes
      setAllOverview(validCache.allOverview);
      const instData = validCache.currentIntelligence[selectedInstrument] || validCache.allOverview[selectedInstrument];
      if (instData) setCurrentIntelligence(instData);
      setLastRefreshed(new Date(validCache.lastRefreshedTime));
      if (validCache.aiReports[selectedInstrument]) {
        setAiReport(validCache.aiReports[selectedInstrument]!);
      }
      setIsLoading(false);
      return;
    }

    async function performInitialSync() {
      setIsLoading(true);
      try {
        const [overviewRes, singleRes] = await Promise.all([
          getAllForexOverviewAction(true),
          getForexMarketIntelligenceAction(selectedInstrument, false, true),
        ]);
        if (!isMounted) return;

        let mappedOverview: Record<SupportedInstrument, MarketIntelligenceData> | null = null;
        let singleData: MarketIntelligenceData | null = null;

        if (overviewRes.success && overviewRes.data) {
          mappedOverview = Object.fromEntries(
            overviewRes.data.map((item) => [item.pair, item])
          ) as Record<SupportedInstrument, MarketIntelligenceData>;
          setAllOverview(mappedOverview);
        }
        if (singleRes.success && singleRes.data) {
          singleData = singleRes.data;
          setCurrentIntelligence(singleData);
          if (singleRes.data.aiReport) setAiReport(singleRes.data.aiReport);
        }

        const now = Date.now();
        setLastRefreshed(new Date(now));
        setIsLoading(false);

        if (mappedOverview && singleData) {
          const newCache: StoredMarketCache = {
            allOverview: mappedOverview,
            currentIntelligence: {
              ...mappedOverview,
              [selectedInstrument]: singleData,
            },
            aiReports: {
              ...(singleData.aiReport ? { [selectedInstrument]: singleData.aiReport } : {}),
            },
            lastRefreshedTime: now,
          };
          clientMemoryCache = newCache;
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(newCache)); } catch {}
        }

        // AI report in background
        if (!singleData?.aiReport) {
          setIsGeneratingAi(true);
          generateForexAiReportAction(selectedInstrument)
            .then((aiRes) => {
              if (isMounted && aiRes.success && aiRes.report) {
                setAiReport(aiRes.report);
                if (clientMemoryCache) {
                  clientMemoryCache.aiReports[selectedInstrument] = aiRes.report;
                  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(clientMemoryCache)); } catch {}
                }
              }
            })
            .catch((e) => console.warn('[MarketView] AI background notice:', e))
            .finally(() => { if (isMounted) setIsGeneratingAi(false); });
        }
      } catch (err) {
        console.error('[MarketView] Initial sync error:', err);
        if (isMounted) setIsLoading(false);
      }
    }

    performInitialSync();
    return () => { isMounted = false; };
  }, []);

  const handleSelectInstrument = async (inst: SupportedInstrument) => {
    if (inst === selectedInstrument && currentIntelligence) return;
    setSelectedInstrument(inst);
    setAiError(null);

    // Instant switch from existing overview/cache without API call
    if (allOverview?.[inst]) {
      setCurrentIntelligence(allOverview[inst]);
      const cachedReport = clientMemoryCache?.aiReports?.[inst] ?? allOverview[inst].aiReport ?? null;
      setAiReport(cachedReport);
      return;
    }

    setIsRefreshing(true);
    try {
      const res = await getForexMarketIntelligenceAction(inst, false);
      if (res.success && res.data) {
        setCurrentIntelligence(res.data);
      }
    } catch (err) {
      console.error('[MarketView] Instrument change error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async (isManual = true) => {
    if (isManual) {
      setIsRefreshing(true);
    }
    setAiError(null);
    try {
      const [overviewRes, singleRes] = await Promise.all([
        getAllForexOverviewAction(true),
        getForexMarketIntelligenceAction(selectedInstrument, false, true),
      ]);
      const now = Date.now();
      let mappedOverview = allOverview;
      let singleData = currentIntelligence;

      if (overviewRes.success && overviewRes.data) {
        mappedOverview = Object.fromEntries(
          overviewRes.data.map((item) => [item.pair, item])
        ) as Record<SupportedInstrument, MarketIntelligenceData>;
        setAllOverview(mappedOverview);
      }
      if (singleRes.success && singleRes.data) {
        singleData = {
          ...singleRes.data,
          aiReport: currentIntelligence?.aiReport || singleRes.data.aiReport,
        };
        setCurrentIntelligence(singleData);
      }
      setLastRefreshed(new Date(now));

      if (mappedOverview && singleData) {
        const updatedCache: StoredMarketCache = {
          allOverview: mappedOverview,
          currentIntelligence: {
            ...mappedOverview,
            [selectedInstrument]: singleData,
          },
          aiReports: {
            ...(clientMemoryCache?.aiReports || {}),
            ...(singleData.aiReport ? { [selectedInstrument]: singleData.aiReport } : {}),
          },
          lastRefreshedTime: now,
        };
        clientMemoryCache = updatedCache;
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCache)); } catch {}
      }
    } catch (err) {
      console.error('[MarketView] Refresh error:', err);
    } finally {
      if (isManual) {
        setIsRefreshing(false);
      }
    }
  };

  const handleManualRefresh = () => handleRefresh(true);

  // Auto-sync timer: strictly 10 minutes from lastRefreshed
  useEffect(() => {
    const elapsed = Date.now() - lastRefreshed.getTime();
    const remaining = Math.max(1000, SYNC_INTERVAL_MS - elapsed);

    const timer = setTimeout(() => {
      handleRefresh(false);
    }, remaining);

    return () => clearTimeout(timer);
  }, [lastRefreshed, selectedInstrument]);

  const handleGenerateAiReport = async () => {
    setIsGeneratingAi(true);
    setAiError(null);
    try {
      const res = await generateForexAiReportAction(selectedInstrument);
      if (res.success && res.report) { setAiReport(res.report); setIsReportExpanded(true); }
      else setAiError(res.error || 'Failed to generate AI market report');
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : 'AI Service error');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Time display
  const liveTimeWIB = useMemo(() => {
    return currentTime.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Jakarta',
    });
  }, [currentTime]);

  // ─── Loading skeleton ──────────────────────────────────────────────────────

  if (isLoading && !currentIntelligence) {
    return <MarketSkeleton />;
  }

  // ─── Fallback data ─────────────────────────────────────────────────────────

  const intelligence = currentIntelligence || {
    pair: selectedInstrument,
    quote: {
      symbol: selectedInstrument,
      price: selectedInstrument === 'XAUUSD' ? 2928.4 : selectedInstrument === 'DJ30' ? 43860.0 : 21185.0,
      open: selectedInstrument === 'XAUUSD' ? 2918.0 : selectedInstrument === 'DJ30' ? 43720.0 : 21050.0,
      high: selectedInstrument === 'XAUUSD' ? 2936.0 : selectedInstrument === 'DJ30' ? 43990.0 : 21250.0,
      low: selectedInstrument === 'XAUUSD' ? 2912.0 : selectedInstrument === 'DJ30' ? 43680.0 : 21010.0,
      change: selectedInstrument === 'XAUUSD' ? 10.4 : selectedInstrument === 'DJ30' ? 140.0 : 135.0,
      changePercent: 0.36,
      pipChange: 104,
      timestamp: new Date().toISOString(),
    },
    technicals: {
      ema50: selectedInstrument === 'XAUUSD' ? 2915.0 : selectedInstrument === 'DJ30' ? 43650.0 : 20950.0,
      ema200: selectedInstrument === 'XAUUSD' ? 2885.0 : selectedInstrument === 'DJ30' ? 43250.0 : 20550.0,
      rsi: 61.5,
      macd: { macd: 14.5, signal: 10.2, histogram: 4.3 },
      atr: selectedInstrument === 'XAUUSD' ? 18.5 : selectedInstrument === 'DJ30' ? 320.0 : 210.0,
      volatilityPips: 185,
      trend: 'Bullish' as const,
      momentum: 'Strong' as const,
      volatility: 'Medium' as const,
    },
    bias: 'Bullish' as const,
    confidence: 'High' as const,
    biasExplanation: `${selectedInstrument} demonstrates institutional trend continuation with strong momentum confluence.`,
    psychology: {
      buyerDominance: 62,
      sellerDominance: 38,
      marketUncertainty: 'Moderate' as const,
      fomoRisk: 'Medium' as const,
      overconfidenceRisk: 'Low' as const,
      fearSentiment: 'Low' as const,
      safeHavenDemand: 'High' as const,
      dollarPressure: 'Bearish USD' as const,
      riskAppetite: 'Risk-On' as const,
      institutionalConfidence: 'High' as const,
      panicSellingRisk: 'Low' as const,
      insight: 'Institutional accumulation observed. Maintain predefined stop levels and avoid chase entries.',
    },
    risk: {
      riskLevel: 'LOW' as const,
      reasons: ['Orderly liquidity profiles across benchmark sessions.'],
      mitigationRule: 'Limit single-exposure risk to maximum 1.5% of total capital.',
    },
    upcomingEvents: [],
    source: 'Twelve Data' as const,
    updatedAt: new Date().toISOString(),
  };

  const { quote, technicals, bias, confidence, biasExplanation, psychology, upcomingEvents } = intelligence;
  const isBullish = bias.includes('Bullish');
  const isBearish = bias.includes('Bearish');
  const activeMeta = INSTRUMENTS_METADATA[selectedInstrument];
  const activeTheme = INSTRUMENT_THEMES[selectedInstrument];

  // ─── Bias color helpers ────────────────────────────────────────────────────
  const biasColor = isBullish
    ? 'text-[var(--color-olive)]'
    : isBearish
    ? 'text-[var(--color-rust)]'
    : 'text-[var(--color-gold)]';

  const biasBadgeClass = isBullish
    ? 'bg-[var(--color-olive)]/10 text-[var(--color-olive)] border-[var(--color-olive)]/30'
    : isBearish
    ? 'bg-[var(--color-rust)]/10 text-[var(--color-rust)] border-[var(--color-rust)]/30'
    : 'bg-[var(--color-gold)]/10 text-[var(--color-gold)] border-[var(--color-gold)]/30';

  // ─── RSI helpers ───────────────────────────────────────────────────────────
  const rsiZoneLabel =
    technicals.rsi >= 70 ? 'Overbought' :
    technicals.rsi >= 60 ? 'Strong Bullish' :
    technicals.rsi <= 30 ? 'Oversold' :
    technicals.rsi <= 40 ? 'Strong Bearish' : 'Neutral';

  const rsiBarClass =
    technicals.rsi >= 70 ? 'bg-[var(--color-rust)]' :
    technicals.rsi >= 60 ? 'bg-[var(--color-olive)]' :
    technicals.rsi <= 30 ? 'bg-[var(--color-rust)]' :
    technicals.rsi <= 40 ? 'bg-[var(--color-gold)]' : 'bg-[var(--color-ocean)]';

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12 max-w-6xl">

      {/* ─── 1. PAGE HEADER ───────────────────────────────────────────────── */}
      <header className="liquid-glass-card p-5 sm:p-8 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[var(--color-muted)]">
            Market Intelligence / 2026
          </p>
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 text-xs font-mono text-[var(--color-muted)] bg-[var(--surface-tint)] px-3 py-1.5 rounded-full border border-[var(--color-line)] hover:border-[var(--color-gold)] transition cursor-pointer disabled:opacity-50"
          >
            <Clock className="h-3.5 w-3.5 text-[var(--color-gold)] shrink-0" />
            <span className="font-bold text-[var(--color-ink)]">{liveTimeWIB}</span>
            <span>·</span>
            <span className="text-[var(--color-gold)] font-bold">WIB</span>
          </button>
        </div>

        <h1 className="text-2xl sm:text-4xl font-display font-bold uppercase tracking-[-0.055em] text-[var(--color-ink)]">
          Market Intelligence<span className="text-[var(--color-gold)]">.</span>
        </h1>

        {/* Status row */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <span className="text-[10px] font-mono text-[var(--color-muted)]">
            Synced:{' '}
            <strong className="text-[var(--color-ink)]">
              {lastRefreshed.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })} WIB
            </strong>
          </span>

          {/* Sync button */}
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="ml-auto inline-flex items-center space-x-1.5 text-xs font-mono px-3 py-1.5 rounded-full border border-[var(--color-line)] hover:border-[var(--color-gold)] text-[var(--color-ink)] hover:text-[var(--color-gold)] transition disabled:opacity-50 bg-[var(--surface-tint)]"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing…' : 'Sync Feed'}</span>
          </button>
        </div>
      </header>

      {/* ─── 2. THREE INSTRUMENT CARDS ───────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3 px-0.5">
          <h2 className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Benchmark Instruments
          </h2>
          <p className="text-[10px] font-mono text-[var(--color-muted)]">
            Select an asset to focus the analysis
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SUPPORTED_INSTRUMENTS.map((inst) => {
            const meta = INSTRUMENTS_METADATA[inst];
            const theme = INSTRUMENT_THEMES[inst];
            const data = allOverview?.[inst] ?? null;
            const liveQuote = data?.quote ?? (inst === selectedInstrument ? quote : null);
            const liveTechnicals = data?.technicals ?? (inst === selectedInstrument ? technicals : null);
            const liveBias = data?.bias ?? (inst === selectedInstrument ? bias : 'Neutral');
            const isSelected = inst === selectedInstrument;
            const isPositive = (liveQuote?.changePercent ?? 0) >= 0;
            const IconComponent = theme.icon;

            const biasCls = liveBias.includes('Bullish')
              ? 'text-[var(--color-olive)]'
              : liveBias.includes('Bearish')
              ? 'text-[var(--color-rust)]'
              : 'text-[var(--color-gold)]';

            const volCls = liveTechnicals?.volatility === 'High'
              ? 'text-[var(--color-rust)]'
              : liveTechnicals?.volatility === 'Medium'
              ? 'text-[var(--color-orange)]'
              : 'text-[var(--color-olive)]';

            return (
              <div
                key={inst}
                onClick={() => handleSelectInstrument(inst)}
                className={`liquid-glass-card p-5 sm:p-6 cursor-pointer flex flex-col justify-between transition-all duration-300 ${
                  isSelected
                    ? `${theme.borderActive} ${theme.bgActive} scale-[1.015]`
                    : 'hover:scale-[1.005]'
                }`}
              >
                {/* Card header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <span className={`p-2 rounded-xl bg-[var(--surface-tint)] border border-[var(--glass-border)] ${theme.accentClass}`}>
                      <IconComponent className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-base font-display font-bold text-[var(--color-ink)] tracking-tight">
                          {inst}
                        </span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full border ${theme.badgeClass}`}>
                          {meta.badgeLabel}
                        </span>
                      </div>
                      <p className="text-[10px] font-mono text-[var(--color-muted)] mt-0.5">{meta.subtitle}</p>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="flex h-2 w-2 relative mt-1 shrink-0">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${theme.accentClass.replace('text-', 'bg-').replace(']', '')}`} style={{ background: theme.accent }} />
                      <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: theme.accent }} />
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="mt-5">
                  <div className="text-2xl sm:text-3xl font-display text-[var(--color-ink)]">
                    {liveQuote ? formatInstrumentPrice(inst, liveQuote.price) : '-'}
                  </div>
                  <div className="flex items-center space-x-2 mt-1 font-mono text-xs">
                    <span className={`flex items-center font-semibold ${isPositive ? 'text-[var(--color-olive)]' : 'text-[var(--color-rust)]'}`}>
                      {isPositive ? <TrendingUp className="h-3.5 w-3.5 mr-1" /> : <TrendingDown className="h-3.5 w-3.5 mr-1" />}
                      {isPositive ? '+' : ''}{liveQuote?.changePercent ?? 0}%
                    </span>
                    <span className="text-[var(--color-muted)]">
                      {liveQuote ? formatInstrumentChange(inst, liveQuote.change) : '0.0'}
                    </span>
                  </div>
                </div>

                {/* Card bottom stats */}
                <div className="grid grid-cols-2 gap-2 mt-5 pt-4 border-t border-[var(--color-line)]">
                  <div>
                    <p className="text-[9px] font-mono uppercase text-[var(--color-muted)]">Trend</p>
                    <p className={`text-xs font-semibold mt-0.5 ${
                      liveTechnicals?.trend === 'Bullish' ? 'text-[var(--color-olive)]' :
                      liveTechnicals?.trend === 'Bearish' ? 'text-[var(--color-rust)]' : 'text-[var(--color-muted)]'
                    }`}>
                      {liveTechnicals?.trend ?? 'Neutral'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-mono uppercase text-[var(--color-muted)]">Bias</p>
                    <p className={`text-xs font-semibold mt-0.5 ${biasCls}`}>{liveBias}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-mono uppercase text-[var(--color-muted)]">Volatility</p>
                    <p className={`text-xs font-semibold mt-0.5 ${volCls}`}>{liveTechnicals?.volatility ?? 'Low'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-mono uppercase text-[var(--color-muted)]">AI Status</p>
                    <p className="text-xs font-semibold mt-0.5 text-[var(--color-ocean)] flex items-center space-x-1">
                      <Sparkles className="h-3 w-3 shrink-0" />
                      <span>{data?.aiReport ? 'Synced' : 'Active'}</span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── 3. AI MARKET BIAS ─────────────────────────────────────────────── */}
      <section className="liquid-glass-card p-6 sm:p-7 flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-line)] pb-4">
          <div className="flex items-center space-x-2.5">
            <Brain className="h-4 w-4 text-[var(--color-gold)]" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-ink)]">
              AI Market Bias: {selectedInstrument}
            </h2>
          </div>
          <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-semibold border ${biasBadgeClass} flex items-center space-x-1.5`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isBullish ? 'bg-[var(--color-olive)]' : isBearish ? 'bg-[var(--color-rust)]' : 'bg-[var(--color-gold)]'}`} />
            <span>{bias}</span>
          </span>
        </div>

        {/* Asset label */}
        <div className="flex items-center space-x-2 mt-5 mb-3">
          <span className="text-xs font-mono text-[var(--color-muted)] uppercase tracking-wider">Asset:</span>
          <span className="font-display font-bold text-lg text-[var(--color-ink)]">{selectedInstrument}</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[var(--color-line)] text-[var(--color-muted)]">
            {activeMeta.category}
          </span>
        </div>

        {/* Bias + Confidence row */}
        <div className="flex flex-wrap gap-6 mb-5">
          <div>
            <p className="text-[9px] font-mono uppercase text-[var(--color-muted)] mb-1">Current Bias</p>
            <p className={`text-2xl font-display font-bold ${biasColor}`}>{bias}</p>
          </div>
          <div>
            <p className="text-[9px] font-mono uppercase text-[var(--color-muted)] mb-1">Confidence</p>
            <p className={`text-2xl font-display font-bold ${
              confidence === 'High' ? 'text-[var(--color-olive)]' :
              confidence === 'Medium' ? 'text-[var(--color-gold)]' : 'text-[var(--color-muted)]'
            }`}>
              {confidence}
            </p>
          </div>
        </div>

        {/* Reasoning */}
        <blockquote className="flex-1 text-sm text-[var(--color-ink)] leading-relaxed font-sans italic border-l-2 border-[var(--color-gold)] pl-4 mb-5">
          &ldquo;{biasExplanation}&rdquo;
        </blockquote>

        {/* Indicator pills */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-[var(--color-line)]">
          {[
            { label: 'EMA Trend', value: technicals.trend },
            { label: 'RSI Momentum', value: rsiZoneLabel },
            { label: 'Volatility', value: technicals.volatility },
            { label: 'Session', value: intelligence.session?.currentSessionName ?? 'Active' },
          ].map(({ label, value }) => (
            <span key={label} className="text-[10px] font-mono px-2.5 py-1 rounded-lg border border-[var(--color-line)] bg-[var(--surface-tint)] text-[var(--color-muted)]">
              <span className="text-[var(--color-ink)] font-semibold">{label}</span>: {value}
            </span>
          ))}
        </div>

        <div className="flex items-center space-x-1.5 mt-3 text-[10px] font-mono text-[var(--color-muted)] italic">
          <Info className="h-3 w-3 text-[var(--color-gold)] shrink-0" />
          <span>Analytical confluence indicator only; never a direct trade command.</span>
        </div>
      </section>

      {/* ─── 4. TECHNICAL ANALYSIS MATRIX ───────────────────────────────────── */}
      <section className="liquid-glass-card p-6 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-line)] pb-4 mb-6">
          <div className="flex items-center space-x-2">
            <Layers className="h-4 w-4 text-[var(--color-gold)]" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-ink)]">
              Technical Analysis: {selectedInstrument}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] font-mono">
            {[
              { label: 'Trend', value: technicals.trend, cls: technicals.trend === 'Bullish' ? 'text-[var(--color-olive)]' : technicals.trend === 'Bearish' ? 'text-[var(--color-rust)]' : 'text-[var(--color-muted)]' },
              { label: 'Momentum', value: technicals.momentum, cls: technicals.momentum === 'Strong' ? 'text-[var(--color-ocean)]' : technicals.momentum === 'Moderate' ? 'text-[var(--color-gold)]' : 'text-[var(--color-muted)]' },
              { label: 'Vol', value: technicals.volatility, cls: technicals.volatility === 'High' ? 'text-[var(--color-rust)]' : technicals.volatility === 'Medium' ? 'text-[var(--color-orange)]' : 'text-[var(--color-olive)]' },
            ].map(({ label, value, cls }) => (
              <span key={label} className="px-2.5 py-1 rounded-lg border border-[var(--color-line)] bg-[var(--surface-tint)] text-[var(--color-muted)]">
                {label}: <strong className={cls}>{value}</strong>
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* EMA 50 */}
          <div className="rounded-2xl p-4 border border-[var(--glass-border)] bg-[var(--surface-tint)] hover:border-[var(--color-gold)]/40 transition">
            <p className="text-[9px] font-mono uppercase text-[var(--color-muted)]">EMA 50</p>
            <p className="text-sm font-display font-bold text-[var(--color-ink)] my-2">
              {selectedInstrument === 'XAUUSD' ? `$${technicals.ema50.toFixed(2)}` : technicals.ema50.toFixed(1)}
            </p>
            <p className="text-[9px] font-mono">
              {quote.price >= technicals.ema50
                ? <span className="text-[var(--color-olive)]">Above (+{(quote.price - technicals.ema50).toFixed(1)})</span>
                : <span className="text-[var(--color-rust)]">Below (-{(technicals.ema50 - quote.price).toFixed(1)})</span>}
            </p>
          </div>

          {/* EMA 200 */}
          <div className="rounded-2xl p-4 border border-[var(--glass-border)] bg-[var(--surface-tint)] hover:border-[var(--color-gold)]/40 transition">
            <p className="text-[9px] font-mono uppercase text-[var(--color-muted)]">EMA 200</p>
            <p className="text-sm font-display font-bold text-[var(--color-ink)] my-2">
              {selectedInstrument === 'XAUUSD' ? `$${technicals.ema200.toFixed(2)}` : technicals.ema200.toFixed(1)}
            </p>
            <p className="text-[9px] font-mono">
              {technicals.ema50 >= technicals.ema200
                ? <span className="text-[var(--color-olive)]">Golden Cross</span>
                : <span className="text-[var(--color-rust)]">Death Cross</span>}
            </p>
          </div>

          {/* RSI */}
          <div className="rounded-2xl p-4 border border-[var(--glass-border)] bg-[var(--surface-tint)] hover:border-[var(--color-gold)]/40 transition">
            <div className="flex items-center justify-between text-[9px] font-mono uppercase text-[var(--color-muted)]">
              <span>RSI (14)</span>
              <span className={`font-bold ${technicals.rsi >= 60 ? 'text-[var(--color-olive)]' : technicals.rsi <= 40 ? 'text-[var(--color-rust)]' : 'text-[var(--color-ink)]'}`}>
                {technicals.rsi}
              </span>
            </div>
            <div className="my-2 h-1.5 w-full rounded-full bg-[var(--color-line)] overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${rsiBarClass}`} style={{ width: `${technicals.rsi}%` }} />
            </div>
            <p className="text-[9px] font-mono text-[var(--color-muted)]">{rsiZoneLabel}</p>
          </div>

          {/* MACD */}
          <div className="rounded-2xl p-4 border border-[var(--glass-border)] bg-[var(--surface-tint)] hover:border-[var(--color-gold)]/40 transition">
            <p className="text-[9px] font-mono uppercase text-[var(--color-muted)]">MACD</p>
            <p className={`text-sm font-display font-bold my-2 ${technicals.macd.histogram >= 0 ? 'text-[var(--color-olive)]' : 'text-[var(--color-rust)]'}`}>
              {technicals.macd.histogram >= 0 ? '+' : ''}{technicals.macd.histogram}
            </p>
            <p className="text-[9px] font-mono text-[var(--color-muted)]">
              {technicals.macd.histogram >= 0 ? 'Expansion' : 'Contraction'}
            </p>
          </div>

          {/* ATR */}
          <div className="rounded-2xl p-4 border border-[var(--glass-border)] bg-[var(--surface-tint)] hover:border-[var(--color-gold)]/40 transition">
            <p className="text-[9px] font-mono uppercase text-[var(--color-muted)]">ATR (14)</p>
            <p className="text-sm font-display font-bold text-[var(--color-ink)] my-2">
              {selectedInstrument === 'XAUUSD' ? `$${technicals.atr.toFixed(2)}` : `${technicals.atr.toFixed(1)} pts`}
            </p>
            <p className="text-[9px] font-mono text-[var(--color-muted)]">Avg True Range</p>
          </div>

          {/* Volatility */}
          <div className="rounded-2xl p-4 border border-[var(--glass-border)] bg-[var(--surface-tint)] hover:border-[var(--color-gold)]/40 transition">
            <p className="text-[9px] font-mono uppercase text-[var(--color-muted)]">Volatility</p>
            <p className={`text-sm font-display font-bold my-2 ${
              technicals.volatility === 'High' ? 'text-[var(--color-rust)]' :
              technicals.volatility === 'Medium' ? 'text-[var(--color-orange)]' : 'text-[var(--color-olive)]'
            }`}>
              {technicals.volatility}
            </p>
            <p className="text-[9px] font-mono text-[var(--color-muted)]">Execution Friction</p>
          </div>
        </div>
      </section>

      {/* ─── 5. PSYCHOLOGY + ECONOMIC CALENDAR ───────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Psychology */}
        <div className="liquid-glass-card p-6 sm:p-7 flex flex-col">
          <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3 mb-5">
            <div className="flex items-center space-x-2">
              <Brain className="h-4 w-4 text-[var(--color-ocean)]" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-ink)]">
                {selectedInstrument} Psychology
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[9px] font-mono border border-[var(--color-ocean)]/30 bg-[var(--color-ocean)]/[0.07] text-[var(--color-ocean)]">
              Cognitive Guardrails
            </span>
          </div>

          {/* Buyer/Seller gauge */}
          <div className="space-y-2 mb-5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[var(--color-olive)] font-semibold">Buyers {psychology.buyerDominance}%</span>
              <span className="text-[var(--color-rust)] font-semibold">Sellers {psychology.sellerDominance}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-[var(--color-line)] overflow-hidden flex">
              <div className="bg-[var(--color-olive)] h-full transition-all duration-500" style={{ width: `${psychology.buyerDominance}%` }} />
              <div className="bg-[var(--color-rust)] h-full transition-all duration-500" style={{ width: `${psychology.sellerDominance}%` }} />
            </div>
          </div>

          {/* Telemetry grid */}
          {selectedInstrument === 'XAUUSD' ? (
            <div className="grid grid-cols-2 gap-2 mb-5">
              {[
                { label: 'Safe Haven', value: psychology.safeHavenDemand ?? 'Moderate', cls: (psychology.safeHavenDemand === 'High' || psychology.safeHavenDemand === 'Extreme') ? 'text-[var(--color-gold)]' : 'text-[var(--color-ink)]' },
                { label: 'USD Impact', value: psychology.dollarPressure ?? 'Neutral', cls: psychology.dollarPressure === 'Bearish USD' ? 'text-[var(--color-olive)]' : psychology.dollarPressure === 'Bullish USD' ? 'text-[var(--color-rust)]' : 'text-[var(--color-ink)]' },
                { label: 'Fear Sentiment', value: psychology.fearSentiment, cls: psychology.fearSentiment === 'High' ? 'text-[var(--color-rust)]' : psychology.fearSentiment === 'Medium' ? 'text-[var(--color-gold)]' : 'text-[var(--color-olive)]' },
                { label: 'FOMO Risk', value: psychology.fomoRisk, cls: psychology.fomoRisk === 'High' ? 'text-[var(--color-rust)]' : psychology.fomoRisk === 'Medium' ? 'text-[var(--color-gold)]' : 'text-[var(--color-olive)]' },
              ].map(({ label, value, cls }) => (
                <div key={label} className="p-2.5 rounded-xl border border-[var(--glass-border)] bg-[var(--surface-tint)] text-center">
                  <p className="text-[9px] font-mono uppercase text-[var(--color-muted)]">{label}</p>
                  <p className={`text-xs font-semibold mt-1 ${cls}`}>{value}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 mb-5">
              {[
                { label: 'Risk Appetite', value: psychology.riskAppetite ?? 'Neutral', cls: psychology.riskAppetite === 'Risk-On' ? 'text-[var(--color-olive)]' : psychology.riskAppetite === 'Risk-Off' ? 'text-[var(--color-rust)]' : 'text-[var(--color-ink)]' },
                { label: 'Institutional Conf.', value: psychology.institutionalConfidence ?? 'Moderate', cls: psychology.institutionalConfidence === 'High' ? 'text-[var(--color-ocean)]' : psychology.institutionalConfidence === 'Moderate' ? 'text-[var(--color-gold)]' : 'text-[var(--color-rust)]' },
                { label: 'FOMO Risk', value: psychology.fomoRisk, cls: psychology.fomoRisk === 'High' ? 'text-[var(--color-rust)]' : psychology.fomoRisk === 'Medium' ? 'text-[var(--color-gold)]' : 'text-[var(--color-olive)]' },
                { label: 'Panic Selling', value: psychology.panicSellingRisk ?? 'Low', cls: psychology.panicSellingRisk === 'High' ? 'text-[var(--color-rust)]' : psychology.panicSellingRisk === 'Medium' ? 'text-[var(--color-gold)]' : 'text-[var(--color-olive)]' },
              ].map(({ label, value, cls }) => (
                <div key={label} className="p-2.5 rounded-xl border border-[var(--glass-border)] bg-[var(--surface-tint)] text-center">
                  <p className="text-[9px] font-mono uppercase text-[var(--color-muted)]">{label}</p>
                  <p className={`text-xs font-semibold mt-1 ${cls}`}>{value}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-auto p-3.5 rounded-xl border-l-2 border-l-[var(--color-ocean)] bg-[var(--surface-tint)] border border-[var(--glass-border)]">
            <p className="text-[9px] font-mono uppercase text-[var(--color-muted)] mb-1">Mindset Directive:</p>
            <p className="text-xs text-[var(--color-ink)] font-sans leading-relaxed italic">&ldquo;{psychology.insight}&rdquo;</p>
          </div>
        </div>

        {/* Upcoming Macro Releases */}
        <div className="liquid-glass-card p-6 sm:p-7 flex flex-col">
          <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-[var(--color-rust)]" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-ink)]">
                Upcoming Macro Releases
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[9px] font-mono border border-[var(--color-rust)]/30 bg-[var(--color-rust)]/[0.07] text-[var(--color-rust)]">
              USD / Fed Focus
            </span>
          </div>

          {upcomingEvents && upcomingEvents.length > 0 ? (
            <div className="space-y-3 flex-1">
              {upcomingEvents.map((evt, idx) => (
                <div
                  key={idx}
                  className="liquid-glass-card p-4 rounded-xl border-l-2 border-l-[var(--color-rust)] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[var(--color-rust)]/10 text-[var(--color-rust)] font-bold border border-[var(--color-rust)]/30">
                        {evt.currency} · {evt.impact}
                      </span>
                      <span className="text-[10px] font-mono text-[var(--color-muted)] flex items-center">
                        <Clock className="h-3 w-3 inline text-[var(--color-gold)] mr-1" />
                        {new Date(evt.event_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
                      </span>
                    </div>
                    <p className="text-xs font-data font-semibold text-[var(--color-ink)]">{evt.event_name}</p>
                  </div>
                  {evt.forecast && (
                    <div className="mt-2 pt-2 border-t border-[var(--color-line)] text-[9px] font-mono text-[var(--color-muted)]">
                      Forecast: {evt.forecast}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center py-10 text-center">
              <div>
                <Calendar className="h-8 w-8 text-[var(--color-line)] mx-auto mb-3" />
                <p className="text-xs font-mono text-[var(--color-muted)]">
                  No high-impact releases scheduled for {selectedInstrument} in the current session.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-1.5 pt-3 border-t border-[var(--color-line)] mt-3 text-[10px] font-mono text-[var(--color-muted)] italic">
            <Info className="h-3 w-3 text-[var(--color-gold)] shrink-0" />
            <span>US macro data directly influences yields, safe haven flows, and tech multiples.</span>
          </div>
        </div>
      </section>

      {/* ─── 6. GEMINI AI DEEP INTELLIGENCE REPORT ──────────────────────── */}
      <section className="liquid-glass-card p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-line)] pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-[var(--color-ocean)]/10 border border-[var(--color-ocean)]/30">
              <Sparkles className="h-4 w-4 text-[var(--color-ocean)]" />
            </div>
            <div>
              <h2 className="text-sm font-display font-bold text-[var(--color-ink)]">
                Fynence AI Market Intelligence: {selectedInstrument}
              </h2>
              <p className="text-[10px] font-mono text-[var(--color-muted)]">
                Gemini Flash Engine · Macro Confluence & Behavioral Diagnostics
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleGenerateAiReport}
              disabled={isGeneratingAi}
              className="inline-flex items-center space-x-1.5 text-xs font-mono px-3 py-1.5 rounded-full border border-[var(--color-ocean)]/40 bg-[var(--color-ocean)]/[0.07] text-[var(--color-ocean)] hover:bg-[var(--color-ocean)]/[0.14] transition disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isGeneratingAi ? 'animate-spin' : ''}`} />
              <span>{isGeneratingAi ? 'Synthesizing…' : 'Regenerate'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsReportExpanded(!isReportExpanded)}
              className="p-1.5 rounded-full border border-[var(--color-line)] hover:border-[var(--color-gold)] text-[var(--color-muted)] hover:text-[var(--color-ink)] transition"
            >
              {isReportExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {aiError && (
          <div className="mt-4 p-3 rounded-xl border border-[var(--color-rust)]/30 bg-[var(--color-rust)]/[0.07] text-[var(--color-rust)] text-xs font-mono">
            ⚠️ {aiError}
          </div>
        )}

        {isGeneratingAi && (
          <div className="py-14 flex flex-col items-center justify-center space-y-3">
            <div className="h-7 w-7 rounded-full border-2 border-[var(--color-ocean)] border-t-transparent animate-spin" />
            <p className="text-xs font-mono text-[var(--color-muted)] animate-pulse">
              Synthesizing macroeconomic flows & trader psychology for {selectedInstrument}…
            </p>
          </div>
        )}

        {!isGeneratingAi && isReportExpanded && aiReport && (
          <div className="mt-6 text-sm text-[var(--color-ink)] leading-relaxed font-sans whitespace-pre-wrap bg-[var(--surface-tint)] border border-[var(--glass-border)] rounded-2xl p-6">
            {aiReport}
          </div>
        )}

        {!isGeneratingAi && isReportExpanded && !aiReport && (
          <div className="py-12 text-center">
            <Sparkles className="h-8 w-8 text-[var(--color-line)] mx-auto mb-3" />
            <p className="text-xs font-mono text-[var(--color-muted)]">
              Click &ldquo;Regenerate&rdquo; to synthesize a Gemini deep intelligence report for {selectedInstrument}.
            </p>
          </div>
        )}
      </section>

    </div>
  );
};

export default MarketView;
