import { getGeminiApiUrl } from '../config';

// Minimal, secure stub client for cloud inference (Gemini)
// Security: read API URL and key from environment variables. Do NOT hardcode or log secrets.

type CategorizationRequest = {
  id: string;
  amount: number;
  date: number; // epoch ms
  raw_description: string;
};

type CategorizationResponse = {
  category: string;
  confidence: number;
};

export class GeminiClient {
  private url: string;
  private apiKey: string | undefined;

  constructor(url: string) {
    this.url = url || getGeminiApiUrl();
    if (!this.url) throw new Error('Gemini API URL required');
    this.apiKey = (globalThis as any)?.process?.env?.GEMINI_API_KEY || (globalThis as any)?.process?.env?.EXPO_PUBLIC_GEMINI_API_KEY;
  }

  private validateResponse(payload: any): CategorizationResponse {
    if (!payload) throw new Error('Empty response from Gemini');
    // The model may return nested objects—be defensive and pick the safe path
    const category = typeof payload.category === 'string' ? payload.category : payload?.result?.category;
    const confidence = typeof payload.confidence === 'number' ? payload.confidence : payload?.result?.confidence;
    if (typeof category !== 'string' || typeof confidence !== 'number') {
      throw new Error('Invalid response shape from Gemini');
    }
    return { category, confidence };
  }

  async categorize(tx: CategorizationRequest): Promise<CategorizationResponse> {
    // Input validation and sanitization
    if (!tx || typeof tx.id !== 'string' || tx.id.trim() === '') throw new Error('Invalid request id');
    if (typeof tx.raw_description !== 'string' || tx.raw_description.trim() === '') throw new Error('Invalid raw_description');
    if (!Number.isFinite(tx.amount)) throw new Error('Invalid amount');
    if (!Number.isFinite(tx.date)) throw new Error('Invalid date');

    const body = {
      // Keep prompts strict and small; expect JSON back. Backend must enforce rate limits and size limits.
      prompt: `Categorize the following transaction into a single category name and a confidence float between 0 and 1. Respond ONLY with JSON: {"category":"...","confidence":0.95}. Transaction: ${tx.raw_description}`,
      metadata: { amount: tx.amount, date: tx.date }
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;

    // Use AbortController to enforce a client-side timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const res = await fetch(this.url, { method: 'POST', headers, body: JSON.stringify(body), signal: controller.signal });
      if (!res.ok) {
        throw new Error(`Gemini API error: ${res.status}`);
      }
      const payload = await res.json();
      return this.validateResponse(payload);
    } catch (err: any) {
      if (err.name === 'AbortError') throw new Error('Gemini request timed out');
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }
}
