import { createClient } from 'npm:@insforge/sdk';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function mapCountryToCurrency(countryCode: string): string {
  const c = (countryCode || 'USD').toUpperCase();
  const map: Record<string, string> = {
    US: 'USD', USA: 'USD', USD: 'USD',
    EU: 'EUR', EUR: 'EUR',
    GB: 'GBP', UK: 'GBP', GBP: 'GBP',
    JP: 'JPY', JPY: 'JPY',
    AU: 'AUD', AUD: 'AUD',
    CA: 'CAD', CAD: 'CAD',
    CH: 'CHF', CHF: 'CHF',
    NZ: 'NZD', NZD: 'NZD',
  };
  return map[c] || c;
}

function mapImpact(rawImpact?: string): 'low' | 'medium' | 'high' | 'non-economic' {
  if (!rawImpact) return 'low';
  const imp = rawImpact.toLowerCase();
  if (imp.includes('high') || imp.includes('red')) return 'high';
  if (imp.includes('med') || imp.includes('orange')) return 'medium';
  if (imp.includes('low') || imp.includes('yellow')) return 'low';
  return 'non-economic';
}

export default async function (req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const client = createClient({
      baseUrl: Deno.env.get('INSFORGE_BASE_URL'),
      anonKey: Deno.env.get('ANON_KEY') || Deno.env.get('API_KEY'),
    });

    const feedUrl = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';
    let rawList: any[] = [];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch(feedUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FynenceBot/1.0)',
          'Accept': 'application/json',
        },
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        rawList = await res.json();
      }
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      console.warn('External feed timeout/error:', fetchErr);
    }

    if (!rawList || rawList.length === 0) {
      return new Response(
        JSON.stringify({ success: true, syncedCount: 0, newCount: 0, message: 'No events retrieved' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Query existing to prevent duplicates
    const { data: existingDbEvents } = await client.database
      .from('market_events')
      .select('id, external_event_id, source_event_id, event_name, currency, event_time');

    const existingKeySet = new Set(
      (existingDbEvents || []).map(
        (e: any) => `${e.event_name}_${e.currency}_${new Date(e.event_time).toISOString().slice(0, 16)}`
      )
    );
    const existingIdSet = new Set(
      (existingDbEvents || []).flatMap((e: any) => [e.external_event_id, e.source_event_id]).filter(Boolean)
    );

    const toInsert: any[] = [];
    let newCount = 0;

    for (let idx = 0; idx < rawList.length; idx++) {
      const item = rawList[idx];
      const currency = mapCountryToCurrency(item.country || 'USD');
      const impact = mapImpact(item.impact);
      const eventTime = item.date ? new Date(item.date).toISOString() : new Date().toISOString();
      const eventId = `ff_${currency}_${new Date(eventTime).getTime()}_${idx}`;
      const extId = item.id ? String(item.id) : eventId;
      const key = `${item.title || item.event_name}_${currency}_${new Date(eventTime).toISOString().slice(0, 16)}`;

      if (existingIdSet.has(extId) || existingKeySet.has(key)) {
        continue;
      }

      toInsert.push({
        external_event_id: extId,
        source_event_id: extId,
        event_name: item.title || item.event_name || 'Macro Release',
        currency,
        country: item.country || currency,
        event_time: eventTime,
        impact,
        actual: item.actual || null,
        forecast: item.forecast || null,
        previous: item.previous || null,
        description: item.description || null,
        source: 'Forex Factory',
        source_url: item.url || 'https://www.forexfactory.com/calendar',
        timezone: 'UTC',
      });

      newCount++;
      existingIdSet.add(extId);
      existingKeySet.add(key);
    }

    if (toInsert.length > 0) {
      const { error: insertErr } = await client.database
        .from('market_events')
        .insert(toInsert);

      if (insertErr) {
        throw new Error(`Insert failed: ${insertErr.message}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, syncedCount: rawList.length, newCount }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Edge function sync error';
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
