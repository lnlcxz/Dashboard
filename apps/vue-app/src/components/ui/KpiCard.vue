<script setup lang="ts">
import type { Component } from 'vue';

defineProps<{
  label: string;
  value: string;
  sub: string;
  variant: 'balance' | 'income' | 'expense' | 'savings';
  icon: Component;
  valueClass?: string;
}>();

const accentColors = {
  income: 'before:bg-success',
  expense: 'before:bg-danger',
  balance: 'before:bg-gradient-brand',
  savings: 'before:bg-info',
};

const iconColors = {
  income: 'bg-success-dim text-success',
  expense: 'bg-danger-dim text-danger',
  balance: 'bg-accent-dim text-accent-hover',
  savings: 'bg-info-dim text-info',
};
</script>

<template>
  <div
    class="glass rounded-lg-app p-6 relative overflow-hidden transition-all hover:-translate-y-0.5 hover:border-border-hover hover:shadow-glow before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] before:rounded-t-lg-app before:opacity-0 hover:before:opacity-100 before:transition-opacity"
    :class="accentColors[variant]"
  >
    <div class="text-[13px] font-medium text-text-secondary mb-2 flex items-center gap-2">
      <component :is="icon" class="w-4 h-4" />
      <span>{{ label }}</span>
    </div>
    <div class="font-display text-[28px] font-bold leading-tight" :class="valueClass">{{ value }}</div>
    <div class="text-xs text-text-tertiary mt-1.5">{{ sub }}</div>

    <div
      class="absolute top-5 right-5 w-11 h-11 rounded-md-app flex items-center justify-center"
      :class="iconColors[variant]"
    >
      <component :is="icon" class="w-[22px] h-[22px]" />
    </div>
  </div>
</template>
