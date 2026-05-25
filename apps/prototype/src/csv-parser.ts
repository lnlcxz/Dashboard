// ============================================
// FINDASH — CSV Parser (Robust, BR-aware)
// ============================================

import { detectModel } from './parser-models.js';
import type { ColMapping, ParseResult, ResolvedAmount, Transaction, TransactionType } from './types/index.js';

export function detectSeparator(firstLine: string): string {
  const counts: Record<string, number> = { ';': 0, ',': 0, '\t': 0 };
  for (const ch of firstLine) {
    if (ch in counts) counts[ch]++;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]![0];
}

const COL_MAP: Record<string, string[]> = {
  date: ['data', 'date', 'dt', 'data_lancamento', 'data_transacao', 'dt_transacao', 'data lancamento', 'data transação', 'mês', 'mes'],
  description: ['descricao', 'descrição', 'description', 'historico', 'histórico', 'estabelecimento', 'merchant', 'lancamento', 'lançamento', 'nome', 'memo', 'detalhe'],
  amount: ['valor_r$', 'valor_rs', 'valor r$', 'valor', 'amount', 'value', 'montante', 'vlr', 'total'],
  _amountMed: ['valor_medio_r$', 'valor_medio_rs', 'valor medio', 'valor_medio'],
  category: ['categoria_geral', 'categoria', 'category', 'cat', 'grupo', 'group'],
  _subcategoria: ['subcategoria', 'sub'],
  type: ['tipo', 'type', 'natureza', 'dc', 'd/c'],
  _movType: ['tipo_movimentacao', 'tipo movimentacao', 'movimentacao', 'tipo_mov'],
  _entrada: ['entrada', 'entradas', 'receita', 'receitas'],
  _saida: ['saida', 'saídas', 'saidas', 'despesa', 'despesas', 'gasto', 'gastos'],
};

const SKIP_MOV_TYPES = new Set([
  'transferencia interna',
  'investimento proprio',
  'investimento próprio',
  'fatura cartao',
  'fatura cartão'
]);

function mapColumns(headers: string[]): ColMapping {
  const normalized = headers.map(h =>
    h.toLowerCase().trim().replace(/["]+/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
  );
  const mapping: ColMapping = {};
  for (const [key, aliases] of Object.entries(COL_MAP)) {
    const idx = normalized.findIndex(h =>
      aliases.some(a => {
        const aN = a.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return h === aN || h.includes(aN);
      }),
    );
    if (idx !== -1) (mapping as Record<string, number>)[key] = idx;
  }
  if (mapping.amount === undefined) {
    const debIdx = normalized.findIndex(h => h.includes('debito') || h.includes('debit'));
    const credIdx = normalized.findIndex(h => h.includes('credito') || h.includes('credit'));
    if (debIdx !== -1 || credIdx !== -1) {
      if (debIdx !== -1) mapping._debit = debIdx;
      if (credIdx !== -1) mapping._credit = credIdx;
    }
  }
  return mapping;
}

function parseDate(str: string): Date | null {
  if (!str) return null;
  str = str.trim().replace(/['"]/g, '');
  const months = ['janeiro', 'fevereiro', 'março', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const mIndex = months.indexOf(str.toLowerCase());
  if (mIndex !== -1) return new Date(new Date().getFullYear(), mIndex, 1);
  let m = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) return new Date(+m[3]!, +m[2]! - 1, +m[1]!);
  m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(+m[1]!, +m[2]! - 1, +m[3]!);
  m = str.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  if (m) return new Date(+m[1]!, +m[2]! - 1, +m[3]!);
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function parseAmount(str: string): number {
  if (!str) return NaN;
  str = String(str).trim().replace(/['"R$\s]/g, '');
  if (!str) return NaN;
  if (/^[—\-–]+$/.test(str) || str === '...' || str.toLowerCase() === 'nd') return NaN;
  const negative = str.startsWith('-') || str.startsWith('(');
  str = str.replace(/[()]/g, '').replace(/^-/, '');
  const lastComma = str.lastIndexOf(',');
  const lastDot = str.lastIndexOf('.');
  if (lastComma > lastDot) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else {
    str = str.replace(/,/g, '');
  }
  const val = parseFloat(str);
  return isNaN(val) ? NaN : (negative ? -val : val);
}

function isAmountPlaceholder(raw: string): boolean {
  if (!raw) return false;
  const s = raw.trim();
  if (s.startsWith('(') && !/^\(\d/.test(s)) return true;
  const lower = s.toLowerCase();
  return lower.startsWith('incluído') || lower.startsWith('incluido') || lower.startsWith('variável');
}

function extractCompoundAmounts(rawAmount: string): { amount: number; inferredType: TransactionType | null }[] {
  if (!rawAmount || !rawAmount.includes('/')) return [];
  const parts = rawAmount.split('/');
  const results: { amount: number; inferredType: TransactionType | null }[] = [];
  
  for (const part of parts) {
    const amount = parseAmount(part);
    if (!isNaN(amount)) {
      const lower = part.toLowerCase();
      let inferredType: TransactionType | null = null;
      if (lower.includes('saída') || lower.includes('saida') || lower.includes('despesa')) {
        inferredType = 'expense';
      } else if (lower.includes('entrada') || lower.includes('receita')) {
        inferredType = 'income';
      }
      results.push({ amount, inferredType });
    }
  }
  return results;
}

function resolveAmount(fields: string[], mapping: ColMapping): ResolvedAmount[] {
  if (mapping.amount !== undefined) {
    const rawAmount = fields[mapping.amount] ?? '';
    if (isAmountPlaceholder(rawAmount)) return [{ amount: NaN, forceType: null, isPlaceholder: true }];
    
    if (rawAmount.includes('/')) {
      const compounds = extractCompoundAmounts(rawAmount);
      if (compounds.length > 0) {
        return compounds.map(c => ({
          amount: c.amount,
          forceType: c.inferredType,
          isPlaceholder: false,
          suffix: c.inferredType === 'income' ? ' (entradas)' : c.inferredType === 'expense' ? ' (saídas)' : ''
        }));
      }
    }
  }
  if (mapping._entrada !== undefined && fields[mapping._entrada]) {
    const amount = parseAmount(fields[mapping._entrada]!);
    if (!isNaN(amount)) return [{ amount, forceType: 'income', isPlaceholder: false }];
  }
  if (mapping._saida !== undefined && fields[mapping._saida]) {
    const amount = parseAmount(fields[mapping._saida]!);
    if (!isNaN(amount)) return [{ amount, forceType: 'expense', isPlaceholder: false }];
  }
  let amount = mapping.amount !== undefined ? parseAmount(fields[mapping.amount] ?? '') : NaN;
  if (isNaN(amount) && mapping._debit !== undefined) {
    const debit = parseAmount(fields[mapping._debit ?? -1] ?? '');
    const credit = parseAmount(fields[mapping._credit ?? -1] ?? '');
    amount = (isNaN(credit) ? 0 : credit) - (isNaN(debit) ? 0 : debit);
  }
  if (isNaN(amount) && mapping._amountMed !== undefined) {
    amount = parseAmount(fields[mapping._amountMed] ?? '');
  }
  return [{ amount, forceType: null, isPlaceholder: false }];
}

function isSummaryBlockStart(fields: string[]): boolean {
  const first = (fields[0] ?? '').trim().toUpperCase();
  return first.startsWith('RESUMO') || first.startsWith('INDICADOR') ||
         first.startsWith('POSICAO') || first.startsWith('RANKING') ||
         first === 'TOTAL' || first === 'SUBTOTAL';
}

function splitCSVLine(line: string, sep: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === sep && !inQuotes) {
      fields.push(current); current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields.map(f => f.trim().replace(/^"|"$/g, ''));
}

let idCounter = 0;

export function parseCSV(text: string): ParseResult {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());
  if (lines.length < 2) throw new Error('Arquivo precisa de pelo menos 2 linhas (cabeçalho + dados)');

  const sep = detectSeparator(lines[0]!);
  const headers = splitCSVLine(lines[0]!, sep);

  const model = detectModel(headers);
  if (!model) {
    return {
      status: 'rejected',
      reason: 'Modelo de planilha desconhecido. O cabeçalho não confere com nenhuma adquirente cadastrada.',
      transactions: [], errors: [], total: 0, parsed: 0, headers,
    };
  }

  const mapping = mapColumns(headers);
  if (mapping.date === undefined) throw new Error('Coluna de data não encontrada. Use: Data, Date, Dt');
  if (mapping.amount === undefined && mapping._debit === undefined && mapping._entrada === undefined) {
    throw new Error('Coluna de valor financeiro não encontrada.');
  }

  const transactions: Transaction[] = [];
  const errors: string[] = [];
  let summaryBlockReached = false;

  for (let i = 1; i < lines.length; i++) {
    const fields = splitCSVLine(lines[i]!, sep);
    if (isSummaryBlockStart(fields)) { summaryBlockReached = true; break; }
    if (fields.length < 2) {
      errors.push(`[LINHA ${i + 1}] Poucos campos (${fields.length}).\n  ➔ LINHA ORIGINAL: ${lines[i]}\n  ➔ CAMPOS LIDOS: ${JSON.stringify(fields)}`);
      continue;
    }
    try {
      const date = parseDate(fields[mapping.date!] ?? '');
      if (!date) {
        errors.push(`[LINHA ${i + 1}] Data inválida (valor: "${fields[mapping.date!]}").\n  ➔ LINHA ORIGINAL: ${lines[i]}`);
        continue;
      }
      const movType = mapping._movType !== undefined ? (fields[mapping._movType] ?? '').toLowerCase().trim() : '';
      if (SKIP_MOV_TYPES.has(movType)) continue;
      const category = mapping.category !== undefined ? fields[mapping.category] ?? '' : '';
      if (category.toLowerCase() === 'resumo') continue;

      const resolvedAmounts = resolveAmount(fields, mapping);
      
      for (const res of resolvedAmounts) {
        const { amount, forceType, isPlaceholder, suffix } = res;
        if (isPlaceholder) continue;
        if (isNaN(amount) || amount === 0) {
          errors.push(`[LINHA ${i + 1}] Valor financeiro inválido ou ausente.\n  ➔ VALOR_R$: "${mapping.amount !== undefined ? fields[mapping.amount] : 'n/a'}"\n  ➔ LINHA ORIGINAL: ${lines[i]}`);
          continue;
        }

        let description = mapping.description !== undefined ? fields[mapping.description] ?? '' : '';
        const subCategory = mapping._subcategoria !== undefined ? fields[mapping._subcategoria] ?? '' : '';
        if (!description.trim()) description = subCategory ? `${category} - ${subCategory}` : category;
        
        description = description.trim();
        if (suffix) description += suffix;

        let type: TransactionType;
        if (forceType) {
          type = forceType;
        } else if (mapping.type !== undefined) {
          const raw = (fields[mapping.type] ?? '').toLowerCase().trim();
          type = (raw === 'receita' || raw === 'credito' || raw === 'crédito' || raw === 'credit' || raw === 'c' || raw === 'income' || raw === 'entrada' || raw === 'recebido') ? 'income' : 'expense';
        } else {
          type = amount >= 0 ? 'income' : 'expense';
        }

        const amountCents = Math.round(Math.abs(amount) * 100);
        transactions.push({
          id: `tx_${Date.now()}_${++idCounter}`,
          date: date.toISOString(),
          description: description,
          amount: type === 'expense' ? -amountCents : amountCents,
          amountRaw: amount,
          category: category.trim(),
          type,
          merchant: description.toUpperCase().replace(/\s+/g, ' ').replace(/[0-9]{2}\/[0-9]{2}/g, '').replace(/\d{10,}/g, '').trim(),
        });
      }
    } catch (e) {
      errors.push(`[LINHA ${i + 1}] Erro fatal: ${e instanceof Error ? e.message : String(e)}\n  ➔ LINHA ORIGINAL: ${lines[i]}`);
    }
  }

  const processedLines = summaryBlockReached
    ? lines.findIndex((l, idx) => idx > 0 && isSummaryBlockStart(splitCSVLine(l, sep)))
    : lines.length - 1;

  return { status: 'success', modelName: model.name, transactions, errors, total: processedLines, parsed: transactions.length, separator: sep, headers, mapping };
}
