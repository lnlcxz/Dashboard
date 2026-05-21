import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue';
import * as echarts from 'echarts';

export function useEChart<T>(containerRef: Ref<HTMLElement | null>, optionFn: (data: T) => echarts.EChartsOption, data: Ref<T | null>) {
  const chart = ref<echarts.ECharts | null>(null);

  function render() {
    if (!containerRef.value || !data.value) return;
    if (!chart.value) {
      chart.value = echarts.init(containerRef.value, undefined, { renderer: 'canvas' });
    }
    chart.value.setOption(optionFn(data.value), true);
  }

  function resize() {
    if (chart.value && !chart.value.isDisposed()) chart.value.resize();
  }

  onMounted(() => {
    render();
    window.addEventListener('resize', resize);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('resize', resize);
    if (chart.value && !chart.value.isDisposed()) chart.value.dispose();
  });

  watch(data, render, { deep: true });

  return { chart, resize };
}
