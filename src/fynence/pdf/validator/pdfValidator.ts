import fs from 'fs';
import { PDFDocument } from 'pdf-lib';

export interface PdfValidationReport {
  isValid: boolean;
  actualPageCount: number;
  fileSizeBytes: number;
  hasValidHeader: boolean;
  hasValidTrailer: boolean;
  error?: string;
}

/**
 * Validates a generated PDF buffer and optional file path against integrity standards:
 * - Buffer exists and length > 0
 * - Starts with valid PDF magic header (%PDF-)
 * - Ends with or contains EOF trailer (%%EOF)
 * - Actual page count matches expected count
 * - If on filesystem, file exists and size matches buffer length
 */
export async function validatePdfResult(
  buffer: Buffer,
  expectedPageCount: number,
  filePath?: string
): Promise<PdfValidationReport> {
  if (!buffer || buffer.length === 0) {
    return {
      isValid: false,
      actualPageCount: 0,
      fileSizeBytes: 0,
      hasValidHeader: false,
      hasValidTrailer: false,
      error: 'PDF buffer is empty or null.',
    };
  }

  // Check magic bytes %PDF-
  const header = buffer.subarray(0, 5).toString('ascii');
  const hasValidHeader = header.startsWith('%PDF-');
  if (!hasValidHeader) {
    return {
      isValid: false,
      actualPageCount: 0,
      fileSizeBytes: buffer.length,
      hasValidHeader: false,
      hasValidTrailer: false,
      error: `Invalid PDF header: expected '%PDF-', got '${header}'`,
    };
  }

  // Check trailer %%EOF
  const trailerChunk = buffer.subarray(Math.max(0, buffer.length - 1024)).toString('ascii');
  const hasValidTrailer = trailerChunk.includes('%%EOF');
  if (!hasValidTrailer) {
    return {
      isValid: false,
      actualPageCount: 0,
      fileSizeBytes: buffer.length,
      hasValidHeader: true,
      hasValidTrailer: false,
      error: 'Missing %%EOF marker in PDF trailer.',
    };
  }

  // Validate page count using pdf-lib
  let actualPageCount = 0;
  try {
    const loadedPdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
    actualPageCount = loadedPdf.getPageCount();
  } catch (err: any) {
    return {
      isValid: false,
      actualPageCount: 0,
      fileSizeBytes: buffer.length,
      hasValidHeader: true,
      hasValidTrailer: true,
      error: `Failed to parse PDF structure: ${err.message}`,
    };
  }

  if (actualPageCount !== expectedPageCount) {
    return {
      isValid: false,
      actualPageCount,
      fileSizeBytes: buffer.length,
      hasValidHeader: true,
      hasValidTrailer: true,
      error: `Page count mismatch: expected ${expectedPageCount} pages, got ${actualPageCount}`,
    };
  }

  // Validate filesystem artifact if filePath provided
  if (filePath) {
    if (!fs.existsSync(filePath)) {
      return {
        isValid: false,
        actualPageCount,
        fileSizeBytes: buffer.length,
        hasValidHeader: true,
        hasValidTrailer: true,
        error: `Temporary PDF file does not exist at path: ${filePath}`,
      };
    }
    const stat = fs.statSync(filePath);
    if (stat.size !== buffer.length) {
      return {
        isValid: false,
        actualPageCount,
        fileSizeBytes: stat.size,
        hasValidHeader: true,
        hasValidTrailer: true,
        error: `Filesystem artifact size (${stat.size}) does not match buffer length (${buffer.length})`,
      };
    }
  }

  return {
    isValid: true,
    actualPageCount,
    fileSizeBytes: buffer.length,
    hasValidHeader: true,
    hasValidTrailer: true,
  };
}
