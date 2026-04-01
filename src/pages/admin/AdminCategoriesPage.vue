<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { http } from "@/api/http";
import { useToastStore } from "@/stores/toast";

const toast = useToastStore();

// ✅ Category list
const categories = ref<any[]>([]);
const loading = ref(true);

// ✅ Search
const search = ref("");

// ✅ Modal system
const showModal = ref(false);
const isEdit = ref(false);

// ✅ Delete modal
const showDeleteModal = ref(false);
const deleteId = ref("");

// ✅ Category form
const categoryForm = ref({
  id: "",
  name: "",
  slug: "",
  parent: "",
  image: ""
});

// ✅ Auto-generate slug
function makeSlug(name: string) {
  return name.toLowerCase().trim().replace(/\s+/g, "-");
}

// ✅ Load categories from backend
async function loadCategories() {
  try {
    const { data } = await http.get("/api/categories");
    categories.value = data.categories || [];
  } catch (err) {
    console.error(err);
    toast.show("Failed to load categories", "error");
  } finally {
    loading.value = false;
  }
}

// ✅ Open Add Category Modal
function openAddModal() {
  isEdit.value = false;
  categoryForm.value = {
    id: "",
    name: "",
    slug: "",
    parent: "",
    image: ""
  };
  showModal.value = true;
}

// ✅ Open Edit Category Modal
function openEditModal(cat: any) {
  isEdit.value = true;
  categoryForm.value = {
    id: cat._id,
    name: cat.name,
    slug: cat.slug,
    parent: cat.parent || "",
    image: cat.image || ""
  };
  showModal.value = true;
}

// ✅ Save Category (create or update)
async function saveCategory() {
  try {
    categoryForm.value.slug = makeSlug(categoryForm.value.name);

    if (isEdit.value) {
      const { data } = await http.patch(
        `/api/categories/${categoryForm.value.id}`,
        categoryForm.value
      );

      const index = categories.value.findIndex(
        (c) => c._id === categoryForm.value.id
      );
      if (index !== -1) categories.value[index] = data.category;

      toast.show("Category updated!", "success");
    } else {
      const { data } = await http.post("/api/categories", categoryForm.value);
      categories.value.unshift(data.category);
      toast.show("Category added!", "success");
    }

    showModal.value = false;
  } catch (err) {
    toast.show("Failed to save category", "error");
  }
}

// ✅ Open Delete Modal
function openDeleteModal(id: string) {
  deleteId.value = id;
  showDeleteModal.value = true;
}

// ✅ Delete Category
async function deleteCategory() {
  try {
    await http.delete(`/api/categories/${deleteId.value}`);
    categories.value = categories.value.filter((c) => c._id !== deleteId.value);
    toast.show("Category deleted", "info");
    showDeleteModal.value = false;
  } catch {
    toast.show("Failed to delete category", "error");
  }
}

// ✅ Search filter
const filteredCategories = computed(() => {
  if (!search.value) return categories.value;
  return categories.value.filter((c) =>
    c.name.toLowerCase().includes(search.value.toLowerCase())
  );
});

onMounted(loadCategories);
</script>

<template>
  <section class="admin-category-page">

    <!-- ✅ HEADER -->
    <div class="page-header">
      <h1>Categories</h1>
      <button class="btn primary big" @click="openAddModal">+ Add Category</button>
    </div>

    <!-- ✅ Search -->
    <div class="top-bar glass">
      <input 
        v-model="search"
        placeholder="Search categories…"
        class="search-box"
      />
    </div>

    <!-- ✅ Category Grid -->
    <div class="category-grid">
      <div 
        class="category-card glass"
        v-for="c in filteredCategories"
        :key="c._id"
      >

        <div class="cat-info">
          <h3 class="cat-name">{{ c.name }}</h3>
          <p class="cat-slug">/{{ c.slug }}</p>

          <p v-if="c.parent" class="cat-parent">
            Parent: <span>{{ c.parent?.name }}</span>
          </p>
        </div>

        <div class="actions">
          <button class="btn-sm edit" @click="openEditModal(c)">Edit</button>
          <button class="btn-sm del" @click="openDeleteModal(c._id)">Delete</button>
        </div>

      </div>
    </div>

    <!-- ✅ Add/Edit Modal -->
    <div v-if="showModal" class="modal-backdrop">
      <div class="modal glass">
        
        <h2>{{ isEdit ? "Edit Category" : "Add Category" }}</h2>

        <div class="modal-grid">
          <div class="field full">
            <label>Name</label>
            <input 
              v-model="categoryForm.name"
              @input="categoryForm.slug = makeSlug(categoryForm.name)"
            />
          </div>

          <div class="field full">
            <label>Slug</label>
            <input v-model="categoryForm.slug" disabled />
          </div>

          <div class="field full">
            <label>Parent Category</label>
            <select v-model="categoryForm.parent">
              <option value="">None</option>
              <option 
                v-for="c in categories"
                :key="c._id"
                :value="c._id"
              >
                {{ c.name }}
              </option>
            </select>
          </div>
          <div class="field full">
            <label>Category Image URL</label>
            <input v-model="categoryForm.image" placeholder="https://image-url" />
          </div>
          
        </div>

        <div class="modal-actions">
          <button class="btn primary" @click="saveCategory">Save</button>
          <button class="btn ghost" @click="showModal=false">Cancel</button>
        </div>

      </div>
    </div>

    <!-- ✅ Delete Modal -->
    <div v-if="showDeleteModal" class="modal-backdrop">
      <div class="modal glass small">
        <h2>Delete Category?</h2>
        <p class="confirm-text">This action cannot be undone.</p>

        <div class="modal-actions">
          <button class="btn ghost" @click="showDeleteModal=false">Cancel</button>
          <button class="btn danger" @click="deleteCategory">Delete</button>
        </div>

      </div>
    </div>

  </section>
</template>

<style scoped>
.admin-category-page {
  padding: 32px 26px;
  background: #0b0f14;
  min-height: 100vh;
  color: #e6edf3;
  font-family: "Inter", sans-serif;
}

/* HEADER */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.page-header h1 {
  font-size: 2rem;
  font-weight: 800;
}
.btn.primary.big {
  padding: 10px 18px;
  background: #238636;
  border-radius: 10px;
  font-weight: 700;
  color: white;
  border: none;
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
  background: #0f141a;
  border: 1px solid #30363d;
  border-radius: 10px;
  color: #e6edf3;
  transition: .2s;
}
.search-box:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59,130,246,.35);
}

/* GRID */
.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px,1fr));
  gap: 18px;
}

/* CATEGORY CARD */
.category-card {
  padding: 16px;
  border-radius: 14px;
  background: rgba(13,17,23,.55);
  border: 1px solid #30363d;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: .2s ease;
  box-shadow: 0 8px 25px rgba(0,0,0,0.35);
}
.category-card:hover {
  border-color: #238636;
  transform: translateY(-3px);
}

.cat-name {
  font-size: 1.2rem;
  font-weight: 700;
}
.cat-slug {
  opacity: .7;
  margin-top: 4px;
}
.cat-parent {
  margin-top: 8px;
  font-size: .9rem;
  opacity: .8;
}
.cat-parent span {
  color: #3b82f6;
  font-weight: 600;
}

/* ACTIONS */
.actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}
.btn-sm {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: .85rem;
  cursor: pointer;
  border: none;
}
.btn-sm.edit {
  background: #238636;
  color: white;
}
.btn-sm.del {
  background: #b91c1c;
  color: white;
}

/* MODALS */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.55);
  display: grid;
  place-items: center;
  z-index: 9999;
  backdrop-filter: blur(6px);
}

.modal {
  width: min(500px, 95vw);
  padding: 24px;
  border-radius: 16px;
  background: rgba(13,17,23,.85);
  border: 1px solid #30363d;
  animation: fadeIn .25s ease;
}

.modal.small { width: min(380px,95vw); }

.modal-grid {
  margin-top: 12px;
  display: grid;
  gap: 14px;
  grid-template-columns: 1fr;
}

.field label {
  font-size: .85rem;
  opacity: .75;
  margin-bottom: 4px;
}
.field input,
.field select,
.field textarea {
  width: 100%;
  padding: 12px;
  background: #0b0f14;
  border-radius: 10px;
  border: 1px solid #30363d;
  color: #e6edf3;
}

textarea { height: 80px; }

.modal-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn.primary {
  background: #238636;
  padding: 10px 16px;
  border-radius: 10px;
  color: white;
  font-weight: 700;
  border: none;
}

.btn.ghost {
  border: 1px solid #4a5568;
  padding: 10px 16px;
  background: transparent;
  color: #d1d5db;
  border-radius: 10px;
}

.btn.danger {
  background: #b91c1c;
  border: none;
  padding: 10px 16px;
  border-radius: 10px;
  color: white;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>