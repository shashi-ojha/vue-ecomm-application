<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useCartStore } from "@/stores/cart";
import { useToastStore } from "@/stores/toast";
import type { Product } from "../services/productService";
import noImage from '@/assets/no-image.png';

const props = defineProps<{
  product: Product;
}>();

const cart = useCartStore();
const toast = useToastStore();
const router = useRouter();

// ✅ FE-friendly fields
const productId = computed(() => props.product._id);
const imageSrc = computed(
  () => props.product.images?.[0] || noImage
);

// ✅ Discount logic (optional)
const discount = computed(() => {
  if (!props.product.mrp || props.product.mrp <= props.product.price) return null;
  const diff = props.product.mrp - props.product.price;
  return Math.round((diff / props.product.mrp) * 100);
});

// ✅ Cart quantity
const inCartQty = computed(() => cart.byId(Number(productId.value))?.qty ?? 0);

function addToCart() {
  cart.add(
    {
      id: Number(productId.value),
      title: props.product.title,
      price: props.product.price,
      image: imageSrc.value,
    },
    1
  );
  toast.show("Added to cart!", "success");
}

function goToDetail() {
  router.push(`/products/${productId.value}`);
}
</script>

<template>
  <div class="card">

    <!-- Wishlist Heart -->
    <button class="wishlist-btn">♡</button>

    <!-- Hover Quick Add -->
    <div class="hover-actions">
      <button class="btn-quick" @click="addToCart">Quick Add</button>
    </div>

    <!-- Rating Stars -->
    <div class="rating-row">
      ⭐⭐⭐⭐⭐ (4.5)
    </div>

    <!-- Image -->
    <div class="img-box" @click="goToDetail">
      <img :src="imageSrc" :alt="product.title" loading="lazy">
      <span v-if="discount" class="discount-badge">-{{ discount }}%</span>
    </div>

    <!-- Title -->
    <h3 class="title" @click="goToDetail">{{ product.title }}</h3>

    <!-- Price Row -->
    <div class="price-row">
      <span class="price">₹{{ product.price }}</span>
      <span v-if="product.mrp" class="mrp">₹{{ product.mrp }}</span>
    </div>

    <!-- Stock -->
    <p class="stock" :class="{ low: product.stock < 3 }">
      {{ product.stock > 0 ? 'In Stock' : 'Out of Stock' }}
    </p>

    <!-- Add to Cart -->
    <div class="actions">
      <button class="btn" @click="addToCart">Add to Cart</button>

      <span class="qty-badge" v-if="inCartQty">
        In cart: {{ inCartQty }}
      </span>
    </div>

  </div>
</template>

<style scoped>

.card {
  background: rgba(13,17,23,.65);
  border: 1px solid #2f3844;
  border-radius: 16px;
  padding: 18px;
  transition: all 0.25s ease;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  box-shadow: 0 10px 25px rgba(0,0,0,0.35);
  position: relative;
  overflow: hidden

}

.card:hover {
  transform: translateY(-6px) scale(1.02);
  border-color: #238636;
  box-shadow: 0 16px 35px rgba(0,0,0,0.45);
}

.card::before {
  content: "";
  position: absolute;
  top: -100%;
  left: 0;
  width: 100%;
  height: 120%;
  background: linear-gradient(
    120deg,
    transparent 0%,
    rgba(255,255,255,.08) 50%,
    transparent 100%
  );
  transform: skewX(-18deg);
  transition: .4s;
}
.card:hover::before {
  top: 100%;
}

/* Wishlist */
.wishlist-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(255,255,255,.12);
  border: 0;
  font-size: 1.2rem;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  cursor: pointer;
  color: white;
  transition: .25s;
}
.wishlist-btn:hover {
  background: rgba(255,255,255,.22);
}

/* Hover Quick Add */
.hover-actions {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%) translateY(20px);
  opacity: 0;
  pointer-events: none;
  transition: .25s;
}
.card:hover .hover-actions {
  transform: translateX(-50%) translateY(0px);
  opacity: 1;
  pointer-events: auto;
}
.btn-quick {
  padding: 10px 18px;
  background: #238636;
  border: none;
  border-radius: 10px;
  color: white;
  cursor: pointer;
  font-weight: 700;
}

/* Rating */
.rating-row {
  margin-top: 4px;
  opacity: .9;
  font-size: .9rem;
}

/* Product Image */
.img-box {
  width: 100%;
  aspect-ratio: 1/1;
  border-radius: 12px;
  background: #0b0f14;
  overflow: hidden;
  display: grid;
  place-items: center;
  position: relative;
}
.img-box img {
  width: 70%;
  height: 70%;
  object-fit: contain;
  transition: .3s;
}
.img-box:hover img {
  transform: scale(1.07);
}

/* 🔥 Discount Badge */
.discount-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #b91c1c;
  padding: 4px 10px;
  border-radius: 10px;
  color: white;
  font-weight: 700;
  font-size: .85rem;
}


/* Title */

.title {
  font-size: 1.05rem;
  font-weight: 700;
  margin-top: 6px;
  line-height: 1.3;
  min-height: 42px;
}


/* Price Section */
.price-row {
  display: flex;
  gap: 8px;
  align-items: baseline;
}

.price {
  margin-top: 6px;
  color: #23c55e;
  font-size: 1.25rem;
  font-weight: 800;
}

.mrp {
  margin-left: 8px;
  opacity: .55;
  text-decoration: line-through;
}


/* Stock status */

.stock {
  margin-top: 4px;
  font-size: .9rem;
  opacity: .85;
}

.stock.out { color: #ff6b6b; 
}
.stock.low { color: #ff944d; }

/* Add to Cart */

.actions {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}


.btn {
  margin-top: 12px;
  width: 100%;
  background: #238636;
  border: none;
  padding: 10px 14px;
  border-radius: 10px;
  color: white;
  font-weight: 700;
  cursor: pointer;
  transition: .25s ease;
}

.btn:hover {
  background: #2ea043;
  transform: translateY(-2px);
}

.qty-badge {
  font-size: .85rem;
  opacity: .75;
}
</style>