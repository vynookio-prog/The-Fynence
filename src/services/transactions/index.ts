import { insforge } from '@/lib/insforge';
import { Transaction, Currency } from '@/types';

export const USD_TO_IDR = 16000;

export interface TransactionFilters {
  accountId?: string;
  categoryId?: string;
  type?: 'income' | 'expense';
  startDate?: string;
  endDate?: string;
}

export const transactionService = {
  /**
   * Fetch user transactions with optional filtering
   */
  getTransactions: async (
    filters?: TransactionFilters
  ): Promise<{ data: Transaction[]; error: Error | null }> => {
    try {
      try {
        const { getTransactionsAction } = await import('@/app/actions');
        const res = await getTransactionsAction(filters);
        if (!res.error && res.data) {
          return { data: res.data, error: null };
        }
      } catch {
        // Fallback to client SDK
      }

      let query = insforge.database
        .from('transactions')
        .select()
        .order('transaction_date', { ascending: false });

      if (filters?.accountId) {
        query = query.eq('account_id', filters.accountId);
      }
      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.startDate) {
        query = query.gte('transaction_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('transaction_date', filters.endDate);
      }

      const response = await query;
      if (response.error) {
        return { data: [], error: new Error(response.error.message || 'Failed to fetch transactions') };
      }

      return { data: (response.data || []) as unknown as Transaction[], error: null };
    } catch (error) {
      return { data: [], error: error instanceof Error ? error : new Error('Unknown error fetching transactions') };
    }
  },

  /**
   * Create a new transaction
   */
  createTransaction: async (
    tx: Omit<Transaction, 'id' | 'created_at' | 'updated_at'> & { id?: string }
  ): Promise<{ data: Transaction | null; error: Error | null }> => {
    try {
      try {
        const { createTransactionAction } = await import('@/app/actions');
        const res = await createTransactionAction(tx);
        if (!res.error && res.data) {
          return { data: res.data, error: null };
        }
      } catch {
        // Fallback to client SDK
      }

      const response = await insforge.database
        .from('transactions')
        .insert([tx])
        .select();

      if (response.error) {
        return { data: null, error: new Error(response.error.message || 'Failed to create transaction') };
      }

      return { data: (response.data?.[0] || null) as unknown as Transaction | null, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error creating transaction') };
    }
  },

  /**
   * Update an existing transaction
   */
  updateTransaction: async (
    id: string,
    updates: Partial<Transaction>
  ): Promise<{ data: Transaction | null; error: Error | null }> => {
    try {
      try {
        const { updateTransactionAction } = await import('@/app/actions');
        const res = await updateTransactionAction(id, updates);
        if (!res.error && res.data) {
          return { data: res.data, error: null };
        }
      } catch {
        // Fallback to client SDK
      }

      const response = await insforge.database
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .select();

      if (response.error) {
        return { data: null, error: new Error(response.error.message || 'Failed to update transaction') };
      }

      return { data: (response.data?.[0] || null) as unknown as Transaction | null, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error updating transaction') };
    }
  },

  /**
   * Delete a transaction by ID
   */
  deleteTransaction: async (id: string): Promise<{ error: Error | null }> => {
    try {
      try {
        const { deleteTransactionAction } = await import('@/app/actions');
        const res = await deleteTransactionAction(id);
        if (res.success) {
          return { error: null };
        }
      } catch {
        // Fallback to client SDK
      }

      const response = await insforge.database
        .from('transactions')
        .delete()
        .eq('id', id);

      if (response.error) {
        return { error: new Error(response.error.message || 'Failed to delete transaction') };
      }

      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Unknown error deleting transaction') };
    }
  },

  /**
   * Pure balance delta calculator for account synchronization.
   * Safe for both mobile and web runtimes.
   */
  calculateBalanceDelta: (
    txAmount: number,
    txCurrency: Currency,
    accountCurrency: Currency,
    txType: 'income' | 'expense',
    isReversal = false
  ): number => {
    let amountInAccountCurrency = Number(txAmount);
    if (txCurrency === 'USD' && accountCurrency === 'IDR') {
      amountInAccountCurrency = Number(txAmount) * USD_TO_IDR;
    } else if (txCurrency === 'IDR' && accountCurrency === 'USD') {
      amountInAccountCurrency = Number(txAmount) / USD_TO_IDR;
    }

    const directionModifier = txType === 'income' ? 1 : -1;
    const reversalModifier = isReversal ? -1 : 1;
    return amountInAccountCurrency * directionModifier * reversalModifier;
  },
};

export default transactionService;
