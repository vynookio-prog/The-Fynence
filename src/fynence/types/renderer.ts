import type { EditionFormat, EditionTheme } from './edition';
import type { StructuredNewspaperData } from './newspaper';

export interface RenderOptions {
  format?: EditionFormat;
  theme?: EditionTheme;
  viewportWidth?: number;
  viewportHeight?: number;
  deviceScaleFactor?: number;
  quality?: number; // 1-100 for webp/png
  pdfFormat?: 'A4' | 'Broadsheet' | 'Letter';
  includeTextureOverlay?: boolean;
}

export interface RenderResult {
  editionId: string;
  format: EditionFormat;
  mimeType: string;
  buffer: Uint8Array | Buffer;
  tempFilePath?: string;
  fileSizeBytes: number;
  dimensions: {
    width: number;
    height: number;
  };
  renderedAt: string;
  renderDurationMs: number;
}

export interface INewspaperRendererService {
  /**
   * Deterministically renders structured newspaper JSON into HTML with retro CSS.
   */
  renderToHtml(data: StructuredNewspaperData, options?: RenderOptions): Promise<string>;

  /**
   * Compiles HTML into the target raster or document binary (WebP or PDF).
   */
  renderEdition(data: StructuredNewspaperData, options?: RenderOptions): Promise<RenderResult>;

  /**
   * Validates structured data contract compliance before initiating render.
   */
  validateContract(data: StructuredNewspaperData): boolean;
}
