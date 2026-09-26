-- Migration: 20260927010000_create-the-fynence-editorial-schema
-- Establishes InsForge PostgreSQL schema for THE FYNENCE AI Editorial Engine:
-- 1. story_clusters
-- 2. editorial_stories
-- 3. editorial_runs

-- 1. Story Clusters Table
CREATE TABLE IF NOT EXISTS public.story_clusters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic TEXT NOT NULL,
    primary_article_id UUID REFERENCES public.articles(id) ON DELETE SET NULL,
    article_ids UUID[] NOT NULL DEFAULT '{}',
    first_reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    significance TEXT NOT NULL DEFAULT 'medium' CHECK (significance IN ('low', 'medium', 'high')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_story_clusters_primary_article ON public.story_clusters(primary_article_id);
CREATE INDEX IF NOT EXISTS idx_story_clusters_created_at ON public.story_clusters(created_at DESC);

-- 2. Editorial Stories Table
CREATE TABLE IF NOT EXISTS public.editorial_stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_id UUID REFERENCES public.story_clusters(id) ON DELETE SET NULL,
    primary_article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    headline TEXT NOT NULL,
    summary TEXT NOT NULL,
    why_it_matters TEXT NOT NULL,
    primary_section TEXT NOT NULL CHECK (primary_section IN (
        'top_story', 'world', 'national', 'business', 'technology', 'finance', 'economy', 'forex', 'crypto', 'markets'
    )),
    secondary_sections TEXT[] NOT NULL DEFAULT '{}',
    importance TEXT NOT NULL CHECK (importance IN ('low', 'medium', 'high')),
    source_articles JSONB NOT NULL DEFAULT '[]'::jsonb,
    image_data JSONB,
    entities JSONB NOT NULL DEFAULT '[]'::jsonb,
    metrics JSONB NOT NULL DEFAULT '[]'::jsonb,
    content_hash TEXT NOT NULL,
    model TEXT NOT NULL,
    prompt_version TEXT NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_editorial_stories_cluster_id ON public.editorial_stories(cluster_id);
CREATE INDEX IF NOT EXISTS idx_editorial_stories_primary_article ON public.editorial_stories(primary_article_id);
CREATE INDEX IF NOT EXISTS idx_editorial_stories_section ON public.editorial_stories(primary_section);
CREATE INDEX IF NOT EXISTS idx_editorial_stories_importance ON public.editorial_stories(importance);
CREATE INDEX IF NOT EXISTS idx_editorial_stories_content_hash ON public.editorial_stories(content_hash);
CREATE INDEX IF NOT EXISTS idx_editorial_stories_created_at ON public.editorial_stories(created_at DESC);

-- 3. Editorial Runs Table
CREATE TABLE IF NOT EXISTS public.editorial_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    articles_processed INTEGER NOT NULL DEFAULT 0,
    stories_created INTEGER NOT NULL DEFAULT 0,
    failed INTEGER NOT NULL DEFAULT 0,
    model TEXT NOT NULL,
    prompt_version TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_editorial_runs_started_at ON public.editorial_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_editorial_runs_status ON public.editorial_runs(status);

-- 4. Enable Row Level Security and setup policies
ALTER TABLE public.story_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editorial_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editorial_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read for story clusters" ON public.story_clusters FOR SELECT USING (true);
CREATE POLICY "Allow anon insert for story clusters" ON public.story_clusters FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update for story clusters" ON public.story_clusters FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Public read for editorial stories" ON public.editorial_stories FOR SELECT USING (true);
CREATE POLICY "Allow anon insert for editorial stories" ON public.editorial_stories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update for editorial stories" ON public.editorial_stories FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Public read for editorial runs" ON public.editorial_runs FOR SELECT USING (true);
CREATE POLICY "Allow anon insert for editorial runs" ON public.editorial_runs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update for editorial runs" ON public.editorial_runs FOR UPDATE USING (true) WITH CHECK (true);
