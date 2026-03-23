<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { fetchProductById, type Product } from '@/services/productService'
import { useCartStore } from '@/stores/cart'
import SkeletonCard from '@/components/SkeletonCard.vue'
import Breadcrumbs from '@/components/Breadcrumbs.vue'

const route = useRoute()
const cart = useCartStore()

const product = ref<Product | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const qty = ref<number>(1)

async function load() {
  try {
    loading.value = true
    error.value = null
    const id = Number(route.params.id)
    if (Number.isNaN(id)) throw new Error('Invalid product id')
    product.value = await fetchProductById(id)
  } catch (e: any) {
    error.value = e?.message ?? 'Failed to load product'
  } finally {
    loading.value = false
  }
}

console.log('route.params.id', route.params.id)
console.log('product.value', product)
onMounted(load)
watch(() => route.params.id, load)

function addToCart() {
  if (!product.value) return
  cart.add(product.value, qty.value)
}
</script>

<template>
  <section class="detail">
    <Breadcrumbs />
    <!-- Skeleton / Error -->
    <div v-if="loading" class="skeleton">
      <SkeletonCard />
    </div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <!-- Product -->
    <div v-else-if="product" class="wrap">
      <div class="img-col">
        <img :src="product.image" :alt="product.title" />
      </div>

      <div class="info-col">
        <h1 class="title">{{ product.title }}</h1>
        <p class="cat">{{ product.category }}</p>
        <p class="price">₹{{ product.price.toFixed(2) }}</p>
        <div class="ratings">
            <span class="rating">⭐ {{ product.rating.rate }}/{{ product.rating.count }}</span>
        </div>

        <p class="desc">{{ product.description }}</p>

        <div class="buy">
          <label>Qty</label>
          <input type="number" min="1" v-model.number="qty" class="qty" />
          <button class="btn" @click="addToCart">Add to Cart</button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.detail { max-width: 1100px; margin: 20px auto; padding: 0 20px; color: #c9d1d9; }
.wrap { display: grid; grid-template-columns: 1fr 1.2fr; gap: 24px; }
@media (max-width: 900px) { .wrap { grid-template-columns: 1fr; } }
.img-col { display: grid; place-items: center; background: #0d1117; border: 1px solid #30363d; border-radius: 12px; padding: 16px; }
.img-col img { max-height: 420px; object-fit: contain; }
.info-col .title { margin: 0 0 6px; }
.cat { color: #9da7b1; margin-bottom: 6px; text-transform: capitalize; }
.price { color: #00c853; font-size: 1.4rem; font-weight: 800; margin: 8px 0 12px; }
.desc { line-height: 1.6; }
.buy { margin-top: 16px; display: flex; align-items: center; gap: 10px; }
.qty { width: 72px; padding: 8px; background: #0b0f14; border: 1px solid #30363d; color: #c9d1d9; border-radius: 8px; }
.btn { background: #238636; color: #fff; border: none; padding: 10px 14px; border-radius: 8px; cursor: pointer; }
.error { color: #ff6b6b; }
.skeleton { max-width: 600px; }
</style>