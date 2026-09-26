-- Migration: mt5-and-forex-calendar-sync

-- 1. Enhance Trading Accounts for MT5 integration
ALTER TABLE public.trading_accounts
    ADD COLUMN IF NOT EXISTS mt5_login TEXT,
    ADD COLUMN IF NOT EXISTS mt5_server TEXT,
    ADD COLUMN IF NOT EXISTS current_equity NUMERIC(15, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS connection_status TEXT NOT NULL DEFAULT 'disconnected',
    ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS sync_error TEXT,
    ADD COLUMN IF NOT EXISTS investor_password_encrypted TEXT,
    ADD COLUMN IF NOT EXISTS is_mt5_synced BOOLEAN NOT NULL DEFAULT false;

-- Add constraint for connection_status if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'trading_accounts_connection_status_check'
    ) THEN
        ALTER TABLE public.trading_accounts 
        ADD CONSTRAINT trading_accounts_connection_status_check 
        CHECK (connection_status IN ('connected', 'disconnected', 'syncing', 'error'));
    END IF;
END $$;

-- 2. Enhance Trades table for MT5 sync idempotency
ALTER TABLE public.trades
    ADD COLUMN IF NOT EXISTS external_trade_id TEXT,
    ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual',
    ADD COLUMN IF NOT EXISTS open_time TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS close_time TIMESTAMPTZ;

-- Add constraint for trade source
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'trades_source_check'
    ) THEN
        ALTER TABLE public.trades 
        ADD CONSTRAINT trades_source_check 
        CHECK (source IN ('manual', 'mt5'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_trades_external_id ON public.trades(trading_account_id, external_trade_id);
CREATE INDEX IF NOT EXISTS idx_trades_account_id ON public.trades(trading_account_id);
CREATE INDEX IF NOT EXISTS idx_trades_source ON public.trades(source);

-- 3. Trade Sync Records (Log of MT5 sync runs)
CREATE TABLE IF NOT EXISTS public.trade_sync_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    trading_account_id UUID NOT NULL REFERENCES public.trading_accounts(id) ON DELETE CASCADE,
    synced_trades_count INTEGER NOT NULL DEFAULT 0,
    new_trades_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'partial', 'syncing')),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trade_sync_user_id ON public.trade_sync_records(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_sync_account_id ON public.trade_sync_records(trading_account_id);
CREATE INDEX IF NOT EXISTS idx_trade_sync_created_at ON public.trade_sync_records(created_at DESC);

ALTER TABLE public.trade_sync_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trade sync records"
    ON public.trade_sync_records FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trade sync records"
    ON public.trade_sync_records FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trade sync records"
    ON public.trade_sync_records FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own trade sync records"
    ON public.trade_sync_records FOR DELETE
    USING (auth.uid() = user_id);

-- 4. Market Events enhancement for Forex Calendar
ALTER TABLE public.market_events
    ADD COLUMN IF NOT EXISTS source_url TEXT,
    ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

DO $$
BEGIN
    ALTER TABLE public.market_events DROP CONSTRAINT IF EXISTS market_events_impact_check;
    ALTER TABLE public.market_events ADD CONSTRAINT market_events_impact_check CHECK (impact IN ('low', 'medium', 'high', 'non-economic'));
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;
