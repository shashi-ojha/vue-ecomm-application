<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { fetchProducts } from "@/services/productService";
import { useToastStore } from "@/stores/toast";
import ImagePreviewModal from "@/components/ImagePreviewModal.vue";
import CsvImportModal from "@/components/CsvImportModal.vue";
import { exportProductsToCSV } from "@/utils/csvExport";

const toast = useToastStore();
const router = useRouter();

// ✅ UI State
const loading = ref(true);
const products = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const totalPages = ref(1);

// ✅ Filters
const search = ref("");
const selectedBrand = ref("");
const selectedCategory = ref("");

// ✅ Sort dropdown (UI B)
const sortOptions = [
  { label: "Newest", value: "createdAt:desc" },
  { label: "Oldest", value: "createdAt:asc" },
  { label: "Price: Low → High", value: "price:asc" },
  { label: "Price: High → Low", value: "price:desc" },
  { label: "Stock: Low → High", value: "stock:asc" },
  { label: "Stock: High → Low", value: "stock:desc" },
];
const sortBy = ref("createdAt:desc");

// ✅ Pagination limit
const limit = 20;

// ✅ Bulk delete checkboxes
const selectedRows = ref<number[]>([]);
const allSelected = computed(() =>
  selectedRows.value.length === products.value.length
);

// ✅ Image Preview Modal
const previewUrl = ref("");
const previewOpen = ref(false);

// ✅ CSV Import Modal
const csvModal = ref(false);

// ✅ Load Products from API
async function load() {
  loading.value = true;

  try {
    const res = await fetchProducts({
      page: page.value,
      limit,
      sort: sortBy.value,
      search: search.value,
      brand: selectedBrand.value,
      category: selectedCategory.value,
    });

    products.value = res.products;
    total.value = res.total;
    totalPages.value = res.totalPages;
  } catch (err) {
    toast.show("Failed to load products", "error");
  }

  loading.value = false;
}

onMounted(load);

// ✅ Bulk Select / Unselect
function toggleAll() {
  if (allSelected.value) {
    selectedRows.value = [];
  } else {
    selectedRows.value = products.value.map(p => p.id);
  }
}
function toggleRow(id: number) {
  if (selectedRows.value.includes(id)) {
    selectedRows.value = selectedRows.value.filter(x => x !== id);
  } else {
    selectedRows.value.push(id);
  }
}

// ✅ Bulk Delete
async function bulkDelete() {
  if (!selectedRows.value.length) return;

  if (!confirm(`Delete ${selectedRows.value.length} selected products?`)) return;

  for (const id of selectedRows.value) {
    await fetch(`${import.meta.env.VITE_API_URL}/products/${id}`, { method: "DELETE" });
  }

  toast.show("Deleted selected products", "success");
  selectedRows.value = [];
  load();
}

// ✅ CSV Import Handler
async function handleCsvImport(list: any[]) {
  csvModal.value = false;

  try {
    for (const item of list) {
      await fetch(`${import.meta.env.VITE_API_URL}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
    }

    toast.show("CSV Imported successfully!", "success");
    load();
  } catch {
    toast.show("Import failed", "error");
  }
}

// ✅ Delete Single Product
async function deleteProduct(product: any) {
  if (!confirm(`Delete "${product.title}"?`)) return;

  try {
    await fetch(`${import.meta.env.VITE_API_URL}/products/${product.id}`, {
      method: "DELETE",
    });

    toast.show("Product deleted successfully", "success");
    load();
  } catch {
    toast.show("Failed to delete product", "error");
  }
}

</script>

<template>
  <section class="admin-page">

    <!-- ✅ Page Header -->
    <div class="header-row">
      <h1>Products</h1>
      <div class="header-actions">
        <button class="btn ghost" @click="csvModal = true">📥 Import CSV</button>
        <button class="btn ghost" @click="exportProductsToCSV(products)">📤 Export CSV</button>
        <button class="btn primary" @click="router.push('/admin/products/new')">+ Add Product</button>
      </div>
    </div>

    <!-- ✅ Filters -->
    <div class="filters">
      <input v-model="search" class="filter-input" placeholder="Search products..." @input="load()" />

      <select v-model="selectedBrand" class="filter-select" @change="load()">
        <option value="">All Brands</option>
        <option v-for="p in products" :key="p.id" :value="p.brand">{{ p.brand }}</option>
      </select>

      <select v-model="selectedCategory" class="filter-select" @change="load()">
        <option value="">All Categories</option>
        <option v-for="p in products" :key="p.id" :value="p.category">{{ p.category }}</option>
      </select>

      <select v-model="sortBy" class="filter-select" @change="load()">
        <option v-for="s in sortOptions" :value="s.value">{{ s.label }}</option>
      </select>
    </div>

    <!-- ✅ Table -->
    <div class="table-wrapper glass">
      <table class="products-table">

        <thead>
          <tr>
            <th><input type="checkbox" @change="toggleAll" :checked="allSelected"></th>
            <th>Thumbnail</th>
            <th>Title</th>
            <th>Brand</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th style="text-align:center;">Actions</th>
          </tr>
        </thead>

        <tbody v-if="!loading">
          <tr v-for="p in products" :key="p.id">

            <!-- Bulk Checkbox -->
            <td>
              <input type="checkbox" :checked="selectedRows.includes(p.id)" @change="toggleRow(p.id)" />
            </td>

            <!-- Thumbnail -->
            <td>
              <img :src="p.thumbnail" class="thumb" @click="previewUrl = p.thumbnail; previewOpen = true" />
            </td>
            <td>{{ p.title }}</td>
            <td>{{ p.brand }}</td>
            <td>{{ p.category }}</td>
            <td>₹{{ p.price }}</td>

            <td :class="{ low: p.stock < 5 }">{{ p.stock }}</td>

            <td class="actions-cell">
              <button class="icon-btn edit" @click="router.push('/admin/products/edit/' + p.id)">✏️</button>
              <button class="icon-btn del" @click="deleteProduct(p)">🗑</button>
            </td>

          </tr>

          <tr v-if="products.length === 0">
            <td colspan="8" class="empty">No products found.</td>
          </tr>
        </tbody>

        <!-- Loading -->
        <tbody v-if="loading">
          <tr><td colspan="8" class="loading">Loading...</td></tr>
        </tbody>

      </table>
    </div>

    <!-- ✅ Bulk Delete Button -->
    <button v-if="selectedRows.length" class="btn danger bulk-delete" @click="bulkDelete">
      Delete Selected ({{ selectedRows.length }})
    </button>

    <!-- ✅ Pagination -->
    <div class="pagination">
      <button :disabled="page === 1" @click="page--; load()">Prev</button>
      <span>Page {{ page }} of {{ totalPages }}</span>
      <button :disabled="page === totalPages" @click="page++; load()">Next</button>
    </div>

    <!-- ✅ Modals -->
    <ImagePreviewModal :url="previewUrl" :show="previewOpen" @close="previewOpen=false" />
    <CsvImportModal :show="csvModal" @close="csvModal=false" @import="handleCsvImport" />

  </section>
</template>

<style scoped>
/* BASE */
.admin-page {
  padding: 30px;
  background: #0b0f14;
  min-height: 100vh;
  color: #e6edf3;
}

/* HEADER */
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn.primary {
  background: #238636;
  padding: 10px 16px;
  border-radius: 10px;
  color: white;
  cursor: pointer;
}

.btn.ghost {
  background: transparent;
  border: 1px solid #3a3f47;
  padding: 10px 14px;
  border-radius: 10px;
  color: #9da7b1;
}

.btn.danger {
  background: #b91c1c;
  color: white;
  padding: 10px 14px;
  border-radius: 10px;
}

/* FILTERS */
.filters {
  display: flex;
  gap: 12px;
  margin: 16px 0;
}

.filter-input,
.filter-select {
  padding: 10px;
  border-radius: 10px;
  background: #11161d;
  border: 1px solid #30363d;
  color: white;
}

/* TABLE WRAPPER */
.table-wrapper {
  border-radius: 14px;
  overflow: hidden;
}

.glass {
  background: rgba(13,17,23,.6);
  border: 1px solid #30363d;
}

.products-table {
  width: 100%;
  border-collapse: collapse;
}

.products-table th {
  background: rgba(255,255,255,.05);
  padding: 12px;
  border-bottom: 1px solid #30363d;
}

.products-table td {
  padding: 14px;
  border-bottom: 1px solid #21262d;
}

/* THUMB */
.thumb {
  width: 54px;
  height: 54px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid #30363d;
  cursor: zoom-in;
}

/* Title ellipsis */
.title-col {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Stock */
.low {
  color: #ff6b6b;
}

/* ACTION BUTTONS */
.actions-cell {
  text-align: center;
}

.icon-btn {
  padding: 6px 10px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  margin-left: 6px;
}

.icon-btn.edit {
  background: #1f6feb;
  color: white;
}

.icon-btn.del {
  background: #b91c1c;
  color: white;
}

/* BULK DELETE */
.bulk-delete {
  margin-top: 16px;
}

/* PAGINATION */
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 16px;
}

.pagination button {
  padding: 8px 14px;
  border-radius: 8px;
  background: #11161d;
  border: 1px solid #30363d;
  color: white;
}
</style>