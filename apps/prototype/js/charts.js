// ============================================
// FINDASH — ECharts Wrappers
// ============================================

import { getCategoryColor } from './categorizer.js';

const chartInstances = {};
const CHART_THEME = {
  textColor: 'rgba(255,255,255,0.65)',
  lineColor: 'rgba(255,255,255,0.07)',
  tooltipBg: 'rgba(15,20,32,0.95)',
};

function formatBRL(cents) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function getOrCreate(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return null;
  if (chartInstances[containerId]) {
    chartInstances[containerId].dispose();
  }
  const chart = echarts.init(el, null, { renderer: 'canvas' });
  chartInstances[containerId] = chart;
  return chart;
}

export function renderLineChart(containerId, byMonth) {
  const chart = getOrCreate(containerId);
  if (!chart) return;

  const months = Object.keys(byMonth).sort();
  const labels = months.map(m => {
    const [y, mo] = m.split('-');
    return `${mo}/${y.slice(2)}`;
  });

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      backgroundColor: CHART_THEME.tooltipBg,
      borderColor: 'rgba(255,255,255,0.08)',
      textStyle: { color: '#fff', fontSize: 13 },
      formatter: (params) => {
        let html = `<b>${params[0].axisValue}</b><br/>`;
        params.forEach(p => { html += `${p.marker} ${p.seriesName}: ${formatBRL(p.value)}<br/>`; });
        return html;
      },
    },
    legend: { data: ['Receitas', 'Despesas'], textStyle: { color: CHART_THEME.textColor }, bottom: 0 },
    grid: { top: 20, right: 20, bottom: 40, left: 15, containLabel: true },
    xAxis: {
      type: 'category', data: labels, boundaryGap: false,
      axisLine: { lineStyle: { color: CHART_THEME.lineColor } },
      axisLabel: { color: CHART_THEME.textColor, fontSize: 12 },
    },
    yAxis: {
      type: 'value', splitLine: { lineStyle: { color: CHART_THEME.lineColor } },
      axisLabel: { color: CHART_THEME.textColor, fontSize: 11, formatter: v => formatBRL(v) },
    },
    series: [
      {
        name: 'Receitas', type: 'line', smooth: true, symbol: 'circle', symbolSize: 6,
        data: months.map(m => byMonth[m].income),
        lineStyle: { width: 3, color: '#10b981' },
        itemStyle: { color: '#10b981' },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(16,185,129,0.25)' }, { offset: 1, color: 'rgba(16,185,129,0)' },
        ])},
      },
      {
        name: 'Despesas', type: 'line', smooth: true, symbol: 'circle', symbolSize: 6,
        data: months.map(m => byMonth[m].expense),
        lineStyle: { width: 3, color: '#f43f5e' },
        itemStyle: { color: '#f43f5e' },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(244,63,94,0.20)' }, { offset: 1, color: 'rgba(244,63,94,0)' },
        ])},
      },
    ],
  });
}

export function renderDoughnutChart(containerId, byCat) {
  const chart = getOrCreate(containerId);
  if (!chart) return;

  const entries = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const data = entries.map(([name, value]) => ({
    name, value, itemStyle: { color: getCategoryColor(name) },
  }));

  chart.setOption({
    tooltip: {
      trigger: 'item',
      backgroundColor: CHART_THEME.tooltipBg,
      borderColor: 'rgba(255,255,255,0.08)',
      textStyle: { color: '#fff', fontSize: 13 },
      formatter: p => `${p.marker} ${p.name}<br/>${formatBRL(p.value)} (${p.percent.toFixed(1)}%)`,
    },
    series: [{
      type: 'pie', radius: ['48%', '75%'], center: ['50%', '50%'],
      avoidLabelOverlap: true, padAngle: 2,
      itemStyle: { borderRadius: 6, borderColor: '#0f1420', borderWidth: 2 },
      label: { show: true, color: CHART_THEME.textColor, fontSize: 11, formatter: '{b}\n{d}%', lineHeight: 16 },
      labelLine: { lineStyle: { color: 'rgba(255,255,255,0.15)' } },
      emphasis: { label: { fontSize: 14, fontWeight: 'bold' }, itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.4)' } },
      data,
    }],
  });
}

export function renderBarChart(containerId, byMonth) {
  const chart = getOrCreate(containerId);
  if (!chart) return;

  const months = Object.keys(byMonth).sort();
  const labels = months.map(m => { const [y, mo] = m.split('-'); return `${mo}/${y.slice(2)}`; });

  chart.setOption({
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'shadow' },
      backgroundColor: CHART_THEME.tooltipBg, borderColor: 'rgba(255,255,255,0.08)',
      textStyle: { color: '#fff', fontSize: 13 },
      formatter: (params) => {
        let html = `<b>${params[0].axisValue}</b><br/>`;
        params.forEach(p => { html += `${p.marker} ${p.seriesName}: ${formatBRL(p.value)}<br/>`; });
        return html;
      },
    },
    legend: { data: ['Receitas', 'Despesas'], textStyle: { color: CHART_THEME.textColor }, bottom: 0 },
    grid: { top: 20, right: 20, bottom: 40, left: 15, containLabel: true },
    xAxis: { type: 'category', data: labels, axisLine: { lineStyle: { color: CHART_THEME.lineColor } }, axisLabel: { color: CHART_THEME.textColor } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: CHART_THEME.lineColor } }, axisLabel: { color: CHART_THEME.textColor, fontSize: 11, formatter: v => formatBRL(v) } },
    series: [
      { name: 'Receitas', type: 'bar', barWidth: '35%', data: months.map(m => byMonth[m].income), itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] } },
      { name: 'Despesas', type: 'bar', barWidth: '35%', data: months.map(m => byMonth[m].expense), itemStyle: { color: '#f43f5e', borderRadius: [4, 4, 0, 0] } },
    ],
  });
}

export function renderForecastChart(containerId, forecastData) {
  const chart = getOrCreate(containerId);
  if (!chart) return;

  const { points } = forecastData;
  if (!points.length) return;

  const labels = points.map(p => { const d = new Date(p.date); return `${d.getDate()}/${d.getMonth() + 1}`; });

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      backgroundColor: CHART_THEME.tooltipBg,
      borderColor: 'rgba(255,255,255,0.08)',
      textStyle: { color: '#fff', fontSize: 13 },
      formatter: params => `<b>${params[0].axisValue}</b><br/>${params[0].marker} Saldo Projetado: ${formatBRL(params[0].value)}`,
    },
    grid: { top: 20, right: 20, bottom: 10, left: 15, containLabel: true },
    xAxis: { type: 'category', data: labels, boundaryGap: false, axisLine: { lineStyle: { color: CHART_THEME.lineColor } }, axisLabel: { color: CHART_THEME.textColor, fontSize: 11 } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: CHART_THEME.lineColor } }, axisLabel: { color: CHART_THEME.textColor, fontSize: 11, formatter: v => formatBRL(v) } },
    series: [{
      type: 'line', smooth: true, symbol: 'none',
      data: points.map(p => p.balance),
      lineStyle: { width: 3, color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
        { offset: 0, color: '#6366f1' }, { offset: 1, color: '#a855f7' },
      ])},
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: 'rgba(99,102,241,0.20)' }, { offset: 1, color: 'rgba(99,102,241,0)' },
      ])},
    }],
  });
}

export function resizeAll() {
  for (const chart of Object.values(chartInstances)) {
    if (chart && !chart.isDisposed()) chart.resize();
  }
}

export function clearCharts() {
  for (const chart of Object.values(chartInstances)) {
    if (chart && !chart.isDisposed()) chart.clear();
  }
}

window.addEventListener('resize', () => { setTimeout(resizeAll, 100); });
