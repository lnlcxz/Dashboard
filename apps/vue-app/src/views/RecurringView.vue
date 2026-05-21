<script setup lang="ts">
import { computed } from 'vue';
import { Repeat, Search } from 'lucide-vue-next';
import PageHeader from '@/components/layout/PageHeader.vue';
import Card from '@/components/ui/Card.vue';
import KpiCard from '@/components/ui/KpiCard.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import RecurringCard from '@/components/recurring/RecurringCard.vue';
import ForecastChart from '@/components/charts/ForecastChart.vue';
import { useFinanceStore } from '@/stores/finance';
import { formatBRL } from '@/services/export';

const store = useFinanceStore();

const hasForecast = computed(() => store.forecast.points.length > 0);

const balanceColorClass = computed(() =>
  store.forecast.projectedBalance >= 0 ? 'text-success' : 'text-danger'
);
</script>

<template>
  <PageHeader title="Recorrências" />

  <div class="px-8 py-7 flex-1 animate-fade-in">
    <div class="grid gap-5 mb-6" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))">
      <KpiCard
        label="Gasto Recorrente Mensal"
        :value="formatBRL(store.monthlyRecurringTotal)"
        :sub="`${store.recurring.length} assinatura(s) detectada(s)`"
        variant="expense"
        :icon="Repeat"
        value-class="text-danger"
      />
    </div>

    <div v-if="store.recurring.length === 0">
      <Card no-padding>
        <EmptyState
          :icon="Search"
          title="Nenhuma recorrência detectada"
          description="Importe pelo menos 2 meses de dados para a detecção funcionar"
        />
      </Card>
    </div>
    <div
      v-else
      class="grid gap-4 mb-7"
      style="grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))"
    >
      <RecurringCard v-for="r in store.recurring" :key="r.merchant" :item="r" />
    </div>

    <Card title="Projeção de Saldo — Próximos 30 dias">
      <ForecastChart v-if="hasForecast" :forecast="store.forecast" />
      <div v-else class="text-center text-text-tertiary py-10">
        Importe dados para gerar a projeção
      </div>

      <div v-if="hasForecast" class="flex gap-6 mt-4 text-[13px] text-text-secondary flex-wrap">
        <div>
          📈 Receita projetada:
          <strong class="text-success">{{ formatBRL(store.forecast.projectedIncome) }}</strong>
        </div>
        <div>
          📉 Despesa projetada:
          <strong class="text-danger">{{ formatBRL(store.forecast.projectedExpense) }}</strong>
        </div>
        <div>
          💰 Saldo em 30 dias:
          <strong :class="balanceColorClass">{{ formatBRL(store.forecast.projectedBalance) }}</strong>
        </div>
      </div>
    </Card>
  </div>
</template>
