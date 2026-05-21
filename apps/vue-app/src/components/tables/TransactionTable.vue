<script setup lang="ts">
import { formatBRL, formatDate } from '@/services/export';
import type { Filters, Transaction } from '@/types';

defineProps<{
  transactions: Transaction[];
  showType?: boolean;
  sortBy?: Filters['sortBy'];
  sortDir?: Filters['sortDir'];
}>();

const emit = defineEmits<{ (e: 'sort', field: Filters['sortBy']): void }>();

function arrow(field: Filters['sortBy'], current?: Filters['sortBy'], dir?: Filters['sortDir']) {
  if (current !== field) return '';
  return dir === 'desc' ? ' ↓' : ' ↑';
}
</script>

<template>
  <div class="overflow-x-auto rounded-lg-app border border-border scroll-thin">
    <table class="w-full border-collapse text-sm">
      <thead class="bg-bg-tertiary">
        <tr>
          <th
            class="px-4 py-3.5 text-left font-semibold text-xs uppercase tracking-wider border-b border-border whitespace-nowrap cursor-pointer select-none transition-colors hover:text-text-primary"
            :class="sortBy === 'date' ? 'text-accent-hover' : 'text-text-secondary'"
            @click="emit('sort', 'date')"
          >
            Data{{ arrow('date', sortBy, sortDir) }}
          </th>
          <th
            class="px-4 py-3.5 text-left font-semibold text-xs uppercase tracking-wider border-b border-border whitespace-nowrap cursor-pointer select-none transition-colors hover:text-text-primary"
            :class="sortBy === 'description' ? 'text-accent-hover' : 'text-text-secondary'"
            @click="emit('sort', 'description')"
          >
            Descrição{{ arrow('description', sortBy, sortDir) }}
          </th>
          <th
            class="px-4 py-3.5 text-left font-semibold text-xs uppercase tracking-wider border-b border-border whitespace-nowrap cursor-pointer select-none transition-colors hover:text-text-primary"
            :class="sortBy === 'category' ? 'text-accent-hover' : 'text-text-secondary'"
            @click="emit('sort', 'category')"
          >
            Categoria{{ arrow('category', sortBy, sortDir) }}
          </th>
          <th
            v-if="showType"
            class="px-4 py-3.5 text-left font-semibold text-xs uppercase tracking-wider border-b border-border whitespace-nowrap text-text-secondary"
          >
            Tipo
          </th>
          <th
            class="px-4 py-3.5 text-left font-semibold text-xs uppercase tracking-wider border-b border-border whitespace-nowrap cursor-pointer select-none transition-colors hover:text-text-primary"
            :class="sortBy === 'amount' ? 'text-accent-hover' : 'text-text-secondary'"
            @click="emit('sort', 'amount')"
          >
            Valor{{ arrow('amount', sortBy, sortDir) }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="transactions.length === 0">
          <td :colspan="showType ? 5 : 4" class="text-center text-text-tertiary py-10">
            Nenhuma transação encontrada
          </td>
        </tr>
        <tr
          v-for="tx in transactions"
          :key="tx.id"
          class="transition-colors hover:bg-[rgba(99,102,241,0.04)]"
        >
          <td class="px-4 py-3.5 border-b border-border align-middle text-text-primary">
            {{ formatDate(tx.date) }}
          </td>
          <td class="px-4 py-3.5 border-b border-border align-middle text-text-primary">
            {{ tx.description }}
          </td>
          <td class="px-4 py-3.5 border-b border-border align-middle">
            <span class="badge badge-cat">{{ tx.categoryIcon || '📌' }} {{ tx.category }}</span>
          </td>
          <td v-if="showType" class="px-4 py-3.5 border-b border-border align-middle">
            <span class="badge" :class="tx.type === 'income' ? 'badge-income' : 'badge-expense'">
              {{ tx.type === 'income' ? 'Receita' : 'Despesa' }}
            </span>
          </td>
          <td
            class="px-4 py-3.5 border-b border-border align-middle"
            :class="tx.amount >= 0 ? 'amount-positive' : 'amount-negative'"
          >
            {{ formatBRL(tx.amount) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
