<script setup lang="ts">
import { computed } from 'vue';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, RefreshCw } from 'lucide-vue-next';
import PageHeader from '@/components/layout/PageHeader.vue';
import Card from '@/components/ui/Card.vue';
import KpiCard from '@/components/ui/KpiCard.vue';
import LineChart from '@/components/charts/LineChart.vue';
import DoughnutChart from '@/components/charts/DoughnutChart.vue';
import TransactionTable from '@/components/tables/TransactionTable.vue';
import { useFinanceStore } from '@/stores/finance';
import { formatBRL } from '@/services/export';

const store = useFinanceStore();

const recentTxs = computed(() =>
  [...store.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8)
);

const savingsSub = computed(() => {
  const rate = store.stats.savingsRate;
  if (rate >= 20) return 'Excelente!';
  if (rate >= 0) return 'Taxa de economia';
  return 'Gastando mais do que ganha';
});

const hasMonthData = computed(() => Object.keys(store.stats.byMonth).length > 0);
const hasCatData = computed(() => Object.keys(store.stats.byCat).length > 0);
</script>

<template>
  <PageHeader title="Visão Geral">
    <template #actions>
      <button class="btn btn-secondary btn-sm" @click="store.loadData()">
        <RefreshCw class="w-4 h-4" /> Atualizar
      </button>
    </template>
  </PageHeader>

  <div class="px-8 py-7 flex-1 animate-fade-in">
    <div class="grid gap-5 mb-7" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))">
      <KpiCard
        label="Saldo Total"
        :value="formatBRL(store.stats.balance)"
        :sub="`${store.stats.transactionCount} transações`"
        variant="balance"
        :icon="Wallet"
        :value-class="store.stats.balance >= 0 ? 'text-success' : 'text-danger'"
      />
      <KpiCard
        label="Receitas"
        :value="formatBRL(store.stats.totalIncome)"
        :sub="`${Object.keys(store.stats.byMonth).length} meses analisados`"
        variant="income"
        :icon="TrendingUp"
        value-class="text-success"
      />
      <KpiCard
        label="Despesas"
        :value="formatBRL(store.stats.totalExpense)"
        :sub="`${Object.keys(store.stats.byCat).length} categorias`"
        variant="expense"
        :icon="TrendingDown"
        value-class="text-danger"
      />
      <KpiCard
        label="Economia"
        :value="`${store.stats.savingsRate.toFixed(1)}%`"
        :sub="savingsSub"
        variant="savings"
        :icon="PiggyBank"
        :value-class="store.stats.savingsRate >= 0 ? 'text-success' : 'text-danger'"
      />
    </div>

    <div class="grid gap-5 mb-7 lg:grid-cols-[2fr_1fr] grid-cols-1">
      <Card title="Receitas vs Despesas">
        <LineChart v-if="hasMonthData" :by-month="store.stats.byMonth" />
        <div v-else class="text-center text-text-tertiary py-10">Importe dados para visualizar</div>
      </Card>
      <Card title="Despesas por Categoria">
        <DoughnutChart v-if="hasCatData" :by-cat="store.stats.byCat" />
        <div v-else class="text-center text-text-tertiary py-10">Importe dados para visualizar</div>
      </Card>
    </div>

    <Card title="Transações Recentes">
      <TransactionTable :transactions="recentTxs" />
    </Card>
  </div>
</template>
