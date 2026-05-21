import { ref } from 'vue';
import type { ToastMessage, ToastType } from '@/types';

const toasts = ref<ToastMessage[]>([]);
let counter = 0;

export function useToast() {
  function showToast(message: string, type: ToastType = 'info', duration = 4000) {
    const id = ++counter;
    toasts.value.push({ id, message, type });
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id);
    }, duration);
  }

  function removeToast(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  return { toasts, showToast, removeToast };
}
