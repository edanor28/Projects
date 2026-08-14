type CategorizationRequest = { id: string; amount: number; date: number; raw_description: string };

export async function categorizeWithGemini(req: CategorizationRequest) {
  const url = process.env.GEMINI_API_URL;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!url) throw new Error('GEMINI_API_URL not configured');
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const body = {
    prompt: `Categorize the transaction and return ONLY JSON with {"category":"...","confidence":0.95}. Transaction: ${req.raw_description}`,
    metadata: { amount: req.amount, date: req.date }
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const fetch = (await import('node-fetch')).default;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    if (!res.ok) {
      throw new Error(`Gemini API returned ${res.status}`);
    }
    const payload: any = await res.json();
    // defensive parsing
    const category = typeof payload.category === 'string' ? payload.category : payload?.result?.category;
    const confidence = typeof payload.confidence === 'number' ? payload.confidence : payload?.result?.confidence;
    if (typeof category !== 'string' || typeof confidence !== 'number') {
      throw new Error('Invalid response shape from Gemini');
    }
    return { category, confidence };
  } catch (err: any) {
    if (err.name === 'AbortError') throw new Error('Gemini request timed out');
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
