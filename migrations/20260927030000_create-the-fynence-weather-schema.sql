-- Migration: 20260927030000_create-the-fynence-weather-schema
-- Enhances public.weather_snapshots with normalized STEP 5 attributes:
-- location_id, temperature, feels_like, wind_speed, precipitation_probability,
-- pressure, visibility, uv_index, observed_at, fetched_at, source, is_stale.

DO $$
BEGIN
    -- 1. Ensure table exists
    CREATE TABLE IF NOT EXISTS public.weather_snapshots (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        location TEXT NOT NULL,
        captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        condition TEXT NOT NULL,
        current_temp_c NUMERIC(4, 1) NOT NULL,
        high_temp_c NUMERIC(4, 1) NOT NULL,
        low_temp_c NUMERIC(4, 1) NOT NULL,
        humidity_percent INTEGER NOT NULL,
        precipitation_chance_percent INTEGER NOT NULL,
        summary TEXT NOT NULL,
        source_provider TEXT NOT NULL DEFAULT 'open_meteo',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- 2. Add normalized fields idempotently
    ALTER TABLE public.weather_snapshots ADD COLUMN IF NOT EXISTS location_id TEXT;
    ALTER TABLE public.weather_snapshots ADD COLUMN IF NOT EXISTS temperature NUMERIC(4, 1);
    ALTER TABLE public.weather_snapshots ADD COLUMN IF NOT EXISTS feels_like NUMERIC(4, 1);
    ALTER TABLE public.weather_snapshots ADD COLUMN IF NOT EXISTS humidity INTEGER;
    ALTER TABLE public.weather_snapshots ADD COLUMN IF NOT EXISTS wind_speed NUMERIC(5, 1);
    ALTER TABLE public.weather_snapshots ADD COLUMN IF NOT EXISTS precipitation_probability INTEGER;
    ALTER TABLE public.weather_snapshots ADD COLUMN IF NOT EXISTS pressure NUMERIC(6, 1);
    ALTER TABLE public.weather_snapshots ADD COLUMN IF NOT EXISTS visibility NUMERIC(5, 1);
    ALTER TABLE public.weather_snapshots ADD COLUMN IF NOT EXISTS uv_index NUMERIC(4, 1);
    ALTER TABLE public.weather_snapshots ADD COLUMN IF NOT EXISTS observed_at TIMESTAMPTZ;
    ALTER TABLE public.weather_snapshots ADD COLUMN IF NOT EXISTS fetched_at TIMESTAMPTZ;
    ALTER TABLE public.weather_snapshots ADD COLUMN IF NOT EXISTS source TEXT;
    ALTER TABLE public.weather_snapshots ADD COLUMN IF NOT EXISTS is_stale BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE public.weather_snapshots ADD COLUMN IF NOT EXISTS forecast_data JSONB;

    -- 3. Backfill location_id if null
    UPDATE public.weather_snapshots
    SET location_id = 'magelang'
    WHERE location_id IS NULL AND location ILIKE '%magelang%';

    -- 4. Create Indexes
    CREATE INDEX IF NOT EXISTS idx_weather_snapshots_location_id ON public.weather_snapshots(location_id, observed_at DESC);
    CREATE INDEX IF NOT EXISTS idx_weather_snapshots_captured_at ON public.weather_snapshots(captured_at DESC);

    -- 5. Enable RLS and verify policies
    ALTER TABLE public.weather_snapshots ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'weather_snapshots' AND policyname = 'Public read for weather snapshots') THEN
        CREATE POLICY "Public read for weather snapshots" ON public.weather_snapshots FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'weather_snapshots' AND policyname = 'Allow anon insert for weather snapshots') THEN
        CREATE POLICY "Allow anon insert for weather snapshots" ON public.weather_snapshots FOR INSERT WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'weather_snapshots' AND policyname = 'Allow anon update for weather snapshots') THEN
        CREATE POLICY "Allow anon update for weather snapshots" ON public.weather_snapshots FOR UPDATE USING (true) WITH CHECK (true);
    END IF;
END $$;
