export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  /** stored in cents, signed (positive = income, negative = expense) */
  amount: number;
  amountRaw?: number;
  category: string;
  categoryIcon?: string;
  type: TransactionType;
  merchant: string;
  importId?: string;
}

export interface ImportMetadata {
  separator?: string;
  headers?: string[];
  mapping?: Record<string, number>;
}

export interface ImportRecord {
  id: string;
  date: string;
  fileName: string;
  totalRows: number;
  importedRows: number;
  errors: number;
  errorDetails: string[];
  metadata: ImportMetadata;
}

export interface ParseResult {
  transactions: Transaction[];
  errors: string[];
  total: number;
  parsed: number;
  separator: string;
  headers: string[];
  mapping: Record<string, number>;
}

export interface MonthBucket {
  income: number;
  expense: number;
}

export interface Stats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  savingsRate: number;
  byCat: Record<string, number>;
  byMonth: Record<string, MonthBucket>;
  byDay: Record<string, MonthBucket>;
  transactionCount: number;
}

export interface Filters {
  search: string;
  category: string;
  type: 'all' | TransactionType;
  dateFrom: string;
  dateTo: string;
  sortBy: 'date' | 'amount' | 'description' | 'category';
  sortDir: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  items: T[];
  page: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface RecurringItem {
  merchant: string;
  category: string;
  categoryIcon: string;
  avgAmount: number;
  occurrences: number;
  interval: string;
  intervalDays: number;
  avgGap: number;
  nextExpected: string;
  lastDate: string;
  confidence: number;
}

export interface ForecastPoint {
  date: string;
  day: number;
  balance: number;
  income: number;
  expense: number;
}

export interface Forecast {
  points: ForecastPoint[];
  startBalance?: number;
  projectedIncome: number;
  projectedExpense: number;
  projectedBalance: number;
  avgDailyIncome?: number;
  avgDailyExpense?: number;
  monthlyData?: { key: string; income: number; expense: number; net: number; date: Date }[];
}

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}
