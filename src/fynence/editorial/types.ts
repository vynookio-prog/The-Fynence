import type { ArticleCategory, ArticleRegion } from '../types/article';
import type { NewspaperSectionType } from '../types/edition';
import type { ImageUsageStatus } from '../types/image';

export type EditorialImportance = 'low' | 'medium' | 'high';

export type EntityType =
  | 'organization'
  | 'person'
  | 'country'
  | 'location'
  | 'financial_instrument'
  | 'currency'
  | 'economic_indicator';

export interface EditorialEntity {
  type: EntityType;
  name: string;
}

export interface EditorialMetric {
  name: string;
  value: string;
  context: string;
  sourceType: 'SOURCE_REPORTED_DATA';
}

export interface EditorialSourceArticle {
  articleId: string;
  source: string;
  url: string;
  publishedAt: string;
}

export interface EditorialImage {
  url: string;
  source: string;
  credit: string;
  usageStatus: ImageUsageStatus;
  isAiGenerated: false;
}

export interface EditorialStory {
  id: string;
  clusterId: string | null;
  primaryArticleId: string;
  headline: string;
  summary: string;
  whyItMatters: string;
  primarySection: NewspaperSectionType;
  secondarySections: NewspaperSectionType[];
  importance: EditorialImportance;
  sourceArticles: EditorialSourceArticle[];
  image: EditorialImage | null;
  entities: EditorialEntity[];
  metrics: EditorialMetric[];
  contentHash: string;
  model: string;
  promptVersion: string;
  generatedAt: string;
  createdAt: string;
}

export interface StoryCluster {
  id: string;
  topic: string;
  primaryArticleId: string;
  articleIds: string[];
  firstReportedAt: string;
  significance: EditorialImportance;
  createdAt: string;
  updatedAt: string;
}

export interface EditorialRun {
  id: string;
  startedAt: string;
  completedAt?: string;
  articlesProcessed: number;
  storiesCreated: number;
  failed: number;
  model: string;
  promptVersion: string;
  status: 'in_progress' | 'completed' | 'failed';
  errorMessage?: string;
}

export interface StructuredAiAnalysis {
  headline: string;
  summary: string;
  whyItMatters: string;
  primarySection: NewspaperSectionType;
  secondarySections: NewspaperSectionType[];
  importance: EditorialImportance;
  entities: EditorialEntity[];
  metrics: Array<{
    name: string;
    value: string;
    context: string;
  }>;
}
