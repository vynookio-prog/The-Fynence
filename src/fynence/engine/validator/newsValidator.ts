import type { Article } from '../../types/article';

export interface ArticleValidationResult {
  isValid: boolean;
  articleId?: string;
  url?: string;
  errors: string[];
}

export class NewsValidator {
  public validate(article: Partial<Article>): ArticleValidationResult {
    const errors: string[] = [];

    // 1. Title validation
    if (!article.title || typeof article.title !== 'string' || article.title.trim().length === 0) {
      errors.push('Missing or empty article title');
    } else if (article.title.trim().length < 5) {
      errors.push(`Article title is too short (${article.title.trim().length} chars, min 5)`);
    }

    // 2. Source validation
    if (!article.source || typeof article.source !== 'string' || article.source.trim().length === 0) {
      errors.push('Missing article source');
    }

    // 3. URL validation
    if (!article.url || typeof article.url !== 'string') {
      errors.push('Missing article URL');
    } else {
      try {
        const parsedUrl = new URL(article.url);
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
          errors.push(`Invalid URL protocol: ${parsedUrl.protocol}`);
        }
      } catch (err) {
        errors.push(`Malformed URL: ${article.url}`);
      }
    }

    // 4. Publication Date validation (optional, must be valid timestamp if present)
    if (article.publishedAt) {
      const pubTime = new Date(article.publishedAt).getTime();
      if (isNaN(pubTime)) {
        errors.push(`Invalid publishedAt timestamp: ${article.publishedAt}`);
      } else {
        // Guard against far future timestamps (> 2 days into the future)
        const twoDaysAhead = Date.now() + 2 * 24 * 60 * 60 * 1000;
        if (pubTime > twoDaysAhead) {
          errors.push(`Publication timestamp is implausibly in the future: ${article.publishedAt}`);
        }
      }
    }

    // 5. Substance validation: Must have at least a meaningful title or description
    const titleLen = (article.title || '').trim().length;
    const descLen = (article.description || '').trim().length;
    const contentLen = (article.content || '').trim().length;
    if (descLen === 0 && contentLen === 0 && titleLen < 20) {
      errors.push('Article lacks substantive text (no description/content and short headline)');
    }

    return {
      isValid: errors.length === 0,
      articleId: article.id,
      url: article.url,
      errors,
    };
  }

  public validateBatch(articles: Article[]): { valid: Article[]; invalid: { article: Article; errors: string[] }[] } {
    const valid: Article[] = [];
    const invalid: { article: Article; errors: string[] }[] = [];

    for (const article of articles) {
      const result = this.validate(article);
      if (result.isValid) {
        valid.push(article);
      } else {
        invalid.push({ article, errors: result.errors });
      }
    }

    return { valid, invalid };
  }
}

export const newsValidator = new NewsValidator();
