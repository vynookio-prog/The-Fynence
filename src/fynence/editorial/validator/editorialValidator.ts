import type { NewspaperSectionType } from '../../types/edition';
import type { EditorialImportance, EntityType, StructuredAiAnalysis } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  data?: StructuredAiAnalysis;
}

const VALID_SECTIONS: Set<NewspaperSectionType> = new Set([
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
]);

const VALID_IMPORTANCE: Set<EditorialImportance> = new Set(['low', 'medium', 'high']);

const VALID_ENTITY_TYPES: Set<EntityType> = new Set([
  'organization',
  'person',
  'country',
  'location',
  'financial_instrument',
  'currency',
  'economic_indicator',
]);

export class EditorialValidator {
  /**
   * Validates structured AI output to ensure compliance with newspaper standards.
   */
  public validate(raw: any): ValidationResult {
    const errors: string[] = [];

    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return { isValid: false, errors: ['Analysis output must be a non-null object'] };
    }

    // 1. Headline Validation
    const headline = typeof raw.headline === 'string' ? raw.headline.trim() : '';
    if (!headline) {
      errors.push('Headline is missing or empty');
    } else if (headline.length < 5) {
      errors.push(`Headline is too short (${headline.length} chars, min 5)`);
    } else if (headline.length > 200) {
      errors.push(`Headline is too long (${headline.length} chars, max 200)`);
    } else if (headline.endsWith('?')) {
      errors.push('Headline must not be a question (clickbait rule)');
    }

    // 2. Summary Validation
    const summary = typeof raw.summary === 'string' ? raw.summary.trim() : '';
    if (!summary) {
      errors.push('Summary is missing or empty');
    } else {
      const sentenceCount = this.countSentences(summary);
      if (sentenceCount < 1) {
        errors.push('Summary must contain at least 1 complete sentence');
      } else if (sentenceCount > 6) {
        errors.push(`Summary is too verbose (${sentenceCount} sentences, target 2 to 4)`);
      }
      if (summary.length < 30) {
        errors.push(`Summary is too brief (${summary.length} chars, min 30)`);
      }
    }

    // 3. Why It Matters Validation
    const whyItMatters = typeof raw.whyItMatters === 'string' ? raw.whyItMatters.trim() : '';
    if (!whyItMatters) {
      errors.push('Why It Matters is missing or empty');
    } else {
      const sentenceCount = this.countSentences(whyItMatters);
      if (sentenceCount < 1) {
        errors.push('Why It Matters must contain at least 1 complete sentence');
      } else if (sentenceCount > 4) {
        errors.push(`Why It Matters is too verbose (${sentenceCount} sentences, target 1 to 3)`);
      }
    }

    // 4. Section Validation
    const primarySection = raw.primarySection as NewspaperSectionType;
    if (!VALID_SECTIONS.has(primarySection)) {
      errors.push(`Invalid primary section: "${raw.primarySection}"`);
    }

    const secondarySections: NewspaperSectionType[] = [];
    if (Array.isArray(raw.secondarySections)) {
      for (const sec of raw.secondarySections) {
        if (VALID_SECTIONS.has(sec) && sec !== primarySection) {
          secondarySections.push(sec);
        }
      }
    }

    // 5. Importance Validation
    const importance = raw.importance as EditorialImportance;
    if (!VALID_IMPORTANCE.has(importance)) {
      errors.push(`Invalid importance level: "${raw.importance}"`);
    }

    // 6. Entities Validation
    const entities = Array.isArray(raw.entities)
      ? raw.entities
          .filter((e: any) => e && typeof e.name === 'string' && e.name.trim().length > 0)
          .map((e: any) => ({
            type: VALID_ENTITY_TYPES.has(e.type) ? e.type : 'organization',
            name: e.name.trim(),
          }))
      : [];

    // 7. Metrics Validation
    const metrics = Array.isArray(raw.metrics)
      ? raw.metrics
          .filter(
            (m: any) =>
              m &&
              typeof m.name === 'string' &&
              m.name.trim().length > 0 &&
              typeof m.value === 'string' &&
              m.value.trim().length > 0
          )
          .map((m: any) => ({
            name: m.name.trim(),
            value: m.value.trim(),
            context: (m.context || '').trim(),
          }))
      : [];

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    return {
      isValid: true,
      errors: [],
      data: {
        headline,
        summary,
        whyItMatters,
        primarySection,
        secondarySections,
        importance,
        entities,
        metrics,
      },
    };
  }

  private countSentences(text: string): number {
    const clean = text.replace(/([.?!])\s*(?=[A-Z0-9])/g, '$1|');
    const parts = clean.split('|').map(s => s.trim()).filter(Boolean);
    return Math.max(1, parts.length);
  }
}

export const editorialValidator = new EditorialValidator();
