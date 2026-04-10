<script setup lang="ts">
import Papa from "papaparse";
import { ref } from "vue";

const props = defineProps({ show: Boolean });
const emit = defineEmits(["close", "import"]);

const file = ref<File | null>(null);

function handleImport() {
  if (!file.value) return;
  Papa.parse(file.value, {
    header: true,
    complete: (result: Papa.ParseResult<any>) => {
      emit("import", result.data);
    },
  });
}
</script>

<template>
  <div v-if="show" class="modal-backdrop">
    <div class="modal">
      <h2>Import Products CSV</h2>

      <input type="file" accept=".csv"
             @change="(e: Event) => file = (e.target as HTMLInputElement).files?.[0] || null" />

      <button class="btn" @click="handleImport">Import</button>
      <button class="btn ghost" @click="emit('close')">Cancel</button>
    </div>
  </div>
</template>