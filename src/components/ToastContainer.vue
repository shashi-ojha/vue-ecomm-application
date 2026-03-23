<script setup lang="ts">
import { useToastStore } from "@/stores/toast";
const toast = useToastStore();
</script>

<template>
  <div class="toast-container">
    <div
      v-for="t in toast.toasts"
      :key="t.id"
      :class="['toast', t.type]"
    >
      {{ t.message }}
    </div>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toast {
  padding: 10px 16px;
  border-radius: 6px;
  color: #fff;
  animation: slide-in 0.2s ease-out;
}

.success { background: #22c55e; }
.error   { background: #ef4444; }
.info    { background: #3b82f6; }

@keyframes slide-in {
  from { transform: translateY(10px); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
}
</style>
``