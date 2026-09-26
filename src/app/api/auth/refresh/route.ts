import { createRefreshAuthRouter } from '@insforge/sdk/ssr';
import { INSFORGE_CONFIG } from '@/lib/insforge';

export const { POST } = createRefreshAuthRouter({
  baseUrl: INSFORGE_CONFIG.baseUrl,
  anonKey: INSFORGE_CONFIG.anonKey,
});

