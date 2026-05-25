// ============================================
// FINDASH — Cash Flow Forecast
// Weighted moving average 3 months (weights 3, 2, 1)
// ============================================

import type { Transaction, RecurringItem, ForecastResult, ForecastPoint, MonthlyTotal } from './types/index.js';

function getMonthKey(date: string | Date): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthlyTotals(transactions: Transaction[], months = 6): MonthlyTotal[] {
  const now = new Date();
  const result: MonthlyTotal[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = getMonthKey(d);
    const monthTxs = transactions.filter(tx => getMonthKey(tx.date) === key);
    let income = 0, expense = 0;
    for (const tx of monthTxs) {
      if (tx.type === 'income') income += Math.abs(tx.amount);
      else expense += Math.abs(tx.amount);
    }
    result.push({ key, income, expense, net: income - expense, date: d });
  }
  return result;
}

function weightedAverage(values: number[], weights: number[]): number {
  if (values.length === 0) return 0;
  const w = weights.slice(0, values.length);
  const totalWeight = w.reduce((s, v) => s + v, 0);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += (values[i] ?? 0) * (w[i] ?? 1);
  }
  return Math.round(sum / totalWeight);
}

export function generateForecast(
  transactions: Transaction[],
  _recurringItems: RecurringItem[] = [],
  horizon = 30,
): ForecastResult {
  const monthly = getMonthlyTotals(transactions, 3);

  if (monthly.length === 0) {
    return { points: [], projectedIncome: 0, projectedExpense: 0, projectedBalance: 0, startBalance: 0, avgDailyIncome: 0, avgDailyExpense: 0, monthlyData: [] };
  }

  const weights = [3, 2, 1];
  const recentIncomes = monthly.slice(-3).reverse().map(m => m.income);
  const recentExpenses = monthly.slice(-3).reverse().map(m => m.expense);
  const avgMonthlyIncome = weightedAverage(recentIncomes, weights);
  const avgMonthlyExpense = weightedAverage(recentExpenses, weights);
  const dailyIncome = avgMonthlyIncome / 30;
  const dailyExpense = avgMonthlyExpense / 30;

  const now = new Date();
  const points: ForecastPoint[] = [];
  let runningBalance = 0;

  for (const tx of transactions) {
    if (tx.type === 'income') runningBalance += Math.abs(tx.amount);
    else runningBalance -= Math.abs(tx.amount);
  }
  const startBalance = runningBalance;

  for (let i = 1; i <= horizon; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    runningBalance += dailyIncome - dailyExpense;
    points.push({
      date: d.toISOString().slice(0, 10),
      day: i,
      balance: Math.round(runningBalance),
      income: Math.round(dailyIncome),
      expense: Math.round(dailyExpense),
    });
  }

  return {
    points,
    startBalance: Math.round(startBalance),
    projectedIncome: Math.round(dailyIncome * horizon),
    projectedExpense: Math.round(dailyExpense * horizon),
    projectedBalance: Math.round(runningBalance),
    avgDailyIncome: Math.round(dailyIncome),
    avgDailyExpense: Math.round(dailyExpense),
    monthlyData: monthly,
  };
}
