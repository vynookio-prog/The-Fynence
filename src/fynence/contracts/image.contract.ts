import type { Article } from '../types/article';
import type {
  ImageFallbackType,
  ImageMetadata,
  ImageProcessingOptions,
  ProcessedArticleImage,
} from '../types/image';

export interface IImageProcessorService {
  /**
   * Validates accessibility, dimensions, and licensing status of an original publisher image.
   */
  validateSourceImage(imageUrl: string): Promise<{
    isValid: boolean;
    mimeType?: string;
    width?: number;
    height?: number;
    errorReason?: string;
  }>;

  /**
   * Transforms original publisher photography with vintage halftone and monochrome treatments.
   * STRICT: Rejects any image flagged as AI-generated.
   */
  processSourceImage(
    metadata: ImageMetadata,
    options: ImageProcessingOptions
  ): Promise<ProcessedArticleImage>;

  /**
   * Deterministically generates non-photographic editorial fallbacks (charts, typography, woodcut dividers)
   * whenever original photography is unavailable.
   */
  generateEditorialFallback(
    article: Article,
    fallbackType: ImageFallbackType
  ): ProcessedArticleImage;

  /**
   * Crops and scales verified original imagery to fit broadsheet newspaper column specifications.
   */
  cropToColumnSpan(
    imageBuffer: Uint8Array,
    columns: 1 | 2 | 3 | 4,
    aspectRatio?: '16:9' | '4:3' | '3:2' | '1:1'
  ): Promise<Uint8Array>;
}
