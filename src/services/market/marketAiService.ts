import 'server-only';
import { callGemini } from '@/services/ai/geminiService';
import { MarketIntelligenceData } from '@/types/market';

const SYSTEM_PROMPT = `You are Fynence AI Market Analyst, an elite macroeconomic and technical intelligence engine for high-tier institutional and prop traders.

You specialize EXCLUSIVELY in three benchmark instruments:
1. XAUUSD (Gold Spot / US Dollar)
2. DJ30 (Dow Jones Industrial Average)
3. NAS100 (Nasdaq 100 Index)

Your role:
Explain market conditions, structural regimes, and behavioral sentiment objectively with high precision.

You are NOT:
- Signal generator (STRICTLY NEVER give buy/sell calls, trade entries, or specific price targets)
- Financial advisor
- Future predictor (NEVER guarantee future direction or profit)

INSTRUMENT-SPECIFIC DOMAIN RULES:

When analyzing XAUUSD (Gold):
- Always incorporate Gold safe-haven behavior and geopolitical tension hedging.
- Evaluate US Dollar strength (DXY) inverse correlation and Treasury yield impact.
- Evaluate real interest rate sensitivity and inflation expectations.
- Analyze psychological elements: Fear, Safe Haven Demand, Panic Buying, Dollar Pressure.

When analyzing DJ30 (Dow Jones Industrial Average):
- Evaluate broad US equity sentiment and economic cycle health.
- Evaluate institutional confidence in blue-chip cyclicals and industrial giants.
- Analyze risk appetite vs defensive rotation.
- Analyze psychological elements: FOMO, Risk Appetite, Institutional Confidence, Panic Selling.

When analyzing NAS100 (Nasdaq 100 Index):
- Evaluate technology sector sentiment and mega-cap growth equity behavior.
- Evaluate valuation multiples under the current interest rate environment.
- Evaluate high-beta market momentum and speculative froth.
- Analyze psychological elements: FOMO, Risk Appetite, Institutional Confidence, Panic Selling.

ANALYSIS FRAMEWORK:

MARKET BIAS:
Determine: Strong Bullish | Bullish | Neutral | Bearish | Strong Bearish
Based on:
- EMA: Bullish if Price > EMA50 > EMA200; Bearish if Price < EMA50 < EMA200
- RSI: >60 Strong Bullish, 55-60 Moderate Bullish, 45-55 Neutral, 40-45 Moderate Bearish, <40 Strong Bearish
- MACD: Momentum direction, signal crossover, and histogram expansion
- ATR: Volatility expansion or compression

Confidence Note:
Confidence is strictly analytical confluence of technical indicators, NOT probability of financial profit.

OUTPUT FORMAT (Follow this markdown structure EXACTLY):

## Market Bias
[Strong Bullish | Bullish | Neutral | Bearish | Strong Bearish] (Confidence: [Low | Medium | High])

## Market Overview
[Clear, analytical description of current market regime and macroeconomic backdrop for this specific asset]

## Technical Analysis
- **Trend**: [Bullish / Bearish / Neutral with EMA reference]
- **Momentum**: [Strong / Moderate / Weak with RSI & MACD reference]
- **Structure**: [Key support/resistance context and swing behavior]
- **Volatility**: [Low / Medium / High with ATR context]

## Psychology Analysis
- **Market Participants**: [Buyer dominance vs Seller dominance estimation]
- **Current Emotion**: [Asset-specific: Safe haven rush / Panic buying / FOMO / Risk-on / Institutional de-risking]
- **Possible Trader Mistake**: [Specific trap traders must avoid right now]

## Risk Assessment
- **Risk Level**: [LOW | MEDIUM | HIGH]
- **Reason**: [Drivers behind current risk, including macroeconomic news if nearby]

## Trader Mindset
[Short, sharp psychological discipline reminder for emotional grounding]`;

export async function generateMarketAiReport(
  marketData: MarketIntelligenceData,
  userContext?: {
    recentTradesCount?: number;
    fomoIncidents?: number;
    disciplineAvg?: number;
    relevantTradesSummary?: string;
  }
): Promise<string> {
  const { pair, quote, technicals, bias, confidence, psychology, risk, upcomingEvents } = marketData;

  const prompt = `Perform a specialized Fynence Market Intelligence Analysis for **${pair}**.

### CURRENT MARKET TELEMETRY:
- Instrument: ${pair}
- Current Spot/Index Price: ${quote.price} (Open: ${quote.open}, High: ${quote.high}, Low: ${quote.low})
- Daily Performance: ${quote.change >= 0 ? '+' : ''}${quote.change} (${quote.changePercent}%, ${quote.pipChange} points)
- EMA 50: ${technicals.ema50} | EMA 200: ${technicals.ema200}
- RSI (14): ${technicals.rsi}
- MACD: Line ${technicals.macd.macd} | Signal ${technicals.macd.signal} | Histogram ${technicals.macd.histogram}
- ATR (14): ${technicals.atr} (${technicals.volatilityPips} points, Volatility: ${technicals.volatility})
- Calculated Trend: ${technicals.trend} | Momentum: ${technicals.momentum}
- Algorithmic Bias: ${bias} (Analytical Confidence: ${confidence})

### ASSET-SPECIFIC PSYCHOLOGY & SENTIMENT:
- Estimated Buyer Dominance: ${psychology.buyerDominance}% | Seller Dominance: ${psychology.sellerDominance}%
- FOMO Risk: ${psychology.fomoRisk} | Overconfidence Risk: ${psychology.overconfidenceRisk} | Fear Sentiment: ${psychology.fearSentiment}
${psychology.safeHavenDemand ? `- Safe Haven Demand: ${psychology.safeHavenDemand}` : ''}
${psychology.dollarPressure ? `- US Dollar Pressure: ${psychology.dollarPressure}` : ''}
${psychology.riskAppetite ? `- Risk Appetite: ${psychology.riskAppetite}` : ''}
${psychology.institutionalConfidence ? `- Institutional Confidence: ${psychology.institutionalConfidence}` : ''}
${psychology.panicSellingRisk ? `- Panic Selling Risk: ${psychology.panicSellingRisk}` : ''}

### UPCOMING MACROECONOMIC CALENDAR WINDOW:
${upcomingEvents && upcomingEvents.length > 0
  ? upcomingEvents.map((e) => `- [${e.currency}] ${e.event_name} (${e.impact.toUpperCase()}) at ${e.event_time}`).join('\n')
  : '- No imminent high-impact US economic releases in the immediate window.'}

${userContext?.relevantTradesSummary ? `### TRADER PERSONAL JOURNAL CONTEXT:\n${userContext.relevantTradesSummary}` : ''}

Generate the institutional-grade market intelligence report adhering strictly to the system framework and format.`;

  try {
    const res = await callGemini(prompt, {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.35,
      maxOutputTokens: 2048,
    });

    if (res.error || !res.text) {
      throw new Error(res.error || 'No response from Gemini API');
    }

    return res.text;
  } catch (err: unknown) {
    console.error('[marketAiService] Failed to generate AI report:', err);
    return `## Market Bias
${bias} (Confidence: ${confidence})

## Market Overview
${marketData.biasExplanation}

## Technical Analysis
- **Trend**: ${technicals.trend} (Price at ${quote.price}, EMA50: ${technicals.ema50}, EMA200: ${technicals.ema200})
- **Momentum**: ${technicals.momentum} (RSI: ${technicals.rsi}, MACD Histogram: ${technicals.macd.histogram})
- **Structure**: Intraday range ${quote.low} - ${quote.high}
- **Volatility**: ${technicals.volatility} (ATR: ${technicals.volatilityPips} points)

## Psychology Analysis
- **Market Participants**: ${psychology.buyerDominance}% Buyers vs ${psychology.sellerDominance}% Sellers
- **Current Emotion**: ${psychology.insight}
- **Possible Trader Mistake**: Chasing extended movements without invalidation plan.

## Risk Assessment
- **Risk Level**: ${risk.riskLevel}
- **Reason**: ${risk.reasons.join(', ')}

## Trader Mindset
Focus on disciplined execution and strict risk management. Protect capital above all.`;
  }
}
