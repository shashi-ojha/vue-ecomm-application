<script setup lang="ts">
import type { Product } from '@/services/productService'
import { useCartStore } from '@/stores/cart'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToastStore } from "@/stores/toast";

const props = defineProps<{ product: Product }>()
const cart = useCartStore()
const router = useRouter()
const toast = useToastStore()

// --- Version if cart store has a byId getter (recommended) ---
const inCartQty = computed(() => cart.byId(props.product.id)?.qty ?? 0);

// --- Version without byId getter ---
// const inCartQty = computed(() => {
//   const found = cart.items.find(i => i.id === props.product.id)
//   return found?.qty ?? 0
// })

function addToCart() {
  cart.add(
    {
      id: props.product.id,
      title: props.product.title,
      price: props.product.price,
      image: props.product.image
    },
    1
  )
  toast.show("Added to cart!", "success")
}

function goToDetail() {
  router.push(`/products/${props.product.id}`)
}
</script>

<template>
  <div class="card">
    <div class="img-wrap" @click="goToDetail" role="button">
      <img :src="product.image" :alt="product.title" loading="lazy" />
    </div>
    <h3 class="title" @click="goToDetail">{{ product.title }}</h3>
    <p class="price">₹{{ product.price.toFixed(2) }}</p>

    <div class="actions">
      <button class="btn" @click="addToCart">Add to Cart</button>
      <span v-if="inCartQty" class="qty-badge">In cart: {{ inCartQty }}</span>
    </div>

    <div class="ratings">
      <span class="rating">⭐ {{ product.rating.rate }}/{{ product.rating.count }}</span>
    </div>
  </div>
</template>

<style scoped>
.card {
  background: var(--card, #0d1117);
  border: 1px solid #30363d; border-radius: 12px;
  padding: 14px; color: var(--text, #c9d1d9);
  display: flex; flex-direction: column; gap: 8px;
  transition: transform .12s ease, box-shadow .12s ease, border-color .12s ease;
}
.card:hover { transform: translateY(-2px); border-color: #3a4450; box-shadow: 0 4px 14px rgba(0,0,0,.25); }

.img-wrap {
  width: 100%;
  aspect-ratio: 1 / 1;
  display: grid; place-items: center; cursor: pointer;
  background: #0b0f14; border-radius: 8px;
}
img { max-width: 50%; max-height: 50%; object-fit: contain; }

.title {
  font-size: .96rem; line-height: 1.35; margin: 0; cursor: pointer;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.price { color: #00c853; font-weight: 700; margin: 4px 0 2px; }
.actions { display: flex; align-items: center; gap: 10px; }
.btn { background: #238636; color: #fff; border: none; padding: 8px 10px; border-radius: 8px; cursor: pointer; }
.qty-badge { font-size: 0.85rem; color: #9da7b1; }

.ratings { margin-top: 4px; }
.rating { font-size: .9rem; color: #facc15; }
</style>