/**
 * Critical Image Policy:
 * Under no circumstances are AI-generated images permitted for news stories.
 * All images must originate directly from the verified news source or publisher.
 * When unavailable, layout must fall back to typography, charts, or text-only layouts.
 */

export type ImageUsageStatus =
  | 'source_provided'
  | 'source_unknown'
  | 'unavailable'
  | 'requires_review'
  | 'original_verified'
  | 'processed_halftone'
  | 'processed_grayscale'
  | 'fallback_typography'
  | 'fallback_chart'
  | 'fallback_none'
  | 'unusable_resolution'
  | 'restricted_license';

export interface ImageMetadata {
  id?: string;
  articleId?: string;
  imageUrl: string;
  imageSource: string;
  imageCredit: string;
  originalArticleUrl: string;
  usageStatus: ImageUsageStatus;
  fetchedAt: string;
  width?: number;
  height?: number;
  mimeType?: string;
  fileSizeBytes?: number;
  storagePath?: string;
  /**
   * Strict safety guard: must always be false for news photography.
   */
  readonly isAiGenerated: false;
}

export type ImageFallbackType =
  | 'none'
  | 'typography'
  | 'chart'
  | 'data_viz'
  | 'decorative_woodcut';

export interface ImageProcessingOptions {
  maxWidth: number;
  maxHeight: number;
  grayscale: boolean;
  halftoneEffect: boolean;
  contrastAdjustment?: number;
  aspectRatio?: '16:9' | '4:3' | '3:2' | '1:1';
}

export interface ProcessedArticleImage {
  originalUrl: string;
  processedUrl?: string;
  credit: string;
  source: string;
  aspectRatio: string;
  hasHalftone: boolean;
  fallbackType: ImageFallbackType;
}
