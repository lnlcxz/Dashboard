// ============================================
// FINDASH — IndexedDB Storage Layer
// ============================================

const DB_NAME = 'findash_db';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
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

function tx(db, stores, mode = 'readonly') {
  const t = db.transaction(stores, mode);
  return Array.isArray(stores) ? stores.map(s => t.objectStore(s)) : t.objectStore(stores);
}

function reqToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function addTransactions(transactions, importMeta) {
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
      status: importMeta.status || 'success',
      rejectedReason: importMeta.rejectedReason || '',
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

export async function getAllTransactions() {
  const db = await openDB();
  const store = tx(db, 'transactions');
  return reqToPromise(store.getAll());
}

export async function getImportHistory() {
  const db = await openDB();
  const store = tx(db, 'imports');
  const all = await reqToPromise(store.getAll());
  return all.sort((a, b) => b.date.localeCompare(a.date));
}

export async function deleteImport(importId) {
  const db = await openDB();
  const t = db.transaction(['transactions', 'imports'], 'readwrite');
  const txStore = t.objectStore('transactions');
  const impStore = t.objectStore('imports');

  return new Promise((resolve, reject) => {
    try {
      // Deletar o registro de importação
      impStore.delete(importId);

      // Usar getAllKeys para buscar os IDs das transações de forma segura
      const idx = txStore.index('importId');
      const reqKeys = idx.getAllKeys(IDBKeyRange.only(importId));
      
      reqKeys.onsuccess = () => {
        const keys = reqKeys.result;
        keys.forEach(k => txStore.delete(k));
      };

      t.oncomplete = () => resolve();
      t.onerror = () => reject(t.error || new Error("Erro na transação do IndexedDB"));
    } catch (e) {
      reject(e);
    }
  });
}

export async function clearAllData() {
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

export async function getTransactionCount() {
  const db = await openDB();
  const store = tx(db, 'transactions');
  return reqToPromise(store.count());
}

export async function saveSetting(key, value) {
  const db = await openDB();
  const store = tx(db, 'settings', 'readwrite');
  return reqToPromise(store.put({ key, value }));
}

export async function getSetting(key) {
  const db = await openDB();
  const store = tx(db, 'settings');
  const result = await reqToPromise(store.get(key));
  return result ? result.value : null;
}
