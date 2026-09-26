import type { ParsedFeed, ParsedNewsItem } from './types';

export function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

export function stripHtmlTags(html: string): string {
  if (!html) return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<\/?[^>]+(>|$)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTagContent(xml: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}[^>]*>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))<\\/${tagName}>`, 'i');
  const match = xml.match(regex);
  if (match) {
    const val = match[1] !== undefined ? match[1] : match[2] || '';
    return val.trim();
  }
  return '';
}

function extractAllTags(xml: string, tagName: string): string[] {
  const results: string[] = [];
  const regex = new RegExp(`<${tagName}[^>]*>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))<\\/${tagName}>`, 'gi');
  let match: RegExpExecArray | null;
  while ((match = regex.exec(xml)) !== null) {
    const val = (match[1] !== undefined ? match[1] : match[2] || '').trim();
    if (val) results.push(val);
  }
  return results;
}

function extractAttribute(tagString: string, attrName: string): string {
  const match = tagString.match(new RegExp(`${attrName}=["']([^"']+)["']`, 'i'));
  return match ? match[1] : '';
}

function extractImageFromXmlChunk(chunk: string): string | undefined {
  // 1. Check media:content or media:thumbnail
  const mediaMatch = chunk.match(/<media:(?:content|thumbnail)[^>]+>/i);
  if (mediaMatch) {
    const url = extractAttribute(mediaMatch[0], 'url');
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      return url;
    }
  }

  // 2. Check enclosure
  const enclosureMatch = chunk.match(/<enclosure[^>]+>/i);
  if (enclosureMatch) {
    const type = extractAttribute(enclosureMatch[0], 'type');
    const url = extractAttribute(enclosureMatch[0], 'url');
    if (url && (!type || type.startsWith('image/'))) {
      return url;
    }
  }

  // 3. Check embedded <img> tag in description or content
  const imgMatch = chunk.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch && imgMatch[1]) {
    const src = imgMatch[1];
    if (src.startsWith('http://') || src.startsWith('https://')) {
      return src;
    }
  }

  return undefined;
}

export function parseRssOrAtom(xmlContent: string): ParsedFeed {
  const cleanXml = xmlContent.trim();
  const isAtom = cleanXml.includes('<feed') && cleanXml.includes('xmlns="http://www.w3.org/2005/Atom"');

  const firstItemIndex = isAtom ? cleanXml.search(/<entry[\s>]/i) : cleanXml.search(/<item[\s>]/i);
  const headerXml = firstItemIndex !== -1 ? cleanXml.slice(0, firstItemIndex) : cleanXml;

  const feedTitle = decodeHtmlEntities(extractTagContent(headerXml, 'title'));
  const feedDesc = decodeHtmlEntities(extractTagContent(headerXml, 'description'));
  let feedLink = extractTagContent(headerXml, 'link');
  if (isAtom && !feedLink) {
    const linkMatch = headerXml.match(/<link[^>]+href=["']([^"']+)["']/i);
    if (linkMatch) feedLink = linkMatch[1];
  }

  const items: ParsedNewsItem[] = [];

  if (isAtom) {
    const entryMatches = cleanXml.split(/<entry[\s>]/i).slice(1);
    for (const rawEntry of entryMatches) {
      const entryChunk = rawEntry.split(/<\/entry>/i)[0];
      if (!entryChunk) continue;

      const title = decodeHtmlEntities(extractTagContent(entryChunk, 'title'));
      let link = '';
      const linkMatch = entryChunk.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i);
      if (linkMatch) {
        link = linkMatch[1];
      } else {
        link = extractTagContent(entryChunk, 'link');
      }

      const summary = extractTagContent(entryChunk, 'summary') || extractTagContent(entryChunk, 'content');
      const published = extractTagContent(entryChunk, 'published') || extractTagContent(entryChunk, 'updated');
      const author = extractTagContent(entryChunk, 'name') || extractTagContent(entryChunk, 'author');
      const imageUrl = extractImageFromXmlChunk(entryChunk);
      const categories = extractAllTags(entryChunk, 'category');

      if (title && link) {
        items.push({
          title,
          link: link.trim(),
          description: decodeHtmlEntities(stripHtmlTags(summary)),
          content: summary,
          author: author ? decodeHtmlEntities(author) : undefined,
          pubDate: published || undefined,
          imageUrl,
          categories: categories.map(c => decodeHtmlEntities(c)),
        });
      }
    }
  } else {
    // RSS 2.0 / 1.0 items
    const itemMatches = cleanXml.split(/<item[\s>]/i).slice(1);
    for (const rawItem of itemMatches) {
      const itemChunk = rawItem.split(/<\/item>/i)[0];
      if (!itemChunk) continue;

      const title = decodeHtmlEntities(extractTagContent(itemChunk, 'title'));
      let link = extractTagContent(itemChunk, 'link');
      if (!link) {
        const linkMatch = itemChunk.match(/<link[^>]*>([^<]+)<\/link>/i);
        if (linkMatch) link = linkMatch[1];
      }

      // Sometimes GUID is a permalink
      if (!link) {
        const guid = extractTagContent(itemChunk, 'guid');
        if (guid && (guid.startsWith('http://') || guid.startsWith('https://'))) {
          link = guid;
        }
      }

      const description = extractTagContent(itemChunk, 'description');
      const contentEncoded = extractTagContent(itemChunk, 'content:encoded');
      const author =
        extractTagContent(itemChunk, 'dc:creator') ||
        extractTagContent(itemChunk, 'author') ||
        extractTagContent(itemChunk, 'creator');
      const pubDate = extractTagContent(itemChunk, 'pubDate') || extractTagContent(itemChunk, 'dc:date');
      const imageUrl = extractImageFromXmlChunk(itemChunk);
      const categories = extractAllTags(itemChunk, 'category');

      if (title && link) {
        items.push({
          title,
          link: link.trim(),
          description: decodeHtmlEntities(stripHtmlTags(description || contentEncoded)),
          content: contentEncoded || description,
          author: author ? decodeHtmlEntities(author) : undefined,
          pubDate: pubDate || undefined,
          imageUrl,
          categories: categories.map(c => decodeHtmlEntities(c)),
          guid: extractTagContent(itemChunk, 'guid') || undefined,
        });
      }
    }
  }

  return {
    title: feedTitle,
    description: feedDesc,
    link: feedLink,
    items,
  };
}
