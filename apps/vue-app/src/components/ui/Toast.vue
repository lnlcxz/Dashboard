<script setup lang="ts">
import { CheckCircle, AlertCircle, Info } from 'lucide-vue-next';
import type { ToastMessage } from '@/types';

const props = defineProps<{ toast: ToastMessage }>();

const iconMap = { success: CheckCircle, error: AlertCircle, info: Info };

const colorMap = {
  success: 'bg-[rgba(16,185,129,0.15)] text-success',
  error: 'bg-[rgba(244,63,94,0.15)] text-danger',
  info: 'bg-[rgba(14,165,233,0.15)] text-info',
};
</script>

<template>
  <div
    class="px-5 py-3.5 rounded-md-app text-sm flex items-center gap-2.5 min-w-[300px] backdrop-blur-[16px] border border-border animate-slide-in"
    :class="colorMap[props.toast.type]"
  >
    <component :is="iconMap[props.toast.type]" class="w-[18px] h-[18px] flex-shrink-0" />
    <span>{{ props.toast.message }}</span>
  </div>
</template>
