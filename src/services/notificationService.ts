import { insforge } from '@/lib/insforge';
import { AppNotification } from '@/types';

export const notificationService = {
  getNotifications: async (): Promise<{ data: AppNotification[]; error: Error | null }> => {
    try {
      const response = await insforge.database
        .from('notifications')
        .select()
        .order('created_at', { ascending: false });

      if (response.error) {
        return { data: [], error: new Error(response.error.message || 'Failed to fetch notifications') };
      }

      const notifications = (response.data || []) as unknown as AppNotification[];
      return { data: notifications, error: null };
    } catch (error) {
      return { data: [], error: error instanceof Error ? error : new Error('Unknown error') };
    }
  },

  createNotification: async (
    notification: Omit<AppNotification, 'id' | 'created_at' | 'user_id'>
  ): Promise<{ data: AppNotification | null; error: Error | null }> => {
    try {
      const response = await insforge.database
        .from('notifications')
        .insert([notification])
        .select();

      if (response.error) {
        return { data: null, error: new Error(response.error.message || 'Failed to create notification') };
      }

      const created = (response.data?.[0] || null) as unknown as AppNotification | null;
      return { data: created, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  },

  markAsRead: async (id: string): Promise<{ error: Error | null }> => {
    try {
      const response = await insforge.database
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (response.error) {
        return { error: new Error(response.error.message || 'Failed to mark notification as read') };
      }

      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  },

  markAllAsRead: async (userId: string): Promise<{ error: Error | null }> => {
    try {
      const response = await insforge.database
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (response.error) {
        return { error: new Error(response.error.message || 'Failed to mark all as read') };
      }

      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  },

  deleteNotification: async (id: string): Promise<{ error: Error | null }> => {
    try {
      const response = await insforge.database
        .from('notifications')
        .delete()
        .eq('id', id);

      if (response.error) {
        return { error: new Error(response.error.message || 'Failed to delete notification') };
      }

      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  },
};
