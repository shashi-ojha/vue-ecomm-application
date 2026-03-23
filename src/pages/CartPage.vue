<script setup lang="ts">
import { computed, ref, nextTick } from "vue";
import { useCartStore } from "@/stores/cart";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";

const cart = useCartStore();
const router = useRouter();
const auth = useAuthStore();
const toast = useToastStore();

/* Currency formatter for INR */
const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

/* Empty check */
const hasItems = computed(() => cart.items.length > 0);

/* Smooth quantity update */
function decQty(item: { id: number; qty: number; }) {
  cart.updateQty(item.id, item.qty - 1);
  animatePrice(item);
}

function incQty(item: { id: number; qty: number; }) {
  cart.updateQty(item.id, item.qty + 1);
  animatePrice(item);
}

/* Input Handler */
function onQtyInput(item: { id: number; qty: any; }, e: Event) {
  const el = e.currentTarget as HTMLInputElement;
  const n = parseInt(el.value, 10);
  cart.updateQty(item.id, Number.isFinite(n) && n > 0 ? n : 1);
  nextTick(() => (el.value = String(item.qty)));
  animatePrice(item);
}

/* Price animation */
const animatingPrices = ref<{ [key: number]: boolean }>({});

function animatePrice(item: { id: any; qty?: any; }) {
  animatingPrices.value[item.id] = true;
  setTimeout(() => {
    animatingPrices.value[item.id] = false;
  }, 250);
}

/* Remove animation */
const removing = ref<{ [key: number]: boolean }>({});

function removeItem(item: { id: number; }) {
  removing.value[item.id] = true;

  setTimeout(() => {
    cart.remove(item.id);
  }, 250);
}

/* Checkout redirect */
function goToCheckout() {
  if (!auth.isLoggedIn) {
    router.push({ path: "/login", query: { redirect: "/checkout" } });
  } else {
    router.push("/checkout");
  }
}


// coupon input
const couponCode = ref("");

// formatted helpers

const fSubtotal = computed(() => currency.format(cart.subtotal));
const fDiscount = computed(() => cart.discount > 0 ? "− " + currency.format(cart.discount) : currency.format(0));
const fTax      = computed(() => currency.format(cart.tax));
const fTotal    = computed(() => currency.format(cart.total));


function applyCoupon() {
  if (!couponCode.value.trim()) return;
  const res = cart.applyCoupon(couponCode.value);
  if (res.ok) {
    toast.show("Coupon applied!", "success");
    couponCode.value = cart.coupon?.code ?? ""; // normalize casing
  } else {
    toast.show(res.message || "Coupon not applicable", "error");
  }
}
function removeCoupon() {
  cart.removeCoupon();
  toast.show("Coupon removed", "info");
}

</script>

<template>
  <section class="cart-page">
    <h1>Your Cart</h1>

    <!-- Empty -->
    <div v-if="!hasItems" class="empty">
      <p>Your cart is empty.</p>
      <RouterLink to="/products" class="btn">Browse Products</RouterLink>
    </div>

    <!-- Items & Summary -->
    <div v-else class="cart-layout">

      <!-- ITEMS LIST -->
      <div class="items">

        <transition-group name="list" tag="div">
          <div
            v-for="item in cart.items"
            :key="item.id"
            class="item"
            :class="{ removing: removing[item.id] }"
          >

            <img :src="item.image" class="thumb" />

            <div class="info">
              <h3 class="title">{{ item.title }}</h3>
              <p class="unit">{{ currency.format(item.price) }} each</p>

              <div class="qty-box">
                <button @click="decQty(item)" :disabled="item.qty <= 1">−</button>

                <input
                  type="number"
                  :value="item.qty"
                  @input="onQtyInput(item, $event)"
                />

                <button @click="incQty(item)">+</button>
              </div>

              <button class="remove" @click="removeItem(item)">Remove</button>
            </div>

            <!-- PRICE WITH ANIMATION -->
            <div class="price-box">
              <span :class="{ pop: animatingPrices[item.id] }">
                {{ currency.format(item.qty * item.price) }}
              </span>
            </div>

          </div>
        </transition-group>
      </div>


      <!-- SUMMARY -->
      <aside class="summary">
        <h2>Order Summary</h2>

        <!-- Coupon box -->
        <div class="coupon-box">
          <input
            type="text"
            v-model.trim="couponCode"
            placeholder="Enter coupon code"
            @keydown.enter="applyCoupon"
          />
          <button class="apply" @click="applyCoupon">Apply</button>
          <button v-if="cart.coupon" class="remove-coupon" @click="removeCoupon">Remove</button>

          <p class="applied" v-if="cart.coupon">
            Applied: <strong>{{ cart.coupon.code }}</strong>
            <span v-if="cart.coupon.label">({{ cart.coupon.label }})</span>
          </p>
        </div>

        <!-- Price rows -->
        <div class="row">
          <span>Items</span>
          <span>{{ cart.count }}</span>
        </div>
        <div class="row">
          <span>Subtotal</span>
          <span class="amt">{{ fSubtotal }}</span>
        </div>
        <div class="row" :class="{ dim: cart.discount === 0 }">
          <span>Discount</span>
          <span class="amt discount">{{ fDiscount }}</span>
        </div>
        <div class="row">
          <span>GST ({{ Math.round(cart.taxRate * 100) }}%)</span>
          <span class="amt">{{ fTax }}</span>
        </div>

        <div class="divider"></div>

        <div class="row total">
          <span>Total</span>
          <span class="grand">{{ fTotal }}</span>
        </div>

        <button class="checkout" @click="goToCheckout">Proceed to Checkout</button>
        <button class="clear" @click="cart.clear()">Clear Cart</button>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.cart-page {
  max-width: 1200px;
  margin: 90px auto 40px;
  padding: 0 20px;
  color: var(--text);
}

/* Empty */
.empty { text-align: center; margin-top: 40px; opacity: .8; }
.btn {
  margin-top: 20px;
  padding: 10px 16px;
  background: #238636;
  border-radius: 10px;
  color: white;
}

/* Layout */
.cart-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 20px;
  align-items: start;
}

/* Item card */
.items { display: flex; flex-direction: column; gap: 16px; }

.item {
  display: grid;
  grid-template-columns: 90px 1fr auto;
  gap: 14px;
  padding: 14px;
  background: rgba(13,17,23,.75);
  border-radius: 16px;
  border: 1px solid #30363d;
  box-shadow: 0 4px 18px rgba(0,0,0,.35);
  transition: 0.25s ease;
  margin-top: 10px;
}

/* Removal animation */
.item.removing {
  opacity: 0;
  transform: translateX(-20px);
}

/* Thumbnail */
.thumb {
  width: 90px;
  height: 90px;
  object-fit: contain;
  background: #11171f;
  border-radius: 12px;
}

/* Info block */
.title {
  margin: 0;
  font-size: 1rem;
  line-height: 1.4;
}
.unit { opacity: .8; font-size: .9rem; }

/* Quantity Controls */
.qty-box {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #0b0f14;
  border: 1px solid #30363d;
  border-radius: 10px;
  padding: 6px;
  margin: 8px 0;
}
.qty-box button {
  width: 30px; height: 30px;
  border: none;
  border-radius: 6px;
  background: #222a33;
  color: white;
  cursor: pointer;
}
.qty-box button:disabled {
  opacity: .4;
  cursor: not-allowed;
}
.qty-box input {
  width: 50px;
  background: transparent;
  border: none;
  color: white;
  text-align: center;
  outline: none;
}

/* Remove button */
.remove {
  margin-top: 6px;
  color: #f87171;
  background: transparent;
  border: none;
  cursor: pointer;
}

/* Animated Price */
.price-box {
  font-size: 1.2rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 100px;
}

.price-box .pop {
  animation: pop 0.25s ease;
}

@keyframes pop {
  0% { transform: scale(.8); opacity: .5; }
  100% { transform: scale(1); opacity: 1; }
}

/* Summary */
.summary {
  position: sticky; top: 96px;
  background: rgba(13,17,23,.75);
  border: 1px solid #30363d;
  padding: 16px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,.35);
}
.summary h2 { margin-bottom: 12px; }

/* Coupon box */
.coupon-box {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  margin-bottom: 12px;
}
.coupon-box input {
  background: #0b0f14; border: 1px solid #30363d; color: #e6edf3;
  border-radius: 10px; padding: 10px 12px; outline: none;
}
.coupon-box .apply {
  background: #238636; color: #fff; border: 0; border-radius: 10px; padding: 10px 12px; cursor: pointer;
}
.remove-coupon {
  grid-column: 1 / -1;
  margin-top: 2px;
  background: transparent; color: #e6edf3; border: 1px solid #30363d;
  border-radius: 10px; padding: 8px; cursor: pointer;
}
.applied { margin-top: 6px; font-size: .9rem; opacity: .85; }

/* Price rows */
.row {
  display: flex; justify-content: space-between; padding: 8px 0;
  border-bottom: 1px dashed #30363d;
}
.row.total { border-bottom: none; margin-top: 6px; }
.divider { height: 1px; background: #30363d; margin: 8px 0; }

.amt { font-weight: 700; }
.discount { color: #ef4444; }
.dim { opacity: .6; }
.grand {
  font-weight: 800; font-size: 1.15rem;
  animation: pop .25s ease;
}

.checkout {
  margin-top: 14px; width: 100%; padding: 14px;
  background: #238636; border-radius: 10px; color: white; cursor: pointer;
}
.clear {
  margin-top: 10px; width: 100%; padding: 12px;
  background: transparent; border: 1px solid #30363d; color: white; border-radius: 10px; cursor: pointer;
}

/* Reuse pop animation from earlier */
@keyframes pop {
  0% { transform: scale(.85); opacity: .6; }
  100% { transform: scale(1); opacity: 1; }
}

/* Slide / fade animations */
.list-enter-active,
.list-leave-active {
  transition: all .25s ease;
}
.list-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

@media (max-width: 960px) {
  .cart-layout { grid-template-columns: 1fr; }
  .summary { position: static; }
}
</style>