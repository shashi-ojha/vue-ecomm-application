<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { http } from "@/api/http";
import { useCartStore } from "@/stores/cart";
import { useToastStore } from "@/stores/toast";

const route = useRoute();
const cart = useCartStore();
const toast = useToastStore();

const product = ref<any>(null);
const skus = ref<any[]>([]);
const loading = ref(true);

// ✅ Selected image
const selectedImage = ref<string>("");

// ✅ Selected variant values
const selectedVariants = ref<Record<string, string>>({});

// ✅ Active SKU after selecting variants
const activeSku = computed(() => {
  if (!product.value || !skus.value.length) return null;

  // match SKU with exact attributes
  return skus.value.find((sku) => {
    return sku.attributes.every((att: any) => {
      return selectedVariants.value[att.variant] === att.value;
    });
  });
});

// ✅ Calculate discount percentage
const discount = computed(() => {
  const mrp = activeSku.value?.mrp || product.value?.mrp;
  const price = activeSku.value?.price || product.value?.price;
  
  if (!mrp || !price || price >= mrp) return null;
  return Math.round(((mrp - price) / mrp) * 100);
});

// ✅ Load product + SKUs
async function loadProduct() {
  try {
    const prod = await http.get(`/api/products/${route.params.id}`);
    product.value = prod.data.product;

    // Set default image
    selectedImage.value = product.value.images?.[0] || "";

    // Initialize variant selectors
    product.value.allowedVariants?.forEach((v: string) => {
      selectedVariants.value[v] = "";
    });

    // Load SKUs
    const skuRes = await http.get(`/api/skus?product=${route.params.id}`);
    skus.value = skuRes.data.skus;

  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

onMounted(loadProduct);

// ✅ Magnifier zoom
const zoomActive = ref(false);
const zoomPos = ref({ x: 0, y: 0 });

function handleZoom(e: MouseEvent) {
  const rect = (e.target as HTMLElement).getBoundingClientRect();
  zoomPos.value = {
    x: ((e.clientX - rect.left) / rect.width) * 100,
    y: ((e.clientY - rect.top) / rect.height) * 100,
  };
}

// ✅ Get unique values for a variant
function getValuesForVariant(variantName: string): string[] {
  if (!skus.value.length) return [];
  
  const values = new Set<string>();
  skus.value.forEach((sku) => {
    const attr = sku.attributes?.find((att: any) => att.variant === variantName);
    if (attr) values.add(attr.value);
  });
  
  return Array.from(values);
}

// ✅ Add to cart
function addToCart() {
  const sku = activeSku.value;

  cart.add(
    {
      id: sku?._id || product.value._id,
      title: product.value.title,
      price: sku?.price || product.value.price,
      image: sku?.image || selectedImage.value,
    },
    1
  );

  toast.show("Added to cart!", "success");
}

</script>


<template>
  <section class="detail-page">

    <!-- ✅ Loading -->
    <div v-if="loading" class="loader">Loading...</div>

    <!-- ✅ Product Content -->
    <div v-else class="product-container">

      <!-- ✅ LEFT — Gallery -->
      <div class="gallery">

        <!-- ✅ Thumbnails -->
        <div class="thumbs">
          <img
            v-for="img in product.images"
            :key="img"
            :src="img"
            :class="{ active: selectedImage === img }"
            @click="selectedImage = img"
            @mousemove="handleZoom"
            @mouseenter="zoomActive = true"
            @mouseleave="zoomActive = false"
          >
        </div>

        <!-- ✅ Main Image -->
        <div class="main-img">
          <img :src="selectedImage" :alt="product.title" @mousemove="handleZoom" />

          <!-- ✅ Magnifier -->
          <div
            v-if="zoomActive"
            class="zoom"
            :style="{
              backgroundImage: `url(${selectedImage})`,
              backgroundPosition: zoomPos.x + '%' + ' ' + zoomPos.y + '%'
            }"
          ></div>
        </div>

      </div>

      <!-- ✅ RIGHT — Product Info -->
      <div class="info">

        <!-- Title -->
        <h1 class="title">{{ product.title }}</h1>

        <!-- Category -->
        <p class="category">Category: {{ product.category?.name }}</p>

        <!-- ✅ Variant Selectors -->
        <div
          v-for="variantName in product.allowedVariants"
          :key="variantName"
          class="variant-block"
        >
          <!-- ✅ COLOR VARIANT -->
          <div v-if="variantName === 'Color'" class="color-row">

            <p class="variant-label">{{ variantName }}</p>

            <div class="color-options">

              <div
                v-for="value in getValuesForVariant('Color')"
                :key="value"
                class="color-swatch"
                :style="{ background: value.toLowerCase() }"
                :class="{ active: selectedVariants['Color'] === value }"
                @click="selectedVariants['Color'] = value"
              ></div>

            </div>

          </div>

          <!-- ✅ OTHER VARIANTS (e.g. Size) -->
          <div v-else class="variant-group">
            <p class="variant-label">{{ variantName }}</p>

            <div class="variant-options">
              <div
                v-for="value in getValuesForVariant(variantName)"
                :key="value"
                class="variant-pill"
                :class="{ active: selectedVariants[variantName] === value }"
                @click="selectedVariants[variantName] = value"
              >
                {{ value }}
              </div>
            </div>
          </div>
        </div>

        <!-- ✅ Price Block (SKU based) -->
        <div class="price-block">
          <span class="price">
            ₹{{ activeSku?.price || product.price }}
          </span>

          <span class="mrp" v-if="activeSku?.mrp || product.mrp">
            ₹{{ activeSku?.mrp || product.mrp }}
          </span>

          <span class="discount" v-if="discount">-{{ discount }}%</span>
        </div>

        <!-- ✅ Stock -->
        <p class="stock" :class="{ low: (activeSku?.stock ?? product.stock) < 3 }">
          {{ activeSku?.stock ?? product.stock }} in stock
        </p>

        <!-- ✅ Description -->
        <p class="description">{{ product.description }}</p>

        <!-- ✅ Offers -->
        <div class="offers">
          <h3>Available Offers</h3>
          <ul>
            <li>💳 10% Instant Bank Discount</li>
            <li>🏦 EMI Available on Credit Cards</li>
            <li>↩️ 7‑day Easy Return Policy</li>
          </ul>
        </div>

        <!-- ✅ Add to Cart -->
        <button class="add-btn" @click="addToCart">
          Add to Cart
        </button>

      </div>

    </div>

    <!-- ✅ Recommended Products -->
    <div class="recommend-box" v-if="product?.recommendations?.length">
      <h2>Recommended Products</h2>

      <div class="carousel">
        <div
          v-for="p in product?.recommendations"
          :key="p._id"
          class="rec-card"
        >
          <img :src="p.images?.[0]" :alt="p.title" />
          <h4>{{ p.title }}</h4>
          <p>₹{{ p.price }}</p>
        </div>
      </div>
    </div>

  </section>
</template>

<style scoped>
/* PAGE BASE */
.detail-page {
  padding: 32px 28px;
  background: #0b0f14;
  min-height: 100vh;
  color: #e6edf3;
  font-family: "Inter", sans-serif;
}

/* LOADING */
.loading {
  text-align: center;
  margin-top: 40px;
  color: #9da7b1;
  font-size: 1.1rem;
}

/* GRID LAYOUT */
.product-container {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 40px;
}

/* -----------------------------
   ✅ LEFT: GALLERY SECTION
------------------------------*/

.gallery {
  display: flex;
  gap: 16px;
}

/* THUMBNAILS */
.thumbs {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.thumbs img {
  width: 80px;
  height: 80px;
  object-fit: contain;
  background: #11161d;
  border-radius: 12px;
  padding: 8px;
  cursor: pointer;
  border: 1px solid #30363d;
  transition: .25s ease;
}

.thumbs img:hover {
  border-color: #238636;
  transform: translateY(-3px);
}

.thumbs img.active {
  border-color: #238636;
  box-shadow: 0 0 10px rgba(35,134,54,0.45);
}

/* MAIN IMAGE */
.main-img {
  flex: 1;
  background: #11161d;
  border-radius: 16px;
  padding: 16px;
  border: 1px solid #30363d;
  display: grid;
  place-items: center;
}

.main-img img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: 0.25s ease;
}

.main-img img:hover {
  transform: scale(1.03);
}

/* -----------------------------
   ✅ RIGHT: PRODUCT INFO
------------------------------*/

.info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.title {
  font-size: 2rem;
  font-weight: 800;
}

.category {
  font-size: .95rem;
  opacity: .75;
}

/* PRICE BLOCK */
.price-block {
  display: flex;
  align-items: center;
  gap: 12px;
}

.price {
  font-size: 2rem;
  font-weight: 800;
  color: #23c55e;
}

.mrp {
  text-decoration: line-through;
  opacity: .55;
  font-size: 1.1rem;
}

.discount {
  background: #b91c1c;
  padding: 4px 10px;
  border-radius: 10px;
  font-weight: 700;
  font-size: .9rem;
  color: white;
}

/* STOCK STATUS */
.stock {
  font-size: 1rem;
  opacity: .85;
}

.stock.low {
  color: #ff6b6b;
  font-weight: 600;
}

/* DESCRIPTION */
.description {
  line-height: 1.65;
  opacity: .9;
  font-size: 1rem;
}

/* ADD TO CART BUTTON */
.add-btn {
  margin-top: 4px;
  padding: 14px 18px;
  border: none;
  border-radius: 12px;
  background: #238636;
  font-weight: 700;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: .25s ease;
}

.add-btn:hover {
  background: #2ea043;
  transform: translateY(-2px);
}

/* -----------------------------
   ✅ VARIANT SELECTOR (Color/Size)
------------------------------*/

.variant-section {
  margin: 18px 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.variant-group { }

.variant-label {
  font-size: .95rem;
  font-weight: 600;
  margin-bottom: 6px;
  opacity: .85;
}

.variant-options {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.variant-pill {
  padding: 8px 16px;
  border-radius: 18px;
  background: rgba(255,255,255,0.08);
  border: 1px solid #30363d;
  font-size: .9rem;
  cursor: pointer;
  transition: .2s ease;
  color: #e6edf3;
}

.variant-pill:hover {
  background: rgba(255,255,255,0.14);
}

.variant-pill.active {
  background: #238636;
  border-color: #238636;
  color: white;
  box-shadow: 0 0 12px rgba(35,134,54,0.5);
}

/* -----------------------------
   ✅ MOBILE STICKY CART BAR
------------------------------*/

.mobile-cart-bar {
  display: none;
  position: fixed;
  left: 0; right: 0; bottom: 0;
  background: #11161d;
  border-top: 1px solid #30363d;
  padding: 12px 18px;
  align-items: center;
  justify-content: space-between;
  z-index: 500;
}

.mobile-cart-bar button {
  background: #238636;
  padding: 10px 16px;
  border-radius: 10px;
  border: none;
  color: white;
  font-weight: 700;
}

.mobile-cart-bar .price {
  font-size: 1.3rem;
  font-weight: 700;
}

.color-swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #30363d;
  cursor: pointer;
  transition: .2s;
}

.color-swatch.active {
  border-color: #238636;
  box-shadow: 0 0 8px rgba(35,134,54,.6);
}

.color-swatch:hover {
  transform: scale(1.08);
}

.color-row {
  margin-bottom: 18px;
}

.color-options {
  display: flex;
  gap: 10px;
  align-items: center;
}

.variant-label {
  margin-bottom: 6px;
  font-size: .95rem;
  opacity: .85;
}
/* -----------------------------
   ✅ RESPONSIVE
------------------------------*/

@media (max-width: 1000px) {
  .product-container {
    grid-template-columns: 1fr;
  }
  .gallery {
    flex-direction: column-reverse;
  }
  .thumbs {
    flex-direction: row;
    overflow-x: auto;
  }
}

@media (max-width: 780px) {
  .mobile-cart-bar {
    display: flex;
  }
  .add-btn {
    display: none;
  }
}
</style>