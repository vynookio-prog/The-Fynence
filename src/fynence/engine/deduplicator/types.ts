export type DuplicateMatchReason =
  | 'canonical_url_match'
  | 'normalized_url_match'
  | 'exact_title_match'
  | 'normalized_title_match'
  | 'title_token_similarity'
  | 'guid_match';

export interface DeduplicationResult {
  isDuplicate: boolean;
  isExactDuplicate?: boolean;
  isSimilarStory?: boolean;
  existingArticleId?: string;
  matchedUrl?: string;
  matchedTitle?: string;
  reason?: DuplicateMatchReason;
  similarityScore: number; // 0.0 to 1.0
}
