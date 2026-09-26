import { NextRequest, NextResponse } from 'next/server';
import { mt5SyncService } from '@/services/mt5SyncService';

/**
 * Scheduled background synchronization endpoint.
 * Can be triggered periodically by cron (Vercel Cron, external trigger, or InsForge scheduler).
 * Operates autonomously without requiring the user's browser to be open.
 */
export async function GET(req: NextRequest) {
  return handleScheduledSync(req);
}

export async function POST(req: NextRequest) {
  return handleScheduledSync(req);
}

async function handleScheduledSync(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const cronSecret = process.env.CRON_SECRET;

    // If CRON_SECRET is configured, enforce token authorization
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      const url = new URL(req.url);
      const queryToken = url.searchParams.get('token');
      if (queryToken !== cronSecret) {
        return NextResponse.json({ error: 'Unauthorized scheduled trigger' }, { status: 401 });
      }
    }

    const result = await mt5SyncService.syncAllActiveAccounts();
    return NextResponse.json({
      success: true,
      mode: 'scheduled_auto_sync',
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Scheduled sync execution failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
