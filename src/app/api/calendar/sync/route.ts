import { NextRequest, NextResponse } from 'next/server';
import { executeCalendarSync, CalendarSyncOptions } from '@/services/calendarSyncService';
import { CalendarPeriod } from '@/services/calendar/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const options: CalendarSyncOptions = {
      period: (body.period as CalendarPeriod) || 'this_week',
      startDate: body.startDate,
      endDate: body.endDate,
      provider: body.provider,
    };

    const result = await executeCalendarSync(options);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Synchronization failed',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error during sync';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') as CalendarPeriod) || 'this_week';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const provider = searchParams.get('provider') || undefined;

    const result = await executeCalendarSync({
      period,
      startDate,
      endDate,
      provider,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Synchronization failed',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error during sync';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
