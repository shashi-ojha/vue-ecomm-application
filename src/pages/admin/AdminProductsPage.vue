<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { http } from "@/api/http";
import { useToastStore } from "@/stores/toast";
import { useRouter } from "vue-router";

const toast = useToastStore();
const router = useRouter();

// ✅ Data
const products = ref<any[]>([]);
const categories = ref<any[]>([]);
const variants = ref<any[]>([]);
const loading = ref(true);

// ✅ Search
const search = ref("");

// ✅ Modal
const showModal = ref(false);
const isEdit = ref(false);

// ✅ Product Form
const productForm = ref({
  id: "",
  title: "",
  description: "",
  price: 0,
  mrp: 0,
  stock: 0,
  category: "",
  image: "",
  variantSelections: [] as string[],
});

// ✅ Load Data
async function loadData() {
  try {
    const prodRes = await http.get("/api/products");
    const catRes = await http.get("/api/categories");
    const varRes = await http.get("/api/variants");

    products.value = prodRes.data.products || [];
    categories.value = catRes.data.categories || [];
    variants.value = varRes.data.variants || [];

  } catch {
    toast.show("Failed to load data", "error");
  } finally {
    loading.value = false;
  }
}

// ✅ Search Filter
const filteredProducts = computed(() => {
  if (!search.value) return products.value;
  return products.value.filter((p) =>
    p.title.toLowerCase().includes(search.value.toLowerCase())
  );
});

// ✅ Add Product
function openAddModal() {
  isEdit.value = false;
  productForm.value = {
    id: "",
    title: "",
    description: "",
    price: 0,
    mrp: 0,
    stock: 0,
    category: "",
    image: "",
    variantSelections: [],
  };
  showModal.value = true;
}

// ✅ Edit Product
function openEditModal(p: any) {
  isEdit.value = true;
  productForm.value = {
    id: p._id,
    title: p.title,
    description: p.description,
    price: p.price,
    mrp: p.mrp,
    stock: p.stock,
    category: p.category?._id || "",
    image: p.images?.[0] || "",
    variantSelections: p.allowedVariants || [],
  };
  showModal.value = true;
}

// ✅ Save Product
async function saveProduct() {
  try {
    const payload = {
      title: productForm.value.title,
      description: productForm.value.description,
      price: productForm.value.price,
      mrp: productForm.value.mrp,
      stock: productForm.value.stock,
      category: productForm.value.category,
      images: [productForm.value.image],
      allowedVariants: productForm.value.variantSelections,
    };

    if (isEdit.value) {
      const res = await http.patch(`/api/products/${productForm.value.id}`, payload);
      const idx = products.value.findIndex((p) => p._id === productForm.value.id);
      if (idx !== -1) products.value[idx] = res.data.updated;
      toast.show("Product updated!", "success");
    } else {
      const res = await http.post("/api/products", payload);
      products.value.unshift(res.data.product);
      toast.show("Product added!", "success");
    }

    showModal.value = false;

  } catch (err: any) {
    toast.show(err?.response?.data?.message || "Failed to save product", "error");
  }
}

// ✅ Delete Product
async function deleteProduct(id: string) {
  try {
    await http.delete(`/api/products/${id}`);
    products.value = products.value.filter((p) => p._id !== id);
    toast.show("Product deleted", "info");
  } catch {
    toast.show("Failed to delete product", "error");
  }
}

onMounted(loadData);
</script>

<template>
  <section class="admin-products">

    <!-- ✅ Header -->
    <div class="header-row">
      <h1 class="page-title">Product Catalog</h1>
      <button class="btn primary lg" @click="openAddModal">
        + Add Product
      </button>
    </div>

    <!-- ✅ Search bar -->
    <div class="search-bar glass">
      <input v-model="search" class="search-input" placeholder="Search products..." />
    </div>

    <!-- ✅ Product Grid -->
    <div class="product-grid">

      <div
        class="product-card glass"
        v-for="p in filteredProducts"
        :key="p._id"
      >
        <!-- Image -->
        <div class="img-box">
          <img :src="p.images?.[0]" alt="Product" />
        </div>

        <!-- Info -->
        <div class="details">
          <div class="title">{{ p.title }}</div>
          <div class="category">{{ p.category?.name }}</div>

          <div class="price-row">
            <span class="price">₹{{ p.price }}</span>
            <span class="mrp">₹{{ p.mrp }}</span>
          </div>

          <div class="stock">Stock: <strong>{{ p.stock }}</strong></div>

          <!-- Variants -->
          <div class="variants">
            <span
              class="variant-chip"
              v-for="v in p.allowedVariants"
              :key="v"
            >
              {{ v }}
            </span>
          </div>
        </div>

        <!-- Actions -->
        <div class="actions">
          <button class="btn-sm edit" @click="openEditModal(p)">Edit</button>
          <button class="btn-sm delete" @click="deleteProduct(p._id)">Delete</button>
          <button class="btn-sm outline" @click="router.push('/admin/skus?product=' + p._id)">SKUs</button>
        </div>
      </div>

    </div>

    <!-- ✅ Modal -->
    <div v-if="showModal" class="modal-backdrop">
      <div class="modal glass animate">

        <h2 class="modal-title">{{ isEdit ? "Edit Product" : "Add Product" }}</h2>

        <div class="modal-form">
          
          <div class="field full">
            <label>Title</label>
            <input v-model="productForm.title" />
          </div>

          <div class="field full">
            <label>Description</label>
            <textarea v-model="productForm.description" rows="4"></textarea>
          </div>

          <div class="field">
            <label>Price</label>
            <input type="number" v-model="productForm.price" />
          </div>

          <div class="field">
            <label>MRP</label>
            <input type="number" v-model="productForm.mrp" />
          </div>

          <div class="field">
            <label>Stock</label>
            <input type="number" v-model="productForm.stock" />
          </div>

          <div class="field">
            <label>Category</label>
            <select v-model="productForm.category">
              <option disabled value="">Select category</option>
              <option v-for="c in categories" :value="c._id" :key="c._id">{{ c.name }}</option>
            </select>
          </div>

          <!-- Image URL -->
          <div class="field full">
            <label>Product Image URL</label>
            <input v-model="productForm.image" placeholder="https://..." />
          </div>

          <!-- Preview -->
          <div v-if="productForm.image" class="img-preview">
            <img :src="productForm.image" alt="Preview" />
          </div>

          <!-- Variants -->
          <div class="field full">
            <label>Allowed Variants</label>
            <div class="variant-options">
              <label class="v-item" v-for="v in variants" :key="v._id">
                <input
                  type="checkbox"
                  :value="v.name"
                  v-model="productForm.variantSelections"
                />
                <span>{{ v.name }}</span>
              </label>
            </div>
          </div>

        </div>

        <!-- Actions -->
        <div class="modal-actions">
          <button class="btn primary" @click="saveProduct">Save</button>
          <button class="btn cancel" @click="showModal = false">Cancel</button>
        </div>

      </div>
    </div>

  </section>
</template>

<style scoped>
.admin-products {
  padding: 30px 26px;
  min-height: 100vh;
  background: #0b0f14;
  color: #e6edf3;
  font-family: "Inter", sans-serif;
}

/* Header */
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 26px;
}

.page-title {
  font-size: 2rem;
  font-weight: 800;
}

/* Search */
.search-bar {
  padding: 14px;
  border-radius: 14px;
  margin-bottom: 24px;
}

.search-input {
  width: 100%;
  padding: 12px;
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 10px;
  color: #e6edf3;
}

/* Product Grid */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px,1fr));
  gap: 20px;
}

/* Card */
.product-card {
  padding: 16px;
  border-radius: 16px;
  background: rgba(13,17,23,.55);
  border: 1px solid #30363d;
  box-shadow: 0 10px 30px rgba(0,0,0,.35);
  display: flex;
  flex-direction: column;
  transition: .2s;
}

.product-card:hover {
  transform: translateY(-4px);
  border-color: #238636;
}

/* Image */
.img-box img {
  width: 100%;
  height: 170px;
  object-fit: contain;
  background: #11161d;
  padding: 10px;
  border-radius: 12px;
}

/* Details */
.details {
  margin-top: 12px;
}

.details .title {
  font-size: 1.1rem;
  font-weight: 700;
}

.category {
  opacity: .75;
  font-size: .9rem;
  margin-top: 2px;
}

.price-row {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.price {
  color: #23c55e;
  font-weight: 700;
}

.mrp {
  opacity: .5;
  text-decoration: line-through;
}

.stock {
  margin-top: 6px;
  opacity: .9;
}

/* Variants */
.variants {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.variant-chip {
  padding: 4px 8px;
  border-radius: 8px;
  border: 1px solid #30363d;
  background: rgba(255,255,255,.08);
  font-size: .85rem;
}

/* Card Actions */
.actions {
  display: flex;
  gap: 10px;
  margin-top: auto;
}

.btn-sm {
  padding: 7px 12px;
  border-radius: 8px;
  border: none;
  font-size: .85rem;
  cursor: pointer;
}

.btn-sm.edit { background: #238636; color: white; }
.btn-sm.delete { background: #b91c1c; color: white; }
.btn-sm.outline {
  background: transparent;
  border: 1px solid #4a5568;
  color: #cbd5e0;
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  backdrop-filter: blur(8px);
  background: rgba(0,0,0,.6);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  width: min(560px, 95vw);
  padding: 26px;
  border-radius: 18px;
  background: rgba(13,17,23,.85);
  border: 1px solid #30363d;
  animation: pop .25s ease;
}

@keyframes pop {
  from { transform: scale(.85); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.modal-title {
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 14px;
}

/* Form */
.modal-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.full {
  grid-column: span 2;
}

.field label {
  opacity: .75;
  font-size: .85rem;
  margin-bottom: 4px;
}

.field input,
.field textarea,
.field select {
  width: 100%;
  padding: 12px;
  background: #0b0f14;
  border: 1px solid #30363d;
  border-radius: 10px;
  color: #e6edf3;
  font-size: .9rem;
}

/* Image Preview */
.img-preview img {
  margin-top: 8px;
  width: 100%;
  height: 140px;
  object-fit: contain;
  background: #1a1f25;
  border-radius: 10px;
  padding: 6px;
  border: 1px solid #30363d;
}

/* Variants */
.variant-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.v-item {
  background: rgba(255,255,255,.08);
  padding: 7px 10px;
  border-radius: 8px;
  border: 1px solid #30363d;
  cursor: pointer;
  display: flex;
  gap: 6px;
}

.modal-actions {
  margin-top: 18px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn.primary {
  background: #238636;
  padding: 10px 18px;
  border-radius: 10px;
  color: white;
  font-weight: 700;
}

.btn.cancel {
  background: #444;
  padding: 10px 18px;
  border-radius: 10px;
  color: white;
}
</style>