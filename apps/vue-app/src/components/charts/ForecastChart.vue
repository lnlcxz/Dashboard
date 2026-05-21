<script setup lang="ts">
import { ref, toRefs, watch } from 'vue';
import * as echarts from 'echarts';
import { useEChart } from '@/composables/useEChart';
import type { Forecast } from '@/types';

const props = defineProps<{ forecast: Forecast }>();
const { forecast } = toRefs(props);

const containerRef = ref<HTMLDivElement | null>(null);
const dataRef = ref<Forecast>(forecast.value);

watch(forecast, (v) => (dataRef.value = v), { deep: true });

const THEME = {
  textColor: 'rgba(255,255,255,0.65)',
  lineColor: 'rgba(255,255,255,0.07)',
  tooltipBg: 'rgba(15,20,32,0.95)',
};

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

useEChart(containerRef, (data) => {
  const { points } = data;
  const labels = points.map((p) => {
    const d = new Date(p.date);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  });

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: THEME.tooltipBg,
      borderColor: 'rgba(255,255,255,0.08)',
      textStyle: { color: '#fff', fontSize: 13 },
      formatter: (params: any) =>
        `<b>${params[0].axisValue}</b><br/>${params[0].marker} Saldo Projetado: ${formatBRL(params[0].value)}`,
    },
    grid: { top: 20, right: 20, bottom: 10, left: 15, containLabel: true },
    xAxis: {
      type: 'category',
      data: labels,
      boundaryGap: false,
      axisLine: { lineStyle: { color: THEME.lineColor } },
      axisLabel: { color: THEME.textColor, fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: THEME.lineColor } },
      axisLabel: { color: THEME.textColor, fontSize: 11, formatter: (v: number) => formatBRL(v) },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: points.map((p) => p.balance),
        lineStyle: {
          width: 3,
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#6366f1' },
            { offset: 1, color: '#a855f7' },
          ]),
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(99,102,241,0.20)' },
            { offset: 1, color: 'rgba(99,102,241,0)' },
          ]),
        },
      },
    ],
  };
}, dataRef);
</script>

<template>
  <div ref="containerRef" class="min-h-[340px]" />
</template>
