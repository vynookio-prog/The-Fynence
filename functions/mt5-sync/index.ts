import { createClient } from 'npm:@insforge/sdk';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function (req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const client = createClient({
      baseUrl: Deno.env.get('INSFORGE_BASE_URL'),
      anonKey: Deno.env.get('ANON_KEY') || Deno.env.get('API_KEY'),
    });

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Malformed payload. JSON body expected.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, tradingAccountId, eaToken, credentials } = body;

    if (!action) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing action parameter.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // --- 1. REGISTER MT5 CONNECTOR ---
    if (action === 'register_connector') {
      if (!tradingAccountId) {
        return new Response(
          JSON.stringify({ success: false, error: 'tradingAccountId is required.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const generatedToken = `ea_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
      const { data, error } = await client.database
        .from('trading_accounts')
        .update({
          ea_token: generatedToken,
          connection_status: 'connected',
          is_mt5_synced: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tradingAccountId)
        .select();

      if (error) {
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, eaToken: generatedToken, account: data?.[0] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // --- 2. SYNC ACCOUNT TELEMETRY ---
    if (action === 'sync_account') {
      if (!tradingAccountId) {
        return new Response(
          JSON.stringify({ success: false, error: 'tradingAccountId is required.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: accounts, error: accErr } = await client.database
        .from('trading_accounts')
        .select()
        .eq('id', tradingAccountId);

      if (accErr || !accounts || accounts.length === 0) {
        return new Response(
          JSON.stringify({ success: false, error: 'Account not found or inaccessible.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const account = accounts[0];
      const nowIso = new Date().toISOString();

      await client.database
        .from('trading_accounts')
        .update({
          connection_status: 'connected',
          last_synced_at: nowIso,
          last_sync_time: nowIso,
          sync_error: null,
        })
        .eq('id', tradingAccountId);

      return new Response(
        JSON.stringify({
          success: true,
          account: {
            id: account.id,
            balance: account.current_balance,
            equity: account.current_equity,
            margin: account.margin || 0,
            freeMargin: account.free_margin || account.current_equity,
            lastSyncedAt: nowIso,
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // --- 3. SYNC TRADE HISTORY ---
    if (action === 'sync_trade_history') {
      if (!tradingAccountId) {
        return new Response(
          JSON.stringify({ success: false, error: 'tradingAccountId is required.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Fetch trades synced
      const { data: trades } = await client.database
        .from('trades')
        .select('id, external_trade_id, symbol, direction, position_size, entry_price, exit_price, net_profit_loss, status')
        .eq('trading_account_id', tradingAccountId)
        .eq('source', 'mt5');

      return new Response(
        JSON.stringify({ success: true, count: trades?.length || 0, trades: trades || [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // --- 4. SYNC POSITIONS ---
    if (action === 'sync_positions') {
      if (!tradingAccountId) {
        return new Response(
          JSON.stringify({ success: false, error: 'tradingAccountId is required.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: records } = await client.database
        .from('trade_sync_records')
        .select('details')
        .eq('trading_account_id', tradingAccountId)
        .order('created_at', { ascending: false })
        .limit(1);

      const positions = records?.[0]?.details?.openPositions || [];

      return new Response(
        JSON.stringify({ success: true, positions }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: `Unsupported action: ${action}` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
