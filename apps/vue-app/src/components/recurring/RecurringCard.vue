<script setup lang="ts">
import { formatBRL } from '@/services/export';
import type { RecurringItem } from '@/types';

defineProps<{ item: RecurringItem }>();
</script>

<template>
  <div class="glass rounded-lg-app p-5 flex items-center gap-4 transition-all hover:border-border-hover hover:shadow-glow">
    <div class="w-12 h-12 rounded-md-app bg-accent-dim flex items-center justify-center font-bold text-base text-accent-hover flex-shrink-0">
      {{ item.categoryIcon || item.merchant.charAt(0) }}
    </div>
    <div class="flex-1 min-w-0">
      <div class="font-semibold text-[15px] truncate">{{ item.merchant }}</div>
      <div class="text-[13px] text-text-secondary mt-0.5">
        {{ item.interval }} · {{ item.occurrences }}x · Confiança: {{ item.confidence }}%
      </div>
    </div>
    <div class="font-display font-bold text-[17px] text-danger whitespace-nowrap">
      {{ formatBRL(item.avgAmount) }}
    </div>
  </div>
</template>
