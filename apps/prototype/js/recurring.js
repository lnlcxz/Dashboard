// ============================================
// FINDASH — Recurring Transaction Detector
// Algoritmo: ±5% valor, mesmo merchant, 4 intervalos (7/14/30/365d ±3d), min 2 ocorrências
// ============================================

function normalizeMerchant(name) {
  return (name || '')
    .toUpperCase()
    .replace(/[^A-ZÁÀÃÉÍÓÚÇ\s]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isValueMatch(a, b, tolerance = 0.05) {
  if (a === 0 && b === 0) return true;
  const avg = (Math.abs(a) + Math.abs(b)) / 2;
  if (avg === 0) return true;
  return Math.abs(Math.abs(a) - Math.abs(b)) / avg <= tolerance;
}

function daysBetween(d1, d2) {
  return Math.abs((d1 - d2) / (1000 * 60 * 60 * 24));
}

const INTERVALS = [
  { days: 7, label: 'Semanal', tolerance: 2 },
  { days: 14, label: 'Quinzenal', tolerance: 3 },
  { days: 30, label: 'Mensal', tolerance: 4 },
  { days: 90, label: 'Trimestral', tolerance: 7 },
  { days: 365, label: 'Anual', tolerance: 15 },
];

function detectInterval(dates) {
  if (dates.length < 2) return null;
  const sorted = dates.map(d => new Date(d)).sort((a, b) => a - b);
  const gaps = [];
  for (let i = 1; i < sorted.length; i++) {
    gaps.push(daysBetween(sorted[i], sorted[i - 1]));
  }
  const avgGap = gaps.reduce((s, g) => s + g, 0) / gaps.length;

  for (const interval of INTERVALS) {
    const matchCount = gaps.filter(g => Math.abs(g - interval.days) <= interval.tolerance).length;
    if (matchCount >= Math.floor(gaps.length * 0.6)) {
      return { ...interval, avgGap: Math.round(avgGap), nextExpected: new Date(sorted[sorted.length - 1].getTime() + interval.days * 86400000) };
    }
  }
  return null;
}

export function detectRecurring(transactions) {
  // Group by normalized merchant
  const groups = {};
  const expenses = transactions.filter(t => t.type === 'expense');

  for (const tx of expenses) {
    const merchant = normalizeMerchant(tx.merchant || tx.description);
    if (!merchant || merchant.length < 3) continue;
    if (!groups[merchant]) groups[merchant] = [];
    groups[merchant].push(tx);
  }

  const recurring = [];

  for (const [merchant, txs] of Object.entries(groups)) {
    if (txs.length < 2) continue;

    // Check if values are consistent (±5%)
    const amounts = txs.map(t => Math.abs(t.amount));
    const refAmount = amounts[0];
    const consistentValues = amounts.filter(a => isValueMatch(a, refAmount)).length;

    if (consistentValues < Math.floor(txs.length * 0.7)) continue;

    // Check if there's a recurring interval
    const interval = detectInterval(txs.map(t => t.date));
    if (!interval) continue;

    const avgAmount = Math.round(amounts.reduce((s, a) => s + a, 0) / amounts.length);
    const lastTx = txs.sort((a, b) => b.date.localeCompare(a.date))[0];

    recurring.push({
      merchant,
      category: lastTx.category || 'Outros',
      categoryIcon: lastTx.categoryIcon || '📌',
      avgAmount,
      occurrences: txs.length,
      interval: interval.label,
      intervalDays: interval.days,
      avgGap: interval.avgGap,
      nextExpected: interval.nextExpected.toISOString(),
      lastDate: lastTx.date,
      confidence: Math.min(100, Math.round((consistentValues / txs.length) * 100)),
    });
  }

  // Sort by amount descending
  return recurring.sort((a, b) => b.avgAmount - a.avgAmount);
}

export function getMonthlyRecurringTotal(recurringItems) {
  let total = 0;
  for (const item of recurringItems) {
    if (item.intervalDays <= 31) {
      total += item.avgAmount;
    } else if (item.intervalDays <= 95) {
      total += Math.round(item.avgAmount / 3);
    } else {
      total += Math.round(item.avgAmount / 12);
    }
  }
  return total;
}
