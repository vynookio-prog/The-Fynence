import { NextRequest, NextResponse } from 'next/server';
import { insforge } from '@/lib/insforge';
import { detectNewsCorrelation } from '@/lib/correlation';

export async function POST(req: NextRequest) {
  try {
    let body: any = null;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Malformed JSON payload.' },
        { status: 400 }
      );
    }

    const authHeader = req.headers.get('authorization') || '';
    const eaToken = body?.eaToken || authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!eaToken) {
      return NextResponse.json(
        { success: false, error: 'Missing eaToken authentication parameter or header.' },
        { status: 401 }
      );
    }

    // 1. Verify account by EA token
    const { data: accounts, error: accErr } = await insforge.database
      .from('trading_accounts')
      .select('id, user_id, name, initial_balance, current_balance, currency')
      .eq('ea_token', eaToken);

    if (accErr || !accounts || accounts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid or unrecognized EA token.' },
        { status: 401 }
      );
    }

    const account = accounts[0];
    const { account: rawAcc, deals = [] } = body;
    const nowIso = new Date().toISOString();

    // 2. Telemetry update
    if (rawAcc) {
      const balance = Number(rawAcc.balance) || account.current_balance;
      const equity = Number(rawAcc.equity) || balance;
      const margin = Number(rawAcc.margin) || 0;
      const freeMargin = Number(rawAcc.freeMargin) || equity - margin;

      await insforge.database
        .from('trading_accounts')
        .update({
          current_balance: balance,
          current_equity: equity,
          connection_status: 'connected',
          last_synced_at: nowIso,
          sync_error: null,
          is_mt5_synced: true,
        })
        .eq('id', account.id);
    }

    // 3. Duplicate Protection
    const { data: existingTrades } = await insforge.database
      .from('trades')
      .select('external_trade_id')
      .eq('trading_account_id', account.id);

    const existingTicketSet = new Set(
      (existingTrades || []).map((t: any) => t.external_trade_id).filter(Boolean)
    );

    // Fetch news events for correlation
    const { data: marketEvents } = await insforge.database.from('market_events').select();

    let newCount = 0;
    let lastTicket = '';
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
      const price = Number(deal.price) || 1.0;
      const volume = Number(deal.volume) || 0.1;
      const symbol = String(deal.symbol || 'EURUSD');

      const correlation = detectNewsCorrelation(symbol, openIso, marketEvents || []);

      tradesToInsert.push({
        user_id: account.user_id,
        trading_account_id: account.id,
        trading_account_name: account.name,
        external_trade_id: ticketStr,
        source: 'mt5',
        symbol,
        asset_type: symbol.includes('XAU') || symbol.includes('OIL') ? 'commodities' : symbol.includes('BTC') ? 'crypto' : 'forex',
        direction: deal.type === 'sell' ? 'sell' : 'buy',
        entry_price: price,
        exit_price: price,
        stop_loss: Number(deal.stopLoss) || 0,
        take_profit: Number(deal.takeProfit) || 0,
        position_size: volume,
        leverage: 100,
        timeframe: 'M15',
        session: 'London',
        entry_time: openIso,
        exit_time: closeIso,
        open_time: openIso,
        close_time: closeIso,
        risk_amount: Number((volume * 100).toFixed(2)),
        reward_amount: Number((volume * 150).toFixed(2)),
        profit_loss: profit,
        net_profit_loss: netProfit,
        profit_loss_percent: Number(((netProfit / (account.initial_balance || 100000)) * 100).toFixed(2)),
        r_multiple: netProfit >= 0 ? 1.5 : -1.0,
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
        correlated_news: correlation
          ? {
              event_name: correlation.event_name,
              impact: correlation.impact,
              time_diff_minutes: correlation.time_diff_minutes,
              currency: correlation.currency,
            }
          : undefined,
      });

      newCount++;
      lastTicket = ticketStr;
      existingTicketSet.add(ticketStr);
    }

    if (tradesToInsert.length > 0) {
      const { error: insertErr } = await insforge.database
        .from('trades')
        .insert(tradesToInsert);

      if (insertErr && !insertErr.message?.includes('duplicate')) {
        throw new Error(`Insert failed: ${insertErr.message}`);
      }
    }

    // 4. Log in trade_sync_records
    try {
      await insforge.database.from('trade_sync_records').insert([
        {
          user_id: account.user_id,
          trading_account_id: account.id,
          synced_trades_count: deals.length,
          new_trades_count: newCount,
          status: 'success',
          error_message: null,
        },
      ]);
    } catch (logErr) {
      console.warn('Webhook sync log insert warning:', logErr);
    }

    return NextResponse.json({
      success: true,
      accountId: account.id,
      syncedDeals: deals.length,
      newTrades: newCount,
      timestamp: nowIso,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'EA Webhook processing error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
