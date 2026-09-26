'use client';

import React from 'react';
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';

interface DisciplineGaugeProps {
  score: number;
  label?: string;
  confidenceTier?: string;
  className?: string;
}

export const DisciplineGauge: React.FC<DisciplineGaugeProps> = ({
  score = 85,
  label,
  confidenceTier,
  className = '',
}) => {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const circumference = 251.32; // 2 * pi * 40
  const strokeDashoffset = circumference - (circumference * clampedScore) / 100;

  let strokeColor = '#00F2C2';
  let statusText = 'OPTIMAL';
  let defaultConfidence = 'EXCELLENT COMPOSURE';
  let Icon = ShieldCheck;

  if (clampedScore < 50) {
    strokeColor = '#F43F5E';
    statusText = 'HIGH RISK';
    defaultConfidence = 'TILT WARNING';
    Icon = ShieldAlert;
  } else if (clampedScore < 70) {
    strokeColor = '#F59E0B';
    statusText = 'MODERATE';
    defaultConfidence = 'RULE DISCIPLINE';
    Icon = Shield;
  } else if (clampedScore >= 85) {
    defaultConfidence = 'EXCELLENT COMPOSURE';
  } else {
    defaultConfidence = 'STABLE DISCIPLINE';
  }

  const displayStatus = label || statusText;
  const displayConfidence = confidenceTier || defaultConfidence;

  return (
    <div
      className={`rounded-xl bg-[#17212B]/70 border border-white/[0.06] p-4 sm:p-5 backdrop-blur-2xl shadow-xl flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex flex-col">
          <span className="text-xs sm:text-sm font-semibold text-[#F8FAFC]">Discipline Score</span>
          <span className="font-mono text-[9px] text-[#64748B] tracking-wider uppercase">
            RULE ENGINE MONITOR
          </span>
        </div>
        <Icon className="h-3.5 w-3.5 text-[#64748B]" />
      </div>

      <div className="flex items-center justify-center my-2 sm:my-3">
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="8"
            />
            {/* Value stroke */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={strokeColor}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8FAFC]">
              {clampedScore}
              <span className="font-mono text-[10px] text-[#64748B]">/100</span>
            </span>
            <span
              className="font-mono text-[9px] uppercase font-semibold tracking-wider"
              style={{ color: strokeColor }}
            >
              {displayStatus}
            </span>
          </div>
        </div>
      </div>

      <div className="p-2 rounded-lg bg-[#121920]/80 border border-white/[0.04] flex items-center justify-between font-mono text-[10px]">
        <span className="text-[#94A3B8]">Execution Confidence</span>
        <span className="font-semibold" style={{ color: strokeColor }}>
          {displayConfidence}
        </span>
      </div>
    </div>
  );
};
