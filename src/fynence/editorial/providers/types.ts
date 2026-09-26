export interface AIProviderGenerateOptions {
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
  timeoutMs?: number;
  retries?: number;
}

export interface AIProviderTokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AIProviderResponse<T = any> {
  success: boolean;
  data?: T;
  rawText?: string;
  model: string;
  tokenUsage?: AIProviderTokenUsage;
  error?: string;
  latencyMs: number;
}

export interface AIProvider {
  readonly name: string;
  readonly defaultModel: string;

  /**
   * Generates structured data validated against a target JSON schema.
   */
  generateStructured<T>(
    prompt: string,
    schema: Record<string, any>,
    options?: AIProviderGenerateOptions
  ): Promise<AIProviderResponse<T>>;

  /**
   * Generates free-form plain text.
   */
  generateText(
    prompt: string,
    options?: AIProviderGenerateOptions
  ): Promise<AIProviderResponse<string>>;
}
