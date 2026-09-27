import type { Article, ArticleCategory } from '../../types/article';
import { sourceRegistry } from '../registry/sourceRegistry';
import { tokenizeTitle, calculateJaccardSimilarity } from '../deduplicator/titleNormalizer';
import { getNewsEngineConfig, EDITION_TARGET_PRESETS } from '../config/newsEngineConfig';

export interface CorroboratingSource {
  articleId: string;
  source: string;
  url: string;
  title: string;
  publishedAt: string;
}

export interface CandidateScoreBreakdown {
  freshness: number;
  sourcePriority: number;
  categoryRelevance: number;
  completeness: number;
  sourceDiversity: number;
  total: number;
}

export interface RankedArticleCandidate {
  article: Article;
  score: number;
  breakdown: CandidateScoreBreakdown;
  clusterTopic?: string;
  corroboratingSources: CorroboratingSource[];
}

export interface CandidatePoolOptions {
  editionType?: string;
  sections?: string[];
  targetPoolSize?: number;
  minPoolSize?: number;
  maxPoolSize?: number;
  freshnessHours?: number;
  maxArticlesPerSource?: number;
}

export interface CandidatePoolResult {
  editionType: string;
  totalEvaluated: number;
  freshnessFiltered: number;
  categoryFiltered: number;
  sourceCapped: number;
  storyClustersFormed: number;
  candidates: RankedArticleCandidate[];
  categoryBreakdown: Record<string, number>;
  sourceBreakdown: Record<string, number>;
}

export class NewsRanker {
  /**
   * Resolves the allowed categories for a specific edition type.
   */
  public resolveEditionCategories(editionType?: string, customSections?: string[]): ArticleCategory[] {
    if (customSections && customSections.length > 0) {
      const mapped: ArticleCategory[] = [];
      const valid: ArticleCategory[] = [
        'world', 'national', 'business', 'technology', 'finance', 'economy', 'forex', 'crypto', 'markets'
      ];
      for (const s of customSections) {
        const lower = s.toLowerCase();
        if (valid.includes(lower as ArticleCategory)) {
          mapped.push(lower as ArticleCategory);
        } else if (lower === 'market' || lower === 'stocks') {
          mapped.push('markets');
        } else if (lower === 'daily_news') {
          return valid;
        }
      }
      if (mapped.length > 0) return mapped;
    }

    switch (editionType) {
      case 'finance_economy':
        return ['finance', 'economy', 'business', 'markets'];
      case 'market':
        return ['markets', 'forex', 'crypto', 'finance', 'economy'];
      case 'daily':
      default:
        return [
          'world',
          'national',
          'business',
          'technology',
          'finance',
          'economy',
          'markets',
          'forex',
          'crypto',
        ];
    }
  }

  /**
   * Evaluates freshness based on publishedAt timestamp.
   */
  public isFresh(publishedAtStr: string | undefined, maxHours: number, nowMs: number = Date.now()): boolean {
    if (!publishedAtStr) return true; // If missing timestamp, do not drop
    const time = new Date(publishedAtStr).getTime();
    if (isNaN(time)) return true;
    const diffHours = (nowMs - time) / (1000 * 60 * 60);
    // Allow small negative diffs (clock skew up to 2 hours) and anything within maxHours
    return diffHours >= -2 && diffHours <= maxHours;
  }

  /**
   * Computes deterministic ranking score (0-100) for an article.
   */
  public computeCandidateScore(
    article: Article,
    sourceOccurrence: number,
    nowMs: number = Date.now()
  ): { score: number; breakdown: CandidateScoreBreakdown } {
    // 1. Freshness Score (up to 25 pts)
    let freshness = 15;
    if (article.publishedAt) {
      const pubMs = new Date(article.publishedAt).getTime();
      if (!isNaN(pubMs)) {
        const ageHours = Math.max(0, (nowMs - pubMs) / (1000 * 60 * 60));
        if (ageHours <= 6) freshness = 25;
        else if (ageHours <= 12) freshness = 22;
        else if (ageHours <= 24) freshness = 18;
        else if (ageHours <= 36) freshness = 14;
        else freshness = 8;
      }
    }

    // 2. Source Priority (up to 30 pts)
    let sourcePriority = 22;
    if (article.sourceId) {
      const cfg = sourceRegistry.get(article.sourceId);
      if (cfg && cfg.priority) {
        sourcePriority = Math.round((cfg.priority / 100) * 30);
      }
    } else {
      // Priority based on source name recognition
      const lowerSrc = (article.source || '').toLowerCase();
      if (lowerSrc.includes('bloomberg') || lowerSrc.includes('reuters') || lowerSrc.includes('ft') || lowerSrc.includes('bbc')) {
        sourcePriority = 28;
      } else if (lowerSrc.includes('cnbc') || lowerSrc.includes('marketwatch') || lowerSrc.includes('antara')) {
        sourcePriority = 26;
      } else if (lowerSrc.includes('coindesk') || lowerSrc.includes('arstechnica')) {
        sourcePriority = 25;
      }
    }

    // 3. Category Relevance (up to 20 pts)
    let categoryRelevance = 15;
    const highRelevanceCategories: ArticleCategory[] = ['finance', 'economy', 'markets', 'national'];
    if (highRelevanceCategories.includes(article.category)) {
      categoryRelevance = 20;
    }

    // 4. Content Completeness & Media (up to 15 pts)
    const textLen = (article.title || '').length + (article.description || '').length + (article.content || '').length;
    let completeness = Math.min(10, Math.floor(textLen / 80));
    if (article.imageUrl && article.imageUsageStatus !== 'unavailable') {
      completeness = Math.min(15, completeness + 5); // Image availability bonus
    }

    // 5. Source Diversity Bonus (up to 10 pts)
    // First article from a source gets full points; subsequent articles are slightly demoted
    let sourceDiversity = 10;
    if (sourceOccurrence === 1) sourceDiversity = 8;
    else if (sourceOccurrence === 2) sourceDiversity = 5;
    else if (sourceOccurrence >= 3) sourceDiversity = 2;

    const total = freshness + sourcePriority + categoryRelevance + completeness + sourceDiversity;

    return {
      score: total,
      breakdown: {
        freshness,
        sourcePriority,
        categoryRelevance,
        completeness,
        sourceDiversity,
        total,
      },
    };
  }

  /**
   * Clusters similar stories covering the same event using token overlap.
   */
  public clusterSimilarStories(articles: Article[], threshold: number = 0.45): {
    primaryArticles: Article[];
    clusters: Map<string, CorroboratingSource[]>;
  } {
    const tokenized = articles.map(a => ({
      article: a,
      tokens: tokenizeTitle(a.title),
      time: new Date(a.publishedAt || 0).getTime(),
    }));

    const visited = new Set<string>();
    const primaryArticles: Article[] = [];
    const clusters = new Map<string, CorroboratingSource[]>();

    for (let i = 0; i < tokenized.length; i++) {
      const current = tokenized[i];
      if (visited.has(current.article.id)) continue;

      visited.add(current.article.id);
      primaryArticles.push(current.article);
      const corroborating: CorroboratingSource[] = [];

      for (let j = i + 1; j < tokenized.length; j++) {
        const candidate = tokenized[j];
        if (visited.has(candidate.article.id)) continue;

        // Temporal window (within 36h)
        const timeDiffHours = Math.abs(current.time - candidate.time) / (1000 * 60 * 60);
        if (timeDiffHours > 36) continue;

        // Token overlap
        const similarity = calculateJaccardSimilarity(current.tokens, candidate.tokens);
        if (similarity >= threshold) {
          visited.add(candidate.article.id);
          corroborating.push({
            articleId: candidate.article.id,
            source: candidate.article.source,
            url: candidate.article.url,
            title: candidate.article.title,
            publishedAt: candidate.article.publishedAt,
          });
        }
      }

      clusters.set(current.article.id, corroborating);
    }

    return { primaryArticles, clusters };
  }

  /**
   * Constructs the editorial candidate pool from raw or stored articles.
   */
  public buildCandidatePool(
    articles: Article[],
    options: CandidatePoolOptions = {}
  ): CandidatePoolResult {
    const config = getNewsEngineConfig();
    const nowMs = Date.now();

    const editionType = options.editionType || 'daily';
    const freshnessHours = options.freshnessHours ?? config.freshnessHours;
    const maxPerSource = options.maxArticlesPerSource ?? config.maxArticlesPerSource;
    const preset = EDITION_TARGET_PRESETS[editionType] || EDITION_TARGET_PRESETS.daily;
    const targetPoolSize = options.targetPoolSize ?? Math.round((preset.minCandidates + preset.maxCandidates) / 2);
    const minPoolSize = options.minPoolSize ?? preset.minCandidates;
    const maxPoolSize = options.maxPoolSize ?? preset.maxCandidates;

    const allowedCategories = this.resolveEditionCategories(editionType, options.sections);

    let freshnessFiltered = 0;
    let categoryFiltered = 0;
    let sourceCapped = 0;

    // 1. Freshness Filter
    const freshArticles: Article[] = [];
    for (const art of articles) {
      if (this.isFresh(art.publishedAt, freshnessHours, nowMs)) {
        freshArticles.push(art);
      } else {
        freshnessFiltered++;
      }
    }

    // 2. Category Filter
    const categorizedArticles: Article[] = [];
    for (const art of freshArticles) {
      if (allowedCategories.includes(art.category)) {
        categorizedArticles.push(art);
      } else {
        categoryFiltered++;
      }
    }

    // 3. Cluster similar stories to ensure topic diversity
    const { primaryArticles, clusters } = this.clusterSimilarStories(categorizedArticles);
    const storyClustersFormed = categorizedArticles.length - primaryArticles.length;

    // 4. Source Diversity Capping & Scoring
    const sourceCountMap = new Map<string, number>();
    const scoredCandidates: RankedArticleCandidate[] = [];
    const overflowArticles: Article[] = [];

    for (const art of primaryArticles) {
      const srcKey = (art.source || 'unknown').toLowerCase();
      const currentCount = sourceCountMap.get(srcKey) || 0;

      if (currentCount >= maxPerSource) {
        sourceCapped++;
        overflowArticles.push(art);
        continue;
      }

      const { score, breakdown } = this.computeCandidateScore(art, currentCount, nowMs);
      sourceCountMap.set(srcKey, currentCount + 1);

      const corroborating = clusters.get(art.id) || [];
      scoredCandidates.push({
        article: art,
        score,
        breakdown,
        clusterTopic: corroborating.length > 0 ? art.title : undefined,
        corroboratingSources: corroborating,
      });
    }

    // Section 9 Safety: Do not make source capping so strict that the edition becomes empty.
    // If strict capping resulted in 0 candidates and overflow articles exist, allow them.
    if (scoredCandidates.length === 0 && overflowArticles.length > 0) {
      for (const art of overflowArticles) {
        if (scoredCandidates.length >= maxPoolSize) break;
        const srcKey = (art.source || 'unknown').toLowerCase();
        const currentCount = sourceCountMap.get(srcKey) || 0;
        const { score, breakdown } = this.computeCandidateScore(art, currentCount, nowMs);
        sourceCountMap.set(srcKey, currentCount + 1);
        const corroborating = clusters.get(art.id) || [];
        scoredCandidates.push({
          article: art,
          score: Math.max(1, score - 5), // Slight penalty for exceeding source cap
          breakdown,
          clusterTopic: corroborating.length > 0 ? art.title : undefined,
          corroboratingSources: corroborating,
        });
      }
      sourceCapped = Math.max(0, overflowArticles.length - scoredCandidates.length);
    }

    // 5. Rank by deterministic total score descending
    scoredCandidates.sort((a, b) => b.score - a.score);

    // 6. Select Candidates within pool target limits [minPoolSize, maxPoolSize]
    const selectedCandidates = scoredCandidates.slice(0, maxPoolSize);

    // Diagnostics stats
    const categoryBreakdown: Record<string, number> = {};
    const sourceBreakdown: Record<string, number> = {};

    for (const c of selectedCandidates) {
      categoryBreakdown[c.article.category] = (categoryBreakdown[c.article.category] || 0) + 1;
      sourceBreakdown[c.article.source] = (sourceBreakdown[c.article.source] || 0) + 1;
    }

    return {
      editionType,
      totalEvaluated: articles.length,
      freshnessFiltered,
      categoryFiltered,
      sourceCapped,
      storyClustersFormed,
      candidates: selectedCandidates,
      categoryBreakdown,
      sourceBreakdown,
    };
  }
}

export const newsRanker = new NewsRanker();
