import type { ImageMetadata, ImageUsageStatus } from './image';

export type ArticleCategory =
  | 'world'
  | 'national'
  | 'business'
  | 'technology'
  | 'finance'
  | 'economy'
  | 'forex'
  | 'crypto'
  | 'markets';

export type ArticleRegion =
  | 'global'
  | 'indonesia'
  | 'asia_pacific'
  | 'us'
  | 'europe';

export interface NewsSource {
  id: string;
  name: string;
  slug: string;
  baseUrl: string;
  feedUrl?: string;
  primaryCategory: ArticleCategory;
  region: ArticleRegion;
  isActive: boolean;
  reliabilityScore?: number;
  createdAt: string;
  updatedAt: string;
}

export type LinkStatus = 'VALID' | 'REDIRECTED' | 'PAYWALLED' | 'BLOCKED' | 'BROKEN' | 'UNKNOWN';

export interface Article {
  id: string;
  title: string;
  headline?: string;
  subheadline?: string;
  whatHappened?: string;
  details?: string;
  whyItMatters?: string;
  description: string;
  content?: string;
  url: string;
  originalUrl: string;
  resolvedUrl?: string;
  linkStatus?: LinkStatus;
  source: string;
  sourceId?: string;
  author: string | null;
  category: ArticleCategory;
  region: ArticleRegion;
  publishedAt: string;
  imageUrl: string | null;
  imageSource: string | null;
  imageCredit: string | null;
  imageWidth?: number;
  imageHeight?: number;
  imageMimeType?: string;
  imageAssetBuffer?: Buffer;
  imageAssetDataUri?: string;
  imageUsageStatus: ImageUsageStatus;
  imageMetadata?: ImageMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleEditorialSummary {
  articleId: string;
  conciseHeadline: string;
  summary: string;
  whyItMatters: string;
  keyEntities: string[];
  assignedSection: string;
  editorialPriority: number;
}
