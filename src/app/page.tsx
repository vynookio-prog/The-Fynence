'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Menu, X } from 'lucide-react';

export default function WelcomePage() {
  const { user } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="welcome-theme min-h-screen bg-[#080B0E] text-[#E2E8F0] relative z-10 w-full overflow-x-hidden selection:bg-[#00F2C2]/20 selection:text-[#00F2C2]">
      {/* Global Subtle Background Effects */}
      <div className="fixed inset-0 grid-pattern pointer-events-none z-0" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[650px] bg-ambient-radial pointer-events-none z-0" />

      {/* NAVIGATION HEADER */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-[#080B0E]/85 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          
          {/* Brand Logo & Lockup */}
          <Link href="/" className="flex items-center gap-3 group">
            {/* Monogram Logo Icon (SVG) */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#0B0F12] border border-white/10 p-1.5 flex items-center justify-center relative overflow-hidden shadow-[0_0_20px_rgba(0,242,194,0.15)] group-hover:border-[#00F2C2]/40 transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00F2C2]/10 to-transparent" />
              <svg viewBox="0 0 100 100" className="w-full h-full relative z-10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 28 C16 14 30 6 48 6 L88 6 C94 6 96 11 91 16 C83 23 68 31 44 33 C24 35 15 30 12 28 Z" fill="#FFFFFF" />
                <path d="M8 58 C12 43 26 35 44 35 L76 35 C82 35 84 40 79 44 C72 50 58 58 36 60 C20 62 12 59 8 58 Z" fill="#E2E8F0" />
                <path d="M14 70 C24 74 34 84 32 94 C24 92 18 84 14 78 Z" fill="url(#cyanFlameNav)" />
                <defs>
                  <linearGradient id="cyanFlameNav" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#047857" />
                    <stop offset="40%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#00F2C2" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Typography Brand Name (Badge AI v2.4 dihapus sesuai permintaan) */}
            <div className="flex items-center">
              <span className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                Fynence<span className="text-[#00F2C2]">.</span>
              </span>
            </div>
          </Link>

          {/* Desktop Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#psychology" className="hover:text-white transition-colors">AI Psychology</a>
            <a href="#metrics" className="hover:text-white transition-colors">Insights</a>
            <a href="#start" className="hover:text-white transition-colors">Pricing</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 sm:gap-4">
            {user ? (
              <Link
                href="/dashboard"
                className="relative group px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold text-[#080B0E] bg-gradient-to-r from-[#00F2C2] to-[#10B981] shadow-[0_0_24px_rgba(0,242,194,0.35)] hover:shadow-[0_0_35px_rgba(0,242,194,0.5)] transition-all flex items-center gap-1.5"
              >
                Dashboard
                <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:block text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="relative group px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold text-[#080B0E] bg-gradient-to-r from-[#00F2C2] to-[#10B981] shadow-[0_0_24px_rgba(0,242,194,0.35)] hover:shadow-[0_0_35px_rgba(0,242,194,0.5)] transition-all flex items-center gap-1.5"
                >
                  Get Started
                  <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
                </Link>
              </>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-slate-400 hover:text-white focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-white/[0.08] bg-[#080B0E]/95 backdrop-blur-2xl px-6 py-4 space-y-3">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-slate-300 hover:text-white py-1.5 text-sm font-medium"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-slate-300 hover:text-white py-1.5 text-sm font-medium"
            >
              How It Works
            </a>
            <a
              href="#psychology"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-slate-300 hover:text-white py-1.5 text-sm font-medium"
            >
              AI Psychology
            </a>
            <a
              href="#metrics"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-slate-300 hover:text-white py-1.5 text-sm font-medium"
            >
              Insights
            </a>
            <a
              href="#start"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-slate-300 hover:text-white py-1.5 text-sm font-medium"
            >
              Pricing
            </a>
            <div className="pt-4 border-t border-white/[0.08] flex flex-col gap-2.5">
              {user ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 rounded-xl text-sm font-semibold text-[#080B0E] bg-gradient-to-r from-[#00F2C2] to-[#10B981]"
                >
                  Go to Dashboard →
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center py-2 text-sm text-slate-300 hover:text-white border border-white/10 rounded-xl"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center py-2.5 rounded-xl text-sm font-semibold text-[#080B0E] bg-gradient-to-r from-[#00F2C2] to-[#10B981]"
                  >
                    Get Started Free →
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-10 pb-16 sm:pt-16 sm:pb-20 md:pt-24 md:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          
          {/* Headline & Introduction (Badge Neuro-Algorithmic Cognition Desk dihapus sesuai permintaan) */}
          <div className="max-w-3xl mb-10 sm:mb-14 text-left">
            <h1 className="font-display text-3xl xs:text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-5 sm:mb-6 text-white">
              Trade smarter.<br />
              <span className="text-gradient-cyan">Understand yourself.</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-slate-400 font-normal leading-relaxed mb-7 sm:mb-8 max-w-2xl">
              Fynence turns raw execution feeds into actionable psychological intelligence. Pinpoint impulsive drift, quantify emotional drawdown down to the cent, and enforce institutional composure.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-3 sm:gap-4 mb-8 sm:mb-10">
              <Link
                href={user ? "/dashboard" : "/signup"}
                className="px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl font-semibold text-[#080B0E] bg-[#00F2C2] hover:bg-[#00e0b3] shadow-[0_4px_25px_rgba(0,242,194,0.3)] hover:shadow-[0_6px_35px_rgba(0,242,194,0.45)] transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {user ? "Open Dashboard" : "Get Started Free"}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              <a
                href="#mockup"
                className="px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl font-semibold text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 backdrop-blur-md transition-all text-center text-sm sm:text-base"
              >
                Explore Fynence
              </a>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2.5 sm:gap-6 pt-4 border-t border-white/[0.06] text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#00F2C2] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>AI-Powered Cognitive Audits</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#00F2C2] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Zero-Latency Automated Sync</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#00F2C2] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Engineered for Prop &amp; Discretionary Traders</span>
              </div>
            </div>

          </div>

          {/* HERO INTERACTIVE DASHBOARD MOCKUP (Layout & Mobile Offset Optimized) */}
          <div
            id="mockup"
            className="relative w-full rounded-2xl sm:rounded-3xl p-[1px] bg-gradient-to-b from-white/15 via-[#00F2C2]/20 to-transparent shadow-[0_30px_100px_rgba(0,0,0,0.85)] backdrop-blur-3xl scroll-mt-20"
          >
            <span id="metrics" className="absolute -top-24" />
            <div className="rounded-2xl sm:rounded-3xl glass-vision p-3.5 sm:p-6 md:p-8 relative overflow-hidden">
              
              {/* Radial Backdrop Glow */}
              <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#00F2C2]/10 rounded-full blur-3xl pointer-events-none" />

              {/* Mockup Top Control Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-4 pb-3 sm:pb-6 border-b border-white/[0.08] relative z-10">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex gap-1.5 sm:gap-2">
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500/80" />
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500/80" />
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-mono text-slate-400 tracking-wider uppercase pl-2 border-l border-white/10">
                    Fynence Terminal
                  </span>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-[#00F2C2]/10 border border-[#00F2C2]/25 text-[#00F2C2] text-[10px] sm:text-xs font-mono">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#00F2C2] animate-pulse" />
                    LIVE AUDIT ACTIVE
                  </div>
                  <span className="text-[10px] sm:text-xs font-mono text-slate-400 hidden sm:inline">
                    SESSION: LONDON/NY OVERLAP
                  </span>
                </div>
              </div>

              {/* Key Metrics Grid (Adjusted sizing and wrapping for zero mobile offset) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 my-4 sm:my-6 relative z-10">
                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between overflow-hidden">
                  <span className="text-[10px] sm:text-xs font-mono text-slate-400 uppercase tracking-wider block mb-0.5 truncate">
                    Net Realized PnL
                  </span>
                  <div className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold font-mono text-[#00F2C2] truncate tracking-tight">
                    +$24,180.50
                  </div>
                  <span className="text-[10px] sm:text-xs text-emerald-400 mt-1 inline-block font-mono truncate">
                    ↑ +34.2% MTD Gain
                  </span>
                </div>

                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between overflow-hidden">
                  <span className="text-[10px] sm:text-xs font-mono text-slate-400 uppercase tracking-wider block mb-0.5 truncate">
                    Profit Factor
                  </span>
                  <div className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold font-mono text-white tracking-tight">
                    1.85
                  </div>
                  <span className="text-[10px] sm:text-xs text-slate-400 mt-1 inline-block font-mono truncate">
                    +1.55 Baseline Goal
                  </span>
                </div>

                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between overflow-hidden">
                  <span className="text-[10px] sm:text-xs font-mono text-slate-400 uppercase tracking-wider block mb-0.5 truncate">
                    Win Rate
                  </span>
                  <div className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold font-mono text-white tracking-tight">
                    74.2%
                  </div>
                  <span className="text-[10px] sm:text-xs text-[#00F2C2] mt-1 inline-block font-mono truncate">
                    54W • 19L Verified
                  </span>
                </div>

                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between overflow-hidden">
                  <span className="text-[10px] sm:text-xs font-mono text-slate-400 uppercase tracking-wider block mb-0.5 truncate">
                    Avg Win / Loss
                  </span>
                  <div className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold font-mono text-white tracking-tight">
                    2.14x
                  </div>
                  <span className="text-[10px] sm:text-xs text-slate-400 mt-1 inline-block font-mono truncate">
                    +$612 / -$286 Exp
                  </span>
                </div>
              </div>

              {/* PnL Chart & Psychology Audit Split */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 relative z-10">
                
                {/* Execution Curve Chart Card */}
                <div className="lg:col-span-2 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between">
                  <div className="flex items-start sm:items-center justify-between gap-2 mb-3 sm:mb-4">
                    <div>
                      <h4 className="text-xs sm:text-sm font-semibold text-white">Cumulative Execution Equity Curve</h4>
                      <p className="text-[11px] sm:text-xs text-slate-400">Micro-second tick fills cross-referenced with trader cognitive state</p>
                    </div>
                    <span className="text-[10px] sm:text-xs font-mono px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-[#00F2C2]/10 text-[#00F2C2] border border-[#00F2C2]/20 shrink-0">
                      CUMULATIVE
                    </span>
                  </div>

                  {/* Interactive Chart SVG (Safely scaled for mobile) */}
                  <div className="w-full h-36 sm:h-48 py-1 sm:py-2 overflow-hidden">
                    <svg viewBox="0 0 600 160" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                      <defs>
                        <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#00F2C2" stopOpacity="0.3" />
                          <stop offset="60%" stopColor="#00F2C2" />
                          <stop offset="100%" stopColor="#10B981" />
                        </linearGradient>
                        <linearGradient id="curveArea" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#00F2C2" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#00F2C2" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      
                      {/* Gridlines */}
                      <line x1="0" y1="40" x2="600" y2="40" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
                      <line x1="0" y1="80" x2="600" y2="80" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
                      <line x1="0" y1="120" x2="600" y2="120" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
                      
                      {/* Filled Area */}
                      <path d="M 10 135 Q 120 125 180 110 T 320 95 T 440 45 T 590 20 L 590 150 L 10 150 Z" fill="url(#curveArea)" />
                      
                      {/* Main Curve Path */}
                      <path d="M 10 135 Q 120 125 180 110 T 320 95 T 440 45 T 590 20" fill="none" stroke="url(#curveGradient)" strokeWidth="3.5" strokeLinecap="round" />
                      
                      {/* Emotional Tilt Marker */}
                      <circle cx="320" cy="95" r="5" fill="#EF4444" />
                      <line x1="320" y1="95" x2="320" y2="135" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="2" />
                      <text x="328" y="90" fill="#F87171" fontSize="11" fontFamily="monospace">
                        Revenge Entry (-$672)
                      </text>

                      {/* Final ATH Node */}
                      <circle cx="590" cy="20" r="6" fill="#00F2C2" stroke="#080B0E" strokeWidth="2" />
                    </svg>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 sm:pt-3 border-t border-white/[0.04] text-[10px] sm:text-xs font-mono text-slate-500">
                    <span>08:00 OPEN</span>
                    <span className="hidden xs:inline">10:00 MACRO</span>
                    <span className="hidden sm:inline">12:30 SPREAD</span>
                    <span className="text-[#00F2C2]">16:00 ATH</span>
                  </div>
                </div>

                {/* Psychology Leakage Breakdown Card */}
                <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <span className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-slate-400">Psychology Audit</span>
                      <span className="text-[10px] sm:text-xs font-bold font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                        -$2,876.00 LEAK
                      </span>
                    </div>

                    <div className="space-y-2.5 sm:space-y-3.5">
                      <div className="p-2 sm:p-2.5 rounded-xl bg-black/20 border border-white/[0.04]">
                        <div className="flex justify-between text-[11px] sm:text-xs mb-1">
                          <span className="text-slate-300">Holding Losers Past SL</span>
                          <span className="font-mono text-red-400 font-semibold">-$1,832.00</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                          <div className="h-full bg-red-500 rounded-full" style={{ width: '65%' }} />
                        </div>
                      </div>

                      <div className="p-2 sm:p-2.5 rounded-xl bg-black/20 border border-white/[0.04]">
                        <div className="flex justify-between text-[11px] sm:text-xs mb-1">
                          <span className="text-slate-300">Revenge Re-entries</span>
                          <span className="font-mono text-red-400 font-semibold">-$672.00</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                          <div className="h-full bg-orange-500 rounded-full" style={{ width: '25%' }} />
                        </div>
                      </div>

                      <div className="p-2 sm:p-2.5 rounded-xl bg-black/20 border border-white/[0.04]">
                        <div className="flex justify-between text-[11px] sm:text-xs mb-1">
                          <span className="text-slate-300">Cutting Winners Pre-TP</span>
                          <span className="font-mono text-amber-400 font-semibold">-$372.00</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: '15%' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Discipline Score Gauge */}
                  <div className="mt-4 sm:mt-5 p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-black/40 to-[#00F2C2]/5 border border-white/[0.08] flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 uppercase block">Discipline Index</span>
                      <span className="text-[11px] sm:text-xs font-semibold text-[#00F2C2]">Tier-1 Composure</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-2xl sm:text-3xl font-bold font-mono text-white">87<span className="text-xs sm:text-sm text-slate-500">/100</span></span>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          </div>

        </div>
      </section>

      {/* SECTION 2: PRODUCT PHILOSOPHY & COGNITION MAPPING */}
      <section id="psychology" className="py-16 sm:py-24 border-t border-white/[0.06] relative scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-[10px] sm:text-xs font-mono uppercase tracking-widest text-[#00F2C2] mb-4">
              Behavioral Cognitive Mapping
            </div>
            <h2 className="font-display text-2xl xs:text-3xl sm:text-5xl font-bold tracking-tight mb-4 sm:mb-6 text-white">
              Every trade tells a story.<br />
              <span className="text-gradient-cyan">Fynence helps you understand it.</span>
            </h2>
            <p className="text-slate-400 text-sm sm:text-lg leading-relaxed">
              Your trading journal logs what happened. Fynence uncovers why it happened, cross-referencing execution fills with reaction latency and macroeconomic shifts.
            </p>
          </div>

          {/* Feature Tags */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-10 sm:mb-16">
            <span className="px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-[#00F2C2]/10 border border-[#00F2C2]/30 text-[#00F2C2] text-[11px] sm:text-xs font-mono">Discipline Matrix</span>
            <span className="px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300 text-[11px] sm:text-xs font-mono">Psychological Tax</span>
            <span className="px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300 text-[11px] sm:text-xs font-mono">Risk Anomalies</span>
            <span className="px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300 text-[11px] sm:text-xs font-mono">Performance Streaks</span>
            <span className="px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300 text-[11px] sm:text-xs font-mono">Trading Habit Loops</span>
          </div>

          {/* Behavioral Audit Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            
            <div className="glass-card p-5 sm:p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <span className="text-[11px] sm:text-xs font-mono text-red-400 uppercase tracking-wider">CRITICAL TRAP • -$14,548.30</span>
                <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2">Revenge Re-entries</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-4">
                After taking an initial loss on NASDAQ futures, you re-enter within 22 minutes on 84% larger position sizes. 9 of the last 11 re-entries resulted in doubled drawdowns.
              </p>
              <div className="text-[11px] sm:text-xs font-mono text-[#00F2C2] flex items-center gap-1.5">
                <span>RULE PRESCRIBED: 45 MIN TIME-LOCK</span>
              </div>
            </div>

            <div className="glass-card p-5 sm:p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <span className="text-[11px] sm:text-xs font-mono text-amber-400 uppercase tracking-wider">MODERATE DRIFT • -$2,919.00</span>
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2">Greed-Driven Gains Surrender</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-4">
                Days starting with +$1,500 before 10:00 AM EST consistently convert into red sessions by overtrading liquid lunch ranges.
              </p>
              <div className="text-[11px] sm:text-xs font-mono text-[#00F2C2] flex items-center gap-1.5">
                <span>TRIGGER: AUTO-LOCK AFTER +2R TARGET</span>
              </div>
            </div>

            <div className="glass-card p-5 sm:p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <span className="text-[11px] sm:text-xs font-mono text-emerald-400 uppercase tracking-wider">REDUCIBLE LEAK • -$2,335.63</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2">Chasing Break-Outs</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-4">
                Entering market-orders after 3 green 5m candles result in an adverse excursion average of 18 pips before stop-out.
              </p>
              <div className="text-[11px] sm:text-xs font-mono text-[#00F2C2] flex items-center gap-1.5">
                <span>LIMIT ORDERS ENFORCEMENT READY</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 3: HOW IT WORKS */}
      <section id="how-it-works" className="py-16 sm:py-24 border-t border-white/[0.06] bg-[#0A0D10]/50 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
            <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-[#00F2C2] block mb-2 sm:mb-3">
              HOW IT WORKS
            </span>
            <h2 className="font-display text-2xl xs:text-3xl sm:text-5xl font-bold tracking-tight mb-3 sm:mb-4 text-white">
              From a filled order to <span className="text-gradient-cyan">a habit you can fix.</span>
            </h2>
            <p className="text-slate-400 text-sm sm:text-lg">
              Fynence transforms raw fills into an automated feedback loop that strengthens your execution edge with zero friction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            
            {/* Step 1 */}
            <div className="glass-card p-6 sm:p-8 rounded-2xl relative">
              <div className="text-3xl sm:text-4xl font-mono font-bold text-white/20 mb-4 sm:mb-6">01</div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">Connect Your Broker</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6">
                Link your broker account via read-only API or drag-and-drop CSV exports. Every ticket, fill price, commission, and execution timestamp syncs in under 2 seconds.
              </p>
              <div className="pt-4 border-t border-white/[0.06] flex items-center gap-2 text-[11px] sm:text-xs font-mono text-[#00F2C2]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00F2C2]" />
                <span>MetaTrader 4/5, TradeLocker, NinjaTrader</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="glass-card p-6 sm:p-8 rounded-2xl relative">
              <div className="text-3xl sm:text-4xl font-mono font-bold text-[#00F2C2]/40 mb-4 sm:mb-6">02</div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">Reflect While Fresh</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6">
                Prompted reflections immediately following trade close. Record emotional states (Calm, Edgy, Euphoric) and state setup conviction while memory is unclouded by hindsight.
              </p>
              <div className="pt-4 border-t border-white/[0.06] flex items-center gap-2 text-[11px] sm:text-xs font-mono text-[#00F2C2]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00F2C2]" />
                <span>Micro-Journaling • Invalidation Tags</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="glass-card p-6 sm:p-8 rounded-2xl relative">
              <div className="text-3xl sm:text-4xl font-mono font-bold text-emerald-400/40 mb-4 sm:mb-6">03</div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">Get Algorithmic Audits</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6">
                Fynence continuously runs multi-session behavioral regressions, highlighting setup efficacy, psychological tax metrics, and pre-session vulnerability warnings.
              </p>
              <div className="pt-4 border-t border-white/[0.06] flex items-center gap-2 text-[11px] sm:text-xs font-mono text-[#00F2C2]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00F2C2]" />
                <span>Tailored Pre-Market Action Plan</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 4: SIX PILLARS OF ANALYTICAL SUPREMACY */}
      <section id="features" className="py-16 sm:py-24 border-t border-white/[0.06] scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
            <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-[#00F2C2] block mb-2 sm:mb-3">
              INSTITUTIONAL DESK SPECIFICATIONS
            </span>
            <h2 className="font-display text-2xl xs:text-3xl sm:text-5xl font-bold tracking-tight mb-3 sm:mb-4 text-white">
              Six pillars of analytical supremacy.
            </h2>
            <p className="text-slate-400 text-sm sm:text-lg">
              Crafted specifically for algorithmic traders, discretionary prop executors, and family desks demanding ruthless operational clarity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            
            {/* Pillar 1 */}
            <div className="glass-card p-5 sm:p-6 rounded-2xl">
              <div className="text-xs font-mono text-[#00F2C2] mb-2 sm:mb-3">01 // PSYCHOLOGY</div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2">AI Trading Psychology</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                A comprehensive neuro-cognitive profile generated directly from your broker ticket stream. Detects frustration, overconfidence, revenge loops, and sizing tilts.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="glass-card p-5 sm:p-6 rounded-2xl">
              <div className="text-xs font-mono text-[#00F2C2] mb-2 sm:mb-3">02 // EXECUTION</div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2">Algorithmic Trading Journal</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Automated execution captures paired with dynamic multi-timeframe chart snapshots at the exact second of fill. Say goodbye to manual journal maintenance forever.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="glass-card p-5 sm:p-6 rounded-2xl">
              <div className="text-xs font-mono text-[#00F2C2] mb-2 sm:mb-3">03 // ANALYTICS</div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2">Performance Analytics</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Monte Carlo distributions, Sharpe/Sortino ratios, MAE/MFE scatterplots, and hold-time correlation matrices designed to satisfy institutional capital allocators.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="glass-card p-5 sm:p-6 rounded-2xl">
              <div className="text-xs font-mono text-[#00F2C2] mb-2 sm:mb-3">04 // RISK</div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2">Dynamic Risk Management</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Pre-flight checks, position sizing governors based on real-time ATR, and emergency desk cooling triggers configured to safeguard prop-challenge evaluations.
              </p>
            </div>

            {/* Pillar 5 */}
            <div className="glass-card p-5 sm:p-6 rounded-2xl">
              <div className="text-xs font-mono text-[#00F2C2] mb-2 sm:mb-3">05 // ALPHA</div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2">Execution Insights &amp; Edge</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Compare model performance across session opens, news catalysts, and spread expansions to definitively identify which setups earn money and which only churn broker commission.
              </p>
            </div>

            {/* Pillar 6 */}
            <div className="glass-card p-5 sm:p-6 rounded-2xl">
              <div className="text-xs font-mono text-[#00F2C2] mb-2 sm:mb-3">06 // REPORTING</div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2">Institutional Briefs &amp; Reports</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Receive automated pre-market macro digests and end-of-week PDF tearsheets engineered for prop firm audits, investor transparency, or private performance retrospectives.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section id="start" className="py-16 sm:py-24 border-t border-white/[0.06] relative overflow-hidden scroll-mt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          
          <div className="p-6 sm:p-12 md:p-16 rounded-3xl glass-vision border border-white/10 relative overflow-hidden shadow-[0_20px_80px_rgba(0,242,194,0.15)]">
            
            {/* Background Ambient Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#00F2C2]/10 via-transparent to-transparent pointer-events-none" />

            <span className="inline-block text-[10px] sm:text-xs font-mono uppercase tracking-widest text-[#00F2C2] px-3 py-1 rounded-full bg-[#00F2C2]/10 border border-[#00F2C2]/30 mb-4 sm:mb-6">
              START TRADING WITH COMPLETE CLARITY
            </span>

            <h2 className="font-display text-2xl xs:text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4 sm:mb-6 text-white">
              Better trading starts with<br />
              <span className="text-gradient-cyan">understanding your last trade.</span>
            </h2>

            <p className="text-slate-400 text-sm sm:text-base md:text-lg max-w-xl mx-auto mb-8 sm:mb-10 leading-relaxed">
              Build a rigorous execution process founded on your own data, unadulterated behavior, and mathematical risk management.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link
                href={user ? "/dashboard" : "/signup"}
                className="w-full sm:w-auto px-7 sm:px-8 py-3.5 sm:py-4 rounded-xl font-bold text-[#080B0E] bg-gradient-to-r from-[#00F2C2] to-[#10B981] shadow-[0_0_30px_rgba(0,242,194,0.4)] hover:shadow-[0_0_45px_rgba(0,242,194,0.6)] transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {user ? "Open Dashboard" : "Get Started Free"}
                <span className="text-lg">→</span>
              </Link>
            </div>

            <p className="text-[11px] sm:text-xs font-mono text-slate-500 mt-4 sm:mt-6">
              ✓ No credit card required &nbsp;•&nbsp; ✓ Instant MT4/MT5 sync
            </p>

          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 sm:py-16 border-t border-white/[0.06] bg-[#050709] text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 sm:gap-10 mb-10 sm:mb-12">
            
            {/* Brand Summary */}
            <div className="col-span-2 md:col-span-2">
              <div className="flex items-center gap-2.5 mb-3 sm:mb-4">
                <div className="w-7 h-7 rounded-lg bg-[#0B0F12] border border-white/10 p-1 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
                    <path d="M12 28 C16 14 30 6 48 6 L88 6 C94 6 96 11 91 16 C83 23 68 31 44 33 C24 35 15 30 12 28 Z" fill="#FFFFFF" />
                    <path d="M8 58 C12 43 26 35 44 35 L76 35 C82 35 84 40 79 44 C72 50 58 58 36 60 C20 62 12 59 8 58 Z" fill="#E2E8F0" />
                    <path d="M14 70 C24 74 34 84 32 94 C24 92 18 84 14 78 Z" fill="#00F2C2" />
                  </svg>
                </div>
                <span className="font-display text-xl font-bold text-white">
                  Fynence<span className="text-[#00F2C2]">.</span>
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed max-w-sm text-xs sm:text-sm">
                High-conviction algorithmic journal and cognitive risk intelligence. Engineered for systematic market participants seeking institutional composure.
              </p>
              <div className="mt-3 sm:mt-4 font-mono text-[10px] sm:text-[11px] text-[#00F2C2] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00F2C2] animate-ping" />
                SYSTEM COGNITION ENGINE ACTIVE
              </div>
            </div>

            {/* Links Column 1: Product */}
            <div>
              <h5 className="text-white font-semibold mb-3 font-mono uppercase tracking-wider text-[11px]">Product</h5>
              <ul className="space-y-2">
                <li><a href="#psychology" className="hover:text-white transition-colors">AI Desk Audit</a></li>
                <li><a href="#psychology" className="hover:text-white transition-colors">Cognitive Tax Metric</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Execution Bias Matrix</a></li>
                <li><a href="#mockup" className="hover:text-white transition-colors">Discipline Dial</a></li>
                <li><a href="#mockup" className="hover:text-white transition-colors">Live Telemetry</a></li>
              </ul>
            </div>

            {/* Links Column 2: Resources */}
            <div>
              <h5 className="text-white font-semibold mb-3 font-mono uppercase tracking-wider text-[11px]">Resources</h5>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-white transition-colors">Quant Methodology</a></li>
                <li><a href="#psychology" className="hover:text-white transition-colors">Neuro-Finance Papers</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Risk Models</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">API Documentation</a></li>
                <li><a href="#mockup" className="hover:text-white transition-colors">Terminal Guide</a></li>
              </ul>
            </div>

            {/* Links Column 3: Platform Navigation & Auth Integration */}
            <div>
              <h5 className="text-white font-semibold mb-3 font-mono uppercase tracking-wider text-[11px]">Platform</h5>
              <ul className="space-y-2">
                {user ? (
                  <>
                    <li><Link href="/dashboard" className="text-[#00F2C2] hover:underline font-semibold">Dashboard</Link></li>
                    <li><Link href="/trading" className="hover:text-white transition-colors">Trading Journal</Link></li>
                    <li><Link href="/market" className="hover:text-white transition-colors">Market Radar</Link></li>
                    <li><Link href="/calendar" className="hover:text-white transition-colors">Economic Calendar</Link></li>
                    <li><Link href="/profile" className="hover:text-white transition-colors">Operator Profile</Link></li>
                  </>
                ) : (
                  <>
                    <li><Link href="/login" className="hover:text-white transition-colors">Terminal Login</Link></li>
                    <li><Link href="/signup" className="text-[#00F2C2] hover:underline font-semibold">Create Account</Link></li>
                    <li><a href="#features" className="hover:text-white transition-colors">Platform Features</a></li>
                    <li><a href="#how-it-works" className="hover:text-white transition-colors">Integration Steps</a></li>
                    <li><a href="#start" className="hover:text-white transition-colors">Pricing &amp; Trials</a></li>
                  </>
                )}
              </ul>
            </div>

            {/* Links Column 4: Company */}
            <div>
              <h5 className="text-white font-semibold mb-3 font-mono uppercase tracking-wider text-[11px]">Company</h5>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-white transition-colors">Institutional Desk</a></li>
                <li><a href="#psychology" className="hover:text-white transition-colors">Security Posture</a></li>
                <li><a href="#start" className="hover:text-white transition-colors">Changelog</a></li>
                <li><a href="#start" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="mailto:support@fynence.app" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

          </div>

          <div className="pt-6 sm:pt-8 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 font-mono text-[10px] sm:text-[11px]">
            <div>© 2026 FYNENCE QUANT LABS INC. ALL RIGHTS RESERVED.</div>
            <div className="flex items-center gap-4 sm:gap-6">
              <a href="#" className="hover:text-white transition-colors">PRIVACY ENCLOSURE</a>
              <a href="#" className="hover:text-white transition-colors">EXECUTION TERMS</a>
              <a href="#" className="hover:text-white transition-colors">REGULATORY COMPLIANCE</a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
