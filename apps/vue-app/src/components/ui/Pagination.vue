<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  page: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
}>();

const emit = defineEmits<{ (e: 'change', page: number): void }>();

const pages = computed(() => {
  const start = Math.max(1, props.page - 2);
  const end = Math.min(props.totalPages, props.page + 2);
  const arr: number[] = [];
  for (let i = start; i <= end; i++) arr.push(i);
  return arr;
});
</script>

<template>
  <div class="flex items-center justify-between py-4 text-[13px] text-text-secondary">
    <span>{{ totalItems }} transação(ões) · Página {{ page }} de {{ totalPages }}</span>
    <div class="flex gap-1.5">
      <button
        class="px-3 py-1.5 rounded-sm-app bg-bg-tertiary text-text-secondary border border-border text-[13px] transition-all hover:border-border-hover hover:text-text-primary disabled:opacity-35 disabled:cursor-not-allowed"
        :disabled="!hasPrev"
        @click="emit('change', page - 1)"
      >
        ← Anterior
      </button>
      <button
        v-for="p in pages"
        :key="p"
        class="px-3 py-1.5 rounded-sm-app text-[13px] border transition-all hover:border-border-hover hover:text-text-primary"
        :class="
          p === page
            ? 'bg-accent-dim text-accent-hover border-border-accent'
            : 'bg-bg-tertiary text-text-secondary border-border'
        "
        @click="emit('change', p)"
      >
        {{ p }}
      </button>
      <button
        class="px-3 py-1.5 rounded-sm-app bg-bg-tertiary text-text-secondary border border-border text-[13px] transition-all hover:border-border-hover hover:text-text-primary disabled:opacity-35 disabled:cursor-not-allowed"
        :disabled="!hasNext"
        @click="emit('change', page + 1)"
      >
        Próxima →
      </button>
    </div>
  </div>
</template>
