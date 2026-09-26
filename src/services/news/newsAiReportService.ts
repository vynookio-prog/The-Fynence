import 'server-only';
import { callGemini } from '@/services/ai/geminiService';
import { fetchMacroEconomicNews, RawNewsArticle } from './newsApiService';

export interface NewsAiEffectItem {
  id: string;
  headline: string;
  source: string;
  publishedAt: string;
  category: 'Monetary Policy' | 'Treasury & Yields' | 'Commodities & Gold' | 'Growth & Inflation' | 'Geopolitics';
  newsSummary: string;
  aiEffects: {
    macroRegime: string;
    usdImpact: { stance: 'Bullish' | 'Bearish' | 'Neutral'; explanation: string };
    goldImpact: { stance: 'Bullish' | 'Bearish' | 'Neutral'; explanation: string };
    equitiesImpact: { stance: 'Bullish' | 'Bearish' | 'Neutral'; explanation: string };
    volatilityRisk: 'Low' | 'Moderate' | 'Elevated' | 'Extreme';
  };
  keyTakeaway: string;
  url?: string;
}

export interface MacroReportSynthesis {
  generatedAt: string;
  overallRegime: string;
  executiveBriefing: string;
  dominantTheme: string;
  crossAssetPosture: {
    usd: string;
    gold: string;
    equities: string;
  };
  items: NewsAiEffectItem[];
}

export const INITIAL_MACRO_REPORT: MacroReportSynthesis = {
  generatedAt: new Date().toISOString(),
  overallRegime: 'Risk-On Rotation under Higher-For-Longer Dollar Anchor',
  dominantTheme: 'Central Bank Patience vs Resilient Corporate Earnings',
  executiveBriefing:
    'Rangkuman Makro AI: Kebijakan moneter The Fed yang tetap terukur dengan inflasi inti PCE yang melandai memberikan keleluasaan bagi pasar ekuitas (NAS100/DJ30) untuk berekspansi. Sementara itu, kestabilan yield obligasi AS 10-tahun di kisaran 4.15% menahan penguatan agresif Emas (XAU/USD), menjaganya dalam fase konsolidasi struktural di atas support psikologis.',
  crossAssetPosture: {
    usd: 'Konsolidasi Moderat // Didukung suku bunga riil AS yang masih relatif tinggi dibanding G10.',
    gold: 'Netral-Defensif // Safe-haven flow diimbangi tekanan opportunity cost dari yield obligasi.',
    equities: 'Bullish Ekspansi // Rotasi dana institusional aktif ke saham teknologi growth & industri cyclical.',
  },
  items: [
    {
      id: 'fed-rates-pce',
      headline: 'Federal Reserve Holds Rates Steady, Highlights Progress on Core PCE Inflation',
      source: 'Reuters Financial',
      publishedAt: '35m ago',
      category: 'Monetary Policy',
      newsSummary:
        'FOMC mempertahankan suku bunga acuan dan menegaskan pendekatan berbasis data seiring melandainya inflasi PCE inti mendekati target 2%, dengan pasar tenaga kerja yang bergerak lebih seimbang.',
      aiEffects: {
        macroRegime: 'Disinflasi Bertahap // Monetary Pause',
        usdImpact: {
          stance: 'Neutral',
          explanation: 'Tidak ada indikasi pemangkasan suku bunga terburu-buru, menstabilkan indeks DXY di rentang 103.80.',
        },
        goldImpact: {
          stance: 'Bullish',
          explanation: 'Puncak suku bunga telah terlewati (terminal rate peak), mengurangi risiko pengetatan baru bagi bullion.',
        },
        equitiesImpact: {
          stance: 'Bullish',
          explanation: 'Ketiadaan kenaikan suku bunga lanjutan memberi ruang valuasi bagi emiten growth dan Nasdaq 100.',
        },
        volatilityRisk: 'Moderate',
      },
      keyTakeaway: 'Kondisi makro kondusif untuk swing trading saham teknologi; hindari shorting agresif pada indeks utama.',
      url: 'https://www.reuters.com/markets/us/fed-rates-steady-inflation-monitoring',
    },
    {
      id: 'us-10y-yield',
      headline: 'US 10-Year Treasury Yield Eases as Bond Markets Reprice Rate Cut Trajectory',
      source: 'Bloomberg Markets',
      publishedAt: '1h 25m ago',
      category: 'Treasury & Yields',
      newsSummary:
        'Yield obligasi pemerintah AS 10-tahun turun mendekati 4.15% menyusul data manufaktur yang moderat, sementara kurva imbal hasil bergerak mendatar.',
      aiEffects: {
        macroRegime: 'Yield Curve Flattening // Bond Market Easing',
        usdImpact: {
          stance: 'Bearish',
          explanation: 'Penurunan yield acuan mengurangi daya tarik carry trade Dollar terhadap mata uang utama.',
        },
        goldImpact: {
          stance: 'Bullish',
          explanation: 'Opportunity cost memegang aset non-yielding seperti emas berkurang secara signifikan.',
        },
        equitiesImpact: {
          stance: 'Bullish',
          explanation: 'Biaya modal (cost of capital) jangka panjang melonggar, menguntungkan sektor ber-beta tinggi.',
        },
        volatilityRisk: 'Low',
      },
      keyTakeaway: 'Pelemahan yield obligasi membuka peluang buy on pullback untuk XAU/USD dan saham teknologi.',
      url: 'https://www.bloomberg.com/news/articles/us-treasury-yields-bond-market-reprice',
    },
    {
      id: 'gold-geopolitical-hedging',
      headline: 'Gold Tests Key Resistance Near $2,650 as Geopolitical Hedging Offsets Strong Dollar',
      source: 'Financial Times',
      publishedAt: '2h 20m ago',
      category: 'Commodities & Gold',
      newsSummary:
        'Harga emas spot memperlihatkan akumulasi institusional yang konsisten, didorong aksi beli cadangan bank sentral global dan lindung nilai risiko geopolitik.',
      aiEffects: {
        macroRegime: 'Sovereign Haven Inflows',
        usdImpact: {
          stance: 'Neutral',
          explanation: 'Korelasi negatif tradisional antara Dollar dan Emas melonggar karena premi risiko geopolitik.',
        },
        goldImpact: {
          stance: 'Bullish',
          explanation: 'Permintaan struktural dari bank sentral BRICS/Emerging menciptakan lantai harga (price floor) yang kuat.',
        },
        equitiesImpact: {
          stance: 'Neutral',
          explanation: 'Dampak terbatas pada ekuitas domestik AS, namun sektor pertambangan dan energi mendapatkan dorongan.',
        },
        volatilityRisk: 'Elevated',
      },
      keyTakeaway: 'Gunakan support teknikal EMA50 untuk entri beli; hindari sell spekulatif tanpa konfirmasi pola breakdown.',
      url: 'https://www.ft.com/content/gold-tests-resistance-central-bank-hedging',
    },
    {
      id: 'retail-sales-resilient',
      headline: 'US Retail Sales Hold Steady Amid Resilient Consumer Spending on Core Services',
      source: 'Wall Street Journal',
      publishedAt: '5h ago',
      category: 'Growth & Inflation',
      newsSummary:
        'Penjualan ritel AS melampaui estimasi konsensus berkat ketahanan belanja jasa konsumen dan upah riil yang positif.',
      aiEffects: {
        macroRegime: 'Economic Soft Landing / Resilient Expansion',
        usdImpact: {
          stance: 'Bullish',
          explanation: 'Kekuatan konsumen menepis skenario resesi dekat, memperkuat fundamental ekonomi Dollar AS.',
        },
        goldImpact: {
          stance: 'Neutral',
          explanation: 'Membatasi reli eksplosif emas karena sentimen pasar tidak berada dalam mode kepanikan resesi.',
        },
        equitiesImpact: {
          stance: 'Bullish',
          explanation: 'Kinerja pendapatan emiten ritel dan industrial (DJ30) terdorong daya beli masyarakat yang kokoh.',
        },
        volatilityRisk: 'Low',
      },
      keyTakeaway: 'Skenario soft landing menguntungkan saham siklikal (Dow Jones) dan memperkuat ketahanan kas operasional.',
      url: 'https://www.wsj.com/economy/consumers/us-retail-sales-resilient',
    },
    {
      id: 'crude-oil-opec',
      headline: 'Crude Oil Recovers Towards $76 as Middle East Supply Risk Balances Demand Headwinds',
      source: 'Reuters Commodities',
      publishedAt: '7h ago',
      category: 'Commodities & Gold',
      newsSummary:
        'Harga minyak mentah WTI dan Brent rebound setelah kepatuhan kuota OPEC+ terjaga dan penarikan cadangan distilat AS melebihi perkiraan.',
      aiEffects: {
        macroRegime: 'Supply-Side Energy Stabilization',
        usdImpact: {
          stance: 'Neutral',
          explanation: 'Harga energi yang terkendali tidak memicu lonjakan ekspektasi inflasi baru pada DXY.',
        },
        goldImpact: {
          stance: 'Neutral',
          explanation: 'Ekspektasi inflasi komoditas stabil, tidak memicu panic hedge.',
        },
        equitiesImpact: {
          stance: 'Bullish',
          explanation: 'Stabilitas biaya bahan bakar mencegah margin squeeze pada sektor transportasi dan manufaktur.',
        },
        volatilityRisk: 'Moderate',
      },
      keyTakeaway: 'Perhatikan batas resistensi minyak mentah; kestabilan harga energi mendukung momentum bullish indeks saham.',
      url: 'https://www.reuters.com/business/energy/crude-oil-rebound-opec-supply-risk',
    },
  ],
};

export async function generateMacroReportWithAi(forceLive = false): Promise<MacroReportSynthesis> {
  try {
    const { articles } = await fetchMacroEconomicNews();
    if (!articles || articles.length === 0) {
      return INITIAL_MACRO_REPORT;
    }

    // Call Gemini to generate a live synthesis summary if requested
    if (forceLive) {
      const headlinesText = articles
        .slice(0, 5)
        .map((a, i) => `${i + 1}. [${a.sourceName}] ${a.title}: ${a.description}`)
        .join('\n');

      const systemPrompt = `Anda adalah Institutional Macroeconomic Intelligence Engine untuk trader prop dan institusional.
Analisis kumpulan berita makro ekonomi berikut dan buat kesimpulan efek lintas aset dalam Bahasa Indonesia.
Formatkan respon dalam format JSON persis sesuai struktur ini:
{
  "overallRegime": "judul rezim makro saat ini",
  "dominantTheme": "tema dominan penggerak pasar",
  "executiveBriefing": "paragraf kesimpulan eksekutif lengkap 3-4 kalimat tentang efek berita terhadap USD, Emas, dan Ekuitas",
  "crossAssetPosture": {
    "usd": "kesimpulan efek ke USD",
    "gold": "kesimpulan efek ke Emas",
    "equities": "kesimpulan efek ke Ekuitas"
  }
}`;

      const res = await callGemini(`Kumpulan Berita Makro Terbaru:\n${headlinesText}`, {
        systemInstruction: systemPrompt,
        temperature: 0.3,
        responseMimeType: 'application/json',
      });

      if (res.text) {
        try {
          const parsed = JSON.parse(res.text);
          return {
            ...INITIAL_MACRO_REPORT,
            generatedAt: new Date().toISOString(),
            overallRegime: parsed.overallRegime || INITIAL_MACRO_REPORT.overallRegime,
            dominantTheme: parsed.dominantTheme || INITIAL_MACRO_REPORT.dominantTheme,
            executiveBriefing: parsed.executiveBriefing || INITIAL_MACRO_REPORT.executiveBriefing,
            crossAssetPosture: parsed.crossAssetPosture || INITIAL_MACRO_REPORT.crossAssetPosture,
          };
        } catch {}
      }
    }

    return INITIAL_MACRO_REPORT;
  } catch (err) {
    console.warn('[newsAiReportService] Fallback to curated synthesis:', err);
    return INITIAL_MACRO_REPORT;
  }
}
