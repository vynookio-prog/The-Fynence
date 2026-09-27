export interface RssDiagnosticsReport {
  feedsConfigured: number;
  feedsSuccessful: number;
  feedsFailed: number;
  failedFeedsList: Array<{ id: string; error: string }>;
  rawArticlesFetched: number;
  invalidArticles: number;
  exactDuplicatesRemoved: number;
  uniqueArticles: number;
  similarityGroups: number;
  articlesAfterFiltering: number;
  articlesPerCategory: Record<string, number>;
  articlesPerSource: Record<string, number>;
  editorialCandidatePoolSize: number;
  finalSelectedStoriesCount: number;
  durationMs: number;
}

export function formatRssDiagnosticsReport(report: RssDiagnosticsReport): string {
  const lines: string[] = [];

  lines.push('==================================================');
  lines.push('THE FYNENCE — RSS NEWS ENGINE REPORT');
  lines.push('==================================================');
  lines.push('');
  lines.push('Feeds:');
  lines.push(`  ${report.feedsConfigured} configured`);
  lines.push(`  ${report.feedsSuccessful} successful`);
  lines.push(`  ${report.feedsFailed} failed`);

  if (report.failedFeedsList.length > 0) {
    lines.push('  Failed feeds:');
    for (const f of report.failedFeedsList) {
      lines.push(`    - ${f.id}: ${f.error}`);
    }
  }

  lines.push('');
  lines.push('Articles:');
  lines.push(`  ${report.rawArticlesFetched} fetched`);
  lines.push(`  ${report.invalidArticles} invalid removed`);
  lines.push(`  ${report.exactDuplicatesRemoved} exact duplicates removed`);
  lines.push(`  ${report.uniqueArticles} unique valid`);
  lines.push(`  ${report.similarityGroups} similarity clusters grouped`);
  lines.push(`  ${report.articlesAfterFiltering} after freshness & category filter`);

  lines.push('');
  lines.push('Candidates by Category:');
  for (const [cat, count] of Object.entries(report.articlesPerCategory)) {
    lines.push(`  - ${cat}: ${count}`);
  }

  lines.push('');
  lines.push('Top Sources:');
  const sortedSources = Object.entries(report.articlesPerSource)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  for (const [src, count] of sortedSources) {
    lines.push(`  - ${src}: ${count}`);
  }

  lines.push('');
  lines.push(`Editorial Candidate Pool: ${report.editorialCandidatePoolSize}`);
  lines.push(`Final Selected Stories: ${report.finalSelectedStoriesCount}`);
  lines.push(`Processing Duration: ${report.durationMs}ms`);
  lines.push('==================================================');

  return lines.join('\n');
}
