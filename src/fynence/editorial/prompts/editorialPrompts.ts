import type { Article } from '../../types/article';

export const EDITORIAL_ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    headline: {
      type: 'string',
      description: 'Punchy, informative newspaper headline (2-10 words, no clickbait, no sensationalism)',
    },
    summary: {
      type: 'string',
      description: 'Concise editorial synthesis in exactly 2 to 4 factual sentences. Strictly derived from source articles.',
    },
    whyItMatters: {
      type: 'string',
      description: 'Practical or macroeconomic institutional significance in 1 to 3 sentences. No speculative market predictions.',
    },
    primarySection: {
      type: 'string',
      enum: [
        'top_story',
        'world',
        'national',
        'business',
        'technology',
        'finance',
        'economy',
        'forex',
        'crypto',
        'markets',
      ],
      description: 'Primary newspaper section placement',
    },
    secondarySections: {
      type: 'array',
      items: {
        type: 'string',
        enum: [
          'world',
          'national',
          'business',
          'technology',
          'finance',
          'economy',
          'forex',
          'crypto',
          'markets',
        ],
      },
      description: 'Optional cross-category tags',
    },
    importance: {
      type: 'string',
      enum: ['low', 'medium', 'high'],
      description: 'Editorial ranking priority based on event magnitude and breadth',
    },
    entities: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: [
              'organization',
              'person',
              'country',
              'location',
              'financial_instrument',
              'currency',
              'economic_indicator',
            ],
          },
          name: { type: 'string' },
        },
        required: ['type', 'name'],
      },
      description: 'Named entities mentioned explicitly in the text',
    },
    metrics: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          value: { type: 'string' },
          context: { type: 'string' },
        },
        required: ['name', 'value', 'context'],
      },
      description: 'Reported economic statistics, basis points, interest rates, or percentages. Tagged strictly as source data.',
    },
  },
  required: [
    'headline',
    'summary',
    'whyItMatters',
    'primarySection',
    'importance',
    'entities',
    'metrics',
  ],
};

export function buildStoryAnalysisPrompt(primaryArticle: Article, relatedArticles: Article[] = []): string {
  const parts: string[] = [];

  parts.push('Analyze the following verified news article(s) and produce a structured editorial story.');
  parts.push('\n[PRIMARY SOURCE ARTICLE]');
  parts.push(`Publisher: ${primaryArticle.source}`);
  parts.push(`Original Headline: ${primaryArticle.title}`);
  parts.push(`Published Date: ${primaryArticle.publishedAt}`);
  parts.push(`Category: ${primaryArticle.category}`);
  parts.push(`Region: ${primaryArticle.region}`);
  parts.push(`URL: ${primaryArticle.url}`);
  parts.push(`Summary/Excerpt: ${primaryArticle.description}`);
  if (primaryArticle.content && primaryArticle.content !== primaryArticle.description) {
    parts.push(`Full Content: ${primaryArticle.content.slice(0, 2000)}`);
  }

  if (relatedArticles.length > 0) {
    parts.push('\n[CORROBORATING COVERAGE FROM OTHER PUBLISHERS]');
    relatedArticles.forEach((art, index) => {
      parts.push(`\nPublisher [${index + 1}]: ${art.source}`);
      parts.push(`Headline: ${art.title}`);
      parts.push(`Published Date: ${art.publishedAt}`);
      parts.push(`Excerpt: ${art.description}`);
    });
  }

  parts.push('\nEDITORIAL INSTRUCTIONS:');
  parts.push('1. Write a headline that reads like an elite broadsheet newspaper headline.');
  parts.push('2. Synthesize all verified details into a 2 to 4 sentence summary.');
  parts.push('3. Craft a "Why It Matters" section in 1 to 3 sentences explaining the structural or financial importance.');
  parts.push('4. Extract named entities (organizations, countries, policymakers) and reported numeric figures.');
  parts.push('5. Return your answer as a JSON object strictly matching the specified schema.');

  return parts.join('\n');
}

export const CLUSTER_DETECTION_SCHEMA = {
  type: 'object',
  properties: {
    clusters: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: 'Brief description of the shared event' },
          articleIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'IDs of articles covering this exact same event',
          },
          significance: { type: 'string', enum: ['low', 'medium', 'high'] },
        },
        required: ['topic', 'articleIds', 'significance'],
      },
    },
  },
  required: ['clusters'],
};

export function buildClusterDetectionPrompt(
  candidateArticles: Array<{ id: string; title: string; description: string; publishedAt: string; source: string }>
): string {
  const list = candidateArticles
    .map(
      (a, i) =>
        `[${i + 1}] ID: ${a.id}\nPublisher: ${a.source} (${a.publishedAt})\nHeadline: ${a.title}\nDescription: ${a.description}\n`
    )
    .join('\n');

  return `Identify articles covering the EXACT same underlying event or announcement.
Group related articles into clusters. Articles that do not share an event with any other article should be in a cluster by themselves.

Articles to evaluate:
${list}

Return the grouped clusters conforming to the JSON schema.`;
}
