import type { Article } from '../../types/article';
import type { NewspaperStory, NewspaperStoryImage } from '../../renderer/types/document';
import type { RankedArticleCandidate } from '../../engine/ranking/newsRanker';
import type { AIProvider } from '../providers/types';
import { GeminiProvider } from '../providers/geminiProvider';
import { getNewsEngineConfig } from '../../engine/config/newsEngineConfig';

export interface EditorialSelectionOptions {
  editionType?: string;
  targetCount?: number;
  provider?: AIProvider;
  useAi?: boolean;
}

export interface AiSelectedStoryPayload {
  candidateId: string;
  headline: string;
  kicker: string;
  summary: string;
  whyItMatters: string;
  primarySection: string;
  importance: 'high' | 'medium' | 'low';
  keyPoints: string[];
}

export const EDITORIAL_SELECTION_SCHEMA = {
  type: 'object',
  properties: {
    selectedStories: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          candidateId: {
            type: 'string',
            description: 'The exact ID of the candidate article selected',
          },
          headline: {
            type: 'string',
            description: 'Punchy, broadsheet newspaper headline (2-12 words, factual, authoritative)',
          },
          kicker: {
            type: 'string',
            description: 'Category/desk kicker (e.g. MACRO DESK, GLOBAL MARKETS, REAL ECONOMY)',
          },
          summary: {
            type: 'string',
            description: 'Concise editorial synthesis in 2 to 4 factual sentences strictly derived from source text.',
          },
          whyItMatters: {
            type: 'string',
            description: 'Economic or structural significance in 1 to 2 sentences.',
          },
          primarySection: {
            type: 'string',
            description: 'Newspaper section: world, national, business, technology, finance, economy, markets, forex, crypto',
          },
          importance: {
            type: 'string',
            enum: ['high', 'medium', 'low'],
            description: 'Importance level. Limit "high" to 1-2 top lead stories.',
          },
          keyPoints: {
            type: 'array',
            items: { type: 'string' },
            description: '2 to 3 factual bullet points summarizing key data or quotes from source',
          },
        },
        required: ['candidateId', 'headline', 'summary', 'whyItMatters', 'primarySection', 'importance'],
      },
    },
  },
  required: ['selectedStories'],
};

export class EditorialCandidateSelector {
  private defaultProvider: AIProvider;

  constructor(provider?: AIProvider) {
    this.defaultProvider = provider || new GeminiProvider();
  }

  /**
   * Resolves target story count based on edition type and configuration.
   */
  public resolveTargetCount(editionType?: string, customTarget?: number): number {
    if (customTarget && customTarget > 0) return customTarget;
    const config = getNewsEngineConfig();
    switch (editionType) {
      case 'finance_economy':
        return config.financeTarget;
      case 'market':
        return config.marketsTarget;
      case 'economy':
        return config.economyTarget;
      case 'daily':
      default:
        return config.dailyNewsTarget;
    }
  }

  /**
   * Selects and synthesizes final newspaper stories from the ranked candidate pool.
   */
  public async selectStories(
    candidates: RankedArticleCandidate[],
    options: EditorialSelectionOptions = {}
  ): Promise<NewspaperStory[]> {
    if (candidates.length === 0) {
      return [];
    }

    const editionType = options.editionType || 'daily';
    const targetCount = this.resolveTargetCount(editionType, options.targetCount);
    const candidateMap = new Map<string, RankedArticleCandidate>();
    for (const c of candidates) {
      candidateMap.set(c.article.id, c);
    }

    const provider = options.provider || this.defaultProvider;
    const isAiEnabled = options.useAi !== false && Boolean(process.env.GEMINI_API_KEY);

    if (isAiEnabled) {
      try {
        const aiStories = await this.selectViaAi(candidates, targetCount, editionType, provider, candidateMap);
        if (aiStories.length >= Math.min(5, candidates.length)) {
          return aiStories;
        }
      } catch (err: any) {
        console.warn(`[EditorialCandidateSelector] AI selection fallback triggered: ${err?.message}`);
      }
    }

    // Deterministic High-Quality Fallback (Zero Hallucination, Zero Loss)
    return this.selectDeterministically(candidates, targetCount);
  }

  /**
   * AI-powered selection and broadsheet editorial synthesis via Gemini.
   */
  private async selectViaAi(
    candidates: RankedArticleCandidate[],
    targetCount: number,
    editionType: string,
    provider: AIProvider,
    candidateMap: Map<string, RankedArticleCandidate>
  ): Promise<NewspaperStory[]> {
    // Build candidate representation for Gemini prompt
    const candidateDescriptions = candidates.slice(0, 40).map((c, i) => {
      const art = c.article;
      const corroborating = c.corroboratingSources.length > 0
        ? ` (Corroborated by: ${c.corroboratingSources.map(s => s.source).join(', ')})`
        : '';
      return `[Candidate ${i + 1}] ID: ${art.id}
Source: ${art.source}${corroborating}
Category: ${art.category}
Headline: ${art.title}
Published: ${art.publishedAt}
Summary: ${art.description || art.content?.slice(0, 300) || art.title}`;
    }).join('\n\n');

    const prompt = `You are the Editor-in-Chief of THE FYNENCE broadsheet newspaper.
We are curating the "${editionType.toUpperCase()}" edition.
Select up to ${targetCount} of the most structurally impactful, significant stories from the candidates below.

EDITORIAL CRITERIA:
1. Select exactly up to ${targetCount} stories across diverse categories.
2. Select 1 or 2 lead stories and mark importance as "high".
3. Write authoritative, objective broadsheet headlines (no clickbait, no jargon exaggeration).
4. Synthesize verified details into a concise 2-4 sentence summary.
5. Provide a "Why It Matters" note (1-2 sentences on financial or macroeconomic impact).
6. Provide 2-3 key points.
7. Set candidateId to the EXACT candidate ID from the list.

STRICT VERACITY RULES:
- Never fabricate data, events, or quotes not present in the candidate descriptions.
- Preserve the exact candidate ID.

CANDIDATES:
${candidateDescriptions}`;

    const res = await provider.generateStructured<{ selectedStories: AiSelectedStoryPayload[] }>(
      prompt,
      EDITORIAL_SELECTION_SCHEMA,
      {
        systemInstruction: 'You are the Editor-in-Chief of THE FYNENCE, an elite financial broadsheet. Conform strictly to verified facts in the candidate list.',
        temperature: 0.2,
        timeoutMs: 15000,
        retries: 1,
      }
    );

    if (!res.success || !res.data || !Array.isArray(res.data.selectedStories)) {
      throw new Error(res.error || 'Invalid or empty structured response from AI provider');
    }

    const stories: NewspaperStory[] = [];
    const usedCandidateIds = new Set<string>();

    for (let idx = 0; idx < res.data.selectedStories.length; idx++) {
      const s = res.data.selectedStories[idx];
      const matched = candidateMap.get(s.candidateId);
      if (!matched || usedCandidateIds.has(s.candidateId)) continue;

      usedCandidateIds.add(s.candidateId);
      const art = matched.article;

      // Anti-AI Image Preservation: use original publisher image only
      let image: NewspaperStoryImage | undefined = undefined;
      if (art.imageUrl && art.imageUsageStatus !== 'unavailable') {
        image = {
          url: art.imageUrl,
          credit: art.imageCredit || art.source,
          source: art.imageSource || art.source,
          caption: `${art.source} dispatch photo`,
          aspectRatio: '16:9',
          isAiGenerated: false,
        };
      }

      const importance = s.importance || (idx === 0 ? 'high' : 'medium');
      const columnSpan = importance === 'high' ? 3 : importance === 'medium' ? 2 : 1;

      stories.push({
        id: `story-${idx + 1}`,
        headline: s.headline || art.title,
        kicker: s.kicker || `${(s.primarySection || art.category).toUpperCase()} DESK`,
        summary: s.summary || art.description || art.title,
        whyItMatters: s.whyItMatters || 'Structural developments across institutions continue to guide cross-asset capital allocation.',
        keyPoints: s.keyPoints && s.keyPoints.length > 0 ? s.keyPoints : [art.title],
        source: art.source,
        originalUrl: art.url,
        author: art.author || undefined,
        publishedAt: art.publishedAt,
        section: s.primarySection || art.category,
        importance,
        columnSpan,
        image,
      });
    }

    return stories;
  }

  /**
   * Deterministic selection directly from top ranked candidates.
   * Guarantees that the newspaper is never empty even if AI services are down.
   */
  public selectDeterministically(
    candidates: RankedArticleCandidate[],
    targetCount: number
  ): NewspaperStory[] {
    const selected = candidates.slice(0, targetCount);

    return selected.map((cand, idx) => {
      const art = cand.article;
      const isLead = idx === 0;
      const importance: NewspaperStory['importance'] = isLead ? 'high' : idx < 4 ? 'medium' : 'low';
      const columnSpan = importance === 'high' ? 3 : importance === 'medium' ? 2 : 1;

      let image: NewspaperStoryImage | undefined = undefined;
      if (art.imageUrl && art.imageUsageStatus !== 'unavailable') {
        image = {
          url: art.imageUrl,
          credit: art.imageCredit || art.source,
          source: art.imageSource || art.source,
          caption: `${art.source} archive wire`,
          aspectRatio: '16:9',
          isAiGenerated: false,
        };
      }

      const keyPoints: string[] = [];
      if (cand.corroboratingSources.length > 0) {
        keyPoints.push(`Corroborated across wires by ${cand.corroboratingSources.map(s => s.source).join(', ')}`);
      }
      keyPoints.push(`Reported by ${art.source} on ${new Date(art.publishedAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`);

      return {
        id: `story-${idx + 1}`,
        headline: art.title,
        kicker: `${art.category.toUpperCase()} DISPATCH · ${art.source.toUpperCase()}`,
        summary: art.description || art.content?.slice(0, 350) || art.title,
        whyItMatters: `Policy adjustments and sovereign market dynamics continue to drive institutional liquidity and capital allocation.`,
        keyPoints,
        source: art.source,
        originalUrl: art.url,
        author: art.author || undefined,
        publishedAt: art.publishedAt,
        section: art.category,
        importance,
        columnSpan,
        image,
      };
    });
  }
}

export const editorialCandidateSelector = new EditorialCandidateSelector();
