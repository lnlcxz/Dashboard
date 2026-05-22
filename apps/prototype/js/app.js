// ============================================
// FINDASH — Main Application Controller
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

// ====== STATE ======
let allTransactions = [];
let filteredTransactions = [];
let currentStats = {};
let currentPage = 1;
let filters = { search: '', category: 'all', type: 'all', dateFrom: '', dateTo: '', sortBy: 'date', sortDir: 'desc' };

// ====== INIT ======
document.addEventListener('DOMContentLoaded', async () => {
  lucide.createIcons();
  setupNavigation();
  setupUpload();
  setupFilters();
  setupActions();
  await loadData();
});

// ====== NAVIGATION ======
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const pages = document.querySelectorAll('.page');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const pageId = item.dataset.page;
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      pages.forEach(p => p.classList.remove('active'));
      const target = document.getElementById(`page-${pageId}`);
      if (target) target.classList.add('active');
      // Close mobile sidebar
      document.getElementById('sidebar').classList.remove('open');
      document.getElementById('overlay').classList.remove('active');
      // Re-render charts after page is visible (ECharts needs non-zero container dimensions)
      setTimeout(() => {
        resizeAll();
        if (pageId === 'overview') updateCharts();
        else if (pageId === 'analytics') updateAnalytics();
        else if (pageId === 'recurring') updateRecurring();
      }, 50);
    });
  });

  // Mobile toggle
  document.getElementById('mobileToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('active');
  });
  document.getElementById('overlay').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('active');
  });
}

// ====== CSV UPLOAD ======
function setupUpload() {
  const zone = document.getElementById('uploadZone');
  const input = document.getElementById('csvInput');

  zone.addEventListener('click', () => input.click());
  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });
  input.addEventListener('change', () => {
    if (input.files[0]) handleFile(input.files[0]);
    input.value = '';
  });
}

async function handleFile(file) {
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
      const worksheet = workbook.Sheets[firstSheetName];
      text = window.XLSX.utils.sheet_to_csv(worksheet);
      console.log(`Planilha Excel lida e convertida para CSV (${text.length} bytes)`);
    } else {
      text = await file.text();
    }

    // === LOG COMPLETO DA IMPORTAÇÃO ===
    console.group(`📊 FinDash — Importação: ${file.name}`);
    console.log(`📄 Arquivo: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    console.log(`📅 Data: ${new Date().toLocaleString('pt-BR')}`);

    const result = parseCSV(text);

    if (result.status === 'rejected') {
      showToast(result.reason, 'error');
      // Save rejection to db
      await addTransactions([], {
        fileName: file.name,
        total: 0,
        parsed: 0,
        errors: 1,
        status: 'rejected',
        rejectedReason: result.reason,
        errorDetails: [result.reason],
        metadata: { headers: result.headers }
      });
      await loadData();
      return;
    }

    console.log(`✅ Modelo detectado: ${result.modelName}`);
    console.log(`✅ Linhas processadas com sucesso: ${result.parsed}`);
    console.log(`❌ Linhas ignoradas: ${result.errors.length}`);
    console.log(`📋 Total de linhas de dados: ${result.total}`);

    if (result.errors.length > 0) {
      console.group('⚠️ Detalhes das linhas ignoradas:');
      result.errors.forEach(err => console.warn(err));
      console.groupEnd();
    }

    if (result.transactions.length > 0) {
      console.log('🔍 Amostra da 1ª transação importada:', result.transactions[0]);
    }
    console.groupEnd();
    // === FIM DO LOG ===

    if (result.transactions.length === 0) {
      showToast(`Nenhuma transação válida encontrada. ${result.errors.length} erro(s).`, 'error');
      if (result.errors.length > 0) {
        console.error('Todos os erros:', result.errors);
      }
      return;
    }

    // Auto-categorize
    const categorized = applyCategories(result.transactions);

    // Save to IndexedDB (include error details for the import history)
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
    showToast(`Erro ao processar arquivo: ${err.message}`, 'error');
    console.error('❌ Erro fatal na importação:', err);
  }
}

// ====== LOAD DATA ======
async function loadData() {
  allTransactions = await getAllTransactions();
  // Re-apply categories to any uncategorized
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
function updateKPIs() {
  const s = currentStats;
  document.getElementById('kpiBalance').textContent = formatBRL(s.balance);
  document.getElementById('kpiBalance').className = `kpi-value ${s.balance >= 0 ? 'positive' : 'negative'}`;
  document.getElementById('kpiBalanceSub').textContent = `${s.transactionCount} transações`;

  document.getElementById('kpiIncome').textContent = formatBRL(s.totalIncome);
  document.getElementById('kpiIncomeSub').textContent = `${Object.keys(s.byMonth).length} meses analisados`;

  document.getElementById('kpiExpense').textContent = formatBRL(s.totalExpense);
  document.getElementById('kpiExpenseSub').textContent = `${Object.keys(s.byCat).length} categorias`;

  document.getElementById('kpiSavings').textContent = `${s.savingsRate.toFixed(1)}%`;
  document.getElementById('kpiSavings').className = `kpi-value ${s.savingsRate >= 0 ? 'positive' : 'negative'}`;
  document.getElementById('kpiSavingsSub').textContent = s.savingsRate >= 20 ? 'Excelente!' : s.savingsRate >= 0 ? 'Taxa de economia' : 'Gastando mais do que ganha';
}

// ====== CHARTS ======
function updateCharts() {
  const s = currentStats;
  if (Object.keys(s.byMonth).length > 0) {
    renderLineChart('chartLine', s.byMonth);
    renderDoughnutChart('chartDoughnut', s.byCat);
  } else {
    clearCharts();
  }
}

// ====== FILTERS + TABLE ======
function setupFilters() {
  document.getElementById('filterSearch').addEventListener('input', debounce(() => {
    filters.search = document.getElementById('filterSearch').value;
    currentPage = 1;
    applyCurrentFilters();
  }, 250));

  document.getElementById('filterCategory').addEventListener('change', (e) => {
    filters.category = e.target.value;
    currentPage = 1;
    applyCurrentFilters();
  });

  document.getElementById('filterType').addEventListener('change', (e) => {
    filters.type = e.target.value;
    currentPage = 1;
    applyCurrentFilters();
  });

  document.getElementById('filterDateFrom').addEventListener('change', (e) => {
    filters.dateFrom = e.target.value;
    currentPage = 1;
    applyCurrentFilters();
  });

  document.getElementById('filterDateTo').addEventListener('change', (e) => {
    filters.dateTo = e.target.value;
    currentPage = 1;
    applyCurrentFilters();
  });

  document.getElementById('btnClearFilters').addEventListener('click', () => {
    filters = { search: '', category: 'all', type: 'all', dateFrom: '', dateTo: '', sortBy: 'date', sortDir: 'desc' };
    document.getElementById('filterSearch').value = '';
    document.getElementById('filterCategory').value = 'all';
    document.getElementById('filterType').value = 'all';
    document.getElementById('filterDateFrom').value = '';
    document.getElementById('filterDateTo').value = '';
    currentPage = 1;
    applyCurrentFilters();
  });

  // Sortable headers
  document.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const field = th.dataset.sort;
      if (filters.sortBy === field) filters.sortDir = filters.sortDir === 'desc' ? 'asc' : 'desc';
      else { filters.sortBy = field; filters.sortDir = 'desc'; }
      document.querySelectorAll('th[data-sort]').forEach(h => { h.classList.remove('sorted'); h.textContent = h.textContent.replace(/ [↑↓]/, ''); });
      th.classList.add('sorted');
      th.textContent += filters.sortDir === 'desc' ? ' ↓' : ' ↑';
      applyCurrentFilters();
    });
  });
}

function applyCurrentFilters() {
  filteredTransactions = applyFilters(allTransactions, filters);
  renderTransactionTable();
  updateCategoryFilter();
}

function renderTransactionTable() {
  const { items, page, totalPages, totalItems, hasNext, hasPrev } = paginate(filteredTransactions, currentPage, 25);
  const tbody = document.getElementById('transactionsTableBody');

  if (items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-tertiary);padding:40px">Nenhuma transação encontrada</td></tr>';
  } else {
    tbody.innerHTML = items.map(tx => `
      <tr>
        <td>${formatDate(tx.date)}</td>
        <td>${escapeHtml(tx.description)}</td>
        <td><span class="badge badge-cat">${tx.categoryIcon || '📌'} ${escapeHtml(tx.category)}</span></td>
        <td><span class="badge ${tx.type === 'income' ? 'badge-income' : 'badge-expense'}">${tx.type === 'income' ? 'Receita' : 'Despesa'}</span></td>
        <td class="${tx.amount >= 0 ? 'amount-positive' : 'amount-negative'}">${formatBRL(tx.amount)}</td>
      </tr>
    `).join('');
  }

  document.getElementById('paginationInfo').textContent = `${totalItems} transação(ões) · Página ${page} de ${totalPages}`;

  const btnsEl = document.getElementById('paginationBtns');
  let btnsHtml = `<button ${!hasPrev ? 'disabled' : ''} data-page="${page - 1}">← Anterior</button>`;
  const startP = Math.max(1, page - 2);
  const endP = Math.min(totalPages, page + 2);
  for (let i = startP; i <= endP; i++) {
    btnsHtml += `<button class="${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }
  btnsHtml += `<button ${!hasNext ? 'disabled' : ''} data-page="${page + 1}">Próxima →</button>`;
  btnsEl.innerHTML = btnsHtml;

  btnsEl.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = parseInt(btn.dataset.page);
      if (!isNaN(p)) { currentPage = p; renderTransactionTable(); }
    });
  });

  // Update recent table on overview
  const recentBody = document.getElementById('recentTableBody');
  const recent = allTransactions.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  if (recent.length > 0) {
    recentBody.innerHTML = recent.map(tx => `
      <tr>
        <td>${formatDate(tx.date)}</td>
        <td>${escapeHtml(tx.description)}</td>
        <td><span class="badge badge-cat">${tx.categoryIcon || '📌'} ${escapeHtml(tx.category)}</span></td>
        <td class="${tx.amount >= 0 ? 'amount-positive' : 'amount-negative'}">${formatBRL(tx.amount)}</td>
      </tr>
    `).join('');
  }
}

function updateCategoryFilter() {
  const select = document.getElementById('filterCategory');
  const currentVal = select.value;
  const cats = [...new Set(allTransactions.map(t => t.category))].filter(Boolean).sort();
  select.innerHTML = '<option value="all">Todas as categorias</option>' + cats.map(c => `<option value="${c}">${c}</option>`).join('');
  select.value = currentVal;
}

// ====== IMPORT HISTORY ======
async function updateImportHistory() {
  const imports = await getImportHistory();
  const tbody = document.getElementById('importHistoryBody');

  if (imports.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-tertiary);padding:30px">Nenhuma importação realizada</td></tr>';
    return;
  }

  tbody.innerHTML = imports.map(imp => {
    if (imp.status === 'rejected') {
      return `
        <tr style="background:rgba(244,63,94,0.03)">
          <td>${formatDate(imp.date)}</td>
          <td>${escapeHtml(imp.fileName)}</td>
          <td colspan="2"><span style="color:var(--danger);font-size:13px;font-weight:500"><i data-lucide="alert-triangle" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:4px"></i> Rejeitado: ${escapeHtml(imp.rejectedReason)}</span></td>
          <td><button class="btn btn-danger btn-sm" data-delete-import="${imp.id}"><i data-lucide="trash-2"></i></button></td>
        </tr>
      `;
    }

    const hasErrors = imp.errors && imp.errors > 0;
    const errorDetailsHtml = hasErrors && imp.errorDetails && imp.errorDetails.length > 0
      ? `<tr class="error-detail-row" id="errors-${imp.id}" style="display:none">
           <td colspan="5" style="padding:12px 20px;background:rgba(244,63,94,0.05);border-left:3px solid var(--danger)">
             <div style="font-size:12px;font-weight:600;color:var(--danger);margin-bottom:8px">⚠️ Linhas ignoradas:</div>
             ${imp.errorDetails.map(err => `<div style="font-size:12px;color:var(--text-secondary);padding:3px 0;font-family:monospace">${escapeHtml(err)}</div>`).join('')}
           </td>
         </tr>`
      : '';

    return `
      <tr>
        <td>${formatDate(imp.date)}</td>
        <td>${escapeHtml(imp.fileName)}</td>
        <td>${imp.importedRows}</td>
        <td>${hasErrors
          ? `<span style="color:var(--warning);cursor:pointer;text-decoration:underline" data-toggle-errors="${imp.id}">${imp.errors} ⚠️</span>`
          : '<span style="color:var(--success)">0 ✓</span>'
        }</td>
        <td><button class="btn btn-danger btn-sm" data-delete-import="${imp.id}"><i data-lucide="trash-2"></i></button></td>
      </tr>
      ${errorDetailsHtml}
    `;
  }).join('');

  lucide.createIcons();

  // Toggle error details
  tbody.querySelectorAll('[data-toggle-errors]').forEach(el => {
    el.addEventListener('click', () => {
      const row = document.getElementById(`errors-${el.dataset.toggleErrors}`);
      if (row) row.style.display = row.style.display === 'none' ? 'table-row' : 'none';
    });
  });

  tbody.querySelectorAll('[data-delete-import]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('Remover esta importação e suas transações?')) {
        try {
          await deleteImport(btn.dataset.deleteImport);
          showToast('Importação removida', 'info');
          await loadData();
        } catch (err) {
          showToast(`Erro ao remover: ${err.message}`, 'error');
          console.error('Falha ao excluir importação:', err);
        }
      }
    });
  });
}

// ====== RECURRING ======
function updateRecurring() {
  const recurring = detectRecurring(allTransactions);
  const grid = document.getElementById('recurringGrid');
  const monthlyTotal = getMonthlyRecurringTotal(recurring);

  document.getElementById('kpiRecurringTotal').textContent = formatBRL(monthlyTotal);
  document.getElementById('kpiRecurringSub').textContent = `${recurring.length} assinatura(s) detectada(s)`;

  if (recurring.length === 0) {
    grid.innerHTML = '<div class="empty-state"><i data-lucide="search"></i><h3>Nenhuma recorrência detectada</h3><p>Importe pelo menos 2 meses de dados para a detecção funcionar</p></div>';
    lucide.createIcons();
    return;
  }

  grid.innerHTML = recurring.map(r => `
    <div class="recurring-card">
      <div class="recurring-avatar">${r.categoryIcon || r.merchant.charAt(0)}</div>
      <div class="recurring-info">
        <div class="recurring-name">${escapeHtml(r.merchant)}</div>
        <div class="recurring-detail">${r.interval} · ${r.occurrences}x · Confiança: ${r.confidence}%</div>
      </div>
      <div class="recurring-amount">${formatBRL(r.avgAmount)}</div>
    </div>
  `).join('');

  // Forecast
  const forecast = generateForecast(allTransactions, recurring, 30);
  if (forecast.points.length > 0) {
    renderForecastChart('chartForecast', forecast);
    document.getElementById('forecastSummary').innerHTML = `
      <div>📈 Receita projetada: <strong style="color:var(--success)">${formatBRL(forecast.projectedIncome)}</strong></div>
      <div>📉 Despesa projetada: <strong style="color:var(--danger)">${formatBRL(forecast.projectedExpense)}</strong></div>
      <div>💰 Saldo em 30 dias: <strong style="color:${forecast.projectedBalance >= 0 ? 'var(--success)' : 'var(--danger)'}">${formatBRL(forecast.projectedBalance)}</strong></div>
    `;
  }
}

// ====== ANALYTICS ======
function updateAnalytics() {
  const s = currentStats;
  const catList = document.getElementById('topCategoriesList');

  if (Object.keys(s.byMonth).length > 0) {
    renderBarChart('chartBar', s.byMonth);
  } else {
    // A limpeza do ECharts já ocorreu no updateCharts()
    catList.innerHTML = '<div class="empty-state" style="padding:30px"><p>Sem dados de categorias</p></div>';
    return;
  }

  const catEntries = Object.entries(s.byCat).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxCat = catEntries.length > 0 ? catEntries[0][1] : 1;

  if (catEntries.length === 0) {
    catList.innerHTML = '<div class="empty-state" style="padding:30px"><p>Sem dados de categorias</p></div>';
    return;
  }

  catList.innerHTML = catEntries.map(([cat, amount]) => {
    const pct = (amount / maxCat * 100).toFixed(0);
    const { getCategoryColor } = window._catModule || {};
    return `
      <div style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px">
          <span>${cat}</span>
          <span style="color:var(--text-secondary)">${formatBRL(amount)}</span>
        </div>
        <div style="height:6px;background:var(--bg-tertiary);border-radius:3px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:var(--gradient);border-radius:3px;transition:width 0.5s ease"></div>
        </div>
      </div>
    `;
  }).join('');
}

// ====== ACTIONS ======
function setupActions() {
  document.getElementById('btnDownloadSample').addEventListener('click', downloadSampleCSV);
  document.getElementById('btnRefresh').addEventListener('click', loadData);

  document.getElementById('btnExportCSV').addEventListener('click', () => {
    if (filteredTransactions.length === 0) { showToast('Nenhuma transação para exportar', 'info'); return; }
    exportCSV(filteredTransactions);
    showToast('CSV exportado!', 'success');
  });

  document.getElementById('btnExportPDF').addEventListener('click', () => {
    if (allTransactions.length === 0) { showToast('Nenhuma transação para o relatório', 'info'); return; }
    exportPDF(currentStats, allTransactions);
    showToast('PDF gerado!', 'success');
  });

  document.getElementById('btnClearAll').addEventListener('click', async () => {
    if (confirm('Tem certeza? Todos os dados serão removidos permanentemente.')) {
      await clearAllData();
      showToast('Todos os dados foram removidos', 'info');
      await loadData();
    }
  });

  document.getElementById('btnExportAll').addEventListener('click', () => {
    if (allTransactions.length === 0) { showToast('Nenhum dado para exportar', 'info'); return; }
    exportCSV(allTransactions, 'findash-todos-dados.csv');
    showToast('Dados exportados!', 'success');
  });

  document.getElementById('btnExportLogs').addEventListener('click', async () => {
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
        imp.errorDetails.forEach(err => {
          log += `${err}\n\n`;
        });
      }
      log += '\n-------------------------------------------------\n\n';
    });

    const blob = new Blob([log], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `findash_log_erros_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Log exportado!', 'success');
  });
}

// ====== STORAGE COUNT ======
async function updateStorageCount() {
  const count = await getTransactionCount();
  document.getElementById('storageCount').textContent = `${count} transações`;
}

// ====== UTILITIES ======
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const icons = { success: 'check-circle', error: 'alert-circle', info: 'info' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i data-lucide="${icons[type] || 'info'}"></i><span>${message}</span>`;
  container.appendChild(toast);
  lucide.createIcons();
  setTimeout(() => { if (toast.parentNode) toast.remove(); }, 4000);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function debounce(fn, ms) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}
