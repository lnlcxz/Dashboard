import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/overview' },
  { path: '/overview', name: 'overview', component: () => import('@/views/OverviewView.vue'), meta: { title: 'Visão Geral' } },
  { path: '/import', name: 'import', component: () => import('@/views/ImportView.vue'), meta: { title: 'Importar CSV' } },
  { path: '/transactions', name: 'transactions', component: () => import('@/views/TransactionsView.vue'), meta: { title: 'Transações' } },
  { path: '/analytics', name: 'analytics', component: () => import('@/views/AnalyticsView.vue'), meta: { title: 'Análises' } },
  { path: '/recurring', name: 'recurring', component: () => import('@/views/RecurringView.vue'), meta: { title: 'Recorrências' } },
  { path: '/settings', name: 'settings', component: () => import('@/views/SettingsView.vue'), meta: { title: 'Configurações' } },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
