<script setup lang="ts">
import { ref, onMounted } from "vue";
import { http } from "@/api/http";
import { useToastStore } from "@/stores/toast";

const toast = useToastStore();

// ✅ Variants Data
const variants = ref<any[]>([]);
const loading = ref(true);

// ✅ Search
const search = ref("");

// ✅ Add/Edit Modal
const showModal = ref(false);
const isEdit = ref(false);

// ✅ Delete Modal
const showDeleteModal = ref(false);
const deleteId = ref("");

// ✅ Variant Form
const variantForm = ref({
  id: "",
  name: "",
  values: [] as string[],
});

// ✅ Add new value temp input
const newValue = ref("");

// ✅ Load Variants from API
async function loadVariants() {
  try {
    const { data } = await http.get("/api/variants");
    variants.value = data.variants || [];
  } catch {
    toast.show("Failed to load variants", "error");
  } finally {
    loading.value = false;
  }
}

// ✅ Open Add Modal
function openAddModal() {
  isEdit.value = false;
  variantForm.value = {
    id: "",
    name: "",
    values: []
  };
  newValue.value = "";
  showModal.value = true;
}

// ✅ Open Edit Modal
function openEditModal(v: any) {
  isEdit.value = true;
  variantForm.value = {
    id: v._id,
    name: v.name,
    values: [...v.values]
  };
  newValue.value = "";
  showModal.value = true;
}

// ✅ Add Value to Variant
function addValue() {
  if (!newValue.value.trim()) return;
  variantForm.value.values.push(newValue.value.trim());
  newValue.value = "";
}

// ✅ Remove single variant value
function removeValue(i: number) {
  variantForm.value.values.splice(i, 1);
}

// ✅ Save Variant (Real API)
async function saveVariant() {
  try {
    if (isEdit.value) {
      const { data } = await http.patch(
        `/api/variants/${variantForm.value.id}`,
        variantForm.value
      );

      const index = variants.value.findIndex(v => v._id === variantForm.value.id);
      if (index !== -1) variants.value[index] = data.variant;

      toast.show("Variant updated!", "success");
    } else {
      const { data } = await http.post("/api/variants", variantForm.value);
      variants.value.unshift(data.variant);
      toast.show("Variant added!", "success");
    }

    showModal.value = false;

  } catch {
    toast.show("Failed to save variant", "error");
  }
}

// ✅ Delete Variant
function openDeleteModal(id: string) {
  deleteId.value = id;
  showDeleteModal.value = true;
}

async function deleteVariant() {
  try {
    await http.delete(`/api/variants/${deleteId.value}`);
    variants.value = variants.value.filter(v => v._id !== deleteId.value);
    showDeleteModal.value = false;
    toast.show("Variant deleted", "info");
  } catch {
    toast.show("Delete failed", "error");
  }
}

onMounted(loadVariants);
</script>

<template>
  <section class="variants-page">

    <!-- ✅ HEADER -->
    <div class="page-header">
      <h1>Variant Manager</h1>
      <button class="btn primary big" @click="openAddModal">+ Add Variant</button>
    </div>

    <!-- ✅ SEARCH BAR -->
    <div class="top-bar glass">
      <input 
        v-model="search"
        placeholder="Search variants…"
        class="search-box"
      />
    </div>

    <!-- ✅ VARIANT LIST GRID -->
    <div class="variant-grid">

      <div 
        v-for="v in variants.filter(x => x.name.toLowerCase().includes(search.toLowerCase()))"
        :key="v._id"
        class="variant-card glass"
      >
        
        <div class="v-header">
          <h3>{{ v.name }}</h3>
          <span class="qty">{{ v.values.length }} values</span>
        </div>

        <div class="values-container">
          <span class="chip" v-for="(val, i) in v.values" :key="i">{{ val }}</span>
        </div>

        <div class="actions">
          <button class="btn-sm edit" @click="openEditModal(v)">Edit</button>
          <button class="btn-sm del" @click="openDeleteModal(v._id)">Delete</button>
        </div>

      </div>

    </div>

    <!-- ✅ ADD/EDIT MODAL -->
    <div v-if="showModal" class="modal-backdrop">
      <div class="modal glass">

        <h2>{{ isEdit ? "Edit Variant" : "Add Variant" }}</h2>

        <div class="modal-grid">

          <div class="field full">
            <label>Variant Name</label>
            <input v-model="variantForm.name" placeholder="e.g. Color, Size, Material" />
          </div>

          <!-- Add new value -->
          <div class="field full value-add">
            <input v-model="newValue" placeholder="Add variant value" @keyup.enter="addValue" />
            <button class="btn-sm add-btn" @click="addValue">+</button>
          </div>

          <!-- Values List -->
          <div class="values-box full">
            <div 
              class="value-item" 
              v-for="(val, index) in variantForm.values"
              :key="index"
            >
              <span>{{ val }}</span>
              <button class="remove" @click="removeValue(index)">×</button>
            </div>
          </div>

        </div>

        <div class="modal-actions">
          <button class="btn primary" @click="saveVariant">Save</button>
          <button class="btn ghost" @click="showModal=false">Cancel</button>
        </div>

      </div>
    </div>

    <!-- ✅ DELETE MODAL -->
    <div v-if="showDeleteModal" class="modal-backdrop">
      <div class="modal glass small">
        <h2>Delete Variant?</h2>
        <p class="confirm-text">This cannot be undone.</p>

        <div class="modal-actions">
          <button class="btn ghost" @click="showDeleteModal=false">Cancel</button>
          <button class="btn danger" @click="deleteVariant">Delete</button>
        </div>
      </div>
    </div>

  </section>
</template>

<style scoped>
.variants-page {
  padding: 32px 26px;
  min-height: 100vh;
  background: #0b0f14;
  color: #e6edf3;
  font-family: "Inter", sans-serif;
}

/* HEADER */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 26px;
}
.page-header h1 {
  font-size: 2rem;
  font-weight: 800;
}
.btn.primary.big {
  padding: 10px 18px;
  background: #238636;
  color: white;
  border-radius: 10px;
  border: none;
  font-weight: 700;
}

/* SEARCH */
.top-bar {
  padding: 14px;
  border-radius: 14px;
  margin-bottom: 24px;
}
.search-box {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  background: #0d1117;
  border: 1px solid #30363d;
  color: #e6edf3;
}

/* GRID */
.variant-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px,1fr));
  gap: 20px;
}

.variant-card {
  border-radius: 14px;
  padding: 16px;
  border: 1px solid #30363d;
  background: rgba(13,17,23,.55);
  transition: .2s;
}
.variant-card:hover {
  border-color: #238636;
  transform: translateY(-3px);
}

/* CARD */
.v-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.v-header h3 {
  font-size: 1.2rem;
  font-weight: 700;
}
.qty {
  opacity: .7;
  font-size: .85rem;
}

.values-container {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.chip {
  background: rgba(255,255,255,.08);
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid #30363d;
  font-size: .85rem;
}

/* ACTIONS */
.actions {
  margin-top: 14px;
  display: flex;
  gap: 10px;
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.6);
  display: grid;
  place-items: center;
  backdrop-filter: blur(6px);
  z-index: 999;
}

.modal {
  width: min(520px, 92vw);
  padding: 24px;
  border-radius: 16px;
  background: rgba(13,17,23,.85);
  border: 1px solid #30363d;
  animation: fadeIn .25s ease-out;
}

.modal-grid {
  margin-top: 10px;
  display: grid;
  gap: 14px;
  grid-template-columns: 1fr;
}

.field input {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  background: #0b0f14;
  border: 1px solid #30363d;
  color: #e6edf3;
}

.value-add {
  display: flex;
  gap: 8px;
}
.add-btn {
  background: #238636;
  border: none;
  padding: 0 14px;
  border-radius: 10px;
  font-size: 1.3rem;
  color: white;
  cursor: pointer;
}

.values-box {
  background: rgba(255,255,255,0.04);
  padding: 10px;
  border-radius: 10px;
  min-height: 80px;
  border: 1px solid #30363d;
}

.value-item {
  background: rgba(255,255,255,.08);
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid #30363d;
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.value-item .remove {
  background: transparent;
  border: none;
  color: #ff7272;
  font-size: 1rem;
  cursor: pointer;
}

/* Modal Footer */
.modal-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* Buttons */
.btn.primary {
  background: #238636;
  padding: 10px 16px;
  border-radius: 10px;
  color: white;
  border: none;
}
.btn.ghost {
  border: 1px solid #4a5568;
  padding: 10px 16px;
  border-radius: 10px;
  background: transparent;
  color: #e6edf3;
}
.btn.danger {
  background: #b91c1c;
  padding: 10px 16px;
  border-radius: 10px;
  color: white;
}

/* Animation */
@keyframes fadeIn {
  from { opacity:0; transform:translateY(10px); }
  to { opacity:1; transform:translateY(0); }
}
</style>
