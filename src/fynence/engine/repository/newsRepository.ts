import { insforge } from '@/lib/insforge';
import type { Article } from '../../types/article';
import type { DbArticle, DbArticleImage, DbNewsSource } from '../../types/database';
import type { NewsSourceConfig } from '../registry/types';

function isValidUuid(id?: string | null): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export class NewsRepository {
  private sourceUuidCache = new Map<string, string>();

  /**
   * Resolves a news source slug into its database UUID.
   */
  public async resolveSourceUuid(sourceSlug: string, sourceName?: string): Promise<string | null> {
    if (isValidUuid(sourceSlug)) return sourceSlug;
    if (this.sourceUuidCache.has(sourceSlug)) {
      return this.sourceUuidCache.get(sourceSlug)!;
    }

    try {
      const res = await insforge.database
        .from('news_sources')
        .select('id')
        .eq('slug', sourceSlug)
        .limit(1)
        .maybeSingle();

      if (res.data?.id) {
        this.sourceUuidCache.set(sourceSlug, res.data.id);
        return res.data.id;
      }

      // If source record does not exist yet, insert it to maintain foreign key integrity
      const insertRes = await insforge.database
        .from('news_sources')
        .insert([{
          name: sourceName || sourceSlug,
          slug: sourceSlug,
          base_url: `https://${sourceSlug}.com`,
          category: 'markets',
          region: 'global',
          is_active: true,
          reliability_score: 0.85,
        }])
        .select('id')
        .single();

      if (insertRes.data?.id) {
        this.sourceUuidCache.set(sourceSlug, insertRes.data.id);
        return insertRes.data.id;
      }
    } catch {
      // Fallback: return null so article insert succeeds without foreign key violation
    }

    return null;
  }

  /**
   * Looks up an article by its canonical URL in the InsForge articles table.
   */
  public async findByUrl(url: string): Promise<DbArticle | null> {
    try {
      const response = await insforge.database
        .from('articles')
        .select()
        .eq('url', url)
        .limit(1)
        .maybeSingle();

      if (response.error || !response.data) return null;
      return response.data as unknown as DbArticle;
    } catch {
      return null;
    }
  }

  /**
   * Fetches recent articles from InsForge within a designated time window.
   */
  public async getRecentArticles(limit = 100, hoursAgo = 72): Promise<DbArticle[]> {
    try {
      const thresholdDate = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
      const response = await insforge.database
        .from('articles')
        .select()
        .gte('published_at', thresholdDate)
        .order('published_at', { ascending: false })
        .limit(limit);

      if (response.error || !response.data) return [];
      return response.data as unknown as DbArticle[];
    } catch {
      return [];
    }
  }

  /**
   * Stores a normalized article and its verified image provenance in InsForge.
   * Idempotent: checks for canonical URL collision before insert.
   */
  public async storeArticle(article: Article): Promise<{ stored: boolean; articleId?: string; error?: string }> {
    try {
      const existing = await this.findByUrl(article.url);
      if (existing) {
        return { stored: false, articleId: existing.id, error: 'Article URL already exists in database' };
      }

      let resolvedSourceId: string | null = null;
      if (article.sourceId) {
        resolvedSourceId = await this.resolveSourceUuid(article.sourceId, article.source);
      }

      const dbArticleRecord: Omit<DbArticle, 'created_at' | 'updated_at'> = {
        id: article.id,
        title: article.title,
        description: article.description,
        content: article.content || null,
        url: article.url,
        source: article.source,
        source_id: resolvedSourceId,
        author: article.author || null,
        category: article.category,
        region: article.region,
        published_at: article.publishedAt,
        image_url: article.imageUrl || null,
        image_source: article.imageSource || null,
        image_credit: article.imageCredit || null,
        image_usage_status: article.imageUsageStatus,
      };

      const insertRes = await insforge.database
        .from('articles')
        .insert([dbArticleRecord])
        .select()
        .single();

      if (insertRes.error) {
        return { stored: false, error: insertRes.error.message };
      }

      // If an original verified image is present, log its provenance in article_images table
      if (article.imageUrl) {
        const imageRecord: Omit<DbArticleImage, 'id' | 'created_at'> = {
          article_id: article.id,
          image_url: article.imageUrl,
          image_source: article.imageSource || article.source,
          image_credit: article.imageCredit || `Photo via ${article.source}`,
          original_article_url: article.url,
          usage_status: article.imageUsageStatus,
          fetched_at: new Date().toISOString(),
          width: null,
          height: null,
          mime_type: null,
          storage_path: null,
        };

        await insforge.database
          .from('article_images')
          .insert([imageRecord]);
      }

      return { stored: true, articleId: article.id };
    } catch (err: any) {
      return { stored: false, error: err?.message || 'Database error storing article' };
    }
  }

  /**
   * Upserts configured sources into the news_sources table in InsForge.
   */
  public async syncSourceRegistry(sources: NewsSourceConfig[]): Promise<{ synced: number; errors: string[] }> {
    let synced = 0;
    const errors: string[] = [];

    for (const source of sources) {
      try {
        const existing = await insforge.database
          .from('news_sources')
          .select('id')
          .eq('slug', source.id)
          .limit(1)
          .maybeSingle();

        if (existing.data?.id) {
          this.sourceUuidCache.set(source.id, existing.data.id);
          const updateRes = await insforge.database
            .from('news_sources')
            .update({
              name: source.name,
              base_url: source.url,
              feed_url: source.url,
              category: source.categories[0] || 'markets',
              region: source.regions[0] || 'global',
              is_active: source.enabled,
              reliability_score: 0.90,
            })
            .eq('id', existing.data.id);

          if (updateRes.error) {
            errors.push(`Failed updating source ${source.id}: ${updateRes.error.message}`);
          } else {
            synced++;
          }
        } else {
          const insertRes = await insforge.database
            .from('news_sources')
            .insert([{
              name: source.name,
              slug: source.id,
              base_url: source.url,
              feed_url: source.url,
              category: source.categories[0] || 'markets',
              region: source.regions[0] || 'global',
              is_active: source.enabled,
              reliability_score: 0.90,
            }])
            .select('id')
            .single();

          if (insertRes.error) {
            errors.push(`Failed inserting source ${source.id}: ${insertRes.error.message}`);
          } else if (insertRes.data?.id) {
            this.sourceUuidCache.set(source.id, insertRes.data.id);
            synced++;
          }
        }
      } catch (err: any) {
        errors.push(`Exception syncing source ${source.id}: ${err?.message}`);
      }
    }

    return { synced, errors };
  }
}

export const newsRepository = new NewsRepository();
