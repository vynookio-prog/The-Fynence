import sharp from 'sharp';
import { PDFDocument, PDFName, PDFString } from 'pdf-lib';
import type {
  IPdfRenderer,
  PdfRenderOptions,
  PdfRenderResult,
  PdfRenderSuccessResult,
  PdfRenderErrorResult,
} from '../types';
import type { NewspaperDocument } from '../../renderer/types/document';
import { resolvePdfDimensions } from '../config/dimensions';
import { generatePdfFilename, sanitizeFilename } from '../utils/filenameGenerator';
import { extractPageLinkAnnotations } from '../utils/linkExtractor';
import { PdfArtifactManager, defaultPdfArtifactManager } from '../utils/tempArtifactManager';
import { validatePdfResult } from '../validator/pdfValidator';
import { generatePageSvg } from '../../renderer/templates/svgPageCanvas';

export class PdfRenderer implements IPdfRenderer {
  private artifactManager: PdfArtifactManager;

  constructor(customArtifactManager?: PdfArtifactManager) {
    this.artifactManager = customArtifactManager || defaultPdfArtifactManager;
  }

  /**
   * Validates document integrity prior to PDF generation.
   */
  public validateDocument(doc: NewspaperDocument): { isValid: boolean; error?: string } {
    if (!doc || typeof doc !== 'object') {
      return { isValid: false, error: 'Document is null, undefined, or not an object.' };
    }
    if (!doc.edition || typeof doc.edition !== 'object' || !doc.edition.id || !doc.edition.title) {
      return { isValid: false, error: 'Document missing required edition metadata (id, title).' };
    }
    if (!Array.isArray(doc.pages) || doc.pages.length === 0) {
      return { isValid: false, error: 'Document contains no pages to render.' };
    }
    for (let i = 0; i < doc.pages.length; i++) {
      const page = doc.pages[i];
      if (!page || typeof page.pageNumber !== 'number' || !Array.isArray(page.blocks)) {
        return { isValid: false, error: `Page at index ${i} is missing valid pageNumber or blocks array.` };
      }
    }
    return { isValid: true };
  }

  /**
   * Main rendering method: converts a NewspaperDocument into a high-quality multi-page PDF.
   */
  public async render(
    doc: NewspaperDocument,
    options: PdfRenderOptions = {}
  ): Promise<PdfRenderResult> {
    // 1. Validation check
    const validation = this.validateDocument(doc);
    if (!validation.isValid) {
      return {
        success: false,
        error: {
          code: doc && doc.pages && doc.pages.length === 0 ? 'EMPTY_PAGES' : 'INVALID_DOCUMENT',
          message: validation.error || 'Invalid NewspaperDocument',
        },
      };
    }

    try {
      // 2. Prepare dimensions and file naming
      const dimensions = resolvePdfDimensions(options.format, options.dimensions);
      const fileName = options.customFilename
        ? sanitizeFilename(options.customFilename)
        : generatePdfFilename(doc);

      // 3. Initialize PDF document
      const pdfDoc = await PDFDocument.create();

      // 4. Set PDF metadata
      const editionTitle = doc.edition.title || 'THE FYNENCE';
      const editionSubtitle = doc.edition.subtitle || doc.edition.editionType.toUpperCase();
      const metaTitle = options.metadata?.title || `${editionTitle} — ${editionSubtitle}`;
      const metaAuthor = options.metadata?.author || 'THE FYNENCE';
      const metaSubject =
        options.metadata?.subject ||
        (Array.isArray(doc.edition.sections) ? doc.edition.sections.join(' / ') : 'News / Finance / Economy');
      const metaKeywords = options.metadata?.keywords || [
        'THE FYNENCE',
        'newspaper',
        'broadsheet',
        doc.edition.editionType || 'daily',
        ...(Array.isArray(doc.edition.sections) ? doc.edition.sections : []),
      ];

      pdfDoc.setTitle(metaTitle);
      pdfDoc.setAuthor(metaAuthor);
      pdfDoc.setSubject(metaSubject);
      pdfDoc.setKeywords(metaKeywords);
      pdfDoc.setProducer(options.metadata?.producer || 'THE FYNENCE PDF Engine (pdf-lib)');
      pdfDoc.setCreator(options.metadata?.creator || 'THE FYNENCE Editorial Engine');

      const genDate = doc.edition.generatedAt ? new Date(doc.edition.generatedAt) : new Date();
      if (!isNaN(genDate.getTime())) {
        pdfDoc.setCreationDate(genDate);
        pdfDoc.setModificationDate(genDate);
      }

      // 5. Render pages sequentially to preserve exact page ordering
      for (const page of doc.pages) {
        // Generate SVG broadsheet canvas from Step 6 layout
        const svgString = generatePageSvg(page, doc, {
          ...options,
          viewportWidth: dimensions.width,
          viewportHeight: dimensions.height,
        });

        // Rasterize SVG to high-resolution PNG buffer using sharp
        const svgBuffer = Buffer.from(svgString, 'utf-8');
        const pngBuffer = await sharp(svgBuffer).png().toBuffer();

        // Add page to PDF with exact target dimensions
        const pdfPage = pdfDoc.addPage([dimensions.width, dimensions.height]);
        const embeddedPng = await pdfDoc.embedPng(pngBuffer);

        // Draw broadsheet canvas to fill the entire page box
        pdfPage.drawImage(embeddedPng, {
          x: 0,
          y: 0,
          width: dimensions.width,
          height: dimensions.height,
        });

        // 6. Preserve clickable links where available and enabled
        if (options.addClickableLinks !== false) {
          const linkAnnotations = extractPageLinkAnnotations(
            page,
            1200,
            1600,
            dimensions.width,
            dimensions.height
          );

          for (const link of linkAnnotations) {
            const linkAnnot = pdfDoc.context.obj({
              Type: 'Annot',
              Subtype: 'Link',
              Rect: link.rect,
              Border: [0, 0, 0],
              A: {
                Type: 'Action',
                S: 'URI',
                URI: PDFString.of(link.url),
              },
            });

            const linkRef = pdfDoc.context.register(linkAnnot);
            const existing = pdfPage.node.get(PDFName.of('Annots')) as any;
            if (existing && typeof existing.push === 'function') {
              existing.push(linkRef);
            } else {
              pdfPage.node.set(PDFName.of('Annots'), pdfDoc.context.obj([linkRef]));
            }
          }
        }
      }

      // 7. Compile PDF to binary buffer
      const pdfBytes = await pdfDoc.save();
      const pdfBuffer = Buffer.from(pdfBytes);

      // 8. Handle optional temporary file artifact writing
      let filePath: string | undefined;
      if (options.generateTempFile) {
        filePath = await this.artifactManager.writeTempPdf(fileName, pdfBuffer);
      }

      // 9. Strict post-generation validation
      const validationReport = await validatePdfResult(
        pdfBuffer,
        doc.pages.length,
        filePath
      );

      if (!validationReport.isValid) {
        return {
          success: false,
          fileName,
          error: {
            code: 'VALIDATION_FAILED',
            message: validationReport.error || 'Generated PDF failed validation standards.',
          },
        };
      }

      // 10. Return structured success result
      return {
        success: true,
        fileName,
        filePath,
        buffer: pdfBuffer,
        mimeType: 'application/pdf',
        pageCount: doc.pages.length,
        fileSizeBytes: pdfBuffer.length,
        width: dimensions.width,
        height: dimensions.height,
        generatedAt: new Date().toISOString(),
        metadata: {
          title: metaTitle,
          author: metaAuthor,
          subject: metaSubject,
          keywords: metaKeywords,
          creationDate: genDate.toISOString(),
        },
      };
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: 'RENDER_FAILED',
          message: err?.message || 'An unexpected error occurred during PDF compilation.',
          details: err,
        },
      };
    }
  }

  /**
   * Helper method to render and write directly to a temporary file artifact.
   */
  public async renderToFile(
    doc: NewspaperDocument,
    options: PdfRenderOptions = {}
  ): Promise<PdfRenderResult> {
    return this.render(doc, { ...options, generateTempFile: true });
  }

  /**
   * Cleans up temporary PDF artifact file.
   */
  public async cleanupArtifact(filePath: string): Promise<boolean> {
    return this.artifactManager.cleanupArtifact(filePath);
  }

  /**
   * Returns internal artifact manager.
   */
  public getArtifactManager(): PdfArtifactManager {
    return this.artifactManager;
  }
}

export const pdfRenderer = new PdfRenderer();
