'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import {
  X,
  TrendingUp,
  Brain,
  ShieldAlert,
  Calendar,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Zap,
  Save,
  Info,
  Edit2,
  Check,
  Sparkles,
  Bot,
  RefreshCw,
  Upload,
  Maximize2,
  Image as ImageIcon,
} from 'lucide-react';
import { getNearbyMarketEvents, NearbyEventMatch } from '@/lib/correlation';
import { TradePsychology, TradeDirection, Timeframe, TradeImageType, TradeScreenshot } from '@/types';
import { psychologyService } from '@/services/psychology';

export const TradeDetailModal: React.FC = () => {
  const {
    selectedTradeForDetail,
    setSelectedTradeForDetail,
    deleteTrade,
    updateTrade,
    marketEvents,
    strategies,
  } = useApp();

  const trade = selectedTradeForDetail;

  // Edit Trade Details State
  const [isEditingTrade, setIsEditingTrade] = useState(false);
  const [editSymbol, setEditSymbol] = useState('');
  const [editDirection, setEditDirection] = useState<TradeDirection>('buy');
  const [editEntryPrice, setEditEntryPrice] = useState('');
  const [editExitPrice, setEditExitPrice] = useState('');
  const [editStopLoss, setEditStopLoss] = useState('');
  const [editTakeProfit, setEditTakeProfit] = useState('');
  const [editPositionSize, setEditPositionSize] = useState('');
  const [editTimeframe, setEditTimeframe] = useState<Timeframe>('M15');
  const [editStrategyId, setEditStrategyId] = useState('');
  const [editEntryReason, setEditEntryReason] = useState('');
  const [editExitReason, setEditExitReason] = useState('');
  const [editNetProfitLoss, setEditNetProfitLoss] = useState('');
  const [editEntryTime, setEditEntryTime] = useState('');
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  // Psychology Debrief State
  const [psychologyState, setPsychologyState] = useState<TradePsychology>({
    emotion: 'neutral',
    confidence: 8,
    fomo: false,
    revenge_trading: false,
    greed: false,
    fear: false,
    followed_plan: true,
    discipline_score: 8,
    before_trade_note: '',
    during_trade_note: '',
    after_trade_note: '',
    lessons_learned: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Gemini AI Trade Analysis State
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiInsightTitle, setAiInsightTitle] = useState<string>('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Multi-Stage Screenshots State (PRD Section 16)
  const [screenshots, setScreenshots] = useState<TradeScreenshot[]>([]);
  const [activeScreenshotStage, setActiveScreenshotStage] = useState<TradeImageType>('before');
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState(false);
  const [screenshotUploadError, setScreenshotUploadError] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    if (!trade) return;

    // Initialize trade edit form
    setEditSymbol(trade.symbol || 'EURUSD');
    setEditDirection(trade.direction || 'buy');
    setEditEntryPrice(trade.entry_price?.toString() || '');
    setEditExitPrice(trade.exit_price?.toString() || '');
    setEditStopLoss(trade.stop_loss?.toString() || '');
    setEditTakeProfit(trade.take_profit?.toString() || '');
    setEditPositionSize(trade.position_size?.toString() || '');
    setEditTimeframe(trade.timeframe || 'M15');
    setEditStrategyId(trade.strategy_id || '');
    setEditEntryReason(trade.entry_reason || '');
    setEditExitReason(trade.exit_reason || '');
    setEditNetProfitLoss(trade.net_profit_loss?.toString() || '0');
    setEditEntryTime(trade.entry_time ? trade.entry_time.slice(0, 16) : new Date().toISOString().slice(0, 16));
    setIsEditingTrade(false);

    // Load psychology from PostgreSQL trade_psychology table
    if (trade.id) {
      psychologyService.getTradePsychology(trade.id).then(({ data }) => {
        if (data && data.length > 0) {
          const rec = data[0];
          setPsychologyState({
            id: rec.id,
            user_id: rec.user_id,
            trade_id: trade.id,
            emotion: rec.emotion || 'neutral',
            confidence: rec.confidence ?? 8,
            fomo: rec.fomo ?? false,
            revenge_trading: rec.revenge_trading ?? false,
            greed: rec.greed ?? false,
            fear: rec.fear ?? false,
            followed_plan: rec.followed_plan ?? true,
            discipline_score: rec.discipline_score ?? 8,
            before_trade_note: rec.before_trade_note || '',
            during_trade_note: rec.during_trade_note || '',
            after_trade_note: rec.after_trade_note || '',
            lessons_learned: rec.lessons_learned || '',
          });
        } else if (trade.psychology) {
          setPsychologyState({
            emotion: trade.psychology.emotion || 'neutral',
            confidence: trade.psychology.confidence ?? 8,
            fomo: trade.psychology.fomo ?? false,
            revenge_trading: trade.psychology.revenge_trading ?? false,
            greed: trade.psychology.greed ?? false,
            fear: trade.psychology.fear ?? false,
            followed_plan: trade.psychology.followed_plan ?? true,
            discipline_score: trade.psychology.discipline_score ?? 8,
            before_trade_note: trade.psychology.before_trade_note || '',
            during_trade_note: trade.psychology.during_trade_note || '',
            after_trade_note: trade.psychology.after_trade_note || '',
            lessons_learned: trade.psychology.lessons_learned || '',
            trade_id: trade.id,
          });
        }
      });
    }
    setSaveSuccess(false);

    // Fetch existing AI trade analysis if already generated
    setAiAnalysis(null);
    setAiError(null);
    if (trade.id) {
      import('@/app/actions').then(({ getAiInsightsAction }) => {
        getAiInsightsAction('trading').then((res) => {
          const existing = res.data?.find((item: any) => item.source_period === trade.id);
          if (existing) {
            setAiAnalysis(existing.content);
            setAiInsightTitle(existing.title);
          }
        });
      });
    }

    // Load multi-stage trade screenshots (PRD Section 16)
    setScreenshots([]);
    setScreenshotUploadError(null);
    if (trade.id) {
      import('@/app/actions').then(({ getTradeScreenshotsAction }) => {
        getTradeScreenshotsAction(trade.id).then((res) => {
          if (res.data && res.data.length > 0) {
            setScreenshots(res.data);
          } else if (trade.screenshot_url) {
            // Fallback for existing trades with legacy screenshot_url
            setScreenshots([{
              id: 'legacy-before',
              trade_id: trade.id,
              user_id: trade.user_id || '',
              file_path: trade.screenshot_url,
              image_type: 'before',
              created_at: trade.entry_time,
            }]);
          }
        });
      });
    }
  }, [trade]);

  const handleUploadScreenshot = async (e: React.ChangeEvent<HTMLInputElement>, stage: TradeImageType) => {
    const file = e.target.files?.[0];
    if (!file || !trade?.id) return;

    setIsUploadingScreenshot(true);
    setScreenshotUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tradeId', trade.id);
      formData.append('imageType', stage);

      const { uploadTradeScreenshotAction } = await import('@/app/actions');
      const res = await uploadTradeScreenshotAction(formData);

      if (res.error) {
        setScreenshotUploadError(res.error);
      } else if (res.screenshot) {
        setScreenshots((prev) => [...prev.filter((s) => s.id !== res.screenshot?.id), res.screenshot!]);
        if (stage === 'before' && res.url) {
          updateTrade(trade.id, { screenshot_url: res.url });
        }
      } else if (res.url) {
        const newRecord: TradeScreenshot = {
          id: `local-${Date.now()}`,
          trade_id: trade.id,
          user_id: trade.user_id || '',
          file_path: res.url,
          image_type: stage,
          created_at: new Date().toISOString(),
        };
        setScreenshots((prev) => [...prev, newRecord]);
        if (stage === 'before') {
          updateTrade(trade.id, { screenshot_url: res.url });
        }
      }
    } catch (err: unknown) {
      setScreenshotUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploadingScreenshot(false);
      e.target.value = '';
    }
  };

  const handleDeleteScreenshot = async (screenshot: TradeScreenshot) => {
    if (!confirm('Are you sure you want to remove this chart screenshot?')) return;
    try {
      const { deleteTradeScreenshotAction } = await import('@/app/actions');
      await deleteTradeScreenshotAction(screenshot.id, screenshot.file_path);
      setScreenshots((prev) => prev.filter((s) => s.id !== screenshot.id));
      if (trade && trade.screenshot_url === screenshot.file_path) {
        updateTrade(trade.id, { screenshot_url: undefined });
      }
    } catch (err: unknown) {
      console.error('Delete screenshot error:', err);
    }
  };

  const handleRunAiAnalysis = async () => {
    if (!trade?.id) return;
    setIsLoadingAi(true);
    setAiError(null);
    try {
      const { analyzeTradeAction } = await import('@/app/actions');
      const res = await analyzeTradeAction(trade.id);
      if (res.success && res.data) {
        setAiAnalysis(res.data.analysisText);
        setAiInsightTitle(res.data.insight.title);
      } else {
        setAiError(res.error || 'Gagal memproses analisis trade dari Gemini.');
      }
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat memanggil AI.');
    } finally {
      setIsLoadingAi(false);
    }
  };

  const nearbyEvents: NearbyEventMatch[] = useMemo(() => {
    if (!trade) return [];
    const executionTime = trade.open_time || trade.entry_time || trade.created_at || '';
    return getNearbyMarketEvents(trade.symbol, executionTime, marketEvents || [], 180);
  }, [trade, marketEvents]);

  if (!trade) return null;

  const isWin = trade.net_profit_loss >= 0;
  const isMT5 = trade.source === 'mt5' || Boolean(trade.external_trade_id);

  const handleSaveDebrief = async () => {
    setIsSaving(true);
    try {
      // Save directly to public.trade_psychology table
      const res = await psychologyService.saveTradePsychology({
        ...psychologyState,
        trade_id: trade.id,
      });

      // Also update trade record's psychology JSONB
      await updateTrade(trade.id, {
        psychology: psychologyState,
      });

      if (res.data?.id) {
        setPsychologyState((prev) => ({ ...prev, id: res.data?.id }));
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save trade debrief note', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTradeDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingDetails(true);
    try {
      const entryNum = parseFloat(editEntryPrice) || trade.entry_price;
      const exitNum = parseFloat(editExitPrice) || trade.exit_price;
      const slNum = parseFloat(editStopLoss) || trade.stop_loss;
      const tpNum = parseFloat(editTakeProfit) || trade.take_profit;
      const sizeNum = parseFloat(editPositionSize) || trade.position_size;
      const parsedPnl = parseFloat(editNetProfitLoss);
      const pnlNum = !isNaN(parsedPnl) ? parsedPnl : trade.net_profit_loss;
      const selectedStrat = strategies.find((s) => s.id === editStrategyId);

      await updateTrade(trade.id, {
        symbol: editSymbol.toUpperCase(),
        direction: editDirection,
        entry_price: entryNum,
        exit_price: exitNum,
        stop_loss: slNum,
        take_profit: tpNum,
        position_size: sizeNum,
        timeframe: editTimeframe,
        strategy_id: editStrategyId || undefined,
        strategy_name: selectedStrat?.name || trade.strategy_name,
        entry_reason: editEntryReason,
        exit_reason: editExitReason,
        net_profit_loss: pnlNum,
        profit_loss: pnlNum,
        entry_time: new Date(editEntryTime).toISOString(),
      });
      setIsEditingTrade(false);
    } catch (err) {
      console.error('Failed to update trade details', err);
    } finally {
      setIsSavingDetails(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={() => setSelectedTradeForDetail(null)}
    >
      <div className="min-h-full flex items-center justify-center p-3 sm:p-6">
        <div
          className="liquid-glass-glow w-full max-w-2xl rounded-2xl p-5 sm:p-7 border-[var(--glass-border)] relative my-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
        <button
          onClick={() => setSelectedTradeForDetail(null)}
          className="absolute top-5 right-5 text-[var(--color-muted)] hover:text-[var(--color-ink)] transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Top Badges & Meta */}
        <div className="flex flex-wrap items-center justify-between gap-2 pr-8 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs uppercase ${
                trade.direction === 'buy'
                  ? 'bg-[var(--color-olive)]/20 text-[var(--color-olive)] border border-[var(--color-olive)]/30'
                  : 'bg-[var(--color-rust)]/20 text-[var(--color-rust)] border border-[var(--color-rust)]/30'
              }`}
            >
              {trade.direction}
            </span>

            {isMT5 ? (
              <span className="px-2.5 py-1 rounded-lg font-mono font-bold text-xs bg-[var(--color-ocean)]/15 text-[var(--color-ocean)] border border-[var(--color-ocean)]/30 flex items-center space-x-1.5">
                <Zap className="h-3.5 w-3.5" />
                <span>MT5 SYNCED // Ticket: #{trade.external_trade_id || trade.id.slice(0, 8)}</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg font-mono font-bold text-xs bg-white/[0.05] text-[var(--color-muted)] border border-[var(--glass-border)]">
                MANUAL ENTRY JOURNAL
              </span>
            )}

            <span className="px-2.5 py-1 rounded-lg font-mono text-xs bg-white/[0.03] text-[var(--color-muted)] border border-[var(--glass-border)]">
              {trade.session} Session
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsEditingTrade(!isEditingTrade)}
            className={`px-2.5 py-1 rounded-lg font-mono text-xs border transition flex items-center space-x-1.5 ${
              isEditingTrade
                ? 'bg-[var(--color-ocean)]/20 border-[var(--color-ocean)]/40 text-[var(--color-ocean)]'
                : 'bg-white/[0.05] border-[var(--glass-border)] text-[var(--color-muted)] hover:text-[var(--color-ink)]'
            }`}
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>{isEditingTrade ? 'Cancel Edit' : 'Edit Trade Details'}</span>
          </button>
        </div>

        {/* Inline Edit Trade Form */}
        {isEditingTrade && (
          <form onSubmit={handleSaveTradeDetails} className="mb-5 rounded-2xl border border-[var(--color-ocean)]/30 bg-[var(--glass-bg)] p-4 font-mono text-xs space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-2">
              <span className="font-bold text-[var(--color-ocean)] uppercase">Edit Trade Execution & Strategy Details</span>
              <span className="text-[10px] text-[var(--color-muted)]">Updates will persist to PostgreSQL</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] text-[var(--color-muted)] block mb-1">Symbol</label>
                <input
                  type="text"
                  value={editSymbol}
                  onChange={(e) => setEditSymbol(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-[var(--glass-border)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ocean)]"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-[var(--color-muted)] block mb-1">Direction</label>
                <select
                  value={editDirection}
                  onChange={(e) => setEditDirection(e.target.value as TradeDirection)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-[var(--glass-border)] text-[var(--color-ink)] focus:outline-none"
                >
                  <option value="buy">BUY / LONG</option>
                  <option value="sell">SELL / SHORT</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-[var(--color-muted)] block mb-1">Position Size (Lots)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editPositionSize}
                  onChange={(e) => setEditPositionSize(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-[var(--glass-border)] text-[var(--color-ink)] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-[var(--color-muted)] block mb-1">Timeframe</label>
                <select
                  value={editTimeframe}
                  onChange={(e) => setEditTimeframe(e.target.value as Timeframe)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-[var(--glass-border)] text-[var(--color-ink)] focus:outline-none"
                >
                  <option value="M1">M1</option>
                  <option value="M5">M5</option>
                  <option value="M15">M15</option>
                  <option value="H1">H1</option>
                  <option value="H4">H4</option>
                  <option value="D1">D1</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] text-[var(--color-muted)] block mb-1">Entry Price</label>
                <input
                  type="number"
                  step="any"
                  value={editEntryPrice}
                  onChange={(e) => setEditEntryPrice(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-[var(--glass-border)] text-[var(--color-ink)] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-[var(--color-muted)] block mb-1">Exit Price</label>
                <input
                  type="number"
                  step="any"
                  value={editExitPrice}
                  onChange={(e) => setEditExitPrice(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-[var(--glass-border)] text-[var(--color-ink)] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-[var(--color-muted)] block mb-1">Stop Loss</label>
                <input
                  type="number"
                  step="any"
                  value={editStopLoss}
                  onChange={(e) => setEditStopLoss(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-[var(--glass-border)] text-[var(--color-rust)] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-[var(--color-muted)] block mb-1">Take Profit</label>
                <input
                  type="number"
                  step="any"
                  value={editTakeProfit}
                  onChange={(e) => setEditTakeProfit(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-[var(--glass-border)] text-[var(--color-olive)] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-[var(--color-muted)] block mb-1">Net Profit/Loss ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editNetProfitLoss}
                  onChange={(e) => setEditNetProfitLoss(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-[var(--glass-border)] text-[var(--color-ink)] font-bold focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-[var(--color-muted)] block mb-1">Strategy Setup</label>
                <select
                  value={editStrategyId}
                  onChange={(e) => setEditStrategyId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-[var(--glass-border)] text-[var(--color-ink)] focus:outline-none"
                >
                  <option value="">No Strategy</option>
                  {strategies.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-[var(--color-muted)] block mb-1">Execution Date & Time</label>
                <input
                  type="datetime-local"
                  value={editEntryTime}
                  onChange={(e) => setEditEntryTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-[var(--glass-border)] text-[var(--color-ink)] focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-[var(--color-muted)] block mb-1">Entry Reason / Confluence</label>
                <textarea
                  rows={2}
                  value={editEntryReason}
                  onChange={(e) => setEditEntryReason(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-[var(--glass-border)] text-[var(--color-ink)] font-sans text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-[var(--color-muted)] block mb-1">Exit Reason / Notes</label>
                <textarea
                  rows={2}
                  value={editExitReason}
                  onChange={(e) => setEditExitReason(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-[var(--glass-border)] text-[var(--color-ink)] font-sans text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-[var(--glass-border)]">
              <button
                type="button"
                onClick={() => setIsEditingTrade(false)}
                className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-[var(--color-muted)] text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingDetails}
                className="px-4 py-1.5 rounded-lg bg-[var(--color-ocean)] text-slate-950 font-bold hover:brightness-110 text-xs flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" />
                <span>{isSavingDetails ? 'Saving...' : 'Save Trade Details'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Symbol & Financial Header */}
        <div className="flex items-start justify-between border-b border-[var(--glass-border)] pb-4 mb-5">
          <div>
            <h2 className="text-2xl font-bold font-mono text-[var(--color-ink)] tracking-wide">
              {trade.symbol}
            </h2>
            <p className="text-xs text-[var(--color-muted)] font-mono mt-0.5">
              {trade.trading_account_name || 'Trading Account'} • {trade.timeframe} • Execution: {new Date(trade.open_time || trade.entry_time || trade.created_at || Date.now()).toLocaleString()}
            </p>
          </div>

          <div className="text-right">
            <span
              className={`text-2xl font-bold font-mono ${
                isWin ? 'text-[var(--color-olive)]' : 'text-[var(--color-rust)]'
              }`}
            >
              {isWin ? '+' : ''}${Number(trade.net_profit_loss).toLocaleString()} USD
            </span>
            <span className="block text-xs font-mono text-[var(--color-muted)]">
              {trade.r_multiple > 0 ? `+${trade.r_multiple}R` : `${trade.r_multiple}R`} • {trade.profit_loss_percent > 0 ? `+${trade.profit_loss_percent}%` : `${trade.profit_loss_percent}%`}
            </span>
          </div>
        </div>

        {/* High-Impact News Proximity Alert Banner (PRD Section 23) */}
        {trade.correlated_news && (
          <div className="mb-4 rounded-xl border border-[var(--color-rust)]/30 bg-rose-950/30 p-3.5 flex items-start space-x-3 text-xs font-mono text-[var(--color-rust)]">
            <ShieldAlert className="h-5 w-5 text-[var(--color-rust)] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold uppercase tracking-wider block">
                MACRO NEWS PROXIMITY ALERT // Δt = {trade.correlated_news.time_diff_minutes}m
              </span>
              <p className="text-[var(--color-ink)] mt-1 font-sans">
                Trade was entered within {trade.correlated_news.time_diff_minutes} minutes of high-impact release:{' '}
                <span className="font-bold text-[var(--color-rust)] font-mono">{trade.correlated_news.event_name}</span> ({trade.correlated_news.currency}).
                Heightened spread expansion and slippage risks apply.
              </p>
            </div>
          </div>
        )}

        {/* Nearby Macro Events Card (Forex Factory News Integration) */}
        {nearbyEvents.length > 0 && (
          <div className="mb-5 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-4 font-mono text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-2">
              <div className="flex items-center space-x-2 text-[var(--color-ink)] font-bold">
                <Calendar className="h-4 w-4 text-[var(--color-ocean)]" />
                <span>NEARBY MACROECONOMIC EVENTS (±3 HOURS)</span>
              </div>
              <span className="text-[10px] text-[var(--color-muted)]">
                {nearbyEvents.length} event{nearbyEvents.length > 1 ? 's' : ''} found
              </span>
            </div>

            <div className="space-y-2">
              {nearbyEvents.map(({ event, time_diff_minutes, is_before_trade }) => {
                const impactColor =
                  event.impact === 'high'
                    ? 'bg-[var(--color-rust)]/20 text-[var(--color-rust)] border-[var(--color-rust)]/30'
                    : event.impact === 'medium'
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20';

                return (
                  <div
                    key={event.id}
                    className="p-2.5 rounded-lg bg-black/20 border border-[var(--glass-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border ${impactColor}`}>
                        {event.impact}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/[0.05] border border-[var(--glass-border)] text-[var(--color-ink)] font-bold">
                        {event.currency}
                      </span>
                      <span className="text-xs font-medium text-[var(--color-ink)] truncate font-sans">
                        {event.event_name}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-[11px] text-[var(--color-muted)] shrink-0">
                      {event.actual && (
                        <span>
                          Act: <span className="text-[var(--color-ink)] font-bold">{event.actual}</span>
                        </span>
                      )}
                      {event.forecast && <span>Fcst: {event.forecast}</span>}
                      {event.previous && <span>Prev: {event.previous}</span>}
                      <span className="px-2 py-0.5 rounded bg-white/[0.05] text-[var(--color-ink)] text-[10px]">
                        {new Date(event.event_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} UTC ({time_diff_minutes === 0
                          ? 'Exact time'
                          : `${time_diff_minutes}m ${is_before_trade ? 'prior' : 'after'}`})
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Explicit PRD causality disclaimer */}
            <div className="flex items-center space-x-2 text-[10px] text-[var(--color-muted)] pt-1 italic">
              <Info className="h-3.5 w-3.5 shrink-0 text-[var(--color-ocean)]" />
              <span>
                Contextual correlation only (does not imply causality). Macroeconomic announcements create liquidity vacuums and execution deviation.
              </span>
            </div>
          </div>
        )}

        {/* Multi-Stage Trade Screenshot Gallery (PRD Section 16) */}
        <div className="mb-5 bg-[var(--glass-bg)] border border-[var(--glass-border)] p-4 rounded-xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--glass-border)] pb-2.5">
            <div className="flex items-center space-x-2">
              <ImageIcon className="h-4 w-4 text-[var(--color-ocean)]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]">
                Trade Screenshots
              </span>
              <span className="text-[10px] text-[var(--color-muted)] font-mono">
                (Before / During / After)
              </span>
            </div>

            {/* Stage selector tabs */}
            <div className="flex items-center space-x-1 p-0.5 bg-black/20 rounded-lg border border-[var(--glass-border)]">
              {(['before', 'during', 'after'] as TradeImageType[]).map((stage) => {
                const stageCount = screenshots.filter((s) => s.image_type === stage).length;
                const isActive = activeScreenshotStage === stage;
                const stageTitles: Record<TradeImageType, string> = {
                  before: 'Before Entry',
                  during: 'During Trade',
                  after: 'After Exit',
                };

                return (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => setActiveScreenshotStage(stage)}
                    className={`px-2.5 py-1 text-xs rounded-md font-mono transition flex items-center space-x-1.5 ${
                      isActive
                        ? 'bg-[var(--color-ocean)] text-white font-semibold shadow-sm'
                        : 'text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-white/[0.04]'
                    }`}
                  >
                    <span>{stageTitles[stage]}</span>
                    {stageCount > 0 && (
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                          isActive ? 'bg-white text-[var(--color-ocean)]' : 'bg-white/10 text-[var(--color-ink)]'
                        }`}
                      >
                        {stageCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Stage Subtitle & Upload Trigger */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--color-muted)] font-mono">
            <span className="italic">
              {activeScreenshotStage === 'before' && '📌 Pre-trade technical setup, market structure, and entry trigger.'}
              {activeScreenshotStage === 'during' && '⏱️ Active management, partial profit scale-outs, or trailing stops.'}
              {activeScreenshotStage === 'after' && '🏁 Final outcome review, target/stop exit, and post-trade insights.'}
            </span>

            <label className="cursor-pointer inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-mono bg-white/[0.06] hover:bg-white/[0.12] border border-[var(--glass-border)] text-[var(--color-ink)] transition shrink-0">
              {isUploadingScreenshot ? (
                <RefreshCw className="h-3 w-3 text-[var(--color-ocean)] animate-spin" />
              ) : (
                <Upload className="h-3 w-3 text-[var(--color-ocean)]" />
              )}
              <span>{isUploadingScreenshot ? 'Uploading...' : `Upload ${activeScreenshotStage}`}</span>
              <input
                type="file"
                accept="image/*"
                disabled={isUploadingScreenshot}
                onChange={(e) => handleUploadScreenshot(e, activeScreenshotStage)}
                className="hidden"
              />
            </label>
          </div>

          {screenshotUploadError && (
            <div className="text-[11px] text-[var(--color-rust)] font-mono bg-[var(--color-rust)]/10 px-3 py-1.5 rounded-lg">
              ⚠️ {screenshotUploadError}
            </div>
          )}

          {/* Screenshot Display Grid for Active Stage */}
          {(() => {
            const currentScreenshots = screenshots.filter((s) => s.image_type === activeScreenshotStage);

            if (currentScreenshots.length === 0) {
              return (
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[var(--glass-border)] hover:border-[var(--color-ocean)] rounded-xl cursor-pointer bg-black/10 transition group">
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploadingScreenshot}
                    onChange={(e) => handleUploadScreenshot(e, activeScreenshotStage)}
                    className="hidden"
                  />
                  {isUploadingScreenshot ? (
                    <div className="flex items-center space-x-2 text-[var(--color-ocean)] font-mono text-xs">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Uploading to trading-screenshots/...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center space-y-1">
                      <Upload className="h-6 w-6 text-[var(--color-ocean)] group-hover:scale-110 transition" />
                      <span className="text-xs font-semibold text-[var(--color-ink)]">
                        No {activeScreenshotStage} screenshot yet
                      </span>
                      <span className="text-[10px] text-[var(--color-muted)] font-mono">
                        Click to upload chart screenshot for {activeScreenshotStage} stage
                      </span>
                    </div>
                  )}
                </label>
              );
            }

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentScreenshots.map((sc) => (
                  <div
                    key={sc.id}
                    className="relative rounded-xl overflow-hidden border border-[var(--glass-border)] bg-black/40 group flex flex-col"
                  >
                    <div className="relative h-44 w-full overflow-hidden bg-black/60">
                      <img
                        src={sc.file_path}
                        alt={`${sc.image_type} chart screenshot`}
                        className="w-full h-full object-cover transition duration-300 group-hover:scale-105 cursor-pointer"
                        onClick={() => setLightboxImage({ url: sc.file_path, title: `${sc.image_type.toUpperCase()} Chart - ${trade.symbol}` })}
                      />
                      <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-90 group-hover:opacity-100 transition">
                        <button
                          type="button"
                          onClick={() => setLightboxImage({ url: sc.file_path, title: `${sc.image_type.toUpperCase()} Chart - ${trade.symbol}` })}
                          className="p-1.5 rounded-lg bg-black/70 hover:bg-black text-white transition backdrop-blur-sm"
                          title="Full Screen Chart"
                        >
                          <Maximize2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteScreenshot(sc)}
                          className="p-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white transition shadow-sm"
                          title="Delete screenshot"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="px-3 py-2 flex items-center justify-between text-[10px] font-mono text-[var(--color-muted)] bg-white/[0.02]">
                      <span className="capitalize px-1.5 py-0.5 rounded bg-[var(--color-ocean)]/20 text-[var(--color-ocean)] font-bold">
                        {sc.image_type} stage
                      </span>
                      <span>
                        {sc.created_at ? new Date(sc.created_at).toLocaleDateString() : 'Uploaded'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Execution Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs mb-5">
          <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] p-2.5 rounded-xl">
            <span className="text-[10px] text-[var(--color-muted)] block uppercase">Entry Price</span>
            <span className="text-[var(--color-ink)] font-bold text-sm">{trade.entry_price}</span>
          </div>
          <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] p-2.5 rounded-xl">
            <span className="text-[10px] text-[var(--color-muted)] block uppercase">Exit Price</span>
            <span className="text-[var(--color-ink)] font-bold text-sm">{trade.exit_price || '-'}</span>
          </div>
          <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] p-2.5 rounded-xl">
            <span className="text-[10px] text-[var(--color-muted)] block uppercase">Stop Loss</span>
            <span className="text-[var(--color-rust)] font-bold text-sm">{trade.stop_loss || '-'}</span>
          </div>
          <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] p-2.5 rounded-xl">
            <span className="text-[10px] text-[var(--color-muted)] block uppercase">Take Profit</span>
            <span className="text-[var(--color-olive)] font-bold text-sm">{trade.take_profit || '-'}</span>
          </div>
          <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] p-2.5 rounded-xl">
            <span className="text-[10px] text-[var(--color-muted)] block uppercase">Position Size</span>
            <span className="text-[var(--color-ink)] font-bold text-sm">{trade.position_size} Lots</span>
          </div>
          <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] p-2.5 rounded-xl">
            <span className="text-[10px] text-[var(--color-muted)] block uppercase">Leverage</span>
            <span className="text-[var(--color-ink)] font-bold text-sm">1:{trade.leverage || 100}</span>
          </div>
          <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] p-2.5 rounded-xl">
            <span className="text-[10px] text-[var(--color-muted)] block uppercase">Commission / Swap</span>
            <span className="text-[var(--color-ink)] font-bold text-sm">
              ${trade.commission ?? 0} / ${trade.swap ?? 0}
            </span>
          </div>
          <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] p-2.5 rounded-xl">
            <span className="text-[10px] text-[var(--color-muted)] block uppercase">Risk / Reward</span>
            <span className="text-[var(--color-ink)] font-bold text-sm">
              ${trade.risk_amount ?? 0} / ${trade.reward_amount ?? 0}
            </span>
          </div>
        </div>

        {/* Interactive Psychology Telemetry & Debrief Note (PRD Section 15 & 16) */}
        <div className="rounded-xl border border-[var(--color-ocean)]/25 bg-violet-950/10 p-4 font-mono text-xs mb-5 space-y-3.5">
          <div className="flex items-center justify-between border-b border-[var(--color-ocean)]/20 pb-2">
            <div className="flex items-center space-x-2 text-[var(--color-ocean)] font-bold">
              <Brain className="h-4 w-4" />
              <span>PSYCHOLOGICAL DEBRIEF & DISCIPLINE AUDIT</span>
            </div>
            {saveSuccess && (
              <span className="text-emerald-400 text-[11px] flex items-center space-x-1 animate-in fade-in">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Reflection Saved</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Emotion Selector */}
            <div>
              <label className="text-[10px] text-[var(--color-muted)] block mb-1 uppercase">
                Dominant Emotion
              </label>
              <select
                value={psychologyState.emotion}
                onChange={(e) =>
                  setPsychologyState((prev) => ({
                    ...prev,
                    emotion: e.target.value as TradePsychology['emotion'],
                  }))
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--color-ink)] font-mono text-xs focus:outline-none focus:border-[var(--color-ocean)]"
              >
                <option value="calm">Calm / Flow State</option>
                <option value="confident">Confident</option>
                <option value="neutral">Neutral</option>
                <option value="anxious">Anxious / Stressed</option>
                <option value="fearful">Fearful / Hesitant</option>
                <option value="greedy">Greedy / Overleveraged</option>
                <option value="frustrated">Frustrated</option>
                <option value="euphoric">Euphoric</option>
              </select>
            </div>

            {/* Discipline Rating */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] text-[var(--color-muted)] uppercase">Discipline Score</label>
                <span className="text-[var(--color-olive)] font-bold">{psychologyState.discipline_score} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={psychologyState.discipline_score}
                onChange={(e) =>
                  setPsychologyState((prev) => ({
                    ...prev,
                    discipline_score: parseInt(e.target.value, 10),
                  }))
                }
                className="w-full accent-[var(--color-olive)] h-1.5 bg-black/40 rounded-lg cursor-pointer"
              />
            </div>

            {/* Confidence Rating */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] text-[var(--color-muted)] uppercase">Confidence Score</label>
                <span className="text-[var(--color-ocean)] font-bold">{psychologyState.confidence} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={psychologyState.confidence}
                onChange={(e) =>
                  setPsychologyState((prev) => ({
                    ...prev,
                    confidence: parseInt(e.target.value, 10),
                  }))
                }
                className="w-full accent-[var(--color-ocean)] h-1.5 bg-black/40 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Behavioral Flags */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() =>
                setPsychologyState((prev) => ({
                  ...prev,
                  followed_plan: !prev.followed_plan,
                }))
              }
              className={`px-3 py-1 rounded-lg border text-xs font-mono transition flex items-center space-x-1.5 ${
                psychologyState.followed_plan
                  ? 'bg-[var(--color-olive)]/15 border-[var(--color-olive)]/30 text-[var(--color-olive)]'
                  : 'bg-[var(--color-rust)]/20 border-[var(--color-rust)]/40 text-[var(--color-rust)]'
              }`}
            >
              <span>Plan Followed: {psychologyState.followed_plan ? 'YES (Disciplined)' : 'NO (Deviation)'}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setPsychologyState((prev) => ({
                  ...prev,
                  fomo: !prev.fomo,
                }))
              }
              className={`px-3 py-1 rounded-lg border text-xs font-mono transition flex items-center space-x-1.5 ${
                psychologyState.fomo
                  ? 'bg-[var(--color-rust)]/25 border-[var(--color-rust)]/40 text-[var(--color-rust)]'
                  : 'bg-white/[0.04] border-[var(--glass-border)] text-[var(--color-muted)]'
              }`}
            >
              <span>FOMO Entry: {psychologyState.fomo ? 'YES' : 'NO'}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setPsychologyState((prev) => ({
                  ...prev,
                  revenge_trading: !prev.revenge_trading,
                }))
              }
              className={`px-3 py-1 rounded-lg border text-xs font-mono transition flex items-center space-x-1.5 ${
                psychologyState.revenge_trading
                  ? 'bg-[var(--color-rust)]/25 border-[var(--color-rust)]/40 text-[var(--color-rust)]'
                  : 'bg-white/[0.04] border-[var(--glass-border)] text-[var(--color-muted)]'
              }`}
            >
              <span>Revenge Trading: {psychologyState.revenge_trading ? 'YES' : 'NO'}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setPsychologyState((prev) => ({
                  ...prev,
                  greed: !prev.greed,
                }))
              }
              className={`px-3 py-1 rounded-lg border text-xs font-mono transition flex items-center space-x-1.5 ${
                psychologyState.greed
                  ? 'bg-amber-500/25 border-amber-500/40 text-amber-400'
                  : 'bg-white/[0.04] border-[var(--glass-border)] text-[var(--color-muted)]'
              }`}
            >
              <span>Greed: {psychologyState.greed ? 'YES (Overleveraged/No TP)' : 'NO'}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setPsychologyState((prev) => ({
                  ...prev,
                  fear: !prev.fear,
                }))
              }
              className={`px-3 py-1 rounded-lg border text-xs font-mono transition flex items-center space-x-1.5 ${
                psychologyState.fear
                  ? 'bg-purple-500/25 border-purple-500/40 text-purple-300'
                  : 'bg-white/[0.04] border-[var(--glass-border)] text-[var(--color-muted)]'
              }`}
            >
              <span>Fear / Hesitation: {psychologyState.fear ? 'YES' : 'NO'}</span>
            </button>
          </div>

          {/* Notes: Pre-Trade, In-Trade, Post-Trade, Lessons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[var(--color-muted)] block mb-1 uppercase">
                Pre-Trade Note & Mental State
              </label>
              <textarea
                rows={2}
                value={psychologyState.before_trade_note || ''}
                onChange={(e) =>
                  setPsychologyState((prev) => ({
                    ...prev,
                    before_trade_note: e.target.value,
                  }))
                }
                placeholder="Initial mindset, setup verification, emotional state before clicking..."
                className="w-full px-3 py-2 rounded-xl bg-black/30 border border-[var(--glass-border)] text-[var(--color-ink)] text-xs font-sans placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-ocean)]"
              />
            </div>

            <div>
              <label className="text-[10px] text-[var(--color-muted)] block mb-1 uppercase">
                During-Trade Note & Trade Management
              </label>
              <textarea
                rows={2}
                value={psychologyState.during_trade_note || ''}
                onChange={(e) =>
                  setPsychologyState((prev) => ({
                    ...prev,
                    during_trade_note: e.target.value,
                  }))
                }
                placeholder="Emotions while holding, urges to exit early or move SL..."
                className="w-full px-3 py-2 rounded-xl bg-black/30 border border-[var(--glass-border)] text-[var(--color-ink)] text-xs font-sans placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-ocean)]"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-[var(--color-muted)] block mb-1 uppercase">
              Post-Execution Debrief & Outcome Review
            </label>
            <textarea
              rows={2}
              value={psychologyState.after_trade_note || ''}
              onChange={(e) =>
                setPsychologyState((prev) => ({
                  ...prev,
                  after_trade_note: e.target.value,
                }))
              }
              placeholder="Record any cognitive bias, emotional triggers, trade management adjustments, or execution slip..."
              className="w-full px-3 py-2 rounded-xl bg-black/30 border border-[var(--glass-border)] text-[var(--color-ink)] text-xs font-sans placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-ocean)]"
            />
          </div>

          <div>
            <label className="text-[10px] text-[var(--color-muted)] block mb-1 uppercase">
              Lessons Learned & Future Rules
            </label>
            <textarea
              rows={2}
              value={psychologyState.lessons_learned || ''}
              onChange={(e) =>
                setPsychologyState((prev) => ({
                  ...prev,
                  lessons_learned: e.target.value,
                }))
              }
              placeholder="What rule will prevent a similar mistake or repeat this good execution next time?"
              className="w-full px-3 py-2 rounded-xl bg-black/30 border border-[var(--glass-border)] text-[var(--color-ink)] text-xs font-sans placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-ocean)]"
            />
          </div>

          {/* Save Reflection Button */}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleSaveDebrief}
              disabled={isSaving}
              className="px-4 py-1.5 rounded-xl bg-[var(--color-ocean)]/20 hover:bg-[var(--color-ocean)]/30 border border-[var(--color-ocean)]/40 text-[var(--color-ocean)] font-mono text-xs font-bold transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{isSaving ? 'Saving Debrief...' : 'Save Debrief Reflection'}</span>
            </button>
          </div>
        </div>

        {/* AI Trade Analysis (Google Gemini Integration) */}
        <div className="mb-5 rounded-2xl border border-[var(--color-ocean)]/30 bg-[var(--surface-tint)] p-4 sm:p-5 font-mono text-xs space-y-3 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--glass-border)] pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-[var(--color-ocean)]/20 text-[var(--color-ocean)] border border-[var(--color-ocean)]/40">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[10px] text-[var(--color-ocean)] tracking-wider uppercase font-bold block">
                  AI COACH // GOOGLE GEMINI ENGINE
                </span>
                <h4 className="text-sm font-bold text-[var(--color-ink)] font-sans">
                  {aiInsightTitle || 'Analisis Eksekusi & Manajemen Risiko Trade'}
                </h4>
              </div>
            </div>

            {aiAnalysis && (
              <button
                type="button"
                onClick={handleRunAiAnalysis}
                disabled={isLoadingAi}
                className="self-start sm:self-auto px-3 py-1 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-[var(--glass-border)] text-[var(--color-muted)] hover:text-[var(--color-ink)] transition flex items-center space-x-1.5 disabled:opacity-50 text-[11px]"
              >
                <RefreshCw className={`h-3 w-3 ${isLoadingAi ? 'animate-spin' : ''}`} />
                <span>Analisis Ulang</span>
              </button>
            )}
          </div>

          {isLoadingAi && (
            <div className="py-8 text-center space-y-3">
              <div className="inline-flex p-3 rounded-full bg-[var(--color-ocean)]/20 border border-[var(--color-ocean)]/40 text-[var(--color-ocean)] animate-pulse">
                <Bot className="h-6 w-6 animate-bounce" />
              </div>
              <p className="text-xs text-[var(--color-ink)] font-medium font-sans">
                Gemini sedang membedah kualitas eksekusi, Risk-to-Reward, dan kepatuhan psikologi trade Anda...
              </p>
              <p className="text-[11px] text-[var(--color-muted)]">Menghubungkan data trade & trade_psychology ke AI Gateway</p>
            </div>
          )}

          {aiError && !isLoadingAi && (
            <div className="p-3 rounded-xl bg-[var(--color-rust)]/20 border border-[var(--color-rust)]/40 text-[var(--color-rust)] space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold">
                <AlertTriangle className="h-4 w-4" />
                <span>Gagal Memproses AI Analysis</span>
              </div>
              <p className="text-xs font-sans">{aiError}</p>
              <button
                type="button"
                onClick={handleRunAiAnalysis}
                className="px-3 py-1 rounded-lg bg-[var(--color-rust)]/30 hover:bg-[var(--color-rust)]/40 text-xs font-bold transition"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {!isLoadingAi && !aiAnalysis && !aiError && (
            <div className="py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <p className="text-xs text-[var(--color-ink)] font-sans font-medium">
                  Belum ada analisis AI untuk trade ini.
                </p>
                <p className="text-[11px] text-[var(--color-muted)] font-sans">
                  Dapatkan audit objektif meliputi kesesuaian SOP, rasio R:R aktual, evaluasi bias emosi, dan aturan perbaikan ke depan.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunAiAnalysis}
                className="px-4 py-2 rounded-xl bg-[var(--color-ink)] text-[var(--color-paper)] hover:bg-[var(--color-rust)] font-mono text-xs font-bold transition flex items-center space-x-2 shrink-0 shadow-lg"
              >
                <Sparkles className="h-4 w-4 text-[var(--color-gold)]" />
                <span>Bedah Trade dengan Gemini AI</span>
              </button>
            </div>
          )}

          {!isLoadingAi && aiAnalysis && (
            <div className="pt-2 text-xs text-[var(--color-ink)] space-y-3 font-sans leading-relaxed whitespace-pre-wrap rounded-xl bg-black/15 p-4 border border-[var(--glass-border)]">
              {aiAnalysis}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--glass-border)] font-mono text-xs">
          <button
            onClick={async () => {
              if (confirm('Delete this trade from journal?')) {
                await deleteTrade(trade.id);
                setSelectedTradeForDetail(null);
              }
            }}
            className="flex items-center space-x-1.5 text-[var(--color-rust)] hover:text-[var(--color-rust)] transition"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete Trade</span>
          </button>

          <button
            onClick={() => setSelectedTradeForDetail(null)}
            className="px-5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-[var(--color-ink)] transition"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>

      {/* Fullscreen Lightbox Modal for Chart Analysis */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-6xl max-h-[95vh] w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-3 text-white">
              <div className="flex items-center space-x-2">
                <ImageIcon className="h-4 w-4 text-[var(--color-ocean)]" />
                <span className="font-mono text-sm font-semibold tracking-wider text-[var(--color-ink)]">
                  {lightboxImage.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl bg-black flex items-center justify-center max-h-[82vh] w-full">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                className="max-h-[82vh] max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
