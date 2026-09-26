'use client';

import React from 'react';
import Link from 'next/link';
import { Receipt, ChevronRight } from 'lucide-react';
import { Transaction, Currency } from '@/types';
import { formatEventDateTime } from '@/lib/timezone';

interface RecentActivityLedgerProps {
  transactions: Transaction[];
  timezone: string;
  formatCurrency: (val: number, curr?: Currency) => string;
  className?: string;
}

export const RecentActivityLedger: React.FC<RecentActivityLedgerProps> = ({
  transactions = [],
  timezone,
  formatCurrency,
  className = '',
}) => {
  const recentTxs = transactions.slice(0, 3);

  return (
    <div className={`rounded-xl bg-[#17212B]/70 border border-white/[0.06] p-3.5 sm:p-4 backdrop-blur-2xl shadow-xl flex flex-col justify-between ${className}`}>
      {/* Sleek inline header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-[#121920] border border-white/[0.04] text-[#64748B]">
            <Receipt className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="font-mono text-[9px] uppercase text-[#64748B] tracking-wider block leading-none">
              RECENT ACTIVITY
            </span>
            <span className="text-xs font-semibold text-[#F8FAFC] leading-tight">Ledger Entries</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] text-[#64748B] hidden sm:inline">
            {recentTxs.length}/{transactions.length}
          </span>
          <Link
            href="/money"
            className="text-[#00F2C2] hover:underline flex items-center gap-0.5 font-mono text-[10px] font-semibold transition-colors"
          >
            VIEW ALL <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Transactions list - compact horizontal rows */}
      <div className="flex flex-col gap-1.5 my-2.5 flex-1 justify-center">
        {recentTxs.length > 0 ? (
          recentTxs.map((tx) => {
            const formattedDate = formatEventDateTime(tx.transaction_date, timezone);
            const isIncome = tx.type === 'income';

            return (
              <div
                key={tx.id}
                className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-[#121920]/50 hover:bg-[#121920]/80 border border-white/[0.03] transition-all gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="font-mono text-[9px] text-[#64748B] shrink-0">
                    {formattedDate.time}
                  </span>
                  <span className="text-xs font-medium text-[#F8FAFC] truncate">
                    {tx.description || 'Transaction'}
                  </span>
                  <span
                    className={`font-mono text-[8px] uppercase tracking-wider px-1 py-0.5 rounded shrink-0 hidden md:inline-block ${
                      isIncome ? 'bg-[#4EDEA3]/10 text-[#4EDEA3]' : 'bg-white/[0.03] text-[#94A3B8]'
                    }`}
                  >
                    {isIncome ? 'INFLOW' : 'EXPENSE'}
                  </span>
                </div>

                <span
                  className={`font-mono text-xs font-semibold shrink-0 ${
                    isIncome ? 'text-[#10B981]' : 'text-[#FF8A00]'
                  }`}
                >
                  {isIncome ? '+' : '-'}
                  {formatCurrency(Number(tx.amount), tx.currency)}
                </span>
              </div>
            );
          })
        ) : (
          <div className="py-4 text-center">
            <p className="font-mono text-xs text-[#64748B]">No ledger records yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};
