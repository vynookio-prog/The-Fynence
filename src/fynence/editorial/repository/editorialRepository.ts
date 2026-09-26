import { insforge } from '@/lib/insforge';
import type { EditorialRun, EditorialStory, StoryCluster } from '../types';
import type { DbEditorialRun, DbEditorialStory, DbStoryCluster } from '../../types/database';

export class EditorialRepository {
  /**
   * Checks if an editorial story matching the given content hash and prompt version already exists.
   */
  public async findByContentHash(contentHash: string, promptVersion: string): Promise<EditorialStory | null> {
    try {
      const response = await insforge.database
        .from('editorial_stories')
        .select()
        .eq('content_hash', contentHash)
        .eq('prompt_version', promptVersion)
        .limit(1)
        .maybeSingle();

      if (response.error || !response.data) return null;
      return this.mapDbToStory(response.data as unknown as DbEditorialStory);
    } catch {
      return null;
    }
  }

  /**
   * Persists a story cluster record in the InsForge database.
   */
  public async storeCluster(cluster: StoryCluster): Promise<{ stored: boolean; clusterId: string; error?: string }> {
    try {
      const record: Omit<DbStoryCluster, 'created_at' | 'updated_at'> = {
        id: cluster.id.startsWith('cluster_') && cluster.id.includes('-') ? cluster.id : undefined as any,
        topic: cluster.topic,
        primary_article_id: cluster.primaryArticleId || null,
        article_ids: cluster.articleIds,
        first_reported_at: cluster.firstReportedAt,
        significance: cluster.significance,
      };

      // If cluster.id is not a UUID, let PostgreSQL generate one or omit it
      const insertObj: any = {
        topic: cluster.topic,
        primary_article_id: cluster.primaryArticleId || null,
        article_ids: cluster.articleIds,
        first_reported_at: cluster.firstReportedAt,
        significance: cluster.significance,
      };

      const res = await insforge.database
        .from('story_clusters')
        .insert([insertObj])
        .select('id')
        .single();

      if (res.error) {
        return { stored: false, clusterId: cluster.id, error: res.error.message };
      }

      return { stored: true, clusterId: res.data.id };
    } catch (err: any) {
      return { stored: false, clusterId: cluster.id, error: err?.message || 'Database error storing cluster' };
    }
  }

  /**
   * Persists an editorial story in the InsForge database.
   */
  public async storeStory(story: EditorialStory): Promise<{ stored: boolean; storyId: string; error?: string }> {
    try {
      const existing = await this.findByContentHash(story.contentHash, story.promptVersion);
      if (existing) {
        return { stored: true, storyId: existing.id };
      }

      const insertRecord = {
        primary_article_id: story.primaryArticleId,
        headline: story.headline,
        summary: story.summary,
        why_it_matters: story.whyItMatters,
        primary_section: story.primarySection,
        secondary_sections: story.secondarySections,
        importance: story.importance,
        source_articles: story.sourceArticles,
        image_data: story.image,
        entities: story.entities,
        metrics: story.metrics,
        content_hash: story.contentHash,
        model: story.model,
        prompt_version: story.promptVersion,
        generated_at: story.generatedAt,
      };

      const res = await insforge.database
        .from('editorial_stories')
        .insert([insertRecord])
        .select('id')
        .single();

      if (res.error) {
        return { stored: false, storyId: story.id, error: res.error.message };
      }

      return { stored: true, storyId: res.data.id };
    } catch (err: any) {
      return { stored: false, storyId: story.id, error: err?.message || 'Database error storing story' };
    }
  }

  /**
   * Records the start of an editorial processing run for observability.
   */
  public async createEditorialRun(run: EditorialRun): Promise<{ stored: boolean; runId: string }> {
    try {
      const res = await insforge.database
        .from('editorial_runs')
        .insert([{
          started_at: run.startedAt,
          articles_processed: run.articlesProcessed,
          stories_created: run.storiesCreated,
          failed: run.failed,
          model: run.model,
          prompt_version: run.promptVersion,
          status: run.status,
          error_message: run.errorMessage || null,
        }])
        .select('id')
        .single();

      if (res.error || !res.data) {
        return { stored: false, runId: run.id };
      }

      return { stored: true, runId: res.data.id };
    } catch {
      return { stored: false, runId: run.id };
    }
  }

  /**
   * Updates an ongoing editorial processing run upon completion or failure.
   */
  public async updateEditorialRun(runId: string, updates: Partial<EditorialRun>): Promise<{ updated: boolean }> {
    try {
      const updateData: Record<string, any> = {};
      if (updates.completedAt) updateData.completed_at = updates.completedAt;
      if (updates.articlesProcessed !== undefined) updateData.articles_processed = updates.articlesProcessed;
      if (updates.storiesCreated !== undefined) updateData.stories_created = updates.storiesCreated;
      if (updates.failed !== undefined) updateData.failed = updates.failed;
      if (updates.status) updateData.status = updates.status;
      if (updates.errorMessage !== undefined) updateData.error_message = updates.errorMessage;

      const res = await insforge.database
        .from('editorial_runs')
        .update(updateData)
        .eq('id', runId);

      return { updated: !res.error };
    } catch {
      return { updated: false };
    }
  }

  /**
   * Retrieves recent editorial stories ordered by generation timestamp.
   */
  public async getRecentStories(limit = 30): Promise<EditorialStory[]> {
    try {
      const response = await insforge.database
        .from('editorial_stories')
        .select()
        .order('generated_at', { ascending: false })
        .limit(limit);

      if (response.error || !response.data) return [];
      return (response.data as unknown as DbEditorialStory[]).map(r => this.mapDbToStory(r));
    } catch {
      return [];
    }
  }

  private mapDbToStory(row: DbEditorialStory): EditorialStory {
    return {
      id: row.id,
      clusterId: row.cluster_id,
      primaryArticleId: row.primary_article_id,
      headline: row.headline,
      summary: row.summary,
      whyItMatters: row.why_it_matters,
      primarySection: row.primary_section,
      secondarySections: row.secondary_sections || [],
      importance: row.importance,
      sourceArticles: row.source_articles || [],
      image: row.image_data,
      entities: row.entities || [],
      metrics: row.metrics || [],
      contentHash: row.content_hash,
      model: row.model,
      promptVersion: row.prompt_version,
      generatedAt: row.generated_at,
      createdAt: row.created_at,
    };
  }
}

export const editorialRepository = new EditorialRepository();
