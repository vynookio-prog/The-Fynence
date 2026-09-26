import type { Article, ArticleEditorialSummary } from '../types/article';
import type { EditionConfig, NewspaperSectionType } from '../types/edition';

/**
 * AI Editorial Boundaries:
 * AI assists the editorial process through summarization, topic clustering, and section organization.
 * AI is strictly prohibited from inventing market prices, weather facts, quotes, statistics, sources, or images.
 */
export interface IAiEditorialService {
  /**
   * Generates a concise, high-density editorial summary strictly derived from verified source content.
   */
  summarizeArticle(content: string, maxWords?: number): Promise<string>;

  /**
   * Crafts a classic financial newspaper style headline (punchy, informative, no clickbait).
   */
  generateConciseHeadline(originalTitle: string, summary: string): Promise<string>;

  /**
   * Explains institutional and macroeconomic significance (Why It Matters) using only verified facts.
   */
  generateWhyItMatters(article: Article): Promise<string>;

  /**
   * Clusters articles discussing the exact same underlying event to avoid redundancy.
   */
  identifyDuplicateStories(articles: Article[]): Promise<Map<string, string[]>>;

  /**
   * Extracts recognized corporate entities, tickers, policymakers, and institutions from the text.
   */
  extractEntities(text: string): Promise<string[]>;

  /**
   * Scores and prioritizes stories for inclusion in the designated newspaper edition.
   */
  rankStoriesForEdition(
    articles: Article[],
    config: EditionConfig
  ): Promise<ArticleEditorialSummary[]>;

  /**
   * Maps processed stories into corresponding modular newspaper sections.
   */
  organizeSections(
    summaries: ArticleEditorialSummary[],
    supportedSections: NewspaperSectionType[]
  ): Promise<Map<NewspaperSectionType, ArticleEditorialSummary[]>>;
}
