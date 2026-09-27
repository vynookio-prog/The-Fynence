import type { LinkStatus } from '../../types/article';

export interface UrlResolutionResult {
  originalUrl: string;
  resolvedUrl: string;
  linkStatus: LinkStatus;
  httpStatus?: number;
  redirectHops: number;
  durationMs: number;
}

interface CachedUrlResolution {
  result: UrlResolutionResult;
  expiresAt: number;
}

const PAYWALL_DOMAINS = new Set([
  'ft.com',
  'www.ft.com',
  'wsj.com',
  'www.wsj.com',
  'bloomberg.com',
  'www.bloomberg.com',
  'economist.com',
  'www.economist.com',
  'barrons.com',
  'www.barrons.com',
  'nytimes.com',
  'www.nytimes.com',
]);

const PAYWALL_PATTERNS = [
  /subscribe/i,
  /paywall/i,
  /subscription/i,
  /sign in to continue/i,
  /premium article/i,
  /subscriber-only/i,
  /members-only/i,
];

export class UrlResolver {
  private cache: Map<string, CachedUrlResolution> = new Map();
  private readonly defaultTimeoutMs: number;
  private readonly maxRedirects: number;
  private readonly cacheTtlMs: number;

  constructor(options?: {
    timeoutMs?: number;
    maxRedirects?: number;
    cacheTtlMs?: number;
  }) {
    this.defaultTimeoutMs = options?.timeoutMs ?? 5000;
    this.maxRedirects = options?.maxRedirects ?? 5;
    this.cacheTtlMs = options?.cacheTtlMs ?? 60 * 60 * 1000; // 1 hour
  }

  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Resolves redirects (301, 302, 307, 308) and validates destination link status.
   * NEVER alters originalUrl; stores final destination in resolvedUrl.
   */
  public async resolveAndValidate(rawUrl: string): Promise<UrlResolutionResult> {
    const startTime = Date.now();
    const originalUrl = (rawUrl || '').trim();

    if (!originalUrl || !this.isValidUrlString(originalUrl)) {
      return {
        originalUrl,
        resolvedUrl: originalUrl,
        linkStatus: 'BROKEN',
        redirectHops: 0,
        durationMs: Date.now() - startTime,
      };
    }

    // Check cache
    const cached = this.cache.get(originalUrl);
    if (cached && cached.expiresAt > Date.now()) {
      return { ...cached.result, durationMs: Date.now() - startTime };
    }

    let currentUrl = originalUrl;
    let hops = 0;
    let finalStatus = 200;
    let isRedirected = false;

    try {
      while (hops < this.maxRedirects) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.defaultTimeoutMs);

        let response: Response;
        try {
          // Use HEAD first for speed; fallback to GET if HEAD not supported
          response = await fetch(currentUrl, {
            method: 'HEAD',
            redirect: 'manual',
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) TheFynence/1.0',
              Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
          });
        } catch {
          // If HEAD fails or is rejected, retry with GET (streaming first 2KB only)
          response = await fetch(currentUrl, {
            method: 'GET',
            redirect: 'manual',
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) TheFynence/1.0',
              Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
          });
        } finally {
          clearTimeout(timer);
        }

        finalStatus = response.status;

        // Redirect statuses: 301, 302, 303, 307, 308
        if ([301, 302, 303, 307, 308].includes(finalStatus)) {
          const location = response.headers.get('location');
          if (!location) break;

          const nextUrl = new URL(location, currentUrl).href;
          if (nextUrl === currentUrl) break; // Avoid infinite self-redirect

          currentUrl = nextUrl;
          isRedirected = true;
          hops++;
          continue;
        }

        // Final destination reached
        break;
      }

      const linkStatus = this.classifyStatus(currentUrl, finalStatus);

      const result: UrlResolutionResult = {
        originalUrl,
        resolvedUrl: currentUrl,
        linkStatus: isRedirected && linkStatus === 'VALID' ? 'REDIRECTED' : linkStatus,
        httpStatus: finalStatus,
        redirectHops: hops,
        durationMs: Date.now() - startTime,
      };

      this.cache.set(originalUrl, {
        result,
        expiresAt: Date.now() + this.cacheTtlMs,
      });

      return result;
    } catch {
      // In case of timeout or offline environment:
      // If it's a known paywalled publisher domain, mark PAYWALLED; else UNKNOWN
      const hostname = this.extractHostname(currentUrl);
      const isKnownPaywall = PAYWALL_DOMAINS.has(hostname);

      const result: UrlResolutionResult = {
        originalUrl,
        resolvedUrl: currentUrl,
        linkStatus: isKnownPaywall ? 'PAYWALLED' : 'UNKNOWN',
        redirectHops: hops,
        durationMs: Date.now() - startTime,
      };

      return result;
    }
  }

  private classifyStatus(url: string, httpStatus: number): LinkStatus {
    const hostname = this.extractHostname(url);
    const isKnownPaywall = PAYWALL_DOMAINS.has(hostname);

    if (httpStatus >= 200 && httpStatus < 400) {
      return isKnownPaywall ? 'PAYWALLED' : 'VALID';
    }

    if (httpStatus === 401 || httpStatus === 403) {
      return isKnownPaywall ? 'PAYWALLED' : 'BLOCKED';
    }

    if (httpStatus === 404 || httpStatus === 410 || httpStatus >= 500) {
      return 'BROKEN';
    }

    return 'UNKNOWN';
  }

  private extractHostname(urlStr: string): string {
    try {
      return new URL(urlStr).hostname.toLowerCase();
    } catch {
      return '';
    }
  }

  private isValidUrlString(url: string): boolean {
    try {
      const u = new URL(url);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  }
}

export const urlResolver = new UrlResolver();
