import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { EditorialEngine } from '../../../src/fynence/editorial/engine/editorialEngine';
import { MockAIProvider } from '../../../src/fynence/editorial/providers/mockProvider';
import { editorialCache } from '../../../src/fynence/editorial/cache/editorialCache';
import type { Article } from '../../../src/fynence/types/article';
import type { ClusteredStoryGroup } from '../../../src/fynence/editorial/clustering/storyClusterEngine';

describe('AI Editorial Engine & Pipeline', () => {
  const mockProvider = new MockAIProvider();
  const engine = new EditorialEngine(mockProvider);

  const baseDate = new Date('2026-09-26T14:00:00Z').toISOString();

  const sampleArticle: Article = {
    id: 'art_sample_fed_1',
    title: 'Federal Reserve Lowers Benchmark Borrowing Rate by 50 Basis Points',
    description: 'The Federal Open Market Committee initiated its policy easing cycle with a half-point benchmark reduction.',
    content: 'The Federal Reserve lowered its policy target range to 4.75-5.00 percent, citing progress on inflation toward its 2 percent goal.',
    url: 'https://marketwatch.com/story/fed-cuts-rates-50bps',
    source: 'MarketWatch Top Stories',
    author: 'Rachel Siegel',
    category: 'economy',
    region: 'us',
    publishedAt: baseDate,
    imageUrl: 'https://images.mktw.net/im-30767503.jpg',
    imageSource: 'MarketWatch Top Stories',
    imageCredit: 'AFP via Getty Images',
    imageUsageStatus: 'source_provided',
    createdAt: baseDate,
    updatedAt: baseDate,
  };

  const sampleGroup: ClusteredStoryGroup = {
    cluster: {
      id: 'cluster_test_01',
      topic: sampleArticle.title,
      primaryArticleId: sampleArticle.id,
      articleIds: [sampleArticle.id],
      firstReportedAt: baseDate,
      significance: 'high',
      createdAt: baseDate,
      updatedAt: baseDate,
    },
    primaryArticle: sampleArticle,
    relatedArticles: [],
  };

  beforeEach(() => {
    mockProvider.reset();
    editorialCache.clear();
  });

  it('generates a complete, validated EditorialStory with source traceability', async () => {
    mockProvider.enqueueStructuredResponse({
      headline: 'Federal Reserve Cuts Policy Rate by 50 Basis Points',
      summary: 'The Federal Open Market Committee lowered benchmark borrowing costs by half a percentage point today. Central bank officials stated inflation is moving sustainably toward the two percent objective while employment gains have moderated. Equities and sovereign yields traded with elevated volume following the decision.',
      whyItMatters: 'The reduction marks the beginning of an easing cycle that lowers debt servicing costs for businesses and mortgage holders.',
      primarySection: 'economy',
      secondarySections: ['markets', 'finance'],
      importance: 'high',
      entities: [
        { type: 'organization', name: 'Federal Reserve' },
        { type: 'country', name: 'United States' },
      ],
      metrics: [
        { name: 'policy_rate_cut', value: '50 bps', context: 'Benchmark rate reduction' },
        { name: 'new_target_range', value: '4.75% to 5.00%', context: 'Target policy range' },
      ],
    });

    const story = await engine.processStoryGroup(sampleGroup);

    // Verify editorial content
    assert.strictEqual(story.headline, 'Federal Reserve Cuts Policy Rate by 50 Basis Points');
    assert.strictEqual(story.primarySection, 'economy');
    assert.strictEqual(story.importance, 'high');

    // Verify human traceability to original article
    assert.strictEqual(story.sourceArticles.length, 1);
    assert.strictEqual(story.sourceArticles[0].articleId, sampleArticle.id);
    assert.strictEqual(story.sourceArticles[0].url, sampleArticle.url);
    assert.strictEqual(story.sourceArticles[0].source, sampleArticle.source);

    // Verify strict anti-AI image preservation
    assert.ok(story.image);
    assert.strictEqual(story.image?.url, sampleArticle.imageUrl);
    assert.strictEqual(story.image?.isAiGenerated, false);
    assert.strictEqual(story.image?.usageStatus, 'source_provided');

    // Verify reported metrics tagging
    assert.strictEqual(story.metrics.length, 2);
    assert.strictEqual(story.metrics[0].sourceType, 'SOURCE_REPORTED_DATA');
    assert.strictEqual(story.metrics[1].sourceType, 'SOURCE_REPORTED_DATA');
  });

  it('preserves null image and never generates AI image when source has no image', async () => {
    const noImageArticle: Article = {
      ...sampleArticle,
      id: 'art_no_image',
      imageUrl: null,
      imageUsageStatus: 'unavailable',
    };

    const noImageGroup: ClusteredStoryGroup = {
      ...sampleGroup,
      primaryArticle: noImageArticle,
    };

    mockProvider.enqueueStructuredResponse({
      headline: 'Fed Lowers Interest Rate to Sustain Labor Growth',
      summary: 'Monetary authorities initiated rate cuts after observing persistent disinflation. Benchmark rates were lowered by fifty basis points in Washington. Markets responded positively across major indices.',
      whyItMatters: 'Lower capital costs provide relief for corporate investment and commercial financing.',
      primarySection: 'economy',
      secondarySections: [],
      importance: 'high',
      entities: [{ type: 'organization', name: 'Federal Reserve' }],
      metrics: [{ name: 'cut_amount', value: '50 bps', context: 'FOMC rate cut' }],
    });

    const story = await engine.processStoryGroup(noImageGroup);

    assert.strictEqual(story.image, null);
  });

  it('bypasses AI provider and retrieves cached story on identical content hash', async () => {
    mockProvider.enqueueStructuredResponse({
      headline: 'Fed Initiates Monetary Policy Easing',
      summary: 'Central bankers reduced interest rates by fifty basis points during today session. Officials pointed to slowing job growth alongside cooling inflation prints. Financial markets absorbed the policy pivot.',
      whyItMatters: 'Commercial financing rates will adjust lower following this opening cut.',
      primarySection: 'economy',
      secondarySections: [],
      importance: 'high',
      entities: [],
      metrics: [],
    });

    // First call uses AI provider
    const story1 = await engine.processStoryGroup(sampleGroup);
    assert.strictEqual(mockProvider.getCallCount(), 1);

    // Second call on same story group should hit cache
    const story2 = await engine.processStoryGroup(sampleGroup);
    assert.strictEqual(mockProvider.getCallCount(), 1); // No new AI call!
    assert.strictEqual(story1.id, story2.id);
    assert.strictEqual(story1.contentHash, story2.contentHash);
  });

  it('handles malformed AI output and rejects storage of invalid stories', async () => {
    // Enqueue malformed response (clickbait question headline, violating editorial guidelines)
    mockProvider.enqueueStructuredResponse({
      headline: 'Will The Stock Market Explode Tomorrow?',
      summary: 'Too short',
      whyItMatters: '',
      primarySection: 'invalid_section',
      importance: 'not_an_importance',
      entities: [],
      metrics: [],
    });

    await assert.rejects(
      async () => {
        await engine.processStoryGroup(sampleGroup);
      },
      /Editorial validation failed/
    );
  });

  it('handles AI provider failure gracefully', async () => {
    mockProvider.setShouldFail(true, 'Rate limit exceeded on provider API');

    await assert.rejects(
      async () => {
        await engine.processStoryGroup(sampleGroup);
      },
      /Rate limit exceeded on provider API/
    );
  });

  it('processes batch of articles with failure isolation', async () => {
    const articleGood: Article = {
      ...sampleArticle,
      id: 'art_good',
      title: 'Treasury Yields Retreat Following Fed Policy Announcement',
    };

    // First cluster will succeed, second will fail in mock provider
    mockProvider.enqueueStructuredResponse({
      headline: 'Treasury Yields Retreat Following Federal Reserve Decision',
      summary: 'Benchmark ten-year note yields declined following the interest rate adjustment. Bond investors adjusted positions in response to revised terminal rate expectations. Dollar strength eased across major currency crosses.',
      whyItMatters: 'Declining sovereign bond yields directly reduce borrowing costs across consumer mortgage and corporate debt markets.',
      primarySection: 'markets',
      secondarySections: ['finance'],
      importance: 'medium',
      entities: [{ type: 'organization', name: 'Federal Reserve' }],
      metrics: [{ name: '10y_yield', value: '3.70%', context: 'Ten-year Treasury yield' }],
    });

    // Enqueue an invalid response for the second cluster
    mockProvider.enqueueStructuredResponse({
      headline: 'Bad?',
      summary: 'x',
      whyItMatters: '',
      primarySection: 'invalid',
      importance: 'invalid',
      entities: [],
      metrics: [],
    });

    const articleBad: Article = {
      ...sampleArticle,
      id: 'art_bad',
      title: 'Completely Distinct Story On Indonesian Commodity Regulations',
      category: 'national',
      region: 'indonesia',
    };

    const res = await engine.processBatch([articleGood, articleBad], { forceRegenerate: true });

    // One cluster succeeded, one failed
    assert.strictEqual(res.stories.length, 1);
    assert.strictEqual(res.run.storiesCreated, 1);
    assert.strictEqual(res.run.failed, 1);
    assert.strictEqual(res.run.status, 'completed');
  });
});
