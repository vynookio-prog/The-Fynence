import { normalizeCanonicalUrl } from './urlNormalizer';
import { decodeHtmlEntities, stripHtmlTags } from '../parser/rssParser';
import type { Article } from '../../types/article';
import type { ParsedNewsItem } from '../parser/types';
import type { NewsSourceConfig } from '../registry/types';

export function normalizeDateToIso(dateStr?: string): string {
  if (!dateStr || typeof dateStr !== 'string') {
    return new Date().toISOString();
  }

  const parsed = new Date(dateStr.trim());
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  return new Date().toISOString();
}

export function cleanHeadline(rawTitle: string): string {
  if (!rawTitle) return '';
  let cleaned = decodeHtmlEntities(rawTitle).trim();

  // Strip common trailing publication suffixes (e.g., " | CNBC", " - Reuters")
  cleaned = cleaned.replace(/\s*[-–|:]\s*(CNBC|Reuters|Bloomberg|BBC News|Yahoo Finance|Ars Technica|CoinDesk|Antara News)\s*$/i, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
}

export function cleanAuthor(rawAuthor?: string): string | null {
  if (!rawAuthor) return null;
  let cleaned = decodeHtmlEntities(stripHtmlTags(rawAuthor)).trim();
  // Strip "By " prefix
  cleaned = cleaned.replace(/^by\s+/i, '').trim();
  return cleaned.length > 0 ? cleaned : null;
}

export class NewsNormalizer {
  public normalize(item: ParsedNewsItem, source: NewsSourceConfig): Article {
    const rawLink = (item.link || '').trim();
    const canonicalUrl = normalizeCanonicalUrl(rawLink);
    const cleanedTitle = cleanHeadline(item.title);
    const cleanedDesc = decodeHtmlEntities(stripHtmlTags(item.description || ''));
    const isoDate = normalizeDateToIso(item.pubDate);
    const author = cleanAuthor(item.author) || source.name;

    const primaryCategory = source.categories[0] || 'markets';
    const primaryRegion = source.regions[0] || 'global';

    const hasImage = Boolean(item.imageUrl && (item.imageUrl.startsWith('http://') || item.imageUrl.startsWith('https://')));
    const imageUrl = hasImage ? item.imageUrl!.trim() : null;
    const imageCredit = hasImage
      ? (item.imageCredit ? decodeHtmlEntities(item.imageCredit) : `Photo via ${source.name}`)
      : null;

    const now = new Date().toISOString();

    return {
      id: crypto.randomUUID ? crypto.randomUUID() : `art_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      title: cleanedTitle,
      description: cleanedDesc,
      content: item.content ? decodeHtmlEntities(item.content) : undefined,
      url: rawLink || canonicalUrl,
      originalUrl: rawLink || canonicalUrl,
      resolvedUrl: rawLink || canonicalUrl,
      linkStatus: 'UNKNOWN',
      source: source.name,
      sourceId: source.id,
      author,
      category: primaryCategory,
      region: primaryRegion,
      publishedAt: isoDate,
      imageUrl,
      imageSource: hasImage ? source.name : null,
      imageCredit,
      imageUsageStatus: hasImage ? 'source_provided' : 'unavailable',
      createdAt: now,
      updatedAt: now,
    };
  }

  public normalizeBatch(items: ParsedNewsItem[], source: NewsSourceConfig): Article[] {
    return items.map(item => this.normalize(item, source));
  }
}

export const newsNormalizer = new NewsNormalizer();
