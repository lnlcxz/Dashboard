<script setup lang="ts">
defineProps<{ title: string }>();
</script>

<template>
  <div class="sticky top-0 z-50 px-8 py-4 h-[72px] bg-[rgba(8,11,20,0.85)] backdrop-blur-[16px] border-b border-border flex items-center justify-between md:pl-8 pl-[68px]">
    <h1 class="font-display text-2xl font-semibold">{{ title }}</h1>
    <div class="flex gap-2.5 items-center">
      <slot name="actions" />
    </div>
  </div>
</template>
