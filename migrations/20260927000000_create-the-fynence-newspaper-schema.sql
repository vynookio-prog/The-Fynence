-- Migration: 20260927000000_create-the-fynence-newspaper-schema
-- Establishes InsForge PostgreSQL schema for THE FYNENCE retro newspaper system.
-- Reuses existing auth.users and public.profiles tables.

-- 1. News Sources
CREATE TABLE IF NOT EXISTS public.news_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    base_url TEXT NOT NULL,
    feed_url TEXT,
    category TEXT NOT NULL CHECK (category IN (
        'world', 'national', 'business', 'technology', 'finance', 'economy', 'forex', 'crypto', 'markets'
    )),
    region TEXT NOT NULL DEFAULT 'global' CHECK (region IN (
        'global', 'indonesia', 'asia_pacific', 'us', 'europe'
    )),
    is_active BOOLEAN NOT NULL DEFAULT true,
    reliability_score NUMERIC(3, 2) DEFAULT 0.85,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_news_sources_category ON public.news_sources(category);
CREATE INDEX IF NOT EXISTS idx_news_sources_is_active ON public.news_sources(is_active);

-- 2. Articles
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    content TEXT,
    url TEXT NOT NULL UNIQUE,
    source TEXT NOT NULL,
    source_id UUID REFERENCES public.news_sources(id) ON DELETE SET NULL,
    author TEXT,
    category TEXT NOT NULL CHECK (category IN (
        'world', 'national', 'business', 'technology', 'finance', 'economy', 'forex', 'crypto', 'markets'
    )),
    region TEXT NOT NULL DEFAULT 'global' CHECK (region IN (
        'global', 'indonesia', 'asia_pacific', 'us', 'europe'
    )),
    published_at TIMESTAMPTZ NOT NULL,
    image_url TEXT,
    image_source TEXT,
    image_credit TEXT,
    image_usage_status TEXT NOT NULL DEFAULT 'original_verified' CHECK (image_usage_status IN (
        'original_verified', 'processed_halftone', 'processed_grayscale',
        'fallback_typography', 'fallback_chart', 'fallback_none',
        'unusable_resolution', 'restricted_license'
    )),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_articles_published_at ON public.articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category ON public.articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_region ON public.articles(region);
CREATE INDEX IF NOT EXISTS idx_articles_source ON public.articles(source);

-- 3. Article Images (Audit & Provenance Table)
-- STRICT: Tracks verified publisher image provenance. AI images are prohibited.
CREATE TABLE IF NOT EXISTS public.article_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_source TEXT NOT NULL,
    image_credit TEXT NOT NULL,
    original_article_url TEXT NOT NULL,
    usage_status TEXT NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    width INTEGER,
    height INTEGER,
    mime_type TEXT,
    storage_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_article_images_article_id ON public.article_images(article_id);

-- 4. Market Snapshots
CREATE TABLE IF NOT EXISTS public.market_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    as_of_date DATE NOT NULL DEFAULT CURRENT_DATE,
    overall_sentiment TEXT NOT NULL,
    sentiment_headline TEXT NOT NULL,
    quotes_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    source_provider TEXT NOT NULL DEFAULT 'twelve_data',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_market_snapshots_captured_at ON public.market_snapshots(captured_at DESC);

-- 5. Weather Snapshots
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
    source_provider TEXT NOT NULL DEFAULT 'open_weather',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weather_snapshots_location ON public.weather_snapshots(location, captured_at DESC);

-- 6. Editions
CREATE TABLE IF NOT EXISTS public.editions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    type TEXT NOT NULL DEFAULT 'daily' CHECK (type IN ('daily', 'custom', 'breaking', 'weekly_digest')),
    title TEXT NOT NULL DEFAULT 'THE FYNENCE',
    subtitle TEXT NOT NULL DEFAULT 'DAILY FINANCIAL DISPATCH',
    sections JSONB NOT NULL DEFAULT '["top_story", "world", "national", "business", "technology", "finance", "economy", "weather", "markets", "economic_calendar", "tomorrow_watch"]'::jsonb,
    format TEXT NOT NULL DEFAULT 'webp' CHECK (format IN ('webp', 'png', 'pdf')),
    theme TEXT NOT NULL DEFAULT 'retro_black_cream',
    weather_config JSONB NOT NULL DEFAULT '{"enabled": true, "location": "Magelang, Jawa Tengah, Indonesia"}'::jsonb,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'composed', 'rendered', 'delivered', 'failed')),
    structured_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_editions_created_at ON public.editions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_editions_status ON public.editions(status);
CREATE INDEX IF NOT EXISTS idx_editions_user_id ON public.editions(user_id);

-- 7. Edition Articles (Junction Table)
CREATE TABLE IF NOT EXISTS public.edition_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    edition_id UUID NOT NULL REFERENCES public.editions(id) ON DELETE CASCADE,
    article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    section_type TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_edition_articles_lookup ON public.edition_articles(edition_id, section_type, order_index);

-- 8. Telegram Deliveries
CREATE TABLE IF NOT EXISTS public.telegram_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    edition_id UUID NOT NULL REFERENCES public.editions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    telegram_user_id BIGINT NOT NULL,
    chat_id BIGINT NOT NULL,
    message_id BIGINT,
    format_sent TEXT NOT NULL CHECK (format_sent IN ('webp', 'png', 'pdf')),
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'queued')),
    sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_telegram_deliveries_chat_id ON public.telegram_deliveries(chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_deliveries_edition_id ON public.telegram_deliveries(edition_id);

-- 9. Row Level Security Policies
ALTER TABLE public.news_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edition_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_deliveries ENABLE ROW LEVEL SECURITY;

-- Public or Authenticated Read Policies
CREATE POLICY "Public read for news sources"
    ON public.news_sources FOR SELECT USING (true);

CREATE POLICY "Public read for articles"
    ON public.articles FOR SELECT USING (true);

CREATE POLICY "Public read for article images"
    ON public.article_images FOR SELECT USING (true);

CREATE POLICY "Public read for market snapshots"
    ON public.market_snapshots FOR SELECT USING (true);

CREATE POLICY "Public read for weather snapshots"
    ON public.weather_snapshots FOR SELECT USING (true);

CREATE POLICY "Public read for editions"
    ON public.editions FOR SELECT USING (true);

CREATE POLICY "Public read for edition articles"
    ON public.edition_articles FOR SELECT USING (true);

CREATE POLICY "Users can view own telegram deliveries"
    ON public.telegram_deliveries FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);
