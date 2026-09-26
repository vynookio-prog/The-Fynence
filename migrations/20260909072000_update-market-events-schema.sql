-- Migration: update-market-events-schema
-- Aligns market_events table with Forex News Calendar module specifications

-- 1. Ensure columns exist
ALTER TABLE public.market_events
    ADD COLUMN IF NOT EXISTS external_event_id TEXT,
    ADD COLUMN IF NOT EXISTS description TEXT;

-- Backfill external_event_id from source_event_id if available
UPDATE public.market_events
SET external_event_id = source_event_id
WHERE external_event_id IS NULL AND source_event_id IS NOT NULL;

-- 2. Indexes for efficient filtering and deduplication
CREATE INDEX IF NOT EXISTS idx_market_events_external_id ON public.market_events(external_event_id);
CREATE INDEX IF NOT EXISTS idx_market_events_country ON public.market_events(country);
CREATE INDEX IF NOT EXISTS idx_market_events_time ON public.market_events(event_time DESC);
CREATE INDEX IF NOT EXISTS idx_market_events_currency ON public.market_events(currency);
CREATE INDEX IF NOT EXISTS idx_market_events_impact ON public.market_events(impact);

-- 3. Check constraint on impact
DO $$
BEGIN
    ALTER TABLE public.market_events DROP CONSTRAINT IF EXISTS market_events_impact_check;
    ALTER TABLE public.market_events ADD CONSTRAINT market_events_impact_check CHECK (impact IN ('low', 'medium', 'high', 'non-economic'));
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 4. Verify RLS is enabled and policies exist
ALTER TABLE public.market_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'market_events' AND policyname = 'Anyone can view market events'
    ) THEN
        CREATE POLICY "Anyone can view market events"
            ON public.market_events FOR SELECT
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'market_events' AND policyname = 'Authenticated users can manage market events'
    ) THEN
        CREATE POLICY "Authenticated users can manage market events"
            ON public.market_events FOR ALL
            USING (auth.role() = 'authenticated')
            WITH CHECK (auth.role() = 'authenticated');
    END IF;
END $$;
