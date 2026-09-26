'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Activity,
  Sparkles,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ExternalLink,
  Clock,
  Globe2,
  Layers,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  ArrowRight,
  Radio,
} from 'lucide-react';
import { FynencePulseData, PulseArticle, PulseSentiment, EconomicImpact } from '@/types/pulse';
import { getFynencePulseAction } from '@/app/actions';

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

const SUB_NEWS_PER_PAGE = 4;

export const FynencePulseWidget: React.FC = () => {
  const [pulseData, setPulseData] = useState<FynencePulseData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [subNewsPage, setSubNewsPage] = useState<number>(0);

  const fetchPulse = useCallback(async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // 1. First try lightweight HTTP endpoint /api/pulse
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
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
    fetchPulse(false);
  }, [fetchPulse]);

  const articles: PulseArticle[] = useMemo(() => {
    return pulseData?.articles || [];
  }, [pulseData]);

  // Partition articles: 1 Hero news (biggest) + remaining for 4-item paginated section
  const heroArticle: PulseArticle | undefined = articles[0];
  const remainingArticles: PulseArticle[] = useMemo(() => {
    return articles.slice(1);
  }, [articles]);

  const totalSubPages = Math.max(1, Math.ceil(remainingArticles.length / SUB_NEWS_PER_PAGE));
  const currentSubArticles = useMemo(() => {
    const start = subNewsPage * SUB_NEWS_PER_PAGE;
    return remainingArticles.slice(start, start + SUB_NEWS_PER_PAGE);
  }, [remainingArticles, subNewsPage]);

  // Sentiment helper styling
  const getSentimentBadge = (sentiment: PulseSentiment) => {
    switch (sentiment) {
      case 'bullish':
        return {
          bg: 'bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-500',
          icon: <TrendingUp className="h-3 w-3 inline mr-1" />,
          label: 'Bullish',
        };
      case 'bearish':
        return {
          bg: 'bg-rose-950/20 text-[var(--color-rust)] border-[var(--color-rust)]/30',
          dot: 'bg-[var(--color-rust)]',
          icon: <TrendingDown className="h-3 w-3 inline mr-1" />,
          label: 'Bearish',
        };
      default:
        return {
          bg: 'bg-[var(--surface-tint)] text-[var(--color-muted)] border-[var(--color-line)]',
          dot: 'bg-[var(--color-gold)]',
          icon: <Activity className="h-3 w-3 inline mr-1" />,
          label: 'Neutral',
        };
    }
  };

  const getImpactBadge = (impact: EconomicImpact) => {
    switch (impact) {
      case 'high':
        return {
          color: 'text-rose-500 border-rose-500/30 bg-rose-500/10',
          label: 'HIGH IMPACT',
        };
      case 'medium':
        return {
          color: 'text-[var(--color-gold)] border-[var(--color-gold)]/30 bg-[var(--color-gold)]/10',
          label: 'MED IMPACT',
        };
      default:
        return {
          color: 'text-[var(--color-muted)] border-[var(--color-line)] bg-[var(--surface-tint)]',
          label: 'LOW IMPACT',
        };
    }
  };

  return (
    <section className="liquid-glass-card p-5 sm:p-7 relative overflow-hidden transition-all duration-300">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-[var(--color-rust)]/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-[var(--color-gold)]/5 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-[var(--color-line)] relative z-10">
        <div>
          <div className="flex items-center space-x-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-rust)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-rust)]"></span>
            </span>
            <span className="terminal-badge text-[var(--color-rust)]">
              FYNENCE PULSE // ECONOMIC RADAR
            </span>
            {pulseData?.status === 'live' ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                NewsAPI Live
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--surface-tint)] text-[var(--color-gold)] border border-[var(--color-gold)]/30">
                Curated Feed
              </span>
            )}
          </div>
          <div className="flex items-baseline space-x-2 mt-1">
            <h2 className="text-xl sm:text-2xl font-display font-bold uppercase tracking-[-0.03em] text-[var(--color-ink)]">
              Fynence Pulse
            </h2>
            <span className="text-xs sm:text-sm font-data italic text-[var(--color-muted)]">
              “AI-powered market awareness”
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-3 text-xs font-mono text-[var(--color-muted)]">
          {pulseData?.lastUpdated && (
            <span className="hidden md:flex items-center">
              <Clock className="h-3.5 w-3.5 mr-1.5 text-[var(--color-gold)]" />
              Synced {formatRelativeTime(pulseData.lastUpdated)}
            </span>
          )}

          <button
            type="button"
            onClick={() => fetchPulse(true)}
            disabled={refreshing || loading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full border border-[var(--color-line)] bg-[var(--surface-tint)] hover:border-[var(--color-gold)] text-[var(--color-ink)] transition-all cursor-pointer disabled:opacity-50"
            title="Refresh NewsAPI & Gemini AI analysis"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[var(--color-rust)] ${refreshing ? 'animate-spin' : ''}`} />
            <span className="font-semibold">{refreshing ? 'Analyzing…' : 'Sync Pulse'}</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && !pulseData && (
        <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-2 border-[var(--color-line)] border-t-[var(--color-rust)] animate-spin" />
            <Sparkles className="h-5 w-5 text-[var(--color-gold)] absolute inset-0 m-auto" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-display font-semibold text-[var(--color-ink)]">
              Synthesizing Global Economic Intelligence…
            </p>
            <p className="text-xs font-mono text-[var(--color-muted)]">
              Fetching NewsAPI wire & deploying Gemini Flash analysis
            </p>
          </div>
        </div>
      )}

      {/* Error Fallback */}
      {error && !pulseData && !loading && (
        <div className="py-8 px-4 rounded-xl border border-rose-500/30 bg-rose-500/5 my-4 flex items-start space-x-3 text-xs font-mono text-rose-600 dark:text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="space-y-1.5 flex-1">
            <p className="font-bold">Failed to load economic intelligence.</p>
            <p className="opacity-90">{error}</p>
            <button
              onClick={() => fetchPulse(true)}
              className="underline hover:no-underline font-bold mt-1 text-[var(--color-rust)] cursor-pointer"
            >
              Retry intelligence query
            </button>
          </div>
        </div>
      )}

      {/* Pulse Content */}
      {pulseData && (
        <div className="space-y-6 pt-5">
          {/* EMPTY STATE */}
          {articles.length === 0 ? (
            <div className="py-12 text-center space-y-2 liquid-glass-card rounded-2xl p-6">
              <Globe2 className="h-8 w-8 text-[var(--color-muted)] mx-auto opacity-50" />
              <p className="text-xs font-mono text-[var(--color-muted)]">
                No macroeconomic news items available.
              </p>
              <button
                type="button"
                onClick={() => fetchPulse(true)}
                className="text-xs font-mono text-[var(--color-rust)] hover:underline"
              >
                Sync latest dispatches
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* ─── 1. HERO NEWS (THE BIGGEST PROMINENT STORY) ────────────────────────── */}
              {heroArticle && (() => {
                const sentimentBadge = getSentimentBadge(heroArticle.marketSentiment);
                const impactBadge = getImpactBadge(heroArticle.economicImpact);

                return (
                  <div className="liquid-glass-card p-5 sm:p-7 rounded-2xl border-2 border-[var(--color-line)] hover:border-[var(--color-gold)]/60 transition-all duration-300 relative overflow-hidden group shadow-[var(--shadow-panel)]">
                    {/* Top ambient highlight */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-rust)]/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 space-y-4">
                      {/* Meta Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--color-line)]">
                        <div className="flex items-center space-x-2">
                          <Radio className="h-3.5 w-3.5 text-[var(--color-rust)] animate-pulse" />
                          <span className="terminal-badge text-[var(--color-rust)]">
                            TOP HEADLINE // {heroArticle.sourceName}
                          </span>
                          <span className="text-[11px] font-mono text-[var(--color-gold)] font-bold">
                            · {heroArticle.topicCategory}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 text-[10px] font-mono">
                          <span className={`px-2 py-0.5 rounded border font-bold uppercase ${impactBadge.color}`}>
                            {impactBadge.label}
                          </span>
                          <span className={`px-2 py-0.5 rounded border flex items-center font-bold uppercase ${sentimentBadge.bg}`}>
                            <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${sentimentBadge.dot}`} />
                            {sentimentBadge.label}
                          </span>
                          <span className="text-[var(--color-muted)] flex items-center ml-1">
                            <Clock className="h-3 w-3 mr-1 text-[var(--color-gold)]" />
                            {formatRelativeTime(heroArticle.publishedAt)}
                          </span>
                        </div>
                      </div>

                      {/* Main Hero Content: 2-column editorial grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
                        {/* Left column: Title, summary, affected assets */}
                        <div className="lg:col-span-7 space-y-3.5">
                          <h3 className="text-base sm:text-xl lg:text-2xl font-display font-bold text-[var(--color-ink)] group-hover:text-[var(--color-rust)] transition-colors leading-snug">
                            <a
                              href={heroArticle.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-baseline"
                            >
                              <span>{heroArticle.title}</span>
                              <ExternalLink className="h-4 w-4 ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 inline text-[var(--color-rust)]" />
                            </a>
                          </h3>

                          <p className="text-xs sm:text-sm font-data text-[var(--color-muted)] leading-relaxed">
                            {heroArticle.shortSummary}
                          </p>

                          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                            {/* Affected assets */}
                            <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                              <span className="text-[var(--color-muted)] font-semibold">Key Assets:</span>
                              {heroArticle.affectedAssets.map((asset, aIdx) => (
                                <span
                                  key={aIdx}
                                  className="px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 border border-[var(--color-line)] text-[var(--color-ink)] font-bold text-[11px]"
                                >
                                  {asset}
                                </span>
                              ))}
                            </div>

                            {/* Direct link button */}
                            <a
                              href={heroArticle.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-xs font-mono font-bold text-[var(--color-rust)] hover:underline"
                            >
                              <span>Read original wire</span>
                              <ArrowRight className="h-3.5 w-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                            </a>
                          </div>
                        </div>

                        {/* Right column: Distinctive Gemini AI Market Impact Callout */}
                        <div className="lg:col-span-5 liquid-glass-card p-4 sm:p-5 rounded-xl border border-[var(--color-gold)]/40 bg-[var(--surface-tint)] space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1.5 text-xs font-mono text-[var(--color-gold)] font-bold">
                              <Sparkles className="h-3.5 w-3.5" />
                              <span>AI MARKET IMPACT</span>
                            </div>
                            <span className="text-[10px] font-mono text-[var(--color-muted)]">
                              Gemini Intelligence
                            </span>
                          </div>

                          <p className="text-xs sm:text-sm font-data text-[var(--color-ink)] leading-relaxed font-medium">
                            {heroArticle.aiInsight}
                          </p>

                          <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-[var(--color-muted)] border-t border-[var(--color-line)]">
                            <span>Volatility Risk: {heroArticle.economicImpact.toUpperCase()}</span>
                            <span>Sentiment Bias: {heroArticle.marketSentiment.toUpperCase()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ─── 2. SUB-NEWS CARDS (4 CARDS PER PAGE WITH NEXT PAGE / SCROLL) ───────── */}
              {remainingArticles.length > 0 && (
                <div className="space-y-3 pt-1">
                  {/* Section Title & Pagination Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                    <div className="flex items-center space-x-2">
                      <Layers className="h-3.5 w-3.5 text-[var(--color-ocean)]" />
                      <h4 className="text-xs font-data font-bold uppercase tracking-wider text-[var(--color-ink)]">
                        More Market Dispatches ({remainingArticles.length})
                      </h4>
                    </div>

                    {/* Pagination Controls ("Next Page / Scroll Kanan") */}
                    {totalSubPages > 1 && (
                      <div className="flex items-center space-x-2 text-xs font-mono">
                        <span className="text-[var(--color-muted)] text-[11px]">
                          Page {subNewsPage + 1} of {totalSubPages}
                        </span>

                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => setSubNewsPage((p) => Math.max(0, p - 1))}
                            disabled={subNewsPage === 0}
                            className="p-1 rounded-lg border border-[var(--color-line)] bg-[var(--surface-tint)] text-[var(--color-ink)] hover:border-[var(--color-gold)] disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                            title="Previous page"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>

                          {/* Dot indicators */}
                          <div className="flex items-center space-x-1 px-1">
                            {Array.from({ length: totalSubPages }).map((_, dotIdx) => (
                              <button
                                key={dotIdx}
                                type="button"
                                onClick={() => setSubNewsPage(dotIdx)}
                                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                                  subNewsPage === dotIdx
                                    ? 'w-4 bg-[var(--color-rust)]'
                                    : 'w-1.5 bg-black/20 dark:bg-white/20 hover:bg-black/40'
                                }`}
                                title={`Go to page ${dotIdx + 1}`}
                              />
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => setSubNewsPage((p) => Math.min(totalSubPages - 1, p + 1))}
                            disabled={subNewsPage >= totalSubPages - 1}
                            className="p-1 rounded-lg border border-[var(--color-line)] bg-[var(--surface-tint)] text-[var(--color-ink)] hover:border-[var(--color-gold)] disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                            title="Next page (scroll kanan)"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 4 Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {currentSubArticles.map((article) => {
                      const sentimentBadge = getSentimentBadge(article.marketSentiment);
                      const impactBadge = getImpactBadge(article.economicImpact);

                      return (
                        <article
                          key={article.id}
                          className="liquid-glass-card p-4 rounded-xl border border-[var(--color-line)] flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 group"
                        >
                          <div className="space-y-2.5">
                            {/* Card Top: Source, published time & impact */}
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className="font-bold text-[var(--color-rust)] uppercase truncate max-w-[100px]">
                                {article.sourceName}
                              </span>
                              <div className="flex items-center space-x-1">
                                <span className={`px-1.5 py-0.2 rounded border font-bold uppercase text-[9px] ${impactBadge.color}`}>
                                  {impactBadge.label}
                                </span>
                                <span className={`px-1.5 py-0.2 rounded border flex items-center font-bold uppercase text-[9px] ${sentimentBadge.bg}`}>
                                  <span className={`h-1 w-1 rounded-full mr-1 ${sentimentBadge.dot}`} />
                                  {sentimentBadge.label}
                                </span>
                              </div>
                            </div>

                            {/* Category & Title */}
                            <div>
                              <span className="text-[10px] font-mono text-[var(--color-gold)] uppercase font-semibold">
                                {article.topicCategory}
                              </span>
                              <h5 className="text-xs font-data font-bold text-[var(--color-ink)] group-hover:text-[var(--color-rust)] transition-colors line-clamp-2 mt-0.5 leading-snug">
                                <a
                                  href={article.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-baseline"
                                >
                                  <span>{article.title}</span>
                                  <ExternalLink className="h-2.5 w-2.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 inline" />
                                </a>
                              </h5>
                            </div>

                            {/* Short summary snippet */}
                            <p className="text-[11px] font-data text-[var(--color-muted)] line-clamp-2 leading-relaxed">
                              {article.shortSummary}
                            </p>

                            {/* Mini AI Impact Callout */}
                            <div className="p-2 rounded-lg bg-[var(--surface-tint)] border border-[var(--color-line)] space-y-1">
                              <div className="flex items-center space-x-1 text-[9px] font-mono text-[var(--color-gold)] font-bold">
                                <Sparkles className="h-2.5 w-2.5" />
                                <span>AI IMPACT</span>
                              </div>
                              <p className="text-[10px] font-data text-[var(--color-ink)] line-clamp-2 leading-tight">
                                {article.aiInsight}
                              </p>
                            </div>
                          </div>

                          {/* Card Footer: Affected assets & time ago */}
                          <div className="mt-3 pt-2 border-t border-[var(--color-line)] flex items-center justify-between text-[10px] font-mono text-[var(--color-muted)]">
                            <div className="flex items-center gap-1 overflow-hidden truncate">
                              {article.affectedAssets.slice(0, 2).map((asset, aIdx) => (
                                <span
                                  key={aIdx}
                                  className="px-1.5 py-0.2 rounded bg-black/5 dark:bg-white/5 text-[var(--color-ink)] font-semibold text-[9px]"
                                >
                                  {asset}
                                </span>
                              ))}
                              {article.affectedAssets.length > 2 && (
                                <span className="opacity-60 text-[9px]">+{article.affectedAssets.length - 2}</span>
                              )}
                            </div>

                            <span className="shrink-0 flex items-center text-[10px]">
                              <Clock className="h-2.5 w-2.5 mr-0.5 text-[var(--color-muted)]" />
                              {formatRelativeTime(article.publishedAt)}
                            </span>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default FynencePulseWidget;
