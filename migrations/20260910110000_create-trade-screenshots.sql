-- Migration: Create trade_screenshots table (PRD Section 16)
-- Supports multi-stage screenshots: Before (setup), During (management), and After (exit)

CREATE TABLE IF NOT EXISTS public.trade_screenshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_id UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    file_path TEXT NOT NULL,
    image_type TEXT NOT NULL CHECK (image_type IN ('before', 'during', 'after')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_trade_screenshots_user_id ON public.trade_screenshots(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_screenshots_trade_id ON public.trade_screenshots(trade_id);
CREATE INDEX IF NOT EXISTS idx_trade_screenshots_type ON public.trade_screenshots(image_type);

-- Row Level Security
ALTER TABLE public.trade_screenshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trade screenshots"
    ON public.trade_screenshots FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trade screenshots"
    ON public.trade_screenshots FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trade screenshots"
    ON public.trade_screenshots FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own trade screenshots"
    ON public.trade_screenshots FOR DELETE
    USING (auth.uid() = user_id);
