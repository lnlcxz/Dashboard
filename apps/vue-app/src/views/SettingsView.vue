<script setup lang="ts">
import { Trash2, Download, FileText } from 'lucide-vue-next';
import PageHeader from '@/components/layout/PageHeader.vue';
import { useFinanceStore } from '@/stores/finance';
import { useToast } from '@/composables/useToast';
import { exportCSV } from '@/services/export';
import { getImportHistory } from '@/services/storage';

const store = useFinanceStore();
const { showToast } = useToast();

async function clearAll() {
  if (!confirm('Tem certeza? Todos os dados serão removidos permanentemente.')) return;
  await store.clearAll();
  showToast('Todos os dados foram removidos', 'info');
}

function exportAll() {
  if (store.transactions.length === 0) {
    showToast('Nenhum dado para exportar', 'info');
    return;
  }
  exportCSV(store.transactions, 'findash-todos-dados.csv');
  showToast('Dados exportados!', 'success');
}

async function exportLogs() {
  const imports = await getImportHistory();
  if (imports.length === 0) {
    showToast('Nenhum histórico de importação encontrado', 'info');
    return;
  }

  let log = '=================================================\n';
  log += '          FINDASH — LOG DE IMPORTAÇÕES\n';
  log += '=================================================\n\n';

  imports.forEach((imp) => {
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
      imp.errorDetails.forEach((err) => {
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
}
</script>

<template>
  <PageHeader title="Configurações" />

  <div class="px-8 py-7 flex-1 animate-fade-in">
    <div class="card mb-8">
      <h3 class="text-base font-semibold mb-4 pb-3 border-b border-border">Dados</h3>

      <div class="flex items-center justify-between py-3.5 border-b border-border">
        <div>
          <div class="text-sm">Limpar todos os dados</div>
          <div class="text-xs text-text-tertiary mt-0.5">
            Remove todas as transações e importações do IndexedDB
          </div>
        </div>
        <button class="btn btn-danger btn-sm" @click="clearAll">
          <Trash2 class="w-4 h-4" /> Limpar Tudo
        </button>
      </div>

      <div class="flex items-center justify-between py-3.5 border-b border-border">
        <div>
          <div class="text-sm">Exportar dados completos</div>
          <div class="text-xs text-text-tertiary mt-0.5">
            Baixa todas as transações em formato CSV
          </div>
        </div>
        <button class="btn btn-secondary btn-sm" @click="exportAll">
          <Download class="w-4 h-4" /> Exportar CSV
        </button>
      </div>

      <div class="flex items-center justify-between py-3.5">
        <div>
          <div class="text-sm">Exportar log de erros</div>
          <div class="text-xs text-text-tertiary mt-0.5">
            Baixa um relatório detalhado (TXT) com todos os erros de importação
          </div>
        </div>
        <button class="btn btn-secondary btn-sm" @click="exportLogs">
          <FileText class="w-4 h-4" /> Baixar Log
        </button>
      </div>
    </div>

    <div class="card">
      <h3 class="text-base font-semibold mb-4 pb-3 border-b border-border">Sobre</h3>
      <div class="py-3.5">
        <div class="text-sm">FinDash — Dashboard Financeiro Inteligente</div>
        <div class="text-xs text-text-tertiary mt-0.5">
          Versão 1.0.0 · Dados armazenados localmente via IndexedDB
        </div>
      </div>
    </div>
  </div>
</template>
