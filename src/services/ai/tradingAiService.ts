import 'server-only';
import { callGemini } from './geminiService';
import type { Trade, TradePsychology, AIInsight, AIInsightSeverity } from '@/types';

export interface TradeAnalysisResult {
  insight: AIInsight;
  analysisText: string;
}

export interface PsychologyCoachResult {
  insight: AIInsight;
  coachingText: string;
}

export interface DailySummaryResult {
  insight: AIInsight;
  summaryText: string;
}

const SYSTEM_GUARDRAILS = `
Anda adalah AI Trading Performance Coach & Behavioral Psychologist resmi untuk platform Vyno Finance.
Prinsip utama (PRD #28):
1. Anda BUKAN generator sinyal trading. DILARANG KERAS memberikan sinyal BUY/SELL atau meramal harga pasar di masa depan.
2. Fokus sepenuhnya pada refleksi objektif, kualitas eksekusi, kepatuhan trading plan, pengendalian risiko, dan psikologi trading.
3. Gunakan gaya bahasa profesional, lugas, tenang, dan analitis (ala financial journal / trading desk coach) dalam Bahasa Indonesia.
`;

/**
 * 1. AI Trade Analysis: Menganalisis trade spesifik setelah dibuat/ditutup.
 */
export async function analyzeTradeWithGemini(
  tradeId: string,
  serverClient: any,
  userId: string
): Promise<{ success: boolean; data?: TradeAnalysisResult; error?: string }> {
  try {
    // 1. Fetch trade with user_id check (enforcing RLS & ownership)
    const tradeRes = await serverClient.database
      .from('trades')
      .select()
      .eq('id', tradeId)
      .eq('user_id', userId)
      .single();

    if (tradeRes.error || !tradeRes.data) {
      return { success: false, error: 'Trade tidak ditemukan atau Anda tidak memiliki akses.' };
    }

    const trade: Trade = tradeRes.data;

    // 2. Fetch associated psychology if available
    let psychology: TradePsychology | null = null;
    const psychRes = await serverClient.database
      .from('trade_psychology')
      .select()
      .eq('trade_id', tradeId)
      .eq('user_id', userId)
      .limit(1);

    if (psychRes.data && psychRes.data.length > 0) {
      psychology = psychRes.data[0];
    }

    // 3. Fetch strategy name if linked
    let strategyName = 'Discretionary / No Strategy';
    let strategyRules: string[] = [];
    if (trade.strategy_id) {
      const stratRes = await serverClient.database
        .from('strategies')
        .select('name, rules')
        .eq('id', trade.strategy_id)
        .single();
      if (stratRes.data) {
        strategyName = stratRes.data.name;
        strategyRules = Array.isArray(stratRes.data.rules) ? stratRes.data.rules : [];
      }
    }

    // 4. Construct Context Prompt
    const isProfit = (Number(trade.net_profit_loss) || 0) >= 0;
    const pnlFormatted = `${isProfit ? '+' : ''}$${Number(trade.net_profit_loss || trade.profit_loss || 0).toFixed(2)}`;
    const rMultipleFormatted = trade.r_multiple ? `${Number(trade.r_multiple).toFixed(2)}R` : 'N/A';

    const prompt = `
Analisis trade berikut dengan mendalam:

[DATA TRADE]
- Simbol: ${trade.symbol} (${trade.asset_type || 'forex'})
- Arah: ${trade.direction ? trade.direction.toUpperCase() : 'N/A'}
- Status: ${trade.status}
- Entry Price: ${trade.entry_price} | Exit Price: ${trade.exit_price || 'N/A'}
- Stop Loss: ${trade.stop_loss || 'N/A'} | Take Profit: ${trade.take_profit || 'N/A'}
- Position Size: ${trade.position_size} Lot | Leverage: 1:${trade.leverage || 100}
- Timeframe: ${trade.timeframe || 'N/A'} | Sesi: ${trade.session || 'N/A'}
- Waktu Entry: ${trade.entry_time}
- Waktu Exit: ${trade.exit_time || 'N/A'}
- Net P&L: ${pnlFormatted} (${Number(trade.profit_loss_percent || 0).toFixed(2)}%)
- R-Multiple: ${rMultipleFormatted}
- Alasan Entry: "${trade.entry_reason || 'Tidak dicantumkan'}"
- Alasan Exit: "${trade.exit_reason || 'Tidak dicantumkan'}"
- Trading Plan: "${trade.trading_plan || 'Sesuai SOP standar'}"
- Strategi: ${strategyName} ${strategyRules.length > 0 ? `(Aturan: ${strategyRules.join(', ')})` : ''}

[DATA PSIKOLOGI TRADE]
${
  psychology
    ? `- Emosi Dominan: ${psychology.emotion}
- Skor Confidence: ${psychology.confidence}/10
- Skor Disiplin: ${psychology.discipline_score}/10
- FOMO: ${psychology.fomo ? 'YA ⚠️' : 'Tidak'}
- Revenge Trading: ${psychology.revenge_trading ? 'YA ⚠️' : 'Tidak'}
- Greed (Keserakahan): ${psychology.greed ? 'YA ⚠️' : 'Tidak'}
- Fear (Ketakutan): ${psychology.fear ? 'YA ⚠️' : 'Tidak'}
- Kepatuhan Plan: ${psychology.followed_plan ? 'Patuh ✅' : 'Melanggar SOP ❌'}
- Catatan Sebelum Trade: "${psychology.before_trade_note || '-'}"
- Catatan Selama Trade: "${psychology.during_trade_note || '-'}"
- Catatan Setelah Trade: "${psychology.after_trade_note || '-'}"
- Pelajaran Dipetik: "${psychology.lessons_learned || '-'}"`
    : 'Data psikologi belum diisi untuk trade ini.'
}

Sajikan analisis terstruktur dalam format Markdown berikut:
### 1. Kualitas Eksekusi & Manajemen Risiko
(Evaluasi entry, exit, Stop Loss, Risk-to-Reward ratio, dan ukuran lot)

### 2. Evaluasi Psikologi & Kepatuhan SOP
(Bedah apakah ada bias FOMO, kesabaran, revenge trading, atau deviasi dari trading plan)

### 3. Kelebihan Utama (What Went Right)
- Poin 1
- Poin 2

### 4. Titik Lemah & Resiko Tersembunyi (Vulnerabilities)
- Poin 1
- Poin 2

### 5. Aturan Aksi untuk Trade Selanjutnya (Actionable Rule)
(1 kalimat aturan tegas yang wajib diingat operator saat setup berikutnya muncul)
`;

    const geminiRes = await callGemini(prompt, {
      systemInstruction: SYSTEM_GUARDRAILS,
      temperature: 0.3,
    });

    if (geminiRes.error || !geminiRes.text) {
      return { success: false, error: geminiRes.error || 'Gagal menghasilkan analisis dari Gemini.' };
    }

    const title = `AI Trade Analysis: ${trade.symbol} ${trade.direction.toUpperCase()} (${pnlFormatted})`;
    
    let severity: AIInsightSeverity = 'info';
    if (psychology?.revenge_trading || psychology?.fomo || !isProfit) {
      severity = 'warning';
    } else if (isProfit && (psychology?.followed_plan || (psychology?.discipline_score ?? 7) >= 8)) {
      severity = 'success';
    }

    // 5. Save insight to public.ai_insights table (ensuring user_id is set)
    const insertPayload = {
      user_id: userId,
      insight_type: 'trading',
      title,
      content: geminiRes.text,
      source_period: tradeId,
      severity,
    };

    const insightRes = await serverClient.database
      .from('ai_insights')
      .insert([insertPayload])
      .select()
      .single();

    const savedInsight: AIInsight = insightRes.data || {
      id: `local_${Date.now()}`,
      created_at: new Date().toISOString(),
      ...insertPayload,
    };

    return {
      success: true,
      data: {
        insight: savedInsight,
        analysisText: geminiRes.text,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan internal saat analisis trade';
    return { success: false, error: message };
  }
}

/**
 * 2. AI Psychology Coach: Menganalisis pola emosi, FOMO, revenge trading, dan disiplin operator.
 */
export async function analyzePsychologyWithGemini(
  serverClient: any,
  userId: string
): Promise<{ success: boolean; data?: PsychologyCoachResult; error?: string }> {
  try {
    // 1. Fetch user's recent trade psychology records
    const psychRes = await serverClient.database
      .from('trade_psychology')
      .select()
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(40);

    const psychEntries: TradePsychology[] = psychRes.data || [];

    // 2. Fetch user's recent closed trades to calculate correlations
    const tradesRes = await serverClient.database
      .from('trades')
      .select('id, symbol, direction, net_profit_loss, r_multiple, status, entry_time')
      .eq('user_id', userId)
      .order('entry_time', { ascending: false })
      .limit(50);

    const tradesList = (tradesRes.data || []) as Trade[];

    // Calculate aggregated metrics
    const totalPsychRecords = psychEntries.length;
    const fomoTrades = psychEntries.filter((p) => p.fomo);
    const revengeTrades = psychEntries.filter((p) => p.revenge_trading);
    const followedPlanTrades = psychEntries.filter((p) => p.followed_plan);

    const avgDiscipline = totalPsychRecords > 0
      ? psychEntries.reduce((acc, p) => acc + (Number(p.discipline_score) || 0), 0) / totalPsychRecords
      : 8.0;

    const avgConfidence = totalPsychRecords > 0
      ? psychEntries.reduce((acc, p) => acc + (Number(p.confidence) || 0), 0) / totalPsychRecords
      : 7.5;

    // Correlate psychology with trade P&L
    const tradeMap = new Map(tradesList.map((t) => [t.id, t]));
    let fomoPnL = 0;
    let nonFomoPnL = 0;
    let revengePnL = 0;

    psychEntries.forEach((p) => {
      if (p.trade_id && tradeMap.has(p.trade_id)) {
        const t = tradeMap.get(p.trade_id)!;
        const pnl = Number(t.net_profit_loss) || 0;
        if (p.fomo) fomoPnL += pnl;
        else nonFomoPnL += pnl;
        if (p.revenge_trading) revengePnL += pnl;
      }
    });

    const prompt = `
Sebagai Trading Psychology Coach Vyno Finance, lakukan evaluasi komprehensif terhadap kondisi psikologi operator berdasarkan data riil berikut:

[METRIK PERILAKU OPERATOR]
- Total Catatan Psikologi: ${totalPsychRecords} entri
- Rata-rata Skor Disiplin: ${avgDiscipline.toFixed(1)} / 10
- Rata-rata Skor Confidence: ${avgConfidence.toFixed(1)} / 10
- Insiden FOMO: ${fomoTrades.length} trade (Dampak Net P&L: $${fomoPnL.toFixed(2)})
- Insiden Revenge Trading: ${revengeTrades.length} trade (Dampak Net P&L: $${revengePnL.toFixed(2)})
- Kepatuhan SOP / Trading Plan: ${totalPsychRecords > 0 ? Math.round((followedPlanTrades.length / totalPsychRecords) * 100) : 100}%
- Trade Non-FOMO Net P&L: $${nonFomoPnL.toFixed(2)}

[SAMPEL CATATAN OPERATOR]
${psychEntries.slice(0, 5).map((p, idx) => `
#${idx + 1} (${p.emotion}, Conf: ${p.confidence}/10, Disc: ${p.discipline_score}/10)
- Sebelum: "${p.before_trade_note || '-'}"
- Selama: "${p.during_trade_note || '-'}"
- Setelah: "${p.after_trade_note || '-'}"
- Pelajaran: "${p.lessons_learned || '-'}"
`).join('')}

Sajikan diagnosis dalam format Markdown:
### 1. Diagnosis Pola Emosional Utama
(Identifikasi pola destruktif atau kebiasaan bawah sadar yang muncul berulang, misalnya overconfidence setelah win streak atau impulsive revenge setelah loss)

### 2. Korelasi Statistik: Disiplin vs Hasil Finansial
(Soroti kontras antara performa saat disiplin mengikuti plan vs saat tergoda FOMO/revenge)

### 3. Audit Modal Emosional (Mental Capital)
(Evaluasi beban psikologis operator dan level kelelahan mental dalam menghadapi volatilitas)

### 4. Tiga Latihan Mental & Aturan Khusus (Psychological Drills)
1. **Aturan 1**: ...
2. **Aturan 2**: ...
3. **Aturan 3**: ...
`;

    const geminiRes = await callGemini(prompt, {
      systemInstruction: SYSTEM_GUARDRAILS,
      temperature: 0.35,
    });

    if (geminiRes.error || !geminiRes.text) {
      return { success: false, error: geminiRes.error || 'Gagal menghasilkan debrief psikologi dari Gemini.' };
    }

    const title = 'AI Psychology Coach: Behavioral Patterns & Mindset Diagnostic';
    const severity: AIInsightSeverity = (revengeTrades.length > 0 || fomoTrades.length >= 2) ? 'warning' : 'success';

    // Insert to public.ai_insights
    const insertPayload = {
      user_id: userId,
      insight_type: 'psychology',
      title,
      content: geminiRes.text,
      source_period: new Date().toISOString().substring(0, 7), // YYYY-MM
      severity,
    };

    const insightRes = await serverClient.database
      .from('ai_insights')
      .insert([insertPayload])
      .select()
      .single();

    const savedInsight: AIInsight = insightRes.data || {
      id: `local_${Date.now()}`,
      created_at: new Date().toISOString(),
      ...insertPayload,
    };

    return {
      success: true,
      data: {
        insight: savedInsight,
        coachingText: geminiRes.text,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses coaching psikologi';
    return { success: false, error: message };
  }
}

/**
 * 3. AI Daily Trading Summary: Rekap komprehensif seluruh aktivitas trading harian.
 */
export async function generateDailySummaryWithGemini(
  serverClient: any,
  userId: string,
  targetDate?: string
): Promise<{ success: boolean; data?: DailySummaryResult; error?: string }> {
  try {
    // 1. Fetch user's closed trades
    const tradesRes = await serverClient.database
      .from('trades')
      .select()
      .eq('user_id', userId)
      .order('entry_time', { ascending: false })
      .limit(60);

    const allTrades: Trade[] = tradesRes.data || [];
    if (allTrades.length === 0) {
      return { success: false, error: 'Belum ada data trade yang tersimpan untuk membuat rekap harian.' };
    }

    // Determine target date
    let selectedDate = targetDate;
    if (!selectedDate) {
      // Find the date of the latest trade
      selectedDate = allTrades[0]?.entry_time
        ? allTrades[0].entry_time.split('T')[0]
        : new Date().toISOString().split('T')[0];
    }

    // Filter trades on this date
    const dayTrades = allTrades.filter((t) => {
      const entryDate = t.entry_time ? t.entry_time.split('T')[0] : '';
      const exitDate = t.exit_time ? t.exit_time.split('T')[0] : '';
      return entryDate === selectedDate || exitDate === selectedDate;
    });

    const activeList = dayTrades.length > 0 ? dayTrades : allTrades.slice(0, 5);
    const actualDate = dayTrades.length > 0 ? selectedDate : (allTrades[0]?.entry_time?.split('T')[0] || selectedDate);

    // Fetch psychology for these trades
    const tradeIds = activeList.map((t) => t.id);
    let dayPsychology: TradePsychology[] = [];
    if (tradeIds.length > 0) {
      const psychRes = await serverClient.database
        .from('trade_psychology')
        .select()
        .in('trade_id', tradeIds);
      dayPsychology = psychRes.data || [];
    }

    // Daily metrics
    const totalTrades = activeList.length;
    const wins = activeList.filter((t) => (Number(t.net_profit_loss) || 0) > 0);
    const losses = activeList.filter((t) => (Number(t.net_profit_loss) || 0) < 0);
    const winRate = totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0;
    const totalPnL = activeList.reduce((acc, t) => acc + (Number(t.net_profit_loss) || 0), 0);
    const totalR = activeList.reduce((acc, t) => acc + (Number(t.r_multiple) || 0), 0);

    const prompt = `
Buat Executive Daily Trading Summary untuk sesi ${actualDate}:

[METRIK HARIAN]
- Tanggal Sesi: ${actualDate}
- Total Trades: ${totalTrades} (Menang: ${wins.length}, Kalah: ${losses.length})
- Win Rate Harian: ${winRate.toFixed(1)}%
- Net P&L Harian: ${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)}
- Total R-Multiple: ${totalR >= 0 ? '+' : ''}${totalR.toFixed(2)}R

[RINCIAN TRADE HARI INI]
${activeList.map((t) => `
• ${t.symbol} [${t.direction.toUpperCase()}] | Net: ${Number(t.net_profit_loss) >= 0 ? '+' : ''}$${Number(t.net_profit_loss).toFixed(2)} (${Number(t.r_multiple).toFixed(2)}R) | Entry Reason: "${t.entry_reason || '-'}"
`).join('')}

[CATATAN PSIKOLOGI HARI INI]
${dayPsychology.length > 0 ? dayPsychology.map((p) => `
• Emosi: ${p.emotion} | Disiplin: ${p.discipline_score}/10 | FOMO: ${p.fomo ? 'YA' : 'Tidak'} | Revenge: ${p.revenge_trading ? 'YA' : 'Tidak'}
`).join('') : 'Tidak ada catatan emosi spesifik tercatat hari ini.'}

Sajikan rekap harian dalam format Markdown:
### 1. Executive Summary Sesi
(Ringkasan ringkas hasil finansial dan tema pasar hari ini)

### 2. Kemenangan Eksekusi (What Went Right)
- Poin keberhasilan kepatuhan aturan hari ini

### 3. Pelanggaran & Kesalahan Disiplin (What Went Wrong)
- Evaluasi jika ada FOMO, geser stop loss, atau overtrading

### 4. Skor Eksekusi Harian (Daily Scorecard)
- **Grade**: [A / B / C / D / F] (Dasarkan pada proses dan disiplin, BUKAN semata-mata nominal profit/loss)
- **Rasional**: ...

### 5. Aturan Fokus untuk Sesi Esok Hari
(Satu komitmen utama yang harus dipatuhi operator saat membuka terminal besok)
`;

    const geminiRes = await callGemini(prompt, {
      systemInstruction: SYSTEM_GUARDRAILS,
      temperature: 0.3,
    });

    if (geminiRes.error || !geminiRes.text) {
      return { success: false, error: geminiRes.error || 'Gagal menghasilkan rekap harian dari Gemini.' };
    }

    const title = `Daily Trading Summary - ${actualDate}`;
    const severity: AIInsightSeverity = totalPnL >= 0 && winRate >= 50 ? 'success' : 'warning';

    // Insert into public.ai_insights
    const insertPayload = {
      user_id: userId,
      insight_type: 'trading',
      title,
      content: geminiRes.text,
      source_period: actualDate,
      severity,
    };

    const insightRes = await serverClient.database
      .from('ai_insights')
      .insert([insertPayload])
      .select()
      .single();

    const savedInsight: AIInsight = insightRes.data || {
      id: `local_${Date.now()}`,
      created_at: new Date().toISOString(),
      ...insertPayload,
    };

    return {
      success: true,
      data: {
        insight: savedInsight,
        summaryText: geminiRes.text,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat membuat rekap harian';
    return { success: false, error: message };
  }
}
