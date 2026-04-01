<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { http } from "@/api/http";
import { useToastStore } from "@/stores/toast";
import { useRoute } from "vue-router";

const toast = useToastStore();
const route = useRoute();

// ✅ Selected product from route (e.g. /admin/skus?product=123)
const productId = ref(route.query.product ?? "");

// ✅ API data
const products = ref<any[]>([]);
const product = ref<any>(null);
const variants = ref<any[]>([]);
const skus = ref<any[]>([]);
const loading = ref(true);

// ✅ Modals
const showModal = ref(false);
const isEdit = ref(false);
const showDeleteModal = ref(false);
const deleteId = ref("");

// ✅ SKU form
const skuForm = ref({
  id: "",
  image: "",
  skuCode: "",
  price: 0,
  mrp: 0,
  stock: 0,
  attributes: [] as { variant: string; value: string }[],
});

// ✅ Variant selection for combination generation
const selectedValues = ref<Record<string, string[]>>({});

// ✅ Load products list + variants + SKUs
async function loadData() {
  try {
    const pRes = await http.get("/api/products");
    const vRes = await http.get("/api/variants");

    products.value = pRes.data.products;
    variants.value = vRes.data.variants;

    // initialize variant selection map
    variants.value.forEach((v: any) => {
      selectedValues.value[v.name] = [];
    });

    if (productId.value) {
      const prod = await http.get(`/api/products/${productId.value}`);
      product.value = prod.data.product;

      const sRes = await http.get(`/api/skus?product=${productId.value}`);
      skus.value = sRes.data.skus || [];
    }

  } catch (err) {
    console.log(err);
    toast.show("Failed to load data", "error");
  } finally {
    loading.value = false;
  }
}

function onProductChange() {
  loadData();
}

// ✅ Add SKU manually
function openAddModal() {
  isEdit.value = false;
  skuForm.value = {
    id: "",
    image: "",
    skuCode: "",
    price: 0,
    mrp: 0,
    stock: 0,
    attributes: [],
  };
  showModal.value = true;
}

// ✅ Edit SKU
function openEditModal(sku: any) {
  isEdit.value = true;
  skuForm.value = {
    id: sku._id,
    image: sku.image,
    skuCode: sku.skuCode,
    price: sku.price,
    mrp: sku.mrp,
    stock: sku.stock,
    attributes: [...sku.attributes],
  };
  showModal.value = true;
}

// ✅ Save SKU (create or update)
async function saveSku() {
  try {
    if (isEdit.value) {
      const res = await http.patch(`/api/skus/${skuForm.value.id}`, {
        ...skuForm.value,
        product: productId.value,
      });

      const idx = skus.value.findIndex((s) => s._id === skuForm.value.id);
      if (idx !== -1) skus.value[idx] = res.data.sku;

      toast.show("SKU updated!", "success");
    } else {
      const res = await http.post("/api/skus", {
        ...skuForm.value,
        product: productId.value,
      });
      skus.value.push(res.data.sku);
      toast.show("SKU created!", "success");
    }
    showModal.value = false;
  } catch (err) {
    toast.show("Failed to save SKU", "error");
  }
}

// ✅ Delete SKU
function openDeleteModal(id: string) {
  deleteId.value = id;
  showDeleteModal.value = true;
}

async function deleteSku() {
  try {
    await http.delete(`/api/skus/${deleteId.value}`);
    skus.value = skus.value.filter((s) => s._id !== deleteId.value);
    toast.show("SKU deleted", "info");
    showDeleteModal.value = false;
  } catch (err) {
    toast.show("Failed to delete SKU", "error");
  }
}

// ✅ Generate combinations (Option A endpoint)
async function generateSKUs() {
  try {
    const payload = {
      productId: productId.value,
      selectedVariants: selectedValues.value,
    };

    const res = await http.post("/api/skus/generate", payload);

    skus.value.push(...res.data.skus);
    toast.show(`Generated ${res.data.total} SKUs`, "success");

  } catch (err) {
    console.log(err);
    toast.show("Failed to generate SKUs", "error");
  }
}

onMounted(loadData);
</script>

<template>
  <section class="sku-page">

    <!-- ✅ Page Header -->
    <div class="page-header">
      <h1>SKU Manager</h1>

      <select v-model="productId" class="product-select" @change="onProductChange">
        <option disabled value="">Select Product</option>
        <option v-for="p in products" :value="p._id" :key="p._id">
          {{ p.title }}
        </option>
      </select>
    </div>

    <!-- ✅ Product Summary -->
    <div v-if="product" class="product-summary glass">
      product.images?.[0]
      <div>
        <h2>{{ product.title }}</h2>
        <p class="category">{{ product.category?.name }}</p>
      </div>
    </div>

    <!-- ✅ Combination Generator -->
    <div class="variant-section glass">
      <h2>Generate SKU Combinations</h2>

      <div class="variant-grid">
        <div class="variant-card" v-for="v in variants" :key="v._id">
          <h3>{{ v.name }}</h3>

          <div class="chip-group">
            <label class="chip" v-for="val in v.values" :key="val">
              <input type="checkbox" :value="val" v-model="selectedValues[v.name]" />
              {{ val }}
            </label>
          </div>
        </div>
      </div>

      <button class="btn primary big" @click="generateSKUs">
        Generate SKUs
      </button>
    </div>

    <!-- ✅ SKU Grid -->
    <div class="sku-grid">
      <div class="sku-card glass" v-for="sku in skus" :key="sku._id">

        <!-- Image -->
        <div class="sku-img-box">
          <img v-if="sku.image" :src="sku.image" class="placeholder" />
          <span v-else class="placeholder">No Image</span>
        </div>

        <div class="sku-info">
          <h3>{{ sku.skuCode || "SKU-" + sku._id.slice(-5) }}</h3>

          <div class="attr-chips">
            <span class="attr-chip" v-for="a in sku.attributes" :key="a.variant">
              {{ a.variant }}: {{ a.value }}
            </span>
          </div>

          <p class="price-row">
            <span class="price">₹{{ sku.price }}</span>
            <span class="mrp">₹{{ sku.mrp }}</span>
          </p>

          <p class="stock">Stock: <b>{{ sku.stock }}</b></p>
        </div>

        <div class="actions">
          <button class="btn-sm primary" @click="openEditModal(sku)">Edit</button>
          <button class="btn-sm del" @click="openDeleteModal(sku._id)">Delete</button>
        </div>

      </div>
    </div>

    <!-- ✅ SKU Modal -->
    <div v-if="showModal" class="modal-backdrop">
      <div class="modal glass">
        <h2>{{ isEdit ? "Edit SKU" : "Add SKU" }}</h2>

        <div class="modal-grid">

          <div class="field full">
            <label>Image URL</label>
            <input v-model="skuForm.image" />
          </div>

          <div v-if="skuForm.image" class="img-preview">
            <img :src="skuForm.image" />
          </div>

          <div class="field">
            <label>Price</label>
            <input type="number" v-model="skuForm.price" />
          </div>

          <div class="field">
            <label>MRP</label>
            <input type="number" v-model="skuForm.mrp" />
          </div>

          <div class="field">
            <label>Stock</label>
            <input type="number" v-model="skuForm.stock" />
          </div>

          <div class="field full">
            <label>SKU Code (optional)</label>
            <input v-model="skuForm.skuCode" />
          </div>

        </div>

        <div class="modal-actions">
          <button class="btn primary" @click="saveSku">Save</button>
          <button class="btn ghost" @click="showModal = false">Cancel</button>
        </div>
      </div>
    </div>

    <!-- ✅ Delete Modal -->
    <div v-if="showDeleteModal" class="modal-backdrop">
      <div class="modal glass small">
        <h2>Delete SKU?</h2>
        <p class="confirm-text">This action cannot be undone.</p>

        <div class="modal-actions">
          <button class="btn ghost" @click="showDeleteModal = false">Cancel</button>
          <button class="btn danger" @click="deleteSku">Delete</button>
        </div>
      </div>
    </div>

  </section>
</template>

<style scoped>
.sku-page {
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
  margin-bottom: 24px;
  align-items: center;
}
.page-header h1 {
  font-size: 2rem;
  font-weight: 800;
}
.product-select {
  padding: 10px 14px;
  background: #0e141b;
  border: 1px solid #30363d;
  border-radius: 10px;
  color: #e6edf3;
}

/* PRODUCT SUMMARY */
.product-summary {
  padding: 20px;
  border-radius: 16px;
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 26px;
}
.prod-img {
  width: 70px;
  height: 70px;
  background: #11161d;
  object-fit: contain;
  border-radius: 12px;
  padding: 6px;
}

/* VARIANT GENERATOR */
.variant-section {
  padding: 20px;
  border-radius: 16px;
  margin-bottom: 26px;
}
.variant-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px,1fr));
  gap: 18px;
}
.variant-card {
  padding: 16px;
  background: #0f131a;
  border: 1px solid #30363d;
  border-radius: 14px;
}
.chip-group {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.chip {
  padding: 6px 10px;
  background: rgba(255,255,255,.08);
  border-radius: 8px;
  border: 1px solid #30363d;
  cursor: pointer;
}

/* SKU GRID */
.sku-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px,1fr));
  gap: 20px;
}
.sku-card {
  padding: 16px;
  background: rgba(13,17,23,.55);
  border: 1px solid #30363d;
  border-radius: 16px;
}
.sku-img {
  width: 100%;
  height: 150px;
  background: #11161d;
  display: grid;
  place-items: center;
  border-radius: 14px;
  margin-bottom: 10px;
}
.placeholder {
  opacity: .4;
}
.attr-chips {
  margin: 6px 0;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.attr-chip {
  padding: 4px 8px;
  background: rgba(255,255,255,.1);
  border: 1px solid #30363d;
  border-radius: 8px;
  font-size: .8rem;
}
.price-row {
  display: flex;
  gap: 10px;
}
.price {
  color: #23c55e;
  font-weight: 700;
}
.mrp {
  opacity: .5;
  text-decoration: line-through;
}

/* ACTION BUTTONS */
.actions {
  display: flex;
  gap: 10px;
}
.btn-sm {
  padding: 6px 12px;
  border-radius: 10px;
}
.btn-sm.primary { background: #238636; color: white; }
.btn-sm.del { background: #b91c1c; color: white; }

/* MODALS */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.6);
  display: grid;
  place-items: center;
  backdrop-filter: blur(6px);
}
.modal {
  width: min(550px,95vw);
  background: rgba(13,17,23,.85);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #30363d;
}
.modal.small {
  width: min(350px,95vw);
}
.modal-grid {
  display: grid;
  gap: 12px;
  margin: 14px 0;
  grid-template-columns: 1fr 1fr;
}
.modal-grid .full {
  grid-column: span 2;
}
.img-preview img {
  width: 100%;
  height: 120px;
  object-fit: contain;
  background: #11161d;
  border-radius: 12px;
  padding: 6px;
  border: 1px solid #30363d;
}

/* MODAL ACTIONS */
.modal-actions {
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
}
.btn.ghost {
  border: 1px solid #4a5568;
  padding: 10px 16px;
  border-radius: 10px;
}
.btn.danger {
  background: #b91c1c;
  padding: 10px 14px;
  color: white;
  border-radius: 10px;
}
</style>