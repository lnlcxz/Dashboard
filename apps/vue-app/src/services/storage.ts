import type { ImportRecord, Transaction } from '@/types';

const DB_NAME = 'findash_db';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
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

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export interface ImportMeta {
  fileName: string;
  total: number;
  parsed: number;
  errors: number;
  errorDetails?: string[];
  metadata?: { separator?: string; headers?: string[]; mapping?: Record<string, number> };
}

export async function addTransactions(transactions: Transaction[], importMeta: ImportMeta) {
  const db = await openDB();
  const importId = `imp_${Date.now()}`;

  return new Promise<{ importId: string; count: number }>((resolve, reject) => {
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
      totalRows: importMeta.total,
      importedRows: importMeta.parsed,
      errors: importMeta.errors,
      errorDetails: importMeta.errorDetails || [],
      metadata: importMeta.metadata || {},
    });

    t.oncomplete = () => resolve({ importId, count: transactions.length });
    t.onerror = () => reject(t.error);
  });
}

export async function getAllTransactions(): Promise<Transaction[]> {
  const db = await openDB();
  const store = db.transaction('transactions').objectStore('transactions');
  return reqToPromise(store.getAll());
}

export async function getImportHistory(): Promise<ImportRecord[]> {
  const db = await openDB();
  const store = db.transaction('imports').objectStore('imports');
  const all = await reqToPromise(store.getAll());
  return (all as ImportRecord[]).sort((a, b) => b.date.localeCompare(a.date));
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
        const keys = reqKeys.result;
        keys.forEach((k) => txStore.delete(k));
      };
      t.oncomplete = () => resolve();
      t.onerror = () => reject(t.error || new Error('Erro na transação do IndexedDB'));
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
  const store = db.transaction('transactions').objectStore('transactions');
  return reqToPromise(store.count());
}
