interface SampleMerchant {
  name: string;
  type: 'income' | 'expense';
  min: number;
  max: number;
  monthly?: boolean;
  freq?: number;
}

const MERCHANTS: SampleMerchant[] = [
  { name: 'EMPRESA ABC LTDA - SALÁRIO', type: 'income', min: 450000, max: 650000, monthly: true },
  { name: 'FREELANCE PROJETO XPTO', type: 'income', min: 150000, max: 300000, freq: 0.3 },
  { name: 'PIX RECEBIDO - JOÃO SILVA', type: 'income', min: 10000, max: 50000, freq: 0.15 },
  { name: 'RENDIMENTO POUPANÇA', type: 'income', min: 2000, max: 8000, monthly: true },
  { name: 'ALUGUEL APARTAMENTO', type: 'expense', min: 180000, max: 180000, monthly: true },
  { name: 'CONDOMÍNIO RESIDENCIAL', type: 'expense', min: 45000, max: 48000, monthly: true },
  { name: 'ENEL ENERGIA', type: 'expense', min: 15000, max: 35000, monthly: true },
  { name: 'SABESP ÁGUA', type: 'expense', min: 6000, max: 12000, monthly: true },
  { name: 'VIVO CELULAR', type: 'expense', min: 8990, max: 8990, monthly: true },
  { name: 'CLARO INTERNET', type: 'expense', min: 12990, max: 12990, monthly: true },
  { name: 'NETFLIX', type: 'expense', min: 3990, max: 3990, monthly: true },
  { name: 'SPOTIFY', type: 'expense', min: 2190, max: 2190, monthly: true },
  { name: 'AMAZON PRIME', type: 'expense', min: 1490, max: 1490, monthly: true },
  { name: 'CHATGPT PLUS', type: 'expense', min: 10400, max: 10400, monthly: true },
  { name: 'SUPERMERCADO CARREFOUR', type: 'expense', min: 15000, max: 55000, freq: 0.6 },
  { name: 'ASSAÍ ATACADISTA', type: 'expense', min: 20000, max: 60000, freq: 0.3 },
  { name: 'PADARIA PÃO QUENTE', type: 'expense', min: 800, max: 3500, freq: 0.7 },
  { name: 'IFOOD', type: 'expense', min: 2500, max: 8000, freq: 0.5 },
  { name: 'UBER', type: 'expense', min: 1200, max: 4500, freq: 0.4 },
  { name: 'SHELL COMBUSTÍVEL', type: 'expense', min: 15000, max: 30000, freq: 0.35 },
  { name: 'FARMÁCIA DROGASIL', type: 'expense', min: 2000, max: 15000, freq: 0.25 },
  { name: 'MERCADO LIVRE', type: 'expense', min: 5000, max: 45000, freq: 0.2 },
  { name: 'AMAZON.COM.BR', type: 'expense', min: 3000, max: 30000, freq: 0.15 },
  { name: 'RESTAURANTE SABOR E CIA', type: 'expense', min: 3000, max: 12000, freq: 0.35 },
  { name: 'STARBUCKS', type: 'expense', min: 1500, max: 3500, freq: 0.2 },
  { name: 'CINEMA CINEMARK', type: 'expense', min: 3500, max: 8000, freq: 0.1 },
  { name: 'ACADEMIA SMARTFIT', type: 'expense', min: 10990, max: 10990, monthly: true },
];

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatDateBR(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}/${m}/${date.getFullYear()}`;
}

function formatValueBR(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  const reais = Math.floor(abs / 100);
  const centavos = String(abs % 100).padStart(2, '0');
  return `${sign}${reais.toLocaleString('pt-BR')},${centavos}`;
}

export function generateSampleCSV(months = 6): string {
  const rows: { date: Date; description: string; value: number; type: string }[] = [];
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);

  for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
    const dayOfMonth = d.getDate();

    for (const merchant of MERCHANTS) {
      let shouldAdd = false;

      if (merchant.monthly) {
        if (merchant.type === 'income' && merchant.name.includes('SALÁRIO') && dayOfMonth === 5) shouldAdd = true;
        else if (merchant.type === 'income' && merchant.name.includes('RENDIMENTO') && dayOfMonth === 1) shouldAdd = true;
        else if (merchant.name.includes('NETFLIX') && dayOfMonth === 15) shouldAdd = true;
        else if (merchant.name.includes('SPOTIFY') && dayOfMonth === 20) shouldAdd = true;
        else if (merchant.name.includes('AMAZON PRIME') && dayOfMonth === 3) shouldAdd = true;
        else if (merchant.name.includes('CHATGPT') && dayOfMonth === 22) shouldAdd = true;
        else if (merchant.name.includes('SMARTFIT') && dayOfMonth === 10) shouldAdd = true;
        else if (merchant.name.includes('ALUGUEL') && dayOfMonth === 5) shouldAdd = true;
        else if (merchant.name.includes('CONDOMÍNIO') && dayOfMonth === 10) shouldAdd = true;
        else if (merchant.name.includes('ENEL') && dayOfMonth === 18) shouldAdd = true;
        else if (merchant.name.includes('SABESP') && dayOfMonth === 22) shouldAdd = true;
        else if (merchant.name.includes('VIVO') && dayOfMonth === 12) shouldAdd = true;
        else if (merchant.name.includes('CLARO') && dayOfMonth === 15) shouldAdd = true;
      } else if (merchant.freq) {
        shouldAdd = Math.random() < merchant.freq / 30;
      }

      if (shouldAdd) {
        const amount = rand(merchant.min, merchant.max);
        const value = merchant.type === 'expense' ? -amount : amount;
        rows.push({
          date: new Date(d),
          description: merchant.name,
          value,
          type: merchant.type === 'income' ? 'Receita' : 'Despesa',
        });
      }
    }
  }

  rows.sort((a, b) => a.date.getTime() - b.date.getTime());

  const header = 'Data;Descrição;Valor;Tipo';
  const lines = rows.map((r) => `${formatDateBR(r.date)};${r.description};${formatValueBR(r.value)};${r.type}`);

  return header + '\n' + lines.join('\n');
}

export function downloadSampleCSV() {
  const csv = generateSampleCSV(6);
  const BOM = '﻿';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'findash-exemplo-6meses.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
