// ============================================
// FINDASH — Export (CSV + PDF)
// ============================================

import type { Transaction, ComputedStats } from './types/index.js';

export function formatBRL(cents: number): string {
  const val = cents / 100;
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDate(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString('pt-BR');
}

export function exportCSV(transactions: Transaction[], filename = 'findash-export.csv'): void {
  const headers = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor (R$)'];
  const rows = transactions.map(tx => [
    formatDate(tx.date),
    `"${(tx.description || '').replace(/"/g, '""')}"`,
    tx.category || '',
    tx.type === 'income' ? 'Receita' : 'Despesa',
    (tx.amount / 100).toFixed(2).replace('.', ','),
  ]);
  const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
  downloadFile('\uFEFF' + csv, filename, 'text/csv;charset=utf-8');
}

export function exportPDF(stats: ComputedStats, transactions: Transaction[]): void {
  if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
    alert('Biblioteca jsPDF não carregada. Verifique a conexão com a internet.');
    return;
  }
  const { jsPDF } = window.jspdf ?? { jsPDF: window.jsPDF! };
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(20); doc.setTextColor(99, 102, 241);
  doc.text('FinDash — Relatório Financeiro', pageWidth / 2, 20, { align: 'center' });
  doc.setFontSize(10); doc.setTextColor(120, 120, 120);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, 28, { align: 'center' });

  doc.setFontSize(14); doc.setTextColor(40, 40, 40); doc.text('Resumo', 20, 42);
  doc.setFontSize(11); doc.setTextColor(60, 60, 60);
  [
    `Total de Transações: ${stats.transactionCount}`,
    `Receitas: ${formatBRL(stats.totalIncome)}`,
    `Despesas: ${formatBRL(stats.totalExpense)}`,
    `Saldo: ${formatBRL(stats.balance)}`,
    `Taxa de Economia: ${stats.savingsRate.toFixed(1)}%`,
  ].forEach((line, i) => doc.text(line, 25, 52 + i * 8));

  doc.setFontSize(14); doc.setTextColor(40, 40, 40); doc.text('Despesas por Categoria', 20, 100);
  const catEntries = Object.entries(stats.byCat).sort((a, b) => b[1] - a[1]).slice(0, 10);
  doc.setFontSize(10); doc.setTextColor(60, 60, 60);
  catEntries.forEach(([cat, amount], i) => doc.text(`${cat}: ${formatBRL(amount)}`, 25, 112 + i * 7));

  const y = 112 + catEntries.length * 7 + 15;
  if (y < 250) {
    doc.setFontSize(14); doc.setTextColor(40, 40, 40); doc.text('Últimas Transações', 20, y);
    doc.setFontSize(8); doc.setTextColor(80, 80, 80);
    transactions.slice(0, 25).forEach((tx, i) => {
      const lineY = y + 10 + i * 6;
      if (lineY > 280) return;
      doc.text(`${formatDate(tx.date)}  ${(tx.description || '').substring(0, 35)}  ${formatBRL(tx.amount)}`, 25, lineY);
    });
  }
  doc.save('findash-relatorio.pdf');
}

function downloadFile(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}
