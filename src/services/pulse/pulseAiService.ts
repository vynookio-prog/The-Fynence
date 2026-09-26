import 'server-only';
import { callGemini } from '@/services/ai/geminiService';
import { RawNewsArticle } from '@/services/news/newsApiService';
import {
  PulseArticle,
  FynencePulseData,
  TrendingTopic,
  PulseSentiment,
  OverallPulseSentiment,
  EconomicImpact,
} from '@/types/pulse';

const SYSTEM_PROMPT = `You are "Fynence Pulse AI", an elite institutional macroeconomic intelligence engine for sophisticated traders and portfolio operators.

Your mission:
Analyze raw economic and financial news articles and transform them into actionable macroeconomic intelligence.

You must objectively evaluate:
1. Topic category (e.g. "Monetary Policy", "Inflation & Prices", "Treasury & Yields", "Growth & Employment", "Commodities & Energy", "Global Trade").
2. Market sentiment: strictly "bullish", "bearish", or "neutral" from a broader market risk perspective.
3. Sentiment score: integer from -100 (extreme bearish/risk-off) to +100 (extreme bullish/risk-on).
4. Economic impact: "high", "medium", or "low" based on potential to move global FX, bonds, equities, and commodities.
5. Affected assets: specific asset tickers or markets impacted, e.g. ["USD", "Gold", "US 10Y", "S&P 500", "EUR/USD", "Crude Oil", "Nasdaq"].
6. Short summary: 1-2 crisp factual sentences stating what occurred.
7. AI insight: 1-2 analytical sentences detailing the macroeconomic implication, liquidity flow, or volatility risk for financial traders.
8. Overall Macro Synthesis:
   - macroHeadline: Punchy, editorial-grade financial headline summarizing today's regime.
   - executiveSummary: 2-3 sentence strategic takeaway for market awareness.
   - overallSentiment: "bullish", "bearish", "neutral", or "mixed".
   - sentimentScore: aggregate integer between -100 and +100.
   - trendingTopics: 3 to 5 trending macroeconomic tags with their dominant sentiment and impact level.

CRITICAL:
Output MUST be valid JSON adhering strictly to the requested schema. No markdown formatting, no code fences.`;

interface GeminiPulseJsonOutput {
  macroHeadline: string;
  executiveSummary: string;
  overallSentiment: OverallPulseSentiment;
  sentimentScore: number;
  trendingTopics: {
    topic: string;
    count: number;
    sentiment: PulseSentiment;
    impact: EconomicImpact;
  }[];
  keyAffectedAssets: string[];
  articles: {
    index: number;
    topicCategory: string;
    marketSentiment: PulseSentiment;
    sentimentScore: number;
    economicImpact: EconomicImpact;
    affectedAssets: string[];
    shortSummary: string;
    aiInsight: string;
  }[];
}

/**
 * Deterministic fallback analysis if Gemini API is unavailable or returns invalid JSON.
 */
function generateHeuristicPulse(rawArticles: RawNewsArticle[], status: 'live' | 'fallback'): FynencePulseData {
  const analyzedArticles: PulseArticle[] = rawArticles.map((raw, idx) => {
    const text = `${raw.title} ${raw.description}`.toLowerCase();

    let category = 'Monetary Policy';
    let impact: EconomicImpact = 'medium';
    let sentiment: PulseSentiment = 'neutral';
    let score = 0;
    let assets = ['USD', 'US 10Y', 'S&P 500'];
    let insight = 'Market participants are recalibrating interest rate and liquidity expectations.';

    if (text.includes('inflation') || text.includes('cpi') || text.includes('pce') || text.includes('prices')) {
      category = 'Inflation & Prices';
      impact = 'high';
      assets = ['USD', 'Gold', 'US 10Y', 'S&P 500'];
      if (text.includes('eases') || text.includes('cool') || text.includes('falls') || text.includes('progress')) {
        sentiment = 'bullish';
        score = 65;
        insight = 'Cooling price pressures support expectations for a dovish monetary policy rotation and asset valuation expansion.';
      } else {
        sentiment = 'bearish';
        score = -60;
        insight = 'Persistent inflation prints threaten the terminal rate trajectory and induce volatility in fixed income assets.';
      }
    } else if (text.includes('yield') || text.includes('treasury') || text.includes('bond') || text.includes('debt')) {
      category = 'Treasury & Yields';
      impact = 'high';
      assets = ['US 10Y', 'USD', 'Nasdaq', 'Gold'];
      if (text.includes('eases') || text.includes('retreats') || text.includes('falls')) {
        sentiment = 'bullish';
        score = 45;
        insight = 'Softer sovereign yields alleviate discount rate pressure on growth equities and support safe-haven gold demand.';
      } else {
        sentiment = 'bearish';
        score = -50;
        insight = 'Rising benchmark yields tighten broader financial conditions and pressure risk-sensitive capital flows.';
      }
    } else if (text.includes('gold') || text.includes('bullion') || text.includes('xau')) {
      category = 'Commodities & Metals';
      impact = 'medium';
      sentiment = 'bullish';
      score = 55;
      assets = ['Gold', 'USD', 'Silver'];
      insight = 'Persistent bullion accumulation signals structural macro hedging and defensive institutional capital allocation.';
    } else if (text.includes('oil') || text.includes('crude') || text.includes('energy') || text.includes('opec')) {
      category = 'Commodities & Energy';
      impact = 'medium';
      sentiment = text.includes('rebound') || text.includes('recovers') ? 'neutral' : 'bearish';
      score = 10;
      assets = ['Crude Oil', 'Energy Equities', 'CAD', 'USD'];
      insight = 'Energy equilibrium hinges on geopolitical tension premiums vs global demand revisions.';
    } else if (text.includes('ecb') || text.includes('fed') || text.includes('central bank') || text.includes('rate')) {
      category = 'Monetary Policy';
      impact = 'high';
      sentiment = 'neutral';
      score = 20;
      assets = ['USD', 'EUR/USD', 'US 10Y', 'Global Indices'];
      insight = 'Central banks maintain a data-dependent guidance stance, keeping traders alert to subsequent macro prints.';
    } else {
      category = 'Global Trade & Growth';
      impact = 'medium';
      sentiment = 'neutral';
      score = 10;
      assets = ['Global Equities', 'Emerging Currencies'];
      insight = 'Cross-border manufacturing and consumer demand figures reflect balanced macroeconomic adjustment.';
    }

    return {
      id: `pulse-item-${idx}-${Date.now()}`,
      title: raw.title,
      description: raw.description,
      url: raw.url,
      urlToImage: raw.urlToImage,
      sourceName: raw.sourceName,
      publishedAt: raw.publishedAt,
      topicCategory: category,
      marketSentiment: sentiment,
      sentimentScore: score,
      economicImpact: impact,
      affectedAssets: assets,
      shortSummary: raw.description.slice(0, 180) + (raw.description.length > 180 ? '…' : ''),
      aiInsight: insight,
    };
  });

  const bullishCount = analyzedArticles.filter((a) => a.marketSentiment === 'bullish').length;
  const bearishCount = analyzedArticles.filter((a) => a.marketSentiment === 'bearish').length;
  const neutralCount = analyzedArticles.length - bullishCount - bearishCount;

  const totalScore = analyzedArticles.reduce((acc, cur) => acc + cur.sentimentScore, 0);
  const avgScore = Math.round(totalScore / (analyzedArticles.length || 1));

  let overallSentiment: OverallPulseSentiment = 'neutral';
  if (avgScore > 20) overallSentiment = 'bullish';
  else if (avgScore < -20) overallSentiment = 'bearish';
  else if (bullishCount > 0 && bearishCount > 0) overallSentiment = 'mixed';

  const trendingTopics: TrendingTopic[] = [
    { topic: 'Fed Policy Guidance', count: 4, sentiment: 'neutral', impact: 'high' },
    { topic: 'Treasury Yield Curve', count: 3, sentiment: 'bullish', impact: 'high' },
    { topic: 'Central Bank Gold Reserves', count: 2, sentiment: 'bullish', impact: 'medium' },
    { topic: 'Global Disinflation', count: 3, sentiment: 'neutral', impact: 'high' },
  ];

  return {
    macroHeadline: 'Macro Equilibrium: Central Banks Balance Disinflation Progress Against Growth Resilience',
    executiveSummary:
      'Global macroeconomic flow indicates balanced crosswinds: moderating headline price indices support interest rate plateau narratives, while steady labor prints preserve terminal rate caution.',
    overallSentiment,
    sentimentScore: avgScore,
    sentimentDistribution: {
      bullish: bullishCount,
      bearish: bearishCount,
      neutral: neutralCount,
    },
    trendingTopics,
    keyAffectedAssets: ['USD', 'US 10Y', 'Gold', 'S&P 500', 'EUR/USD'],
    articles: analyzedArticles,
    lastUpdated: new Date().toISOString(),
    status,
    newsSourceCount: analyzedArticles.length,
  };
}

/**
 * Synthesize raw articles using Google Gemini AI into Fynence Pulse intelligence.
 */
export async function analyzeNewsWithGemini(
  rawArticles: RawNewsArticle[],
  newsSourceType: 'live' | 'fallback'
): Promise<FynencePulseData> {
  if (!rawArticles || rawArticles.length === 0) {
    return generateHeuristicPulse([], newsSourceType);
  }

  const articlesToAnalyze = rawArticles.slice(0, 6);
  const articlesPromptPayload = articlesToAnalyze.map((art, i) => ({
    index: i,
    title: art.title,
    snippet: art.description.slice(0, 140),
    source: art.sourceName,
  }));

  const userPrompt = `Analyze these ${articlesToAnalyze.length} macroeconomic news headlines.

Return a JSON object strictly matching this schema:
{
  "macroHeadline": string (punchy macroeconomic overview),
  "executiveSummary": string (2-sentence strategic summary for traders),
  "overallSentiment": "bullish" | "bearish" | "neutral" | "mixed",
  "sentimentScore": integer (-100 to 100),
  "trendingTopics": [
    {
      "topic": string (e.g. "Fed Rate Path", "Bond Yield Volatility"),
      "count": integer,
      "sentiment": "bullish" | "bearish" | "neutral",
      "impact": "high" | "medium" | "low"
    }
  ],
  "keyAffectedAssets": string[] (e.g. ["USD", "Gold", "US 10Y"]),
  "articles": [
    {
      "index": integer (0 to ${articlesToAnalyze.length - 1}),
      "topicCategory": string (e.g. "Monetary Policy", "Inflation & Prices", "Treasury & Yields"),
      "marketSentiment": "bullish" | "bearish" | "neutral",
      "sentimentScore": integer (-100 to 100),
      "economicImpact": "high" | "medium" | "low",
      "affectedAssets": string[],
      "shortSummary": string (1 concise factual sentence),
      "aiInsight": string (1 analytical sentence on market impact)
    }
  ]
}

ARTICLES:
${JSON.stringify(articlesPromptPayload, null, 2)}`;

  try {
    const res = await callGemini(userPrompt, {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.2,
      maxOutputTokens: 1500,
      responseMimeType: 'application/json',
    });

    if (res.error || !res.text) {
      console.warn('[PulseAiService] Gemini call returned empty or error, using heuristic analysis:', res.error);
      return generateHeuristicPulse(rawArticles, newsSourceType);
    }

    let parsed: GeminiPulseJsonOutput;
    try {
      const cleanedText = res.text.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleanedText);
    } catch (parseErr) {
      console.warn('[PulseAiService] Failed to parse Gemini JSON output, using heuristic analysis:', parseErr);
      return generateHeuristicPulse(rawArticles, newsSourceType);
    }

    // Merge Gemini analysis with original raw article details (URLs, images, sources)
    const analyzedArticles: PulseArticle[] = rawArticles.map((raw, idx) => {
      const match = parsed.articles?.find((a) => a.index === idx) || parsed.articles?.[idx];

      const sentiment: PulseSentiment =
        match?.marketSentiment === 'bullish' || match?.marketSentiment === 'bearish' || match?.marketSentiment === 'neutral'
          ? match.marketSentiment
          : 'neutral';

      const impact: EconomicImpact =
        match?.economicImpact === 'high' || match?.economicImpact === 'medium' || match?.economicImpact === 'low'
          ? match.economicImpact
          : 'medium';

      return {
        id: `pulse-item-${idx}-${Date.now()}`,
        title: raw.title,
        description: raw.description,
        url: raw.url,
        urlToImage: raw.urlToImage,
        sourceName: raw.sourceName,
        publishedAt: raw.publishedAt,
        topicCategory: match?.topicCategory || 'Monetary Policy',
        marketSentiment: sentiment,
        sentimentScore: typeof match?.sentimentScore === 'number' ? match.sentimentScore : 0,
        economicImpact: impact,
        affectedAssets: Array.isArray(match?.affectedAssets) && match.affectedAssets.length > 0
          ? match.affectedAssets
          : ['USD', 'US 10Y', 'S&P 500'],
        shortSummary: match?.shortSummary || raw.description,
        aiInsight: match?.aiInsight || 'Market participants are recalibrating interest rate and volatility exposures.',
      };
    });

    const bullishCount = analyzedArticles.filter((a) => a.marketSentiment === 'bullish').length;
    const bearishCount = analyzedArticles.filter((a) => a.marketSentiment === 'bearish').length;
    const neutralCount = analyzedArticles.length - bullishCount - bearishCount;

    return {
      macroHeadline: parsed.macroHeadline || 'Global Economic Intelligence & Macro Crosswinds',
      executiveSummary:
        parsed.executiveSummary ||
        'Cross-asset sentiment reflects ongoing calibration between inflation trajectory, sovereign bond yields, and central bank policy.',
      overallSentiment: parsed.overallSentiment || 'neutral',
      sentimentScore: typeof parsed.sentimentScore === 'number' ? parsed.sentimentScore : 0,
      sentimentDistribution: {
        bullish: bullishCount,
        bearish: bearishCount,
        neutral: neutralCount,
      },
      trendingTopics: parsed.trendingTopics || [
        { topic: 'Monetary Policy', count: 3, sentiment: 'neutral', impact: 'high' },
        { topic: 'Inflation Trajectory', count: 2, sentiment: 'neutral', impact: 'high' },
      ],
      keyAffectedAssets: parsed.keyAffectedAssets || ['USD', 'US 10Y', 'Gold', 'S&P 500'],
      articles: analyzedArticles,
      lastUpdated: new Date().toISOString(),
      status: newsSourceType === 'live' ? 'live' : 'fallback',
      newsSourceCount: analyzedArticles.length,
    };
  } catch (err) {
    console.error('[PulseAiService] Error during analysis:', err);
    return generateHeuristicPulse(rawArticles, newsSourceType);
  }
}
