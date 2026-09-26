import { NextRequest, NextResponse } from 'next/server';
import { marketIntelligenceService } from '@/services/market/marketIntelligenceService';
import { sessionScheduleService } from '@/services/market/sessionScheduleService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/market/sync
 * Forces a synchronization of all 3 benchmark instruments (XAUUSD, DJ30, NAS100)
 * for the current global trading session.
 */
export async function POST(req: NextRequest) {
  try {
    const session = sessionScheduleService.getCurrentSession();
    const overview = await marketIntelligenceService.getAllPairsOverview({ forceRefresh: true });

    return NextResponse.json({
      success: true,
      message: `Market telemetry synchronized for ${session.currentSessionName} (Session ${session.sessionNumber}/${session.totalSessions})`,
      session,
      syncedInstruments: overview.map((item) => ({
        symbol: item.pair,
        price: item.quote.price,
        change: item.quote.changePercent,
        trend: item.technicals.trend,
        bias: item.bias,
        source: item.source,
      })),
      quotaStrategy: '10-Minute Dynamic Sync Strategy (144 syncs/day across 3 instruments = 432 calls/day, optimal for 800 daily credits quota)',
      syncedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Market sync failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * GET /api/market/sync
 * Returns current session status, daily session schedule, and next sync window.
 */
export async function GET(req: NextRequest) {
  const session = sessionScheduleService.getCurrentSession();
  const allSessions = sessionScheduleService.getAllDailySessions();

  return NextResponse.json({
    success: true,
    currentSession: session,
    dailySessions: allSessions,
    quotaStrategy: '10-Minute Dynamic Sync Strategy (144 syncs/day = 432 calls/day out of 800 credits quota)',
    serverTimeUtc: new Date().toISOString(),
  });
}
