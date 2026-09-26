import type {
  AIProvider,
  AIProviderGenerateOptions,
  AIProviderResponse,
} from './types';

export class MockAIProvider implements AIProvider {
  public readonly name = 'mock';
  public readonly defaultModel = 'mock-editorial-model-v1';

  private structuredResponses: Array<Record<string, any>> = [];
  private textResponses: string[] = [];
  private shouldFail = false;
  private failureError = 'Simulated AI provider failure';
  private callCount = 0;

  constructor(options?: {
    structuredResponses?: Array<Record<string, any>>;
    textResponses?: string[];
    shouldFail?: boolean;
    failureError?: string;
  }) {
    if (options?.structuredResponses) {
      this.structuredResponses = [...options.structuredResponses];
    }
    if (options?.textResponses) {
      this.textResponses = [...options.textResponses];
    }
    this.shouldFail = !!options?.shouldFail;
    if (options?.failureError) {
      this.failureError = options.failureError;
    }
  }

  public setShouldFail(fail: boolean, error?: string): void {
    this.shouldFail = fail;
    if (error) this.failureError = error;
  }

  public enqueueStructuredResponse(response: Record<string, any>): void {
    this.structuredResponses.push(response);
  }

  public enqueueTextResponse(text: string): void {
    this.textResponses.push(text);
  }

  public getCallCount(): number {
    return this.callCount;
  }

  public reset(): void {
    this.structuredResponses = [];
    this.textResponses = [];
    this.shouldFail = false;
    this.callCount = 0;
  }

  public async generateStructured<T>(
    _prompt: string,
    _schema: Record<string, any>,
    options?: AIProviderGenerateOptions
  ): Promise<AIProviderResponse<T>> {
    this.callCount++;
    const model = options?.model || this.defaultModel;

    if (this.shouldFail) {
      return {
        success: false,
        model,
        latencyMs: 5,
        error: this.failureError,
      };
    }

    const nextResponse = this.structuredResponses.shift();
    if (!nextResponse) {
      // Default fallback mock analysis
      const fallback: any = {
        headline: 'Markets Steady as Federal Reserve Holds Benchmark Policy Rate',
        summary: 'The Federal Reserve maintained interest rates at the conclusion of its monetary policy session. Central bank officials pointed to moderate inflation trends while keeping benchmark borrowing costs stable. Markets responded with calm trading across equity and fixed-income sessions.',
        whyItMatters: 'The policy decision keeps commercial borrowing costs unchanged and leaves financial markets focused on incoming economic indicators.',
        primarySection: 'economy',
        secondarySections: ['markets', 'finance'],
        importance: 'high',
        entities: [
          { type: 'organization', name: 'Federal Reserve' },
          { type: 'country', name: 'United States' },
        ],
        metrics: [
          { name: 'policy_rate', value: '5.25%', context: 'FOMC target range upper bound' },
        ],
      };

      return {
        success: true,
        data: fallback as T,
        rawText: JSON.stringify(fallback),
        model,
        tokenUsage: { promptTokens: 300, completionTokens: 120, totalTokens: 420 },
        latencyMs: 15,
      };
    }

    return {
      success: true,
      data: nextResponse as T,
      rawText: JSON.stringify(nextResponse),
      model,
      tokenUsage: { promptTokens: 300, completionTokens: 120, totalTokens: 420 },
      latencyMs: 10,
    };
  }

  public async generateText(
    _prompt: string,
    options?: AIProviderGenerateOptions
  ): Promise<AIProviderResponse<string>> {
    this.callCount++;
    const model = options?.model || this.defaultModel;

    if (this.shouldFail) {
      return {
        success: false,
        model,
        latencyMs: 5,
        error: this.failureError,
      };
    }

    const nextText = this.textResponses.shift() || 'Default mock response text.';
    return {
      success: true,
      data: nextText,
      rawText: nextText,
      model,
      tokenUsage: { promptTokens: 100, completionTokens: 40, totalTokens: 140 },
      latencyMs: 8,
    };
  }
}
