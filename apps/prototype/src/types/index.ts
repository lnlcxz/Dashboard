// ============================================
// FINDASH — Domain Types (Single Source of Truth)
// ============================================

export type TransactionType = 'income' | 'expense';
export type ImportStatus = 'success' | 'rejected';
export type SortDir = 'asc' | 'desc';

// -------- Core --------

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;       // cents, signed (negative = expense)
  amountRaw?: number;
  category: string;
  categoryIcon?: string;
  type: TransactionType;
  merchant: string;
  importId?: string;
}

export interface CategoryRule {
  pattern: RegExp;
  category: string;
  icon: string;
}

export interface CategoryInfo {
  category: string;
  icon: string;
}

// -------- Storage --------

export interface ImportMetadata {
  modelName?: string;
  separator?: string;
  headers?: string[];
  mapping?: ColMapping;
}

export interface ImportMeta {
  fileName: string;
  total: number;
  parsed: number;
  errors: number;
  status: ImportStatus;
  rejectedReason?: string;
  errorDetails?: string[];
  metadata?: ImportMetadata;
}

export interface ImportRecord {
  id: string;
  date: string;
  fileName: string;
  status: ImportStatus;
  rejectedReason: string;
  totalRows: number;
  importedRows: number;
  errors: number;
  errorDetails: string[];
  metadata: ImportMetadata;
}

export interface AddTransactionsResult {
  importId: string;
  count: number;
}

// -------- Filters --------

export interface FilterState {
  search: string;
  category: string;
  type: string;
  dateFrom: string;
  dateTo: string;
  sortBy: string;
  sortDir: SortDir;
}

export interface MonthBucket {
  income: number;
  expense: number;
}

export interface ComputedStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  savingsRate: number;
  byCat: Record<string, number>;
  byMonth: Record<string, MonthBucket>;
  transactionCount: number;
}

export interface PaginateResult {
  items: Transaction[];
  page: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// -------- Forecast --------

export interface MonthlyTotal {
  key: string;
  income: number;
  expense: number;
  net: number;
  date: Date;
}

export interface ForecastPoint {
  date: string;
  day: number;
  balance: number;
  income: number;
  expense: number;
}

export interface ForecastResult {
  points: ForecastPoint[];
  startBalance: number;
  projectedIncome: number;
  projectedExpense: number;
  projectedBalance: number;
  avgDailyIncome: number;
  avgDailyExpense: number;
  monthlyData: MonthlyTotal[];
}

// -------- Recurring --------

export interface RecurringInterval {
  days: number;
  label: string;
  tolerance: number;
  avgGap: number;
  nextExpected: Date;
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

// -------- Parser --------

export interface ColMapping {
  date?: number;
  description?: number;
  amount?: number;
  _amountMed?: number;
  category?: number;
  _subcategoria?: number;
  type?: number;
  _movType?: number;
  _entrada?: number;
  _saida?: number;
  _debit?: number;
  _credit?: number;
}

export interface ResolvedAmount {
  amount: number;
  forceType: TransactionType | null;
  isPlaceholder: boolean;
  suffix?: string;
}

export interface ParseResult {
  status: ImportStatus;
  modelName?: string;
  transactions: Transaction[];
  errors: string[];
  total: number;
  parsed: number;
  separator?: string;
  headers?: string[];
  mapping?: ColMapping;
  reason?: string;
}

export interface AcquirerModel {
  id: string;
  name: string;
  detect(headers: string[]): boolean;
}
