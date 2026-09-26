'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Globe2,
  RefreshCw,
  AlertTriangle,
  Clock,
  Filter,
  CheckCircle,
  ExternalLink,
  ShieldAlert,
  Search,
  Calendar as CalendarIcon,
  Flame,
  Zap,
  X,
  Info,
  CalendarDays,
  Eye,
} from 'lucide-react';
import { CalendarPeriod } from '@/services/calendar/types';
import { MarketEvent, NewsImpact } from '@/types';
import {
  getTimezoneShort,
  formatEventDateTime,
} from '@/lib/timezone';

type DisplayPeriod = 'today' | 'tomorrow' | 'this_week' | 'custom' | 'next_week' | 'all';

function isDateInPeriod(
  dateStr: string,
  period: DisplayPeriod,
  startDate?: string,
  endDate?: string
): boolean {
  if (period === 'all') return true;
  const eventDate = new Date(dateStr);
  if (isNaN(eventDate.getTime())) return true;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (period === 'today') {
    return eventDate >= todayStart && eventDate <= todayEnd;
  }
  if (period === 'tomorrow') {
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    const tomorrowEnd = new Date(todayEnd);
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
    return eventDate >= tomorrowStart && eventDate <= tomorrowEnd;
  }
  if (period === 'this_week') {
    const dayOfWeek = (now.getDay() + 6) % 7; // Monday = 0
    const startOfWeek = new Date(todayStart);
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return eventDate >= startOfWeek && eventDate <= endOfWeek;
  }
  if (period === 'custom') {
    if (!startDate && !endDate) return true;
    const t = eventDate.getTime();
    const startMs = startDate ? new Date(`${startDate}T00:00:00Z`).getTime() : -Infinity;
    const endMs = endDate ? new Date(`${endDate}T23:59:59Z`).getTime() : Infinity;
    return t >= startMs && t <= endMs;
  }
  if (period === 'next_week') {
    const dayOfWeek = (now.getDay() + 6) % 7;
    const startOfNextWeek = new Date(todayStart);
    startOfNextWeek.setDate(startOfNextWeek.getDate() - dayOfWeek + 7);
    const endOfNextWeek = new Date(startOfNextWeek);
    endOfNextWeek.setDate(endOfNextWeek.getDate() + 6);
    endOfNextWeek.setHours(23, 59, 59, 999);
    return eventDate >= startOfNextWeek && eventDate <= endOfNextWeek;
  }
  return true;
}

export const NewsView: React.FC = () => {
  const {
    marketEvents,
    syncMarketData,
    isSyncingMarket,
    trades,
    setActiveTab,
    setSelectedTradeForDetail,
    timezone,
    openProfileSettings,
  } = useApp();

  const [selectedPeriod, setSelectedPeriod] = useState<DisplayPeriod>('this_week');
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [impactFilter, setImpactFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const selectedTimezone = timezone;

  const activeTzShort = useMemo(() => {
    return getTimezoneShort(selectedTimezone);
  }, [selectedTimezone]);

  // Custom date range inputs
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });

  // Modal State for inspecting an event & correlated trades
  const [selectedEventForModal, setSelectedEventForModal] = useState<MarketEvent | null>(null);

  const handlePeriodChange = (period: DisplayPeriod) => {
    setSelectedPeriod(period);
    if (period !== 'all' && period !== 'custom') {
      syncMarketData(period as CalendarPeriod);
    }
  };

  const handleManualSync = () => {
    if (selectedPeriod === 'custom') {
      syncMarketData({
        period: 'custom',
        startDate: customStartDate,
        endDate: customEndDate,
      });
    } else {
      const syncParam = selectedPeriod === 'all' ? 'this_week' : selectedPeriod;
      syncMarketData(syncParam as CalendarPeriod);
    }
  };

  // Filter events by period, currency, country, impact, search
  const filteredEvents = useMemo(() => {
    return marketEvents.filter((e) => {
      const matchesPeriod = isDateInPeriod(e.event_time, selectedPeriod, customStartDate, customEndDate);
      const matchesCurr = currencyFilter === 'all' || e.currency.toUpperCase() === currencyFilter.toUpperCase();
      const matchesCountry =
        countryFilter === 'all' || (e.country || '').toUpperCase() === countryFilter.toUpperCase();
      const matchesImpact = impactFilter === 'all' || e.impact === impactFilter;
      const matchesSearch =
        !searchQuery ||
        e.event_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.currency.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.country && e.country.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesPeriod && matchesCurr && matchesCountry && matchesImpact && matchesSearch;
    });
  }, [marketEvents, selectedPeriod, customStartDate, customEndDate, currencyFilter, countryFilter, impactFilter, searchQuery]);

  const currencies = useMemo(() => {
    const set = new Set<string>();
    ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'NZD', 'CHF'].forEach((c) => set.add(c));
    marketEvents.forEach((e) => {
      if (e.currency) set.add(e.currency.toUpperCase());
    });
    return Array.from(set).sort();
  }, [marketEvents]);

  const countries = useMemo(() => {
    const set = new Set<string>();
    ['US', 'EU', 'GB', 'JP', 'AU', 'CA', 'CH', 'NZ'].forEach((c) => set.add(c));
    marketEvents.forEach((e) => {
      if (e.country) set.add(e.country.toUpperCase());
    });
    return Array.from(set).sort();
  }, [marketEvents]);

  const highImpactCount = useMemo(() => {
    return filteredEvents.filter((e) => e.impact === 'high').length;
  }, [filteredEvents]);

  // Trades correlated with the currently selected event in modal (±3 hours)
  const relatedTradesForEvent = useMemo(() => {
    if (!selectedEventForModal) return [];
    const eventTime = new Date(selectedEventForModal.event_time).getTime();
    const eventCurr = (selectedEventForModal.currency || '').toUpperCase();

    return trades.filter((trade) => {
      const tradeTime = new Date(trade.open_time || trade.entry_time || trade.created_at || '').getTime();
      if (isNaN(tradeTime) || isNaN(eventTime)) return false;
      const diffMins = Math.round(Math.abs(tradeTime - eventTime) / (60 * 1000));
      if (diffMins > 180) return false;

      const sym = trade.symbol.toUpperCase();
      const isMatched =
        sym.includes(eventCurr) ||
        ((sym.includes('XAU') || sym.includes('GOLD') || sym.includes('BTC') || sym.includes('US30')) && eventCurr === 'USD');

      return isMatched;
    });
  }, [selectedEventForModal, trades]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Top Header & Sync Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--glass-border)] pb-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-[var(--color-gold)]">
            <Globe2 className="h-3.5 w-3.5" />
            <span>GLOBAL MACRO INTELLIGENCE // FAIR ECONOMY & FOREX FACTORY FEED</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-ink)] font-mono mt-1">Forex News Calendar</h1>
          <p className="text-xs text-[var(--color-muted)]">
            Real-time macroeconomic releases and red-folder volatility alerts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Global Timezone Badge in Header */}
          <button
            type="button"
            onClick={() => openProfileSettings('settings')}
            className="flex items-center space-x-1.5 rounded-xl border border-[var(--color-gold)]/40 bg-[var(--glass-bg)] px-3 py-2 text-xs font-mono text-[var(--color-ink)] hover:bg-[var(--color-gold)]/10 transition cursor-pointer"
            title="Zona waktu global. Klik untuk mengubah di Pengaturan Profil"
          >
            <Clock className="h-3.5 w-3.5 text-[var(--color-gold)] shrink-0" />
            <span className="text-[10px] text-[var(--color-gold)] font-bold uppercase">TZ:</span>
            <span className="font-bold">{activeTzShort}</span>
            <span className="text-[10px] text-[var(--color-muted)]">({selectedTimezone})</span>
          </button>

          <button
            onClick={handleManualSync}
            disabled={isSyncingMarket}
            className="flex items-center space-x-2 rounded-xl border border-[var(--color-gold)]/30 bg-amber-950/30 px-4 py-2 text-xs font-mono text-[var(--color-gold)] hover:bg-[var(--color-gold)]/40 hover:border-[var(--color-gold)] transition shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncingMarket ? 'animate-spin text-[var(--color-gold)]' : ''}`} />
            <span>{isSyncingMarket ? 'Syncing Server Feed...' : 'Sync Live News Feed'}</span>
          </button>
        </div>
      </div>

      {/* Period Tabs & Search Filter Bar */}
      <div className="space-y-3">
        {/* Period Selector Tabs */}
        <div className="w-full overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center space-x-1.5 p-1.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] font-mono text-xs min-w-max">
            {(
              [
                { id: 'today', label: 'Today' },
                { id: 'tomorrow', label: 'Tomorrow' },
                { id: 'this_week', label: 'This Week' },
                { id: 'custom', label: 'Custom Date Range' },
                { id: 'next_week', label: 'Next Week' },
                { id: 'all', label: 'All Upcoming' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => handlePeriodChange(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg transition font-medium shrink-0 whitespace-nowrap ${
                  selectedPeriod === tab.id
                    ? 'bg-[var(--color-gold)]/20 text-[var(--color-gold)] border border-[var(--color-gold)]/40 font-bold'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-white/[0.04]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Range Picker Bar (Shown when selectedPeriod === 'custom') */}
        {selectedPeriod === 'custom' && (
          <div className="p-3.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--color-gold)]/30 flex flex-wrap items-center gap-3 font-mono text-xs animate-in fade-in duration-200">
            <span className="text-[var(--color-gold)] font-bold flex items-center space-x-1.5">
              <CalendarDays className="h-4 w-4" />
              <span>PILIH RENTANG TANGGAL:</span>
            </span>
            <div className="flex items-center space-x-2">
              <label className="text-[var(--color-muted)]">Dari:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="rounded-lg border border-[var(--glass-border)] bg-black/20 px-2.5 py-1 text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-gold)]"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-[var(--color-muted)]">Sampai:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="rounded-lg border border-[var(--glass-border)] bg-black/20 px-2.5 py-1 text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-gold)]"
              />
            </div>
            <button
              onClick={handleManualSync}
              disabled={isSyncingMarket}
              className="px-3 py-1 rounded-lg bg-[var(--color-gold)]/20 border border-[var(--color-gold)]/40 text-[var(--color-gold)] font-bold hover:bg-[var(--color-gold)]/30 transition flex items-center space-x-1.5"
            >
              <RefreshCw className={`h-3 w-3 ${isSyncingMarket ? 'animate-spin' : ''}`} />
              <span>Sinkron Rentang Ini</span>
            </button>
          </div>
        )}

        {/* Filters and Search Bar */}
        <div className="liquid-glass-card p-3.5 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[var(--color-muted)]" />
              <input
                type="text"
                placeholder="Search event, currency, country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] text-xs font-mono text-[var(--color-ink)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-gold)]"
              />
            </div>

            {/* Currency Filter */}
            <select
              value={currencyFilter}
              onChange={(e) => setCurrencyFilter(e.target.value)}
              className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-1.5 text-xs font-mono text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-gold)]"
            >
              <option value="all">All Currencies</option>
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Country Filter */}
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-1.5 text-xs font-mono text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-gold)]"
            >
              <option value="all">All Countries</option>
              {countries.map((ct) => (
                <option key={ct} value={ct}>
                  {ct}
                </option>
              ))}
            </select>

            {/* Impact Filter */}
            <select
              value={impactFilter}
              onChange={(e) => setImpactFilter(e.target.value)}
              className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-1.5 text-xs font-mono text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-gold)]"
            >
              <option value="all">All Impacts</option>
              <option value="high">HIGH (Red Folder)</option>
              <option value="medium">MEDIUM (Orange)</option>
              <option value="low">LOW (Yellow)</option>
              <option value="non-economic">Non-Economic</option>
            </select>
          </div>

          <div className="text-xs font-mono text-[var(--color-muted)] shrink-0">
            Showing <span className="text-[var(--color-gold)] font-bold">{filteredEvents.length}</span> Macro Events
          </div>
        </div>
      </div>

      {/* Economic Events Table */}
      <div className="liquid-glass-card overflow-hidden">
        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center space-y-3 font-mono">
            <CalendarIcon className="h-8 w-8 text-[var(--color-muted)] mx-auto opacity-50" />
            <p className="text-sm text-[var(--color-ink)] font-bold">No macroeconomic events matching criteria</p>
            <p className="text-xs text-[var(--color-muted)] max-w-sm mx-auto font-sans">
              No releases scheduled in the selected period with current filters. Try changing the period, filters, or sync live from FairEconomy / Forex Factory.
            </p>
            <button
              onClick={handleManualSync}
              disabled={isSyncingMarket}
              className="px-4 py-2 rounded-xl bg-[var(--color-gold)]/20 hover:bg-[var(--color-gold)]/30 border border-[var(--color-gold)]/40 text-[var(--color-gold)] text-xs font-mono font-bold transition inline-flex items-center space-x-2 mt-2"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncingMarket ? 'animate-spin' : ''}`} />
              <span>Sync Forex Factory Now</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--glass-border)] bg-[var(--glass-bg)] text-[11px] font-mono uppercase text-[var(--color-muted)]">
                  <th className="py-3 px-4">
                    <div className="flex items-center space-x-1.5">
                      <span>TIME</span>
                      <span className="px-1.5 py-0.5 rounded bg-[var(--color-gold)]/20 text-[var(--color-gold)] text-[9px] font-bold">
                        {activeTzShort}
                      </span>
                    </div>
                  </th>
                  <th className="py-3 px-4">CURRENCY</th>
                  <th className="py-3 px-4">IMPACT</th>
                  <th className="py-3 px-4">EVENT</th>
                  <th className="py-3 px-4 text-center">ACTUAL</th>
                  <th className="py-3 px-4 text-center">FORECAST</th>
                  <th className="py-3 px-4 text-center">PREVIOUS</th>
                  <th className="py-3 px-4 text-right">SOURCE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-xs font-mono">
                {filteredEvents.map((event) => {
                  const isHigh = event.impact === 'high';
                  const isMed = event.impact === 'medium';
                  const isLow = event.impact === 'low';

                  const impactStyle = isHigh
                    ? 'bg-[var(--color-rust)]/20 text-[var(--color-rust)] border-[var(--color-rust)]/30'
                    : isMed
                    ? 'bg-[var(--color-gold)]/20 text-[var(--color-gold)] border-[var(--color-gold)]/30'
                    : isLow
                    ? 'bg-[var(--color-olive)]/20 text-[var(--color-olive)] border-[var(--color-olive)]/30'
                    : 'bg-white/[0.05] text-[var(--color-muted)] border-[var(--glass-border)]';

                  const eventFormatted = formatEventDateTime(event.event_time, selectedTimezone);

                  return (
                    <tr
                      key={event.id}
                      onClick={() => setSelectedEventForModal(event)}
                      className="hover:bg-white/[0.03] transition cursor-pointer"
                    >
                      <td className="py-3.5 px-4 text-[var(--color-ink)] whitespace-nowrap">
                        <span className="font-bold block">
                          {eventFormatted.date}
                        </span>
                        <span className="text-[11px] text-[var(--color-muted)] flex items-center space-x-1">
                          <Clock className="h-3 w-3 text-[var(--color-gold)] shrink-0" />
                          <span className="font-bold text-[var(--color-ink)]">
                            {eventFormatted.time}
                          </span>
                          <span className="text-[9px] text-[var(--color-gold)] font-mono">
                            {activeTzShort}
                          </span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-[var(--color-ink)] px-2 py-0.5 rounded bg-white/[0.05] border border-[var(--glass-border)]">
                            {event.currency}
                          </span>
                          {event.country && event.country !== event.currency && (
                            <span className="text-[10px] text-[var(--color-muted)]">{event.country}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${impactStyle}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
                              isHigh
                                ? 'bg-[var(--color-rust)] animate-pulse'
                                : isMed
                                ? 'bg-[var(--color-gold)]'
                                : isLow
                                ? 'bg-[var(--color-olive)]'
                                : 'bg-slate-500'
                            }`}
                          />
                          {event.impact}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[var(--color-ink)]">
                        <div className="flex items-center space-x-2">
                          {isHigh && <Flame className="h-3.5 w-3.5 text-[var(--color-rust)] shrink-0" />}
                          <span className="font-sans text-xs">{event.event_name}</span>
                        </div>
                        {event.description && (
                          <p className="text-[10px] text-[var(--color-muted)] font-normal truncate max-w-xs font-sans mt-0.5">
                            {event.description}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-[var(--color-ocean)]">
                        {event.actual || '--'}
                      </td>
                      <td className="py-3.5 px-4 text-center text-[var(--color-ink)]">
                        {event.forecast || '--'}
                      </td>
                      <td className="py-3.5 px-4 text-center text-[var(--color-muted)]">
                        {event.previous || '--'}
                      </td>
                      <td className="py-3.5 px-4 text-right text-[11px] text-slate-400">
                        {event.source_url ? (
                          <a
                            href={event.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center space-x-1 hover:text-[var(--color-gold)] transition underline underline-offset-2"
                          >
                            <span>{event.source || 'Forex Factory'}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span>{event.source || 'FairEconomy'}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Event Details & Trade Correlation Modal */}
      {selectedEventForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="liquid-glass-glow w-full max-w-2xl rounded-2xl p-6 border-[var(--glass-border)] relative max-h-[90vh] overflow-y-auto space-y-6">
            <button
              onClick={() => setSelectedEventForModal(null)}
              className="absolute top-5 right-5 text-[var(--color-muted)] hover:text-[var(--color-ink)] transition"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[var(--glass-border)]">
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                    selectedEventForModal.impact === 'high'
                      ? 'bg-[var(--color-rust)]/20 text-[var(--color-rust)] border-[var(--color-rust)]/30'
                      : selectedEventForModal.impact === 'medium'
                      ? 'bg-[var(--color-gold)]/20 text-[var(--color-gold)] border-[var(--color-gold)]/30'
                      : 'bg-[var(--color-olive)]/20 text-[var(--color-olive)] border-[var(--color-olive)]/30'
                  }`}>
                    {selectedEventForModal.impact} IMPACT
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/[0.05] border border-[var(--glass-border)] text-[var(--color-ink)]">
                    {selectedEventForModal.currency} • {selectedEventForModal.country || selectedEventForModal.currency}
                  </span>
                </div>
                <h3 className="font-mono font-bold text-lg text-[var(--color-ink)] mt-2">
                  {selectedEventForModal.event_name}
                </h3>
                <p className="font-mono text-xs text-[var(--color-muted)] mt-1 flex flex-wrap items-center gap-2">
                  <span className="flex items-center space-x-1.5 text-[var(--color-ink)] font-bold">
                    <Clock className="h-3.5 w-3.5 text-[var(--color-gold)]" />
                    <span>
                      {formatEventDateTime(selectedEventForModal.event_time, selectedTimezone).full} ({activeTzShort})
                    </span>
                  </span>
                  <span className="text-[11px] text-[var(--color-muted)]">
                    • UTC: {formatEventDateTime(selectedEventForModal.event_time, 'UTC').full} (UTC)
                  </span>
                </p>
              </div>
            </div>

            {/* Metrics Matrix */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-[var(--glass-border)] text-center font-mono">
                <span className="text-[10px] text-[var(--color-muted)] uppercase block">ACTUAL</span>
                <span className="text-lg font-bold text-[var(--color-ocean)] block mt-1">
                  {selectedEventForModal.actual || '--'}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-[var(--glass-border)] text-center font-mono">
                <span className="text-[10px] text-[var(--color-muted)] uppercase block">FORECAST</span>
                <span className="text-lg font-bold text-[var(--color-ink)] block mt-1">
                  {selectedEventForModal.forecast || '--'}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-[var(--glass-border)] text-center font-mono">
                <span className="text-[10px] text-[var(--color-muted)] uppercase block">PREVIOUS</span>
                <span className="text-lg font-bold text-[var(--color-muted)] block mt-1">
                  {selectedEventForModal.previous || '--'}
                </span>
              </div>
            </div>

            {/* Description if present */}
            {selectedEventForModal.description && (
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-[var(--glass-border)] space-y-1">
                <span className="text-[10px] font-mono text-[var(--color-muted)] uppercase block">Deskripsi Rilis</span>
                <p className="text-xs text-[var(--color-ink)]/90 leading-relaxed font-sans">
                  {selectedEventForModal.description}
                </p>
              </div>
            )}

            {/* Trading Context Section (PRD Section 23) */}
            <div className="space-y-3 font-mono">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-[var(--color-ink)] uppercase tracking-wider flex items-center space-x-1.5">
                    <ShieldAlert className="h-4 w-4 text-[var(--color-gold)]" />
                    <span>KONTEKS TRADING ANDA (±3 JAM DARI RILIS)</span>
                  </h4>
                  <p className="text-[10px] text-[var(--color-muted)] mt-0.5">
                    Korelasi kontekstual untuk evaluasi disiplin eksekusi (bukan klaim kausalitas profit/loss)
                  </p>
                </div>
                <span className="text-xs text-[var(--color-gold)] font-bold">
                  {relatedTradesForEvent.length} Trade Terkorelasi
                </span>
              </div>

              {relatedTradesForEvent.length === 0 ? (
                <div className="p-5 rounded-xl bg-white/[0.01] border border-[var(--glass-border)] text-center text-xs text-[var(--color-muted)]">
                  Tidak ada trade pribadi Anda yang dieksekusi dalam jarak ±3 jam dari rilis berita ini. Disiplin penghindaran volatilitas terjaga dengan baik.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {relatedTradesForEvent.map((trade) => {
                    const tradeTime = new Date(trade.open_time || trade.entry_time || trade.created_at || '').getTime();
                    const eventTime = new Date(selectedEventForModal.event_time).getTime();
                    const diffMins = Math.round((tradeTime - eventTime) / (60 * 1000));
                    const isPrior = diffMins < 0;
                    const absDiff = Math.abs(diffMins);
                    const isWin = trade.net_profit_loss > 0;

                    return (
                      <div
                        key={trade.id}
                        className="p-3 rounded-xl bg-white/[0.02] border border-[var(--glass-border)] flex items-center justify-between text-xs hover:border-[var(--color-ocean)]/40 transition"
                      >
                        <div className="flex items-center space-x-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            trade.direction === 'buy'
                              ? 'bg-[var(--color-olive)]/20 text-[var(--color-olive)]'
                              : 'bg-[var(--color-rust)]/20 text-[var(--color-rust)]'
                          }`}>
                            {trade.direction}
                          </span>
                          <span className="font-bold text-[var(--color-ink)]">{trade.symbol}</span>
                          <span className="text-[10px] text-[var(--color-muted)]">
                            {trade.position_size} lots @ {trade.entry_price}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.05] text-[var(--color-gold)]">
                            {absDiff === 0 ? 'Tepat saat berita' : `${absDiff}m ${isPrior ? 'sebelum rilis' : 'setelah rilis'}`}
                          </span>
                        </div>

                        <div className="flex items-center space-x-3">
                          <span className={`font-bold ${isWin ? 'text-[var(--color-olive)]' : 'text-[var(--color-rust)]'}`}>
                            {isWin ? '+' : ''}${trade.net_profit_loss.toFixed(0)}
                          </span>
                          <button
                            onClick={() => {
                              setSelectedEventForModal(null);
                              setSelectedTradeForDetail(trade);
                            }}
                            className="p-1 text-[var(--color-muted)] hover:text-[var(--color-ocean)] transition"
                            title="Inspeksi Trade"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-[var(--glass-border)] font-mono text-xs">
              <div className="text-[10px] text-[var(--color-muted)] flex items-center space-x-1.5">
                <Info className="h-3.5 w-3.5 shrink-0 text-[var(--color-ocean)]" />
                <span>Source: {selectedEventForModal.source || 'Forex Factory'}</span>
              </div>
              <button
                onClick={() => setSelectedEventForModal(null)}
                className="px-4 py-1.5 rounded-xl border border-[var(--glass-border)] bg-white/[0.04] text-[var(--color-ink)] hover:bg-white/[0.08] transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


