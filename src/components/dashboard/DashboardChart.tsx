'use client';

import React, { useMemo, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { Currency } from '@/types';

interface ChartPoint {
  label: string;
  value: number;
  date: string;
}

interface DashboardChartProps {
  activeChart?: 'cashflow' | 'equity';
  setActiveChart?: (chart: 'cashflow' | 'equity') => void;
  timeFilter: string;
  setTimeFilter: (filter: string) => void;
  chartData: {
    points: ChartPoint[];
    label: string;
    isPositive: boolean;
    latestVal: number;
  };
  transactionsCount?: number;
  tradesCount: number;
  displayCurrency: Currency;
  formatCurrency: (val: number, curr?: Currency) => string;
  className?: string;
}

export const DashboardChart: React.FC<DashboardChartProps> = ({
  timeFilter,
  setTimeFilter,
  chartData,
  tradesCount,
  displayCurrency,
  formatCurrency,
  className = '',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const {
    polygonPoints,
    polylinePoints,
    mappedNodes,
    minVal,
    maxVal,
    meanVal,
    peakNode,
  } = useMemo(() => {
    const pts = chartData.points;
    const svgWidth = 700;
    const svgHeight = 240;
    const marginX = 40;
    const marginY = 30;
    const plotW = svgWidth - marginX * 2;
    const plotH = svgHeight - marginY * 2;

    if (!pts || pts.length === 0) {
      return {
        polygonPoints: '40,230 660,230',
        polylinePoints: '40,120 660,120',
        mappedNodes: [],
        minVal: 0,
        maxVal: 0,
        meanVal: 0,
        peakNode: null,
      };
    }

    if (pts.length === 1) {
      const single = { ...pts[0], x: 350, y: 120 };
      return {
        polygonPoints: `40,230 40,120 660,120 660,230`,
        polylinePoints: `40,120 660,120`,
        mappedNodes: [single],
        minVal: pts[0].value,
        maxVal: pts[0].value,
        meanVal: pts[0].value,
        peakNode: single,
      };
    }

    const values = pts.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const mean = values.reduce((acc, curr) => acc + curr, 0) / values.length;

    const rawRange = max - min;
    const range = rawRange === 0 ? (Math.abs(min) > 0 ? Math.abs(min) * 0.2 : 100) : rawRange;
    const pad = range * 0.15;
    const effMin = min - pad;
    const effMax = max + pad;
    const effRange = effMax - effMin;

    const mapped = pts.map((p, i) => {
      const x = marginX + (i / (pts.length - 1)) * plotW;
      const y = marginY + plotH - ((p.value - effMin) / effRange) * plotH;
      return { ...p, x, y };
    });

    const polyline = mapped.map((m) => `${m.x.toFixed(1)},${m.y.toFixed(1)}`).join(' ');
    const firstX = mapped[0].x.toFixed(1);
    const lastX = mapped[mapped.length - 1].x.toFixed(1);
    const bottomY = (svgHeight - 10).toFixed(1);
    const polygon = `${firstX},${bottomY} ${polyline} ${lastX},${bottomY}`;

    // Determine peak node
    let peak = mapped[0];
    mapped.forEach((m) => {
      if (m.value > peak.value) peak = m;
    });

    return {
      polygonPoints: polygon,
      polylinePoints: polyline,
      mappedNodes: mapped,
      minVal: min,
      maxVal: max,
      meanVal: mean,
      peakNode: peak,
    };
  }, [chartData]);

  const activeNode = hoveredIndex !== null ? mappedNodes[hoveredIndex] : peakNode;

  return (
    <div className={`rounded-xl bg-[#17212B]/70 border border-white/[0.06] p-4 sm:p-6 backdrop-blur-2xl shadow-xl flex flex-col justify-between h-full ${className}`}>
      {/* Chart Header & Interval Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        {/* Trading Equity Title & Trade Counter */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#00F2C2]/10 border border-[#00F2C2]/20 text-[#00F2C2]">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs sm:text-sm font-bold tracking-wider text-[#F8FAFC] uppercase">
              TRADING EQUITY CURVE
            </span>
            <span className="font-mono text-[10px] text-[#00F2C2] bg-[#00F2C2]/10 px-2 py-0.5 rounded-md font-semibold border border-[#00F2C2]/20">
              {tradesCount} CLOSED TRADES
            </span>
          </div>
        </div>

        {/* Interval Selectors */}
        <div className="flex items-center bg-[#121920]/80 p-1 rounded-xl border border-white/[0.04] font-mono text-[11px]">
          {['7D', '30D', '3M', '6M', '1Y'].map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                timeFilter === filter
                  ? 'bg-[#0D1217] text-[#00F2C2] font-semibold shadow-sm'
                  : 'text-[#64748B] hover:text-[#F8FAFC]'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Progression Subtitle & Peak Label */}
      <div className="flex items-center justify-between mb-2 font-mono text-[11px]">
        <span className="text-[#64748B] uppercase tracking-wider">
          {chartData.label} Progression ({timeFilter})
        </span>
        <div className="flex items-center gap-1.5 text-[#00F2C2] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00F2C2] animate-ping" />
          <span>Current: {formatCurrency(chartData.latestVal, displayCurrency)}</span>
        </div>
      </div>

      {/* Interactive SVG Chart Container with Neon Ambient Gradient */}
      <div className="relative w-full h-64 sm:h-72 rounded-xl bg-[#121920]/40 border border-white/[0.04] p-2 overflow-hidden flex flex-col justify-end">
        <svg
          className="w-full h-full"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 700 240"
        >
          <defs>
            <linearGradient id="chartNeonGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#00F2C2" stopOpacity="0.32" />
              <stop offset="65%" stopColor="#00F2C2" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#00F2C2" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="lineNeonGlow" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#4EDEA3" />
              <stop offset="50%" stopColor="#00E0B4" />
              <stop offset="100%" stopColor="#00F2C2" />
            </linearGradient>
          </defs>

          {/* Horizontal Soft Grid Lines */}
          <line x1="0" x2="700" y1="40" y2="40" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
          <line x1="0" x2="700" y1="100" y2="100" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
          <line x1="0" x2="700" y1="160" y2="160" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
          <line x1="0" x2="700" y1="210" y2="210" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />

          {/* Filled Vector Area */}
          <polygon points={polygonPoints} fill="url(#chartNeonGradient)" />

          {/* Neon Trajectory Line */}
          <polyline
            points={polylinePoints}
            fill="none"
            stroke="url(#lineNeonGlow)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Key Diagnostic Nodes */}
          {mappedNodes.map((node, i) => {
            const isLast = i === mappedNodes.length - 1;
            const isPeak = node === peakNode;
            const isHovered = hoveredIndex === i;

            return (
              <circle
                key={i}
                cx={node.x}
                cy={node.y}
                r={isHovered || isLast ? 6 : isPeak ? 5 : 3.5}
                fill={isLast || isPeak ? '#00F2C2' : '#121920'}
                stroke={isLast || isPeak ? '#080B0E' : '#4EDEA3'}
                strokeWidth={isLast || isPeak ? 2.5 : 2}
                className="cursor-pointer transition-all hover:scale-125"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <title>{`${node.date} - ${node.label}: ${formatCurrency(node.value, displayCurrency)}`}</title>
              </circle>
            );
          })}
        </svg>

        {/* Floating Data Coordinate Tooltip Badge */}
        {activeNode && (
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 px-3 py-1.5 rounded-xl bg-[#121920]/90 border border-white/[0.08] backdrop-blur-md shadow-2xl flex items-center gap-2 pointer-events-none">
            <span className="font-mono text-[10px] text-[#94A3B8]">
              {hoveredIndex !== null ? activeNode.date : 'DIAGNOSTIC PEAK'}
            </span>
            <span className="font-mono text-xs sm:text-sm font-bold text-[#00F2C2]">
              {formatCurrency(activeNode.value, displayCurrency)}
            </span>
          </div>
        )}
      </div>

      {/* Chart Min/Mean/Max Axis Info */}
      <div className="flex items-center justify-between pt-3 font-mono text-[10px] sm:text-[11px] text-[#64748B]">
        <span>Min: {formatCurrency(minVal, displayCurrency)}</span>
        <span className="hidden sm:inline">Baseline Mean: {formatCurrency(meanVal, displayCurrency)}</span>
        <span>Max: {formatCurrency(maxVal, displayCurrency)}</span>
      </div>
    </div>
  );
};
