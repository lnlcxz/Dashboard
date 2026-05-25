// ============================================
// FINDASH — Acquirer Parser Models
// ============================================

import type { AcquirerModel } from './types/index.js';

export const ACQUIRER_MODELS: AcquirerModel[] = [
  {
    id: 'cielo',
    name: 'Cielo',
    detect: (headers) => {
      const h = headers.map(x => x.toLowerCase().trim());
      return h.some(x => x.includes('nº ro') || x.includes('resumo de vendas')) &&
             h.some(x => x.includes('autorização') || x.includes('cartão'));
    },
  },
  {
    id: 'stone',
    name: 'Stone',
    detect: (headers) => {
      const h = headers.map(x => x.toLowerCase().trim());
      return h.some(x => x.includes('stonecode') || x.includes('stone id'));
    },
  },
  {
    id: 'rede',
    name: 'Rede',
    detect: (headers) => {
      const h = headers.map(x => x.toLowerCase().trim());
      return h.some(x => x.includes('nº pv') || x.includes('nº do pv'));
    },
  },
  {
    id: 'generic',
    name: 'Genérico (FinDash/Bancos)',
    detect: (headers) => {
      const h = headers.map(x => x.toLowerCase().trim());
      const hasDate = h.some(x => ['data', 'date', 'dt', 'data_lancamento', 'mês', 'mes'].some(y => x.includes(y)));
      const hasAmount = h.some(x =>
        ['valor_r$', 'valor_rs', 'valor', 'amount', 'débito', 'crédito', 'debito', 'credito', 'entrada', 'saida', 'saída']
          .some(y => x.includes(y))
      );
      return hasDate && hasAmount;
    },
  },
];

export function detectModel(headers: string[]): AcquirerModel | null {
  for (const model of ACQUIRER_MODELS) {
    if (model.detect(headers)) return model;
  }
  return null;
}
