<script setup lang="ts">
import { ref, toRefs, watch } from 'vue';
import { useEChart } from '@/composables/useEChart';
import { getCategoryColor } from '@/services/categorizer';

const props = defineProps<{ byCat: Record<string, number> }>();
const { byCat } = toRefs(props);

const containerRef = ref<HTMLDivElement | null>(null);
const dataRef = ref<Record<string, number>>(byCat.value);

watch(byCat, (v) => (dataRef.value = v), { deep: true });

const THEME = {
  textColor: 'rgba(255,255,255,0.65)',
  tooltipBg: 'rgba(15,20,32,0.95)',
};

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

useEChart(containerRef, (data) => {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const items = entries.map(([name, value]) => ({
    name,
    value,
    itemStyle: { color: getCategoryColor(name) },
  }));

  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: THEME.tooltipBg,
      borderColor: 'rgba(255,255,255,0.08)',
      textStyle: { color: '#fff', fontSize: 13 },
      formatter: (p: any) => `${p.marker} ${p.name}<br/>${formatBRL(p.value)} (${p.percent.toFixed(1)}%)`,
    },
    series: [
      {
        type: 'pie',
        radius: ['48%', '75%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        padAngle: 2,
        itemStyle: { borderRadius: 6, borderColor: '#0f1420', borderWidth: 2 },
        label: { show: true, color: THEME.textColor, fontSize: 11, formatter: '{b}\n{d}%', lineHeight: 16 },
        labelLine: { lineStyle: { color: 'rgba(255,255,255,0.15)' } },
        emphasis: {
          label: { fontSize: 14, fontWeight: 'bold' },
          itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.4)' },
        },
        data: items,
      },
    ],
  };
}, dataRef);
</script>

<template>
  <div ref="containerRef" class="min-h-[340px]" />
</template>
