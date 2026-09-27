import type { NewspaperStory } from '../../renderer/types/document';

export interface ArticleDiagnosticEntry {
  storyIndex: number;
  headline: string;
  source: string;
  originalUrl: string;
  resolvedUrl?: string;
  linkStatus: string;
  imageUrl?: string | null;
  imageStatus: 'VALID_IMAGE' | 'NO_IMAGE' | 'INVALID_IMAGE';
  totalWordCount: number;
  sections: {
    whatHappenedWords: number;
    detailsWords: number;
    whyItMattersWords: number;
  };
}

export function countWords(str?: string): number {
  if (!str) return 0;
  return str.trim().split(/\s+/).filter(Boolean).length;
}

export function generateArticleDiagnostics(stories: NewspaperStory[]): ArticleDiagnosticEntry[] {
  return stories.map((s, idx) => {
    const whatHappenedWords = countWords(s.whatHappened);
    const detailsWords = countWords(s.details);
    const whyItMattersWords = countWords(s.whyItMatters);
    const summaryWords = countWords(s.summary);
    const totalWordCount = whatHappenedWords + detailsWords + whyItMattersWords || summaryWords;

    let imageStatus: ArticleDiagnosticEntry['imageStatus'] = 'NO_IMAGE';
    if (s.image?.assetDataUri || s.image?.url) {
      imageStatus = 'VALID_IMAGE';
    }

    return {
      storyIndex: idx + 1,
      headline: s.headline,
      source: s.source,
      originalUrl: s.originalUrl || '',
      resolvedUrl: s.resolvedUrl,
      linkStatus: s.linkStatus || 'VALID',
      imageUrl: s.image?.url || null,
      imageStatus,
      totalWordCount,
      sections: {
        whatHappenedWords,
        detailsWords,
        whyItMattersWords,
      },
    };
  });
}

export function logArticleDiagnostics(stories: NewspaperStory[]): void {
  const diagnostics = generateArticleDiagnostics(stories);

  console.log('\n==================================================');
  console.log('[Article Pipeline Diagnostics]');
  console.log('==================================================');

  for (const d of diagnostics) {
    console.log(`Story ${d.storyIndex}:`);
    console.log(`Headline: ${d.headline}`);
    console.log(`Source: ${d.source}`);
    console.log(`Original URL: ${d.originalUrl}`);
    console.log(`Resolved URL: ${d.resolvedUrl || d.originalUrl}`);
    console.log(`Link Status: ${d.linkStatus}`);
    console.log(`Image URL: ${d.imageUrl || 'None (Text-First Article)'}`);
    console.log(`Image Status: ${d.imageStatus}`);
    console.log(`Word Count: ${d.totalWordCount}`);
    console.log(`Sections:`);
    console.log(`- whatHappened: ${d.sections.whatHappenedWords} words`);
    console.log(`- details: ${d.sections.detailsWords} words`);
    console.log(`- whyItMatters: ${d.sections.whyItMattersWords} words\n`);
  }

  console.log('==================================================\n');
}
