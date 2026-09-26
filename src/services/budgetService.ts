import { insforge } from '@/lib/insforge';
import { Budget } from '@/types';

export const budgetService = {
  getBudgets: async (): Promise<{ data: Budget[]; error: any }> => {
    try {
      const response = await insforge.database
        .from('budgets')
        .select()
        .order('created_at', { ascending: false });
      return { data: response.data || [], error: response.error };
    } catch (error) {
      return { data: [], error };
    }
  },

  createBudget: async (
    budget: Omit<Budget, 'id' | 'user_id'>
  ): Promise<{ data: Budget | null; error: any }> => {
    try {
      const response = await insforge.database
        .from('budgets')
        .insert([budget])
        .select();
      return { data: response.data?.[0] || null, error: response.error };
    } catch (error) {
      return { data: null, error };
    }
  },

  updateBudget: async (
    id: string,
    updates: Partial<Budget>
  ): Promise<{ data: Budget | null; error: any }> => {
    try {
      const response = await insforge.database
        .from('budgets')
        .update(updates)
        .eq('id', id)
        .select();
      return { data: response.data?.[0] || null, error: response.error };
    } catch (error) {
      return { data: null, error };
    }
  },

  deleteBudget: async (id: string): Promise<{ error: any }> => {
    try {
      const response = await insforge.database
        .from('budgets')
        .delete()
        .eq('id', id);
      return { error: response.error };
    } catch (error) {
      return { error };
    }
  },
};
