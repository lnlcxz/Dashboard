<script setup lang="ts">
import { computed } from 'vue';
import PageHeader from '@/components/layout/PageHeader.vue';
import Card from '@/components/ui/Card.vue';
import BarChart from '@/components/charts/BarChart.vue';
import { useFinanceStore } from '@/stores/finance';
import { formatBRL } from '@/services/export';

const store = useFinanceStore();

const topCategories = computed(() => {
  const entries = Object.entries(store.stats.byCat).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const max = entries.length > 0 ? entries[0][1] : 1;
  return entries.map(([cat, amount]) => ({
    name: cat,
    amount,
    pct: Math.round((amount / max) * 100),
  }));
});

const hasMonthData = computed(() => Object.keys(store.stats.byMonth).length > 0);
</script>

<template>
  <PageHeader title="Análises" />

  <div class="px-8 py-7 flex-1 animate-fade-in">
    <div class="grid gap-5 mb-7 lg:grid-cols-[2fr_1fr] grid-cols-1">
      <Card title="Comparação Mensal">
        <BarChart v-if="hasMonthData" :by-month="store.stats.byMonth" />
        <div v-else class="text-center text-text-tertiary py-10">Sem dados para visualização</div>
      </Card>

      <Card title="Top Categorias de Gasto">
        <div v-if="topCategories.length === 0" class="text-center text-text-tertiary py-8">
          Sem dados de categorias
        </div>
        <div v-else>
          <div v-for="cat in topCategories" :key="cat.name" class="mb-3.5">
            <div class="flex justify-between text-[13px] mb-1">
              <span>{{ cat.name }}</span>
              <span class="text-text-secondary">{{ formatBRL(cat.amount) }}</span>
            </div>
            <div class="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-brand rounded-full transition-[width] duration-500"
                :style="{ width: `${cat.pct}%` }"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>
