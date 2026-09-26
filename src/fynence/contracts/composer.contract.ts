import type { ArticleEditorialSummary } from '../types/article';
import type { EditionConfig } from '../types/edition';
import type { MarketSnapshot } from '../types/market';
import type { StructuredNewspaperData } from '../types/newspaper';
import type { WeatherSnapshot } from '../types/weather';

export interface NewspaperCompositionPayload {
  config: EditionConfig;
  articles: ArticleEditorialSummary[];
  marketSnapshot?: MarketSnapshot;
  weatherSnapshot?: WeatherSnapshot;
  economicEvents?: any[];
  publicationDate: string;
}

export interface INewspaperComposerService {
  /**
   * Deterministically composes structured newspaper JSON from curated domain inputs.
   * Ensures section constraints, column grids, and typographic hierarchies are fulfilled.
   */
  composeEdition(payload: NewspaperCompositionPayload): Promise<StructuredNewspaperData>;

  /**
   * Verifies that all mandatory sections required by the edition config have valid data.
   */
  validateCompositionCompleteness(
    config: EditionConfig,
    data: StructuredNewspaperData
  ): { isComplete: boolean; missingSections: string[] };
}
