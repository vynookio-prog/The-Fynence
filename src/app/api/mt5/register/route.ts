import { NextRequest, NextResponse } from 'next/server';
import { mt5SyncService } from '@/services/mt5SyncService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { tradingAccountId, options } = body;

    if (!tradingAccountId) {
      return NextResponse.json(
        { success: false, error: 'tradingAccountId is required.' },
        { status: 400 }
      );
    }

    const result = await mt5SyncService.registerMT5Connector(tradingAccountId, options);
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Register connector failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
