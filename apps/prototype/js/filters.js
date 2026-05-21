// ============================================
// FINDASH — Filter Engine
// ============================================

export function applyFilters(transactions, filters) {
  let result = [...transactions];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(tx =>
      tx.description.toLowerCase().includes(q) ||
      tx.category.toLowerCase().includes(q) ||
      tx.merchant.toLowerCase().includes(q)
    );
  }

  if (filters.category && filters.category !== 'all') {
    result = result.filter(tx => tx.category === filters.category);
  }

  if (filters.type && filters.type !== 'all') {
    result = result.filter(tx => tx.type === filters.type);
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

  // Sort
  const sortField = filters.sortBy || 'date';
  const sortDir = filters.sortDir || 'desc';
  result.sort((a, b) => {
    let va, vb;
    if (sortField === 'date') { va = a.date; vb = b.date; }
    else if (sortField === 'amount') { va = Math.abs(a.amount); vb = Math.abs(b.amount); }
    else if (sortField === 'description') { va = a.description.toLowerCase(); vb = b.description.toLowerCase(); }
    else if (sortField === 'category') { va = a.category; vb = b.category; }
    else { va = a[sortField]; vb = b[sortField]; }

    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  return result;
}

export function paginate(items, page, perPage = 25) {
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

export function computeStats(transactions) {
  let totalIncome = 0;
  let totalExpense = 0;
  const byCat = {};
  const byMonth = {};
  const byDay = {};

  for (const tx of transactions) {
    if (tx.type === 'income') totalIncome += Math.abs(tx.amount);
    else totalExpense += Math.abs(tx.amount);

    // By category
    if (tx.type === 'expense') {
      byCat[tx.category] = (byCat[tx.category] || 0) + Math.abs(tx.amount);
    }

    // By month
    const d = new Date(tx.date);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!byMonth[monthKey]) byMonth[monthKey] = { income: 0, expense: 0 };
    if (tx.type === 'income') byMonth[monthKey].income += Math.abs(tx.amount);
    else byMonth[monthKey].expense += Math.abs(tx.amount);

    // By day
    const dayKey = d.toISOString().slice(0, 10);
    if (!byDay[dayKey]) byDay[dayKey] = { income: 0, expense: 0 };
    if (tx.type === 'income') byDay[dayKey].income += Math.abs(tx.amount);
    else byDay[dayKey].expense += Math.abs(tx.amount);
  }

  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100) : 0;

  return {
    totalIncome,
    totalExpense,
    balance,
    savingsRate,
    byCat,
    byMonth,
    byDay,
    transactionCount: transactions.length,
  };
}
