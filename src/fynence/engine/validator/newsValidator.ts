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
    if (!article.title || typeof article.title !== 'string') {
      errors.push('Missing article title');
    } else if (article.title.trim().length < 5) {
      errors.push(`Title is too short (${article.title.trim().length} chars)`);
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

    // 4. Publication Date validation
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

    // 5. Substance validation: either description or content should exist
    const hasDescription = Boolean(article.description && article.description.trim().length > 0);
    const hasContent = Boolean(article.content && article.content.trim().length > 0);
    if (!hasDescription && !hasContent && (article.title ? article.title.length < 20 : true)) {
      errors.push('Article lacks substantive text (empty description and content)');
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
