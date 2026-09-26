import 'server-only';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// Models in priority order (Flagship Non-Lite Flash models)
const PREFERRED_MODELS = [
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-3.6-flash',
  'gemini-3.7-flash',
];

export interface GeminiContentPart {
  text: string;
}

export interface GeminiRequestOptions {
  model?: string;
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: 'text/plain' | 'application/json';
}

export interface GeminiResponse {
  text: string;
  raw?: any;
  error?: string;
}

const DEFAULT_GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

/**
 * Server-only Gemini API service.
 * Uses process.env.GEMINI_API_KEY with server-only fallback. Never exposes the key to the frontend.
 */
export async function callGemini(
  prompt: string,
  options?: GeminiRequestOptions
): Promise<GeminiResponse> {
  const apiKey = process.env.GEMINI_API_KEY || DEFAULT_GEMINI_API_KEY;
  if (!apiKey) {
    return {
      text: '',
      error: 'GEMINI_API_KEY is not configured on the server environment.',
    };
  }

  const model = options?.model || PREFERRED_MODELS[0];
  const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey}`;

  const requestBody: Record<string, any> = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: options?.temperature ?? 0.4,
      maxOutputTokens: options?.maxOutputTokens ?? 2048,
    },
  };

  if (options?.systemInstruction) {
    requestBody.systemInstruction = {
      parts: [{ text: options.systemInstruction }],
    };
  }

  if (options?.responseMimeType) {
    requestBody.generationConfig.responseMimeType = options.responseMimeType;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errorMsg =
        errorData?.error?.message ||
        `Gemini API returned status ${res.status}: ${res.statusText}`;

      // If model is not found or deprecated, try next fallback model
      const currentIndex = PREFERRED_MODELS.indexOf(model);
      if (res.status === 404 && currentIndex !== -1 && currentIndex + 1 < PREFERRED_MODELS.length) {
        const nextModel = PREFERRED_MODELS[currentIndex + 1];
        console.warn(`[GeminiService] Model ${model} returned 404, trying fallback model ${nextModel}...`);
        return callGemini(prompt, { ...options, model: nextModel });
      }

      console.error('[GeminiService] API Error:', errorMsg);
      return { text: '', error: errorMsg, raw: errorData };
    }

    const data = await res.json();
    const candidate = data?.candidates?.[0];
    const textPart = candidate?.content?.parts?.[0]?.text || '';

    return {
      text: textPart.trim(),
      raw: data,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown network error calling Gemini API';
    console.error('[GeminiService] Network Error:', message);
    return { text: '', error: message };
  }
}
