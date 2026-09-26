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

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Only POST requests supported.' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const client = createClient({
      baseUrl: Deno.env.get('INSFORGE_BASE_URL'),
      anonKey: Deno.env.get('ANON_KEY') || Deno.env.get('API_KEY'),
    });

    let body: any = null;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Malformed JSON payload.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Auth verification: check token in header or body
    const authHeader = req.headers.get('Authorization') || '';
    const eaToken = body.eaToken || authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!eaToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing eaToken authentication.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Query trading account by eaToken
    const { data: accounts, error: accErr } = await client.database
      .from('trading_accounts')
      .select('id, user_id, name, initial_balance, current_balance, currency')
      .eq('ea_token', eaToken);

    if (accErr || !accounts || accounts.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired EA Token.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const account = accounts[0];
    const { account: rawAcc, deals = [] } = body;
    const nowIso = new Date().toISOString();

    // 1. Update account telemetry if provided
    if (rawAcc) {
      const balance = Number(rawAcc.balance) || account.current_balance;
      const equity = Number(rawAcc.equity) || balance;
      const margin = Number(rawAcc.margin) || 0;
      const freeMargin = Number(rawAcc.freeMargin) || equity - margin;

      await client.database
        .from('trading_accounts')
        .update({
          current_balance: balance,
          current_equity: equity,
          margin,
          free_margin: freeMargin,
          connection_status: 'connected',
          last_synced_at: nowIso,
          last_sync_time: nowIso,
          sync_error: null,
          is_mt5_synced: true,
        })
        .eq('id', account.id);
    }

    // 2. Duplicate Protection: fetch existing tickets for this account
    const { data: existingTrades } = await client.database
      .from('trades')
      .select('external_trade_id')
      .eq('trading_account_id', account.id);

    const existingTicketSet = new Set(
      (existingTrades || []).map((t: any) => t.external_trade_id).filter(Boolean)
    );

    let newCount = 0;
    const tradesToInsert: any[] = [];

    for (const deal of deals) {
      const ticketStr = String(deal.ticket || '');
      if (!ticketStr || existingTicketSet.has(ticketStr)) {
        continue;
      }

      const openIso = deal.openTime
        ? new Date(deal.openTime).toISOString()
        : deal.time
        ? new Date(deal.time * 1000).toISOString()
        : nowIso;
      const closeIso = deal.closeTime
        ? new Date(deal.closeTime).toISOString()
        : openIso;

      const profit = Number(deal.profit) || 0;
      const commission = Number(deal.commission) || 0;
      const swap = Number(deal.swap) || 0;
      const netProfit = profit + commission + swap;

      tradesToInsert.push({
        user_id: account.user_id,
        trading_account_id: account.id,
        trading_account_name: account.name,
        external_trade_id: ticketStr,
        source: 'mt5',
        symbol: String(deal.symbol || 'EURUSD'),
        asset_type: 'forex',
        direction: deal.type === 'sell' ? 'sell' : 'buy',
        entry_price: Number(deal.price) || 1.0,
        exit_price: Number(deal.price) || 1.0,
        stop_loss: Number(deal.stopLoss) || 0,
        take_profit: Number(deal.takeProfit) || 0,
        position_size: Number(deal.volume) || 0.1,
        leverage: 100,
        timeframe: 'M15',
        session: 'London',
        entry_time: openIso,
        exit_time: closeIso,
        open_time: openIso,
        close_time: closeIso,
        profit_loss: profit,
        net_profit_loss: netProfit,
        commission,
        swap,
        status: 'closed',
        entry_reason: `Imported via MQL5 EA (Ticket #${ticketStr})`,
        exit_reason: deal.comment || 'MT5 EA Push Execution',
        trading_plan: 'Systematic MT5 Execution',
        psychology: {
          emotion: 'neutral',
          confidence: 8,
          discipline_score: 8,
          followed_plan: true,
          fomo: false,
          revenge_trading: false,
          before_trade_note: `Ticket #${ticketStr}`,
          during_trade_note: '',
          after_trade_note: deal.comment ? `MT5 Comment: ${deal.comment}` : '',
        },
      });

      newCount++;
      existingTicketSet.add(ticketStr);
    }

    // 3. Batch insert new trades
    if (tradesToInsert.length > 0) {
      const { error: insertErr } = await client.database
        .from('trades')
        .insert(tradesToInsert);

      if (insertErr && !insertErr.message?.includes('duplicate')) {
        throw new Error(`Insert failed: ${insertErr.message}`);
      }
    }

    // 4. Log in trade_sync_records
    await client.database.from('trade_sync_records').insert([
      {
        user_id: account.user_id,
        trading_account_id: account.id,
        synced_trades_count: deals.length,
        new_trades_count: newCount,
        status: 'success',
        sync_status: 'success',
        last_synced_timestamp: nowIso,
        details: { source: 'MQL5_EA', dealsCount: deals.length },
      },
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        accountId: account.id,
        syncedDeals: deals.length,
        newTrades: newCount,
        timestamp: nowIso,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'EA Receiver error';
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
