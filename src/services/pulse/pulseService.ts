import 'server-only';
import { fetchMacroEconomicNews } from '@/services/news/newsApiService';
import { analyzeNewsWithGemini } from './pulseAiService';
import { FynencePulseData } from '@/types/pulse';

interface PulseCache {
  data: FynencePulseData | null;
  cachedAt: number;
}

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes TTL
const MIN_REFRESH_INTERVAL_MS = 60 * 1000; // 1 minute cooldown to protect NewsAPI limits

// In-memory server cache
let globalPulseCache: PulseCache = {
  data: null,
  cachedAt: 0,
};

let activeFetchPromise: Promise<FynencePulseData> | null = null;

export const pulseService = {
  /**
   * Get the latest Fynence Pulse economic intelligence report.
   * Leverages 30-minute server cache and NewsAPI + Gemini AI analysis.
   */
  async getFynencePulse(forceRefresh = false): Promise<FynencePulseData> {
    const now = Date.now();

    // Check if cache is still fresh and forceRefresh is not requested
    if (!forceRefresh && globalPulseCache.data && now - globalPulseCache.cachedAt < CACHE_TTL_MS) {
      return {
        ...globalPulseCache.data,
        status: 'cached',
      };
    }

    // Rate-limit forced refreshes to protect third-party API quotas
    if (forceRefresh && globalPulseCache.data && now - globalPulseCache.cachedAt < MIN_REFRESH_INTERVAL_MS) {
      return {
        ...globalPulseCache.data,
        status: 'cached',
      };
    }

    // If another request is currently fetching, reuse that promise to avoid duplicate concurrent calls
    if (activeFetchPromise) {
      return activeFetchPromise;
    }

    activeFetchPromise = (async () => {
      try {
        // Step 1: Fetch latest macroeconomic news via NewsAPI (or curated fallback)
        const newsResult = await fetchMacroEconomicNews();

        // Step 2: Analyze articles and market sentiment with Gemini AI
        const pulseData = await analyzeNewsWithGemini(newsResult.articles, newsResult.source);

        // Update in-memory cache
        globalPulseCache = {
          data: pulseData,
          cachedAt: Date.now(),
        };

        return pulseData;
      } finally {
        activeFetchPromise = null;
      }
    })();

    return activeFetchPromise;
  },

  /**
   * Reset cache (for administrative testing or testing suites)
   */
  clearCache() {
    globalPulseCache = {
      data: null,
      cachedAt: 0,
    };
  },
};

export default pulseService;
