// ============================================
// FINDASH — ECharts Wrappers
// ============================================

import { getCategoryColor } from './categorizer.js';
import type { MonthBucket, ForecastResult } from './types/index.js';

const chartInstances: Record<string, EChartsInstance> = {};

const CHART_THEME = {
  textColor: '#6e6e73',
  lineColor: '#eaebf0',
  tooltipBg: '#ffffff',
  tooltipBorder: '#eaebf0',
  tooltipText: '#1a1a1a',
};

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function getOrCreate(containerId: string): EChartsInstance | null {
  const el = document.getElementById(containerId);
  if (!el) return null;
  if (chartInstances[containerId]) {
    chartInstances[containerId]!.dispose();
  }
  const chart = echarts.init(el as HTMLElement, null, { renderer: 'canvas' });
  chartInstances[containerId] = chart;
  return chart;
}

export function renderLineChart(containerId: string, byMonth: Record<string, MonthBucket>): void {
  const chart = getOrCreate(containerId);
  if (!chart) return;
  const months = Object.keys(byMonth).sort();
  const labels = months.map(m => { const [y, mo] = m.split('-'); return `${mo}/${y!.slice(2)}`; });
  chart.setOption({
    tooltip: {
      trigger: 'axis', backgroundColor: CHART_THEME.tooltipBg,
      borderColor: CHART_THEME.tooltipBorder, textStyle: { color: CHART_THEME.tooltipText, fontSize: 13 },
      formatter: (params: Array<{ axisValue: string; marker: string; seriesName: string; value: number }>) => {
        let html = `<b>${params[0]!.axisValue}</b><br/>`;
        params.forEach(p => { html += `${p.marker} ${p.seriesName}: ${formatBRL(p.value)}<br/>`; });
        return html;
      },
    },
    legend: { data: ['Receitas', 'Despesas'], textStyle: { color: CHART_THEME.textColor }, bottom: -5 },
    grid: { top: 20, right: 10, bottom: 20, left: 0, containLabel: true },
    xAxis: { type: 'category', data: labels, boundaryGap: false, axisLine: { lineStyle: { color: CHART_THEME.lineColor } }, axisLabel: { color: CHART_THEME.textColor, fontSize: 11 } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: CHART_THEME.lineColor } }, axisLabel: { color: CHART_THEME.textColor, fontSize: 11, formatter: (v: number) => (v/1000).toFixed(0) + 'k' } },
    series: [
      { name: 'Receitas', type: 'line', smooth: true, symbol: 'circle', symbolSize: 8, data: months.map(m => byMonth[m]!.income), lineStyle: { width: 3, color: '#5e35b1' }, itemStyle: { color: '#5e35b1' }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(94, 53, 177, 0.15)' }, { offset: 1, color: 'rgba(94, 53, 177, 0)' }]) } },
      { name: 'Despesas', type: 'bar', barWidth: '30%', data: months.map(m => byMonth[m]!.expense), itemStyle: { color: '#c5b0ec', borderRadius: [4, 4, 0, 0] } },
    ],
  });
}

export function renderDoughnutChart(containerId: string, byCat: Record<string, number>): void {
  const chart = getOrCreate(containerId);
  if (!chart) return;
  const entries = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const data = entries.map(([name, value]) => ({ name, value, itemStyle: { color: getCategoryColor(name) } }));
  chart.setOption({
    tooltip: { trigger: 'item', backgroundColor: CHART_THEME.tooltipBg, borderColor: CHART_THEME.tooltipBorder, textStyle: { color: CHART_THEME.tooltipText, fontSize: 13 }, formatter: (p: { marker: string; name: string; value: number; percent: number }) => `${p.marker} ${p.name}<br/>${formatBRL(p.value)} (${p.percent.toFixed(1)}%)` },
    series: [{ type: 'pie', radius: ['60%', '85%'], center: ['50%', '50%'], avoidLabelOverlap: true, padAngle: 3, itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 }, label: { show: false }, emphasis: { label: { show: false }, itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.1)' } }, data }],
  });
}

export function renderBarChart(containerId: string, byMonth: Record<string, MonthBucket>): void {
  const chart = getOrCreate(containerId);
  if (!chart) return;
  const months = Object.keys(byMonth).sort();
  const labels = months.map(m => { const [y, mo] = m.split('-'); return `${mo}/${y!.slice(2)}`; });
  chart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: CHART_THEME.tooltipBg, borderColor: 'rgba(255,255,255,0.08)', textStyle: { color: '#fff', fontSize: 13 }, formatter: (params: Array<{ axisValue: string; marker: string; seriesName: string; value: number }>) => { let html = `<b>${params[0]!.axisValue}</b><br/>`; params.forEach(p => { html += `${p.marker} ${p.seriesName}: ${formatBRL(p.value)}<br/>`; }); return html; } },
    legend: { data: ['Receitas', 'Despesas'], textStyle: { color: CHART_THEME.textColor }, bottom: 0 },
    grid: { top: 20, right: 20, bottom: 40, left: 15, containLabel: true },
    xAxis: { type: 'category', data: labels, axisLine: { lineStyle: { color: CHART_THEME.lineColor } }, axisLabel: { color: CHART_THEME.textColor } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: CHART_THEME.lineColor } }, axisLabel: { color: CHART_THEME.textColor, fontSize: 11, formatter: (v: number) => formatBRL(v) } },
    series: [
      { name: 'Receitas', type: 'bar', barWidth: '35%', data: months.map(m => byMonth[m]!.income), itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] } },
      { name: 'Despesas', type: 'bar', barWidth: '35%', data: months.map(m => byMonth[m]!.expense), itemStyle: { color: '#f43f5e', borderRadius: [4, 4, 0, 0] } },
    ],
  });
}

export function renderForecastChart(containerId: string, forecastData: ForecastResult): void {
  const chart = getOrCreate(containerId);
  if (!chart) return;
  const { points } = forecastData;
  if (!points.length) return;
  const labels = points.map(p => { const d = new Date(p.date); return `${d.getDate()}/${d.getMonth() + 1}`; });
  chart.setOption({
    tooltip: { trigger: 'axis', backgroundColor: CHART_THEME.tooltipBg, borderColor: 'rgba(255,255,255,0.08)', textStyle: { color: '#fff', fontSize: 13 }, formatter: (params: Array<{ axisValue: string; marker: string; value: number }>) => `<b>${params[0]!.axisValue}</b><br/>${params[0]!.marker} Saldo Projetado: ${formatBRL(params[0]!.value)}` },
    grid: { top: 20, right: 20, bottom: 10, left: 15, containLabel: true },
    xAxis: { type: 'category', data: labels, boundaryGap: false, axisLine: { lineStyle: { color: CHART_THEME.lineColor } }, axisLabel: { color: CHART_THEME.textColor, fontSize: 11 } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: CHART_THEME.lineColor } }, axisLabel: { color: CHART_THEME.textColor, fontSize: 11, formatter: (v: number) => formatBRL(v) } },
    series: [{ type: 'line', smooth: true, symbol: 'none', data: points.map(p => p.balance), lineStyle: { width: 3, color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#6366f1' }, { offset: 1, color: '#a855f7' }]) }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(99,102,241,0.20)' }, { offset: 1, color: 'rgba(99,102,241,0)' }]) } }],
  });
}

export function resizeAll(): void {
  for (const chart of Object.values(chartInstances)) {
    if (chart && !chart.isDisposed()) chart.resize();
  }
}

export function clearCharts(): void {
  for (const chart of Object.values(chartInstances)) {
    if (chart && !chart.isDisposed()) chart.clear();
  }
}

window.addEventListener('resize', () => { setTimeout(resizeAll, 100); });
