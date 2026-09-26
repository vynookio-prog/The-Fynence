'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  BrainCircuit,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Activity,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllForexOverviewAction } from '@/app/actions';
import { SupportedInstrument } from '@/types/market';

interface MacroDeskProps {
  className?: string;
}

interface ConciseMacroItem {
  id: string;
  symbol: string;
  name: string;
  bias: 'Strong Bullish' | 'Bullish' | 'Neutral' | 'Bearish' | 'Strong Bearish';
  summary: string;
  driver: string;
  color: string;
  gradientBg: string;
  borderColor: string;
}

const INITIAL_CONCISE_ITEMS: ConciseMacroItem[] = [
  {
    id: 'XAUUSD',
    symbol: 'XAU/USD',
    name: 'Gold',
    bias: 'Bearish',
    summary:
      'Tekanan jual mendominasi akibat penguatan Dollar AS (DXY) dan kenaikan yield obligasi; aliran safe-haven sementara mereda.',
    driver: 'Dollar Pressure // Real Yields',
    color: '#eab308',
    gradientBg: 'from-[#eab308]/15 via-[#17212B]/90 to-[#121920]',
    borderColor: 'border-[#eab308]/25 hover:border-[#eab308]/50',
  },
  {
    id: 'NAS100',
    symbol: 'NAS100',
    name: 'Nasdaq',
    bias: 'Bullish',
    summary:
      'Momentum sektor teknologi agresif didorong akumulasi institusional pada emiten growth; struktur uptrend tetap solid.',
    driver: 'Risk-On // Tech Accumulation',
    color: '#a855f7',
    gradientBg: 'from-[#a855f7]/15 via-[#17212B]/90 to-[#121920]',
    borderColor: 'border-[#a855f7]/25 hover:border-[#a855f7]/50',
  },
  {
    id: 'DJ30',
    symbol: 'DJ30',
    name: 'Dow Jones',
    bias: 'Bullish',
    summary:
      'Rotasi modal positif ke saham industri blue-chip; breadth pasar terjaga baik dengan sentimen ekspansi ekonomi.',
    driver: 'Cyclical Breadth // Blue Chip',
    color: '#38bdf8',
    gradientBg: 'from-[#38bdf8]/15 via-[#17212B]/90 to-[#121920]',
    borderColor: 'border-[#38bdf8]/25 hover:border-[#38bdf8]/50',
  },
];

export const MacroDesk: React.FC<MacroDeskProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<ConciseMacroItem[]>(INITIAL_CONCISE_ITEMS);

  // Sync live bias dynamically if available
  useEffect(() => {
    let isMounted = true;
    async function fetchLive() {
      try {
        const res = await getAllForexOverviewAction(false);
        if (isMounted && res.success && Array.isArray(res.data) && res.data.length > 0) {
          const map = new Map<string, (typeof res.data)[0]>();
          res.data.forEach((d) => map.set(d.pair, d));

          setItems((prev) =>
            prev.map((item) => {
              const live = map.get(item.id);
              if (!live) return item;
              return {
                ...item,
                bias: live.bias,
                summary: live.biasExplanation || item.summary,
                driver: live.psychology?.insight
                  ? live.psychology.insight.slice(0, 38) + '...'
                  : item.driver,
              };
            })
          );
        }
      } catch (err) {
        console.warn('[MacroDesk] Using local concise items:', err);
      }
    }
    fetchLive();
    return () => {
      isMounted = false;
    };
  }, []);

  const getBadgeStyle = (bias: ConciseMacroItem['bias']) => {
    if (bias.includes('Bullish')) {
      return 'text-[#10B981] bg-[#10B981]/15 border-[#10B981]/30';
    }
    if (bias.includes('Bearish')) {
      return 'text-[#F43F5E] bg-[#F43F5E]/15 border-[#F43F5E]/30';
    }
    return 'text-[#F59E0B] bg-[#F59E0B]/15 border-[#F59E0B]/30';
  };

  return (
    <div className={`flex flex-col gap-2.5 w-full ${className}`}>
      {/* Top Header: Title & View All -> */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#00F2C2]/10 text-[#00F2C2]">
            <BrainCircuit className="h-3.5 w-3.5" />
          </div>
          <span className="font-mono text-xs sm:text-sm font-bold tracking-wider text-[#F8FAFC] uppercase">
            MARKET AI BIAS
          </span>
          <span className="font-mono text-[9px] text-[#00F2C2] bg-[#00F2C2]/10 px-1.5 py-0.5 rounded font-semibold border border-[#00F2C2]/20">
            SUMMARY
          </span>
        </div>

        {/* View All -> Button (Directs to /market) */}
        <button
          type="button"
          onClick={() => navigate('/market')}
          className="group inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-[#00F2C2] hover:text-[#6FFBBE] bg-[#121920]/80 hover:bg-[#17212B] px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border border-[#00F2C2]/25 hover:border-[#00F2C2]/50 transition cursor-pointer shadow-sm"
        >
          <span>View all</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* Compact Horizontal Scrollable Frame (Phone-Friendly) */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-1.5 pt-0.5 px-0.5 scroll-smooth snap-x snap-mandatory"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {items.map((item) => {
          const isBull = item.bias.includes('Bullish');
          const isBear = item.bias.includes('Bearish');

          return (
            <div
              key={item.id}
              onClick={() => navigate('/market')}
              className={`w-[78vw] sm:w-[290px] md:w-[310px] shrink-0 snap-start rounded-xl bg-gradient-to-br ${item.gradientBg} border ${item.borderColor} p-3 sm:p-3.5 backdrop-blur-xl shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2.5 active:scale-[0.99]`}
            >
              {/* Header: Instrument & Bias Badge */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-sm font-bold text-[#F8FAFC]">
                      {item.symbol}
                    </span>
                    <span className="text-[11px] text-[#94A3B8] font-medium">
                      {item.name}
                    </span>
                  </div>
                </div>

                {/* Bias Badge */}
                <span
                  className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded-lg border ${getBadgeStyle(
                    item.bias
                  )}`}
                >
                  {isBull ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : isBear ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : (
                    <Activity className="h-3 w-3" />
                  )}
                  {item.bias.toUpperCase()}
                </span>
              </div>

              {/* Concise AI Summary (No Prices, just sharp takeaway) */}
              <p className="text-xs text-[#CBD5E1] line-clamp-2 leading-relaxed">
                {item.summary}
              </p>

              {/* Bottom Driver Tag */}
              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-[#64748B]">
                <span className="truncate max-w-[85%] text-[#94A3B8]">
                  {item.driver}
                </span>
                <span className="text-[#00F2C2] group-hover:translate-x-0.5 transition font-bold">
                  →
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
