<script setup lang="ts">
import { X } from 'lucide-vue-next';
import type { Filters } from '@/types';

const props = defineProps<{
  filters: Filters;
  categories: string[];
}>();

const emit = defineEmits<{
  (e: 'update', filters: Partial<Filters>): void;
  (e: 'clear'): void;
}>();

function set<K extends keyof Filters>(key: K, value: Filters[K]) {
  emit('update', { [key]: value } as Partial<Filters>);
}
</script>

<template>
  <div class="flex gap-3 flex-wrap items-center px-5 py-4 glass rounded-lg-app mb-5">
    <input
      type="text"
      class="input flex-1 min-w-[260px]"
      placeholder="Buscar por descrição, categoria..."
      :value="props.filters.search"
      @input="(e) => set('search', (e.target as HTMLInputElement).value)"
    />
    <select
      class="select min-w-[160px] !w-auto"
      :value="props.filters.category"
      @change="(e) => set('category', (e.target as HTMLSelectElement).value)"
    >
      <option value="all">Todas as categorias</option>
      <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
    </select>
    <select
      class="select min-w-[160px] !w-auto"
      :value="props.filters.type"
      @change="(e) => set('type', (e.target as HTMLSelectElement).value as Filters['type'])"
    >
      <option value="all">Todos os tipos</option>
      <option value="income">Receitas</option>
      <option value="expense">Despesas</option>
    </select>
    <input
      type="date"
      class="input !w-40"
      :value="props.filters.dateFrom"
      @change="(e) => set('dateFrom', (e.target as HTMLInputElement).value)"
    />
    <input
      type="date"
      class="input !w-40"
      :value="props.filters.dateTo"
      @change="(e) => set('dateTo', (e.target as HTMLInputElement).value)"
    />
    <div class="flex-1" />
    <button class="btn btn-secondary btn-sm" @click="emit('clear')">
      <X class="w-4 h-4" /> Limpar
    </button>
  </div>
</template>
