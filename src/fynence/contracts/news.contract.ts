import type { Article, ArticleCategory, ArticleRegion, NewsSource } from '../types/article';

export interface RawNewsItem {
  sourceName: string;
  sourceUrl: string;
  rawTitle: string;
  rawDescription?: string;
  rawContent?: string;
  rawAuthor?: string;
  rawPublishedAt: string;
  rawImageUrl?: string;
  categoryHint?: string;
}

export interface INewsIngestionService {
  /**
   * Fetches latest raw news feeds from active registered news sources.
   */
  ingestFromActiveSources(sources?: NewsSource[]): Promise<RawNewsItem[]>;

  /**
   * Ingests from a specific provider or RSS feed endpoint.
   */
  ingestFromSource(source: NewsSource): Promise<RawNewsItem[]>;
}

export interface INewsNormalizationService {
  /**
   * Cleans, sanitizes, and normalizes raw items into structured Article models.
   * Strips tracking parameters, validates original source URLs, and extracts image attribution.
   */
  normalizeItem(raw: RawNewsItem, source: NewsSource): Promise<Article>;

  /**
   * Batch normalizes multiple raw news items.
   */
  normalizeBatch(items: RawNewsItem[], sources: Map<string, NewsSource>): Promise<Article[]>;
}

export interface INewsClassificationService {
  /**
   * Classifies an article into a designated editorial category and geographic region.
   */
  classifyArticle(article: Article): Promise<{
    category: ArticleCategory;
    region: ArticleRegion;
    confidenceScore: number;
  }>;

  /**
   * Computes an objective importance score for an article based on publisher reputation and breadth of coverage.
   */
  scoreEditorialImportance(article: Article): number;
}
