-- Migration: 20260927020000_create-the-fynence-market-schema
-- Establishes InsForge PostgreSQL schema for THE FYNENCE Market Data Engine:
-- 1. market_quotes (Individual asset quotes with audit trail)
-- 2. RLS policies for market_quotes and market_snapshots

CREATE TABLE IF NOT EXISTS public.market_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol TEXT NOT NULL,
    provider_symbol TEXT NOT NULL,
    display_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('forex', 'index', 'crypto', 'commodity')),
    price NUMERIC(16, 6) NOT NULL,
    open NUMERIC(16, 6),
    high NUMERIC(16, 6),
    low NUMERIC(16, 6),
    previous_close NUMERIC(16, 6),
    change NUMERIC(16, 6),
    change_percent NUMERIC(10, 4),
    direction TEXT NOT NULL CHECK (direction IN ('up', 'down', 'flat')),
    volume NUMERIC(20, 2),
    market_status TEXT NOT NULL DEFAULT 'unknown' CHECK (market_status IN ('open', 'closed', 'pre-market', 'after-hours', 'unknown')),
    timestamp TIMESTAMPTZ NOT NULL,
    source TEXT NOT NULL DEFAULT 'twelve_data',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_market_quotes_symbol ON public.market_quotes(symbol, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_market_quotes_category ON public.market_quotes(category);
CREATE INDEX IF NOT EXISTS idx_market_quotes_created_at ON public.market_quotes(created_at DESC);

-- Enable RLS
ALTER TABLE public.market_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read for market quotes" ON public.market_quotes FOR SELECT USING (true);
CREATE POLICY "Allow anon insert for market quotes" ON public.market_quotes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update for market quotes" ON public.market_quotes FOR UPDATE USING (true) WITH CHECK (true);

-- Ensure RLS policies exist on market_snapshots
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'market_snapshots' AND policyname = 'Allow anon insert for market snapshots') THEN
        CREATE POLICY "Allow anon insert for market snapshots" ON public.market_snapshots FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'market_snapshots' AND policyname = 'Allow anon update for market snapshots') THEN
        CREATE POLICY "Allow anon update for market snapshots" ON public.market_snapshots FOR UPDATE USING (true) WITH CHECK (true);
    END IF;
END $$;
