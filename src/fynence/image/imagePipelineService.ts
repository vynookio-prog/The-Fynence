import sharp from 'sharp';
import crypto from 'crypto';
import type { NewspaperStoryImage } from '../renderer/types/document';

export interface ImageResolutionResult {
  imageUrl: string | null;
  imageSource: string | null;
  imageCredit: string | null;
  sourceType: 'media:content' | 'media:thumbnail' | 'enclosure' | 'rss:image' | 'og:image' | 'twitter:image' | 'none';
}

export interface ProcessedImageAsset {
  isValid: boolean;
  imageUrl: string;
  assetBuffer?: Buffer;
  assetDataUri?: string;
  width?: number;
  height?: number;
  mimeType?: string;
  fileSizeBytes?: number;
  errorReason?: string;
}

interface CachedImageEntry {
  asset: ProcessedImageAsset;
  expiresAt: number;
}

export class ImagePipelineService {
  private cache: Map<string, CachedImageEntry> = new Map();
  private readonly defaultTimeoutMs: number;
  private readonly cacheTtlMs: number;

  constructor(options?: { timeoutMs?: number; cacheTtlMs?: number }) {
    this.defaultTimeoutMs = options?.timeoutMs ?? 6000;
    this.cacheTtlMs = options?.cacheTtlMs ?? 2 * 60 * 60 * 1000; // 2 hours
  }

  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Section 2.1: Resolves original news images with strict priority order:
   * 1. RSS media:content
   * 2. RSS media:thumbnail
   * 3. RSS enclosure
   * 4. RSS image metadata
   * 5. Article page og:image
   * 6. Article page twitter:image
   * 7. No image (null)
   */
  public async resolveOriginalImage(options: {
    articleUrl?: string;
    sourceName?: string;
    mediaContentUrl?: string;
    mediaThumbnailUrl?: string;
    enclosureUrl?: string;
    rssImageUrl?: string;
    articleHtml?: string;
    fetchArticlePage?: boolean;
  }): Promise<ImageResolutionResult> {
    const sourceName = options.sourceName || 'Publisher Wire';

    // 1. RSS media:content
    if (this.isValidHttpUrl(options.mediaContentUrl)) {
      return {
        imageUrl: options.mediaContentUrl!.trim(),
        imageSource: sourceName,
        imageCredit: `Photo via ${sourceName}`,
        sourceType: 'media:content',
      };
    }

    // 2. RSS media:thumbnail
    if (this.isValidHttpUrl(options.mediaThumbnailUrl)) {
      return {
        imageUrl: options.mediaThumbnailUrl!.trim(),
        imageSource: sourceName,
        imageCredit: `Photo via ${sourceName}`,
        sourceType: 'media:thumbnail',
      };
    }

    // 3. RSS enclosure
    if (this.isValidHttpUrl(options.enclosureUrl)) {
      return {
        imageUrl: options.enclosureUrl!.trim(),
        imageSource: sourceName,
        imageCredit: `Photo via ${sourceName}`,
        sourceType: 'enclosure',
      };
    }

    // 4. RSS image metadata
    if (this.isValidHttpUrl(options.rssImageUrl)) {
      return {
        imageUrl: options.rssImageUrl!.trim(),
        imageSource: sourceName,
        imageCredit: `Photo via ${sourceName}`,
        sourceType: 'rss:image',
      };
    }

    // 5 & 6. Article page og:image or twitter:image from supplied HTML
    if (options.articleHtml) {
      const fromHtml = this.extractMetaImagesFromHtml(options.articleHtml);
      if (fromHtml) {
        return {
          imageUrl: fromHtml.url,
          imageSource: sourceName,
          imageCredit: `Photo via ${sourceName}`,
          sourceType: fromHtml.type,
        };
      }
    }

    // Optional: Fetch article page if allowed and articleUrl is valid
    if (options.fetchArticlePage && this.isValidHttpUrl(options.articleUrl)) {
      try {
        const fetchedHtml = await this.fetchHtmlSnippet(options.articleUrl!);
        const fromHtml = this.extractMetaImagesFromHtml(fetchedHtml);
        if (fromHtml) {
          return {
            imageUrl: fromHtml.url,
            imageSource: sourceName,
            imageCredit: `Photo via ${sourceName}`,
            sourceType: fromHtml.type,
          };
        }
      } catch {
        // Non-fatal: continue to fallback
      }
    }

    // 7. No image available
    return {
      imageUrl: null,
      imageSource: null,
      imageCredit: null,
      sourceType: 'none',
    };
  }

  /**
   * Section 2.3 & 2.4: Downloads, validates, and prepares image asset for rendering.
   * Rejects 1x1 pixels, HTML responses, corrupted files, and unsupported formats.
   */
  public async downloadAndPrepareImage(
    imageUrl: string | null | undefined,
    options?: { maxWidth?: number; maxHeight?: number }
  ): Promise<ProcessedImageAsset> {
    if (!imageUrl || !this.isValidHttpUrl(imageUrl)) {
      return {
        isValid: false,
        imageUrl: imageUrl || '',
        errorReason: 'No valid image URL provided',
      };
    }

    const trimmedUrl = imageUrl.trim();

    // Check deterministic cache
    const cacheKey = this.getCacheKey(trimmedUrl);
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.asset;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.defaultTimeoutMs);

    try {
      const response = await fetch(trimmedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) TheFynence-Bot/1.0',
          Accept: 'image/webp,image/avif,image/jpeg,image/png,*/*;q=0.8',
        },
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const failure: ProcessedImageAsset = {
          isValid: false,
          imageUrl: trimmedUrl,
          errorReason: `HTTP download failed with status ${response.status}`,
        };
        this.cacheFailure(cacheKey, failure);
        return failure;
      }

      // Validate Content-Type
      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      if (!contentType.startsWith('image/')) {
        const failure: ProcessedImageAsset = {
          isValid: false,
          imageUrl: trimmedUrl,
          errorReason: `Rejected non-image Content-Type: ${contentType}`,
        };
        this.cacheFailure(cacheKey, failure);
        return failure;
      }

      const arrayBuf = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);

      // Section 2.4: Reject tracking pixels (files < 3KB) or oversized (> 10MB)
      if (buffer.length < 3072) {
        const failure: ProcessedImageAsset = {
          isValid: false,
          imageUrl: trimmedUrl,
          fileSizeBytes: buffer.length,
          errorReason: `Rejected image too small (${buffer.length} bytes), likely a 1x1 tracking pixel`,
        };
        this.cacheFailure(cacheKey, failure);
        return failure;
      }

      if (buffer.length > 10 * 1024 * 1024) {
        const failure: ProcessedImageAsset = {
          isValid: false,
          imageUrl: trimmedUrl,
          fileSizeBytes: buffer.length,
          errorReason: `Rejected oversized image (${Math.round(buffer.length / 1024)} KB, max 10MB)`,
        };
        this.cacheFailure(cacheKey, failure);
        return failure;
      }

      // Section 2.4: Sharp decodability and dimension check
      let sharpPipeline = sharp(buffer);
      const meta = await sharpPipeline.metadata();

      if (!meta.width || !meta.height) {
        const failure: ProcessedImageAsset = {
          isValid: false,
          imageUrl: trimmedUrl,
          errorReason: 'Unable to decode image metadata',
        };
        this.cacheFailure(cacheKey, failure);
        return failure;
      }

      // Minimum broadsheet image dimensions
      if (meta.width < 180 || meta.height < 90) {
        const failure: ProcessedImageAsset = {
          isValid: false,
          imageUrl: trimmedUrl,
          width: meta.width,
          height: meta.height,
          errorReason: `Image dimensions (${meta.width}x${meta.height}) too small for broadsheet layout`,
        };
        this.cacheFailure(cacheKey, failure);
        return failure;
      }

      // Optimize and resize for broadsheet
      const targetWidth = options?.maxWidth || 800;
      const targetHeight = options?.maxHeight || 450;
      const optimizedBuffer = await sharp(buffer)
        .resize(targetWidth, targetHeight, {
          fit: 'cover',
          position: 'centre',
        })
        .webp({ quality: 85 })
        .toBuffer();

      const base64Data = optimizedBuffer.toString('base64');
      const assetDataUri = `data:image/webp;base64,${base64Data}`;

      const asset: ProcessedImageAsset = {
        isValid: true,
        imageUrl: trimmedUrl,
        assetBuffer: optimizedBuffer,
        assetDataUri,
        width: targetWidth,
        height: targetHeight,
        mimeType: 'image/webp',
        fileSizeBytes: optimizedBuffer.length,
      };

      this.cache.set(cacheKey, {
        asset,
        expiresAt: Date.now() + this.cacheTtlMs,
      });

      return asset;
    } catch (err: any) {
      clearTimeout(timer);
      const failure: ProcessedImageAsset = {
        isValid: false,
        imageUrl: trimmedUrl,
        errorReason: `Image processing error: ${err?.message || 'Unknown error'}`,
      };
      this.cacheFailure(cacheKey, failure);
      return failure;
    }
  }

  /**
   * Prepares and attaches verified image assets to all stories in a document.
   * If an image is missing or invalid, story falls back cleanly to text-first layout.
   */
  public async attachStoryImages(stories: Array<{ image?: NewspaperStoryImage }>): Promise<void> {
    for (const story of stories) {
      if (!story.image || !story.image.url) continue;

      const prepared = await this.downloadAndPrepareImage(story.image.url);
      if (prepared.isValid && prepared.assetDataUri) {
        story.image.assetDataUri = prepared.assetDataUri;
        story.image.assetBuffer = prepared.assetBuffer;
        story.image.width = prepared.width;
        story.image.height = prepared.height;
        story.image.mimeType = prepared.mimeType;
      } else {
        // Fall back cleanly to text-only layout: do NOT display broken or fake placeholder
        story.image = undefined;
      }
    }
  }

  private extractMetaImagesFromHtml(html: string): { url: string; type: 'og:image' | 'twitter:image' } | null {
    // 5. og:image
    const ogMatch = html.match(/<meta\s+[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    if (ogMatch && this.isValidHttpUrl(ogMatch[1])) {
      return { url: ogMatch[1].trim(), type: 'og:image' };
    }

    // 6. twitter:image
    const twMatch = html.match(/<meta\s+[^>]*name=["']twitter:image(?::src)?["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image(?::src)?["']/i);
    if (twMatch && this.isValidHttpUrl(twMatch[1])) {
      return { url: twMatch[1].trim(), type: 'twitter:image' };
    }

    return null;
  }

  private async fetchHtmlSnippet(url: string): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) TheFynence-Bot/1.0',
          Accept: 'text/html',
        },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) return '';
      // Read first 30KB of head/HTML to find meta tags quickly
      const text = await res.text();
      return text.slice(0, 32768);
    } catch {
      clearTimeout(timer);
      return '';
    }
  }

  private isValidHttpUrl(url?: string | null): boolean {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    return trimmed.startsWith('http://') || trimmed.startsWith('https://');
  }

  private getCacheKey(url: string): string {
    return crypto.createHash('sha256').update(url).digest('hex');
  }

  private cacheFailure(cacheKey: string, asset: ProcessedImageAsset): void {
    // Cache failures briefly (5 minutes) to avoid thrashing dead URLs
    this.cache.set(cacheKey, {
      asset,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });
  }
}

export const imagePipelineService = new ImagePipelineService();
