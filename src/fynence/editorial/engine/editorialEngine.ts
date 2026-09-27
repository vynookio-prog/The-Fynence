import type { Article } from '../../types/article';
import type {
  EditorialEntity,
  EditorialImage,
  EditorialMetric,
  EditorialRun,
  EditorialSourceArticle,
  EditorialStory,
  StructuredAiAnalysis,
} from '../types';
import type { AIProvider } from '../providers/types';
import { GeminiProvider } from '../providers/geminiProvider';
import { primarySourceSelector } from '../clustering/primarySourceSelector';
import { storyClusterEngine, type ClusteredStoryGroup } from '../clustering/storyClusterEngine';
import { EDITORIAL_PROMPT_VERSION } from '../prompts/promptVersions';
import { EDITORIAL_SYSTEM_PROMPT } from '../prompts/systemPrompt';
import {
  buildStoryAnalysisPrompt,
  EDITORIAL_ANALYSIS_SCHEMA,
} from '../prompts/editorialPrompts';
import { editorialValidator } from '../validator/editorialValidator';
import { editorialCache } from '../cache/editorialCache';
import { editorialRepository } from '../repository/editorialRepository';

export interface EditorialBatchResult {
  run: EditorialRun;
  stories: EditorialStory[];
  clusterGroups: ClusteredStoryGroup[];
  durationMs: number;
}

export class EditorialEngine {
  private defaultProvider: AIProvider;

  constructor(provider?: AIProvider) {
    this.defaultProvider = provider || new GeminiProvider();
  }

  /**
   * Sets or overrides the active AI provider.
   */
  public setProvider(provider: AIProvider): void {
    this.defaultProvider = provider;
  }

  /**
   * Processes a single clustered story group into a structured EditorialStory.
   * Utilizes content-hash caching to bypass AI calls when content has not changed.
   */
  public async processStoryGroup(
    group: ClusteredStoryGroup,
    options?: { provider?: AIProvider; forceRegenerate?: boolean }
  ): Promise<EditorialStory> {
    const provider = options?.provider || this.defaultProvider;
    const { primaryArticle, relatedArticles, cluster } = group;

    // 1. Check Cache
    const contentHash = editorialCache.computeHash(primaryArticle, relatedArticles);

    if (!options?.forceRegenerate) {
      // In-memory cache hit
      const cached = editorialCache.get(contentHash, EDITORIAL_PROMPT_VERSION);
      if (cached) return cached;

      // Database cache hit
      const dbCached = await editorialRepository.findByContentHash(
        contentHash,
        EDITORIAL_PROMPT_VERSION
      );
      if (dbCached) {
        editorialCache.set(contentHash, EDITORIAL_PROMPT_VERSION, dbCached);
        return dbCached;
      }
    }

    // 2. Build Prompt & Execute AI Analysis
    const prompt = buildStoryAnalysisPrompt(primaryArticle, relatedArticles);

    const aiRes = await provider.generateStructured<StructuredAiAnalysis>(
      prompt,
      EDITORIAL_ANALYSIS_SCHEMA,
      {
        systemInstruction: EDITORIAL_SYSTEM_PROMPT,
        temperature: 0.2,
        timeoutMs: 12000,
        retries: 2,
      }
    );

    if (!aiRes.success || !aiRes.data) {
      throw new Error(
        `Editorial analysis failed via ${provider.name}: ${aiRes.error || 'Empty response'}`
      );
    }

    // 3. Schema & Quality Validation
    const validation = editorialValidator.validate(aiRes.data);
    if (!validation.isValid || !validation.data) {
      throw new Error(
        `Editorial validation failed: ${validation.errors.join('; ')}`
      );
    }

    const validated = validation.data;

    // 4. Traceable Source Articles
    const allArticles = [primaryArticle, ...relatedArticles];
    const sourceArticles: EditorialSourceArticle[] = allArticles.map(a => ({
      articleId: a.id,
      source: a.source,
      url: a.url,
      publishedAt: a.publishedAt,
    }));

    // 5. Strict Anti-AI Image Preservation
    let image: EditorialImage | null = null;
    if (primaryArticle.imageUrl && primaryArticle.imageUsageStatus !== 'unavailable') {
      image = {
        url: primaryArticle.imageUrl,
        source: primaryArticle.imageSource || primaryArticle.source,
        credit: primaryArticle.imageCredit || `Photo via ${primaryArticle.source}`,
        usageStatus: primaryArticle.imageUsageStatus,
        isAiGenerated: false, // Strict compile-time constraint
      };
    }

    // 6. Tag Extracted Metrics as SOURCE_REPORTED_DATA
    const metrics: EditorialMetric[] = validated.metrics.map(m => ({
      name: m.name,
      value: m.value,
      context: m.context,
      sourceType: 'SOURCE_REPORTED_DATA',
    }));

    // 7. Construct EditorialStory Model
    const storyId = `story_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const nowIso = new Date().toISOString();

    const story: EditorialStory = {
      id: storyId,
      clusterId: cluster?.id || null,
      primaryArticleId: primaryArticle.id,
      headline: validated.headline,
      summary: validated.summary,
      whyItMatters: validated.whyItMatters,
      primarySection: validated.primarySection,
      secondarySections: validated.secondarySections,
      importance: validated.importance,
      sourceArticles,
      image,
      entities: validated.entities,
      metrics,
      contentHash,
      model: provider.name === 'gemini' ? (aiRes.model || 'gemini-2.5-flash') : provider.defaultModel,
      promptVersion: EDITORIAL_PROMPT_VERSION,
      generatedAt: nowIso,
      createdAt: nowIso,
    };

    // 8. Cache & Persist
    editorialCache.set(contentHash, EDITORIAL_PROMPT_VERSION, story);
    await editorialRepository.storeStory(story);

    return story;
  }

  /**
   * Processes a batch of raw articles through the complete editorial pipeline:
   * Clustering -> Primary Source Selection -> AI Synthesis -> Validation -> Storage.
   */
  public async processBatch(
    articles: Article[],
    options?: { provider?: AIProvider; forceRegenerate?: boolean }
  ): Promise<EditorialBatchResult> {
    const startTime = Date.now();
    const provider = options?.provider || this.defaultProvider;

    const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const run: EditorialRun = {
      id: runId,
      startedAt: new Date().toISOString(),
      articlesProcessed: articles.length,
      storiesCreated: 0,
      failed: 0,
      model: provider.name,
      promptVersion: EDITORIAL_PROMPT_VERSION,
      status: 'in_progress',
    };

    await editorialRepository.createEditorialRun(run);

    // 1. Cluster articles deterministically
    const clusterGroups = storyClusterEngine.clusterArticles(articles);

    // Store clusters in database
    for (const group of clusterGroups) {
      await editorialRepository.storeCluster(group.cluster);
    }

    const stories: EditorialStory[] = [];
    let failedCount = 0;

    // 2. Process each story group with error isolation
    for (const group of clusterGroups) {
      try {
        const story = await this.processStoryGroup(group, options);
        stories.push(story);
      } catch (err: any) {
        failedCount++;
        console.warn(`[EditorialEngine] Failed processing cluster "${group.cluster.topic}": ${err?.message}`);
      }
    }

    // 3. Complete Editorial Run
    const completedAt = new Date().toISOString();
    run.completedAt = completedAt;
    run.storiesCreated = stories.length;
    run.failed = failedCount;
    run.status = failedCount === clusterGroups.length && clusterGroups.length > 0 ? 'failed' : 'completed';

    await editorialRepository.updateEditorialRun(runId, run);

    return {
      run,
      stories,
      clusterGroups,
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Processes an incoming raw article batch directly into broadsheet stories via candidate pool ranking.
   */
  public async processCandidatePoolToStories(
    articles: Article[],
    options?: {
      editionType?: string;
      targetCount?: number;
      provider?: AIProvider;
      useAi?: boolean;
      sections?: string[];
    }
  ): Promise<{
    stories: import('../../renderer/types/document').NewspaperStory[];
    poolResult: import('../../engine/ranking/newsRanker').CandidatePoolResult;
  }> {
    const { newsRanker } = await import('../../engine/ranking/newsRanker');
    const { editorialCandidateSelector } = await import('./editorialCandidateSelector');

    const poolResult = newsRanker.buildCandidatePool(articles, {
      editionType: options?.editionType,
      sections: options?.sections,
    });

    const stories = await editorialCandidateSelector.selectStories(poolResult.candidates, {
      editionType: options?.editionType,
      targetCount: options?.targetCount,
      provider: options?.provider || this.defaultProvider,
      useAi: options?.useAi,
    });

    return { stories, poolResult };
  }
}

export const editorialEngine = new EditorialEngine();
