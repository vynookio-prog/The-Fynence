import { NextRequest, NextResponse } from 'next/server';
import { pulseService } from '@/services/pulse';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    const pulseData = await pulseService.getFynencePulse(forceRefresh);

    return NextResponse.json({
      success: true,
      data: pulseData,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve Fynence Pulse';
    console.error('[API /api/pulse] Error:', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
