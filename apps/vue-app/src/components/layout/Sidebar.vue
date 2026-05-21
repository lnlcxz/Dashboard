<script setup lang="ts">
import { LayoutDashboard, Upload, List, BarChart3, Repeat, Settings, Database } from 'lucide-vue-next';
import { useFinanceStore } from '@/stores/finance';

defineProps<{ open: boolean }>();
defineEmits<{ (e: 'navigate'): void }>();

const store = useFinanceStore();

const items = [
  { to: '/overview', label: 'Visão Geral', icon: LayoutDashboard },
  { to: '/import', label: 'Importar CSV', icon: Upload },
  { to: '/transactions', label: 'Transações', icon: List },
  { to: '/analytics', label: 'Análises', icon: BarChart3 },
  { to: '/recurring', label: 'Recorrências', icon: Repeat },
  { to: '/settings', label: 'Configurações', icon: Settings },
];
</script>

<template>
  <aside
    class="fixed top-0 left-0 bottom-0 w-[260px] z-[100] bg-bg-secondary border-r border-border flex flex-col transition-transform"
    :class="open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
  >
    <div class="px-5 py-6 border-b border-border">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-md-app bg-gradient-brand text-white font-display font-bold text-lg flex items-center justify-center shadow-glow-strong">
          F
        </div>
        <span class="font-display font-bold text-[22px] text-text-primary">FinDash</span>
      </div>
    </div>

    <nav class="flex-1 px-3 py-4 flex flex-col gap-1">
      <router-link
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        custom
        v-slot="{ navigate, isActive }"
      >
        <a
          href="#"
          class="flex items-center gap-3 px-4 py-3 rounded-md-app text-sm font-medium transition-all"
          :class="
            isActive
              ? 'text-white bg-accent-dim shadow-[inset_3px_0_0_#6366f1]'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-glass'
          "
          @click="(e) => { e.preventDefault(); navigate(); $emit('navigate'); }"
        >
          <component :is="item.icon" class="w-5 h-5 flex-shrink-0" :class="isActive ? 'text-accent-hover' : ''" />
          <span>{{ item.label }}</span>
        </a>
      </router-link>
    </nav>

    <div class="px-5 py-4 border-t border-border flex flex-col gap-2">
      <div class="flex items-center gap-2 text-xs text-text-tertiary">
        <Database class="w-3.5 h-3.5" />
        <span>{{ store.storageCount }} transações</span>
      </div>
      <span class="text-[11px] text-text-tertiary">FinDash v1.0.0</span>
    </div>
  </aside>
</template>
