import sharp from 'sharp';
import type {
  NewspaperDocument,
  NewspaperPage,
} from '../types/document';
import type {
  RenderOptions,
  RenderResult,
} from '../types';
import type { StructuredNewspaperData } from '../../types/newspaper';
import { generateNewspaperHtml } from '../templates/htmlPreviewTemplate';
import { generatePageSvg } from '../templates/svgPageCanvas';
import { generateRetroHtml } from '../templates/retroHtmlTemplate';
import { generateRetroSvg } from '../templates/retroSvgCanvas';

export interface RenderedPageImage {
  pageNumber: number;
  buffer: Buffer;
  mimeType: string;
  width: number;
  height: number;
  fileSizeBytes: number;
}

export interface RenderedEdition {
  editionId: string;
  format: 'webp' | 'png';
  pages: RenderedPageImage[];
  htmlPreview: string;
  renderedAt: string;
  renderDurationMs: number;
}

export class NewspaperRenderer {
  /**
   * Validates a NewspaperDocument for structure and integrity.
   */
  public validateDocument(doc: NewspaperDocument): boolean {
    if (!doc || typeof doc !== 'object') return false;
    if (!doc.edition || !doc.edition.id || !doc.edition.title) return false;
    if (!Array.isArray(doc.pages) || doc.pages.length === 0) return false;
    for (const page of doc.pages) {
      if (typeof page.pageNumber !== 'number' || !Array.isArray(page.blocks)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Generates clean, responsive HTML for browser preview or Web display.
   */
  public async renderToHtml(
    docOrData: NewspaperDocument | StructuredNewspaperData,
    options: RenderOptions = {}
  ): Promise<string> {
    // If NewspaperDocument
    if ('pages' in docOrData && Array.isArray((docOrData as NewspaperDocument).pages)) {
      if (!this.validateDocument(docOrData as NewspaperDocument)) {
        throw new Error('Invalid NewspaperDocument: Document structure validation failed.');
      }
      return generateNewspaperHtml(docOrData as NewspaperDocument, options);
    }

    // Backwards-compatible legacy StructuredNewspaperData
    return generateRetroHtml(docOrData as StructuredNewspaperData, options);
  }

  /**
   * Renders all pages of a NewspaperDocument into image buffers (WebP or PNG).
   */
  public async renderToImages(
    doc: NewspaperDocument,
    options: RenderOptions = {}
  ): Promise<RenderedEdition> {
    if (!this.validateDocument(doc)) {
      throw new Error('Invalid NewspaperDocument: Document structure validation failed.');
    }

    const startTime = Date.now();
    const format = (options.format === 'png' ? 'png' : 'webp') as 'webp' | 'png';
    const targetWidth = options.viewportWidth || 1200;
    const targetHeight = options.viewportHeight || 1600;
    const quality = options.quality || 88;

    const renderedPages: RenderedPageImage[] = [];

    for (const page of doc.pages) {
      const pageBuffer = await this.renderPageImage(page, doc, {
        ...options,
        format,
        viewportWidth: targetWidth,
        viewportHeight: targetHeight,
        quality,
      });

      renderedPages.push({
        pageNumber: page.pageNumber,
        buffer: pageBuffer,
        mimeType: format === 'png' ? 'image/png' : 'image/webp',
        width: targetWidth,
        height: targetHeight,
        fileSizeBytes: pageBuffer.length,
      });
    }

    const htmlPreview = await this.renderToHtml(doc, options);
    const renderDurationMs = Date.now() - startTime;

    return {
      editionId: doc.edition.id,
      format,
      pages: renderedPages,
      htmlPreview,
      renderedAt: new Date().toISOString(),
      renderDurationMs,
    };
  }

  /**
   * Renders a single NewspaperPage to WebP or PNG binary buffer.
   */
  public async renderPageImage(
    page: NewspaperPage,
    doc: NewspaperDocument,
    options: RenderOptions = {}
  ): Promise<Buffer> {
    const format = options.format || 'webp';
    const quality = options.quality || 88;

    const svgString = generatePageSvg(page, doc, options);
    const svgBuffer = Buffer.from(svgString, 'utf-8');

    if (format === 'png') {
      return sharp(svgBuffer).png().toBuffer();
    }

    return sharp(svgBuffer).webp({ quality }).toBuffer();
  }

  /**
   * Legacy method for StructuredNewspaperData compliance.
   */
  public async renderEdition(
    data: StructuredNewspaperData,
    options: RenderOptions = {}
  ): Promise<RenderResult> {
    const startTime = Date.now();
    const format = options.format || data.metadata.targetFormat || 'webp';
    const targetWidth = options.viewportWidth || 1200;
    const targetHeight = options.viewportHeight || 1600;
    const quality = options.quality || 88;

    const svgCanvas = generateRetroSvg(data, {
      ...options,
      viewportWidth: targetWidth,
      viewportHeight: targetHeight,
    });

    const svgBuffer = Buffer.from(svgCanvas, 'utf-8');
    let outputBuffer: Buffer;
    let mimeType: string;

    if (format === 'png') {
      outputBuffer = await sharp(svgBuffer).png().toBuffer();
      mimeType = 'image/png';
    } else {
      outputBuffer = await sharp(svgBuffer).webp({ quality }).toBuffer();
      mimeType = 'image/webp';
    }

    return {
      editionId: data.metadata.editionId,
      format: format as any,
      mimeType,
      buffer: outputBuffer,
      fileSizeBytes: outputBuffer.length,
      dimensions: {
        width: targetWidth,
        height: targetHeight,
      },
      renderedAt: new Date().toISOString(),
      renderDurationMs: Date.now() - startTime,
    };
  }
}

export const newspaperRenderer = new NewspaperRenderer();
