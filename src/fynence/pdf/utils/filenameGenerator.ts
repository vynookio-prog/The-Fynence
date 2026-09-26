import type { NewspaperDocument } from '../../renderer/types/document';

/**
 * Generates a clean, deterministic, sanitized filename for a generated PDF edition.
 * Example outputs:
 * - THE_FYNENCE_DAILY_2026-09-27.pdf
 * - THE_FYNENCE_FINANCE_ECONOMY_2026-09-27.pdf
 * - THE_FYNENCE_MARKETS_2026-09-27.pdf
 * - THE_FYNENCE_CUSTOM_2026-09-27.pdf
 */
export function generatePdfFilename(doc: NewspaperDocument): string {
  const editionType = doc?.edition?.editionType || 'daily';

  // Normalize edition type string
  let typeSlug = editionType.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
  if (typeSlug === 'MARKET') {
    typeSlug = 'MARKETS';
  }

  // Extract date formatted as YYYY-MM-DD
  let datePart = '2026-09-27';
  if (doc?.edition?.editionDate) {
    const rawDate = doc.edition.editionDate;
    const match = rawDate.match(/\d{4}-\d{2}-\d{2}/);
    if (match) {
      datePart = match[0];
    } else {
      try {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          datePart = d.toISOString().split('T')[0];
        }
      } catch {
        // Fallback default date
      }
    }
  }

  return `THE_FYNENCE_${typeSlug}_${datePart}.pdf`;
}

/**
 * Sanitizes any custom filename string to prevent path traversal or invalid characters.
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return 'THE_FYNENCE_EDITION.pdf';
  const withoutExt = filename.replace(/\.pdf$/i, '');
  const clean = withoutExt
    .replace(/[/\\?%*:|"<>.]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_/, '');

  return `${clean || 'THE_FYNENCE_EDITION'}.pdf`;
}

