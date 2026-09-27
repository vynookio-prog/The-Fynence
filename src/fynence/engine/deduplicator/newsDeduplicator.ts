import type { Article } from '../../types/article';
import type { DeduplicationResult } from './types';
import { normalizeCanonicalUrl } from '../normalizer/urlNormalizer';
import { calculateJaccardSimilarity, normalizeTitle, tokenizeTitle } from './titleNormalizer';

export interface DeduplicationOptions {
  similarityThreshold?: number; // default 0.70
  maxTimeDifferenceHours?: number; // default 48h
}

export class NewsDeduplicator {
  private urlIndex: Map<string, string> = new Map(); // canonicalUrl -> articleId
  private normalizedTitleIndex: Map<string, string> = new Map(); // normalizedTitle -> articleId
  private tokenIndex: Array<{ id: string; url: string; title: string; tokens: Set<string>; timestamp: number }> = [];

  constructor(private readonly options: DeduplicationOptions = {}) {
    this.options.similarityThreshold = options.similarityThreshold ?? 0.70;
    this.options.maxTimeDifferenceHours = options.maxTimeDifferenceHours ?? 48;
  }

  /**
   * Indexes an existing known article for subsequent fast lookups.
   */
  public indexArticle(article: Article): void {
    const canonical = normalizeCanonicalUrl(article.url);
    this.urlIndex.set(canonical, article.id);

    const normTitle = normalizeTitle(article.title);
    if (normTitle) {
      this.normalizedTitleIndex.set(normTitle, article.id);
      this.tokenIndex.push({
        id: article.id,
        url: canonical,
        title: article.title,
        tokens: tokenizeTitle(article.title),
        timestamp: new Date(article.publishedAt).getTime(),
      });
    }
  }

  /**
   * Pre-populates the deduplication index with an array of existing articles from the database.
   */
  public seedIndex(articles: Article[]): void {
    for (const a of articles) {
      this.indexArticle(a);
    }
  }

  /**
   * Evaluates if a candidate article is a duplicate of any indexed or recently processed article.
   */
  public checkDuplicate(candidate: Partial<Article>, candidatePublishedAt?: string): DeduplicationResult {
    // 1. Exact canonical URL check
    if (candidate.url) {
      const canonical = normalizeCanonicalUrl(candidate.url);
      const existingId = this.urlIndex.get(canonical);
      if (existingId) {
        return {
          isDuplicate: true,
          isExactDuplicate: true,
          isSimilarStory: false,
          existingArticleId: existingId,
          matchedUrl: canonical,
          reason: 'canonical_url_match',
          similarityScore: 1.0,
        };
      }
    }

    // 2. Exact normalized title check
    if (candidate.title) {
      const normTitle = normalizeTitle(candidate.title);
      const existingId = this.normalizedTitleIndex.get(normTitle);
      if (existingId) {
        return {
          isDuplicate: true,
          isExactDuplicate: true,
          isSimilarStory: false,
          existingArticleId: existingId,
          matchedTitle: candidate.title,
          reason: 'normalized_title_match',
          similarityScore: 1.0,
        };
      }

      // 3. Token similarity with temporal windowing
      const candidateTokens = tokenizeTitle(candidate.title);
      const candidateTime = new Date(candidatePublishedAt || candidate.publishedAt || Date.now()).getTime();
      const maxTimeDiffMs = (this.options.maxTimeDifferenceHours || 48) * 60 * 60 * 1000;

      let bestMatch: { id: string; title: string; score: number } | null = null;

      for (const entry of this.tokenIndex) {
        // Enforce time window
        const timeDiff = Math.abs(candidateTime - entry.timestamp);
        if (timeDiff > maxTimeDiffMs) continue;

        const similarity = calculateJaccardSimilarity(candidateTokens, entry.tokens);
        if (similarity >= 0.45) {
          if (!bestMatch || similarity > bestMatch.score) {
            bestMatch = { id: entry.id, title: entry.title, score: similarity };
          }
        }
      }

      if (bestMatch) {
        const isDuplicate = bestMatch.score >= (this.options.similarityThreshold || 0.70);
        return {
          isDuplicate,
          isExactDuplicate: false,
          isSimilarStory: true,
          existingArticleId: bestMatch.id,
          matchedTitle: bestMatch.title,
          reason: 'title_token_similarity',
          similarityScore: bestMatch.score,
        };
      }
    }

    return {
      isDuplicate: false,
      isExactDuplicate: false,
      isSimilarStory: false,
      similarityScore: 0.0,
    };
  }

  public clear(): void {
    this.urlIndex.clear();
    this.normalizedTitleIndex.clear();
    this.tokenIndex = [];
  }
}

export const newsDeduplicator = new NewsDeduplicator();
