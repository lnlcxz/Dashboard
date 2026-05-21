<script setup lang="ts">
import { ref } from 'vue';
import { Download, Trash2 } from 'lucide-vue-next';
import PageHeader from '@/components/layout/PageHeader.vue';
import Card from '@/components/ui/Card.vue';
import UploadZone from '@/components/upload/UploadZone.vue';
import { useFinanceStore } from '@/stores/finance';
import { useToast } from '@/composables/useToast';
import { parseCSV } from '@/services/csv-parser';
import { downloadSampleCSV } from '@/services/sample-data';
import { formatDate } from '@/services/export';

const store = useFinanceStore();
const { showToast } = useToast();

const expandedRows = ref<Set<string>>(new Set());

function toggleErrors(id: string) {
  if (expandedRows.value.has(id)) expandedRows.value.delete(id);
  else expandedRows.value.add(id);
}

async function handleFile(file: File) {
  if (!file.name.match(/\.(csv|txt)$/i)) {
    showToast('Formato inválido. Use .csv ou .txt', 'error');
    return;
  }

  try {
    const text = await file.text();

    console.group(`📊 FinDash — Importação: ${file.name}`);
    console.log(`📄 Arquivo: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    console.log(`📅 Data: ${new Date().toLocaleString('pt-BR')}`);

    const result = parseCSV(text);

    console.log(`✅ Linhas processadas com sucesso: ${result.parsed}`);
    console.log(`❌ Linhas ignoradas: ${result.errors.length}`);
    console.log(`📋 Total de linhas de dados: ${result.total}`);

    if (result.errors.length > 0) {
      console.group('⚠️ Detalhes das linhas ignoradas:');
      result.errors.forEach((err) => console.warn(err));
      console.groupEnd();
    }
    console.groupEnd();

    if (result.transactions.length === 0) {
      showToast(`Nenhuma transação válida encontrada. ${result.errors.length} erro(s).`, 'error');
      return;
    }

    await store.importTransactions(result.transactions, {
      fileName: file.name,
      total: result.total,
      parsed: result.parsed,
      errors: result.errors.length,
      errorDetails: result.errors,
      metadata: {
        separator: result.separator,
        headers: result.headers,
        mapping: result.mapping,
      },
    });

    showToast(`${result.parsed} transações importadas com sucesso!`, 'success');
    if (result.errors.length > 0) {
      showToast(`${result.errors.length} linha(s) ignorada(s) — veja detalhes no Histórico`, 'info');
    }
  } catch (err: any) {
    showToast(`Erro ao processar arquivo: ${err.message}`, 'error');
    console.error('❌ Erro fatal na importação:', err);
  }
}

async function deleteImp(id: string) {
  if (!confirm('Remover esta importação e suas transações?')) return;
  try {
    await store.removeImport(id);
    showToast('Importação removida', 'info');
  } catch (err: any) {
    showToast(`Erro ao remover: ${err.message}`, 'error');
  }
}
</script>

<template>
  <PageHeader title="Importar CSV">
    <template #actions>
      <button class="btn btn-secondary btn-sm" @click="downloadSampleCSV">
        <Download class="w-4 h-4" /> Baixar Planilha Exemplo
      </button>
    </template>
  </PageHeader>

  <div class="px-8 py-7 flex-1 animate-fade-in">
    <UploadZone @file="handleFile" />

    <div class="mt-7">
      <Card no-padding>
        <div class="p-6 pb-0">
          <div class="card-title">Histórico de Importações</div>
        </div>
        <div class="overflow-x-auto scroll-thin">
          <table class="w-full border-collapse text-sm">
            <thead class="bg-bg-tertiary">
              <tr>
                <th class="px-4 py-3.5 text-left font-semibold text-xs uppercase tracking-wider text-text-secondary border-b border-border whitespace-nowrap">Data</th>
                <th class="px-4 py-3.5 text-left font-semibold text-xs uppercase tracking-wider text-text-secondary border-b border-border whitespace-nowrap">Arquivo</th>
                <th class="px-4 py-3.5 text-left font-semibold text-xs uppercase tracking-wider text-text-secondary border-b border-border whitespace-nowrap">Importados</th>
                <th class="px-4 py-3.5 text-left font-semibold text-xs uppercase tracking-wider text-text-secondary border-b border-border whitespace-nowrap">Erros</th>
                <th class="px-4 py-3.5 text-left font-semibold text-xs uppercase tracking-wider text-text-secondary border-b border-border whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="store.imports.length === 0">
                <td colspan="5" class="text-center text-text-tertiary py-8">Nenhuma importação realizada</td>
              </tr>
              <template v-for="imp in store.imports" :key="imp.id">
                <tr class="transition-colors hover:bg-[rgba(99,102,241,0.04)]">
                  <td class="px-4 py-3.5 border-b border-border align-middle text-text-primary">{{ formatDate(imp.date) }}</td>
                  <td class="px-4 py-3.5 border-b border-border align-middle text-text-primary">{{ imp.fileName }}</td>
                  <td class="px-4 py-3.5 border-b border-border align-middle text-text-primary">{{ imp.importedRows }}</td>
                  <td class="px-4 py-3.5 border-b border-border align-middle">
                    <span
                      v-if="imp.errors > 0"
                      class="text-warning cursor-pointer underline"
                      @click="toggleErrors(imp.id)"
                    >
                      {{ imp.errors }} ⚠️
                    </span>
                    <span v-else class="text-success">0 ✓</span>
                  </td>
                  <td class="px-4 py-3.5 border-b border-border align-middle">
                    <button class="btn btn-danger btn-sm" @click="deleteImp(imp.id)">
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </td>
                </tr>
                <tr
                  v-if="imp.errors > 0 && expandedRows.has(imp.id) && imp.errorDetails?.length"
                  class="bg-[rgba(244,63,94,0.05)]"
                >
                  <td colspan="5" class="px-5 py-3 border-l-[3px] border-danger">
                    <div class="text-xs font-semibold text-danger mb-2">⚠️ Linhas ignoradas:</div>
                    <div
                      v-for="(err, i) in imp.errorDetails"
                      :key="i"
                      class="text-xs text-text-secondary py-0.5 font-mono whitespace-pre-wrap"
                    >
                      {{ err }}
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  </div>
</template>
