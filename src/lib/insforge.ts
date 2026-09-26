import { createClient, type InsForgeClient, type ClientOptions } from '@insforge/sdk';

export const INSFORGE_CONFIG = {
  baseUrl:
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_INSFORGE_URL) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_INSFORGE_URL) ||
    'https://z626btzz.ap-southeast.insforge.app',
  anonKey:
    (typeof process !== 'undefined' && (process.env?.NEXT_PUBLIC_INSFORGE_ANON_KEY || process.env?.NEXT_PUBLIC_INSFORGE_KEY)) ||
    (typeof import.meta !== 'undefined' && ((import.meta as any).env?.VITE_INSFORGE_ANON_KEY || (import.meta as any).env?.VITE_INSFORGE_KEY)) ||
    'anon_2d4e7e73c22808008043d027586461edc5dbfcaa4df5c12d45e133541cf44316',
};

// Polyfill environment variable aliases
if (typeof process !== 'undefined' && process.env) {
  if (!process.env.NEXT_PUBLIC_INSFORGE_URL) {
    process.env.NEXT_PUBLIC_INSFORGE_URL = INSFORGE_CONFIG.baseUrl;
  }
  if (!process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY) {
    process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY = INSFORGE_CONFIG.anonKey;
  }
  if (!process.env.NEXT_PUBLIC_INSFORGE_KEY) {
    process.env.NEXT_PUBLIC_INSFORGE_KEY = INSFORGE_CONFIG.anonKey;
  }
}

export type AppInsForgeClient = InsForgeClient;

let clientInstance: AppInsForgeClient | null = null;

function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const local = localStorage.getItem('insforge_access_token');
    if (local) return local;
  } catch {}
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|;\s*)insforge_access_token=([^;]+)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
  }
  return null;
}

/**
 * Custom fetch implementation for browser that always extracts the current
 * insforge_access_token so requests are never sent unauthenticated.
 */
function browserFetchWithAuth(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  const token = getStoredAccessToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(input, { ...init, headers, credentials: 'include' });
}

/**
 * Resets the client instance so fresh auth state is immediately recognized on login/logout.
 */
export function resetInsForgeClient(): void {
  clientInstance = null;
}

/**
 * Initializes and returns the centralized InsForge client.
 */
export function getInsForgeClient(customOptions?: ClientOptions): AppInsForgeClient {
  if (customOptions) {
    return createClient({
      baseUrl: INSFORGE_CONFIG.baseUrl,
      anonKey: INSFORGE_CONFIG.anonKey,
      ...customOptions,
    });
  }

  if (!clientInstance) {
    const isBrowser = typeof window !== 'undefined';
    const storedToken = getStoredAccessToken();

    clientInstance = createClient({
      baseUrl: INSFORGE_CONFIG.baseUrl,
      anonKey: INSFORGE_CONFIG.anonKey,
      fetch: browserFetchWithAuth,
      accessToken: storedToken || undefined,
    });

    if (isBrowser) {
      // Sync auth state changes to localStorage and cookies
      clientInstance.auth.onAuthStateChange((event, session) => {
        if (session?.accessToken) {
          try {
            localStorage.setItem('insforge_access_token', session.accessToken);
          } catch {}
          if (typeof document !== 'undefined') {
            document.cookie = `insforge_access_token=${encodeURIComponent(session.accessToken)}; path=/; max-age=2592000; SameSite=Lax`;
          }
        } else if (event === 'SIGNED_OUT') {
          try {
            localStorage.removeItem('insforge_access_token');
          } catch {}
          if (typeof document !== 'undefined') {
            document.cookie = `insforge_access_token=; path=/; max-age=0; SameSite=Lax`;
          }
        }
      });
    }
  }

  return clientInstance;
}

/**
 * Factory for creating mobile or custom client instances.
 */
export function createMobileClient(options?: ClientOptions): InsForgeClient {
  return createClient({
    baseUrl: INSFORGE_CONFIG.baseUrl,
    anonKey: INSFORGE_CONFIG.anonKey,
    ...options,
  });
}

/**
 * Compatibility factory for server-side SSR client. In SPA mode, returns the centralized client.
 */
export function createConfiguredServerClient(_options?: any): AppInsForgeClient {
  return getInsForgeClient();
}

/**
 * Compatibility factory for server-side auth actions. In SPA mode, returns the client auth service.
 */
export function createConfiguredAuthActions(_options?: any) {
  return getInsForgeClient().auth;
}

/**
 * Centralized dynamic InsForge client proxy for application data access.
 * Delegates to getInsForgeClient() so the active authenticated client is always used.
 */
export const insforge: AppInsForgeClient = new Proxy({} as AppInsForgeClient, {
  get(_target, prop) {
    const client = getInsForgeClient();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export default insforge;
