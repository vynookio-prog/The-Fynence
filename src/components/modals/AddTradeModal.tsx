'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  X,
  TrendingUp,
  Brain,
  ShieldCheck,
  Camera,
  ArrowRight,
  Check,
  AlertTriangle,
  Upload,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';
import {
  AssetType,
  TradeDirection,
  Timeframe,
  TradingSession,
  EmotionType,
  TradeImageType,
} from '@/types';
import { uploadTradeScreenshotAction } from '@/app/actions';
import { detectNewsCorrelation } from '@/lib/correlation';

export const AddTradeModal: React.FC = () => {
  const {
    isAddTradeOpen,
    setIsAddTradeOpen,
    tradingAccounts = [],
    strategies = [],
    marketEvents = [],
    addTrade,
  } = useApp();

  // Wizard Tab: 1 = Execution, 2 = Strategy, 3 = Psychology, 4 = Review & Save
  const [step, setStep] = useState<number>(1);

  // Step 1: Execution Data
  const [tradingAccountId, setTradingAccountId] = useState(tradingAccounts?.[0]?.id || '');
  const [symbol, setSymbol] = useState('XAUUSD');
  const [assetType, setAssetType] = useState<AssetType>('commodities');
  const [direction, setDirection] = useState<TradeDirection>('buy');
  const [entryPrice, setEntryPrice] = useState('2510.0');
  const [exitPrice, setExitPrice] = useState('2525.0');
  const [stopLoss, setStopLoss] = useState('2505.0');
  const [takeProfit, setTakeProfit] = useState('2525.0');
  const [positionSize, setPositionSize] = useState('2.0');
  const [timeframe, setTimeframe] = useState<Timeframe>('M5');
  const [session, setSession] = useState<TradingSession>('London');
  const [tradeDate, setTradeDate] = useState(() => new Date().toISOString().slice(0, 16));

  // Step 2: Setup & Strategy
  const [strategyId, setStrategyId] = useState(strategies?.[0]?.id || '');

  React.useEffect(() => {
    if (!tradingAccountId && tradingAccounts?.length) {
      setTradingAccountId(tradingAccounts[0].id);
    }
  }, [tradingAccounts, tradingAccountId]);

  React.useEffect(() => {
    if (!strategyId && strategies?.length) {
      setStrategyId(strategies[0].id);
    }
  }, [strategies, strategyId]);
  const [entryReason, setEntryReason] = useState('Key liquidity pool purge with bullish market structure shift on M5.');
  const [exitReason, setExitReason] = useState('Hit full target at session resistance.');

  // Step 3: Psychology
  const [emotion, setEmotion] = useState<EmotionType>('confident');
  const [confidence, setConfidence] = useState<number>(8);
  const [disciplineScore, setDisciplineScore] = useState<number>(9);
  const [fomo, setFomo] = useState<boolean>(false);
  const [revengeTrading, setRevengeTrading] = useState<boolean>(false);
  const [greed, setGreed] = useState<boolean>(false);
  const [fear, setFear] = useState<boolean>(false);
  const [followedPlan, setFollowedPlan] = useState<boolean>(true);
  const [beforeNote, setBeforeNote] = useState('Waited patiently for Asian session sweep.');
  const [duringNote, setDuringNote] = useState('Held through brief retracement without moving SL.');
  const [afterNote, setAfterNote] = useState('Good execution according to plan.');
  const [lessonsLearned, setLessonsLearned] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [uploadStage, setUploadStage] = useState<TradeImageType>('before');
  const [attachedScreenshots, setAttachedScreenshots] = useState<Array<{ id: string; url: string; image_type: TradeImageType }>>([]);
  const [directUrlInput, setDirectUrlInput] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('imageType', uploadStage);
      const res = await uploadTradeScreenshotAction(formData);
      if (res.error) {
        setUploadError(res.error);
      } else if (res.url) {
        const newItem = {
          id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          url: res.url,
          image_type: uploadStage,
        };
        setAttachedScreenshots((prev) => [...prev, newItem]);
        if (!screenshotUrl || uploadStage === 'before') {
          setScreenshotUrl(res.url);
        }
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleAddDirectUrl = () => {
    if (!directUrlInput.trim()) return;
    const url = directUrlInput.trim();
    const newItem = {
      id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      url,
      image_type: uploadStage,
    };
    setAttachedScreenshots((prev) => [...prev, newItem]);
    if (!screenshotUrl || uploadStage === 'before') {
      setScreenshotUrl(url);
    }
    setDirectUrlInput('');
  };

  const handleRemoveScreenshot = (id: string) => {
    setAttachedScreenshots((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      const remainingBefore = filtered.find((s) => s.image_type === 'before');
      setScreenshotUrl(remainingBefore?.url || filtered[0]?.url || '');
      return filtered;
    });
  };

  if (!isAddTradeOpen) return null;

  // Auto-calculation
  const entryNum = parseFloat(entryPrice) || 0;
  const exitNum = parseFloat(exitPrice) || 0;
  const slNum = parseFloat(stopLoss) || 0;
  const sizeNum = parseFloat(positionSize) || 1;

  // Calculate approximate P&L
  let profitLoss = 0;
  let riskAmount = 0;

  if (direction === 'buy') {
    profitLoss = (exitNum - entryNum) * sizeNum * (symbol === 'XAUUSD' ? 100 : 1000);
    riskAmount = Math.abs(entryNum - slNum) * sizeNum * (symbol === 'XAUUSD' ? 100 : 1000);
  } else {
    profitLoss = (entryNum - exitNum) * sizeNum * (symbol === 'XAUUSD' ? 100 : 1000);
    riskAmount = Math.abs(slNum - entryNum) * sizeNum * (symbol === 'XAUUSD' ? 100 : 1000);
  }

  const rMultiple = riskAmount > 0 ? profitLoss / riskAmount : 0;
  const netPnL = profitLoss - 15; // subtracting simulated commission

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const selectedStrat = strategies?.find((s) => s.id === strategyId);
      const selectedAcc = tradingAccounts?.find((a) => a.id === tradingAccountId);

      await addTrade({
        trading_account_id: tradingAccountId,
        trading_account_name: selectedAcc?.name || 'Main Prop',
        symbol: symbol.toUpperCase(),
        asset_type: assetType,
        direction,
        entry_price: entryNum,
        exit_price: exitNum,
        stop_loss: slNum,
        take_profit: parseFloat(takeProfit) || exitNum,
        position_size: sizeNum,
        leverage: 30,
        timeframe,
        session,
        entry_time: new Date(tradeDate).toISOString(),
        exit_time: new Date().toISOString(),
        risk_amount: Math.round(riskAmount),
        reward_amount: Math.round(Math.abs(profitLoss)),
        profit_loss: Math.round(profitLoss),
        profit_loss_percent: parseFloat(((profitLoss / 100000) * 100).toFixed(2)),
        r_multiple: parseFloat(rMultiple.toFixed(2)),
        commission: 15,
        swap: 0,
        net_profit_loss: Math.round(netPnL),
        status: 'closed',
        entry_reason: entryReason,
        exit_reason: exitReason,
        strategy_id: strategyId,
        strategy_name: selectedStrat?.name || 'Custom Setup',
        psychology: {
          emotion,
          confidence,
          discipline_score: disciplineScore,
          fomo,
          revenge_trading: revengeTrading,
          greed,
          fear,
          followed_plan: followedPlan,
          before_trade_note: beforeNote,
          during_trade_note: duringNote,
          after_trade_note: afterNote,
          lessons_learned: lessonsLearned,
        },
        screenshot_url: screenshotUrl || attachedScreenshots[0]?.url || undefined,
        screenshots: attachedScreenshots.length > 0
          ? attachedScreenshots.map((s) => ({
              id: '',
              trade_id: '',
              user_id: '',
              file_path: s.url,
              image_type: s.image_type,
            }))
          : (screenshotUrl ? [{
              id: '',
              trade_id: '',
              user_id: '',
              file_path: screenshotUrl,
              image_type: 'before' as TradeImageType,
            }] : undefined),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={() => setIsAddTradeOpen(false)}
    >
      <div className="min-h-full flex items-center justify-center p-3 sm:p-6">
        <div
          className="liquid-glass-glow w-full max-w-2xl rounded-2xl p-5 sm:p-7 border-[var(--glass-border)] relative my-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
        <button
          onClick={() => setIsAddTradeOpen(false)}
          className="absolute top-5 right-5 text-[var(--color-muted)] hover:text-[var(--color-ink)] transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-5 border-b border-[var(--glass-border)] pb-3">
          <div className="p-2 rounded-xl bg-[var(--color-ocean)]/10 text-[var(--color-ocean)] border border-[var(--color-ocean)]/20">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold font-mono text-[var(--color-ink)]">Log Trading Journal & Psychology</h2>
            <p className="text-xs text-[var(--color-muted)]">Record execution telemetry, emotional discipline, and chart review</p>
          </div>
        </div>

        {/* Step Wizard Indicator */}
        <div className="grid grid-cols-4 gap-2 mb-6 font-mono text-xs">
          <button
            onClick={() => setStep(1)}
            className={`p-2 rounded-lg border text-center transition ${
              step === 1
                ? 'bg-[var(--color-ocean)]/20 text-[var(--color-ocean)] border-[var(--color-ocean)]/40 font-bold'
                : 'bg-[var(--glass-bg)] text-[var(--color-muted)] border-[var(--glass-border)]'
            }`}
          >
            1. Execution
          </button>
          <button
            onClick={() => setStep(2)}
            className={`p-2 rounded-lg border text-center transition ${
              step === 2
                ? 'bg-[var(--color-ocean)]/20 text-[var(--color-ocean)] border-[var(--color-ocean)]/40 font-bold'
                : 'bg-[var(--glass-bg)] text-[var(--color-muted)] border-[var(--glass-border)]'
            }`}
          >
            2. Setup
          </button>
          <button
            onClick={() => setStep(3)}
            className={`p-2 rounded-lg border text-center transition ${
              step === 3
                ? 'bg-[var(--color-ocean)]/20 text-[var(--color-ocean)] border-[var(--color-ocean)]/40 font-bold'
                : 'bg-[var(--glass-bg)] text-[var(--color-muted)] border-[var(--glass-border)]'
            }`}
          >
            3. Psychology
          </button>
          <button
            onClick={() => setStep(4)}
            className={`p-2 rounded-lg border text-center transition ${
              step === 4
                ? 'bg-[var(--color-ocean)]/20 text-[var(--color-ocean)] border-[var(--color-ocean)]/40 font-bold'
                : 'bg-[var(--glass-bg)] text-[var(--color-muted)] border-[var(--glass-border)]'
            }`}
          >
            4. Review & Save
          </button>
        </div>

        {/* STEP 1: EXECUTION */}
        {step === 1 && (
          <div className="space-y-4 font-mono text-xs">
            {(() => {
              const liveCorrelation = detectNewsCorrelation(symbol, new Date().toISOString(), marketEvents);
              if (!liveCorrelation) return null;
              return (
                <div className="rounded-xl border border-[var(--color-rust)]/40 bg-rose-950/20 p-3 flex items-center justify-between text-xs font-mono text-[var(--color-rust)] animate-pulse">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>
                      NEWS PROXIMITY ALERT: {liveCorrelation.event_name} ({liveCorrelation.impact.toUpperCase()}) ±{liveCorrelation.time_diff_minutes}m
                    </span>
                  </div>
                  <span className="text-[10px] bg-[var(--color-rust)]/20 px-1.5 py-0.5 rounded font-bold uppercase">
                    High Volatility
                  </span>
                </div>
              );
            })()}

            {/* Account & Direction */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[var(--color-muted)] mb-1">Trading Account</label>
                <select
                  value={tradingAccountId}
                  onChange={(e) => setTradingAccountId(e.target.value)}
                  className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-[var(--color-ink)] focus:outline-none"
                >
                  {tradingAccounts && tradingAccounts.length > 0 ? (
                    tradingAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))
                  ) : (
                    <option value="">No trading accounts available</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[var(--color-muted)] mb-1">Direction</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDirection('buy')}
                    className={`py-2 rounded-lg font-bold uppercase transition ${
                      direction === 'buy'
                        ? 'bg-[var(--color-olive)]/20 text-[var(--color-olive)] border border-[var(--color-olive)]/40'
                        : 'bg-[var(--glass-bg)] text-[var(--color-muted)]'
                    }`}
                  >
                    BUY / LONG
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection('sell')}
                    className={`py-2 rounded-lg font-bold uppercase transition ${
                      direction === 'sell'
                        ? 'bg-[var(--color-rust)]/20 text-[var(--color-rust)] border border-[var(--color-rust)]/40'
                        : 'bg-[var(--glass-bg)] text-[var(--color-muted)]'
                    }`}
                  >
                    SELL / SHORT
                  </button>
                </div>
              </div>
            </div>

            {/* Symbol, Asset Type, Position Size */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[var(--color-muted)] mb-1">Symbol</label>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-[var(--color-ink)] font-bold uppercase focus:border-[var(--color-ocean)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[var(--color-muted)] mb-1">Asset Class</label>
                <select
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value as AssetType)}
                  className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-[var(--color-ink)] focus:outline-none"
                >
                  <option value="commodities">Commodities (Gold/Oil)</option>
                  <option value="forex">Forex</option>
                  <option value="crypto">Crypto</option>
                  <option value="indices">Indices</option>
                </select>
              </div>
              <div>
                <label className="block text-[var(--color-muted)] mb-1">Size (Lots / Units)</label>
                <input
                  type="number"
                  step="any"
                  value={positionSize}
                  onChange={(e) => setPositionSize(e.target.value)}
                  className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-[var(--color-ink)] focus:border-[var(--color-ocean)] focus:outline-none"
                />
              </div>
            </div>

            {/* Entry, Exit, SL, TP */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[var(--color-muted)] mb-1">Entry Price</label>
                <input
                  type="number"
                  step="any"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                  className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-[var(--color-ink)] focus:border-[var(--color-ocean)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[var(--color-muted)] mb-1">Exit Price</label>
                <input
                  type="number"
                  step="any"
                  value={exitPrice}
                  onChange={(e) => setExitPrice(e.target.value)}
                  className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-[var(--color-ink)] focus:border-[var(--color-ocean)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[var(--color-muted)] mb-1">Stop Loss</label>
                <input
                  type="number"
                  step="any"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-rust)]/20 bg-[var(--glass-bg)] px-3 py-2 text-[var(--color-rust)] focus:border-[var(--color-rust)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[var(--color-muted)] mb-1">Take Profit</label>
                <input
                  type="number"
                  step="any"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-olive)]/20 bg-[var(--glass-bg)] px-3 py-2 text-[var(--color-olive)] focus:border-[var(--color-olive)] focus:outline-none"
                />
              </div>
            </div>

            {/* Timeframe, Session & Trade Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[var(--color-muted)] mb-1">Timeframe</label>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value as Timeframe)}
                  className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-[var(--color-ink)] focus:outline-none"
                >
                  <option value="M1">M1</option>
                  <option value="M5">M5</option>
                  <option value="M15">M15</option>
                  <option value="H1">H1</option>
                  <option value="H4">H4</option>
                  <option value="D1">D1</option>
                </select>
              </div>
              <div>
                <label className="block text-[var(--color-muted)] mb-1">Session</label>
                <select
                  value={session}
                  onChange={(e) => setSession(e.target.value as TradingSession)}
                  className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-[var(--color-ink)] focus:outline-none"
                >
                  <option value="London">London Session</option>
                  <option value="New York">New York Session</option>
                  <option value="Asian">Asian Session</option>
                  <option value="Overlap">London / NY Overlap</option>
                </select>
              </div>
              <div>
                <label className="block text-[var(--color-muted)] mb-1">Execution Date & Time</label>
                <input
                  type="datetime-local"
                  value={tradeDate}
                  onChange={(e) => setTradeDate(e.target.value)}
                  className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-[var(--color-ink)] focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-cyan-600 hover:bg-[var(--color-ocean)] text-[var(--color-ink)] font-bold transition"
              >
                <span>Next: Setup & Strategy</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: SETUP & STRATEGY */}
        {step === 2 && (
          <div className="space-y-4 font-mono text-xs">
            <div>
              <label className="block text-[var(--color-muted)] mb-1">Strategy Setup</label>
              <select
                value={strategyId}
                onChange={(e) => setStrategyId(e.target.value)}
                className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-[var(--color-ink)] focus:outline-none"
              >
                {strategies && strategies.length > 0 ? (
                  strategies.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.win_rate}% WR)
                    </option>
                  ))
                ) : (
                  <option value="">No strategies available</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-[var(--color-muted)] mb-1">Entry Reason & Confluences</label>
              <textarea
                rows={3}
                value={entryReason}
                onChange={(e) => setEntryReason(e.target.value)}
                placeholder="Describe setup confluences: liquidity pool grab, order block, divergence..."
                className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-[var(--color-ink)] focus:border-[var(--color-ocean)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[var(--color-muted)] mb-1">Exit Reason / Trigger</label>
              <textarea
                rows={2}
                value={exitReason}
                onChange={(e) => setExitReason(e.target.value)}
                placeholder="Target achieved, manual close before high impact news, or trailing stop..."
                className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-[var(--color-ink)] focus:border-[var(--color-ocean)] focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[var(--color-muted)] font-mono text-xs flex items-center space-x-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-[var(--color-ocean)]" />
                  <span>Chart Screenshots (Multi-Stage)</span>
                </label>
                {/* Stage Pill Selector */}
                <div className="flex items-center space-x-1 bg-black/20 p-0.5 rounded-lg border border-[var(--glass-border)]">
                  {(['before', 'during', 'after'] as TradeImageType[]).map((stage) => (
                    <button
                      key={stage}
                      type="button"
                      onClick={() => setUploadStage(stage)}
                      className={`px-2 py-0.5 text-[10px] font-mono rounded capitalize transition ${
                        uploadStage === stage
                          ? 'bg-[var(--color-ocean)] text-white font-bold shadow-sm'
                          : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                      }`}
                    >
                      {stage}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload Dropzone */}
              <div className="space-y-2.5">
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-[var(--glass-border)] hover:border-[var(--color-ocean)] rounded-xl p-3.5 cursor-pointer bg-[var(--glass-bg)] transition">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isUploadingImage}
                    className="hidden"
                  />
                  {isUploadingImage ? (
                    <div className="flex items-center space-x-2 text-[var(--color-ocean)] font-mono text-xs">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Uploading {uploadStage} chart to InsForge Storage...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-[var(--color-muted)] font-mono text-center">
                      <Upload className="h-5 w-5 mb-1 text-[var(--color-ocean)]" />
                      <span className="text-xs font-semibold text-[var(--color-ink)]">
                        Upload {uploadStage.toUpperCase()} Chart Screenshot
                      </span>
                      <span className="text-[10px] text-[var(--color-muted)]">
                        Saved to trading-screenshots/{'{user_id}'}/{'{trade_id}'}/{uploadStage}/...
                      </span>
                    </div>
                  )}
                </label>
                {uploadError && <p className="text-[11px] text-[var(--color-rust)]">{uploadError}</p>}

                {/* Direct URL input fallback */}
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={directUrlInput}
                    onChange={(e) => setDirectUrlInput(e.target.value)}
                    placeholder={`Or paste ${uploadStage} image URL (https://...)`}
                    className="flex-1 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-1.5 text-xs text-[var(--color-ink)] focus:border-[var(--color-ocean)] focus:outline-none font-mono"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddDirectUrl();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddDirectUrl}
                    disabled={!directUrlInput.trim()}
                    className="px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] disabled:opacity-40 text-xs font-mono text-[var(--color-ink)] transition"
                  >
                    Add
                  </button>
                </div>

                {/* Attached Screenshots Gallery */}
                {attachedScreenshots.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    {attachedScreenshots.map((item) => (
                      <div
                        key={item.id}
                        className="relative rounded-xl border border-[var(--glass-border)] overflow-hidden bg-black/40 group h-28"
                      >
                        <img
                          src={item.url}
                          alt={`${item.image_type} chart preview`}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute top-1 left-1 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-mono text-[var(--color-ocean)] uppercase font-bold border border-white/10">
                          {item.image_type}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveScreenshot(item.id)}
                          className="absolute top-1 right-1 bg-red-600/80 hover:bg-red-600 text-white p-1 rounded-md text-[10px] shadow-md transition"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-cyan-600 hover:bg-[var(--color-ocean)] text-[var(--color-ink)] font-bold transition"
              >
                <span>Next: Psychology Telemetry</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PSYCHOLOGY & DISCIPLINE (PRD Section 15) */}
        {step === 3 && (
          <div className="space-y-4 font-mono text-xs">
            {/* Emotion Selector */}
            <div>
              <label className="block text-[var(--color-muted)] mb-1">Dominant Emotional State</label>
              <select
                value={emotion}
                onChange={(e) => setEmotion(e.target.value as EmotionType)}
                className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-[var(--color-ink)] capitalize focus:outline-none"
              >
                <option value="confident">Confident / Focused</option>
                <option value="neutral">Neutral / Zen</option>
                <option value="anxious">Anxious / Hesitant</option>
                <option value="greedy">Greedy / Impatient</option>
                <option value="fearful">Fearful / Shaky</option>
                <option value="euphoric">Euphoric / Overconfident</option>
              </select>
            </div>

            {/* Sliders for Confidence & Discipline */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-3">
                <div className="flex justify-between mb-1">
                  <span className="text-[var(--color-muted)]">Confidence:</span>
                  <span className="text-[var(--color-ocean)] font-bold">{confidence} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={confidence}
                  onChange={(e) => setConfidence(parseInt(e.target.value))}
                  className="w-full accent-[var(--color-ocean)]"
                />
              </div>

              <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-3">
                <div className="flex justify-between mb-1">
                  <span className="text-[var(--color-muted)]">Discipline Score:</span>
                  <span className="text-[var(--color-olive)] font-bold">{disciplineScore} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={disciplineScore}
                  onChange={(e) => setDisciplineScore(parseInt(e.target.value))}
                  className="w-full accent-[var(--color-olive)]"
                />
              </div>
            </div>

            {/* Cognitive Bias Checkboxes */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              <label className={`flex items-center space-x-2 p-2.5 rounded-xl border cursor-pointer ${
                fomo ? 'bg-[var(--color-rust)]/20 border-[var(--color-rust)]/40 text-[var(--color-rust)]' : 'bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--color-muted)]'
              }`}>
                <input
                  type="checkbox"
                  checked={fomo}
                  onChange={(e) => setFomo(e.target.checked)}
                  className="accent-[var(--color-rust)]"
                />
                <span className="font-bold">FOMO Entry?</span>
              </label>

              <label className={`flex items-center space-x-2 p-2.5 rounded-xl border cursor-pointer ${
                revengeTrading ? 'bg-[var(--color-rust)]/20 border-[var(--color-rust)]/40 text-[var(--color-rust)]' : 'bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--color-muted)]'
              }`}>
                <input
                  type="checkbox"
                  checked={revengeTrading}
                  onChange={(e) => setRevengeTrading(e.target.checked)}
                  className="accent-[var(--color-rust)]"
                />
                <span className="font-bold">Revenge Trade?</span>
              </label>

              <label className={`flex items-center space-x-2 p-2.5 rounded-xl border cursor-pointer ${
                followedPlan ? 'bg-[var(--color-olive)]/20 border-[var(--color-olive)]/40 text-[var(--color-olive)]' : 'bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--color-muted)]'
              }`}>
                <input
                  type="checkbox"
                  checked={followedPlan}
                  onChange={(e) => setFollowedPlan(e.target.checked)}
                  className="accent-[var(--color-olive)]"
                />
                <span className="font-bold">Followed Plan?</span>
              </label>

              <label className={`flex items-center space-x-2 p-2.5 rounded-xl border cursor-pointer ${
                greed ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--color-muted)]'
              }`}>
                <input
                  type="checkbox"
                  checked={greed}
                  onChange={(e) => setGreed(e.target.checked)}
                  className="accent-amber-500"
                />
                <span className="font-bold">Greed / Overleveraged?</span>
              </label>

              <label className={`flex items-center space-x-2 p-2.5 rounded-xl border cursor-pointer ${
                fear ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' : 'bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--color-muted)]'
              }`}>
                <input
                  type="checkbox"
                  checked={fear}
                  onChange={(e) => setFear(e.target.checked)}
                  className="accent-purple-500"
                />
                <span className="font-bold">Fear / Hesitation?</span>
              </label>
            </div>

            {/* Debrief Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[var(--color-muted)] mb-1">Pre-Trade Mental State</label>
                <textarea
                  rows={2}
                  value={beforeNote}
                  onChange={(e) => setBeforeNote(e.target.value)}
                  placeholder="Patient waiting, Asian sweep confirmation..."
                  className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-[var(--color-ink)] focus:border-[var(--color-ocean)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[var(--color-muted)] mb-1">In-Trade Management</label>
                <textarea
                  rows={2}
                  value={duringNote}
                  onChange={(e) => setDuringNote(e.target.value)}
                  placeholder="Held through retracement, no early exit..."
                  className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-[var(--color-ink)] focus:border-[var(--color-ocean)] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[var(--color-muted)] mb-1">Post-Trade Reflection Notes</label>
              <textarea
                rows={2}
                value={afterNote}
                onChange={(e) => setAfterNote(e.target.value)}
                placeholder="What did you learn from this trade? Did emotions affect execution?"
                className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-[var(--color-ink)] focus:border-[var(--color-ocean)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[var(--color-muted)] mb-1">Lessons Learned & Rules</label>
              <textarea
                rows={2}
                value={lessonsLearned}
                onChange={(e) => setLessonsLearned(e.target.value)}
                placeholder="What rule will prevent a similar mistake or repeat this good execution next time?"
                className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-[var(--color-ink)] focus:border-[var(--color-ocean)] focus:outline-none"
              />
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-xl text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-cyan-600 hover:bg-[var(--color-ocean)] text-[var(--color-ink)] font-bold transition"
              >
                <span>Next: Review & Log</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW & SAVE */}
        {step === 4 && (
          <div className="space-y-4 font-mono text-xs">
            <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-4 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-[var(--glass-border)]">
                <span className="text-[var(--color-ink)] font-bold text-sm">
                  {direction.toUpperCase()} {symbol} ({session})
                </span>
                <span className={`text-base font-bold ${
                  netPnL >= 0 ? 'text-[var(--color-olive)]' : 'text-[var(--color-rust)]'
                }`}>
                  {netPnL >= 0 ? '+' : ''}${netPnL.toFixed(0)} USD
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[var(--color-ink)]">
                <div>R-Multiple: <span className="text-[var(--color-ocean)] font-bold">{rMultiple.toFixed(2)}R</span></div>
                <div>Risk: <span className="text-[var(--color-ink)]">${riskAmount.toFixed(0)}</span></div>
                <div>Discipline: <span className="text-[var(--color-olive)] font-bold">{disciplineScore}/10</span></div>
                <div>Plan Compliant: <span className={followedPlan ? 'text-[var(--color-olive)] font-bold' : 'text-[var(--color-rust)] font-bold'}>{followedPlan ? 'YES' : 'NO'}</span></div>
              </div>

              {fomo && (
                <div className="p-2 rounded bg-rose-950/40 border border-[var(--color-rust)]/30 text-[var(--color-rust)] flex items-center">
                  <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                  <span>Warning: Tagged as FOMO execution.</span>
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2 rounded-xl text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center space-x-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[var(--color-ocean)] to-blue-600 hover:from-[var(--color-ocean)] hover:to-[var(--color-ocean)] text-[var(--color-ink)] font-bold shadow-lg transition hover:scale-105 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                <span>{isSubmitting ? 'Saving to InsForge...' : 'Save to Vyno Journal'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);
};
