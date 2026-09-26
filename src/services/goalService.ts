import { insforge } from '@/lib/insforge';
import { FinancialGoal } from '@/types';

export const goalService = {
  getGoals: async (): Promise<{ data: FinancialGoal[]; error: any }> => {
    try {
      const response = await insforge.database
        .from('financial_goals')
        .select()
        .order('created_at', { ascending: false });
      return { data: response.data || [], error: response.error };
    } catch (error) {
      return { data: [], error };
    }
  },

  createGoal: async (
    goal: Omit<FinancialGoal, 'id' | 'user_id'>
  ): Promise<{ data: FinancialGoal | null; error: any }> => {
    try {
      const response = await insforge.database
        .from('financial_goals')
        .insert([goal])
        .select();
      return { data: response.data?.[0] || null, error: response.error };
    } catch (error) {
      return { data: null, error };
    }
  },

  updateGoal: async (
    id: string,
    updates: Partial<FinancialGoal>
  ): Promise<{ data: FinancialGoal | null; error: any }> => {
    try {
      const response = await insforge.database
        .from('financial_goals')
        .update(updates)
        .eq('id', id)
        .select();
      return { data: response.data?.[0] || null, error: response.error };
    } catch (error) {
      return { data: null, error };
    }
  },

  deleteGoal: async (id: string): Promise<{ error: any }> => {
    try {
      const response = await insforge.database
        .from('financial_goals')
        .delete()
        .eq('id', id);
      return { error: response.error };
    } catch (error) {
      return { error };
    }
  },
};
