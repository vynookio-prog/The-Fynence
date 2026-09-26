'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ArrowUpRight, Brain, AlertCircle } from 'lucide-react';
import { FynencePulseData, PulseSentiment, EconomicImpact } from '@/types/pulse';
import { getFynencePulseAction } from '@/app/actions';

interface DashboardPulseRadarProps {
  initialData?: FynencePulseData | null;
  className?: string;
}

function formatRelativeTime(dateString: string): string {
  try {
    const timestamp = new Date(dateString).getTime();
    const diffSeconds = Math.floor((Date.now() - timestamp) / 1000);

    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    return `${Math.floor(diffSeconds / 86400)}d ago`;
  } catch {
    return 'Recently';
  }
}

export const DashboardPulseRadar: React.FC<DashboardPulseRadarProps> = ({
  initialData,
  className = '',
}) => {
  const [pulseData, setPulseData] = useState<FynencePulseData | null>(initialData || null);
  const [loading, setLoading] = useState<boolean>(!initialData);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPulse = useCallback(async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // 1. Try lightweight HTTP endpoint /api/pulse
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch(`/api/pulse${force ? '?refresh=true' : ''}`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const json = await response.json();
          if (json.success && json.data) {
            setPulseData(json.data);
            return;
          }
        }
      } catch {
        // Fall back to Server Action
      } finally {
        clearTimeout(timeoutId);
      }

      // 2. Fallback to Server Action
      const res = await getFynencePulseAction(force);
      if (res.success && res.data) {
        setPulseData(res.data);
      } else {
        setError(res.error || 'Unable to synchronize Fynence Pulse intelligence.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reach market intelligence service';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!initialData) {
      fetchPulse(false);
    }
  }, [initialData, fetchPulse]);

  const heroArticle = pulseData?.articles?.[0];

  const getSentimentBadge = (sentiment?: PulseSentiment) => {
    switch (sentiment) {
      case 'bullish':
        return {
          bg: 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30',
          dot: 'bg-[#10B981]',
          label: 'BULLISH',
        };
      case 'bearish':
        return {
          bg: 'bg-[#FF8A00]/20 text-[#FF8A00] border-[#FF8A00]/30',
          dot: 'bg-[#FF8A00]',
          label: 'BEARISH',
        };
      default:
        return {
          bg: 'bg-white/[0.05] text-[#94A3B8] border-white/[0.1]',
          dot: 'bg-[#94A3B8]',
          label: 'NEUTRAL',
        };
    }
  };

  const getImpactBadge = (impact?: EconomicImpact) => {
    switch (impact) {
      case 'high':
        return 'bg-[#F43F5E]/20 text-[#F43F5E] border-[#F43F5E]/30';
      case 'medium':
        return 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/30';
      default:
        return 'bg-white/[0.05] text-[#94A3B8] border-white/[0.1]';
    }
  };

  const sentiment = getSentimentBadge(heroArticle?.marketSentiment);
  const impactClass = getImpactBadge(heroArticle?.economicImpact);

  return (
    <div className={`rounded-xl bg-[#17212B]/70 border border-white/[0.06] p-3.5 sm:p-4 backdrop-blur-2xl shadow-xl flex flex-col justify-between ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.04] gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
          <span className="font-mono text-[10px] uppercase text-[#F8FAFC] tracking-widest font-semibold">
            FYNENCE PULSE // ECONOMIC RADAR
          </span>
          <span className="font-mono text-[9px] bg-[#121920] px-1.5 py-0.5 rounded text-[#94A3B8] border border-white/[0.04] hidden sm:inline">
            Curated Feed
          </span>
        </div>

        <button
          onClick={() => fetchPulse(true)}
          disabled={loading || refreshing}
          className="flex items-center gap-1 font-mono text-[10px] text-[#00F2C2] hover:text-[#2EFFCE] transition-colors cursor-pointer disabled:opacity-50"
          title="Sinkronisasi berita & analisis pasar"
        >
          <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Sync Pulse</span>
        </button>
      </div>

      {/* Content */}
      {loading && !pulseData ? (
        <div className="py-6 flex flex-col items-center justify-center gap-1.5 flex-1">
          <RefreshCw className="h-5 w-5 text-[#00F2C2] animate-spin" />
          <span className="font-mono text-[11px] text-[#94A3B8]">Synchronizing economic intelligence...</span>
        </div>
      ) : error && !heroArticle ? (
        <div className="py-6 flex items-center justify-center gap-2 text-center text-xs font-mono text-[#F43F5E] flex-1">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 my-2 flex-1 items-stretch">
          {/* Headline News Panel (Left ~60%) */}
          <div className="lg:col-span-7 p-2.5 sm:p-3 rounded-lg bg-[#121920]/60 border border-white/[0.04] flex flex-col justify-between gap-1.5 shadow-inner">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-mono text-[9px] truncate">
                <span className="text-[#00F2C2] uppercase font-semibold">
                  ● {heroArticle?.sourceName || 'GLOBAL WIRE'}
                </span>
                <span className="text-[#64748B] hidden sm:inline">
                  • {heroArticle?.topicCategory || 'Macroeconomics'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 font-mono text-[9px] shrink-0">
                <span className={`px-1.5 py-0.5 rounded border font-semibold uppercase ${impactClass}`}>
                  {heroArticle?.economicImpact || 'MODERATE'}
                </span>
                <span className={`px-1.5 py-0.5 rounded border font-semibold flex items-center gap-1 ${sentiment.bg}`}>
                  <span className={`w-1 h-1 rounded-full ${sentiment.dot}`} />
                  {sentiment.label}
                </span>
                <span className="text-[#64748B] hidden sm:inline">
                  {heroArticle?.publishedAt ? formatRelativeTime(heroArticle.publishedAt) : 'Recent'}
                </span>
              </div>
            </div>

            <h3 className="text-xs sm:text-sm font-bold text-[#F8FAFC] leading-snug line-clamp-1">
              {heroArticle?.title || pulseData?.macroHeadline || 'Market intelligence synchronized.'}
            </h3>

            <p className="text-[11px] text-[#94A3B8] line-clamp-2 leading-relaxed">
              {heroArticle?.description || heroArticle?.shortSummary || pulseData?.executiveSummary || 'Consolidated financial market overview.'}
            </p>

            {/* Target Asset Pill Ticker & Link */}
            <div className="flex items-center justify-between pt-0.5 gap-2">
              <div className="flex items-center gap-1 font-mono text-[9px]">
                <span className="text-[#64748B] text-[8px]">Assets:</span>
                {(heroArticle?.affectedAssets && heroArticle.affectedAssets.length > 0
                  ? heroArticle.affectedAssets.slice(0, 3)
                  : pulseData?.keyAffectedAssets?.slice(0, 3) || ['USD', 'Gold', 'Crypto']
                ).map((asset, i) => (
                  <span
                    key={i}
                    className="px-1 py-0.5 rounded bg-[#0D1217] text-[#F8FAFC] border border-white/[0.04] text-[8px]"
                  >
                    {asset}
                  </span>
                ))}
              </div>

              {heroArticle?.url && (
                <a
                  href={heroArticle.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[10px] text-[#00F2C2] hover:underline flex items-center gap-0.5 transition-all shrink-0"
                >
                  <span>Wire</span>
                  <ArrowUpRight className="h-2.5 w-2.5" />
                </a>
              )}
            </div>
          </div>

          {/* AI Cognition Engine Panel (Right ~40%) */}
          <div className="lg:col-span-5 p-2.5 sm:p-3 rounded-lg bg-[#121920]/40 border border-white/[0.04] flex flex-col justify-between gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="p-1 rounded-md bg-[#00F2C2]/10 text-[#00F2C2]">
                  <Brain className="h-3 w-3" />
                </div>
                <span className="font-mono text-[9px] text-[#00F2C2] uppercase font-semibold">
                  AI COGNITION
                </span>
              </div>
              <span className="font-mono text-[8px] text-[#64748B] border border-white/[0.04] px-1 py-0.5 rounded bg-[#0D1217]">
                Gemini AI
              </span>
            </div>

            <p className="text-[11px] text-[#94A3B8] line-clamp-3 leading-relaxed">
              {heroArticle?.aiInsight || pulseData?.executiveSummary || 'Macro environment stable. Monitor key technical support levels.'}
            </p>

            <div className="pt-0.5 border-t border-white/[0.03] flex items-center justify-between font-mono text-[8px] text-[#64748B]">
              <span>RISK RADAR ACTIVE</span>
              <span className="text-[#00F2C2]">REALTIME SYNC</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
