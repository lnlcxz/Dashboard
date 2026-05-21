<script setup lang="ts">
import { ref } from 'vue';
import { UploadCloud } from 'lucide-vue-next';

const emit = defineEmits<{ (e: 'file', file: File): void }>();

const isDragOver = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);

function onDrop(e: DragEvent) {
  e.preventDefault();
  isDragOver.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) emit('file', file);
}

function onChange() {
  const file = inputRef.value?.files?.[0];
  if (file) emit('file', file);
  if (inputRef.value) inputRef.value.value = '';
}
</script>

<template>
  <div
    class="border-2 border-dashed border-border-hover rounded-xl-app py-14 px-10 text-center cursor-pointer transition-all relative overflow-hidden bg-gradient-subtle hover:border-accent hover:bg-[rgba(99,102,241,0.06)] hover:shadow-[0_0_40px_rgba(99,102,241,0.08)]"
    :class="isDragOver ? '!border-accent bg-[rgba(99,102,241,0.06)] scale-[1.01]' : ''"
    @click="inputRef?.click()"
    @dragover.prevent="isDragOver = true"
    @dragleave="isDragOver = false"
    @drop="onDrop"
  >
    <input ref="inputRef" type="file" accept=".csv,.txt" class="hidden" @change="onChange" />
    <div class="mx-auto mb-4">
      <UploadCloud class="w-[52px] h-[52px] text-accent mx-auto" />
    </div>
    <div class="text-lg font-semibold mb-2">Arraste seu arquivo CSV aqui</div>
    <div class="text-sm text-text-secondary mb-5">ou clique para selecionar</div>
    <div class="text-xs text-text-tertiary">
      Formatos aceitos: .csv, .txt · Separadores: vírgula, ponto-e-vírgula, tab
    </div>
  </div>
</template>
