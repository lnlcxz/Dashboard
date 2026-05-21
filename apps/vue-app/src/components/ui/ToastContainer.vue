<script setup lang="ts">
import { useToast } from '@/composables/useToast';
import Toast from './Toast.vue';

const { toasts } = useToast();
</script>

<template>
  <div class="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5">
    <Toast v-for="t in toasts" :key="t.id" :toast="t" />
  </div>
</template>
