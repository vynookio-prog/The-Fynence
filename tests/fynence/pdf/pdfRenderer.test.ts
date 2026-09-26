import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { PDFDocument, PDFName } from 'pdf-lib';
import {
  pdfRenderer,
  PdfRenderer,
  validatePdfResult,
  generatePdfFilename,
  sanitizeFilename,
  resolvePdfDimensions,
  PdfArtifactManager,
} from '../../../src/fynence/pdf';
import { editionComposer } from '../../../src/fynence/composer';
import { newspaperRenderer } from '../../../src/fynence/renderer';
import { MOCK_STORIES } from '../../../src/fynence/renderer/mock/mockNewspaperData';
import type { NewspaperDocument } from '../../../src/fynence/renderer/types/document';

describe('PDF Engine (STEP 7)', () => {
  let customTempDir: string;
  let testArtifactManager: PdfArtifactManager;
  let testRenderer: PdfRenderer;

  before(() => {
    customTempDir = path.join(os.tmpdir(), `fynence-test-pdf-${Date.now()}`);
    testArtifactManager = new PdfArtifactManager(customTempDir);
    testRenderer = new PdfRenderer(testArtifactManager);
  });

  after(async () => {
    await testArtifactManager.cleanupAll();
    try {
      if (fs.existsSync(customTempDir)) {
        fs.rmSync(customTempDir, { recursive: true, force: true });
      }
    } catch {
      // Ignore cleanup error
    }
  });

  // ==========================================
  // 1. ONE-PAGE PDF
  // ==========================================
  it('1. One-page PDF: successfully compiles single-page document to valid PDF', async () => {
    const doc = editionComposer.composeDocument({
      editionType: 'daily',
      mockMode: true,
      pageSize: 'single_page',
    });

    assert.equal(doc.pages.length, 1);

    const result = await testRenderer.render(doc);
    assert.equal(result.success, true);
    if (!result.success) return;

    assert.equal(result.mimeType, 'application/pdf');
    assert.equal(result.pageCount, 1);
    assert.ok(result.buffer.length > 5000);
    assert.equal(result.width, 1200);
    assert.equal(result.height, 1600);

    // Validate binary PDF structure using pdf-lib
    const loadedPdf = await PDFDocument.load(result.buffer);
    assert.equal(loadedPdf.getPageCount(), 1);
  });

  // ==========================================
  // 2. MULTI-PAGE PDF
  // ==========================================
  it('2. Multi-page PDF: compiles multi-page document into cohesive multi-page PDF', async () => {
    const doc = editionComposer.composeDocument({
      editionType: 'daily',
      mockMode: true,
      pageSize: 'multi_page',
    });

    assert.equal(doc.pages.length, 2);

    const result = await testRenderer.render(doc);
    assert.equal(result.success, true);
    if (!result.success) return;

    assert.equal(result.pageCount, 2);
    assert.ok(result.buffer.length > 10000);

    const loadedPdf = await PDFDocument.load(result.buffer);
    assert.equal(loadedPdf.getPageCount(), 2);
  });

  // ==========================================
  // 3. PAGE ORDERING
  // ==========================================
  it('3. Page ordering: preserves exact page sequence matching document IR', async () => {
    const doc = editionComposer.composeDocument({
      editionType: 'daily',
      mockMode: true,
      pageSize: 'multi_page',
    });

    assert.equal(doc.pages[0].pageNumber, 1);
    assert.equal(doc.pages[1].pageNumber, 2);

    const result = await testRenderer.render(doc);
    assert.equal(result.success, true);
    if (!result.success) return;

    const loadedPdf = await PDFDocument.load(result.buffer);
    const pages = loadedPdf.getPages();
    assert.equal(pages.length, 2);

    // Page 1 and Page 2 dimensions match sequentially
    assert.equal(pages[0].getWidth(), 1200);
    assert.equal(pages[0].getHeight(), 1600);
    assert.equal(pages[1].getWidth(), 1200);
    assert.equal(pages[1].getHeight(), 1600);
  });

  // ==========================================
  // 4. PAGE DIMENSIONS & PRESETS
  // ==========================================
  it('4. Page dimensions: supports custom dimensions and A4/A3/Letter presets', async () => {
    const doc = editionComposer.composeDocument({
      editionType: 'custom',
      sections: ['daily_news'],
      mockMode: true,
      pageSize: 'single_page',
    });

    // Preset: A4
    const a4Result = await testRenderer.render(doc, { format: 'a4' });
    assert.equal(a4Result.success, true);
    if (a4Result.success) {
      assert.equal(a4Result.width, 595.28);
      assert.equal(a4Result.height, 841.89);
    }

    // Preset: Letter
    const letterResult = await testRenderer.render(doc, { format: 'letter' });
    assert.equal(letterResult.success, true);
    if (letterResult.success) {
      assert.equal(letterResult.width, 612);
      assert.equal(letterResult.height, 792);
    }

    // Custom dimensions
    const customResult = await testRenderer.render(doc, {
      dimensions: { width: 900, height: 1200 },
    });
    assert.equal(customResult.success, true);
    if (customResult.success) {
      assert.equal(customResult.width, 900);
      assert.equal(customResult.height, 1200);
    }
  });

  // ==========================================
  // 5. METADATA INJECTION
  // ==========================================
  it('5. Metadata: embeds document title, author, subject, and keywords into PDF', async () => {
    const doc = editionComposer.composeDocument({
      editionType: 'finance_economy',
      mockMode: true,
      pageSize: 'single_page',
    });

    const result = await testRenderer.render(doc, {
      metadata: {
        title: 'THE FYNENCE — Finance & Economy Intelligence',
        author: 'THE FYNENCE Syndicate',
        subject: 'Financial & Macroeconomic Dispatch',
        keywords: ['finance', 'economy', 'central bank', 'indonesia'],
      },
    });

    assert.equal(result.success, true);
    if (!result.success) return;

    assert.equal(result.metadata.title, 'THE FYNENCE — Finance & Economy Intelligence');
    assert.equal(result.metadata.author, 'THE FYNENCE Syndicate');

    const loadedPdf = await PDFDocument.load(result.buffer);
    assert.equal(loadedPdf.getTitle(), 'THE FYNENCE — Finance & Economy Intelligence');
    assert.equal(loadedPdf.getAuthor(), 'THE FYNENCE Syndicate');
    assert.equal(loadedPdf.getSubject(), 'Financial & Macroeconomic Dispatch');
    assert.ok(loadedPdf.getKeywords()?.includes('finance'));
  });

  // ==========================================
  // 6. FILENAME GENERATION
  // ==========================================
  it('6. Filename generation: produces deterministic and sanitized filenames', () => {
    const docDaily = editionComposer.composeDocument({
      editionType: 'daily',
      publicationDate: '2026-09-27T00:00:00Z',
      mockMode: true,
    });
    assert.equal(generatePdfFilename(docDaily), 'THE_FYNENCE_DAILY_2026-09-27.pdf');

    const docFin = editionComposer.composeDocument({
      editionType: 'finance_economy',
      publicationDate: '2026-09-27T00:00:00Z',
      mockMode: true,
    });
    assert.equal(generatePdfFilename(docFin), 'THE_FYNENCE_FINANCE_ECONOMY_2026-09-27.pdf');

    const docMarket = editionComposer.composeDocument({
      editionType: 'market',
      publicationDate: '2026-09-27T00:00:00Z',
      mockMode: true,
    });
    assert.equal(generatePdfFilename(docMarket), 'THE_FYNENCE_MARKETS_2026-09-27.pdf');

    // Sanitization test
    assert.equal(
      sanitizeFilename('../../../evil/path/custom edition 2026.pdf'),
      'evil_path_custom_edition_2026.pdf'
    );
    assert.equal(sanitizeFilename('plain_name'), 'plain_name.pdf');
  });

  // ==========================================
  // 7. MISSING OPTIONAL IMAGE HANDLING
  // ==========================================
  it('7. Missing optional image: renders text-only story cleanly without crashing or inventing AI images', async () => {
    const textOnlyStory = MOCK_STORIES[2]; // No image
    assert.equal(textOnlyStory.image, undefined);

    const doc = editionComposer.composeDocument({
      articles: [textOnlyStory],
      pageSize: 'single_page',
      mockMode: false,
    });

    const result = await testRenderer.render(doc);
    assert.equal(result.success, true);
    if (!result.success) return;

    assert.equal(result.pageCount, 1);
    assert.ok(result.buffer.length > 5000);
  });

  // ==========================================
  // 8. INVALID DOCUMENT HANDLING
  // ==========================================
  it('8. Invalid document: gracefully handles corrupt or malformed document models', async () => {
    // Null document
    const resultNull = await testRenderer.render(null as any);
    assert.equal(resultNull.success, false);
    if (!resultNull.success) {
      assert.equal(resultNull.error.code, 'INVALID_DOCUMENT');
    }

    // Empty pages
    const emptyDoc: NewspaperDocument = {
      edition: {
        id: 'test',
        title: 'THE FYNENCE',
        subtitle: 'TEST',
        editionDate: '2026-09-27',
        editionType: 'daily',
        sections: [],
        generatedAt: '2026-09-27T00:00:00Z',
        timezone: 'Asia/Jakarta',
      },
      pages: [],
    };

    const resultEmpty = await testRenderer.render(emptyDoc);
    assert.equal(resultEmpty.success, false);
    if (!resultEmpty.success) {
      assert.equal(resultEmpty.error.code, 'EMPTY_PAGES');
    }
  });

  // ==========================================
  // 9. CORRUPTED OR FAILING RENDERING RESILIENCE
  // ==========================================
  it('9. Corrupted image / error resilience: does not throw unhandled exception on invalid inputs', async () => {
    const docWithBadPage: NewspaperDocument = {
      edition: {
        id: 'bad-page-doc',
        title: 'THE FYNENCE',
        subtitle: 'BROKEN',
        editionDate: '2026-09-27',
        editionType: 'daily',
        sections: ['daily_news'],
        generatedAt: '2026-09-27T00:00:00Z',
        timezone: 'Asia/Jakarta',
      },
      pages: [
        {
          pageNumber: 1,
          totalPages: 1,
          blocks: [null as any], // Corrupted block
        },
      ],
    };

    // Should catch or handle gracefully
    const result = await testRenderer.render(docWithBadPage);
    assert.ok(typeof result.success === 'boolean');
  });

  // ==========================================
  // 10. TEMPORARY FILE CREATION & CLEANUP
  // ==========================================
  it('10. Temporary file lifecycle: generates temp artifact, validates existence, and cleans up cleanly', async () => {
    const doc = editionComposer.composeDocument({
      editionType: 'daily',
      mockMode: true,
      pageSize: 'single_page',
    });

    const result = await testRenderer.renderToFile(doc);
    assert.equal(result.success, true);
    if (!result.success) return;

    assert.ok(result.filePath);
    assert.ok(fs.existsSync(result.filePath));
    assert.equal(fs.statSync(result.filePath).size, result.fileSizeBytes);

    // Cleanup artifact
    const cleaned = await testRenderer.cleanupArtifact(result.filePath);
    assert.equal(cleaned, true);
    assert.equal(fs.existsSync(result.filePath), false);
  });

  // ==========================================
  // 11. FILE EXISTENCE & INTEGRITY VALIDATION
  // ==========================================
  it('11. File validation: validatePdfResult detects corrupt header and mismatched page count', async () => {
    // Valid check
    const doc = editionComposer.composeDocument({
      editionType: 'daily',
      mockMode: true,
      pageSize: 'single_page',
    });
    const result = await testRenderer.render(doc);
    assert.equal(result.success, true);
    if (!result.success) return;

    const validReport = await validatePdfResult(result.buffer, 1);
    assert.equal(validReport.isValid, true);
    assert.equal(validReport.hasValidHeader, true);
    assert.equal(validReport.hasValidTrailer, true);

    // Corrupted header
    const badBuffer = Buffer.from('NOT_A_PDF_STRING_HERE');
    const badHeaderReport = await validatePdfResult(badBuffer, 1);
    assert.equal(badHeaderReport.isValid, false);
    assert.equal(badHeaderReport.hasValidHeader, false);

    // Page count mismatch
    const mismatchReport = await validatePdfResult(result.buffer, 5); // Expected 5, actual is 1
    assert.equal(mismatchReport.isValid, false);
    assert.ok(mismatchReport.error?.includes('Page count mismatch'));
  });

  // ==========================================
  // 12. CLICKABLE LINK ANNOTATIONS
  // ==========================================
  it('12. Clickable link annotations: preserves story article links in PDF catalog', async () => {
    const doc = editionComposer.composeDocument({
      articles: MOCK_STORIES,
      pageSize: 'single_page',
      mockMode: false,
    });

    const result = await testRenderer.render(doc, { addClickableLinks: true });
    assert.equal(result.success, true);
    if (!result.success) return;

    const loadedPdf = await PDFDocument.load(result.buffer);
    const page = loadedPdf.getPage(0);
    assert.ok(page);

    const annots = page.node.Annots();
    assert.ok(annots);
    assert.ok(annots.size() > 0);

    const firstAnnot = loadedPdf.context.lookup(annots.get(0)) as any;
    assert.ok(firstAnnot);
    const action = firstAnnot.get(PDFName.of('A'));
    assert.ok(action);
    const uri = action.get(PDFName.of('URI'))?.asString();
    assert.ok(
      uri?.includes('https://ft.com/dispatches/fed-policy-liquidity-anchor') ||
      uri?.includes('https://reuters.com/markets/europe-debt-syndication')
    );
  });

  // ==========================================
  // 13. VISUAL COMPARISON WORKFLOW (Step 6 vs Step 7)
  // ==========================================
  it('13. Visual comparison workflow: PNG page 1 and PDF page 1 derive from identical NewspaperDocument layout', async () => {
    const doc = editionComposer.composeDocument({
      editionType: 'daily',
      mockMode: true,
      pageSize: 'single_page',
    });

    // Render image with NewspaperRenderer (Step 6)
    const imgResult = await newspaperRenderer.renderToImages(doc, {
      format: 'png',
      viewportWidth: 1200,
      viewportHeight: 1600,
    });

    // Render PDF with PdfRenderer (Step 7)
    const pdfResult = await testRenderer.render(doc, {
      format: 'newspaper',
      dimensions: { width: 1200, height: 1600 },
    });

    assert.equal(imgResult.pages.length, 1);
    assert.equal(pdfResult.success, true);
    if (!pdfResult.success) return;

    assert.equal(imgResult.pages[0].width, pdfResult.width);
    assert.equal(imgResult.pages[0].height, pdfResult.height);
    assert.equal(imgResult.pages.length, pdfResult.pageCount);
  });
});
