<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { http } from "@/api/http";
import { useToastStore } from "@/stores/toast";

const route = useRoute();
const toast = useToastStore();

const order = ref<any>(null);
const loading = ref(true);

// ✅ Amazon-style order stages
const STEPS = [
  { key: "placed", label: "Order Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "packed", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
];

// ✅ Load order details
async function loadOrder() {
  try {
    const { data } = await http.get(`/api/order/${route.params.orderId}`);
    order.value = data;
    order.value.status = order.value.status.toLowerCase();
  } catch (err) {
    toast.show("Failed to load order details", "error");
  } finally {
    loading.value = false;
  }
}

onMounted(loadOrder);
</script>

<template>
  <section class="tracking-page">

    <h1 class="title">Order Tracking</h1>

    <div v-if="loading" class="loading-block">
      <div class="loader"></div>
      <p>Loading order details…</p>
    </div>

    <div v-else class="grid-2">

      <!-- ✅ LEFT: Tracking Timeline -->
      <div class="glass timeline-card">
        <h2 class="section-title">Tracking Status</h2>

        <!-- ✅ Premium Animated Timeline -->
        <div v-if="order" class="timeline-animated">

        <div
            v-for="(step, index) in STEPS"
            :key="step.key"
            class="step"
            :class="{
            active: order?.status &&
                STEPS.findIndex(s => s.key === order.status) >= index,
            completed: STEPS.findIndex(s => s.key === order.status) > index
            }"
            :style="{ '--step-index': index }"
        >

            <!-- Dot -->
            <div class="dot"></div>

            <!-- Connector line -->
            <div v-if="index !== STEPS.length - 1" class="line"></div>

            <!-- Text -->
            <div class="text-block">
            <p class="label">{{ step.label }}</p>

            <small v-if="order?.timestamps?.[step.key]">
                {{ new Date(order.timestamps[step.key]).toLocaleString() }}
            </small>
            </div>
        </div>

        </div>
      </div>
      

      <!-- ✅ RIGHT: Order Summary -->
      <div class="glass summary-card">
        <h2 class="section-title">Order Details</h2>

        <p class="order-id">Order #{{ order?.orderId }}</p>

        <!-- Items -->
        <div class="items">
          <div v-for="it in order?.items" :key="it.title" class="item">
            <img :src="it.image" class="thumb">
            <div>
              <p class="item-title">{{ it.title }}</p>
              <p class="qty">Qty: {{ it.qty }}</p>
            </div>
            <p class="price">₹{{ (it.price * it.qty).toFixed(2) }}</p>
          </div>
        </div>

        <!-- Shipping Address -->
        <h3 class="sub-title">Shipping Address</h3>

        <div class="ship-box">
          <p class="bold">{{ order?.address.fullName }}</p>
          <p>{{ order?.address.addressLine1 }}</p>
          <p v-if="order?.address.addressLine2">{{ order?.address.addressLine2 }}</p>
          <p>{{ order?.address.city }}, {{ order?.address.state }} - {{ order?.address.zip }}</p>
          <p>{{ order?.address.country }}</p>
          <p class="mt">📞 {{ order?.address.phone }}</p>
        </div>

        <!-- Totals -->
        <h3 class="sub-title">Payment Summary</h3>

        <div class="totals">
          <div class="row">
            <span>Subtotal</span>
            <span>₹{{ order?.amount ?? 0 }}</span>
          </div>
          <div class="row">
            <span>Shipping</span>
            <span>₹{{ order?.shipping ?? 0 }}</span>
          </div>
          <div class="row total">
            <span>Total</span>
            <span>₹{{ (order?.amount ?? 0) + (order?.shipping ?? 0) }}</span>
          </div>
        </div>

      </div>

    </div>

  </section>
</template>

<style scoped>
.tracking-page {
  padding: 32px 24px;
  background:
    radial-gradient(900px 420px at 20% -10%, rgba(35,134,54,0.15), transparent 60%),
    radial-gradient(700px 380px at 100% 90%, rgba(99,102,241,0.15), transparent 60%),
    #0b0f14;
  min-height: 100vh;
  color: #e6edf3;
  font-family: "Inter", sans-serif;
}

.title {
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 24px;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 24px;
}

.glass {
  background: rgba(13,17,23,.6);
  border: 1px solid #30363d;
  border-radius: 16px;
  padding: 22px;
  box-shadow: 0 10px 26px rgba(0,0,0,.35);
  backdrop-filter: blur(14px);
}

.section-title {
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 14px;
}

/* ✅ TIMELINE */
.timeline {
  margin-top: 10px;
  position: relative;
}

.step {
  padding-left: 32px;
  position: relative;
  margin-bottom: 26px;
  opacity: 0.5;
}

.step.active {
  opacity: 1;
}

.dot {
  position: absolute;
  top: 0;
  left: 6px;
  width: 16px;
  height: 16px;
  background: #30363d;
  border-radius: 50%;
}

.step.active .dot {
  background: #238636;
}

.line {
  position: absolute;
  left: 13px;
  top: 16px;
  width: 2px;
  height: 32px;
  background: #30363d;
}

/* ✅ SUMMARY CARD */
.summary-card .order-id {
  opacity: 0.85;
  margin-bottom: 12px;
}

.items .item {
  display: flex;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #2e3540;
}

.thumb {
  width: 55px;
  height: 55px;
  border-radius: 8px;
  object-fit: contain;
  background: #1a1f25;
  padding: 4px;
}

.item-title {
  font-size: 0.95rem;
  font-weight: 600;
}

.qty {
  font-size: 0.85rem;
  opacity: 0.75;
}

.price {
  margin-left: auto;
  font-weight: 700;
}

.sub-title {
  margin: 16px 0 8px;
  font-size: 1.1rem;
  font-weight: 700;
}

.ship-box {
  background: rgba(255,255,255,0.05);
  border: 1px solid #30363d;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 16px;
}

.bold {
  font-weight: 700;
}

.mt {
  margin-top: 6px;
}

/* ✅ TOTALS */
.totals {
  margin-top: 10px;
}

.row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  opacity: 0.85;
}

.row.total {
  font-weight: 700;
  border-top: 1px solid #30363d;
  padding-top: 10px;
}

/* ✅ LOADING */
.loading-block {
  text-align: center;
  margin-top: 80px;
}

.loader {
  width: 32px;
  height: 32px;
  border: 3px solid #fff;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin .8s linear infinite;
}
/* ------------------------------
   PREMIUM ANIMATED TIMELINE
--------------------------------*/
.timeline-animated {
  position: relative;
  padding-left: 30px;
  display: flex;
  flex-direction: column;
}

.step {
  position: relative;
  padding: 14px 0 14px 22px;
  opacity: 0.25;
  transform: translateX(-14px);
  transition: opacity .4s ease, transform .4s ease;
  animation: slideIn .5s ease forwards;
  animation-delay: calc(var(--step-index) * 0.12s);
}

.step.active {
  opacity: 1;
  transform: translateX(0);
}

.step.completed .dot {
  background: #23c55e;
  border-color: #23c55e;
}

.step.completed .line {
  background: #23c55e;
}

/* Dot */
.dot {
  position: absolute;
  top: 14px;
  left: -22px;
  width: 16px;
  height: 16px;
  background: #30363d;
  border-radius: 50%;
  border: 2px solid #555;
  transition: all .4s ease;
}

.step.active .dot {
  background: #238636;
  border-color: #238636;
  box-shadow: 0 0 8px rgba(35,134,54,.8);
  animation: pulse 1.5s infinite ease-in-out;
}

/* Connector line */
.line {
  position: absolute;
  top: 30px;
  left: -15px;
  width: 2px;
  height: 38px;
  background: #30363d;
  transition: background .4s ease;
}

.step.completed .line {
  background: #23c55e;
}

/* Text Block */
.text-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.label {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 2px;
}

small {
  opacity: .7;
  font-size: .78rem;
}

/* ----------------------------
   ANIMATIONS
----------------------------*/
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-18px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 6px rgba(35,134,54,0.4);
  }
  50% {
    box-shadow: 0 0 14px rgba(35,134,54,1);
  }
  100% {
    box-shadow: 0 0 6px rgba(35,134,54,0.4);
  }
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>