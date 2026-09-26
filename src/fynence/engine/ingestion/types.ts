export interface IngestionSourceSummary {
  sourceId: string;
  sourceName: string;
  status: 'completed' | 'not_modified' | 'failed' | 'disabled';
  fetched: number;
  valid: number;
  duplicates: number;
  stored: number;
  failed: number;
  durationMs: number;
  errorMessage?: string;
}

export interface IngestionRunSummary {
  runId: string;
  startedAt: string;
  completedAt: string;
  totalDurationMs: number;
  sourcesProcessed: number;
  totalFetched: number;
  totalValid: number;
  totalDuplicates: number;
  totalStored: number;
  totalFailed: number;
  sourceSummaries: IngestionSourceSummary[];
}
