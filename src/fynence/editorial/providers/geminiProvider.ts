import type {
  AIProvider,
  AIProviderGenerateOptions,
  AIProviderResponse,
} from './types';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export class GeminiProvider implements AIProvider {
  public readonly name = 'gemini';
  public readonly defaultModel = 'gemini-2.5-flash';

  private apiKey: string;
  private apiBaseUrl: string;

  constructor(options?: { apiKey?: string; apiBaseUrl?: string }) {
    this.apiKey =
      options?.apiKey ||
      (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY || '' : '');
    this.apiBaseUrl = options?.apiBaseUrl || GEMINI_API_BASE;
  }

  public async generateStructured<T>(
    prompt: string,
    schema: Record<string, any>,
    options?: AIProviderGenerateOptions
  ): Promise<AIProviderResponse<T>> {
    const startTime = Date.now();
    const model = options?.model || this.defaultModel;

    if (!this.apiKey) {
      return {
        success: false,
        model,
        latencyMs: Date.now() - startTime,
        error: 'GEMINI_API_KEY is not configured in the environment.',
      };
    }

    const systemInstruction = options?.systemInstruction
      ? `${options.systemInstruction}\nYou MUST output valid JSON conforming strictly to the requested schema. Do not include markdown code block formatting or introductory text.`
      : 'You MUST output valid JSON conforming strictly to the requested schema.';

    const requestBody: Record<string, any> = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      generationConfig: {
        temperature: options?.temperature ?? 0.2,
        maxOutputTokens: options?.maxTokens ?? 2048,
        responseMimeType: 'application/json',
      },
    };

    const maxRetries = options?.retries ?? 2;
    let attempt = 0;
    let lastError = '';

    while (attempt <= maxRetries) {
      try {
        const timeoutMs = options?.timeoutMs ?? 12000;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const url = `${this.apiBaseUrl}/models/${model}:generateContent?key=${this.apiKey}`;

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData?.error?.message || `HTTP ${res.status}: ${res.statusText}`;

          // Rate limit or server error: retry with backoff
          if ((res.status === 429 || res.status >= 500) && attempt < maxRetries) {
            attempt++;
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
            continue;
          }

          return {
            success: false,
            model,
            latencyMs: Date.now() - startTime,
            error: errMsg,
          };
        }

        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const tokenUsage = data?.usageMetadata
          ? {
              promptTokens: data.usageMetadata.promptTokenCount || 0,
              completionTokens: data.usageMetadata.candidatesTokenCount || 0,
              totalTokens: data.usageMetadata.totalTokenCount || 0,
            }
          : undefined;

        const cleanedJson = this.extractCleanJson(rawText);
        const parsed = JSON.parse(cleanedJson) as T;

        return {
          success: true,
          data: parsed,
          rawText,
          model,
          tokenUsage,
          latencyMs: Date.now() - startTime,
        };
      } catch (err: any) {
        lastError = err?.message || 'Network or parse error';
        if (attempt < maxRetries) {
          attempt++;
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
          continue;
        }
        break;
      }
    }

    return {
      success: false,
      model,
      latencyMs: Date.now() - startTime,
      error: `Gemini structured generation failed after ${maxRetries} retries: ${lastError}`,
    };
  }

  public async generateText(
    prompt: string,
    options?: AIProviderGenerateOptions
  ): Promise<AIProviderResponse<string>> {
    const startTime = Date.now();
    const model = options?.model || this.defaultModel;

    if (!this.apiKey) {
      return {
        success: false,
        model,
        latencyMs: Date.now() - startTime,
        error: 'GEMINI_API_KEY is not configured in the environment.',
      };
    }

    const requestBody: Record<string, any> = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options?.temperature ?? 0.3,
        maxOutputTokens: options?.maxTokens ?? 2048,
      },
    };

    if (options?.systemInstruction) {
      requestBody.systemInstruction = {
        parts: [{ text: options.systemInstruction }],
      };
    }

    try {
      const timeoutMs = options?.timeoutMs ?? 10000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const url = `${this.apiBaseUrl}/models/${model}:generateContent?key=${this.apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return {
          success: false,
          model,
          latencyMs: Date.now() - startTime,
          error: errData?.error?.message || `HTTP ${res.status}: ${res.statusText}`,
        };
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const tokenUsage = data?.usageMetadata
        ? {
            promptTokens: data.usageMetadata.promptTokenCount || 0,
            completionTokens: data.usageMetadata.candidatesTokenCount || 0,
            totalTokens: data.usageMetadata.totalTokenCount || 0,
          }
        : undefined;

      return {
        success: true,
        data: text,
        rawText: text,
        model,
        tokenUsage,
        latencyMs: Date.now() - startTime,
      };
    } catch (err: any) {
      return {
        success: false,
        model,
        latencyMs: Date.now() - startTime,
        error: err?.message || 'Gemini text generation failed',
      };
    }
  }

  private extractCleanJson(text: string): string {
    const trimmed = text.trim();
    if (trimmed.startsWith('```json') && trimmed.endsWith('```')) {
      return trimmed.slice(7, -3).trim();
    }
    if (trimmed.startsWith('```') && trimmed.endsWith('```')) {
      return trimmed.slice(3, -3).trim();
    }
    return trimmed;
  }
}
