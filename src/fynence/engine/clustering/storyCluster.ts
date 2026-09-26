import type { Article } from '../../types/article';

export interface NewsStoryCluster {
  clusterId: string;
  topic: string;
  primaryArticleId: string;
  articleIds: string[];
  sources: string[];
  firstReportedAt: string;
  lastUpdated: string;
  significance: 'low' | 'medium' | 'high';
}

export class NewsStoryClusterManager {
  private clusters: Map<string, NewsStoryCluster> = new Map();

  /**
   * Prepares a story cluster grouping multiple publisher articles covering the same core event.
   */
  public createCluster(topic: string, primaryArticle: Article): NewsStoryCluster {
    const clusterId = `cluster_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const cluster: NewsStoryCluster = {
      clusterId,
      topic,
      primaryArticleId: primaryArticle.id,
      articleIds: [primaryArticle.id],
      sources: [primaryArticle.source],
      firstReportedAt: primaryArticle.publishedAt,
      lastUpdated: new Date().toISOString(),
      significance: 'medium',
    };

    this.clusters.set(clusterId, cluster);
    return cluster;
  }

  public addArticleToCluster(clusterId: string, article: Article): boolean {
    const cluster = this.clusters.get(clusterId);
    if (!cluster) return false;

    if (!cluster.articleIds.includes(article.id)) {
      cluster.articleIds.push(article.id);
    }
    if (!cluster.sources.includes(article.source)) {
      cluster.sources.push(article.source);
    }
    cluster.lastUpdated = new Date().toISOString();
    return true;
  }

  public getCluster(clusterId: string): NewsStoryCluster | undefined {
    return this.clusters.get(clusterId);
  }

  public getAllClusters(): NewsStoryCluster[] {
    return Array.from(this.clusters.values());
  }
}

export const storyClusterManager = new NewsStoryClusterManager();
