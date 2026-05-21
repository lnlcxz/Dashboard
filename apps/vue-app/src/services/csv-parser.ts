import type { ParseResult, Transaction, TransactionType } from '@/types';

export function detectSeparator(firstLine: string): string {
  const counts: Record<string, number> = { ';': 0, ',': 0, '\t': 0 };
  for (const ch of firstLine) {
    if (ch in counts) counts[ch]++;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

const COL_MAP: Record<string, string[]> = {
  date: ['data', 'date', 'dt', 'data_lancamento', 'data_transacao', 'dt_transacao', 'data lancamento', 'data transação', 'mês', 'mes'],
  description: ['descricao', 'descrição', 'description', 'historico', 'histórico', 'estabelecimento', 'merchant', 'lancamento', 'lançamento', 'nome', 'memo', 'detalhe'],
  amount: ['valor', 'amount', 'value', 'montante', 'vlr', 'total'],
  category: ['categoria', 'category', 'cat', 'grupo', 'group'],
  _subcategoria: ['subcategoria', 'sub'],
  type: ['tipo', 'type', 'natureza', 'dc', 'd/c'],
  _entrada: ['entrada', 'entradas', 'receita', 'receitas'],
  _saida: ['saida', 'saídas', 'saidas', 'despesa', 'despesas', 'gasto', 'gastos'],
};

function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/["\s]+/g, ' ').normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function mapColumns(headers: string[]): Record<string, number> {
  const normalized = headers.map(normalize);
  const mapping: Record<string, number> = {};
  for (const [key, aliases] of Object.entries(COL_MAP)) {
    const idx = normalized.findIndex((h) => aliases.some((a) => h.includes(normalize(a))));
    if (idx !== -1) mapping[key] = idx;
  }
  if (mapping.amount === undefined) {
    const debIdx = normalized.findIndex((h) => h.includes('debito') || h.includes('debit'));
    const credIdx = normalized.findIndex((h) => h.includes('credito') || h.includes('credit'));
    if (debIdx !== -1 || credIdx !== -1) {
      mapping._debit = debIdx;
      mapping._credit = credIdx;
    }
  }
  return mapping;
}

function parseDate(str: string): Date | null {
  if (!str) return null;
  str = str.trim().replace(/['"]/g, '');

  const months = ['janeiro', 'fevereiro', 'março', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const mIndex = months.indexOf(str.toLowerCase());
  if (mIndex !== -1) {
    const year = new Date().getFullYear();
    return new Date(year, mIndex, 1);
  }

  let m = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  m = str.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function parseAmount(str: string | undefined | null): number {
  if (str === null || str === undefined) return NaN;
  let s = String(str).trim().replace(/['"R$\s]/g, '');
  if (!s) return NaN;
  const negative = s.startsWith('-') || s.startsWith('(');
  s = s.replace(/[()]/g, '').replace(/^-/, '');
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  if (lastComma > lastDot) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma) {
    s = s.replace(/,/g, '');
  } else {
    s = s.replace(/,/g, '');
  }
  const val = parseFloat(s);
  return isNaN(val) ? NaN : negative ? -val : val;
}

function splitCSVLine(line: string, sep: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === sep && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields.map((f) => f.trim().replace(/^"|"$/g, ''));
}

let idCounter = 0;

export function parseCSV(text: string): ParseResult {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((l) => l.trim());
  if (lines.length < 2) throw new Error('CSV precisa de pelo menos 2 linhas (cabeçalho + dados)');

  const sep = detectSeparator(lines[0]);
  const headers = splitCSVLine(lines[0], sep);
  const mapping = mapColumns(headers);

  if (mapping.date === undefined) throw new Error('Coluna de data não encontrada. Use: Data, Date, Dt');
  if (mapping.amount === undefined && mapping._debit === undefined) {
    throw new Error('Coluna de valor não encontrada. Use: Valor, Amount, Débito/Crédito');
  }

  const transactions: Transaction[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = splitCSVLine(lines[i], sep);
    if (fields.length < 2) {
      errors.push(`[LINHA ${i + 1}] Poucos campos (${fields.length}).\n  ➔ LINHA ORIGINAL: ${lines[i]}\n  ➔ CAMPOS LIDOS: ${JSON.stringify(fields)}`);
      continue;
    }

    try {
      const date = parseDate(fields[mapping.date]);
      if (!date) {
        errors.push(`[LINHA ${i + 1}] Data inválida na coluna '${mapping.date}' (valor: "${fields[mapping.date]}").\n  ➔ LINHA ORIGINAL: ${lines[i]}`);
        continue;
      }

      const category = mapping.category !== undefined ? fields[mapping.category] || '' : '';
      if (category.toLowerCase() === 'resumo') {
        errors.push(`[LINHA ${i + 1}] Linha de resumo ignorada para não duplicar totais.\n  ➔ LINHA ORIGINAL: ${lines[i]}`);
        continue;
      }

      let amount: number;
      let forceType: TransactionType | null = null;

      if (mapping._entrada !== undefined && fields[mapping._entrada]) {
        amount = parseAmount(fields[mapping._entrada]);
        forceType = 'income';
      } else if (mapping._saida !== undefined && fields[mapping._saida]) {
        amount = parseAmount(fields[mapping._saida]);
        forceType = 'expense';
      } else if (mapping.amount !== undefined) {
        amount = parseAmount(fields[mapping.amount]);
      } else {
        const debit = mapping._debit !== undefined ? parseAmount(fields[mapping._debit]) : 0;
        const credit = mapping._credit !== undefined ? parseAmount(fields[mapping._credit]) : 0;
        amount = (credit || 0) - (debit || 0);
      }

      if (isNaN(amount)) {
        errors.push(`[LINHA ${i + 1}] Valor financeiro inválido.\n  ➔ LINHA ORIGINAL: ${lines[i]}`);
        continue;
      }

      let description = mapping.description !== undefined ? fields[mapping.description] || '' : '';
      const subCategory = mapping._subcategoria !== undefined ? fields[mapping._subcategoria] || '' : '';

      if (!description.trim()) {
        description = subCategory ? `${category} - ${subCategory}` : category;
      }

      let type: TransactionType;
      if (forceType) {
        type = forceType;
      } else if (mapping.type !== undefined) {
        const raw = (fields[mapping.type] || '').toLowerCase().trim();
        type =
          raw === 'receita' || raw === 'credito' || raw === 'crédito' || raw === 'credit' || raw === 'c' || raw === 'income' || raw === 'entrada' || raw === 'recebido'
            ? 'income'
            : 'expense';
      } else {
        type = amount >= 0 ? 'income' : 'expense';
      }

      const amountCents = Math.round(Math.abs(amount) * 100);

      transactions.push({
        id: `tx_${Date.now()}_${++idCounter}`,
        date: date.toISOString(),
        description: description.trim(),
        amount: type === 'expense' ? -amountCents : amountCents,
        amountRaw: amount,
        category: category.trim(),
        type,
        merchant: description
          .trim()
          .toUpperCase()
          .replace(/\s+/g, ' ')
          .replace(/[0-9]{2}\/[0-9]{2}/g, '')
          .replace(/\d{10,}/g, '')
          .trim(),
      });
    } catch (e: any) {
      errors.push(`[LINHA ${i + 1}] Erro fatal: ${e.message}\n  ➔ LINHA ORIGINAL: ${lines[i]}`);
    }
  }

  return {
    transactions,
    errors,
    total: lines.length - 1,
    parsed: transactions.length,
    separator: sep,
    headers,
    mapping,
  };
}
