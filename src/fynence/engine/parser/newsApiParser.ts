import type { ParsedFeed, ParsedNewsItem } from './types';

export interface NewsApiArticlePayload {
  source?: { id?: string | null; name?: string };
  author?: string | null;
  title: string;
  description?: string | null;
  url: string;
  urlToImage?: string | null;
  publishedAt?: string;
  content?: string | null;
}

export interface NewsApiResponsePayload {
  status: string;
  totalResults?: number;
  articles?: NewsApiArticlePayload[];
  message?: string;
}

export function parseNewsApiResponse(rawJson: string | object): ParsedFeed {
  let parsed: NewsApiResponsePayload;
  if (typeof rawJson === 'string') {
    try {
      parsed = JSON.parse(rawJson);
    } catch (err) {
      throw new Error(`Invalid NewsAPI JSON payload: ${String(err)}`);
    }
  } else {
    parsed = rawJson as NewsApiResponsePayload;
  }

  if (parsed.status !== 'ok') {
    throw new Error(`NewsAPI returned non-ok status: ${parsed.message || parsed.status}`);
  }

  const items: ParsedNewsItem[] = [];
  const rawArticles = parsed.articles || [];

  for (const a of rawArticles) {
    if (!a.title || !a.url) continue;

    items.push({
      title: a.title.trim(),
      link: a.url.trim(),
      description: a.description ? a.description.trim() : undefined,
      content: a.content ? a.content.trim() : undefined,
      author: a.author ? a.author.trim() : (a.source?.name || undefined),
      pubDate: a.publishedAt || undefined,
      imageUrl: a.urlToImage ? a.urlToImage.trim() : undefined,
      imageCredit: a.source?.name ? `Photo via ${a.source.name}` : undefined,
    });
  }

  return {
    title: 'NewsAPI Feed',
    items,
  };
}
