import { describe, it } from 'node:test';
import assert from 'node:assert';
import { storyClusterEngine } from '../../../src/fynence/editorial/clustering/storyClusterEngine';
import { primarySourceSelector } from '../../../src/fynence/editorial/clustering/primarySourceSelector';
import type { Article } from '../../../src/fynence/types/article';

describe('Story Clustering & Primary Source Selection', () => {
  const baseDate = new Date('2026-09-26T12:00:00Z').toISOString();

  const articleFedReuters: Article = {
    id: 'art_fed_reuters',
    title: 'Federal Reserve Holds Interest Rates Steady at Policy Meeting',
    description: 'The US central bank concluded its meeting leaving the federal funds target range unchanged.',
    content: 'The Federal Reserve left its benchmark lending rate unchanged following a two-day gathering in Washington.',
    url: 'https://reuters.com/markets/fed-rates-steady',
    source: 'Reuters',
    author: 'Howard Schneider',
    category: 'economy',
    region: 'us',
    publishedAt: baseDate,
    imageUrl: 'https://images.reuters.com/fed-building.jpg',
    imageSource: 'Reuters',
    imageCredit: 'Reuters / Brendan McDermid',
    imageUsageStatus: 'source_provided',
    createdAt: baseDate,
    updatedAt: baseDate,
  };

  const articleFedCNBC: Article = {
    id: 'art_fed_cnbc',
    title: 'Fed Keeps Interest Rates Unchanged Amid Easing Inflation',
    description: 'Central bankers voted unanimously to keep the policy rate at 5.25 to 5.50 percent.',
    url: 'https://cnbc.com/economy/fed-rate-decision',
    source: 'CNBC',
    author: 'Jeff Cox',
    category: 'economy',
    region: 'us',
    publishedAt: new Date('2026-09-26T12:30:00Z').toISOString(),
    imageUrl: null,
    imageSource: null,
    imageCredit: null,
    imageUsageStatus: 'unavailable',
    createdAt: baseDate,
    updatedAt: baseDate,
  };

  const articleFedBBC: Article = {
    id: 'art_fed_bbc',
    title: 'US Central Bank Leaves Rates Steady as Price Pressures Cool',
    description: 'Federal Reserve officials maintained borrowing costs at a 23-year peak.',
    url: 'https://bbc.co.uk/news/business-fed-rates',
    source: 'BBC News',
    author: null,
    category: 'economy',
    region: 'us',
    publishedAt: new Date('2026-09-26T13:00:00Z').toISOString(),
    imageUrl: null,
    imageSource: null,
    imageCredit: null,
    imageUsageStatus: 'unavailable',
    createdAt: baseDate,
    updatedAt: baseDate,
  };

  const articleNvidia: Article = {
    id: 'art_nvidia_chips',
    title: 'Nvidia Launches Next-Generation Blackwell Ultra AI Superchips',
    description: 'The graphics processor designer unveiled datacenter accelerators for enterprise intelligence workloads.',
    url: 'https://arstechnica.com/nvidia-blackwell-ultra',
    source: 'Ars Technica',
    author: 'Benj Edwards',
    category: 'technology',
    region: 'global',
    publishedAt: baseDate,
    imageUrl: 'https://cdn.arstechnica.net/nvidia-chip.jpg',
    imageSource: 'Ars Technica',
    imageCredit: 'Nvidia Press',
    imageUsageStatus: 'source_provided',
    createdAt: baseDate,
    updatedAt: baseDate,
  };

  it('clusters related articles covering the exact same event', () => {
    const articles = [articleFedReuters, articleFedCNBC, articleNvidia];
    const clusters = storyClusterEngine.clusterArticles(articles);

    // Fed articles should be grouped together, Nvidia separate
    assert.strictEqual(clusters.length, 2);

    const fedCluster = clusters.find(c => c.cluster.articleIds.includes('art_fed_reuters'));
    assert.ok(fedCluster);
    assert.strictEqual(fedCluster.cluster.articleIds.length, 2);
    assert.ok(fedCluster.cluster.articleIds.includes('art_fed_cnbc'));

    const techCluster = clusters.find(c => c.cluster.articleIds.includes('art_nvidia_chips'));
    assert.ok(techCluster);
    assert.strictEqual(techCluster.cluster.articleIds.length, 1);
  });

  it('selects primary article transparently based on completeness, image, and priority', () => {
    // Both Reuters and CNBC are in the same cluster
    // Reuters has an image (imageScore: 20) and full content (completenessScore), while CNBC has no image
    const selection = primarySourceSelector.selectPrimary([articleFedCNBC, articleFedReuters]);

    assert.strictEqual(selection.primaryArticle.id, 'art_fed_reuters');
    assert.strictEqual(selection.scores.length, 2);

    const reutersScore = selection.scores.find(s => s.articleId === 'art_fed_reuters')!;
    const cnbcScore = selection.scores.find(s => s.articleId === 'art_fed_cnbc')!;

    assert.ok(reutersScore.imageScore > cnbcScore.imageScore);
    assert.ok(reutersScore.totalScore > cnbcScore.totalScore);
  });

  it('does not cluster articles with similar tokens outside the temporal window', () => {
    const oldFedArticle: Article = {
      ...articleFedReuters,
      id: 'art_fed_old',
      publishedAt: new Date('2026-08-01T00:00:00Z').toISOString(), // 8 weeks earlier
    };

    const clusters = storyClusterEngine.clusterArticles([articleFedReuters, oldFedArticle], {
      maxTimeDifferenceHours: 48,
    });

    assert.strictEqual(clusters.length, 2);
    assert.strictEqual(clusters[0].cluster.articleIds.length, 1);
    assert.strictEqual(clusters[1].cluster.articleIds.length, 1);
  });
});
