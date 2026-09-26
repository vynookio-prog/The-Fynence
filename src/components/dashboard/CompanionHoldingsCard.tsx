'use client';

import React from 'react';
import Link from 'next/link';

interface CompanionHoldingsCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  balance: string;
  changeText: string;
  isPositive?: boolean;
  badgeText?: string;
  iconBg?: string;
  iconColor?: string;
  href?: string;
}

export const CompanionHoldingsCard: React.FC<CompanionHoldingsCardProps> = ({
  icon,
  title,
  subtitle,
  balance,
  changeText,
  isPositive = true,
  badgeText,
  iconBg = 'bg-[#121920]',
  iconColor = 'text-[#00F2C2]',
  href = '/money',
}) => {
  const cardContent = (
    <div className="rounded-xl bg-[#17212B]/60 border border-white/[0.06] p-4 sm:p-5 backdrop-blur-2xl shadow-xl flex items-center justify-between transition-all hover:bg-[#17212B]/85 hover:border-white/[0.12] cursor-pointer">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <div className={`w-10 h-10 rounded-xl ${iconBg} border border-white/[0.06] flex items-center justify-center shrink-0 ${iconColor}`}>
          {icon}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-[#F8FAFC] truncate">{title}</span>
          <span className="font-mono text-[10px] text-[#64748B] tracking-wider truncate uppercase">
            {subtitle}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end shrink-0 pl-2">
        <span className="font-mono text-sm sm:text-base font-bold text-[#F8FAFC]">
          {balance}
        </span>
        <div className="flex items-center gap-1.5 mt-0.5">
          {badgeText && (
            <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-white/[0.05] text-[#94A3B8]">
              {badgeText}
            </span>
          )}
          <span
            className={`font-mono text-[10px] font-semibold ${
              isPositive ? 'text-[#10B981]' : 'text-[#F43F5E]'
            }`}
          >
            {changeText}
          </span>
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{cardContent}</Link>;
  }

  return cardContent;
};
