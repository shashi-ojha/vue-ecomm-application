<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import { useToastStore } from "@/stores/toast";
import { useCartStore } from "@/stores/cart";
import { http } from "@/api/http";
const cart = useCartStore();

const API_BASE = "http://localhost:5000";
const toast = useToastStore();
const route = useRoute();
const router = useRouter();

type OrderStatus = "Delivered" | "Pending" | "Shipped" | "Cancelled" | "Placed";

interface OrderItem {
  productId: string;
  title: string;
  qty: number;
  price: number;
  image: string;
}
interface OrderDetails {
  orderId: string;
  createdAt: string;
  status: OrderStatus;
  paymentMethod: string;   // "UPI" | "CARD" | "NETBANKING" | "COD" | "PENDING"
  paymentStatus: string;   // "Paid" | "Pending" | ...
  shipmentId?: string;
  address: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    zip: string;
  };
  items: OrderItem[];
  amount: number;          // subtotal
}

const order = ref<OrderDetails | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const showTrack = ref(false);

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

const shippingCharge = 49;

const orderDate = computed(() =>
  order.value ? new Date(order.value.createdAt).toDateString() : ""
);

const subtotal = computed(() => order.value?.amount ?? 0);
const total = computed(() => subtotal.value + shippingCharge);

// progress % and ETA (simple heuristic)
const progress = computed(() => {
  switch (order.value?.status) {
    case "Placed":
    case "Pending": return 33;
    case "Shipped": return 66;
    case "Delivered": return 100;
    case "Cancelled": return 0;
    default: return 0;
  }
});
const etaText = computed(() => {
  if (!order.value) return "";
  if (order.value.status === "Delivered") return "Delivered";
  if (order.value.status === "Shipped") return "Est. delivery in 1–3 days";
  if (order.value.status === "Placed" || order.value.status === "Pending") return "Preparing to ship";
  if (order.value.status === "Cancelled") return "Order cancelled";
  return "";
});

function badgeClass(status?: OrderStatus) {
  switch (status) {
    case "Delivered": return "delivered";
    case "Shipped":   return "shipped";
    case "Pending":
    case "Placed":    return "pending";
    case "Cancelled": return "cancelled";
    default:          return "pending";
  }
}

async function loadOrder() {
  try {
    loading.value = true;
    error.value = null;
    const id = route.params.id;
    const { data } = await http.get(`/api/order/${id}`);
    order.value = data;
  } catch (err: any) {
    console.error(err);
    error.value = err?.response?.data?.message || "Unable to load order details";
    toast.show(error.value, "error");
  } finally {
    loading.value = false;
  }
}

onMounted(loadOrder);

function copyId() {
  if (!order.value) return;
  navigator.clipboard.writeText(order.value.orderId);
  toast.show("Order ID copied", "info");
}

// function downloadInvoice() {
//   if (!order.value) return;
//   const blob = new Blob([JSON.stringify(order.value, null, 2)], { type: "application/json" });
//   const url = URL.createObjectURL(blob);
//   const a = document.createElement("a");
//   a.href = url;
//   a.download = `${order.value.orderId}_invoice.json`;
//   a.click();
//   URL.revokeObjectURL(url);
// }

async function downloadPDF() {
  if (!order.value) return;
  window.open(`${API_BASE}/api/order/${order.value.orderId}/invoice`);
}

function reorder() {
  if (!order.value) return;

  order.value.items.forEach(item => {
    cart.add(
      {
        id: Number(item.productId),
        title: item.title,
        price: item.price,
        image: item.image
      },
      item.qty
    );
  });

  toast.show("Items added back to cart", "success");
  router.push("/cart");
}

async function cancelOrder() {
  if (!order.value) return;
  const id = order.value.orderId;

  await http.post(`/api/order/${id}/cancel`);
  toast.show("Order cancelled", "success");
  loadOrder();
}

async function returnOrder() {
  if (!order.value) return;
  const id = order.value.orderId;

  await http.post(`/api/order/${id}/return`);
  toast.show("Return requested", "info");
  loadOrder();
}

function copyTracking() {
  if (!order.value?.shipmentId) {
    navigator.clipboard.writeText("TRK123456789");
    toast.show("Tracking ID copied", "info");
    return;
  }

  navigator.clipboard.writeText(order.value.shipmentId);
  toast.show("Tracking ID copied", "info");
}
</script>

<template>
  <section class="order-page">
    <!-- Loading -->
    <div v-if="loading" class="skeleton">
      <div class="sk-header shimmer"></div>
      <div class="sk-grid">
        <div class="sk-left">
          <div class="sk-card shimmer"></div>
          <div class="sk-card shimmer"></div>
          <div class="sk-card shimmer"></div>
        </div>
        <div class="sk-right">
          <div class="sk-card shimmer"></div>
        </div>
      </div>
    </div>

    <!-- Error / Not found -->
    <div v-else-if="error || !order" class="empty">
      <p>Order not found.</p>
    </div>

    <!-- Content -->
    <div v-else class="content">
      <!-- Header -->
      <header class="header">
        <button class="chip ghost" @click="showTrack = true">Track Shipment</button>
        <div class="head-row">
          <div class="id-group">
            <h1>Order <span class="mono">#{{ order.orderId }}</span></h1>
            <button class="chip ghost" @click="copyId">Copy</button>
          </div>
          <div class="meta">
            <span class="muted">Placed on {{ orderDate }}</span>
            <span class="badge" :class="badgeClass(order.status)">{{ order.status }}</span>
          </div>
        </div>

        <div class="progress">
          <div class="bar"><div class="fill" :style="{ width: progress + '%' }"></div></div>
          <div class="steps">
            <span :class="['step', { active: progress >= 33 }]">Placed</span>
            <span :class="['step', { active: progress >= 66 }]">Shipped</span>
            <span :class="['step', { active: progress >= 100 }]">Delivered</span>
          </div>
          <div v-if="etaText" class="eta">{{ etaText }}</div>
        </div>

        <div class="action-row">
            <button v-if="order.status !== 'Delivered'" class="btn danger" @click="cancelOrder">
              Cancel Order
            </button>

            <button v-if="order.status === 'Delivered'" class="btn ghost" @click="returnOrder">
              Request Return
            </button>
          </div>
      </header>

      <!-- TRACK SHIPMENT MODAL -->
<div v-if="showTrack" class="modal-backdrop" @click.self="showTrack = false">
  <div class="modal">
    <h2>Shipment Tracking</h2>

    <div class="tracking-id-box">
      <p>Tracking ID: <strong>{{ order.shipmentId || "TRK123456789" }}</strong></p>
      <button class="small-btn" @click="copyTracking">Copy</button>
    </div>

    <!-- Timeline -->
    <div class="track-timeline">
      <div class="timeline-step" :class="{ active: order.status !== 'Pending' }">
        <span class="dot"></span>
        <p>Shipped from warehouse</p>
      </div>

      <div class="timeline-step" :class="{ active: order.status === 'Shipped' || order.status === 'Delivered' }">
        <span class="dot"></span>
        <p>In transit</p>
      </div>

      <div class="timeline-step" :class="{ active: order.status === 'Delivered' }">
        <span class="dot"></span>
        <p>Delivered</p>
      </div>
    </div>

    <!-- Map Placeholder -->
    <div class="map-box">
      <p>Live map tracking coming soon…</p>
    </div>

    <button class="close-btn" @click="showTrack = false">Close</button>
  </div>
</div>

      <!-- Grid -->
      <div class="grid">
        <!-- LEFT -->
        <div class="left">
          <section class="card">
            <h2>Shipping Address</h2>
            <div class="address">
              <p class="name">{{ order.address.fullName }}</p>
              <p>{{ order.address.address }}</p>
              <p>{{ order.address.city }}, {{ order.address.country }} - {{ order.address.zip }}</p>
              <p>Phone: {{ order.address.phone }}</p>
              <p class="muted">Email: {{ order.address.email }}</p>
            </div>
          </section>

          <section class="card">
            <h2>Payment</h2>
            <div class="rows">
              <div class="row">
                <span>Method</span>
                <span class="bold">{{ order.paymentMethod }}</span>
              </div>
              <div class="row">
                <span>Status</span>
                <span :class="['pill', order.paymentStatus?.toLowerCase() === 'paid' ? 'pill-paid' : 'pill-pending']">
                  {{ order.paymentStatus }}
                </span>
              </div>
              <p v-if="order.paymentStatus?.toLowerCase() !== 'paid'" class="note">
                Payment will be collected upon delivery for COD.
              </p>
            </div>
          </section>

          <section class="card">
            <h2>Items ({{ order.items.length }})</h2>
            <div class="items">
              <article v-for="it in order.items" :key="it.productId" class="item">
                <img :src="it.image" alt="" />
                <div class="info">
                  <p class="title">{{ it.title }}</p>
                  <p class="muted">Qty: {{ it.qty }} • {{ currency.format(it.price) }} each</p>
                </div>
                <div class="amount">{{ currency.format(it.qty * it.price) }}</div>
              </article>
            </div>
          </section>
        </div>

        <!-- RIGHT (Sticky summary) -->
        <aside class="right">
          <div class="card summary">
            <h2>Summary</h2>
            <div class="sum-row">
              <span>Subtotal</span><span>{{ currency.format(subtotal) }}</span>
            </div>
            <div class="sum-row">
              <span>Shipping</span><span>{{ currency.format(shippingCharge) }}</span>
            </div>
            <div class="divider"></div>
            <div class="sum-row total">
              <span>Total</span><span class="bold">{{ currency.format(total) }}</span>
            </div>

            <button class="btn" @click="downloadPDF">Download Invoice</button>
            <button class="btn secondary" @click="reorder">Re‑order This</button>
          </div>
        </aside>
      </div>
    </div>
    
  </section>
</template>

<style scoped>
.order-page {
  max-width: 1200px;
  margin: 88px auto 32px;
  padding: 0 20px;
  color: var(--text, #e6edf3);
}

/* ======= Header ======= */
.header {
  background: rgba(13,17,23,.72);
  border: 1px solid #2b3139;
  border-radius: 16px;
  box-shadow: 0 10px 28px rgba(0,0,0,.35);
  padding: 16px 18px 14px;
  margin-bottom: 18px;
}
.head-row {
  display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
}
.id-group { display: flex; align-items: center; gap: 10px; }
h1 { margin: 0; font-size: 1.25rem; font-weight: 800; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; }
.meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.muted { opacity: .8; }

.badge {
  padding: 6px 10px; border-radius: 999px; font-weight: 700; font-size: .85rem;
  border: 1px solid transparent;
}
.badge.delivered { background: #22c55e33; color: #4ade80; border-color: #22c55e55; }
.badge.shipped   { background: #3b82f633; color: #60a5fa; border-color: #3b82f655; }
.badge.pending   { background: #fbbf2433; color: #facc15; border-color: #fbbf2455; }
.badge.cancelled { background: #ef444433; color: #ef4444; border-color: #ef444455; }

.progress { margin-top: 10px; }
.bar { height: 8px; background: #1b2330; border-radius: 999px; overflow: hidden; border: 1px solid #2b3139; }
.fill { height: 100%; background: linear-gradient(90deg, #22c55e, #16a34a); width: 0; transition: width .4s ease; }
.steps { display: flex; justify-content: space-between; margin-top: 6px; font-size: .86rem; }
.step { opacity: .5; transition: .2s; }
.step.active { opacity: 1; text-shadow: 0 0 8px #22c55e55; }
.eta { margin-top: 6px; font-size: .86rem; opacity: .85; }

/* ======= Grid ======= */
.grid { display: grid; grid-template-columns: 1fr 320px; gap: 18px; align-items: start; }
.left { min-width: 0; }
.right { position: sticky; top: 96px; }

/* ======= Cards ======= */
.card {
  background: rgba(13,17,23,.7);
  border: 1px solid #2b3139;
  border-radius: 16px;
  box-shadow: 0 10px 28px rgba(0,0,0,.35);
  padding: 16px;
  margin-top: 5px;
}
.card h2 { margin: 0 0 10px; font-size: 1.05rem; }

.chip.ghost {
  border: 1px solid #3a4450; background: transparent; color: var(--text);
  border-radius: 999px; padding: 6px 10px; cursor: pointer; font-size: .85rem;
}

/* Address */
.address .name { font-weight: 800; }

/* Payment */
.rows .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #2b3139; }
.rows .row:last-child { border-bottom: none; }
.pill { padding: 4px 10px; border-radius: 999px; font-weight: 700; font-size: .85rem; }
.pill-paid { background: #22c55e33; color: #4ade80; border: 1px solid #22c55e55; }
.pill-pending { background: #fbbf2433; color: #facc15; border: 1px solid #fbbf2455; }
.note { margin-top: 8px; font-size: .85rem; opacity: .8; }

/* Items */
.items { display: flex; flex-direction: column; gap: 12px; }
.item { display: flex; align-items: center; gap: 12px; }
.item img { width: 62px; height: 62px; object-fit: contain; background: rgba(255,255,255,.06); border-radius: 10px; }
.info .title {
  font-size: .95rem; margin: 0;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.amount { margin-left: auto; font-weight: 800; }

/* Summary */
.summary .sum-row { display: flex; justify-content: space-between; padding: 8px 0; }
.summary .divider { height: 1px; background: #2b3139; margin: 6px 0 8px; }
.summary .total { font-size: 1.05rem; }
.bold { font-weight: 800; }
.btn {
  width: 100%; margin-top: 10px; padding: 12px; border-radius: 12px; border: none;
  background: #238636; color: #fff; cursor: pointer; font-weight: 800;
}
.btn:hover { opacity: .92; transform: translateY(-1px); }

/* ======= Skeleton ======= */
.skeleton .sk-header { height: 86px; border-radius: 16px; background: #0f141a; border: 1px solid #1f2630; }
.skeleton .sk-grid { display: grid; grid-template-columns: 1fr 320px; gap: 18px; margin-top: 12px; }
.skeleton .sk-card { height: 160px; border-radius: 16px; background: #0f141a; border: 1px solid #1f2630; }
.shimmer { position: relative; overflow: hidden; }
.shimmer::after {
  content: ""; position: absolute; inset: 0; transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.06), transparent);
  animation: shimmer 1.2s infinite;
}
@keyframes shimmer { to { transform: translateX(100%); } }

.empty { min-height: 50vh; display: grid; place-items: center; opacity: .8; }

/* ======= Responsive ======= */
@media (max-width: 980px) {
  .grid { grid-template-columns: 1fr; }
  .right { position: static; }
  .header { padding: 14px; }
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.65);
  display: grid;
  place-items: center;
  z-index: 9999;
}

.modal {
  width: min(480px, 90vw);
  background: rgba(13,17,23,.85);
  border: 1px solid #2a313b;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.55);
  animation: fadeUp .35s ease;
}

.tracking-id-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #11161f;
  padding: 10px 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #2a313b;
}

.small-btn {
  background: #238636;
  color: white;
  border: none;
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
}

.track-timeline {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 20px;
}

.timeline-step {
  display: flex;
  align-items: center;
  gap: 10px;
  opacity: .45;
}

.timeline-step.active {
  opacity: 1;
}

.timeline-step .dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #444;
}

.timeline-step.active .dot {
  background: #22c55e;
  box-shadow: 0 0 8px #22c55e;
}

.map-box {
  background: #11161f;
  border: 1px solid #2a313b;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  opacity: .7;
  margin-bottom: 20px;
}

.close-btn {
  width: 100%;
  padding: 10px;
  background: #ef4444;
  border: none;
  color: white;
  border-radius: 10px;
  cursor: pointer;
}
</style>
