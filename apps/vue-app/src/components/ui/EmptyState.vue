<script setup lang="ts">
import type { Component } from 'vue';

defineProps<{ icon?: Component; title: string; description?: string }>();
</script>

<template>
  <div class="text-center py-16 px-5 text-text-secondary">
    <component v-if="icon" :is="icon" class="w-16 h-16 text-text-tertiary mx-auto mb-5 opacity-50" />
    <h3 class="text-lg font-semibold text-text-primary mb-2">{{ title }}</h3>
    <p v-if="description" class="text-sm max-w-md mx-auto">{{ description }}</p>
  </div>
</template>
