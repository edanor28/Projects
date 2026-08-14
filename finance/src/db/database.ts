import { Database } from '@nozbe/watermelondb';
import { appSchema } from '@nozbe/watermelondb';
import { schema as appSchemaDef } from '../models/schema';
import { Transaction, Category, Budget } from '../models';

// This function initializes the WatermelonDB Database instance.
// It attempts to use the native SQLite adapter. On Expo-managed workflows
// the native adapter requires a custom dev client / EAS build. If the
// adapter is unavailable, this helper throws with guidance rather than
// silently falling back to an unsafe alternative.
export async function initDatabase(): Promise<Database> {
  let Adapter: any;
  try {
    // Prefer the native SQLite adapter for React Native
    // Package: @nozbe/watermelondb/adapters/sqlite
    // This may not be available in plain Expo Go; a custom dev client is required.
    // Using require to avoid bundlers failing when package is missing.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const sqlite = require('@nozbe/watermelondb/adapters/sqlite');
    Adapter = sqlite.default || sqlite.SQLiteAdapter || sqlite;
  } catch (err) {
    throw new Error([
      'Native SQLite adapter for WatermelonDB not found.',
      'If you are using Expo managed workflow, build a custom dev client or use EAS.',
      'See: https://github.com/Nozbe/WatermelonDB#installation'
    ].join(' '));
  }

  const adapter = new Adapter({ schema: appSchemaDef, dbName: 'finance' });

  const db = new Database({ adapter, modelClasses: [Transaction, Category, Budget], actionsEnabled: true });
  return db;
}

// Lightweight in-memory fallback for development (Expo Go) when native adapter isn't available.
// This provides just enough of the WatermelonDB API used in the app: collections.get().query().fetch(),
// create(), and db.write(action).
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
        // simulate model instance with update()
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
