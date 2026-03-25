<script setup lang="ts">
import { ref, onMounted } from "vue";
import axios from "axios";
import { RouterLink } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import { http } from "@/api/http";

const auth = useAuthStore();
const toast = useToastStore();
const API_BASE = "http://localhost:5000"; // You can move to env later

interface HistoryOrder {
  orderId: string;
  createdAt: string;
  status: "Delivered" | "Pending" | "Shipped" | "Cancelled";
  amount: number;
  items: { title: string; image: string; qty: number }[];
}

const orders = ref<HistoryOrder[]>([]);
const loading = ref(true);

async function loadOrders() {
  try {
    if (!auth.user?.email) {
      toast.show("Login required", "error");
      return;
    }

    const res = await http.get(`/api/orders/me`);

    orders.value = res.data;
  } catch (err: any) {
    console.error(err);
    toast.show("Unable to fetch orders", "error");
  } finally {
    loading.value = false;
  }
}

onMounted(loadOrders);
</script>

<template>
  <section class="history-page">
    <div class="card glass">

      <h1>My Orders</h1>

      <!-- Loading -->
      <p v-if="loading" class="loading">Loading your orders...</p>

      <!-- Empty -->
      <p v-if="!loading && orders.length === 0" class="empty">
        You haven’t placed any orders yet.
      </p>

      <!-- Orders -->
      <div v-if="!loading" class="list">
        <div
          v-for="order in orders"
          :key="order.orderId"
          class="order-card"
        >
          <div class="row-1">
            <img
              :src="order.items[0]?.image"
              alt="Product"
            />

            <div class="info">
              <h2>#{{ order.orderId }}</h2>
              <p class="date">Placed on: {{ new Date(order.createdAt).toDateString() }}</p>
              <p class="status" :class="order.status.toLowerCase()">{{ order.status }}</p>
            </div>
          </div>

          <div class="row-2">
            <p class="total">₹{{ order.amount }}</p>

            <RouterLink class="btn" :to="`/order/${order.orderId}`">
              View Details
            </RouterLink>
          </div>
        </div>
      </div>

    </div>
  </section>
</template>

<style scoped>
.history-page {
  min-height: calc(100vh - 80px);
  padding: 30px 20px;
  display: grid;
  place-items: center;
}

.card {
  width: min(780px, 92vw);
  background: rgba(13,17,23,0.75);
  border: 1px solid #30363d;
  padding: 30px;
  border-radius: 18px;
  backdrop-filter: blur(12px);
  box-shadow: 0 15px 45px rgba(0,0,0,0.45);
}

.glass {
  background: rgba(255,255,255,0.04);
  backdrop-filter: blur(12px);
}

.loading,
.empty {
  text-align: center;
  opacity: .7;
  margin-top: 20px;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-top: 18px;
}

.order-card {
  border: 1px solid #3a4450;
  padding: 16px;
  background: rgba(255,255,255,0.04);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: .2s ease;
}
.order-card:hover {
  background: rgba(255,255,255,0.07);
  transform: translateY(-2px);
}

.row-1 {
  display: flex;
  gap: 14px;
}

.row-1 img {
  width: 72px;
  height: 72px;
  border-radius: 8px;
  object-fit: contain;
  background: rgba(255,255,255,0.06);
}

.info h2 {
  margin: 0;
  font-size: 1.1rem;
}

.date {
  font-size: .9rem;
  opacity: .75;
}

.status {
  margin-top: 6px;
  padding: 4px 10px;
  border-radius: 8px;
  font-weight: 600;
  display: inline-block;
}

.status.delivered { background: #22c55e33; color: #4ade80; }
.status.shipped { background: #3b82f633; color: #60a5fa; }
.status.pending { background: #fbbf2433; color: #facc15; }
.status.cancelled { background: #ef444433; color: #ef4444; }

.row-2 {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total {
  font-weight: 700;
  font-size: 1.1rem;
}

.btn {
  padding: 8px 14px;
  background: #238636;
  color: white;
  border-radius: 10px;
  text-decoration: none;
  transition: .2s ease;
}
.btn:hover {
  opacity: .85;
}
</style>