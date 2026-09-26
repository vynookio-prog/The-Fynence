'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

export const MarketSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 max-w-6xl pb-12 animate-in fade-in duration-300">
      {/* ─── 1. HEADER SKELETON ────────────────────────────────────────────── */}
      <header className="liquid-glass-card p-5 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="h-3.5 w-40 shimmer-bone rounded-md" />
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full border border-[var(--color-line)] bg-[var(--surface-tint)]">
            <span className="h-2 w-2 rounded-full bg-[var(--color-gold)] animate-ping" />
            <div className="h-3 w-20 shimmer-bone rounded" />
          </div>
        </div>

        {/* Title skeleton */}
        <div className="flex items-center space-x-2">
          <div className="h-9 sm:h-11 w-64 sm:w-80 shimmer-bone rounded-xl" />
        </div>

        {/* Status row skeleton */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <div className="h-4 w-32 shimmer-bone rounded" />
          <div className="ml-auto h-7 w-28 shimmer-bone rounded-full" />
        </div>

        {/* Floating subtle banner */}
        <div className="mt-2 pt-3 border-t border-[var(--color-line)] flex items-center space-x-2 text-[11px] font-mono text-[var(--color-muted)]">
          <Sparkles className="h-3.5 w-3.5 text-[var(--color-gold)] animate-spin shrink-0" />
          <span className="animate-pulse">Menyiapkan data pasar real-time…</span>
        </div>
      </header>

      {/* ─── 2. THREE INSTRUMENT CARDS SKELETON ────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3 px-0.5">
          <div className="h-3 w-36 shimmer-bone rounded" />
          <div className="h-3 w-48 shimmer-bone rounded hidden sm:block" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="liquid-glass-card p-5 sm:p-6 flex flex-col justify-between space-y-5">
              {/* Card top */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-9 w-9 rounded-xl shimmer-bone shrink-0" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-20 shimmer-bone rounded" />
                    <div className="h-2.5 w-28 shimmer-bone rounded" />
                  </div>
                </div>
                <div className="h-3 w-12 shimmer-bone rounded-full" />
              </div>

              {/* Price & Change */}
              <div className="space-y-2">
                <div className="h-8 w-36 shimmer-bone rounded-lg" />
                <div className="h-4 w-24 shimmer-bone rounded" />
              </div>

              {/* 4 Bottom stats */}
              <div className="grid grid-cols-2 gap-2 pt-4 border-t border-[var(--color-line)]">
                {[0, 1, 2, 3].map((j) => (
                  <div key={j} className="space-y-1">
                    <div className="h-2.5 w-12 shimmer-bone rounded" />
                    <div className="h-3.5 w-16 shimmer-bone rounded" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 3. AI MARKET BIAS SKELETON ────────────────────────────────────── */}
      <section className="liquid-glass-card p-6 sm:p-7 flex flex-col space-y-5">
        <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="h-4 w-4 rounded-full shimmer-bone" />
            <div className="h-4 w-48 shimmer-bone rounded" />
          </div>
          <div className="h-6 w-24 shimmer-bone rounded-full" />
        </div>

        {/* Asset badge */}
        <div className="flex items-center space-x-2">
          <div className="h-3 w-12 shimmer-bone rounded" />
          <div className="h-5 w-24 shimmer-bone rounded" />
          <div className="h-4 w-16 shimmer-bone rounded" />
        </div>

        {/* Bias & Confidence stats */}
        <div className="flex gap-8">
          <div className="space-y-1.5">
            <div className="h-2.5 w-16 shimmer-bone rounded" />
            <div className="h-7 w-28 shimmer-bone rounded" />
          </div>
          <div className="space-y-1.5">
            <div className="h-2.5 w-16 shimmer-bone rounded" />
            <div className="h-7 w-20 shimmer-bone rounded" />
          </div>
        </div>

        {/* Reasoning blockquote skeleton */}
        <div className="border-l-2 border-[var(--color-gold)]/40 pl-4 py-1 space-y-2">
          <div className="h-3.5 w-11/12 shimmer-bone rounded" />
          <div className="h-3.5 w-4/5 shimmer-bone rounded" />
        </div>

        {/* Indicator pills */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-[var(--color-line)]">
          {[0, 1, 2, 3].map((k) => (
            <div key={k} className="h-6 w-28 shimmer-bone rounded-lg" />
          ))}
        </div>
      </section>

      {/* ─── 4. TECHNICAL ANALYSIS SKELETON ────────────────────────────────── */}
      <section className="liquid-glass-card p-6 sm:p-7 space-y-5">
        <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-4">
          <div className="h-4 w-44 shimmer-bone rounded" />
          <div className="flex gap-2">
            <div className="h-5 w-20 shimmer-bone rounded-lg" />
            <div className="h-5 w-20 shimmer-bone rounded-lg" />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[0, 1, 2, 3, 4, 5].map((m) => (
            <div key={m} className="rounded-2xl p-4 border border-[var(--glass-border)] bg-[var(--surface-tint)] space-y-2.5">
              <div className="h-2.5 w-14 shimmer-bone rounded" />
              <div className="h-5 w-20 shimmer-bone rounded" />
              <div className="h-2.5 w-16 shimmer-bone rounded" />
            </div>
          ))}
        </div>
      </section>

      {/* ─── 5. PSYCHOLOGY + CALENDAR SKELETON ──────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Psychology */}
        <div className="liquid-glass-card p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
            <div className="h-4 w-36 shimmer-bone rounded" />
            <div className="h-4 w-28 shimmer-bone rounded" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <div className="h-3 w-20 shimmer-bone rounded" />
              <div className="h-3 w-20 shimmer-bone rounded" />
            </div>
            <div className="h-2 w-full shimmer-bone rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2">
            {[0, 1, 2, 3].map((p) => (
              <div key={p} className="p-3 rounded-xl border border-[var(--glass-border)] bg-[var(--surface-tint)] space-y-1 text-center">
                <div className="h-2.5 w-16 shimmer-bone mx-auto rounded" />
                <div className="h-4 w-12 shimmer-bone mx-auto rounded" />
              </div>
            ))}
          </div>
          <div className="p-3 rounded-xl border border-[var(--glass-border)] bg-[var(--surface-tint)] space-y-1.5">
            <div className="h-2.5 w-24 shimmer-bone rounded" />
            <div className="h-3 w-full shimmer-bone rounded" />
          </div>
        </div>

        {/* Macro Calendar */}
        <div className="liquid-glass-card p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
            <div className="h-4 w-40 shimmer-bone rounded" />
            <div className="h-4 w-24 shimmer-bone rounded" />
          </div>
          <div className="space-y-3">
            {[0, 1].map((q) => (
              <div key={q} className="p-4 rounded-xl border border-[var(--glass-border)] bg-[var(--surface-tint)] space-y-2">
                <div className="flex justify-between">
                  <div className="h-3.5 w-20 shimmer-bone rounded" />
                  <div className="h-3 w-16 shimmer-bone rounded" />
                </div>
                <div className="h-4 w-3/4 shimmer-bone rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default MarketSkeleton;
