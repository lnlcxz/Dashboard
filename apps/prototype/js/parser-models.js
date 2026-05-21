// ============================================
// FINDASH — Acquirer Parser Models
// ============================================

export const ACQUIRER_MODELS = [
  {
    id: 'cielo',
    name: 'Cielo',
    detect: (headers) => {
      const h = headers.map(x => x.toLowerCase().trim());
      // Assinatura típica da Cielo (ex: número do Resumo de Operações, Autorização)
      return h.some(x => x.includes('nº ro') || x.includes('resumo de vendas')) && 
             h.some(x => x.includes('autorização') || x.includes('cartão'));
    }
  },
  {
    id: 'stone',
    name: 'Stone',
    detect: (headers) => {
      const h = headers.map(x => x.toLowerCase().trim());
      // Assinatura típica da Stone
      return h.some(x => x.includes('stonecode') || x.includes('stone id'));
    }
  },
  {
    id: 'rede',
    name: 'Rede',
    detect: (headers) => {
      const h = headers.map(x => x.toLowerCase().trim());
      // Assinatura típica da Rede
      return h.some(x => x.includes('nº pv') || x.includes('nº do pv'));
    }
  },
  {
    id: 'generic',
    name: 'Genérico (FinDash/Bancos)',
    detect: (headers) => {
      const h = headers.map(x => x.toLowerCase().trim());
      // O modelo genérico precisa de no mínimo uma coluna de data e uma de valor
      const hasDate = h.some(x => ['data', 'date', 'dt', 'data_lancamento', 'mês', 'mes'].some(y => x.includes(y)));
      const hasAmount = h.some(x => ['valor', 'amount', 'débito', 'crédito', 'debito', 'credito', 'entrada', 'saida', 'saída'].some(y => x.includes(y)));
      return hasDate && hasAmount;
    }
  }
];

/**
 * Identifica o modelo da planilha baseado nos cabeçalhos lidos.
 * @param {string[]} headers Array com os nomes das colunas lidas do arquivo
 * @returns {object|null} Retorna o modelo compatível ou null caso nenhum atenda
 */
export function detectModel(headers) {
  for (const model of ACQUIRER_MODELS) {
    if (model.detect(headers)) {
      return model;
    }
  }
  return null; // Planilha não reconhecida (nenhum modelo compatível)
}
