// ============================================
// FINDASH — Cash Flow Forecast
// Média móvel ponderada 3 meses (pesos 3, 2, 1)
// Horizontes: 30 e 90 dias
// ============================================

function getMonthKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthlyTotals(transactions, months = 6) {
  const now = new Date();
  const result = [];

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

function weightedAverage(values, weights) {
  if (values.length === 0) return 0;
  const w = weights.slice(0, values.length);
  const totalWeight = w.reduce((s, v) => s + v, 0);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i] * (w[i] || 1);
  }
  return Math.round(sum / totalWeight);
}

export function generateForecast(transactions, recurringItems = [], horizon = 30) {
  const monthly = getMonthlyTotals(transactions, 3);

  if (monthly.length === 0) {
    return { points: [], projectedIncome: 0, projectedExpense: 0, projectedBalance: 0 };
  }

  // Weighted moving average (most recent month = weight 3)
  const weights = [3, 2, 1];
  const recentIncomes = monthly.slice(-3).reverse().map(m => m.income);
  const recentExpenses = monthly.slice(-3).reverse().map(m => m.expense);

  const avgMonthlyIncome = weightedAverage(recentIncomes, weights);
  const avgMonthlyExpense = weightedAverage(recentExpenses, weights);

  const dailyIncome = avgMonthlyIncome / 30;
  const dailyExpense = avgMonthlyExpense / 30;

  // Add recurring fixed costs
  let recurringDaily = 0;
  for (const item of recurringItems) {
    recurringDaily += item.avgAmount / (item.intervalDays || 30);
  }

  // Generate daily forecast points
  const now = new Date();
  const points = [];
  let runningBalance = 0;

  // Calculate current balance from all transactions
  for (const tx of transactions) {
    runningBalance += tx.amount; // amount is already signed (negative for expenses)
  }

  const startBalance = runningBalance;

  for (let i = 1; i <= horizon; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);

    const projIncome = dailyIncome;
    const projExpense = dailyExpense;
    runningBalance += projIncome - projExpense;

    points.push({
      date: d.toISOString().slice(0, 10),
      day: i,
      balance: Math.round(runningBalance),
      income: Math.round(projIncome),
      expense: Math.round(projExpense),
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
