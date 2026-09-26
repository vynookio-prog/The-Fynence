import { insforge } from '@/lib/insforge';
import { FinancialAccount } from '@/types';

export const financialAccountService = {
  getAccounts: async (): Promise<{ data: FinancialAccount[]; error: any }> => {
    try {
      try {
        const { getFinancialAccountsAction } = await import('@/app/actions');
        const res = await getFinancialAccountsAction();
        if (!res.error && res.data) {
          return { data: res.data, error: null };
        }
      } catch {
        // Fallback to client SDK
      }

      const response = await insforge.database
        .from('financial_accounts')
        .select()
        .order('created_at', { ascending: false });
      return { data: response.data || [], error: response.error };
    } catch (error) {
      return { data: [], error };
    }
  },

  createAccount: async (
    account: Omit<FinancialAccount, 'id' | 'user_id'>
  ): Promise<{ data: FinancialAccount | null; error: any }> => {
    try {
      try {
        const { createFinancialAccountAction } = await import('@/app/actions');
        const res = await createFinancialAccountAction(account);
        if (!res.error && res.data) {
          return { data: res.data, error: null };
        }
      } catch {
        // Fallback to client SDK
      }

      const response = await insforge.database
        .from('financial_accounts')
        .insert([account])
        .select();
      return { data: response.data?.[0] || null, error: response.error };
    } catch (error) {
      return { data: null, error };
    }
  },

  updateAccount: async (
    id: string,
    updates: Partial<FinancialAccount>
  ): Promise<{ data: FinancialAccount | null; error: any }> => {
    try {
      try {
        const { updateFinancialAccountAction } = await import('@/app/actions');
        const res = await updateFinancialAccountAction(id, updates);
        if (!res.error && res.data) {
          return { data: res.data, error: null };
        }
      } catch {
        // Fallback to client SDK
      }

      const response = await insforge.database
        .from('financial_accounts')
        .update(updates)
        .eq('id', id)
        .select();
      return { data: response.data?.[0] || null, error: response.error };
    } catch (error) {
      return { data: null, error };
    }
  },

  deleteAccount: async (id: string): Promise<{ error: any }> => {
    try {
      try {
        const { deleteFinancialAccountAction } = await import('@/app/actions');
        const res = await deleteFinancialAccountAction(id);
        if (res.success) {
          return { error: null };
        }
      } catch {
        // Fallback to client SDK
      }

      const response = await insforge.database
        .from('financial_accounts')
        .delete()
        .eq('id', id);
      return { error: response.error };
    } catch (error) {
      return { error };
    }
  },
};
