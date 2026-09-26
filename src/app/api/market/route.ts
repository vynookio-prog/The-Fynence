import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createConfiguredServerClient } from '@/lib/insforge';
import { marketIntelligenceService } from '@/services/market/marketIntelligenceService';
import { SupportedForexPair, SUPPORTED_FOREX_PAIRS } from '@/types/market';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const serverClient = createConfiguredServerClient({ cookies: cookieStore });
    const { data: userData } = await serverClient.auth.getCurrentUser();
    const userId = userData?.user?.id;

    const { searchParams } = new URL(req.url);
    const pairParam = searchParams.get('pair') as SupportedForexPair | null;
    const includeAi = searchParams.get('ai') === 'true';

    if (pairParam) {
      if (!SUPPORTED_FOREX_PAIRS.includes(pairParam)) {
        return NextResponse.json(
          {
            success: false,
            error: `Unsupported pair. Available: ${SUPPORTED_FOREX_PAIRS.join(', ')}`,
          },
          { status: 400 }
        );
      }

      const intelligence = await marketIntelligenceService.getMarketIntelligence(pairParam, {
        includeAiReport: includeAi,
        userId,
      });

      return NextResponse.json({
        success: true,
        data: intelligence,
      });
    }

    // Default: fetch overview of all supported pairs
    const allOverview = await marketIntelligenceService.getAllPairsOverview();
    return NextResponse.json({
      success: true,
      data: allOverview,
      count: allOverview.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal market API error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
