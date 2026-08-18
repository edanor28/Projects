export type IncomingTransaction = {
  id?: string | number;
  amount: number;
  date: number;
  raw_description: string;
};

export async function persistTransactions(db: any, items: IncomingTransaction[]): Promise<number> {
  const collection = db.collections.get('transactions');
  let created = 0;
  await db.write(async () => {
    for (const it of items) {
      try {
        // Simple deduplication: fetch recent transactions and compare fields
        const existing = await collection.query().fetch();
        const dup = existing.find((e: any) => {
          try {
            return Number(e.amount) === Number(it.amount) && Number(e.date) === Number(it.date) && String(e.raw_description) === String(it.raw_description);
          } catch (_) {
            return false;
          }
        });
        if (dup) continue;

        await collection.create((t: any) => {
          t.amount = Number(it.amount);
          t.date = Number(it.date);
          t.raw_description = String(it.raw_description);
          t.processing_state = 'new';
        });
        created += 1;
      } catch (err) {
        console.warn('Failed to create transaction', err);
      }
    }
  });
  return created;
}
