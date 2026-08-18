import { validateAmount, validateEpochMs, sanitizeText } from '../utils/validation';

export async function seedSampleData(db: any): Promise<void> {
  // Create a sample category and a transaction if they don't already exist.
  const categoriesCollection = db.collections.get('categories');
  const transactionsCollection = db.collections.get('transactions');

  // Defensive check
  if (!categoriesCollection || !transactionsCollection) return;

  await db.write(async () => {
    // Create category
    const existing = await categoriesCollection.query().fetch();
    if (existing.length === 0) {
      await categoriesCollection.create((cat: any) => {
        cat.name = 'Supermarket';
        cat.color_hex = '#00FF66';
        cat.icon = 'cart';
        cat.type = 'expense';
      });
    }

    // Create a sample transaction
    const now = Date.now();
    const amount = validateAmount(23.45);
    const epoch = validateEpochMs(now);
    await transactionsCollection.create((t: any) => {
      t.amount = amount;
      t.date = epoch;
      t.raw_description = sanitizeText('Compra supermercado Demo');
      t.processing_state = 'processed';
    });
  });
}
