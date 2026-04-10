<script setup lang="ts">
const props = defineProps({ url: String, show: Boolean });
const emit = defineEmits(["close"]);
</script>

<template>
  <div v-if="show" class="modal-backdrop" @click="emit('close')">
    <div class="modal" @click.stop>
      url
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.6);
  display: grid;
  place-items: center;
  z-index: 9999;
}

.modal {
  background: #0b0f14;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid #30363d;
}
.modal img {
  max-width: 90vw;
  max-height: 90vh;
  border-radius: 10px;
}
</style>