<script setup lang="ts">
import { ref, toRefs, watch } from 'vue';
import { useEChart } from '@/composables/useEChart';
import type { MonthBucket } from '@/types';

const props = defineProps<{ byMonth: Record<string, MonthBucket> }>();
const { byMonth } = toRefs(props);

const containerRef = ref<HTMLDivElement | null>(null);
const dataRef = ref<Record<string, MonthBucket>>(byMonth.value);

watch(byMonth, (v) => (dataRef.value = v), { deep: true });

const THEME = {
  textColor: 'rgba(255,255,255,0.65)',
  lineColor: 'rgba(255,255,255,0.07)',
  tooltipBg: 'rgba(15,20,32,0.95)',
};

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

useEChart(containerRef, (data) => {
  const months = Object.keys(data).sort();
  const labels = months.map((m) => {
    const [y, mo] = m.split('-');
    return `${mo}/${y.slice(2)}`;
  });

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: THEME.tooltipBg,
      borderColor: 'rgba(255,255,255,0.08)',
      textStyle: { color: '#fff', fontSize: 13 },
      formatter: (params: any) => {
        let html = `<b>${params[0].axisValue}</b><br/>`;
        params.forEach((p: any) => {
          html += `${p.marker} ${p.seriesName}: ${formatBRL(p.value)}<br/>`;
        });
        return html;
      },
    },
    legend: { data: ['Receitas', 'Despesas'], textStyle: { color: THEME.textColor }, bottom: 0 },
    grid: { top: 20, right: 20, bottom: 40, left: 15, containLabel: true },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { lineStyle: { color: THEME.lineColor } },
      axisLabel: { color: THEME.textColor },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: THEME.lineColor } },
      axisLabel: { color: THEME.textColor, fontSize: 11, formatter: (v: number) => formatBRL(v) },
    },
    series: [
      {
        name: 'Receitas',
        type: 'bar',
        barWidth: '35%',
        data: months.map((m) => data[m].income),
        itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] },
      },
      {
        name: 'Despesas',
        type: 'bar',
        barWidth: '35%',
        data: months.map((m) => data[m].expense),
        itemStyle: { color: '#f43f5e', borderRadius: [4, 4, 0, 0] },
      },
    ],
  };
}, dataRef);
</script>

<template>
  <div ref="containerRef" class="min-h-[340px]" />
</template>
