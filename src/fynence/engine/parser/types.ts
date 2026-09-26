export interface ParsedNewsItem {
  title: string;
  link: string;
  description?: string;
  content?: string;
  author?: string;
  pubDate?: string;
  categories?: string[];
  imageUrl?: string;
  imageCredit?: string;
  guid?: string;
}

export interface ParsedFeed {
  title: string;
  description?: string;
  link?: string;
  items: ParsedNewsItem[];
}
