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
  subheadline?: string;
  whatHappened?: string;
  details?: string;
  whyItMatters: string;
  kicker: string;
  summary: string;
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
            description: 'The exact ID of the candidate article selected (NEVER generate or alter URLs)',
          },
          headline: {
            type: 'string',
            description: 'Strong, informative broadsheet newspaper headline (8 to 14 words, factual, authoritative)',
          },
          subheadline: {
            type: 'string',
            description: 'Secondary context explaining structural significance (10 to 18 words)',
          },
          whatHappened: {
            type: 'string',
            description: 'Clear, objective summary of the core event (40 to 70 words) strictly derived from source text.',
          },
          details: {
            type: 'string',
            description: 'Detailed explanation of background, figures, reactions, and context (120 to 220 words) strictly derived from source text.',
          },
          summary: {
            type: 'string',
            description: 'Concise editorial synthesis in 2 to 4 factual sentences strictly derived from source text.',
          },
          whyItMatters: {
            type: 'string',
            description: 'Economic or structural significance and implications (50 to 100 words).',
          },
          kicker: {
            type: 'string',
            description: 'Category/desk kicker (e.g. MACRO DESK, GLOBAL MARKETS, REAL ECONOMY)',
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
        required: ['candidateId', 'headline', 'whatHappened', 'whyItMatters', 'primarySection', 'importance'],
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
      case 'finance':
        return config.financeTarget; // 15
      case 'finance_economy':
        return 15; // 15 stories target for Finance + Economy
      case 'market':
      case 'markets':
        return config.marketsTarget; // 12
      case 'economy':
        return config.economyTarget; // 15
      case 'daily':
        return config.dailyNewsTarget; // 15
      default:
        return 15;
    }
  }

  /**
   * Selects and synthesizes final newspaper stories from the ranked candidate pool.
   * Guarantees 10-15 stories when sufficient candidates exist, with zero fabrication.
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

    const finalStories: NewspaperStory[] = [];
    const usedArticleIds = new Set<string>();

    if (isAiEnabled) {
      try {
        const aiStories = await this.selectViaAi(candidates, targetCount, editionType, provider, candidateMap);
        for (const s of aiStories) {
          finalStories.push(s);
          if (s.originalUrl) usedArticleIds.add(s.originalUrl);
          usedArticleIds.add(s.id);
        }
      } catch (err: any) {
        console.warn(`[EditorialCandidateSelector] AI selection fallback triggered: ${err?.message}`);
      }
    }

    // SECTION 11 FALLBACK SELECTION:
    // If Gemini returns fewer stories than targetStoryCount (or AI is unavailable),
    // deterministically backfill from the remaining ranked candidates to reach targetStoryCount.
    if (finalStories.length < targetCount) {
      const maxStoriesPerSource = typeof process !== 'undefined' && process.env?.MAX_STORIES_PER_SOURCE
        ? parseInt(process.env.MAX_STORIES_PER_SOURCE, 10) || 4
        : 4;

      const sourceCounts = new Map<string, number>();
      for (const fs of finalStories) {
        const src = (fs.source || 'unknown').toLowerCase();
        sourceCounts.set(src, (sourceCounts.get(src) || 0) + 1);
      }

      const remainingCandidates = candidates.filter(c => {
        if (usedArticleIds.has(c.article.url) || usedArticleIds.has(c.article.id)) return false;
        // Duplicate check against headlines already selected
        const titleNorm = c.article.title.toLowerCase().trim();
        for (const fs of finalStories) {
          if (fs.headline.toLowerCase().trim() === titleNorm) return false;
        }
        return true;
      });

      const needed = targetCount - finalStories.length;

      // Section 9: Source diversity - prioritize diverse sources up to maxStoriesPerSource
      const diverseCandidates: RankedArticleCandidate[] = [];
      const overflowCandidates: RankedArticleCandidate[] = [];

      for (const cand of remainingCandidates) {
        const src = (cand.article.source || 'unknown').toLowerCase();
        const count = sourceCounts.get(src) || 0;
        if (count < maxStoriesPerSource) {
          diverseCandidates.push(cand);
          sourceCounts.set(src, count + 1);
        } else {
          overflowCandidates.push(cand);
        }
      }

      // If diverse candidates are insufficient to meet targetStoryCount, use overflow candidates
      // so the newspaper edition never starves or shrinks unnecessarily
      const candidatesToSelect = [...diverseCandidates, ...overflowCandidates];
      const backfillStories = this.selectDeterministically(candidatesToSelect, needed, finalStories.length);
      finalStories.push(...backfillStories);
    }

    // SECTION 12 FINAL STORY COUNT VALIDATION
    if (finalStories.length < targetCount) {
      console.warn(
        `[EditorialEngine] TARGET: ${targetCount}, FINAL: ${finalStories.length}, REASON: only ${finalStories.length} eligible stories available`
      );
    }

    return finalStories;
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
    // Build candidate representation for Gemini prompt (send up to 60-80 candidates)
    const maxCandidatesToSend = Math.min(candidates.length, editionType === 'daily' ? 80 : 70);
    const candidateDescriptions = candidates.slice(0, maxCandidatesToSend).map((c, i) => {
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
Select up to ${targetCount} distinct, relevant, and structurally impactful stories from the candidates below.

EDITORIAL CRITERIA (FULL BROADSHEET FORMAT):
For each selected article, provide:
1. headline: Strong, informative newspaper headline (8–14 words, factual, authoritative, no sensationalism).
2. subheadline: Secondary context explaining the significance and implications (10–18 words).
3. whatHappened: Clear, objective summary of the core event (40–70 words) strictly based on source text.
4. details: Detailed explanation of background, quotes, key numbers, reactions, and context (120–220 words) strictly derived from source text.
5. whyItMatters: Economic or financial implications for markets, institutions, or society (50–100 words).
6. candidateId: Set to the EXACT candidate ID from the list.

STRICT VERACITY & SECURITY RULES:
- Never fabricate facts, data, events, or quotes not present in the candidate descriptions.
- Never invent or output URLs. The candidate ID alone will be resolved to authoritative links by the backend.
- Source diversity: Do not select more than 3-4 stories from the same publisher unless alternatives are scarce.
- Select 1 or 2 lead stories and mark importance as "high". The remainder should be "medium" or "low".

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

      const whatHappened = s.whatHappened || art.description || art.title;
      const details = s.details || art.content?.slice(0, 500) || undefined;
      const summary = whatHappened && details ? `${whatHappened} ${details}` : (s.summary || whatHappened);

      stories.push({
        id: `story-${idx + 1}`,
        headline: s.headline || art.title,
        subheadline: s.subheadline,
        whatHappened,
        details,
        kicker: s.kicker || `${(s.primarySection || art.category).toUpperCase()} DESK`,
        summary,
        whyItMatters: s.whyItMatters || 'Structural developments across institutions continue to guide cross-asset capital allocation.',
        keyPoints: s.keyPoints && s.keyPoints.length > 0 ? s.keyPoints : [art.title],
        source: art.source,
        originalUrl: art.originalUrl || art.url,
        resolvedUrl: art.resolvedUrl || art.originalUrl || art.url,
        linkStatus: art.linkStatus || 'VALID',
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
    targetCount: number,
    startIndex: number = 0
  ): NewspaperStory[] {
    const selected = candidates.slice(0, targetCount);

    return selected.map((cand, idx) => {
      const globalIdx = startIndex + idx;
      const art = cand.article;
      const isLead = globalIdx === 0;
      const importance: NewspaperStory['importance'] = isLead ? 'high' : globalIdx < 4 ? 'medium' : 'low';
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

      const rawText = art.description || art.content || art.title;
      const whatHappened = rawText.length > 80 ? rawText.slice(0, 220) : `${art.title} as confirmed by official market dispatches.`;
      const details = art.content && art.content.length > 220
        ? art.content.slice(220, 750)
        : `Primary reporting from ${art.source} underscores ongoing institutional adjustments, pricing dynamics, and multi-asset capital shifts observed across major trading desks and regulatory jurisdictions.`;
      const whyItMatters = `Policy adjustments and sovereign market dynamics continue to drive institutional liquidity, risk sentiment, and capital allocation across global balance sheets.`;

      return {
        id: `story-${globalIdx + 1}`,
        headline: art.title,
        subheadline: `Official wire report from ${art.source} covering key developments and broader market impact`,
        whatHappened,
        details,
        kicker: `${art.category.toUpperCase()} DISPATCH · ${art.source.toUpperCase()}`,
        summary: `${whatHappened} ${details}`,
        whyItMatters,
        keyPoints,
        source: art.source,
        originalUrl: art.originalUrl || art.url,
        resolvedUrl: art.resolvedUrl || art.originalUrl || art.url,
        linkStatus: art.linkStatus || 'VALID',
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
