import type { Article } from '../../types/article';
import { sourceRegistry } from '../../engine/registry/sourceRegistry';

export interface SourceScoreBreakdown {
  articleId: string;
  source: string;
  editorialPriority: number;
  completenessScore: number;
  imageScore: number;
  freshnessScore: number;
  totalScore: number;
}

export interface PrimarySourceSelectionResult {
  primaryArticle: Article;
  scores: SourceScoreBreakdown[];
}

export class PrimarySourceSelector {
  /**
   * Transparently selects the best primary article from a group of articles covering the same story.
   * Relies entirely on explicit, configurable signals: source priority, length, image availability, freshness.
   */
  public selectPrimary(articles: Article[]): PrimarySourceSelectionResult {
    if (articles.length === 0) {
      throw new Error('Cannot select primary source from empty article list');
    }
    if (articles.length === 1) {
      const single = articles[0];
      return {
        primaryArticle: single,
        scores: [this.computeScore(single, new Date(single.publishedAt).getTime())],
      };
    }

    // Find newest timestamp in group for relative freshness scoring
    const newestTime = Math.max(
      ...articles.map(a => new Date(a.publishedAt || 0).getTime())
    );

    const scores: SourceScoreBreakdown[] = articles.map(a => this.computeScore(a, newestTime));

    // Sort descending by total score
    scores.sort((a, b) => b.totalScore - a.totalScore);

    const winningId = scores[0].articleId;
    const primaryArticle = articles.find(a => a.id === winningId) || articles[0];

    return {
      primaryArticle,
      scores,
    };
  }

  private computeScore(article: Article, newestTime: number): SourceScoreBreakdown {
    // 1. Source priority from registry
    let editorialPriority = 50;
    if (article.sourceId) {
      const cfg = sourceRegistry.get(article.sourceId);
      if (cfg) {
        editorialPriority = cfg.reliabilityScore ? Math.round(cfg.reliabilityScore * 100) : 75;
      }
    }

    // 2. Completeness score (length of description + content)
    const textLength = ((article.content || '') + (article.description || '')).length;
    const completenessScore = Math.min(25, Math.floor(textLength / 60));

    // 3. Image availability bonus (useful for newspaper layout)
    let imageScore = 0;
    if (article.imageUrl && article.imageUsageStatus === 'source_provided') {
      imageScore = 20;
    }

    // 4. Freshness score (up to 10 points)
    const articleTime = new Date(article.publishedAt || 0).getTime();
    const hoursDiff = Math.max(0, (newestTime - articleTime) / (1000 * 60 * 60));
    const freshnessScore = Math.max(0, Math.round(10 - Math.min(10, hoursDiff / 4)));

    const totalScore = editorialPriority + completenessScore + imageScore + freshnessScore;

    return {
      articleId: article.id,
      source: article.source,
      editorialPriority,
      completenessScore,
      imageScore,
      freshnessScore,
      totalScore,
    };
  }
}

export const primarySourceSelector = new PrimarySourceSelector();
