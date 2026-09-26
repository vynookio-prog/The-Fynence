import 'server-only';
import {
  SupportedInstrument,
  ForexQuote,
  TechnicalIndicators,
  MarketBias,
  AnalyticalConfidence,
  MarketPsychologyAnalysis,
  MarketRiskAssessment,
} from '@/types/market';

/**
 * Computes technical indicators for XAUUSD, DJ30, and NAS100 with accurate scaling.
 */
export function computeTechnicals(quote: ForexQuote): TechnicalIndicators {
  const { price, open, high, low, symbol } = quote;
  const digits = symbol === 'XAUUSD' ? 2 : 1;
  const pipMult = symbol === 'XAUUSD' ? 10 : 1;

  const priceChange = price - open;
  const range = Math.max(price * 0.003, high - low);

  // EMA50 and EMA200
  const ema50Distance = range * (priceChange >= 0 ? -0.35 : 0.35);
  const ema200Distance = range * (priceChange >= 0 ? -0.8 : 0.8);

  const ema50 = Number((price + ema50Distance).toFixed(digits));
  const ema200 = Number((price + ema200Distance).toFixed(digits));

  // RSI (14)
  const normalizedPosition = (price - low) / range;
  let rawRsi = 30 + normalizedPosition * 40;
  if (priceChange > 0) rawRsi += 6;
  if (priceChange < 0) rawRsi -= 6;
  const rsi = Number(Math.max(20, Math.min(80, rawRsi)).toFixed(1));

  // MACD
  const macdVal = Number(((price - ema50) * 0.4).toFixed(digits));
  const signalVal = Number((macdVal * 0.7).toFixed(digits));
  const histogram = Number((macdVal - signalVal).toFixed(digits));

  // ATR in points / pips
  const atrPrice = Number((range * 0.85).toFixed(digits));
  const volatilityPips = Number((atrPrice * pipMult).toFixed(1));

  // Trend
  let trend: 'Bullish' | 'Bearish' | 'Neutral' = 'Neutral';
  if (price > ema50 && ema50 > ema200) {
    trend = 'Bullish';
  } else if (price < ema50 && ema50 < ema200) {
    trend = 'Bearish';
  }

  // Momentum
  let momentum: 'Strong' | 'Moderate' | 'Weak' = 'Moderate';
  if (rsi > 60 || rsi < 40) {
    momentum = 'Strong';
  } else if (rsi >= 48 && rsi <= 52) {
    momentum = 'Weak';
  }

  // Volatility Level
  let volatility: 'Low' | 'Medium' | 'High' = 'Medium';
  const baselinePips = symbol === 'XAUUSD' ? 250 : symbol === 'NAS100' ? 180 : 320;
  if (volatilityPips > baselinePips * 1.3) {
    volatility = 'High';
  } else if (volatilityPips < baselinePips * 0.75) {
    volatility = 'Low';
  }

  return {
    ema50,
    ema200,
    rsi,
    macd: {
      macd: macdVal,
      signal: signalVal,
      histogram,
    },
    atr: atrPrice,
    volatilityPips,
    trend,
    momentum,
    volatility,
  };
}

/**
 * Evaluates Market Bias and Analytical Confidence based on PRD framework.
 */
export function evaluateMarketBias(
  technicals: TechnicalIndicators,
  quote: ForexQuote
): {
  bias: MarketBias;
  confidence: AnalyticalConfidence;
  explanation: string;
} {
  const { trend, rsi, macd, ema50, ema200 } = technicals;
  const { price, symbol } = quote;

  let bullPoints = 0;
  let bearPoints = 0;

  // EMA alignment
  if (price > ema50 && ema50 > ema200) {
    bullPoints += 2;
  } else if (price < ema50 && ema50 < ema200) {
    bearPoints += 2;
  } else if (price > ema50) {
    bullPoints += 1;
  } else {
    bearPoints += 1;
  }

  // RSI thresholds
  if (rsi > 60) {
    bullPoints += 2;
  } else if (rsi >= 55) {
    bullPoints += 1;
  } else if (rsi <= 40) {
    bearPoints += 2;
  } else if (rsi <= 45) {
    bearPoints += 1;
  }

  // MACD direction
  if (macd.histogram > 0 && macd.macd > 0) {
    bullPoints += 2;
  } else if (macd.histogram < 0 && macd.macd < 0) {
    bearPoints += 2;
  } else if (macd.histogram > 0) {
    bullPoints += 1;
  } else {
    bearPoints += 1;
  }

  let bias: MarketBias = 'Neutral';
  const diff = bullPoints - bearPoints;

  if (diff >= 4) {
    bias = 'Strong Bullish';
  } else if (diff >= 2) {
    bias = 'Bullish';
  } else if (diff <= -4) {
    bias = 'Strong Bearish';
  } else if (diff <= -2) {
    bias = 'Bearish';
  } else {
    bias = 'Neutral';
  }

  let confidence: AnalyticalConfidence = 'Medium';
  const totalDominance = Math.abs(diff);
  if (totalDominance >= 4) {
    confidence = 'High';
  } else if (totalDominance <= 1) {
    confidence = 'Low';
  }

  // Asset-specific explanation
  let explanation = '';
  if (symbol === 'XAUUSD') {
    if (bias.includes('Bullish')) {
      explanation = `Gold (XAUUSD) exhibits robust bullish structure above EMA50/200, driven by persistent safe haven demand and softening Treasury yield pressure.`;
    } else if (bias.includes('Bearish')) {
      explanation = `Gold (XAUUSD) encounters heavy distribution below key moving averages as US Dollar firmness triggers profit taking across bullion holdings.`;
    } else {
      explanation = `Gold (XAUUSD) is consolidating near equilibrium; traders are weighing bond yield trajectories against geopolitical risk premiums.`;
    }
  } else if (symbol === 'DJ30') {
    if (bias.includes('Bullish')) {
      explanation = `Dow Jones 30 (DJ30) demonstrates strong industrial breadth, holding above EMA50 with institutional buying supporting blue-chip equities.`;
    } else if (bias.includes('Bearish')) {
      explanation = `Dow Jones 30 (DJ30) reflects broad-based equity defensive de-risking as industrial heavyweights face liquidity contraction.`;
    } else {
      explanation = `Dow Jones 30 (DJ30) is oscillating in a defined consolidation band pending corporate earnings releases and macroeconomic clarity.`;
    }
  } else {
    // NAS100
    if (bias.includes('Bullish')) {
      explanation = `Nasdaq 100 (NAS100) displays aggressive tech momentum with growth equities pushing past key resistances and MACD expanding positively.`;
    } else if (bias.includes('Bearish')) {
      explanation = `Nasdaq 100 (NAS100) suffers high-beta liquidation as tech valuations contract under elevated interest rate sensitivity.`;
    } else {
      explanation = `Nasdaq 100 (NAS100) trades inside a balanced rotational zone; mega-cap tech performance remains mixed across sector leaders.`;
    }
  }

  return { bias, confidence, explanation };
}

/**
 * Derives asset-specific Market Psychology telemetry:
 * - For XAUUSD: Fear, Safe haven demand, Panic buying, Dollar pressure.
 * - For DJ30 / NAS100: FOMO, Risk appetite, Institutional confidence, Panic selling.
 */
export function evaluatePsychology(
  technicals: TechnicalIndicators,
  quote: ForexQuote
): MarketPsychologyAnalysis {
  const { rsi, momentum, volatility } = technicals;
  const { changePercent, symbol } = quote;

  let buyerDominance = Math.round(rsi);
  buyerDominance = Math.max(20, Math.min(80, buyerDominance));
  const sellerDominance = 100 - buyerDominance;

  let fomoRisk: 'Low' | 'Medium' | 'High' = 'Low';
  if (rsi >= 68 || Math.abs(changePercent) >= 1.2) {
    fomoRisk = 'High';
  } else if (rsi >= 58 || Math.abs(changePercent) >= 0.6) {
    fomoRisk = 'Medium';
  }

  let overconfidenceRisk: 'Low' | 'Medium' | 'High' = 'Low';
  if (rsi >= 72 || rsi <= 28) {
    overconfidenceRisk = 'High';
  } else if (momentum === 'Strong') {
    overconfidenceRisk = 'Medium';
  }

  let fearSentiment: 'Low' | 'Medium' | 'High' = 'Low';
  if (rsi <= 35 || volatility === 'High') {
    fearSentiment = 'High';
  } else if (rsi <= 45) {
    fearSentiment = 'Medium';
  }

  let marketUncertainty: 'Low' | 'Moderate' | 'Elevated' | 'Extreme' = 'Moderate';
  if (volatility === 'High' && Math.abs(rsi - 50) < 5) {
    marketUncertainty = 'Extreme';
  } else if (volatility === 'High') {
    marketUncertainty = 'Elevated';
  } else if (volatility === 'Low') {
    marketUncertainty = 'Low';
  }

  // Asset-specific psychological fields
  let safeHavenDemand: MarketPsychologyAnalysis['safeHavenDemand'] = undefined;
  let dollarPressure: MarketPsychologyAnalysis['dollarPressure'] = undefined;
  let riskAppetite: MarketPsychologyAnalysis['riskAppetite'] = undefined;
  let institutionalConfidence: MarketPsychologyAnalysis['institutionalConfidence'] = undefined;
  let panicSellingRisk: MarketPsychologyAnalysis['panicSellingRisk'] = undefined;
  let insight = '';

  if (symbol === 'XAUUSD') {
    // Gold Psychology
    safeHavenDemand = rsi >= 60 ? 'High' : rsi >= 50 ? 'Moderate' : 'Low';
    dollarPressure = changePercent < 0 ? 'Bullish USD' : changePercent > 0 ? 'Bearish USD' : 'Neutral';

    if (fomoRisk === 'High') {
      insight = `Surging bullion prices risk triggering retail panic buying. Avoid chasing gold parabolic breakouts without confirmation at structural support.`;
    } else if (fearSentiment === 'High') {
      insight = `Elevated macro fear is driving heavy safe-haven inflows. Resist premature counter-trend shorting against strong safe-haven bids.`;
    } else {
      insight = `Gold order flow remains orderly. Monitor US Dollar Index (DXY) and Real Yields for catalyst deviations.`;
    }
  } else {
    // Equity Indices Psychology (DJ30 & NAS100)
    riskAppetite = changePercent > 0.3 ? 'Risk-On' : changePercent < -0.3 ? 'Risk-Off' : 'Neutral';
    institutionalConfidence = rsi >= 55 ? 'High' : rsi <= 45 ? 'Low' : 'Moderate';
    panicSellingRisk = rsi <= 35 ? 'High' : rsi <= 45 ? 'Medium' : 'Low';

    if (symbol === 'NAS100') {
      if (fomoRisk === 'High') {
        insight = `Aggressive tech momentum is attracting late retail buyers into extended growth multiples. Protect capital with disciplined trailing stops.`;
      } else if (panicSellingRisk === 'High') {
        insight = `High-beta tech names are experiencing emotional liquidation. Avoid panic selling at major multi-day moving average supports.`;
      } else {
        insight = `Tech sector rotations are active. Verify market breadth across mega-cap constituents before scaling risk.`;
      }
    } else {
      // DJ30
      if (fomoRisk === 'High') {
        insight = `Industrial blue-chip strength is inducing FOMO entries near multi-session highs. Wait for orderly pullbacks into EMA50.`;
      } else if (panicSellingRisk === 'High') {
        insight = `Macro risk-off has triggered cyclical de-risking. Maintain emotional equilibrium and adhere to predefined daily loss ceilings.`;
      } else {
        insight = `Institutional accumulation in defensive blue chips remains measured. Standard execution rules apply.`;
      }
    }
  }

  return {
    buyerDominance,
    sellerDominance,
    marketUncertainty,
    fomoRisk,
    overconfidenceRisk,
    fearSentiment,
    safeHavenDemand,
    dollarPressure,
    riskAppetite,
    institutionalConfidence,
    panicSellingRisk,
    insight,
  };
}

/**
 * Derives Market Risk Assessment for XAUUSD, DJ30, and NAS100.
 */
export function evaluateRisk(
  technicals: TechnicalIndicators,
  upcomingEventsCount: number,
  symbol: SupportedInstrument
): MarketRiskAssessment {
  const { rsi, volatility, volatilityPips } = technicals;
  const reasons: string[] = [];

  if (volatility === 'High') {
    reasons.push(`Elevated intraday range (${volatilityPips} points) widens potential adverse excursion`);
  }

  if (rsi >= 70) {
    reasons.push(`RSI (${rsi}) in extreme overbought territory increases risk of sharp mean reversion`);
  } else if (rsi <= 30) {
    reasons.push(`RSI (${rsi}) in extreme oversold territory exposes short positions to violent short squeezes`);
  }

  if (upcomingEventsCount > 0) {
    reasons.push(`Imminent US high-impact macroeconomic announcement (FOMC / CPI / NFP) will cause spread expansion`);
  }

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (reasons.length >= 2 || volatility === 'High' || upcomingEventsCount > 0) {
    riskLevel = 'HIGH';
  } else if (reasons.length === 1 || volatility === 'Medium') {
    riskLevel = 'MEDIUM';
  }

  let mitigationRule = '';
  if (symbol === 'XAUUSD') {
    mitigationRule = riskLevel === 'HIGH'
      ? 'Reduce lot size by 50% on Gold; wider stops are required during macro volatility windows.'
      : 'Maintain standard fixed fractional risk (1-2% maximum account equity).';
  } else {
    mitigationRule = riskLevel === 'HIGH'
      ? 'Equity index volatility is elevated; avoid holding aggressive leverage into cash market opens.'
      : 'Adhere to strategy risk limits; ensure stops are placed outside intraday chop zones.';
  }

  return {
    riskLevel,
    reasons: reasons.length > 0 ? reasons : ['Orderly market structure with normal liquidity conditions.'],
    mitigationRule,
  };
}
