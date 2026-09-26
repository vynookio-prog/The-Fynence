import type { EditionConfig } from '../../types/edition';
import type { StructuredNewspaperData } from '../../types/newspaper';
import type {
  ComposerOptions,
  INewspaperComposerService,
  NewspaperCompositionPayload,
} from '../types';
import { BroadsheetLayoutPlanner } from '../layout/broadsheetLayoutPlanner';

export class NewspaperComposerService implements INewspaperComposerService {
  private layoutPlanner: BroadsheetLayoutPlanner;
  private insforgeClient?: any;

  constructor(options: ComposerOptions = {}) {
    this.layoutPlanner = new BroadsheetLayoutPlanner();
    this.insforgeClient = options.insforgeClient;
  }

  async composeEdition(payload: NewspaperCompositionPayload): Promise<StructuredNewspaperData> {
    const structuredData = this.layoutPlanner.planNewspaper(
      payload.config,
      payload.articles,
      payload.marketSnapshot,
      payload.weatherSnapshot,
      payload.economicEvents,
      payload.publicationDate
    );

    // Persist to InsForge database if client is available
    if (this.insforgeClient && this.insforgeClient.database) {
      await this.persistEditionRecord(payload.config, structuredData);
    }

    return structuredData;
  }

  validateCompositionCompleteness(
    config: EditionConfig,
    data: StructuredNewspaperData
  ): { isComplete: boolean; missingSections: string[] } {
    const presentSectionTypes = new Set<string>();

    for (const section of data.sections) {
      presentSectionTypes.add(section.type);
    }

    const requiredSections = config.sections || [
      'top_story',
      'markets',
      'weather',
    ];

    const missingSections: string[] = [];

    for (const req of requiredSections) {
      // Map section names to section item types if needed
      if (!presentSectionTypes.has(req)) {
        // Special case: if required section is an article category, check if any story section covers it
        const hasMatchingStory = data.sections.some(
          (s) => s.type === req || (s.type === 'top_story' && req === 'top_story')
        );
        if (!hasMatchingStory) {
          missingSections.push(req);
        }
      }
    }

    return {
      isComplete: missingSections.length === 0,
      missingSections,
    };
  }

  private async persistEditionRecord(
    config: EditionConfig,
    data: StructuredNewspaperData
  ): Promise<void> {
    try {
      await this.insforgeClient.database.from('editions').insert([{
        title: data.header.title,
        subtitle: data.header.subtitle,
        sections: config.sections,
        format: data.metadata.targetFormat,
        theme: data.metadata.theme,
        status: 'composed',
        structured_data: data,
      }]);
    } catch {
      // Non-fatal persistence fallback
    }
  }
}
