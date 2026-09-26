import crypto from 'crypto';
import type { Article } from '../../types/article';
import type { EditorialStory } from '../types';

export class EditorialCache {
  private inMemoryCache: Map<string, EditorialStory> = new Map();

  /**
   * Computes a deterministic SHA-256 fingerprint for an article and any corroborating articles.
   */
  public computeHash(primaryArticle: Article, relatedArticles: Article[] = []): string {
    const sortedRelated = [...relatedArticles].sort((a, b) => a.id.localeCompare(b.id));
    const payload = [
      primaryArticle.title.trim(),
      primaryArticle.description.trim(),
      (primaryArticle.content || '').slice(0, 1500).trim(),
      primaryArticle.imageUrl || '',
      ...sortedRelated.map(r => `${r.title.trim()}|${r.description.trim()}`),
    ].join(':::');

    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  public get(contentHash: string, promptVersion: string): EditorialStory | undefined {
    const key = `${contentHash}:${promptVersion}`;
    return this.inMemoryCache.get(key);
  }

  public set(contentHash: string, promptVersion: string, story: EditorialStory): void {
    const key = `${contentHash}:${promptVersion}`;
    this.inMemoryCache.set(key, story);
  }

  public has(contentHash: string, promptVersion: string): boolean {
    const key = `${contentHash}:${promptVersion}`;
    return this.inMemoryCache.has(key);
  }

  public clear(): void {
    this.inMemoryCache.clear();
  }

  public size(): number {
    return this.inMemoryCache.size;
  }
}

export const editorialCache = new EditorialCache();
