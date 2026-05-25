// ============================================
// FINDASH — Auto-Categorizer (Rule Engine)
// ============================================

import type { CategoryRule, CategoryInfo, Transaction } from './types/index.js';

const DEFAULT_RULES: CategoryRule[] = [
  { pattern: /ifood|uber\s*eats|rappi|james|zé\s*delivery|aiqfome|menu/i, category: 'Alimentação', icon: '🍔' },
  { pattern: /restaurante|rest\.|lanchonete|padaria|pizzaria|sushi|burger|mcdonald|bk\s|subway|starbucks|outback/i, category: 'Alimentação', icon: '🍔' },
  { pattern: /supermercado|mercado|atacad|carrefour|assai|extra\s|big\s|pão de açúcar|dia\s|sams\s*club|costco/i, category: 'Mercado', icon: '🛒' },
  { pattern: /uber(?!\s*eats)|99\s*(?:app|pop|taxi)|cabify|lyft|taxi|estaciona|parking|zona\s*azul/i, category: 'Transporte', icon: '🚗' },
  { pattern: /shell|ipiranga|br\s*distribuidora|petrob|gasolina|combust|etanol|diesel|posto/i, category: 'Combustível', icon: '⛽' },
  { pattern: /aluguel|condominio|condomínio|iptu|luz|energia|enel|cemig|copel|cpfl|celesc|equatorial/i, category: 'Moradia', icon: '🏠' },
  { pattern: /agua|água|sabesp|sanepar|compesa|cedae|gas\s*natural|comgas/i, category: 'Moradia', icon: '🏠' },
  { pattern: /vivo|claro|tim\s|oi\s|net\s|internet|telefone|celular|telecom/i, category: 'Telecom', icon: '📱' },
  { pattern: /netflix|spotify|disney|amazon\s*prime|hbo|apple\s*tv|youtube\s*premium|deezer|globoplay|paramount|crunchyroll/i, category: 'Streaming', icon: '📺' },
  { pattern: /chatgpt|openai|notion|figma|canva|adobe|microsoft\s*365|google\s*one|icloud|dropbox/i, category: 'Assinaturas', icon: '💻' },
  { pattern: /farmacia|farmácia|drogaria|drogasil|droga\s*raia|pague\s*menos|panvel|ultrafarma|medic|hospital|clinic|clínica|lab\s|laborat|unimed|amil|sulam/i, category: 'Saúde', icon: '🏥' },
  { pattern: /escola|faculdade|universid|udemy|coursera|alura|curso|livro|livraria|saraiva|amazon.*kindle/i, category: 'Educação', icon: '📚' },
  { pattern: /mercado\s*livre|shopee|aliexpress|magalu|magazine|americanas|casas\s*bahia|extra\.com|kabum|ponto\s*frio/i, category: 'Compras Online', icon: '🛍️' },
  { pattern: /amazon(?!.*prime)/i, category: 'Compras Online', icon: '🛍️' },
  { pattern: /shopping|loja|store|renner|riachuelo|c&a|zara|marisa|hering|centauro|decathlon|nike|adidas/i, category: 'Compras', icon: '🛍️' },
  { pattern: /cinema|ingresso|teatro|show|evento|parque|viagem|hotel|booking|airbnb|decolar|latam|gol\s|azul\s/i, category: 'Lazer', icon: '🎬' },
  { pattern: /iof|juros|tarifa|taxa|anuidade|seguro|investim|cdb|tesouro|poupança|rendimento|dividendo/i, category: 'Financeiro', icon: '🏦' },
  { pattern: /pix\s*receb|transferencia\s*receb|ted\s*receb|doc\s*receb|deposito|depósito/i, category: 'Transferência Recebida', icon: '💰' },
  { pattern: /pix\s*env|transferencia\s*env|ted\s*env|doc\s*env/i, category: 'Transferência Enviada', icon: '💸' },
  { pattern: /salario|salário|salary|pagamento|folha|prolabore|pró-labore|freelanc|honorar/i, category: 'Salário', icon: '💼' },
];

const CATEGORY_COLORS: Record<string, string> = {
  'Alimentação': '#f97316', 'Mercado': '#84cc16', 'Transporte': '#06b6d4',
  'Combustível': '#eab308', 'Moradia': '#8b5cf6', 'Telecom': '#3b82f6',
  'Streaming': '#ec4899', 'Assinaturas': '#a855f7', 'Saúde': '#10b981',
  'Educação': '#14b8a6', 'Compras Online': '#f59e0b', 'Compras': '#f59e0b',
  'Lazer': '#e879f9', 'Financeiro': '#6366f1',
  'Transferência Recebida': '#22c55e', 'Transferência Enviada': '#ef4444',
  'Salário': '#10b981', 'Outros': '#64748b',
};

export function categorize(description: string): CategoryInfo {
  if (!description) return { category: 'Outros', icon: '📌' };
  for (const rule of DEFAULT_RULES) {
    if (rule.pattern.test(description)) return { category: rule.category, icon: rule.icon };
  }
  return { category: 'Outros', icon: '📌' };
}

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS['Outros']!;
}

export function getAllCategories(): Array<{ name: string; color: string }> {
  return Object.keys(CATEGORY_COLORS).map(c => ({ name: c, color: CATEGORY_COLORS[c]! }));
}

export function applyCategories(transactions: Transaction[]): Transaction[] {
  return transactions.map(tx => {
    if (!tx.category) {
      const { category, icon } = categorize(tx.description);
      return { ...tx, category, categoryIcon: icon };
    }
    return { ...tx, categoryIcon: categorize(tx.description).icon };
  });
}
