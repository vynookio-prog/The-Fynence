import { validateExternalUrl } from './security';
import type { NewsSourceConfig } from '../registry/types';

export interface FetchResponse {
  statusCode: number;
  body: string;
  contentType: string;
  etag?: string;
  lastModified?: string;
  notModified: boolean;
  durationMs: number;
}

export class FetchError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly sourceId?: string,
    public readonly url?: string,
    public readonly isTransient: boolean = false
  ) {
    super(message);
    this.name = 'FetchError';
  }
}

export class NewsFetcher {
  private hostLastRequestTime: Map<string, number> = new Map();

  constructor(
    private readonly defaultTimeoutMs: number = 10000,
    private readonly userAgent: string = 'TheFynence-EditorialBot/1.0 (+https://thefynence.internal; News Ingestion Engine)'
  ) {}

  public async fetchSource(source: NewsSourceConfig): Promise<FetchResponse> {
    const security = validateExternalUrl(source.url);
    if (!security.isSafe || !security.normalizedUrl) {
      throw new FetchError(
        `URL security validation failed: ${security.reason}`,
        undefined,
        source.id,
        source.url,
        false
      );
    }

    const parsedUrl = new URL(security.normalizedUrl);
    await this.enforceRateLimit(parsedUrl.hostname, source.rateLimitMs || 1000);

    const headers: Record<string, string> = {
      'User-Agent': this.userAgent,
      Accept: 'application/rss+xml, application/xml, text/xml, application/json, text/html;q=0.9',
      ...(source.customHeaders || {}),
    };

    if (source.etag) {
      headers['If-None-Match'] = source.etag;
    }
    if (source.lastModified) {
      headers['If-Modified-Since'] = source.lastModified;
    }

    // Append API key if source requires it
    let targetUrl = security.normalizedUrl;
    if (source.requiresApiKey && source.apiKeyEnvVar) {
      const apiKey = process.env[source.apiKeyEnvVar];
      if (apiKey) {
        headers['X-Api-Key'] = apiKey;
      }
    }

    const timeoutMs = source.timeoutMs || this.defaultTimeoutMs;
    const maxRetries = 1;
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt <= maxRetries) {
      const startTime = Date.now();
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch(targetUrl, {
          method: 'GET',
          headers,
          signal: controller.signal,
          redirect: 'follow',
        });

        clearTimeout(timer);
        const durationMs = Date.now() - startTime;

        if (response.status === 304) {
          return {
            statusCode: 304,
            body: '',
            contentType: response.headers.get('content-type') || '',
            notModified: true,
            durationMs,
          };
        }

        if (!response.ok) {
          const isTransient = response.status >= 500 || response.status === 429;
          throw new FetchError(
            `HTTP ${response.status} ${response.statusText} from ${source.id}`,
            response.status,
            source.id,
            targetUrl,
            isTransient
          );
        }

        const body = await response.text();
        return {
          statusCode: response.status,
          body,
          contentType: response.headers.get('content-type') || '',
          etag: response.headers.get('etag') || undefined,
          lastModified: response.headers.get('last-modified') || undefined,
          notModified: false,
          durationMs,
        };
      } catch (err: any) {
        lastError = err;
        const isAbort = err?.name === 'AbortError';
        const isTransient = isAbort || (err instanceof FetchError && err.isTransient);

        if (isTransient && attempt < maxRetries) {
          attempt++;
          const backoffMs = 1000 * Math.pow(2, attempt);
          await new Promise(r => setTimeout(r, backoffMs));
          continue;
        }

        const message = isAbort
          ? `Timeout after ${timeoutMs}ms fetching ${source.id}`
          : err?.message || 'Unknown fetch error';

        throw new FetchError(
          message,
          err instanceof FetchError ? err.statusCode : undefined,
          source.id,
          targetUrl,
          false
        );
      }
    }

    throw lastError || new FetchError('Failed after retry', undefined, source.id, targetUrl);
  }

  private async enforceRateLimit(hostname: string, minIntervalMs: number): Promise<void> {
    const lastTime = this.hostLastRequestTime.get(hostname) || 0;
    const now = Date.now();
    const elapsed = now - lastTime;

    if (elapsed < minIntervalMs) {
      const waitTime = minIntervalMs - elapsed;
      await new Promise(r => setTimeout(r, waitTime));
    }

    this.hostLastRequestTime.set(hostname, Date.now());
  }
}

export const newsFetcher = new NewsFetcher();
