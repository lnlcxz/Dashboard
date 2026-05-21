<script setup lang="ts">
defineProps<{ title?: string; noPadding?: boolean }>();
</script>

<template>
  <div :class="['card', noPadding ? '!p-0' : '']">
    <div v-if="title" class="card-title">{{ title }}</div>
    <slot />
  </div>
</template>
