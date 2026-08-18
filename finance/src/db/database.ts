// Expo Go-compatible in-memory database.
// This avoids the native SQLite adapter that requires a custom dev client / native build.
export async function initDatabase(): Promise<any> {
  return initInMemoryDatabase();
}

export async function initInMemoryDatabase(): Promise<any> {
  type Rec = any;
  const makeCollection = () => {
    const items: Rec[] = [];
    return {
      _items: items,
      async query() {
        return {
          async fetch() {
            return items.slice();
          }
        };
      },
      async create(cb: (r: any) => void) {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const rec: any = { id };
        cb(rec);
        rec.update = async (updater: (r: any) => void) => { updater(rec); };
        items.push(rec);
        return rec;
      }
    };
  };

  const db: any = {
    collections: new Map<string, any>(),
    async write(cb: () => Promise<void> | void) {
      return cb();
    }
  };
  db.collections.set('transactions', makeCollection());
  db.collections.set('categories', makeCollection());
  db.collections.set('budgets', makeCollection());
  db.collections.get = (name: string) => db.collections.get(name);
  return db;
}
