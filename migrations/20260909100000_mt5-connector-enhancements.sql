-- Migration: mt5-connector-enhancements
-- Enhances trading_accounts, trade_sync_records, and trades for robust MT5 synchronization

-- 1. Enhance trading_accounts table
ALTER TABLE public.trading_accounts
    ADD COLUMN IF NOT EXISTS external_account_id TEXT,
    ADD COLUMN IF NOT EXISTS ea_token TEXT,
    ADD COLUMN IF NOT EXISTS margin NUMERIC(15, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS free_margin NUMERIC(15, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_sync_time TIMESTAMPTZ;

-- Unique index for EA token lookups (if token present)
CREATE UNIQUE INDEX IF NOT EXISTS idx_trading_accounts_ea_token 
    ON public.trading_accounts(ea_token) 
    WHERE ea_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_trading_accounts_external_id 
    ON public.trading_accounts(external_account_id) 
    WHERE external_account_id IS NOT NULL;

-- 2. Enhance trade_sync_records table
ALTER TABLE public.trade_sync_records
    ADD COLUMN IF NOT EXISTS external_trade_id TEXT,
    ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'success',
    ADD COLUMN IF NOT EXISTS last_synced_timestamp TIMESTAMPTZ DEFAULT now(),
    ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_trade_sync_records_ext_trade 
    ON public.trade_sync_records(external_trade_id) 
    WHERE external_trade_id IS NOT NULL;

-- 3. Duplicate Protection on Trades table
-- Ensures a trade with the same external MT5 ticket cannot be inserted more than once for a trading account
CREATE UNIQUE INDEX IF NOT EXISTS uq_trades_account_external_id 
    ON public.trades(trading_account_id, external_trade_id) 
    WHERE external_trade_id IS NOT NULL;
