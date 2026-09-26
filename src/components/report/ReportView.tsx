'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Sparkles,
  RefreshCw,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Activity,
  ShieldAlert,
  Search,
  CheckCircle2,
  DollarSign,
  Coins,
  LineChart,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  MacroReportSynthesis,
  NewsAiEffectItem,
  INITIAL_MACRO_REPORT,
} from '@/services/news/newsAiReportService';
import { getMacroNewsReportAction } from '@/app/actions';

export const ReportView: React.FC = () => {
  const [report, setReport] = useState<MacroReportSynthesis>(INITIAL_MACRO_REPORT);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await getMacroNewsReportAction(true);
      if (res.success && res.data) {
        setReport(res.data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.warn('Failed to refresh live report:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const categories = useMemo(() => {
    return ['All', 'Monetary Policy', 'Treasury & Yields', 'Commodities & Gold', 'Growth & Inflation'];
  }, []);

  const filteredItems = useMemo(() => {
    return report.items.filter((item) => {
      const matchesCategory =
        selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.newsSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.keyTakeaway.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [report.items, selectedCategory, searchQuery]);

  const getImpactBadge = (stance: 'Bullish' | 'Bearish' | 'Neutral') => {
    if (stance === 'Bullish') {
      return {
        style: 'text-[#10B981] bg-[#10B981]/15 border-[#10B981]/30',
        icon: <TrendingUp className="h-3 w-3 shrink-0" />,
      };
    }
    if (stance === 'Bearish') {
      return {
        style: 'text-[#F43F5E] bg-[#F43F5E]/15 border-[#F43F5E]/30',
        icon: <TrendingDown className="h-3 w-3 shrink-0" />,
      };
    }
    return {
      style: 'text-[#F59E0B] bg-[#F59E0B]/15 border-[#F59E0B]/30',
      icon: <Activity className="h-3 w-3 shrink-0" />,
    };
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8 pb-16 animate-in fade-in duration-300">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-xl bg-[#17212B]/60 border border-white/[0.06] p-5 sm:p-7 shadow-2xl backdrop-blur-2xl">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#00F2C2]/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 h-56 w-56 rounded-full bg-[#818CF8]/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#00F2C2]/10 text-[#00F2C2] border border-[#00F2C2]/20">
                <FileText className="h-4 w-4" />
              </span>
              <span className="font-mono text-xs uppercase tracking-wider text-[#00F2C2] font-semibold">
                MACRO INTELLIGENCE REPORT
              </span>
              <span className="font-mono text-[9px] text-[#6FFBBE] bg-[#00A572]/20 px-2 py-0.5 rounded-full font-bold">
                AI SYNTHESIZED
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-[#F8FAFC]">
              Macro News &amp; Effect Dossier<span className="text-[#00F2C2]">.</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#94A3B8] max-w-2xl leading-relaxed">
              Rangkuman komprehensif berita ekonomi global dengan analisis mendalam efek lintas aset
              (USD, Emas, Saham/Indeks) yang diekstrak secara objektif menggunakan AI.
            </p>
          </div>

          {/* Action button */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="shrink-0 flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-xl bg-[#121920]/90 border border-[#00F2C2]/30 hover:border-[#00F2C2]/60 text-[#00F2C2] hover:text-[#6FFBBE] font-mono text-xs font-semibold shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Menganalisis...' : 'Re-Generate AI Report'}</span>
          </button>
        </div>
      </div>

      {/* 2. Master AI Executive Briefing */}
      <div className="rounded-xl bg-[#17212B]/75 border border-white/[0.08] p-5 sm:p-6 backdrop-blur-2xl shadow-xl flex flex-col gap-4">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.05] pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#00F2C2]" />
            <span className="font-mono text-xs uppercase tracking-wider text-[#F8FAFC] font-bold">
              EXECUTIVE MACRO BRIEFING
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-[#64748B]">Dominant Theme:</span>
            <span className="font-mono text-[10px] font-semibold text-[#CBD5E1] bg-[#121920] px-2 py-0.5 rounded border border-white/[0.04]">
              {report.dominantTheme}
            </span>
          </div>
        </div>

        {/* Narrative Paragraph */}
        <div className="rounded-xl bg-[#121920]/80 border border-white/[0.04] p-4 text-xs sm:text-[13px] text-[#E2E8F0] leading-relaxed">
          &ldquo;{report.executiveBriefing}&rdquo;
        </div>

        {/* Cross-Asset Net Posture Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {/* US Dollar */}
          <div className="rounded-xl bg-[#121920]/60 border border-white/[0.04] p-3.5 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-[#38bdf8]" />
                <span className="font-mono text-xs font-bold text-[#F8FAFC]">US DOLLAR (DXY)</span>
              </div>
              <span className="font-mono text-[9px] text-[#38bdf8] bg-[#38bdf8]/10 px-1.5 py-0.5 rounded font-semibold">
                CURRENCY ANCHOR
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              {report.crossAssetPosture.usd}
            </p>
          </div>

          {/* Gold */}
          <div className="rounded-xl bg-[#121920]/60 border border-white/[0.04] p-3.5 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Coins className="h-4 w-4 text-[#eab308]" />
                <span className="font-mono text-xs font-bold text-[#F8FAFC]">GOLD (XAU/USD)</span>
              </div>
              <span className="font-mono text-[9px] text-[#eab308] bg-[#eab308]/10 px-1.5 py-0.5 rounded font-semibold">
                SAFE HAVEN
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              {report.crossAssetPosture.gold}
            </p>
          </div>

          {/* Equities */}
          <div className="rounded-xl bg-[#121920]/60 border border-white/[0.04] p-3.5 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <LineChart className="h-4 w-4 text-[#a855f7]" />
                <span className="font-mono text-xs font-bold text-[#F8FAFC]">EQUITIES (NAS100 / DJ30)</span>
              </div>
              <span className="font-mono text-[9px] text-[#a855f7] bg-[#a855f7]/10 px-1.5 py-0.5 rounded font-semibold">
                RISK ASSETS
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              {report.crossAssetPosture.equities}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#00F2C2] text-[#080B0E] shadow-md'
                  : 'bg-[#17212B]/70 text-[#94A3B8] hover:text-[#F8FAFC] border border-white/[0.05]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="h-3.5 w-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berita atau efek..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#121920]/80 border border-white/[0.06] text-xs text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:border-[#00F2C2]/40"
          />
        </div>
      </div>

      {/* 4. News Dossier Cards with AI Effect Matrix */}
      <div className="flex flex-col gap-4">
        {filteredItems.map((item) => {
          const usdBadge = getImpactBadge(item.aiEffects.usdImpact.stance);
          const goldBadge = getImpactBadge(item.aiEffects.goldImpact.stance);
          const eqBadge = getImpactBadge(item.aiEffects.equitiesImpact.stance);

          return (
            <div
              key={item.id}
              className="rounded-xl bg-[#17212B]/70 border border-white/[0.06] hover:border-white/[0.12] p-4 sm:p-5 backdrop-blur-2xl shadow-xl transition-all flex flex-col gap-3.5 group"
            >
              {/* News Header: Source, Time, Category, External Link */}
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-[#00F2C2] bg-[#00F2C2]/10 border border-[#00F2C2]/20 px-2 py-0.5 rounded-md font-semibold">
                    {item.source}
                  </span>
                  <span className="font-mono text-[10px] text-[#64748B]">
                    {item.publishedAt}
                  </span>
                  <span className="font-mono text-[10px] text-[#94A3B8] bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.05]">
                    {item.category}
                  </span>
                </div>

                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-[11px] text-[#64748B] hover:text-[#00F2C2] transition"
                  >
                    <span>Source</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              {/* News Headline */}
              <h3 className="text-base sm:text-lg font-bold text-[#F8FAFC] leading-snug">
                {item.headline}
              </h3>

              {/* Event Brief / Raw Summary */}
              <p className="text-xs sm:text-[13px] text-[#94A3B8] leading-relaxed bg-[#121920]/50 p-3 rounded-lg border border-white/[0.03]">
                {item.newsSummary}
              </p>

              {/* AI EFFECT MATRIX */}
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center gap-2 font-mono text-[10px] text-[#00F2C2] font-semibold">
                  <Sparkles className="h-3 w-3 text-[#00F2C2]" />
                  <span>AI MARKET EFFECT MATRIX</span>
                  <span className="text-[#64748B]">• Volatility: {item.aiEffects.volatilityRisk}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 font-sans">
                  {/* USD Impact */}
                  <div className="rounded-lg bg-[#121920]/90 border border-white/[0.04] p-3 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase font-bold text-[#F8FAFC]">
                        USD Impact
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 font-mono text-[9px] font-bold px-1.5 py-0.2 rounded border ${usdBadge.style}`}
                      >
                        {usdBadge.icon}
                        {item.aiEffects.usdImpact.stance.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#94A3B8] leading-tight">
                      {item.aiEffects.usdImpact.explanation}
                    </p>
                  </div>

                  {/* Gold Impact */}
                  <div className="rounded-lg bg-[#121920]/90 border border-white/[0.04] p-3 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase font-bold text-[#F8FAFC]">
                        Gold Impact
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 font-mono text-[9px] font-bold px-1.5 py-0.2 rounded border ${goldBadge.style}`}
                      >
                        {goldBadge.icon}
                        {item.aiEffects.goldImpact.stance.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#94A3B8] leading-tight">
                      {item.aiEffects.goldImpact.explanation}
                    </p>
                  </div>

                  {/* Equities Impact */}
                  <div className="rounded-lg bg-[#121920]/90 border border-white/[0.04] p-3 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase font-bold text-[#F8FAFC]">
                        Equities Impact
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 font-mono text-[9px] font-bold px-1.5 py-0.2 rounded border ${eqBadge.style}`}
                      >
                        {eqBadge.icon}
                        {item.aiEffects.equitiesImpact.stance.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#94A3B8] leading-tight">
                      {item.aiEffects.equitiesImpact.explanation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Trader Strategic Takeaway */}
              <div className="mt-1 pt-2.5 border-t border-white/[0.04] flex items-center gap-2">
                <span className="font-mono text-[9px] font-bold text-[#00F2C2] bg-[#00F2C2]/10 border border-[#00F2C2]/20 px-1.5 py-0.5 rounded shrink-0">
                  ACTIONABLE
                </span>
                <span className="text-xs text-[#CBD5E1]">
                  {item.keyTakeaway}
                </span>
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="rounded-xl bg-[#17212B]/40 border border-white/[0.04] p-8 text-center text-xs text-[#64748B] font-mono">
            Tidak ada laporan berita yang sesuai dengan filter pencarian.
          </div>
        )}
      </div>
    </div>
  );
};
