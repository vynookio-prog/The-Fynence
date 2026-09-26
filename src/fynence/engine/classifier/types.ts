import type { ArticleCategory, ArticleRegion } from '../../types/article';

export type ImportanceLevel = 'low' | 'medium' | 'high';

export interface ClassificationResult {
  primaryCategory: ArticleCategory;
  allCategories: ArticleCategory[];
  region: ArticleRegion;
  importance: ImportanceLevel;
  confidence: number; // 0.0 to 1.0
  matchedKeywords: string[];
}
