import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { initDatabase } from '../db/database';
import { persistTransactions } from '../db/transactions';
import { categorizePending } from '../services/categorizer';
import { getProxyBaseUrl } from '../config';

const TASK_NAME = 'FETCH_TRANSACTIONS_TASK';

export async function registerBackgroundFetchAsync() {
  try {
    await BackgroundFetch.registerTaskAsync(TASK_NAME, {
      minimumInterval: 900, // 15 minutes
      stopOnTerminate: false,
      startOnBoot: true
    });
    return true;
  } catch (e) {
    console.warn('registerBackgroundFetchAsync failed', e);
    return false;
  }
}

export async function unregisterBackgroundFetchAsync() {
  try {
    await BackgroundFetch.unregisterTaskAsync(TASK_NAME);
    return true;
  } catch (e) {
    console.warn('unregisterBackgroundFetchAsync failed', e);
    return false;
  }
}

const FetchResult = (BackgroundFetch as any).BackgroundFetchResult ?? BackgroundFetch;

TaskManager.defineTask(TASK_NAME, async () => {
  try {
    // TODO: implement actual sync with Open Banking / GoCardless
    console.log('[BackgroundFetch] running fetch task');
    // Example: fetch from proxy endpoint to pull new transactions
    const base = getProxyBaseUrl();
    const resp = await fetch(`${base.replace(/\/$/, '')}/api/openbanking/poll`);
    if (!resp.ok) {
      console.warn('Background fetch failed status', resp.status);
      return FetchResult.Failed;
    }
    const data = await resp.json();
    console.log('[BackgroundFetch] fetched items', Array.isArray(data) ? data.length : 0);
    if (Array.isArray(data) && data.length > 0) {
      try {
        const db = await initDatabase();
        const created = await persistTransactions(db, data as any[]);
        console.log('[BackgroundFetch] persisted', created, 'items');
        try {
          const processed = await categorizePending(db, 20);
          console.log('[BackgroundFetch] categorized', processed, 'items');
        } catch (e) {
          console.warn('Error during categorization', e);
        }
        return created > 0 ? FetchResult.NewData : FetchResult.NoData;
      } catch (err) {
        console.warn('BackgroundFetch persist error', err);
        return FetchResult.Failed;
      }
    }
    return FetchResult.NoData;
  } catch (err) {
    console.warn('Background fetch error', err);
    return FetchResult.Failed;
  }
});
