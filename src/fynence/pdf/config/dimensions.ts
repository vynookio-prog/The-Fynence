import type { PdfDimensions, PdfPageFormat } from '../types';

export const PDF_DIMENSION_PRESETS: Record<PdfPageFormat, PdfDimensions> = {
  newspaper: { width: 1200, height: 1600 },
  a4: { width: 595.28, height: 841.89 },
  a3: { width: 841.89, height: 1190.55 },
  letter: { width: 612, height: 792 },
  custom: { width: 1200, height: 1600 },
};

/**
 * Resolves target PDF page dimensions from options or defaults to newspaper broadsheet.
 */
export function resolvePdfDimensions(
  format?: PdfPageFormat,
  customDimensions?: PdfDimensions
): PdfDimensions {
  if (customDimensions && customDimensions.width > 0 && customDimensions.height > 0) {
    return { ...customDimensions };
  }

  if (format && format in PDF_DIMENSION_PRESETS) {
    return { ...PDF_DIMENSION_PRESETS[format] };
  }

  return { ...PDF_DIMENSION_PRESETS.newspaper };
}
