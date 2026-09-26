const TRACKING_QUERY_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_name',
  'fbclid',
  'gclid',
  'msclkid',
  'mc_cid',
  'mc_eid',
  'ref',
  'ref_src',
  'ocid',
  'ncid',
  'sr_share',
  'xtor',
  'cmpid',
  'taid',
  '_hsenc',
  '_hsmi',
]);

/**
 * Normalizes URLs to a canonical format:
 * - Trims whitespace
 * - Strips marketing tracking query parameters (UTM, fbclid, etc.)
 * - Removes URL hash/fragment identifiers
 * - Lowercases hostname
 * - Standardizes port and trailing slashes
 */
export function normalizeCanonicalUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch (err) {
    return rawUrl.trim();
  }

  // Remove fragment
  parsed.hash = '';

  // Filter out tracking query params
  const searchParams = new URLSearchParams(parsed.search);
  const keysToDelete: string[] = [];

  searchParams.forEach((_, key) => {
    const lowerKey = key.toLowerCase();
    if (TRACKING_QUERY_PARAMS.has(lowerKey) || lowerKey.startsWith('utm_')) {
      keysToDelete.push(key);
    }
  });

  for (const key of keysToDelete) {
    searchParams.delete(key);
  }

  // Sort remaining query params for canonical consistency
  searchParams.sort();
  const sortedQuery = searchParams.toString();
  parsed.search = sortedQuery ? `?${sortedQuery}` : '';

  // Format pathname: strip trailing slash unless root
  let pathname = parsed.pathname;
  if (pathname.length > 1 && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }
  parsed.pathname = pathname;

  return parsed.href;
}
