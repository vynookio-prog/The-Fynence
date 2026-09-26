import { insforge } from '@/lib/insforge';
import { AIInsight, AIInsightType } from '@/types';

export const aiInsightService = {
  /**
   * Fetch AI insights for the current user
   */
  getInsights: async (
    type?: AIInsightType
  ): Promise<{ data: AIInsight[]; error: Error | null }> => {
    try {
      let query = insforge.database
        .from('ai_insights')
        .select()
        .order('created_at', { ascending: false });

      if (type) {
        query = query.eq('insight_type', type);
      }

      const response = await query;
      if (response.error) {
        return { data: [], error: new Error(response.error.message || 'Failed to fetch AI insights') };
      }

      return { data: (response.data || []) as unknown as AIInsight[], error: null };
    } catch (error) {
      return { data: [], error: error instanceof Error ? error : new Error('Unknown error fetching AI insights') };
    }
  },

  /**
   * Create an AI insight record in PostgreSQL
   */
  createInsight: async (
    insight: Omit<AIInsight, 'id' | 'created_at'> & { id?: string }
  ): Promise<{ data: AIInsight | null; error: Error | null }> => {
    try {
      const response = await insforge.database
        .from('ai_insights')
        .insert([insight])
        .select();

      if (response.error) {
        return { data: null, error: new Error(response.error.message || 'Failed to create AI insight') };
      }

      return { data: (response.data?.[0] || null) as unknown as AIInsight | null, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error creating AI insight') };
    }
  },

  /**
   * Delete an AI insight record
   */
  deleteInsight: async (id: string): Promise<{ error: Error | null }> => {
    try {
      const response = await insforge.database
        .from('ai_insights')
        .delete()
        .eq('id', id);

      if (response.error) {
        return { error: new Error(response.error.message || 'Failed to delete AI insight') };
      }

      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Unknown error deleting AI insight') };
    }
  },
};

export default aiInsightService;
