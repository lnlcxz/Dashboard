<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RouterView } from 'vue-router';
import Sidebar from './Sidebar.vue';
import { Menu } from 'lucide-vue-next';
import { useFinanceStore } from '@/stores/finance';

const sidebarOpen = ref(false);
const store = useFinanceStore();

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
}

function closeSidebar() {
  sidebarOpen.value = false;
}

onMounted(() => {
  store.loadData();
});
</script>

<template>
  <div class="flex min-h-screen">
    <button
      class="md:hidden fixed top-4 left-4 z-[200] w-11 h-11 rounded-md-app bg-bg-tertiary border border-border flex items-center justify-center text-text-primary"
      @click="toggleSidebar"
      aria-label="Abrir menu"
    >
      <Menu class="w-5 h-5" />
    </button>

    <div
      v-if="sidebarOpen"
      class="md:hidden fixed inset-0 bg-black/60 z-[90]"
      @click="closeSidebar"
    />

    <Sidebar :open="sidebarOpen" @navigate="closeSidebar" />

    <main class="flex-1 md:ml-[260px] min-h-screen flex flex-col">
      <RouterView v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
    </main>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.fade-leave-to {
  opacity: 0;
}
</style>
