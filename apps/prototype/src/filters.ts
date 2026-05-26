// ============================================
// FINDASH — Filter Engine
// ============================================

import type { Transaction, FilterState, ComputedStats, PaginateResult, MonthBucket } from './types/index.js';

export function applyFilters(transactions: Transaction[], filters: FilterState): Transaction[] {
  let result = [...transactions];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(tx =>
      tx.description.toLowerCase().includes(q) ||
      tx.category.toLowerCase().includes(q) ||
      tx.merchant.toLowerCase().includes(q),
    );
  }
  if (filters.category && filters.category !== 'all') {
    result = result.filter(tx => tx.category === filters.category);
  }
  if (filters.type && filters.type !== 'all') {
    result = result.filter(tx => tx.type === filters.type);
  }
  if (filters.accountId && filters.accountId !== 'all') {
    result = result.filter(tx => tx.accountId === filters.accountId);
  }
  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom);
    from.setHours(0, 0, 0, 0);
    result = result.filter(tx => new Date(tx.date) >= from);
  }
  if (filters.dateTo) {
    const to = new Date(filters.dateTo);
    to.setHours(23, 59, 59, 999);
    result = result.filter(tx => new Date(tx.date) <= to);
  }

  const sortField = filters.sortBy || 'date';
  const sortDir = filters.sortDir || 'desc';
  result.sort((a, b) => {
    let va: string | number, vb: string | number;
    if (sortField === 'amount') { va = Math.abs(a.amount); vb = Math.abs(b.amount); }
    else if (sortField === 'description') { va = a.description.toLowerCase(); vb = b.description.toLowerCase(); }
    else if (sortField === 'category') { va = a.category; vb = b.category; }
    else { va = a.date; vb = b.date; }
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });
  return result;
}

export function paginate(items: Transaction[], page: number, perPage = 25): PaginateResult {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const safePage = Math.max(1, Math.min(page, totalPages));
  const start = (safePage - 1) * perPage;
  return {
    items: items.slice(start, start + perPage),
    page: safePage,
    totalPages,
    totalItems: items.length,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
  };
}

export function computeStats(transactions: Transaction[]): ComputedStats {
  let totalIncome = 0;
  let totalExpense = 0;
  const byCat: Record<string, number> = {};
  const byMonth: Record<string, MonthBucket> = {};

  for (const tx of transactions) {
    if (tx.type === 'income') totalIncome += Math.abs(tx.amount);
    else totalExpense += Math.abs(tx.amount);

    if (tx.type === 'expense') {
      byCat[tx.category] = (byCat[tx.category] ?? 0) + Math.abs(tx.amount);
    }

    const d = new Date(tx.date);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!byMonth[monthKey]) byMonth[monthKey] = { income: 0, expense: 0 };
    if (tx.type === 'income') byMonth[monthKey]!.income += Math.abs(tx.amount);
    else byMonth[monthKey]!.expense += Math.abs(tx.amount);
  }

  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100) : 0;
  return { totalIncome, totalExpense, balance, savingsRate, byCat, byMonth, transactionCount: transactions.length };
}
