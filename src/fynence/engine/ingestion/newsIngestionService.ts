import type { Article } from '../../types/article';
import type { IngestionRunSummary, IngestionSourceSummary } from './types';
import { sourceRegistry } from '../registry/sourceRegistry';
import { newsFetcher } from '../fetcher/newsFetcher';
import { parseRssOrAtom } from '../parser/rssParser';
import { parseNewsApiResponse } from '../parser/newsApiParser';
import { newsNormalizer } from '../normalizer/newsNormalizer';
import { newsValidator } from '../validator/newsValidator';
import { newsImageExtractor } from '../extractor/imageExtractor';
import { newsDeduplicator } from '../deduplicator/newsDeduplicator';
import { newsClassifier } from '../classifier/newsClassifier';
import { newsRepository } from '../repository/newsRepository';
import { storyClusterManager } from '../clustering/storyCluster';

export class NewsIngestionService {
  /**
   * Executes ingestion for a single designated source.
   * Full pipeline: fetch -> parse -> normalize -> validate -> extract image -> deduplicate -> classify -> store
   */
  public async ingestSource(sourceId: string): Promise<IngestionSourceSummary> {
    const startTime = Date.now();
    const source = sourceRegistry.get(sourceId);

    if (!source) {
      return {
        sourceId,
        sourceName: 'Unknown',
        status: 'failed',
        fetched: 0,
        valid: 0,
        duplicates: 0,
        stored: 0,
        failed: 1,
        durationMs: 0,
        errorMessage: `Source '${sourceId}' is not registered in sourceRegistry`,
      };
    }

    if (!source.enabled) {
      return {
        sourceId: source.id,
        sourceName: source.name,
        status: 'disabled',
        fetched: 0,
        valid: 0,
        duplicates: 0,
        stored: 0,
        failed: 0,
        durationMs: 0,
      };
    }

    try {
      // 1. Fetch
      const response = await newsFetcher.fetchSource(source);

      if (response.notModified) {
        return {
          sourceId: source.id,
          sourceName: source.name,
          status: 'not_modified',
          fetched: 0,
          valid: 0,
          duplicates: 0,
          stored: 0,
          failed: 0,
          durationMs: Date.now() - startTime,
        };
      }

      // Update source metadata with ETag/Last-Modified
      sourceRegistry.updateFetchMetadata(source.id, {
        etag: response.etag,
        lastModified: response.lastModified,
        lastFetchedAt: new Date().toISOString(),
      });

      // 2. Parse
      const feed = source.type === 'api'
        ? parseNewsApiResponse(response.body)
        : parseRssOrAtom(response.body);

      const items = feed.items.slice(0, source.maxItemsPerFetch || 30);
      const fetchedCount = items.length;

      let validCount = 0;
      let duplicatesCount = 0;
      let storedCount = 0;
      let failedCount = 0;

      // 3. Process each item through the pipeline
      for (const item of items) {
        try {
          // Normalize
          const normalized = newsNormalizer.normalize(item, source);

          // Validate
          const validation = newsValidator.validate(normalized);
          if (!validation.isValid) {
            failedCount++;
            continue;
          }
          validCount++;

          // Image Extraction (Strict anti-AI verification)
          const imageResult = newsImageExtractor.extractFromFeed({
            articleUrl: normalized.url,
            sourceName: source.name,
            enclosureUrl: item.imageUrl,
            mediaContentUrl: item.imageUrl,
            htmlContent: item.content || item.description,
          });

          if (imageResult.hasImage && imageResult.metadata) {
            normalized.imageUrl = imageResult.metadata.imageUrl;
            normalized.imageSource = imageResult.metadata.imageSource;
            normalized.imageCredit = imageResult.metadata.imageCredit;
            normalized.imageUsageStatus = imageResult.status;
            normalized.imageMetadata = imageResult.metadata;
          } else {
            normalized.imageUrl = null;
            normalized.imageSource = null;
            normalized.imageCredit = null;
            normalized.imageUsageStatus = 'unavailable';
          }

          // Deduplicate
          const dupResult = newsDeduplicator.checkDuplicate(normalized, normalized.publishedAt);
          if (dupResult.isDuplicate) {
            duplicatesCount++;
            continue;
          }

          // Classify
          const classification = newsClassifier.classify(
            normalized,
            source.categories[0] || 'markets',
            source.regions[0] || 'global'
          );

          normalized.category = classification.primaryCategory;
          normalized.region = classification.region;

          // Store in InsForge
          const storeRes = await newsRepository.storeArticle(normalized);
          if (storeRes.stored) {
            storedCount++;
            // Index for subsequent deduplication in this and future runs
            newsDeduplicator.indexArticle(normalized);
            // Index in memory story cluster
            storyClusterManager.createCluster(normalized.title, normalized);
          } else {
            if (storeRes.error?.includes('already exists')) {
              duplicatesCount++;
            } else {
              failedCount++;
            }
          }
        } catch {
          failedCount++;
        }
      }

      return {
        sourceId: source.id,
        sourceName: source.name,
        status: 'completed',
        fetched: fetchedCount,
        valid: validCount,
        duplicates: duplicatesCount,
        stored: storedCount,
        failed: failedCount,
        durationMs: Date.now() - startTime,
      };
    } catch (err: any) {
      return {
        sourceId: source.id,
        sourceName: source.name,
        status: 'failed',
        fetched: 0,
        valid: 0,
        duplicates: 0,
        stored: 0,
        failed: 1,
        durationMs: Date.now() - startTime,
        errorMessage: err?.message || 'Ingestion failed with unknown error',
      };
    }
  }

  /**
   * Executes ingestion across all enabled news sources sequentially with graceful fault isolation.
   */
  public async ingestAll(): Promise<IngestionRunSummary> {
    const runId = `run_${Date.now()}`;
    const startedAt = new Date().toISOString();
    const startTime = Date.now();

    // Pre-seed deduplication index with recent articles from InsForge to prevent duplicates
    try {
      const recent = await newsRepository.getRecentArticles(200, 72);
      for (const a of recent) {
        const article: Article = {
          id: a.id,
          title: a.title,
          description: a.description,
          content: a.content || undefined,
          url: a.url,
          source: a.source,
          sourceId: a.source_id || undefined,
          author: a.author,
          category: a.category,
          region: a.region,
          publishedAt: a.published_at,
          imageUrl: a.image_url,
          imageSource: a.image_source,
          imageCredit: a.image_credit,
          imageUsageStatus: a.image_usage_status,
          createdAt: a.created_at,
          updatedAt: a.updated_at,
        };
        newsDeduplicator.indexArticle(article);
      }
    } catch {
      // Non-fatal if index seeding encounters a temporary network issue
    }

    const enabledSources = sourceRegistry.getEnabled();
    const sourceSummaries: IngestionSourceSummary[] = [];

    let totalFetched = 0;
    let totalValid = 0;
    let totalDuplicates = 0;
    let totalStored = 0;
    let totalFailed = 0;

    for (const source of enabledSources) {
      // Graceful error boundary per source
      const summary = await this.ingestSource(source.id);
      sourceSummaries.push(summary);

      totalFetched += summary.fetched;
      totalValid += summary.valid;
      totalDuplicates += summary.duplicates;
      totalStored += summary.stored;
      totalFailed += summary.failed;
    }

    return {
      runId,
      startedAt,
      completedAt: new Date().toISOString(),
      totalDurationMs: Date.now() - startTime,
      sourcesProcessed: enabledSources.length,
      totalFetched,
      totalValid,
      totalDuplicates,
      totalStored,
      totalFailed,
      sourceSummaries,
    };
  }
}

export const newsIngestionService = new NewsIngestionService();
