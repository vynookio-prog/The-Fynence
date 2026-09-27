import type { Article } from '../../types/article';

export interface EnrichedArticleContent {
  headline: string;
  subheadline?: string;
  whatHappened?: string;
  details?: string;
  whyItMatters?: string;
  enrichedSourceText: string;
  isEnriched: boolean;
}

export class ArticleEnricher {
  private timeoutMs: number;

  constructor(options?: { timeoutMs?: number }) {
    this.timeoutMs = options?.timeoutMs ?? 4000;
  }

  /**
   * Enriches an article if its description is too short, extracting
   * JSON-LD, OpenGraph, or public article paragraphs without bypassing paywalls.
   */
  public async enrichArticle(article: Article): Promise<EnrichedArticleContent> {
    const rawDescription = (article.description || '').trim();
    const rawContent = (article.content || '').trim();

    // If description or content is already detailed (> 350 chars), use it directly
    if (rawContent.length > 350 || rawDescription.length > 350) {
      return {
        headline: article.title,
        enrichedSourceText: rawContent.length > rawDescription.length ? rawContent : rawDescription,
        isEnriched: false,
      };
    }

    // Attempt enrichment if originalUrl is valid
    const targetUrl = article.resolvedUrl || article.originalUrl || article.url;
    if (!targetUrl || (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://'))) {
      return {
        headline: article.title,
        enrichedSourceText: rawDescription || rawContent || article.title,
        isEnriched: false,
      };
    }

    // If already known paywalled or blocked, don't spam requests; rely on RSS summary + metadata
    if (article.linkStatus === 'PAYWALLED' || article.linkStatus === 'BLOCKED') {
      return {
        headline: article.title,
        enrichedSourceText: rawDescription || rawContent || article.title,
        isEnriched: false,
      };
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      const res = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) TheFynence-Bot/1.0',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        return {
          headline: article.title,
          enrichedSourceText: rawDescription || rawContent || article.title,
          isEnriched: false,
        };
      }

      const html = await res.text();
      const extracted = this.extractFromHtml(html);

      const combinedText = [
        rawDescription,
        extracted.metaDescription,
        extracted.jsonLdBody,
        extracted.paragraphs,
      ]
        .filter(Boolean)
        .join(' ');

      return {
        headline: article.title,
        subheadline: extracted.metaDescription || undefined,
        enrichedSourceText: combinedText || rawDescription || article.title,
        isEnriched: Boolean(extracted.metaDescription || extracted.jsonLdBody || extracted.paragraphs),
      };
    } catch {
      return {
        headline: article.title,
        enrichedSourceText: rawDescription || rawContent || article.title,
        isEnriched: false,
      };
    }
  }

  private extractFromHtml(html: string): {
    metaDescription?: string;
    jsonLdBody?: string;
    paragraphs?: string;
  } {
    let metaDescription: string | undefined;
    let jsonLdBody: string | undefined;
    let paragraphs: string | undefined;

    // 1. Meta / OpenGraph description
    const ogDescMatch =
      html.match(/<meta\s+[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i) ||
      html.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);

    if (ogDescMatch && ogDescMatch[1]) {
      metaDescription = this.cleanText(ogDescMatch[1]);
    }

    // 2. JSON-LD articleBody
    const jsonLdMatches = html.match(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    if (jsonLdMatches) {
      for (const tag of jsonLdMatches) {
        try {
          const content = tag.replace(/<\/?script[^>]*>/gi, '').trim();
          const parsed = JSON.parse(content);
          if (parsed && typeof parsed === 'object') {
            if (typeof parsed.articleBody === 'string') {
              jsonLdBody = this.cleanText(parsed.articleBody.slice(0, 1000));
              break;
            }
            if (typeof parsed.description === 'string' && !metaDescription) {
              metaDescription = this.cleanText(parsed.description);
            }
          }
        } catch {
          // Ignore invalid JSON in script tag
        }
      }
    }

    // 3. Leading public paragraphs
    const pMatches = html.match(/<p\b[^>]*>([\s\S]*?)<\/p>/gi);
    if (pMatches && pMatches.length > 0) {
      const validParagraphs: string[] = [];
      for (const p of pMatches.slice(0, 4)) {
        const text = this.cleanText(p.replace(/<[^>]+>/g, ''));
        // Ignore tiny paragraphs like copyright, sign-in, cookie notices
        if (text.length > 40 && !text.toLowerCase().includes('cookie') && !text.toLowerCase().includes('subscribe')) {
          validParagraphs.push(text);
        }
      }
      if (validParagraphs.length > 0) {
        paragraphs = validParagraphs.join(' ');
      }
    }

    return { metaDescription, jsonLdBody, paragraphs };
  }

  private cleanText(str: string): string {
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }
}

export const articleEnricher = new ArticleEnricher();
