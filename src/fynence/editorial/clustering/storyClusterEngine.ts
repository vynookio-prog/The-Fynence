import type { Article } from '../../types/article';
import type { StoryCluster, EditorialImportance } from '../types';
import { primarySourceSelector } from './primarySourceSelector';
import { tokenizeTitle, calculateJaccardSimilarity } from '../../engine/deduplicator/titleNormalizer';
import type { AIProvider } from '../providers/types';
import { buildClusterDetectionPrompt, CLUSTER_DETECTION_SCHEMA } from '../prompts/editorialPrompts';

export interface ClusteredStoryGroup {
  cluster: StoryCluster;
  primaryArticle: Article;
  relatedArticles: Article[];
}

export class StoryClusterEngine {
  /**
   * Clusters a batch of articles into distinct story groups covering shared events.
   * Deterministic first: Jaccard similarity, category, and temporal proximity.
   * Optional AI clustering for complex/ambiguous multi-source batches.
   */
  public clusterArticles(
    articles: Article[],
    options?: { similarityThreshold?: number; maxTimeDifferenceHours?: number }
  ): ClusteredStoryGroup[] {
    if (articles.length === 0) return [];

    const threshold = options?.similarityThreshold ?? 0.40;
    const maxTimeDiffMs = (options?.maxTimeDifferenceHours ?? 48) * 60 * 60 * 1000;

    const tokenizedArticles = articles.map(a => ({
      article: a,
      tokens: this.canonicalizeTokens(tokenizeTitle(a.title)),
      time: new Date(a.publishedAt || 0).getTime(),
    }));

    const visited = new Set<string>();
    const groups: Article[][] = [];

    for (let i = 0; i < tokenizedArticles.length; i++) {
      const current = tokenizedArticles[i];
      if (visited.has(current.article.id)) continue;

      const currentGroup: Article[] = [current.article];
      visited.add(current.article.id);

      for (let j = i + 1; j < tokenizedArticles.length; j++) {
        const candidate = tokenizedArticles[j];
        if (visited.has(candidate.article.id)) continue;

        // Check temporal window
        const timeDiff = Math.abs(current.time - candidate.time);
        if (timeDiff > maxTimeDiffMs) continue;

        // Check category compatibility
        const isCompatibleCategory =
          current.article.category === candidate.article.category ||
          this.areCategoriesRelated(current.article.category, candidate.article.category);

        if (!isCompatibleCategory) continue;

        // Check token similarity
        const similarity = calculateJaccardSimilarity(current.tokens, candidate.tokens);
        if (similarity >= threshold) {
          currentGroup.push(candidate.article);
          visited.add(candidate.article.id);
        }
      }

      groups.push(currentGroup);
    }

    // Convert raw groups into ClusteredStoryGroups
    return groups.map(group => {
      const { primaryArticle } = primarySourceSelector.selectPrimary(group);
      const relatedArticles = group.filter(a => a.id !== primaryArticle.id);

      const clusterId = `cluster_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const significance: EditorialImportance =
        group.length >= 3 ? 'high' : group.length === 2 ? 'medium' : 'low';

      const cluster: StoryCluster = {
        id: clusterId,
        topic: primaryArticle.title,
        primaryArticleId: primaryArticle.id,
        articleIds: group.map(a => a.id),
        firstReportedAt: primaryArticle.publishedAt,
        significance,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        cluster,
        primaryArticle,
        relatedArticles,
      };
    });
  }

  /**
   * Optional AI clustering for ambiguous candidate pools.
   */
  public async clusterWithAi(
    articles: Article[],
    aiProvider: AIProvider
  ): Promise<ClusteredStoryGroup[]> {
    if (articles.length <= 1) {
      return this.clusterArticles(articles);
    }

    try {
      const prompt = buildClusterDetectionPrompt(
        articles.map(a => ({
          id: a.id,
          title: a.title,
          description: a.description,
          publishedAt: a.publishedAt,
          source: a.source,
        }))
      );

      const res = await aiProvider.generateStructured<{
        clusters: Array<{ topic: string; articleIds: string[]; significance: EditorialImportance }>;
      }>(prompt, CLUSTER_DETECTION_SCHEMA, {
        temperature: 0.1,
      });

      if (!res.success || !res.data || !Array.isArray(res.data.clusters)) {
        return this.clusterArticles(articles);
      }

      const articleMap = new Map(articles.map(a => [a.id, a]));
      const clusteredGroups: ClusteredStoryGroup[] = [];
      const assignedIds = new Set<string>();

      for (const rawCluster of res.data.clusters) {
        const clusterArticles: Article[] = [];
        for (const id of rawCluster.articleIds) {
          const art = articleMap.get(id);
          if (art && !assignedIds.has(id)) {
            clusterArticles.push(art);
            assignedIds.add(id);
          }
        }

        if (clusterArticles.length > 0) {
          const { primaryArticle } = primarySourceSelector.selectPrimary(clusterArticles);
          const relatedArticles = clusterArticles.filter(a => a.id !== primaryArticle.id);

          const cluster: StoryCluster = {
            id: `cluster_ai_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            topic: rawCluster.topic || primaryArticle.title,
            primaryArticleId: primaryArticle.id,
            articleIds: clusterArticles.map(a => a.id),
            firstReportedAt: primaryArticle.publishedAt,
            significance: rawCluster.significance || 'medium',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          clusteredGroups.push({
            cluster,
            primaryArticle,
            relatedArticles,
          });
        }
      }

      // Add any unassigned articles as single-article clusters
      for (const art of articles) {
        if (!assignedIds.has(art.id)) {
          const singleCluster: StoryCluster = {
            id: `cluster_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            topic: art.title,
            primaryArticleId: art.id,
            articleIds: [art.id],
            firstReportedAt: art.publishedAt,
            significance: 'low',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          clusteredGroups.push({
            cluster: singleCluster,
            primaryArticle: art,
            relatedArticles: [],
          });
        }
      }

      return clusteredGroups;
    } catch {
      // Fallback to deterministic clustering
      return this.clusterArticles(articles);
    }
  }

  private areCategoriesRelated(catA: string, catB: string): boolean {
    const macroGroup = new Set(['economy', 'markets', 'finance']);
    return macroGroup.has(catA) && macroGroup.has(catB);
  }

  private canonicalizeTokens(rawTokens: Set<string>): Set<string> {
    const canonical = new Set<string>();
    for (const token of rawTokens) {
      if (token === 'fed') {
        canonical.add('federal');
        canonical.add('reserve');
      } else if (
        token === 'keeps' ||
        token === 'hold' ||
        token === 'holding' ||
        token === 'holds' ||
        token === 'pause' ||
        token === 'pauses'
      ) {
        canonical.add('holds');
      } else if (token === 'unchanged' || token === 'steady') {
        canonical.add('steady');
      } else if (token === 'lowers' || token === 'cut' || token === 'cuts' || token === 'slashes') {
        canonical.add('cuts');
      } else if (token === 'raises' || token === 'hike' || token === 'hikes' || token === 'boosts') {
        canonical.add('hikes');
      } else if (token === 'stocks' || token === 'shares') {
        canonical.add('equities');
      } else {
        canonical.add(token);
      }
    }
    return canonical;
  }
}

export const storyClusterEngine = new StoryClusterEngine();
