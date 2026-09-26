import 'server-only';
import { twelveDataService } from './twelveDataService';
import {
  computeTechnicals,
  evaluateMarketBias,
  evaluatePsychology,
  evaluateRisk,
} from './marketAnalysisEngine';
import { generateMarketAiReport } from './marketAiService';
import {
  SupportedInstrument,
  SUPPORTED_INSTRUMENTS,
  MarketIntelligenceData,
  ForexQuote,
} from '@/types/market';
import { createConfiguredServerClient } from '@/lib/insforge';

export const marketIntelligenceService = {
  /**
   * Generates complete market intelligence for a specific instrument.
   */
  async getMarketIntelligence(
    pair: SupportedInstrument,
    options?: {
      includeAiReport?: boolean;
      userId?: string;
      forceRefresh?: boolean;
    }
  ): Promise<MarketIntelligenceData> {
    // 1. Fetch quote using session schedule strategy (Tokyo, London, NY Open, NY Midday, NY Close)
    const { quote, source, session } = await twelveDataService.getQuote(pair, options?.forceRefresh);

    // 2. Compute technical indicators (EMA50, EMA200, RSI, MACD, ATR)
    const technicals = computeTechnicals(quote);

    // 3. Evaluate Market Bias & Analytical Confidence
    const { bias, confidence, explanation: biasExplanation } = evaluateMarketBias(technicals, quote);

    // 4. Evaluate Trader Psychology telemetry
    const psychology = evaluatePsychology(technicals, quote);

    // 5. Fetch upcoming economic calendar events relevant to this instrument
    // All 3 instruments (XAUUSD, DJ30, NAS100) are priced in USD and driven by US macro releases
    const relevantCurrencies = ['USD', 'US'];
    let upcomingEvents: MarketIntelligenceData['upcomingEvents'] = [];
    let userContext: { relevantTradesSummary?: string } | undefined = undefined;

    try {
      const serverClient = createConfiguredServerClient();
      
      // Fetch upcoming high/med impact events
      const nowIso = new Date().toISOString();
      const { data: eventsData } = await serverClient.database
        .from('market_events')
        .select()
        .gte('event_time', nowIso)
        .order('event_time', { ascending: true })
        .limit(10);

      if (eventsData && Array.isArray(eventsData)) {
        upcomingEvents = eventsData
          .filter((e: any) => relevantCurrencies.includes(e.currency) || e.currency === 'USD')
          .slice(0, 4)
          .map((e: any) => ({
            currency: e.currency,
            event_name: e.event_name,
            impact: e.impact || 'medium',
            event_time: e.event_time,
            forecast: e.forecast,
            previous: e.previous,
          }));
      }

      // Fetch user's recent trading mistakes/patterns on this pair if user is logged in
      if (options?.userId) {
        const cleanSymbol = pair.replace('/', '');
        const { data: userTrades } = await serverClient.database
          .from('trades')
          .select()
          .eq('user_id', options.userId)
          .eq('symbol', cleanSymbol)
          .order('entry_time', { ascending: false })
          .limit(5);

        if (userTrades && userTrades.length > 0) {
          const winCount = userTrades.filter((t: any) => Number(t.net_profit_loss) > 0).length;
          const lossCount = userTrades.length - winCount;
          userContext = {
            relevantTradesSummary: `User has executed ${userTrades.length} recent trades on ${pair} (${winCount}W / ${lossCount}L). Recent common notes: "${userTrades[0]?.entry_reason || 'Technical entry'}".`,
          };
        }
      }
    } catch (dbErr) {
      console.warn('[marketIntelligenceService] Context fetch error (non-fatal):', dbErr);
    }

    // 6. Evaluate Risk Level
    const risk = evaluateRisk(technicals, upcomingEvents.length, pair);

    const baseData: MarketIntelligenceData = {
      pair,
      quote,
      technicals,
      bias,
      confidence,
      biasExplanation,
      psychology,
      risk,
      upcomingEvents,
      source,
      session,
      updatedAt: new Date().toISOString(),
    };

    // 7. Generate Gemini AI Report if requested
    if (options?.includeAiReport) {
      const aiReport = await generateMarketAiReport(baseData, userContext);
      baseData.aiReport = aiReport;
    }

    return baseData;
  },

  /**
   * Fetches full market overview for all supported instruments.
   */
  async getAllPairsOverview(options?: { forceRefresh?: boolean }): Promise<MarketIntelligenceData[]> {
    const results = await Promise.all(
      SUPPORTED_INSTRUMENTS.map((pair) =>
        this.getMarketIntelligence(pair, { includeAiReport: false, forceRefresh: options?.forceRefresh })
      )
    );
    return results;
  },
};
