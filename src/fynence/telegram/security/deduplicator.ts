export interface DeduplicationCheckResult {
  isDuplicate: boolean;
  isInFlight: boolean;
  message?: string;
}

export class TelegramRequestDeduplicator {
  private inFlightKeys: Set<string> = new Set();
  private recentCompletions: Map<string, number> = new Map();
  private debounceWindowMs: number;

  constructor(debounceWindowMs = 15_000) {
    this.debounceWindowMs = debounceWindowMs;
  }

  public generateKey(chatId: number, editionType: string, sections: string[] = []): string {
    const sortedSections = [...sections].sort().join(',');
    return `${chatId}:${editionType.toLowerCase()}:${sortedSections}`;
  }

  public check(chatId: number, editionType: string, sections: string[] = []): DeduplicationCheckResult {
    const key = this.generateKey(chatId, editionType, sections);
    const now = Date.now();

    // 1. In-flight check
    if (this.inFlightKeys.has(key)) {
      return {
        isDuplicate: true,
        isInFlight: true,
        message: 'Your edition request is already being processed. Please wait a moment...',
      };
    }

    // 2. Debounce window check
    const lastCompleted = this.recentCompletions.get(key);
    if (lastCompleted && now - lastCompleted < this.debounceWindowMs) {
      const waitSeconds = Math.ceil((lastCompleted + this.debounceWindowMs - now) / 1000);
      return {
        isDuplicate: true,
        isInFlight: false,
        message: `An identical edition was just generated. Please wait ${waitSeconds}s before re-requesting.`,
      };
    }

    return {
      isDuplicate: false,
      isInFlight: false,
    };
  }

  public startRequest(chatId: number, editionType: string, sections: string[] = []): void {
    const key = this.generateKey(chatId, editionType, sections);
    this.inFlightKeys.add(key);
  }

  public completeRequest(chatId: number, editionType: string, sections: string[] = []): void {
    const key = this.generateKey(chatId, editionType, sections);
    this.inFlightKeys.delete(key);
    this.recentCompletions.set(key, Date.now());
  }

  public cancelRequest(chatId: number, editionType: string, sections: string[] = []): void {
    const key = this.generateKey(chatId, editionType, sections);
    this.inFlightKeys.delete(key);
  }

  public clear(): void {
    this.inFlightKeys.clear();
    this.recentCompletions.clear();
  }

  public pruneStale(): void {
    const now = Date.now();
    for (const [key, timestamp] of this.recentCompletions.entries()) {
      if (now - timestamp > this.debounceWindowMs * 2) {
        this.recentCompletions.delete(key);
      }
    }
  }
}

export const defaultTelegramDeduplicator = new TelegramRequestDeduplicator();
