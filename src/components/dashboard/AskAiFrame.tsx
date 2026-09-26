'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  ArrowUp,
  RotateCcw,
  Bot,
  Compass,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';
import { askFynenceAiQuickAction } from '@/app/actions';

interface AskAiFrameProps {
  className?: string;
}

const SUGGESTIONS = [
  'Audit disiplin trading & risiko FOMO',
  'Ringkasan bias XAU/USD & NAS100 hari ini',
  'Bagaimana cara membatasi drawdown akun?',
];

export const AskAiFrame: React.FC<AskAiFrameProps> = ({ className = '' }) => {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (textToSubmit?: string) => {
    const q = (textToSubmit || query).trim();
    if (!q || loading) return;

    setLoading(true);
    setError(null);
    setLastQuestion(q);
    setQuery('');

    try {
      const res = await askFynenceAiQuickAction(q);
      if (res.success && res.reply) {
        setAnswer(res.reply);
      } else {
        setError(res.error || 'Gagal mendapatkan respon dari AI. Silakan coba lagi.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kendala jaringan.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setAnswer(null);
    setError(null);
    setLastQuestion(null);
    setQuery('');
  };

  return (
    <div
      className={`rounded-xl bg-[#17212B]/70 border border-white/[0.06] p-4 sm:p-5 backdrop-blur-2xl shadow-xl transition-all ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#00F2C2]/10 border border-[#00F2C2]/20 text-[#00F2C2]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-mono text-xs sm:text-sm font-bold tracking-wider text-[#F8FAFC] uppercase">
                ASK AI COPILOT
              </h3>
              <span className="font-mono text-[9px] text-[#00F2C2] bg-[#00F2C2]/10 px-1.5 py-0.5 rounded font-semibold border border-[#00F2C2]/20">
                GEMINI
              </span>
            </div>
            <p className="text-[11px] text-[#64748B]">
              Tanya seputar bias pasar, psikologi trading, atau audit manajemen risiko
            </p>
          </div>
        </div>

        {answer && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 font-mono text-[11px] text-[#94A3B8] hover:text-[#00F2C2] px-2 py-1 rounded-lg bg-[#121920]/80 hover:bg-[#121920] border border-white/[0.04] transition cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>

      {/* Answer View */}
      {answer ? (
        <div className="flex flex-col gap-3 rounded-xl bg-[#121920]/90 border border-white/[0.06] p-3.5 sm:p-4">
          <div className="flex items-center gap-2 text-xs font-mono text-[#00F2C2] font-semibold border-b border-white/[0.04] pb-2">
            <Bot className="h-3.5 w-3.5 text-[#00F2C2]" />
            <span className="truncate">Q: &ldquo;{lastQuestion}&rdquo;</span>
          </div>

          <div className="text-xs sm:text-sm text-[#E2E8F0] leading-relaxed whitespace-pre-line font-sans">
            {answer}
          </div>

          <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between">
            <span className="text-[10px] font-mono text-[#64748B]">
              AI Intelligence • Non-financial advice
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="text-[11px] font-mono text-[#00F2C2] hover:text-[#6FFBBE] font-semibold transition cursor-pointer"
            >
              Tanyakan hal lain →
            </button>
          </div>
        </div>
      ) : (
        /* Input & Suggestions View */
        <div className="flex flex-col gap-3">
          {/* Quick Suggestions Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSubmit(s)}
                disabled={loading}
                className="shrink-0 text-[11px] text-[#94A3B8] hover:text-[#F8FAFC] bg-[#121920]/80 hover:bg-[#121920] border border-white/[0.05] hover:border-[#00F2C2]/30 px-2.5 py-1 rounded-lg transition-all cursor-pointer font-sans"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Minimalist Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="relative flex items-center"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tanyakan analisis pasar, psikologi, atau strategi..."
              disabled={loading}
              className="w-full rounded-xl bg-[#121920]/90 border border-white/[0.08] focus:border-[#00F2C2]/50 focus:outline-none pl-3.5 pr-11 py-2.5 text-xs sm:text-sm text-[#F8FAFC] placeholder:text-[#64748B] transition"
            />
            <button
              type="submit"
              disabled={!query.trim() || loading}
              className={`absolute right-1.5 p-2 rounded-lg transition ${
                query.trim() && !loading
                  ? 'bg-[#00F2C2] text-[#080B0E] hover:bg-[#6FFBBE] cursor-pointer shadow-md'
                  : 'bg-white/[0.04] text-[#64748B] cursor-not-allowed'
              }`}
              title="Kirim pertanyaan"
            >
              {loading ? (
                <div className="h-3.5 w-3.5 border-2 border-[#00F2C2] border-t-transparent rounded-full animate-spin" />
              ) : (
                <ArrowUp className="h-3.5 w-3.5" />
              )}
            </button>
          </form>

          {error && (
            <p className="text-[11px] font-mono text-[#F43F5E] px-1">{error}</p>
          )}
        </div>
      )}
    </div>
  );
};
