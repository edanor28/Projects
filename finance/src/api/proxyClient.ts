import { getProxyBaseUrl } from '../config';

// Client to call the local/remote proxy that wraps Gemini.
// The proxy URL should be provided via EXPO_PUBLIC_PROXY_BASE_URL in dev,
// or configured in the app's runtime config for production.

type CategorizationRequest = { id: string; amount: number; date: number; raw_description: string };

export async function categorizeViaProxy(req: CategorizationRequest, token?: string) {
  const base = getProxyBaseUrl();
  const url = `${base.replace(/\/$/, '')}/api/categorize`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(req), signal: controller.signal });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Proxy error: ${res.status} ${text}`);
    }
    const payload = await res.json();
    if (!payload || typeof payload.category !== 'string' || typeof payload.confidence !== 'number') {
      throw new Error('Invalid response from proxy');
    }
    return { category: payload.category, confidence: payload.confidence };
  } catch (err: any) {
    if (err.name === 'AbortError') throw new Error('Proxy request timed out');
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
