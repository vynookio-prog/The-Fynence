import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createConfiguredServerClient } from '@/lib/insforge';
import {
  analyzeTradeWithGemini,
  analyzePsychologyWithGemini,
  generateDailySummaryWithGemini,
} from '@/services/ai/tradingAiService';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const serverClient = createConfiguredServerClient({ cookies: cookieStore });

    // Enforce existing authentication & RLS
    const authRes = await serverClient.auth.getCurrentUser();
    const user = authRes.data?.user;

    if (authRes.error || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Harap login terlebih dahulu untuk mengakses AI Analysis.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { action, tradeId, targetDate } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Missing required field "action". Expected: trade_analysis, psychology_coach, or daily_summary.' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'trade_analysis': {
        if (!tradeId) {
          return NextResponse.json(
            { success: false, error: 'Missing "tradeId" for trade_analysis.' },
            { status: 400 }
          );
        }
        const result = await analyzeTradeWithGemini(tradeId, serverClient, user.id);
        if (!result.success) {
          return NextResponse.json({ success: false, error: result.error }, { status: 400 });
        }
        return NextResponse.json({ success: true, data: result.data });
      }

      case 'psychology_coach': {
        const result = await analyzePsychologyWithGemini(serverClient, user.id);
        if (!result.success) {
          return NextResponse.json({ success: false, error: result.error }, { status: 400 });
        }
        return NextResponse.json({ success: true, data: result.data });
      }

      case 'daily_summary': {
        const result = await generateDailySummaryWithGemini(serverClient, user.id, targetDate);
        if (!result.success) {
          return NextResponse.json({ success: false, error: result.error }, { status: 400 });
        }
        return NextResponse.json({ success: true, data: result.data });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Invalid action "${action}". Expected: trade_analysis, psychology_coach, or daily_summary.` },
          { status: 400 }
        );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error in AI analysis endpoint';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const serverClient = createConfiguredServerClient({ cookies: cookieStore });

    const authRes = await serverClient.auth.getCurrentUser();
    const user = authRes.data?.user;

    if (authRes.error || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    let query = serverClient.database
      .from('ai_insights')
      .select()
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (type) {
      query = query.eq('insight_type', type);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error fetching insights';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
