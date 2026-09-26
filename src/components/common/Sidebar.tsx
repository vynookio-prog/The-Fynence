'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { ActiveTab } from '@/types';
import {
  LayoutGrid,
  Activity,
  CandlestickChart,
  Globe2,
  FileText,
  Brain,
  Shield,
  PanelLeftClose,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    setActiveTab,
    isSidebarCollapsed,
    toggleSidebar,
    tradingSummary,
    trades,
    tradingAccounts,
  } = useApp();
  const pathname = usePathname();

  // Dynamic calculation for real discipline score in Psych Engine bottom widget
  const closedTrades = useMemo(() => trades.filter((t) => t.status === 'closed'), [trades]);
  const disciplineScore = useMemo(() => {
    if (tradingSummary?.avgDiscipline && tradingSummary.avgDiscipline > 0) {
      return Math.round(tradingSummary.avgDiscipline);
    }
    if (closedTrades.length > 0) {
      const breaches = (tradingSummary?.revengeTradesCount || 0) + (tradingSummary?.fomoTradesCount || 0);
      return Math.max(0, Math.min(100, Math.round(100 - (breaches / closedTrades.length) * 50)));
    }
    return 98.4;
  }, [tradingSummary, closedTrades]);

  const tiltRiskText = useMemo(() => {
    if (disciplineScore >= 85) return 'Zero Tilt Risk';
    if (disciplineScore >= 65) return 'Moderate Tilt Risk';
    return 'High Tilt Risk';
  }, [disciplineScore]);

  // Check if MT5 is connected
  const isMt5Active = useMemo(() => {
    return tradingAccounts?.some((a) => a.is_mt5_synced) || (tradingAccounts && tradingAccounts.length > 0);
  }, [tradingAccounts]);

  const navItems = [
    {
      id: 'dashboard',
      href: '/dashboard',
      label: 'DASHBOARD',
      icon: LayoutGrid,
      rightTag: <span className="font-mono text-[10px] text-[#64748B]">01</span>,
    },
    {
      id: 'market',
      href: '/market',
      label: 'MARKET',
      icon: Activity,
      rightTag: (
        <span className="px-1.5 py-0.5 rounded bg-[#121920] font-mono text-[9px] text-[#00F2C2] border border-white/[0.06] font-semibold">
          AI
        </span>
      ),
    },
    {
      id: 'trading',
      href: '/trading',
      label: 'JOURNAL',
      icon: CandlestickChart,
      rightTag: (
        <span
          className={`w-2 h-2 rounded-full ${isMt5Active ? 'bg-[#10B981] animate-pulse' : 'bg-[#64748B]'}`}
          title={isMt5Active ? 'MT5 Active' : 'Manual'}
        />
      ),
    },
    {
      id: 'news',
      href: '/news',
      label: 'NEWS',
      icon: Globe2,
      rightTag: (
        <span className="font-mono text-[9px] text-[#FF8A00] font-bold px-1.5 py-0.5 rounded bg-[#FF8A00]/10 border border-[#FF8A00]/20">
          LIVE
        </span>
      ),
    },
    {
      id: 'report',
      href: '/report',
      label: 'REPORT',
      icon: FileText,
      rightTag: (
        <span className="font-mono text-[9px] text-[#00F2C2] bg-[#00F2C2]/10 border border-[#00F2C2]/20 font-bold px-1.5 py-0.5 rounded">
          AI
        </span>
      ),
    },
  ] as const;

  return (
    <aside
      className={`fixed left-0 top-0 h-full w-72 bg-[#06090D]/95 backdrop-blur-2xl z-50 flex flex-col justify-between shadow-[0_1px_24px_rgba(0,0,0,0.6)] border-r border-white/[0.05] transition-all duration-300 ease-in-out ${
        isSidebarCollapsed
          ? '-translate-x-full opacity-0 pointer-events-none'
          : 'translate-x-0 opacity-100'
      }`}
      aria-hidden={isSidebarCollapsed}
    >
      <div className="flex flex-col">
        {/* 1. Brand Header */}
        <div className="h-20 px-5 flex items-center justify-between border-b border-white/[0.04]">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 hover:opacity-90 transition group"
          >
            {/* Aerodynamic Squircle Monogram Badge */}
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1E293B] to-[#121920] border border-white/[0.1] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] text-[#00F2C2] shrink-0 group-hover:border-[#00F2C2]/40 transition">
              <span className="font-display font-black text-lg text-transparent bg-clip-text bg-gradient-to-br from-[#F8FAFC] via-[#00F2C2] to-[#00A572]">
                F
              </span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-base font-bold tracking-tight text-[#F8FAFC]">Fynence</span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#00F2C2] inline-block" />
              </div>
              <span className="font-mono text-[9px] text-[#64748B] uppercase tracking-widest leading-none">
                Private Ledger
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-1.5">
            <div className="px-2 py-0.5 rounded-full bg-[#17212B] border border-white/[0.06] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00F2C2] animate-pulse" />
              <span className="font-mono text-[10px] text-[#00F2C2] font-semibold">v2.4</span>
            </div>

            <button
              type="button"
              onClick={toggleSidebar}
              className="p-1 rounded-lg text-[#64748B] hover:text-[#F8FAFC] hover:bg-white/[0.06] transition cursor-pointer ml-1"
              title="Sembunyikan Sidebar (Ctrl+B)"
              aria-label="Toggle sidebar"
            >
              <PanelLeftClose className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* 2. Section Heading */}
        <div className="px-5 pt-4 pb-2">
          <span className="font-mono text-[10px] uppercase text-[#64748B] tracking-widest font-semibold">
            Institutional Navigation
          </span>
        </div>

        {/* 3. Navigation Links */}
        <nav className="flex flex-col gap-1 px-3">
          {navItems.map((item) => {
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard' || pathname === '/'
                : pathname?.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl font-mono text-xs transition-all ${
                  isActive
                    ? 'bg-[#1E293B]/70 text-[#F8FAFC] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] border border-white/[0.04] font-semibold'
                    : 'text-[#94A3B8] hover:bg-[#1E293B]/40 hover:text-[#F8FAFC]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      isActive ? 'text-[#00F2C2]' : 'text-[#64748B] group-hover:text-[#00F2C2]'
                    }`}
                  />
                  <span className="tracking-wider truncate">{item.label}</span>
                </div>
                <div className="shrink-0 pl-2">{item.rightTag}</div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* 4. Bottom Widget: Real Psych Engine Mini-Card */}
      <div className="p-4 border-t border-white/[0.04]">
        <Link
          href="/trading"
          className="p-3.5 rounded-xl bg-[#17212B]/80 border border-white/[0.06] backdrop-blur-xl flex flex-col gap-2 shadow-inner hover:bg-[#17212B] transition group block"
          title="Buka Audit Psikologi Trading"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-[#94A3B8] uppercase tracking-wider">
              Psych Engine
            </span>
            <span className="font-mono text-[10px] text-[#10B981] font-bold">
              {disciplineScore.toFixed(1)} SCORE
            </span>
          </div>

          <div className="h-1.5 w-full bg-[#121920] rounded-full overflow-hidden border border-white/[0.02]">
            <div
              className="h-full bg-gradient-to-r from-[#00A572] to-[#00F2C2] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(5, disciplineScore))}%` }}
            />
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <span className="text-[11px] text-[#94A3B8] group-hover:text-[#F8FAFC] transition-colors">
              {tiltRiskText}
            </span>
            <Shield className="h-3.5 w-3.5 text-[#00F2C2] shrink-0" />
          </div>
        </Link>
      </div>
    </aside>
  );
};
