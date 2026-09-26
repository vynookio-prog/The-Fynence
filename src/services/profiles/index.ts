import { insforge } from '@/lib/insforge';
import { UserProfile, Profile } from '@/types';

export const profileService = {
  /**
   * Fetch user profile from public.profiles table
   */
  getProfile: async (userId: string): Promise<{ data: Profile | null; error: Error | null }> => {
    try {
      const response = await insforge.database
        .from('profiles')
        .select()
        .eq('id', userId)
        .single();

      if (response.error) {
        return { data: null, error: new Error(response.error.message || 'Profile not found') };
      }

      return { data: (response.data || null) as unknown as Profile | null, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error fetching profile') };
    }
  },

  /**
   * Upsert user profile in public.profiles table
   */
  upsertProfile: async (
    profile: Partial<UserProfile> & { id: string }
  ): Promise<{ data: Profile | null; error: Error | null }> => {
    try {
      const response = await insforge.database
        .from('profiles')
        .upsert([profile])
        .select();

      if (response.error) {
        return { data: null, error: new Error(response.error.message || 'Failed to update profile') };
      }

      return { data: (response.data?.[0] || null) as unknown as Profile | null, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error updating profile') };
    }
  },
};

export default profileService;
