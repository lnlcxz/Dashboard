// ============================================
// FINDASH — IndexedDB Storage Layer
// ============================================

import type { Transaction, ImportMeta, ImportRecord, AddTransactionsResult } from './types/index.js';

const DB_NAME = 'findash_db';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e: IDBVersionChangeEvent) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('transactions')) {
        const store = db.createObjectStore('transactions', { keyPath: 'id' });
        store.createIndex('date', 'date');
        store.createIndex('category', 'category');
        store.createIndex('type', 'type');
        store.createIndex('merchant', 'merchant');
        store.createIndex('importId', 'importId');
      }
      if (!db.objectStoreNames.contains('imports')) {
        const iStore = db.createObjectStore('imports', { keyPath: 'id' });
        iStore.createIndex('date', 'date');
      }
      if (!db.objectStoreNames.contains('categories')) {
        db.createObjectStore('categories', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getStore(db: IDBDatabase, storeName: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
  return db.transaction(storeName, mode).objectStore(storeName);
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function addTransactions(
  transactions: Transaction[],
  importMeta: ImportMeta,
): Promise<AddTransactionsResult> {
  const db = await openDB();
  const importId = `imp_${Date.now()}`;

  return new Promise((resolve, reject) => {
    const t = db.transaction(['transactions', 'imports'], 'readwrite');
    const txStore = t.objectStore('transactions');
    const impStore = t.objectStore('imports');

    for (const tx of transactions) {
      txStore.put({ ...tx, importId });
    }

    impStore.put({
      id: importId,
      date: new Date().toISOString(),
      fileName: importMeta.fileName,
      status: importMeta.status ?? 'success',
      rejectedReason: importMeta.rejectedReason ?? '',
      totalRows: importMeta.total,
      importedRows: importMeta.parsed,
      errors: importMeta.errors,
      errorDetails: importMeta.errorDetails ?? [],
      metadata: importMeta.metadata ?? {},
    });

    t.oncomplete = () => resolve({ importId, count: transactions.length });
    t.onerror = () => reject(t.error);
  });
}

export async function getAllTransactions(): Promise<Transaction[]> {
  const db = await openDB();
  return reqToPromise(getStore(db, 'transactions').getAll());
}

export async function getImportHistory(): Promise<ImportRecord[]> {
  const db = await openDB();
  const all = await reqToPromise<ImportRecord[]>(getStore(db, 'imports').getAll());
  return all.sort((a, b) => b.date.localeCompare(a.date));
}

export async function deleteImport(importId: string): Promise<void> {
  const db = await openDB();
  const t = db.transaction(['transactions', 'imports'], 'readwrite');
  const txStore = t.objectStore('transactions');
  const impStore = t.objectStore('imports');

  return new Promise((resolve, reject) => {
    try {
      impStore.delete(importId);
      const idx = txStore.index('importId');
      const reqKeys = idx.getAllKeys(IDBKeyRange.only(importId));
      reqKeys.onsuccess = () => {
        reqKeys.result.forEach(k => txStore.delete(k));
      };
      t.oncomplete = () => resolve();
      t.onerror = () => reject(t.error ?? new Error('Erro na transação do IndexedDB'));
    } catch (e) {
      reject(e);
    }
  });
}

export async function clearAllData(): Promise<void> {
  const db = await openDB();
  const t = db.transaction(['transactions', 'imports', 'categories', 'settings'], 'readwrite');
  t.objectStore('transactions').clear();
  t.objectStore('imports').clear();
  t.objectStore('categories').clear();
  t.objectStore('settings').clear();
  return new Promise((resolve, reject) => {
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}

export async function getTransactionCount(): Promise<number> {
  const db = await openDB();
  return reqToPromise(getStore(db, 'transactions').count());
}

export async function saveSetting(key: string, value: unknown): Promise<void> {
  const db = await openDB();
  await reqToPromise(getStore(db, 'settings', 'readwrite').put({ key, value }));
}

export async function getSetting(key: string): Promise<unknown> {
  const db = await openDB();
  const result = await reqToPromise<{ key: string; value: unknown } | undefined>(
    getStore(db, 'settings').get(key),
  );
  return result ? result.value : null;
}
