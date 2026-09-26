-- Migration: create-profiles-psychology-insights
-- Prepares database relationships and tables for web and mobile clients

-- 1. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    default_currency TEXT NOT NULL DEFAULT 'USD',
    timezone TEXT NOT NULL DEFAULT 'UTC',
    tier TEXT NOT NULL DEFAULT 'FREE' CHECK (tier IN ('FREE', 'PRO')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
    ON public.profiles FOR DELETE
    USING (auth.uid() = id);


-- 2. Trade Psychology
CREATE TABLE IF NOT EXISTS public.trade_psychology (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    trade_id UUID REFERENCES public.trades(id) ON DELETE CASCADE,
    emotion TEXT NOT NULL DEFAULT 'neutral',
    confidence INTEGER NOT NULL DEFAULT 8 CHECK (confidence >= 1 AND confidence <= 10),
    fomo BOOLEAN NOT NULL DEFAULT false,
    revenge_trading BOOLEAN NOT NULL DEFAULT false,
    greed BOOLEAN NOT NULL DEFAULT false,
    fear BOOLEAN NOT NULL DEFAULT false,
    followed_plan BOOLEAN NOT NULL DEFAULT true,
    discipline_score INTEGER NOT NULL DEFAULT 8 CHECK (discipline_score >= 1 AND discipline_score <= 10),
    before_trade_note TEXT,
    during_trade_note TEXT,
    after_trade_note TEXT,
    lessons_learned TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trade_psychology_user_id ON public.trade_psychology(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_psychology_trade_id ON public.trade_psychology(trade_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_trade_psychology_unique_trade ON public.trade_psychology(trade_id) WHERE trade_id IS NOT NULL;
ALTER TABLE public.trade_psychology ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trade psychology"
    ON public.trade_psychology FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trade psychology"
    ON public.trade_psychology FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trade psychology"
    ON public.trade_psychology FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own trade psychology"
    ON public.trade_psychology FOR DELETE
    USING (auth.uid() = user_id);


-- 3. AI Insights
CREATE TABLE IF NOT EXISTS public.ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    insight_type TEXT NOT NULL CHECK (insight_type IN ('financial', 'trading', 'psychology', 'weekly_review', 'monthly_review')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    source_period TEXT,
    severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'success', 'alert')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON public.ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON public.ai_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_created_at ON public.ai_insights(created_at DESC);
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ai insights"
    ON public.ai_insights FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai insights"
    ON public.ai_insights FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ai insights"
    ON public.ai_insights FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own ai insights"
    ON public.ai_insights FOR DELETE
    USING (auth.uid() = user_id);
