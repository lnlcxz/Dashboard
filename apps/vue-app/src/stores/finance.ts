import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { Filters, ImportRecord, Transaction, Stats, RecurringItem, Forecast } from '@/types';
import { applyCategories } from '@/services/categorizer';
import { applyFilters, computeStats } from '@/services/filters';
import { detectRecurring, getMonthlyRecurringTotal } from '@/services/recurring';
import { generateForecast } from '@/services/forecast';
import {
  addTransactions as dbAdd,
  clearAllData as dbClear,
  deleteImport as dbDelete,
  getAllTransactions,
  getImportHistory,
  getTransactionCount,
  type ImportMeta,
} from '@/services/storage';

const defaultFilters = (): Filters => ({
  search: '',
  category: 'all',
  type: 'all',
  dateFrom: '',
  dateTo: '',
  sortBy: 'date',
  sortDir: 'desc',
});

export const useFinanceStore = defineStore('finance', () => {
  const transactions = ref<Transaction[]>([]);
  const imports = ref<ImportRecord[]>([]);
  const storageCount = ref(0);
  const filters = ref<Filters>(defaultFilters());
  const currentPage = ref(1);

  const filteredTransactions = computed(() => applyFilters(transactions.value, filters.value));
  const stats = computed<Stats>(() => computeStats(transactions.value));
  const recurring = computed<RecurringItem[]>(() => detectRecurring(transactions.value));
  const monthlyRecurringTotal = computed(() => getMonthlyRecurringTotal(recurring.value));
  const forecast = computed<Forecast>(() => generateForecast(transactions.value, recurring.value, 30));

  const availableCategories = computed(() => {
    const set = new Set(transactions.value.map((t) => t.category).filter(Boolean));
    return Array.from(set).sort();
  });

  async function loadData() {
    const raw = await getAllTransactions();
    transactions.value = applyCategories(raw);
    imports.value = await getImportHistory();
    storageCount.value = await getTransactionCount();
  }

  async function importTransactions(txs: Transaction[], meta: ImportMeta) {
    const categorized = applyCategories(txs);
    await dbAdd(categorized, meta);
    await loadData();
  }

  async function removeImport(importId: string) {
    await dbDelete(importId);
    await loadData();
  }

  async function clearAll() {
    await dbClear();
    await loadData();
  }

  function resetFilters() {
    filters.value = defaultFilters();
    currentPage.value = 1;
  }

  function toggleSort(field: Filters['sortBy']) {
    if (filters.value.sortBy === field) {
      filters.value.sortDir = filters.value.sortDir === 'desc' ? 'asc' : 'desc';
    } else {
      filters.value.sortBy = field;
      filters.value.sortDir = 'desc';
    }
  }

  return {
    transactions,
    imports,
    storageCount,
    filters,
    currentPage,
    filteredTransactions,
    stats,
    recurring,
    monthlyRecurringTotal,
    forecast,
    availableCategories,
    loadData,
    importTransactions,
    removeImport,
    clearAll,
    resetFilters,
    toggleSort,
  };
});
