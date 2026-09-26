export interface UrlSecurityCheckResult {
  isSafe: boolean;
  normalizedUrl?: string;
  reason?: string;
}

const FORBIDDEN_PROTOCOLS = new Set(['file:', 'ftp:', 'javascript:', 'data:', 'vbscript:']);

const PRIVATE_IP_PATTERNS = [
  /^localhost$/i,
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^192\.168\.\d{1,3}\.\d{1,3}$/,
  /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/,
  /^169\.254\.\d{1,3}\.\d{1,3}$/,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
];

/**
 * Validates external URLs against SSRF (Server-Side Request Forgery) attacks.
 * Prohibits loopback, internal private subnets, non-HTTP protocols, and malformed strings.
 */
export function validateExternalUrl(rawUrl: string): UrlSecurityCheckResult {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { isSafe: false, reason: 'URL string is empty or invalid' };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch (err) {
    return { isSafe: false, reason: 'Malformed URL format' };
  }

  if (FORBIDDEN_PROTOCOLS.has(parsed.protocol)) {
    return { isSafe: false, reason: `Forbidden protocol: ${parsed.protocol}` };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { isSafe: false, reason: `Unsupported protocol: ${parsed.protocol}` };
  }

  const hostname = parsed.hostname;
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      return { isSafe: false, reason: `Private or loopback address blocked: ${hostname}` };
    }
  }

  return {
    isSafe: true,
    normalizedUrl: parsed.href,
  };
}
