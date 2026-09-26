const COMMON_STOPWORDS = new Set([
  // English stopwords
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
  'to', 'was', 'were', 'will', 'with', 'after', 'amid', 'over', 'into',
  // Indonesian stopwords
  'di', 'ke', 'dari', 'pada', 'dan', 'atau', 'yang', 'untuk', 'dengan',
  'ini', 'itu', 'adalah', 'akan', 'telah', 'sudah', 'bisa', 'dapat',
]);

/**
 * Normalizes headline string for deterministic duplicate detection:
 * - Lowercases text
 * - Strips punctuation, quotes, currency symbols, and brackets
 * - Condenses consecutive whitespace
 */
export function normalizeTitle(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with space
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Converts a headline into a set of informative root tokens (excluding common stopwords).
 */
export function tokenizeTitle(title: string): Set<string> {
  const normalized = normalizeTitle(title);
  const words = normalized.split(' ');
  const tokens = new Set<string>();

  for (const word of words) {
    if (word.length > 2 && !COMMON_STOPWORDS.has(word)) {
      tokens.add(word);
    }
  }

  return tokens;
}

/**
 * Computes Jaccard Similarity coefficient between two token sets.
 * Returns a value between 0.0 (disjoint) and 1.0 (identical).
 */
export function calculateJaccardSimilarity(tokensA: Set<string>, tokensB: Set<string>): number {
  if (tokensA.size === 0 && tokensB.size === 0) return 1.0;
  if (tokensA.size === 0 || tokensB.size === 0) return 0.0;

  let intersectionSize = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) {
      intersectionSize++;
    }
  }

  const unionSize = tokensA.size + tokensB.size - intersectionSize;
  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}
