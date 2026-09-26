import { validateExternalUrl } from '../../engine/fetcher/security';

export interface ImageValidationResult {
  isValid: boolean;
  mimeType?: string;
  width?: number;
  height?: number;
  fileSizeBytes?: number;
  errorReason?: string;
}

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg',
]);

const MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
const MIN_DIMENSION_PX = 150;

export class ImageValidator {
  /**
   * Strictly asserts that an image is NOT AI-generated.
   * Throws an error or returns false if AI generation flags are detected.
   */
  assertNotAiGenerated(metadata: { isAiGenerated?: boolean; prompt?: string }): void {
    if (metadata.isAiGenerated === true) {
      throw new Error('STRICT POLICY VIOLATION: AI-generated images are prohibited for news stories.');
    }
  }

  /**
   * Validates accessibility, security, and headers of a source image URL.
   */
  async validateSourceImageUrl(imageUrl: string): Promise<ImageValidationResult> {
    if (!imageUrl || typeof imageUrl !== 'string') {
      return { isValid: false, errorReason: 'Missing or invalid image URL string.' };
    }

    const secCheck = validateExternalUrl(imageUrl);
    if (!secCheck.isSafe) {
      return { isValid: false, errorReason: secCheck.reason || 'Image URL violates SSRF safety constraints (private/local IP or invalid protocol).' };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
      // First attempt a HEAD request to check headers without downloading payload
      const headResponse = await fetch(imageUrl, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'TheFynence-ImageValidator/1.0 (+https://thefynence.com/bot)',
        },
      });

      clearTimeout(timeout);

      if (!headResponse.ok) {
        return { isValid: false, errorReason: `HTTP error response: ${headResponse.status}` };
      }

      const contentType = (headResponse.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
      if (!ALLOWED_MIME_TYPES.has(contentType)) {
        return { isValid: false, errorReason: `Unsupported MIME type: ${contentType}` };
      }

      const contentLengthHeader = headResponse.headers.get('content-length');
      const fileSizeBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : undefined;
      if (fileSizeBytes && fileSizeBytes > MAX_IMAGE_SIZE_BYTES) {
        return { isValid: false, errorReason: `Image exceeds max size: ${fileSizeBytes} bytes.` };
      }

      return {
        isValid: true,
        mimeType: contentType,
        fileSizeBytes,
      };
    } catch (err: any) {
      clearTimeout(timeout);
      return {
        isValid: false,
        errorReason: err.name === 'AbortError' ? 'Validation request timed out.' : (err.message || 'Network fetch failure.'),
      };
    }
  }

  /**
   * Validates image dimensions against minimum newspaper resolution thresholds.
   */
  validateDimensions(width: number, height: number): { isValid: boolean; errorReason?: string } {
    if (width < MIN_DIMENSION_PX || height < MIN_DIMENSION_PX) {
      return {
        isValid: false,
        errorReason: `Image dimensions (${width}x${height}) below minimum broadsheet threshold (${MIN_DIMENSION_PX}px).`,
      };
    }
    return { isValid: true };
  }
}
