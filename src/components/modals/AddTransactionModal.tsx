'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { X, Receipt, DollarSign, Calendar, Tag, CreditCard } from 'lucide-react';
import { Currency, TransactionType } from '@/types';

export const AddTransactionModal: React.FC = () => {
  const {
    isAddTransactionOpen,
    setIsAddTransactionOpen,
    categories,
    financialAccounts,
    addTransaction,
    displayCurrency,
  } = useApp();

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>(displayCurrency);
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(categories[3]?.id || '');
  const [accountId, setAccountId] = useState(financialAccounts[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if ((!accountId || !financialAccounts.some((a) => a.id === accountId)) && financialAccounts.length > 0) {
      setAccountId(financialAccounts[0].id);
    }
  }, [financialAccounts, accountId]);

  if (!isAddTransactionOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) return;
    if (!description.trim()) return;

    setIsLoading(true);
    try {
      await addTransaction({
        account_id: accountId,
        category_id: categoryId,
        type,
        amount: parseFloat(amount),
        currency,
        description,
        transaction_date: new Date(date).toISOString(),
      });
      setIsAddTransactionOpen(false);
      setAmount('');
      setDescription('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={() => setIsAddTransactionOpen(false)}
    >
      <div className="min-h-full flex items-center justify-center p-3 sm:p-6">
        <div
          className="liquid-glass-glow w-full max-w-lg rounded-2xl p-5 sm:p-7 border-[var(--glass-border)] relative my-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
        <button
          onClick={() => setIsAddTransactionOpen(false)}
          className="absolute top-5 right-5 text-[var(--color-muted)] hover:text-[var(--color-ink)] transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center space-x-2.5 mb-5 border-b border-[var(--glass-border)] pb-3">
          <div className="p-2 rounded-xl bg-[var(--color-olive)]/10 text-[var(--color-olive)] border border-[var(--color-olive)]/20">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold font-mono text-[var(--color-ink)]">Record Transaction</h2>
            <p className="text-xs text-[var(--color-muted)]">Add an expense or income entry into your ledger</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          {/* Income vs Expense toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[var(--glass-bg)] rounded-xl border border-[var(--glass-border)]">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2 rounded-lg font-bold transition ${
                type === 'expense'
                  ? 'bg-[var(--color-rust)]/20 text-[var(--color-rust)] border border-[var(--color-rust)]/30'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
              }`}
            >
              - Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2 rounded-lg font-bold transition ${
                type === 'income'
                  ? 'bg-[var(--color-olive)]/20 text-[var(--color-olive)] border border-[var(--color-olive)]/30'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
              }`}
            >
              + Income
            </button>
          </div>

          {/* Amount & Currency */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="block text-[var(--color-muted)] mb-1">Amount</label>
              <input
                type="number"
                step="any"
                required
                placeholder="e.g. 150.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-sm text-[var(--color-ink)] focus:border-[var(--color-olive)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[var(--color-muted)] mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none"
              >
                <option value="USD">USD ($)</option>
                <option value="IDR">IDR (Rp)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[var(--color-muted)] mb-1">Description / Merchant</label>
            <input
              type="text"
              required
              placeholder="e.g. TradingView Subscription / Client Retainer"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-xs text-[var(--color-ink)] focus:border-[var(--color-olive)] focus:outline-none"
            />
          </div>

          {/* Category & Account */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[var(--color-muted)] mb-1">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-xs text-[var(--color-ink)] focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[var(--color-muted)] mb-1">Account</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-xs text-[var(--color-ink)] focus:outline-none"
              >
                {financialAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-[var(--color-muted)] mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-xs text-[var(--color-ink)] focus:outline-none"
            />
          </div>

          <div className="pt-4 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsAddTransactionOpen(false)}
              className="px-4 py-2 rounded-xl text-[var(--color-muted)] hover:text-[var(--color-ink)] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="liquid-glass-card hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)] text-[var(--color-ink)] px-4 py-2 text-xs font-bold rounded-lg transition"
            >
              {isLoading ? 'SAVING...' : 'SAVE TRANSACTION'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
);
};
