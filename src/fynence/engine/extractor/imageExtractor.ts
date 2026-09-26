import type { ImageMetadata, ImageUsageStatus } from '../../types/image';
import { validateExternalUrl } from '../fetcher/security';

export interface ImageExtractionOptions {
  articleUrl: string;
  sourceName: string;
  enclosureUrl?: string;
  mediaContentUrl?: string;
  ogImageUrl?: string;
  htmlContent?: string;
}

export interface ImageExtractionResult {
  hasImage: boolean;
  metadata: ImageMetadata | null;
  status: ImageUsageStatus;
  rejectionReason?: string;
}

export class NewsImageExtractor {
  /**
   * Extracts original publisher imagery from structured feed attributes.
   * STRICT ANTI-AI POLICY: Never synthesizes or replaces news images with AI.
   */
  public extractFromFeed(options: ImageExtractionOptions): ImageExtractionResult {
    const candidateUrl =
      options.mediaContentUrl ||
      options.enclosureUrl ||
      options.ogImageUrl ||
      this.extractFirstImageFromHtml(options.htmlContent);

    if (!candidateUrl) {
      return {
        hasImage: false,
        metadata: null,
        status: 'unavailable',
      };
    }

    const trimmedUrl = candidateUrl.trim();
    const security = validateExternalUrl(trimmedUrl);
    if (!security.isSafe || !security.normalizedUrl) {
      return {
        hasImage: false,
        metadata: null,
        status: 'unavailable',
        rejectionReason: `Unsafe or malformed image URL: ${security.reason}`,
      };
    }

    // Verify valid web image extension or query signature
    const isLikelyImage = this.isLikelyImageUrl(security.normalizedUrl);
    if (!isLikelyImage) {
      return {
        hasImage: false,
        metadata: null,
        status: 'requires_review',
        rejectionReason: 'URL does not appear to reference an image asset',
      };
    }

    const metadata: ImageMetadata = {
      imageUrl: security.normalizedUrl,
      imageSource: options.sourceName,
      imageCredit: `Photo courtesy of ${options.sourceName}`,
      originalArticleUrl: options.articleUrl,
      usageStatus: 'source_provided',
      fetchedAt: new Date().toISOString(),
      isAiGenerated: false, // Strict type constraint
    };

    return {
      hasImage: true,
      metadata,
      status: 'source_provided',
    };
  }

  private isLikelyImageUrl(url: string): boolean {
    const lower = url.toLowerCase();
    const extensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.bmp'];
    for (const ext of extensions) {
      if (lower.includes(ext)) return true;
    }
    // Content-delivery / image pipeline endpoints often have /images/, /img/, /photo/, images., media.
    if (
      lower.includes('images.') ||
      lower.includes('image.') ||
      lower.includes('photo.') ||
      lower.includes('/image') ||
      lower.includes('/photo') ||
      lower.includes('/img') ||
      lower.includes('format=jpg') ||
      lower.includes('format=webp') ||
      lower.includes('format=png')
    ) {
      return true;
    }
    return false;
  }

  private extractFirstImageFromHtml(html?: string): string | undefined {
    if (!html) return undefined;
    const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    return match && match[1] ? match[1] : undefined;
  }
}

export const newsImageExtractor = new NewsImageExtractor();
