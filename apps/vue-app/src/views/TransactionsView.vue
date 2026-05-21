<script setup lang="ts">
import { computed, watch } from 'vue';
import { Download, FileText } from 'lucide-vue-next';
import PageHeader from '@/components/layout/PageHeader.vue';
import Card from '@/components/ui/Card.vue';
import FilterBar from '@/components/filters/FilterBar.vue';
import TransactionTable from '@/components/tables/TransactionTable.vue';
import Pagination from '@/components/ui/Pagination.vue';
import { useFinanceStore } from '@/stores/finance';
import { useToast } from '@/composables/useToast';
import { paginate } from '@/services/filters';
import { exportCSV, exportPDF } from '@/services/export';
import type { Filters } from '@/types';

const store = useFinanceStore();
const { showToast } = useToast();

const pageData = computed(() => paginate(store.filteredTransactions, store.currentPage, 25));

watch(
  () => store.filteredTransactions.length,
  () => {
    if (store.currentPage > pageData.value.totalPages) store.currentPage = 1;
  }
);

function updateFilters(partial: Partial<Filters>) {
  Object.assign(store.filters, partial);
  store.currentPage = 1;
}

function clearFilters() {
  store.resetFilters();
}

function exportCsv() {
  if (store.filteredTransactions.length === 0) {
    showToast('Nenhuma transação para exportar', 'info');
    return;
  }
  exportCSV(store.filteredTransactions);
  showToast('CSV exportado!', 'success');
}

function exportPdf() {
  if (store.transactions.length === 0) {
    showToast('Nenhuma transação para o relatório', 'info');
    return;
  }
  exportPDF(store.stats, store.transactions);
  showToast('PDF gerado!', 'success');
}
</script>

<template>
  <PageHeader title="Transações">
    <template #actions>
      <button class="btn btn-secondary btn-sm" @click="exportCsv">
        <Download class="w-4 h-4" /> Exportar CSV
      </button>
      <button class="btn btn-primary btn-sm" @click="exportPdf">
        <FileText class="w-4 h-4" /> Relatório PDF
      </button>
    </template>
  </PageHeader>

  <div class="px-8 py-7 flex-1 animate-fade-in">
    <FilterBar
      :filters="store.filters"
      :categories="store.availableCategories"
      @update="updateFilters"
      @clear="clearFilters"
    />

    <Card no-padding>
      <TransactionTable
        :transactions="pageData.items"
        :show-type="true"
        :sort-by="store.filters.sortBy"
        :sort-dir="store.filters.sortDir"
        @sort="(field) => store.toggleSort(field)"
      />
    </Card>

    <Pagination
      :page="pageData.page"
      :total-pages="pageData.totalPages"
      :total-items="pageData.totalItems"
      :has-next="pageData.hasNext"
      :has-prev="pageData.hasPrev"
      @change="(p) => (store.currentPage = p)"
    />
  </div>
</template>
