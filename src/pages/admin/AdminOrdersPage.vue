<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { http } from "@/api/http";
import { useToastStore } from "@/stores/toast";

const toast = useToastStore();

type Row = {
  orderId: string;
  userEmail?: string;
  address?: { fullName?: string };
  amount: number;
  shipping?: number;
  paymentStatus: string;
  status: string;
  createdAt: string;
};

const q = ref("");
const status = ref<"" | "Placed" | "Shipped" | "Delivered" | "Cancelled">("");
const payment = ref<"" | "Paid" | "Pending" | "Failed">("");
const page = ref(1);
const limit = ref(10);
const total = ref(0);
const rows = ref<Row[]>([]);
const loading = ref(true);
let debounce: number | undefined;

function fetchOrders() {
  loading.value = true;
  http.get("/api/admin/orders", {
    params: {
      search: q.value || undefined,
      status: status.value || undefined,
      paymentStatus: payment.value || undefined,
      page: page.value,
      limit: limit.value,
    },
  })
  .then(({ data }) => {
    rows.value = data.items || data || [];
    total.value = data.total ?? rows.value.length;
  })
  .catch((e) => toast.show(e?.response?.data?.message || "Failed to load orders", "error"))
  .finally(() => loading.value = false);
}

function onSearch() {
  if (debounce) clearTimeout(debounce);
  debounce = window.setTimeout(() => {
    page.value = 1;
    fetchOrders();
  }, 300);
}

async function setStatus(o: Row, next: "Shipped" | "Delivered" | "Cancelled") {
  try {
    await http.patch(`/api/admin/orders/${o.orderId}/status`, { status: next });
    toast.show(`Order ${o.orderId} → ${next}`, "success");
    fetchOrders();
  } catch (e:any) {
    toast.show(e?.response?.data?.message || "Could not update status", "error");
  }
}

function nextPage(){ if (page.value * limit.value < total.value) page.value += 1, fetchOrders(); }
function prevPage(){ if (page.value > 1) page.value -= 1, fetchOrders(); }

watch([status, payment, limit], () => { page.value = 1; fetchOrders(); });
onMounted(fetchOrders);
</script>

<template>
  <section class="admin-page">
    <div class="header">
      <h1>Orders</h1>
      <div class="filters">
        <input placeholder="Search by order id / email / name…" v-model="q" @input="onSearch" />
        <select v-model="status">
          <option value="">All statuses</option>
          <option>Placed</option>
          <option>Shipped</option>
          <option>Delivered</option>
          <option>Cancelled</option>
        </select>
        <select v-model="payment">
          <option value="">Any payment</option>
          <option>Paid</option>
          <option>Pending</option>
          <option>Failed</option>
        </select>
        <select v-model="limit">
          <option :value="10">10 / page</option>
          <option :value="20">20 / page</option>
          <option :value="50">50 / page</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="sk table"></div>

    <div v-else class="card table">
      <div class="thead">
        <div>Order ID</div>
        <div>Customer</div>
        <div class="right">Amount</div>
        <div>Payment</div>
        <div>Status</div>
        <div>Date</div>
        <div class="right">Actions</div>
      </div>

      <div v-if="rows.length===0" class="empty">No orders found.</div>

      <div v-for="o in rows" :key="o.orderId" class="trow">
        <div class="mono">#{{ o.orderId }}</div>
        <div>{{ o.address?.fullName || o.userEmail || "—" }}</div>
        <div class="right">₹{{ (o.amount + (o.shipping ?? 0)).toLocaleString() }}</div>
        <div><span class="badge" :class="(o.paymentStatus || '').toLowerCase()">{{ o.paymentStatus }}</span></div>
        <div><span class="badge" :class="(o.status || '').toLowerCase()">{{ o.status }}</span></div>
        <div>{{ new Date(o.createdAt).toLocaleString() }}</div>
        <div class="right">
          <RouterLink class="ghost" :to="`/order/${o.orderId}`">View</RouterLink>
          <button class="ghost" v-if="o.status==='Placed'" @click="setStatus(o,'Shipped')">Mark Shipped</button>
          <button class="ghost" v-if="o.status==='Shipped'" @click="setStatus(o,'Delivered')">Mark Delivered</button>
          <button class="danger" v-if="o.status!=='Cancelled' && o.status!=='Delivered'" @click="setStatus(o,'Cancelled')">Cancel</button>
        </div>
      </div>

      <div class="pager">
        <button @click="prevPage" :disabled="page===1">Prev</button>
        <span>Page {{ page }}</span>
        <button @click="nextPage" :disabled="page * limit >= total">Next</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.admin-page { max-width: 1200px; margin: 88px auto 28px; padding: 0 20px; color: var(--text); }
.header { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:12px; }
.filters { display:flex; gap:8px; flex-wrap:wrap; }
.filters input, .filters select { background:#0b0f14; border:1px solid #30363d; color:#e6edf3; border-radius:8px; padding:8px 10px; }

.card.table { background: rgba(13,17,23,.75); border:1px solid #30363d; border-radius:14px; padding:10px; box-shadow: 0 8px 20px rgba(0,0,0,.35);}
.thead, .trow { display:grid; grid-template-columns: 1.2fr 1fr .7fr .8fr .8fr 1fr .9fr; gap:10px; align-items:center; }
.thead { opacity:.75; padding:8px 0; border-bottom:1px dashed #2c3340; }
.trow { padding:10px 0; border-bottom:1px dashed #2c3340; }
.mono { font-family: ui-monospace, Menlo, Consolas, monospace; }
.right { text-align:right; }
.badge { padding:4px 8px; border-radius:999px; font-weight:700; font-size:.78rem; border:1px solid #3a4450; }
.badge.paid { background:#22c55e33; color:#4ade80; border-color:#22c55e55; }
.badge.pending { background:#fbbf2433; color:#facc15; border-color:#fbbf2455; }
.badge.failed { background:#ef444433; color:#ef4444; border-color:#ef444455; }
.badge.placed,.badge.shipped { background:#3b82f633; color:#60a5fa; border-color:#3b82f655; }
.badge.delivered { background:#22c55e33; color:#4ade80; border-color:#22c55e55; }
.badge.cancelled { background:#ef444433; color:#ef4444; border-color:#ef444455; }

button.ghost, a.ghost { background:transparent; border:1px solid #30363d; color:#e6edf3; padding:6px 10px; border-radius:8px; margin-left:6px; text-decoration:none; }
button.danger { background:#ef4444; color:#fff; border:none; padding:6px 10px; border-radius:8px; margin-left:6px; }

.empty { text-align:center; opacity:.8; padding:14px; }
.pager { display:flex; justify-content:flex-end; align-items:center; gap:10px; padding-top:10px; }
.sk.table { height: 260px; background:#0f141a; border:1px solid #1f2630; border-radius:14px; position:relative; overflow:hidden; }
.sk.table::after { content:""; position:absolute; inset:0; transform:translateX(-100%); background:linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent); animation: shimmer 1.2s infinite; }
@keyframes shimmer { to{ transform:translateX(100%); } }

@media (max-width: 1000px){ .thead,.trow{ grid-template-columns: 1.5fr 1fr .8fr .9fr .9fr 1.1fr .9fr; } }
</style>
