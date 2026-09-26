import sharp from 'sharp';
import type { Article } from '../../types/article';
import type {
  IImageProcessorService,
  ImageFallbackType,
  ImageMetadata,
  ImageProcessingOptions,
  ProcessedArticleImage,
} from '../types';
import { BROADSHEET_COLUMN_WIDTHS } from '../types';
import { ImageValidator } from '../validator/imageValidator';
import { EditorialFallbackSvgGenerator } from '../fallback/editorialFallbackSvg';

export class ImageProcessor implements IImageProcessorService {
  private validator: ImageValidator;
  private fallbackGenerator: EditorialFallbackSvgGenerator;

  constructor(validator = new ImageValidator(), fallbackGenerator = new EditorialFallbackSvgGenerator()) {
    this.validator = validator;
    this.fallbackGenerator = fallbackGenerator;
  }

  async validateSourceImage(imageUrl: string): Promise<{
    isValid: boolean;
    mimeType?: string;
    width?: number;
    height?: number;
    errorReason?: string;
  }> {
    return this.validator.validateSourceImageUrl(imageUrl);
  }

  async processSourceImage(
    metadata: ImageMetadata,
    options: ImageProcessingOptions
  ): Promise<ProcessedArticleImage> {
    // 1. Strict anti-AI guard
    this.validator.assertNotAiGenerated(metadata);

    // 2. Fetch image bytes with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    let imageBuffer: Buffer;
    try {
      const response = await fetch(metadata.imageUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'TheFynence-ImageProcessor/1.0',
        },
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Failed to download source image: HTTP ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } catch (err: any) {
      clearTimeout(timeout);
      throw new Error(`Image download failed: ${err.message}`);
    }

    // 3. Process image with Sharp
    let pipeline = sharp(imageBuffer);

    if (options.grayscale || options.halftoneEffect) {
      pipeline = pipeline.grayscale();
    }

    if (options.contrastAdjustment) {
      pipeline = pipeline.linear(1.0 + options.contrastAdjustment, -(options.contrastAdjustment * 25));
    }

    // Resize within bounds
    const width = options.maxWidth || 800;
    const height = options.maxHeight || 450;
    pipeline = pipeline.resize(width, height, {
      fit: 'cover',
      position: 'centre',
    });

    // WebP output for optimal fidelity and compression
    const processedBuffer = await pipeline.webp({ quality: 85 }).toBuffer();
    const base64Data = processedBuffer.toString('base64');
    const dataUri = `data:image/webp;base64,${base64Data}`;

    return {
      originalUrl: metadata.imageUrl,
      processedUrl: dataUri,
      credit: metadata.imageCredit || metadata.imageSource || 'Source Archive',
      source: metadata.imageSource || 'Publisher Wire',
      aspectRatio: options.aspectRatio || '16:9',
      hasHalftone: options.halftoneEffect,
      fallbackType: 'none',
    };
  }

  generateEditorialFallback(
    article: Article,
    fallbackType: ImageFallbackType
  ): ProcessedArticleImage {
    const svgContent = this.fallbackGenerator.generateFallbackSvg(article, fallbackType);
    const base64Svg = Buffer.from(svgContent, 'utf-8').toString('base64');
    const dataUri = `data:image/svg+xml;base64,${base64Svg}`;

    return {
      originalUrl: '',
      processedUrl: dataUri,
      credit: 'The Fynence Editorial Archives',
      source: 'Internal Bureau',
      aspectRatio: '16:9',
      hasHalftone: false,
      fallbackType,
    };
  }

  async cropToColumnSpan(
    imageBuffer: Uint8Array,
    columns: 1 | 2 | 3 | 4,
    aspectRatio: '16:9' | '4:3' | '3:2' | '1:1' = '16:9'
  ): Promise<Uint8Array> {
    const targetWidth = BROADSHEET_COLUMN_WIDTHS[columns];
    let targetHeight: number;

    switch (aspectRatio) {
      case '4:3':
        targetHeight = Math.round((targetWidth * 3) / 4);
        break;
      case '3:2':
        targetHeight = Math.round((targetWidth * 2) / 3);
        break;
      case '1:1':
        targetHeight = targetWidth;
        break;
      case '16:9':
      default:
        targetHeight = Math.round((targetWidth * 9) / 16);
        break;
    }

    const cropped = await sharp(imageBuffer)
      .resize(targetWidth, targetHeight, {
        fit: 'cover',
        position: 'centre',
      })
      .toBuffer();

    return new Uint8Array(cropped);
  }
}
