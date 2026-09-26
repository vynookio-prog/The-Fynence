import { insforge } from '@/lib/insforge';
import { getForexCalendarProvider, CalendarPeriod, CalendarFilterOptions } from './calendar';

export interface CalendarSyncOptions {
  period?: CalendarPeriod;
  startDate?: string;
  endDate?: string;
  provider?: string;
}

export interface CalendarSyncResult {
  success: boolean;
  syncedCount: number;
  newCount: number;
  updatedCount?: number;
  error?: string;
}

/**
 * Server-side implementation:
 * Fetches from provider, validates data, deduplicates, and saves to InsForge PostgreSQL.
 */
export async function executeCalendarSync(
  options: CalendarSyncOptions = { period: 'this_week' }
): Promise<CalendarSyncResult> {
  try {
    const provider = getForexCalendarProvider(options.provider);
    const filterOptions: CalendarFilterOptions = {
      period: options.period || 'this_week',
      startDate: options.startDate,
      endDate: options.endDate,
    };

    const events = await provider.getEvents(filterOptions);

    if (!events || events.length === 0) {
      return { success: true, syncedCount: 0, newCount: 0, updatedCount: 0 };
    }

    // Fetch existing events to prevent duplicates and detect updates
    const { data: existingDbEvents, error: fetchErr } = await insforge.database
      .from('market_events')
      .select('id, external_event_id, source_event_id, event_name, currency, event_time, actual, forecast, previous');

    if (fetchErr) {
      console.warn('Warning querying existing market events:', fetchErr.message);
    }

    const existingIdMap = new Map<string, any>();
    const existingKeyMap = new Map<string, any>();

    (existingDbEvents || []).forEach((e: any) => {
      if (e.external_event_id) existingIdMap.set(e.external_event_id, e);
      if (e.source_event_id) existingIdMap.set(e.source_event_id, e);
      const timeIso = e.event_time ? new Date(e.event_time).toISOString().slice(0, 16) : '';
      if (timeIso) {
        existingKeyMap.set(`${e.event_name}_${e.currency}_${timeIso}`, e);
      }
    });

    let newCount = 0;
    let updatedCount = 0;
    const toInsert: any[] = [];

    for (const item of events) {
      // Validate data
      if (!item.event_name || !item.currency || !item.event_time) {
        continue; // Skip invalid records
      }

      const timeIso = new Date(item.event_time).toISOString().slice(0, 16);
      const key = `${item.event_name}_${item.currency}_${timeIso}`;
      const extId = item.external_event_id || item.source_event_id;

      const existing = (extId ? existingIdMap.get(extId) : null) || existingKeyMap.get(key);

      if (existing) {
        // Check if actual / forecast / previous changed
        const hasNewActual = item.actual && item.actual !== existing.actual;
        const hasNewForecast = item.forecast && item.forecast !== existing.forecast;
        const hasNewPrevious = item.previous && item.previous !== existing.previous;

        if (hasNewActual || hasNewForecast || hasNewPrevious) {
          await insforge.database
            .from('market_events')
            .update({
              actual: item.actual ?? existing.actual,
              forecast: item.forecast ?? existing.forecast,
              previous: item.previous ?? existing.previous,
              description: item.description,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
          updatedCount++;
        }
        continue;
      }

      toInsert.push({
        external_event_id: extId,
        source_event_id: extId,
        event_name: item.event_name,
        currency: item.currency,
        country: item.country || item.currency,
        event_time: item.event_time,
        impact: item.impact,
        actual: item.actual,
        forecast: item.forecast,
        previous: item.previous,
        description: item.description,
        source: item.source || 'Forex Factory',
        source_url: item.source_url,
        timezone: item.timezone || 'UTC',
      });

      newCount++;
      if (extId) existingIdMap.set(extId, item);
      existingKeyMap.set(key, item);
    }

    if (toInsert.length > 0) {
      const { error: insertErr } = await insforge.database
        .from('market_events')
        .insert(toInsert);

      if (insertErr) {
        throw new Error(`Failed to insert calendar events into PostgreSQL: ${insertErr.message}`);
      }
    }

    return {
      success: true,
      syncedCount: events.length,
      newCount,
      updatedCount,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to synchronize Forex Calendar';
    return {
      success: false,
      syncedCount: 0,
      newCount: 0,
      error: message,
    };
  }
}

/**
 * Calendar Sync Service:
 * If executed in client browser: proxies request to /api/calendar/sync to ensure
 * external data requests strictly happen server-side without client CORS or scraping.
 * If executed in server environment: executes sync directly.
 */
export const calendarSyncService = {
  syncForexCalendar: async (
    periodOrOptions: CalendarPeriod | CalendarSyncOptions = 'this_week'
  ): Promise<CalendarSyncResult> => {
    const options: CalendarSyncOptions =
      typeof periodOrOptions === 'string'
        ? { period: periodOrOptions }
        : periodOrOptions;

    // Browser client check: dispatch to Next.js server route
    if (typeof window !== 'undefined') {
      try {
        const response = await fetch('/api/calendar/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(options),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Server sync failed with HTTP ${response.status}`);
        }

        return await response.json();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to call server sync API';
        return { success: false, syncedCount: 0, newCount: 0, error: msg };
      }
    }

    // Server-side execution
    return executeCalendarSync(options);
  },
};

