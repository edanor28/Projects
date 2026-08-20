import { categorizeViaProxy } from '../api/proxyClient';
import { GeminiClient } from '../api/groqClient';
import { getGeminiApiUrl, getProxyBaseUrl } from '../config';

export async function categorizePending(db: any, maxItems = 10): Promise<number> {
  const txCollection = db.collections.get('transactions');
  const catCollection = db.collections.get('categories');

  const pending = (await txCollection.query().fetch()).filter((t: any) => t.processing_state === 'new');
  const toProcess = pending.slice(0, maxItems);
  if (toProcess.length === 0) return 0;

  const proxyBase = getProxyBaseUrl();
  const geminiUrl = getGeminiApiUrl();
  const gemini = geminiUrl ? new GeminiClient(geminiUrl) : null;

  let processed = 0;
  for (const rec of toProcess as any[]) {
    try {
      const row = rec as any;
      const req = { id: String(row.id), amount: Number(row.amount), date: Number(row.date), raw_description: String(row.raw_description) };
      let res: any = null;
      try {
        if (proxyBase) {
          res = await categorizeViaProxy(req);
        } else if (gemini) {
          res = await gemini.categorize(req as any);
        } else {
          throw new Error('No categorization backend configured');
        }
      } catch (err) {
        console.warn('Categorization call failed for', row.id, err);
        await db.write(async () => {
          await row.update((r: any) => { r.processing_state = 'failed'; });
        });
        continue;
      }

      // find or create category by name
      const catName = String(res.category);
      let cats = await catCollection.query().fetch();
      let match = cats.find((c: any) => String(c.name).toLowerCase() === catName.toLowerCase());
      if (!match) {
        await db.write(async () => {
          match = await catCollection.create((c: any) => {
            c.name = catName;
            c.color_hex = '#999999';
            c.icon = 'tag';
            c.type = 'expense';
          });
        });
      }

      // update transaction
      await db.write(async () => {
        await row.update((r: any) => {
          r.category_id = String((match as any).id);
          r.processing_state = 'categorized';
        });
      });
      processed += 1;
    } catch (err) {
      console.warn('Failed to categorize transaction', err);
    }
  }
  return processed;
}
