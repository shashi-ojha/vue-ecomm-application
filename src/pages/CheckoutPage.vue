<script setup lang="ts">
import axios from "axios";
import { ref, computed } from "vue";
import { useCartStore } from "@/stores/cart";
import { useToastStore } from "@/stores/toast";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const cart = useCartStore();
const toast = useToastStore();
const auth = useAuthStore();
const router = useRouter();

const API_BASE = "http://localhost:5000";

// Form fields

const fullName = ref("");
const email = ref("");
const phone = ref("");
const address = ref("");
const city = ref("");
const country = ref("");
const zip = ref("");

// Validation
const errors = ref<{ [k: string]: string }>({});


function validate() {
  errors.value = {};
  if (!fullName.value) errors.value.fullName = "Full name is required";
  if (!email.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) errors.value.email = "Valid email required";
  if (!phone.value || phone.value.length < 6) errors.value.phone = "Valid phone number required";
  if (!address.value) errors.value.address = "Address is required";
  if (!city.value) errors.value.city = "City is required";
  if (!zip.value) errors.value.zip = "ZIP or PIN code is required";
  if (!country.value) errors.value.country = "Country is required";
  return Object.keys(errors.value).length === 0;
}

console.log("Cart items at checkout:", auth.user?.email, cart.items);

async function goToPayment() {

  if (!validate()) {
    toast.show("Please fix the errors", "error");
    return;
  }
  if (!cart.items.length) {
    toast.show("Your cart is empty", "error");
    return;
  }

  try {  
    const items = cart.items.map(it => ({
      productId: it.id,
      title: it.title,
      price: it.price,
      qty: it.qty,
      image: it.image
    }));

  
    const billingAddress = {
      fullName: fullName.value,
      email: email.value,
      phone: phone.value,
      address: address.value,
      city: city.value,
      country: country.value,
      zip: zip.value
    };

    const userId: string = auth?.user?.email ?? "test@example.com";

    
const { data } = await axios.post(`${API_BASE}/api/create-order`, {
      items,
      address: billingAddress,
      // paymentMethod: "UPI",
      userId,    
      pricing: {
          subtotal: cart.subtotal,
          discount: cart.discount,
          taxRate: cart.taxRate,
          tax: cart.tax,
          total: cart.total,
        },
        coupon: cart.coupon?.code ?? null,
    }, {
      headers: { "Content-Type": "application/json" }
    });

    if (!data?.success) {
      toast.show("Failed to create order", "error");
      return;
    }

    const orderId: string = data.orderId;
    const amount: number = data.amount;

    toast.show("Order created. Redirecting to payment…", "info");

    // 6) Redirect once (don’t call push twice)
    router.push({ path: "/payment", query: { orderId, amount: String(amount) } });
  } catch (err: any) {
    console.error("[create-order] error", err);
    const msg = err?.response?.data?.message || err?.message || "Could not create order";
    toast.show(msg, "error");
  }
}

// Order Summary total
const total = computed(() => cart.total.toFixed(2));
</script>

<template>
  <section class="checkout">
    <h1>Checkout</h1>

    <div class="checkout-layout">

      <!-- LEFT: Checkout Form -->
      <div class="form-card glass">

        <h2>Billing Details</h2>

        <div class="form-grid">
          <div class="field">
            <label>Full Name</label>
            <input v-model="fullName" type="text" />
            <p v-if="errors.fullName" class="err">{{ errors.fullName }}</p>
          </div>

          <div class="field">
            <label>Email</label>
            <input v-model="email" type="email" />
            <p v-if="errors.email" class="err">{{ errors.email }}</p>
          </div>

          <div class="field">
            <label>Phone</label>
            <input v-model="phone" type="text" />
            <p v-if="errors.phone" class="err">{{ errors.phone }}</p>
          </div>

          <div class="field full">
            <label>Address</label>
            <input v-model="address" type="text" />
            <p v-if="errors.address" class="err">{{ errors.address }}</p>
          </div>

          <div class="field">
            <label>City</label>
            <input v-model="city" type="text" />
            <p v-if="errors.city" class="err">{{ errors.city }}</p>
          </div>

          <div class="field">
            <label>ZIP / PIN</label>
            <input v-model="zip" type="text" />
            <p v-if="errors.zip" class="err">{{ errors.zip }}</p>
          </div>

          <div class="field full">
            <label>Country</label>
            <input v-model="country" type="text" />
            <p v-if="errors.country" class="err">{{ errors.country }}</p>
          </div>
        </div>
      </div>

      <!-- RIGHT: Order Summary -->
      <div class="summary-card glass">

        <h2>Order Summary</h2>

        <div class="items">
          <div v-for="item in cart.items" :key="item.id" class="item">
            <img :src="item.image" alt="" />
            <div>
              <p class="title">{{ item.title }}</p>
              <p class="small">Qty: {{ item.qty }}</p>
            </div>
            <p class="price">₹{{ (item.qty * item.price).toFixed(2) }}</p>
          </div>
        </div>

        <div class="total-row">
          <p>Total</p>
          <h3>₹{{ total }}</h3>
        </div>

        <button class="place-btn" @click="goToPayment">Proceed to Payment</button>
      </div>

    </div>
  </section>
</template>

<style scoped>
.checkout {
  max-width: 1250px;
  margin: 90px auto 30px;
  padding: 0 20px;
  color: var(--text);
}

h1 {
  margin-bottom: 20px;
  font-size: 2rem;
}

.checkout-layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

/* Glass cards */
.glass {
  background: rgba(13,17,23,0.55);
  border: 1px solid rgba(48,54,61,0.6);
  padding: 22px;
  border-radius: 16px;
  backdrop-filter: blur(10px);
}

/* Form */
.form-card h2,
.summary-card h2 {
  margin-bottom: 16px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}
.full {
  grid-column: span 2;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field input {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #30363d;
  background: #0b0f14;
  color: var(--text);
}
.err {
  color: #ef4444;
  font-size: 0.8rem;
}

/* Summary */
.summary-card {
  position: sticky;
  top: 100px;
  height: fit-content;
}

.items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.item {
  display: flex;
  align-items: center;
  gap: 12px;
}
img {
  width: 50px;
  height: 50px;
  object-fit: contain;
  background: #00000022;
  border-radius: 8px;
}
.price {
  margin-left: auto;
  font-weight: 600;
}
.title {
  font-size: .95rem;
}

.total-row {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid #30363d;
  display: flex;
  justify-content: space-between;
}

.place-btn {
  margin-top: 20px;
  width: 100%;
  padding: 12px;
  background: #238636;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  cursor: pointer;
}
.place-btn:hover {
  opacity: .9;
}

/* Mobile */
@media (max-width: 900px) {
  .checkout-layout {
    grid-template-columns: 1fr;
  }
}
</style>