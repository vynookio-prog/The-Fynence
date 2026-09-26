import type { NewspaperDocument } from '../renderer/types/document';

export type PdfPageFormat = 'newspaper' | 'a4' | 'a3' | 'letter' | 'custom';

export interface PdfDimensions {
  width: number;
  height: number;
}

export interface PdfMetadataOptions {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
  producer?: string;
}

export interface PdfRenderOptions {
  format?: PdfPageFormat;
  dimensions?: PdfDimensions;
  rasterDpi?: number;
  quality?: number;
  includeTextureOverlay?: boolean;
  theme?: string;
  addClickableLinks?: boolean;
  generateTempFile?: boolean;
  tempDir?: string;
  customFilename?: string;
  metadata?: PdfMetadataOptions;
}

export interface PdfRenderSuccessResult {
  success: true;
  fileName: string;
  filePath?: string;
  buffer: Buffer;
  mimeType: 'application/pdf';
  pageCount: number;
  fileSizeBytes: number;
  width: number;
  height: number;
  generatedAt: string;
  metadata: {
    title: string;
    author: string;
    subject: string;
    keywords: string[];
    creationDate: string;
  };
}

export interface PdfRenderErrorResult {
  success: false;
  fileName?: string;
  error: {
    code:
      | 'INVALID_DOCUMENT'
      | 'EMPTY_PAGES'
      | 'RENDER_FAILED'
      | 'FILESYSTEM_ERROR'
      | 'VALIDATION_FAILED';
    message: string;
    details?: unknown;
  };
}

export type PdfRenderResult = PdfRenderSuccessResult | PdfRenderErrorResult;

export interface IPdfRenderer {
  render(doc: NewspaperDocument, options?: PdfRenderOptions): Promise<PdfRenderResult>;
  renderToFile(doc: NewspaperDocument, options?: PdfRenderOptions): Promise<PdfRenderResult>;
  cleanupArtifact(filePath: string): Promise<boolean>;
}
