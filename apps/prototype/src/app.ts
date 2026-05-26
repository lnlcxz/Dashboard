// ============================================
// FINDASH — Main Application Controller (Part 1)
// ============================================

import { parseCSV } from './csv-parser.js';
import { addTransactions, getAllTransactions, getImportHistory, deleteImport, clearAllData, getTransactionCount } from './storage.js';
import { applyCategories } from './categorizer.js';
import { applyFilters, paginate, computeStats } from './filters.js';
import { renderLineChart, renderDoughnutChart, renderBarChart, renderForecastChart, resizeAll, clearCharts } from './charts.js';
import { detectRecurring, getMonthlyRecurringTotal } from './recurring.js';
import { generateForecast } from './forecast.js';
import { exportCSV, exportPDF, formatBRL, formatDate } from './export.js';
import { downloadSampleCSV } from './sample-data.js';

import type { Transaction, ComputedStats, FilterState } from './types/index.js';

// ====== STATE ======
let allTransactions: Transaction[] = [];
let filteredTransactions: Transaction[] = [];
let currentStats: ComputedStats = {
  totalIncome: 0, totalExpense: 0, balance: 0, savingsRate: 0, byCat: {}, byMonth: {}, transactionCount: 0
};
let currentPage = 1;
let filters: FilterState = { search: '', category: 'all', type: 'all', dateFrom: '', dateTo: '', sortBy: 'date', sortDir: 'desc' };

// ====== INIT ======
document.addEventListener('DOMContentLoaded', async () => {
  window.lucide?.createIcons();
  setupNavigation();
  setupUpload();
  setupFilters();
  setupActions();
  await loadData();
});

// ====== NAVIGATION ======
function setupNavigation(): void {
  const navItems = document.querySelectorAll<HTMLElement>('.nav-item');
  const pages = document.querySelectorAll<HTMLElement>('.page');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const pageId = item.dataset.page;
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      pages.forEach(p => p.classList.remove('active'));
      const target = document.getElementById(`page-${pageId}`);
      if (target) target.classList.add('active');
      
      document.getElementById('sidebar')?.classList.remove('open');
      document.getElementById('overlay')?.classList.remove('active');
      
      setTimeout(() => {
        resizeAll();
        if (pageId === 'overview') updateCharts();
        else if (pageId === 'analytics') updateAnalytics();
        else if (pageId === 'recurring') updateRecurring();
      }, 50);
    });
  });

  document.getElementById('mobileToggle')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.toggle('open');
    document.getElementById('overlay')?.classList.toggle('active');
  });
  document.getElementById('overlay')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('overlay')?.classList.remove('active');
  });
}

// ====== CSV UPLOAD ======
function setupUpload(): void {
  const zone = document.getElementById('uploadZone');
  const input = document.getElementById('csvInput') as HTMLInputElement;

  if (!zone || !input) return;

  zone.addEventListener('click', () => input.click());
  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dragover');
    const file = e.dataTransfer?.files[0];
    if (file) handleFile(file);
  });
  input.addEventListener('change', () => {
    if (input.files && input.files[0]) handleFile(input.files[0]);
    input.value = '';
  });
}

async function handleFile(file: File): Promise<void> {
  if (!file.name.match(/\.(csv|txt|xls|xlsx)$/i)) {
    showToast('Formato inválido. Use .csv, .txt, .xls ou .xlsx', 'error');
    return;
  }

  try {
    let text = '';
    if (file.name.match(/\.(xls|xlsx)$/i)) {
      if (!window.XLSX) throw new Error('Biblioteca XLSX não carregada no navegador.');
      const buffer = await file.arrayBuffer();
      const workbook = window.XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName!];
      text = window.XLSX.utils.sheet_to_csv(worksheet!);
    } else {
      text = await file.text();
    }

    const result = parseCSV(text);

    if (result.status === 'rejected') {
      showToast(result.reason || 'Erro na importação', 'error');
      await addTransactions([], {
        fileName: file.name,
        total: 0,
        parsed: 0,
        errors: 1,
        status: 'rejected',
        rejectedReason: result.reason,
        errorDetails: [result.reason || ''],
        metadata: { headers: result.headers }
      });
      await loadData();
      return;
    }

    if (result.transactions.length === 0) {
      showToast(`Nenhuma transação válida encontrada. ${result.errors.length} erro(s).`, 'error');
      return;
    }

    const categorized = applyCategories(result.transactions);

    await addTransactions(categorized, {
      fileName: file.name,
      total: result.total,
      parsed: result.parsed,
      errors: result.errors.length,
      status: 'success',
      errorDetails: result.errors,
      metadata: {
        modelName: result.modelName,
        separator: result.separator,
        headers: result.headers,
        mapping: result.mapping
      }
    });

    showToast(`${result.parsed} transações importadas com sucesso!`, 'success');
    if (result.errors.length > 0) {
      showToast(`${result.errors.length} linha(s) ignorada(s) — veja detalhes no Histórico`, 'info');
    }

    await loadData();
  } catch (err) {
    showToast(`Erro ao processar arquivo: ${err instanceof Error ? err.message : String(err)}`, 'error');
  }
}

// ====== LOAD DATA ======
async function loadData(): Promise<void> {
  allTransactions = await getAllTransactions();
  allTransactions = applyCategories(allTransactions);
  currentStats = computeStats(allTransactions);
  updateKPIs();
  updateCharts();
  applyCurrentFilters();
  updateStorageCount();
  updateImportHistory();
  updateRecurring();
  updateAnalytics();
}

// ====== KPIs ======
function updateKPIs(): void {
  const s = currentStats;
  const kpiBal = document.getElementById('kpiBalance');
  if (kpiBal) {
    kpiBal.textContent = formatBRL(s.balance);
    kpiBal.className = `font-outfit text-3xl font-bold leading-tight ${s.balance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`;
  }
  const kpiBalSub = document.getElementById('kpiBalanceSub');
  if (kpiBalSub) kpiBalSub.textContent = `${s.transactionCount} transações`;

  const kpiInc = document.getElementById('kpiIncome');
  if (kpiInc) kpiInc.textContent = formatBRL(s.totalIncome);
  const kpiIncSub = document.getElementById('kpiIncomeSub');
  if (kpiIncSub) kpiIncSub.textContent = `${Object.keys(s.byMonth).length} meses analisados`;

  const kpiExp = document.getElementById('kpiExpense');
  if (kpiExp) kpiExp.textContent = formatBRL(s.totalExpense);
  const kpiExpSub = document.getElementById('kpiExpenseSub');
  if (kpiExpSub) kpiExpSub.textContent = `${Object.keys(s.byCat).length} categorias`;

  const kpiSav = document.getElementById('kpiSavings');
  if (kpiSav) {
    kpiSav.textContent = `${s.savingsRate.toFixed(1)}%`;
    kpiSav.className = `font-outfit text-3xl font-bold leading-tight ${s.savingsRate >= 0 ? 'text-emerald-500' : 'text-rose-500'}`;
  }
  const kpiSavSub = document.getElementById('kpiSavingsSub');
  if (kpiSavSub) kpiSavSub.textContent = s.savingsRate >= 20 ? 'Excelente!' : s.savingsRate >= 0 ? 'Taxa de economia' : 'Gastando mais do que ganha';
}

// ====== CHARTS ======
function updateCharts(): void {
  const s = currentStats;
  if (Object.keys(s.byMonth).length > 0) {
    renderLineChart('chartLine', s.byMonth);
    renderDoughnutChart('chartDoughnut', s.byCat);
  } else {
    clearCharts();
  }
}

// ====== FILTERS + TABLE ======
function setupFilters(): void {
  document.getElementById('filterSearch')?.addEventListener('input', debounce((e: Event) => {
    filters.search = (e.target as HTMLInputElement).value;
    currentPage = 1;
    applyCurrentFilters();
  }, 250));

  document.getElementById('filterCategory')?.addEventListener('change', (e: Event) => {
    filters.category = (e.target as HTMLSelectElement).value;
    currentPage = 1;
    applyCurrentFilters();
  });

  document.getElementById('filterType')?.addEventListener('change', (e: Event) => {
    filters.type = (e.target as HTMLSelectElement).value;
    currentPage = 1;
    applyCurrentFilters();
  });

  document.getElementById('filterDateFrom')?.addEventListener('change', (e: Event) => {
    filters.dateFrom = (e.target as HTMLInputElement).value;
    currentPage = 1;
    applyCurrentFilters();
  });

  document.getElementById('filterDateTo')?.addEventListener('change', (e: Event) => {
    filters.dateTo = (e.target as HTMLInputElement).value;
    currentPage = 1;
    applyCurrentFilters();
  });

  document.getElementById('btnClearFilters')?.addEventListener('click', () => {
    filters = { search: '', category: 'all', type: 'all', dateFrom: '', dateTo: '', sortBy: 'date', sortDir: 'desc' };
    (document.getElementById('filterSearch') as HTMLInputElement).value = '';
    (document.getElementById('filterCategory') as HTMLSelectElement).value = 'all';
    (document.getElementById('filterType') as HTMLSelectElement).value = 'all';
    (document.getElementById('filterDateFrom') as HTMLInputElement).value = '';
    (document.getElementById('filterDateTo') as HTMLInputElement).value = '';
    currentPage = 1;
    applyCurrentFilters();
  });

  document.querySelectorAll<HTMLElement>('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const field = th.dataset.sort!;
      if (filters.sortBy === field) filters.sortDir = filters.sortDir === 'desc' ? 'asc' : 'desc';
      else { filters.sortBy = field; filters.sortDir = 'desc'; }
      document.querySelectorAll('th[data-sort]').forEach(h => { h.classList.remove('sorted'); h.textContent = h.textContent?.replace(/ [↑↓]/, '') || ''; });
      th.classList.add('sorted');
      th.textContent += filters.sortDir === 'desc' ? ' ↓' : ' ↑';
      applyCurrentFilters();
    });
  });
}

function applyCurrentFilters(): void {
  filteredTransactions = applyFilters(allTransactions, filters);
  renderTransactionTable();
  updateCategoryFilter();
}

function renderTransactionTable(): void {
  const { items, page, totalPages, totalItems, hasNext, hasPrev } = paginate(filteredTransactions, currentPage, 25);
  const tbody = document.getElementById('transactionsTableBody');
  if (!tbody) return;

  if (items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-white/35 p-10">Nenhuma transação encontrada</td></tr>';
  } else {
    tbody.innerHTML = items.map(tx => `
      <tr class="transition-colors hover:bg-indigo-500/5">
        <td class="p-3.5 border-b border-white/7">${formatDate(tx.date)}</td>
        <td class="p-3.5 border-b border-white/7">${escapeHtml(tx.description)}</td>
        <td class="p-3.5 border-b border-white/7"><span class="inline-flex px-2.5 py-1 rounded-full text-[11px] font-medium bg-indigo-500/15 text-indigo-300">${tx.categoryIcon || '📌'} ${escapeHtml(tx.category)}</span></td>
        <td class="p-3.5 border-b border-white/7"><span class="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${tx.type === 'income' ? 'bg-emerald-500/12 text-emerald-400' : 'bg-rose-500/12 text-rose-400'}">${tx.type === 'income' ? 'Receita' : 'Despesa'}</span></td>
        <td class="p-3.5 border-b border-white/7 ${tx.amount >= 0 ? 'text-emerald-500 font-semibold' : 'text-rose-500 font-semibold'}">${formatBRL(tx.amount)}</td>
      </tr>
    `).join('');
  }

  const pInfo = document.getElementById('paginationInfo');
  if (pInfo) pInfo.textContent = `${totalItems} transação(ões) · Página ${page} de ${totalPages}`;

  const btnsEl = document.getElementById('paginationBtns');
  if (btnsEl) {
    const btnClass = "px-3 py-1.5 rounded-lg bg-slate-800 text-white/60 border border-white/7 text-[13px] transition-all hover:border-white/15 hover:text-white disabled:opacity-35 disabled:cursor-not-allowed";
    let btnsHtml = `<button class="${btnClass}" ${!hasPrev ? 'disabled' : ''} data-page="${page - 1}">← Anterior</button>`;
    const startP = Math.max(1, page - 2);
    const endP = Math.min(totalPages, page + 2);
    for (let i = startP; i <= endP; i++) {
      btnsHtml += `<button class="${btnClass} ${i === page ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/35' : ''}" data-page="${i}">${i}</button>`;
    }
    btnsHtml += `<button class="${btnClass}" ${!hasNext ? 'disabled' : ''} data-page="${page + 1}">Próxima →</button>`;
    btnsEl.innerHTML = btnsHtml;

    btnsEl.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = parseInt(btn.dataset.page || '');
        if (!isNaN(p)) { currentPage = p; renderTransactionTable(); }
      });
    });
  }

  const recentBody = document.getElementById('recentTableBody');
  if (recentBody) {
    const recent = [...allTransactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
    if (recent.length > 0) {
      recentBody.innerHTML = recent.map(tx => `
        <tr class="transition-colors hover:bg-indigo-500/5">
          <td class="p-3.5 border-b border-white/7">${formatDate(tx.date)}</td>
          <td class="p-3.5 border-b border-white/7">${escapeHtml(tx.description)}</td>
          <td class="p-3.5 border-b border-white/7"><span class="inline-flex px-2.5 py-1 rounded-full text-[11px] font-medium bg-indigo-500/15 text-indigo-300">${tx.categoryIcon || '📌'} ${escapeHtml(tx.category)}</span></td>
          <td class="p-3.5 border-b border-white/7 ${tx.amount >= 0 ? 'text-emerald-500 font-semibold' : 'text-rose-500 font-semibold'}">${formatBRL(tx.amount)}</td>
        </tr>
      `).join('');
    }
  }
}

function updateCategoryFilter(): void {
  const select = document.getElementById('filterCategory') as HTMLSelectElement;
  if (!select) return;
  const currentVal = select.value;
  const cats = [...new Set(allTransactions.map(t => t.category))].filter(Boolean).sort();
  select.innerHTML = '<option value="all">Todas as categorias</option>' + cats.map(c => `<option value="${c}">${c}</option>`).join('');
  select.value = currentVal;
}
// ====== IMPORT HISTORY ======
async function updateImportHistory(): Promise<void> {
  const imports = await getImportHistory();
  const tbody = document.getElementById('importHistoryBody');
  if (!tbody) return;

  if (imports.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-white/35 p-7">Nenhuma importação realizada</td></tr>';
    return;
  }

  tbody.innerHTML = imports.map(imp => {
    if (imp.status === 'rejected') {
      return `
        <tr class="bg-rose-500/5">
          <td class="p-3.5 border-b border-white/7">${formatDate(imp.date)}</td>
          <td class="p-3.5 border-b border-white/7">${escapeHtml(imp.fileName)}</td>
          <td class="p-3.5 border-b border-white/7" colspan="2"><span class="text-rose-500 text-[13px] font-medium"><i data-lucide="alert-triangle" class="w-3.5 h-3.5 inline-block align-middle mr-1"></i> Rejeitado: ${escapeHtml(imp.rejectedReason)}</span></td>
          <td class="p-3.5 border-b border-white/7"><button class="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors" data-delete-import="${imp.id}"><i data-lucide="trash-2" class="w-4 h-4"></i></button></td>
        </tr>
      `;
    }

    const hasErrors = imp.errors && imp.errors > 0;
    const errorDetailsHtml = hasErrors && imp.errorDetails && imp.errorDetails.length > 0
      ? `<tr class="error-detail-row" id="errors-${imp.id}" style="display:none">
           <td colspan="5" class="p-3 px-5 bg-rose-500/5 border-l-2 border-rose-500">
             <div class="text-[12px] font-semibold text-rose-500 mb-2">⚠️ Linhas ignoradas:</div>
             ${imp.errorDetails.map(err => `<div class="text-[12px] text-white/60 py-0.5 font-mono">${escapeHtml(err)}</div>`).join('')}
           </td>
         </tr>`
      : '';

    return `
      <tr class="transition-colors hover:bg-indigo-500/5">
        <td class="p-3.5 border-b border-white/7">${formatDate(imp.date)}</td>
        <td class="p-3.5 border-b border-white/7">${escapeHtml(imp.fileName)}</td>
        <td class="p-3.5 border-b border-white/7">${imp.importedRows}</td>
        <td class="p-3.5 border-b border-white/7">${hasErrors
          ? `<span class="text-amber-500 cursor-pointer underline decoration-amber-500/30 underline-offset-4" data-toggle-errors="${imp.id}">${imp.errors} ⚠️</span>`
          : '<span class="text-emerald-500">0 ✓</span>'
        }</td>
        <td class="p-3.5 border-b border-white/7"><button class="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors" data-delete-import="${imp.id}"><i data-lucide="trash-2" class="w-4 h-4"></i></button></td>
      </tr>
      ${errorDetailsHtml}
    `;
  }).join('');

  window.lucide?.createIcons();

  tbody.querySelectorAll<HTMLElement>('[data-toggle-errors]').forEach(el => {
    el.addEventListener('click', () => {
      const row = document.getElementById(`errors-${el.dataset.toggleErrors}`);
      if (row) row.style.display = row.style.display === 'none' ? 'table-row' : 'none';
    });
  });

  tbody.querySelectorAll<HTMLElement>('[data-delete-import]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('Remover esta importação e suas transações?')) {
        try {
          await deleteImport(btn.dataset.deleteImport!);
          showToast('Importação removida', 'info');
          await loadData();
        } catch (err) {
          showToast(`Erro ao remover: ${err instanceof Error ? err.message : String(err)}`, 'error');
        }
      }
    });
  });
}

// ====== RECURRING ======
function updateRecurring(): void {
  const recurring = detectRecurring(allTransactions);
  const grid = document.getElementById('recurringGrid');
  if (!grid) return;
  const monthlyTotal = getMonthlyRecurringTotal(recurring);

  const kpiRec = document.getElementById('kpiRecurringTotal');
  if (kpiRec) kpiRec.textContent = formatBRL(monthlyTotal);
  const kpiRecSub = document.getElementById('kpiRecurringSub');
  if (kpiRecSub) kpiRecSub.textContent = `${recurring.length} assinatura(s) detectada(s)`;

  if (recurring.length === 0) {
    grid.innerHTML = '<div class="text-center p-[60px_20px] text-white/60"><i data-lucide="search" class="w-16 h-16 mx-auto mb-5 text-white/35 opacity-50"></i><h3 class="text-lg font-semibold text-white/95 mb-2">Nenhuma recorrência detectada</h3><p class="text-sm max-w-[400px] mx-auto">Importe pelo menos 2 meses de dados para a detecção funcionar</p></div>';
    window.lucide?.createIcons();
    return;
  }

  grid.innerHTML = recurring.map(r => `
    <div class="bg-white/5 border border-white/7 rounded-2xl p-5 flex items-center gap-4 transition-all hover:border-white/15 hover:shadow-[0_0_24px_rgba(99,102,241,0.12)]">
      <div class="w-12 h-12 rounded-xl bg-indigo-500/15 flex items-center justify-center font-bold text-base text-indigo-400 shrink-0">${r.categoryIcon || r.merchant.charAt(0)}</div>
      <div class="flex-1 min-w-0">
        <div class="font-semibold text-[15px] whitespace-nowrap overflow-hidden text-ellipsis">${escapeHtml(r.merchant)}</div>
        <div class="text-[13px] text-white/60 mt-0.5">${r.interval} · ${r.occurrences}x · Confiança: ${r.confidence}%</div>
      </div>
      <div class="font-outfit font-bold text-[17px] text-rose-500 whitespace-nowrap">${formatBRL(r.avgAmount)}</div>
    </div>
  `).join('');

  const forecast = generateForecast(allTransactions, [], 30);
  if (forecast.points.length > 0) {
    renderForecastChart('chartForecast', forecast);
    const fs = document.getElementById('forecastSummary');
    if (fs) {
      fs.innerHTML = `
        <div>📈 Receita projetada: <strong class="text-emerald-500">${formatBRL(forecast.projectedIncome)}</strong></div>
        <div>📉 Despesa projetada: <strong class="text-rose-500">${formatBRL(forecast.projectedExpense)}</strong></div>
        <div>💰 Saldo em 30 dias: <strong class="${forecast.projectedBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}">${formatBRL(forecast.projectedBalance)}</strong></div>
      `;
    }
  }
}

// ====== ANALYTICS ======
function updateAnalytics(): void {
  const s = currentStats;
  const catList = document.getElementById('topCategoriesList');
  if (!catList) return;

  if (Object.keys(s.byMonth).length > 0) {
    renderBarChart('chartBar', s.byMonth);
  } else {
    catList.innerHTML = '<div class="text-center p-7 text-white/60"><p>Sem dados de categorias</p></div>';
    return;
  }

  const catEntries = Object.entries(s.byCat).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxCat = catEntries.length > 0 ? catEntries[0]![1] : 1;

  if (catEntries.length === 0) {
    catList.innerHTML = '<div class="text-center p-7 text-white/60"><p>Sem dados de categorias</p></div>';
    return;
  }

  catList.innerHTML = catEntries.map(([cat, amount]) => {
    const pct = (amount / maxCat * 100).toFixed(0);
    return `
      <div class="mb-3.5">
        <div class="flex justify-between text-[13px] mb-1">
          <span>${cat}</span>
          <span class="text-white/60">${formatBRL(amount)}</span>
        </div>
        <div class="h-1.5 bg-[#171d2e] rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full transition-[width] duration-500 ease-out" style="width:${pct}%"></div>
        </div>
      </div>
    `;
  }).join('');
}

// ====== ACTIONS ======
function setupActions(): void {
  document.getElementById('btnDownloadSample')?.addEventListener('click', downloadSampleCSV);
  document.getElementById('btnRefresh')?.addEventListener('click', loadData);

  document.getElementById('btnExportCSV')?.addEventListener('click', () => {
    if (filteredTransactions.length === 0) { showToast('Nenhuma transação para exportar', 'info'); return; }
    exportCSV(filteredTransactions);
    showToast('CSV exportado!', 'success');
  });

  document.getElementById('btnExportPDF')?.addEventListener('click', () => {
    if (allTransactions.length === 0) { showToast('Nenhuma transação para o relatório', 'info'); return; }
    exportPDF(currentStats, allTransactions);
    showToast('PDF gerado!', 'success');
  });

  document.getElementById('btnClearAll')?.addEventListener('click', async () => {
    if (confirm('Tem certeza? Todos os dados serão removidos permanentemente.')) {
      await clearAllData();
      showToast('Todos os dados foram removidos', 'info');
      await loadData();
    }
  });

  document.getElementById('btnExportAll')?.addEventListener('click', () => {
    if (allTransactions.length === 0) { showToast('Nenhum dado para exportar', 'info'); return; }
    exportCSV(allTransactions, 'findash-todos-dados.csv');
    showToast('Dados exportados!', 'success');
  });

  document.getElementById('btnExportLogs')?.addEventListener('click', async () => {
    const imports = await getImportHistory();
    if (imports.length === 0) {
      showToast('Nenhum histórico de importação encontrado', 'info');
      return;
    }

    let log = '=================================================\n';
    log += '          FINDASH — LOG DE IMPORTAÇÕES\n';
    log += '=================================================\n\n';

    imports.forEach(imp => {
      log += `DATA DA IMPORTAÇÃO: ${new Date(imp.date).toLocaleString('pt-BR')}\n`;
      log += `ARQUIVO:            ${imp.fileName}\n`;
      log += `LINHAS DE DADOS:    ${imp.totalRows || 0}\n`;
      log += `SUCESSO:            ${imp.importedRows}\n`;
      log += `ERROS (IGNORADAS):  ${imp.errors || 0}\n`;
      
      if (imp.metadata && imp.metadata.separator) {
        log += `\n--- DETALHES DO ARQUIVO ---\n`;
        log += `SEPARADOR DETECTADO: "${imp.metadata.separator === '\t' ? 'TAB' : imp.metadata.separator}"\n`;
        log += `CABEÇALHOS ACHADOS:  ${JSON.stringify(imp.metadata.headers)}\n`;
        log += `MAPEAMENTO USADO:    ${JSON.stringify(imp.metadata.mapping)}\n`;
      }

      if (imp.errors > 0 && imp.errorDetails && imp.errorDetails.length > 0) {
        log += `\n--- DETALHES DOS ERROS ---\n`;
        imp.errorDetails.forEach(err => { log += `${err}\n\n`; });
      }
      log += '\n-------------------------------------------------\n\n';
    });

    const blob = new Blob([log], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `findash_log_erros_${Date.now()}.txt`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    
    showToast('Log exportado!', 'success');
  });

  document.getElementById('btnImportGitOverview')?.addEventListener('click', handleGitImport);
  document.getElementById('btnImportGitImport')?.addEventListener('click', handleGitImport);
}

async function handleGitImport(): Promise<void> {
  if (!await customConfirm()) {
    return;
  }

  showToast('Limpando base de dados atual...', 'info');
  await clearAllData();

  showToast('Importando planilha salarial...', 'info');
  try {
    const salResponse = await fetch('/data/salarial.csv');
    if (!salResponse.ok) throw new Error(`Não foi possível ler salarial.csv (Erro: ${salResponse.status})`);
    const salText = await salResponse.text();
    const salResult = parseCSV(salText);
    if (salResult.status === 'rejected') {
      throw new Error(salResult.reason || 'Planilha salarial rejeitada pelo parser.');
    }
    const salCategorized = applyCategories(salResult.transactions);
    await addTransactions(salCategorized, {
      fileName: 'planilha_completa___entradas_de_sal_rio__abr_2025_a_mai_2026_.csv',
      total: salResult.total,
      parsed: salResult.parsed,
      errors: salResult.errors.length,
      status: 'success',
      errorDetails: salResult.errors,
      metadata: {
        modelName: salResult.modelName,
        separator: salResult.separator,
        headers: salResult.headers,
        mapping: salResult.mapping
      }
    });
    showToast(`Planilha salarial importada: ${salResult.parsed} transações`, 'success');
  } catch (err) {
    showToast(`Erro na importação salarial: ${err instanceof Error ? err.message : String(err)}`, 'error');
    await loadData();
    return;
  }

  showToast('Importando extrato bancário...', 'info');
  try {
    const extResponse = await fetch('/data/extrato.csv');
    if (!extResponse.ok) throw new Error(`Não foi possível ler extrato.csv (Erro: ${extResponse.status})`);
    const extText = await extResponse.text();
    const extResult = parseCSV(extText);
    if (extResult.status === 'rejected') {
      throw new Error(extResult.reason || 'Extrato rejeitado pelo parser.');
    }
    const extCategorized = applyCategories(extResult.transactions);
    await addTransactions(extCategorized, {
      fileName: 'extrato_completo_lucas___2025_a_mai_2026.csv',
      total: extResult.total,
      parsed: extResult.parsed,
      errors: extResult.errors.length,
      status: 'success',
      errorDetails: extResult.errors,
      metadata: {
        modelName: extResult.modelName,
        separator: extResult.separator,
        headers: extResult.headers,
        mapping: extResult.mapping
      }
    });
    showToast(`Extrato importado: ${extResult.parsed} transações`, 'success');
  } catch (err) {
    showToast(`Erro na importação do extrato: ${err instanceof Error ? err.message : String(err)}`, 'error');
  }

  showToast('Importação concluída com sucesso!', 'success');
  await loadData();
}

function customConfirm(): Promise<boolean> {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirmModal');
    const okBtn = document.getElementById('confirmOk');
    const cancelBtn = document.getElementById('confirmCancel');
    if (!modal || !okBtn || !cancelBtn) {
      resolve(false);
      return;
    }

    const cleanup = (val: boolean) => {
      modal.classList.remove('active');
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      resolve(val);
    };

    const onOk = () => cleanup(true);
    const onCancel = () => cleanup(false);

    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    modal.classList.add('active');
  });
}

// ====== STORAGE COUNT ======
async function updateStorageCount(): Promise<void> {
  const count = await getTransactionCount();
  const sc = document.getElementById('storageCount');
  if (sc) sc.textContent = `${count} transações`;
}
function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const icons = { success: 'check-circle', error: 'alert-circle', info: 'info' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i data-lucide="${icons[type]}"></i><span>${message}</span>`;
  container.appendChild(toast);
  window.lucide?.createIcons();
  setTimeout(() => { if (toast.parentNode) toast.remove(); }, 4000);
}
function escapeHtml(str: string): string {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}
