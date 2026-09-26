import type { Article, ArticleCategory, ArticleRegion } from '../../types/article';
import type { ClassificationResult, ImportanceLevel } from './types';
import {
  CATEGORY_KEYWORDS,
  HIGH_IMPORTANCE_KEYWORDS,
  MEDIUM_IMPORTANCE_KEYWORDS,
  REGION_KEYWORDS,
} from './keywords';

export class NewsClassifier {
  /**
   * Deterministically classifies an article into categories, geographic region, and editorial importance.
   * No expensive AI calls required for standard categorizations.
   */
  public classify(
    article: Pick<Article, 'title' | 'description' | 'content'>,
    defaultCategory: ArticleCategory = 'markets',
    defaultRegion: ArticleRegion = 'global'
  ): ClassificationResult {
    const titleText = (article.title || '').toLowerCase();
    const bodyText = `${article.description || ''} ${article.content || ''}`.toLowerCase();

    // 1. Category Scoring
    const categoryScores: Record<ArticleCategory, number> = {
      economy: 0,
      markets: 0,
      finance: 0,
      forex: 0,
      crypto: 0,
      technology: 0,
      business: 0,
      national: 0,
      world: 0,
    };

    const matchedKeywords: string[] = [];

    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [ArticleCategory, string[]][]) {
      for (const kw of keywords) {
        // Word boundary matching or phrase containment
        if (titleText.includes(kw)) {
          categoryScores[cat] += 3; // Title match has higher weight
          matchedKeywords.push(kw);
        } else if (bodyText.includes(kw)) {
          categoryScores[cat] += 1;
          matchedKeywords.push(kw);
        }
      }
    }

    // Default category gets a baseline score
    categoryScores[defaultCategory] += 2;

    // Sort categories by score descending
    const sortedCategories = (Object.keys(categoryScores) as ArticleCategory[])
      .filter(cat => categoryScores[cat] > 0)
      .sort((a, b) => categoryScores[b] - categoryScores[a]);

    const primaryCategory = sortedCategories[0] || defaultCategory;
    const topScore = categoryScores[primaryCategory];
    const confidence = Math.min(1.0, Math.max(0.4, topScore / 10));

    // 2. Region Scoring
    const regionScores: Record<ArticleRegion, number> = {
      indonesia: 0,
      asia_pacific: 0,
      us: 0,
      europe: 0,
      global: 0,
    };

    for (const [reg, keywords] of Object.entries(REGION_KEYWORDS) as [ArticleRegion, string[]][]) {
      for (const kw of keywords) {
        if (titleText.includes(kw)) {
          regionScores[reg] += 3;
        } else if (bodyText.includes(kw)) {
          regionScores[reg] += 1;
        }
      }
    }

    regionScores[defaultRegion] += 1;

    const sortedRegions = (Object.keys(regionScores) as ArticleRegion[])
      .sort((a, b) => regionScores[b] - regionScores[a]);
    const detectedRegion = sortedRegions[0] || defaultRegion;

    // 3. Importance Assessment
    let importance: ImportanceLevel = 'low';

    for (const kw of HIGH_IMPORTANCE_KEYWORDS) {
      if (titleText.includes(kw)) {
        importance = 'high';
        break;
      }
    }

    if (importance === 'low') {
      for (const kw of MEDIUM_IMPORTANCE_KEYWORDS) {
        if (titleText.includes(kw) || bodyText.includes(kw)) {
          importance = 'medium';
          break;
        }
      }
    }

    return {
      primaryCategory,
      allCategories: sortedCategories.length > 0 ? sortedCategories : [defaultCategory],
      region: detectedRegion,
      importance,
      confidence,
      matchedKeywords: Array.from(new Set(matchedKeywords)),
    };
  }
}

export const newsClassifier = new NewsClassifier();
