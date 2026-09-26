import { insforge } from '@/lib/insforge';
import type {
  DbArticle,
  DbArticleImage,
  DbEdition,
  DbEditionArticle,
  DbMarketSnapshot,
  DbNewsSource,
  DbTelegramDelivery,
  DbWeatherSnapshot,
} from '../types/database';

export interface IFynenceRepository {
  // News Sources
  getActiveNewsSources(): Promise<{ data: DbNewsSource[]; error: Error | null }>;
  createNewsSource(source: Omit<DbNewsSource, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: DbNewsSource | null; error: Error | null }>;

  // Articles
  getRecentArticles(category?: string, limit?: number): Promise<{ data: DbArticle[]; error: Error | null }>;
  insertArticles(articles: Array<Omit<DbArticle, 'id' | 'created_at' | 'updated_at'>>): Promise<{ data: DbArticle[]; error: Error | null }>;

  // Article Images
  recordArticleImage(image: Omit<DbArticleImage, 'id' | 'created_at'>): Promise<{ data: DbArticleImage | null; error: Error | null }>;

  // Market Snapshots
  saveMarketSnapshot(snapshot: Omit<DbMarketSnapshot, 'id' | 'created_at'>): Promise<{ data: DbMarketSnapshot | null; error: Error | null }>;
  getLatestMarketSnapshot(): Promise<{ data: DbMarketSnapshot | null; error: Error | null }>;

  // Weather Snapshots
  saveWeatherSnapshot(snapshot: Omit<DbWeatherSnapshot, 'id' | 'created_at'>): Promise<{ data: DbWeatherSnapshot | null; error: Error | null }>;
  getLatestWeatherSnapshot(location: string): Promise<{ data: DbWeatherSnapshot | null; error: Error | null }>;

  // Editions
  saveEdition(edition: Omit<DbEdition, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: DbEdition | null; error: Error | null }>;
  getEditionById(id: string): Promise<{ data: DbEdition | null; error: Error | null }>;
  updateEditionStatus(id: string, status: DbEdition['status']): Promise<{ error: Error | null }>;

  // Telegram Deliveries
  recordTelegramDelivery(delivery: Omit<DbTelegramDelivery, 'id'>): Promise<{ data: DbTelegramDelivery | null; error: Error | null }>;
}

export class InsForgeFynenceRepository implements IFynenceRepository {
  async getActiveNewsSources(): Promise<{ data: DbNewsSource[]; error: Error | null }> {
    try {
      const response = await insforge.database
        .from('news_sources')
        .select()
        .eq('is_active', true);

      if (response.error) {
        return { data: [], error: new Error(response.error.message) };
      }
      return { data: (response.data || []) as unknown as DbNewsSource[], error: null };
    } catch (err) {
      return { data: [], error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async createNewsSource(
    source: Omit<DbNewsSource, 'id' | 'created_at' | 'updated_at'>
  ): Promise<{ data: DbNewsSource | null; error: Error | null }> {
    try {
      const response = await insforge.database
        .from('news_sources')
        .insert([source])
        .select()
        .single();

      if (response.error) {
        return { data: null, error: new Error(response.error.message) };
      }
      return { data: response.data as unknown as DbNewsSource, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async getRecentArticles(
    category?: string,
    limit = 50
  ): Promise<{ data: DbArticle[]; error: Error | null }> {
    try {
      let query = insforge.database
        .from('articles')
        .select()
        .order('published_at', { ascending: false })
        .limit(limit);

      if (category) {
        query = query.eq('category', category);
      }

      const response = await query;
      if (response.error) {
        return { data: [], error: new Error(response.error.message) };
      }
      return { data: (response.data || []) as unknown as DbArticle[], error: null };
    } catch (err) {
      return { data: [], error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async insertArticles(
    articles: Array<Omit<DbArticle, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<{ data: DbArticle[]; error: Error | null }> {
    try {
      const response = await insforge.database
        .from('articles')
        .insert(articles)
        .select();

      if (response.error) {
        return { data: [], error: new Error(response.error.message) };
      }
      return { data: (response.data || []) as unknown as DbArticle[], error: null };
    } catch (err) {
      return { data: [], error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async recordArticleImage(
    image: Omit<DbArticleImage, 'id' | 'created_at'>
  ): Promise<{ data: DbArticleImage | null; error: Error | null }> {
    try {
      const response = await insforge.database
        .from('article_images')
        .insert([image])
        .select()
        .single();

      if (response.error) {
        return { data: null, error: new Error(response.error.message) };
      }
      return { data: response.data as unknown as DbArticleImage, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async saveMarketSnapshot(
    snapshot: Omit<DbMarketSnapshot, 'id' | 'created_at'>
  ): Promise<{ data: DbMarketSnapshot | null; error: Error | null }> {
    try {
      const response = await insforge.database
        .from('market_snapshots')
        .insert([snapshot])
        .select()
        .single();

      if (response.error) {
        return { data: null, error: new Error(response.error.message) };
      }
      return { data: response.data as unknown as DbMarketSnapshot, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async getLatestMarketSnapshot(): Promise<{ data: DbMarketSnapshot | null; error: Error | null }> {
    try {
      const response = await insforge.database
        .from('market_snapshots')
        .select()
        .order('captured_at', { ascending: false })
        .limit(1)
        .single();

      if (response.error) {
        return { data: null, error: new Error(response.error.message) };
      }
      return { data: response.data as unknown as DbMarketSnapshot, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async saveWeatherSnapshot(
    snapshot: Omit<DbWeatherSnapshot, 'id' | 'created_at'>
  ): Promise<{ data: DbWeatherSnapshot | null; error: Error | null }> {
    try {
      const response = await insforge.database
        .from('weather_snapshots')
        .insert([snapshot])
        .select()
        .single();

      if (response.error) {
        return { data: null, error: new Error(response.error.message) };
      }
      return { data: response.data as unknown as DbWeatherSnapshot, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async getLatestWeatherSnapshot(
    location: string
  ): Promise<{ data: DbWeatherSnapshot | null; error: Error | null }> {
    try {
      const response = await insforge.database
        .from('weather_snapshots')
        .select()
        .eq('location', location)
        .order('captured_at', { ascending: false })
        .limit(1)
        .single();

      if (response.error) {
        return { data: null, error: new Error(response.error.message) };
      }
      return { data: response.data as unknown as DbWeatherSnapshot, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async saveEdition(
    edition: Omit<DbEdition, 'id' | 'created_at' | 'updated_at'>
  ): Promise<{ data: DbEdition | null; error: Error | null }> {
    try {
      const response = await insforge.database
        .from('editions')
        .insert([edition])
        .select()
        .single();

      if (response.error) {
        return { data: null, error: new Error(response.error.message) };
      }
      return { data: response.data as unknown as DbEdition, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async getEditionById(id: string): Promise<{ data: DbEdition | null; error: Error | null }> {
    try {
      const response = await insforge.database
        .from('editions')
        .select()
        .eq('id', id)
        .single();

      if (response.error) {
        return { data: null, error: new Error(response.error.message) };
      }
      return { data: response.data as unknown as DbEdition, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async updateEditionStatus(
    id: string,
    status: DbEdition['status']
  ): Promise<{ error: Error | null }> {
    try {
      const response = await insforge.database
        .from('editions')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (response.error) {
        return { error: new Error(response.error.message) };
      }
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async recordTelegramDelivery(
    delivery: Omit<DbTelegramDelivery, 'id'>
  ): Promise<{ data: DbTelegramDelivery | null; error: Error | null }> {
    try {
      const response = await insforge.database
        .from('telegram_deliveries')
        .insert([delivery])
        .select()
        .single();

      if (response.error) {
        return { data: null, error: new Error(response.error.message) };
      }
      return { data: response.data as unknown as DbTelegramDelivery, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }
}

export const fynenceRepository = new InsForgeFynenceRepository();
