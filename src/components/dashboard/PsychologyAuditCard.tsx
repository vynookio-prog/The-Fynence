'use client';

import React from 'react';
import Link from 'next/link';
import { Brain, ArrowRight } from 'lucide-react';

interface PsychologyAuditCardProps {
  revengeTradesCount: number;
  fomoTradesCount: number;
  totalTrades: number;
  className?: string;
}

export const PsychologyAuditCard: React.FC<PsychologyAuditCardProps> = ({
  revengeTradesCount = 0,
  fomoTradesCount = 0,
  totalTrades = 0,
  className = '',
}) => {
  const revengeRatio = totalTrades > 0 ? (revengeTradesCount / totalTrades) * 100 : 0;
  const fomoRatio = totalTrades > 0 ? (fomoTradesCount / totalTrades) * 100 : 0;

  const revengeRiskLevel = revengeRatio >= 25 ? 'High' : revengeRatio >= 10 ? 'Moderate' : 'Low';
  const revengeColor = revengeRatio >= 25 ? '#F43F5E' : revengeRatio >= 10 ? '#F59E0B' : '#10B981';

  return (
    <div
      className={`rounded-xl bg-[#17212B]/70 border border-white/[0.06] p-4 sm:p-5 backdrop-blur-2xl shadow-xl flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Brain className="h-3.5 w-3.5 text-[#00F2C2]" />
          <span className="text-xs sm:text-sm font-semibold text-[#F8FAFC]">AI Psychology Audit</span>
        </div>
        <span className="font-mono text-[9px] text-[#64748B] uppercase tracking-wider">
          LIVE AUDIT
        </span>
      </div>

      <div className="flex flex-col gap-2.5 my-2 sm:my-3">
        {/* Metric 1: Revenge Trading */}
        <div>
          <div className="flex items-center justify-between font-mono text-[10px] mb-1">
            <span className="text-[#94A3B8]">Revenge Risk</span>
            <span className="font-semibold" style={{ color: revengeColor }}>
              {revengeTradesCount} Trades ({revengeRiskLevel})
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#121920] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.max(4, Math.min(100, revengeRatio))}%`,
                backgroundColor: revengeColor,
              }}
            />
          </div>
        </div>

        {/* Metric 2: FOMO / Discipline */}
        <div>
          <div className="flex items-center justify-between font-mono text-[10px] mb-1">
            <span className="text-[#94A3B8]">FOMO / Impulse</span>
            <span className="font-semibold text-[#FF8A00]">
              {fomoTradesCount} Flagged ({fomoRatio.toFixed(0)}%)
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#121920] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#FF8A00] rounded-full transition-all duration-700"
              style={{
                width: `${Math.max(4, Math.min(100, fomoRatio))}%`,
              }}
            />
          </div>
        </div>
      </div>

      <Link
        href="/trading"
        className="w-full py-2 px-3 rounded-lg bg-[#121920] hover:bg-[#121920]/80 border border-white/[0.06] font-mono text-[11px] text-[#F8FAFC] font-semibold tracking-wider flex items-center justify-center gap-1.5 transition-colors group"
      >
        <span>LEARN MORE & AUDIT</span>
        <ArrowRight className="h-3 w-3 text-[#00F2C2] group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
};
