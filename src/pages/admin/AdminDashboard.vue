<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { http } from "@/api/http";
import { useToastStore } from "@/stores/toast";

type Stats = {
  usersCount: number;
  ordersCount: number;
  revenue: number;
  todayRevenue: number;
  refunds: number;
  growthPct: number;
  ordersByDay: { day: string; count: number }[];
  lockedUsersCount: number;
};

const toast = useToastStore();

const stats = ref<Stats | null>(null);
const recentOrders = ref<any[]>([]);
const loading = ref(true);

// Monthly revenue (Jan..Dec)
const monthlyRevenue = ref<number[]>(new Array(12).fill(0));
const monthLabels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/** Load stats + recent orders + try monthly revenue, fallback to in-browser aggregation */
async function load() {
  try {
    const [{ data: s }, { data: rec }] = await Promise.all([
      http.get("/api/admin/stats"),
      http.get("/api/admin/orders", { params: { limit: 200 } }), // pull enough to aggregate months
    ]);
    stats.value = s;
    recentOrders.value = rec?.items || rec || [];

    // Try dedicated endpoint if you add it later
    try {
      const { data: m } = await http.get("/api/admin/revenue-monthly");
      if (Array.isArray(m?.values) && m.values.length === 12) {
        monthlyRevenue.value = m.values;
      } else {
        aggregateMonthlyFromOrders();
      }
    } catch {
      aggregateMonthlyFromOrders();
    }
  } catch (e: any) {
    toast.show(e?.response?.data?.message || "Failed to load admin data", "error");
  } finally {
    loading.value = false;
  }
}

/** Fallback: compute monthly revenue from recentOrders (amount + shipping) */
function aggregateMonthlyFromOrders() {
  const buckets = new Array(12).fill(0);
  for (const o of recentOrders.value) {
    const d = new Date(o.createdAt);
    if (Number.isNaN(d.getTime())) continue;
    const idx = d.getMonth();
    const amt = Number(o.amount || 0) + Number(o.shipping || 0);
    buckets[idx] += amt;
  }
  monthlyRevenue.value = buckets;
}

/* ---------- ApexCharts options (dark theme) ---------- */

// Primary surface & accent colors (keep in sync with your site)
const COLOR_BG = "#0b0f14";      // page bg (matches home/sidebar)
const COLOR_CARD = "#0d1117";    // card bg
const COLOR_BORDER = "#30363d";  // border
const COLOR_TEXT = "#e6edf3";    // text
const GRAD_1 = "#3b82f6";        // blue
const GRAD_2 = "#10b981";        // green
const ACCENT  = "#f59e0b";       // amber
const DANGER  = "#ef4444";       // red

const areaOptions = computed(() => ({
  chart: {
    id: "monthly-revenue",
    type: "area",
    height: 300,
    foreColor: "#c9d1d9",
    toolbar: { show: false },
    animations: { enabled: true, easing: "easeinout", speed: 700 },
    fontFamily: "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif",
    background: "transparent"
  },
  colors: [GRAD_1],
  stroke: { width: 3, curve: "smooth" },
  fill: {
    type: "gradient",
    gradient: {
      shade: "dark",
      gradientToColors: [GRAD_2],
      shadeIntensity: 1,
      type: "vertical",
      opacityFrom: 0.45,
      opacityTo: 0.05,
      stops: [0, 100]
    }
  },
  grid: {
    borderColor: COLOR_BORDER,
    strokeDashArray: 4,
  },
  dataLabels: { enabled: false },
  xaxis: {
    categories: monthLabels,
    labels: { style: { colors: Array(12).fill("#9da7b1") } },
    axisBorder: { color: COLOR_BORDER },
    axisTicks: { color: COLOR_BORDER }
  },
  yaxis: {
    labels: {
      formatter: (v: number) => `₹${Math.round(v).toLocaleString()}`,
      style: { colors: ["#9da7b1"] }
    }
  },
  tooltip: {
    theme: "dark",
    y: { formatter: (v: number) => `₹${Math.round(v).toLocaleString()}` }
  }
}));

const areaSeries = computed(() => [
  { name: "Revenue", data: monthlyRevenue.value }
]);

// Orders (7 days) small Columns
const days = computed(() => stats.value?.ordersByDay?.map(d => d.day) || []);
const dayCounts = computed(() => stats.value?.ordersByDay?.map(d => d.count) || []);

const barOptions = computed(() => ({
  chart: {
    id: "orders-7-days",
    type: "bar",
    height: 300,
    foreColor: "#c9d1d9",
    toolbar: { show: false },
    animations: { enabled: true, easing: "easeinout", speed: 600 },
    background: "transparent"
  },
  plotOptions: {
    bar: {
      columnWidth: "45%",
      borderRadius: 6
    }
  },
  colors: [ACCENT],
  dataLabels: { enabled: false },
  grid: {
    borderColor: COLOR_BORDER,
    strokeDashArray: 4,
  },
  xaxis: {
    categories: days.value,
    labels: { style: { colors: Array(days.value.length).fill("#9da7b1") } },
    axisBorder: { color: COLOR_BORDER },
    axisTicks: { color: COLOR_BORDER }
  },
  yaxis: {
    labels: {
      style: { colors: ["#9da7b1"] }
    }
  },
  tooltip: { theme: "dark" }
}));

const barSeries = computed(() => [
  { name: "Orders", data: dayCounts.value }
]);

onMounted(load);
</script>

<template>
  <section class="dashboard">
    <!-- Header -->
    <div class="topbar">
      <h1>Admin Dashboard</h1>
      <div class="toolbar">
        <span class="tag">Fiscal Year</span>
        <div class="chips">
          <button class="chip active">2026</button>
          <button class="chip">2025</button>
          <button class="chip">2024</button>
        </div>
      </div>
    </div>

    <!-- KPI strip -->
    <div class="kpi-strip" v-if="!loading">
      <div class="kpi">
        <div class="ico blue">👥</div>
        <div class="meta">
          <div class="label">Users</div>
          <div class="val">{{ stats?.usersCount?.toLocaleString() }}</div>
        </div>
      </div>

      <div class="kpi">
        <div class="ico purple">🛒</div>
        <div class="meta">
          <div class="label">Orders</div>
          <div class="val">{{ stats?.ordersCount?.toLocaleString() }}</div>
        </div>
      </div>

      <div class="kpi">
        <div class="ico green">💰</div>
        <div class="meta">
          <div class="label">Revenue</div>
          <div class="val">₹{{ stats?.revenue?.toLocaleString() }}</div>
        </div>
      </div>

      <div class="kpi">
        <div class="ico amber">📈</div>
        <div class="meta">
          <div class="label">Today</div>
          <div class="val">₹{{ stats?.todayRevenue?.toLocaleString() }}</div>
        </div>
      </div>

      <RouterLink class="kpi link" :to="{ name:'admin-users', query:{ status:'locked' } }">
        <div class="ico red">🔒</div>
        <div class="meta">
          <div class="label">Locked Users</div>
          <div class="val">{{ stats?.lockedUsersCount?.toLocaleString() }}</div>
        </div>
      </RouterLink>
    </div>

    <!-- Skeleton -->
    <div v-else class="skeleton">
      <div class="sk kpi"></div><div class="sk kpi"></div><div class="sk kpi"></div><div class="sk kpi"></div><div class="sk kpi"></div>
      <div class="sk panel"></div><div class="sk panel"></div><div class="sk table"></div>
    </div>

    <!-- Charts Row -->
    <div class="row">
      <div class="card">
        <div class="card-head">
          <h2>Monthly Revenue</h2>
          <span class="sub">Jan - Dec</span>
        </div>
        <apexchart
          type="area"
          height="300"
          :options="areaOptions"
          :series="areaSeries"
        />
      </div>

      <div class="card">
        <div class="card-head">
          <h2>Orders (last 7 days)</h2>
          <span class="sub">Daily totals</span>
        </div>
        <apexchart
          type="bar"
          height="300"
          :options="barOptions"
          :series="barSeries"
        />
      </div>
    </div>

    <!-- Recent Orders -->
    <div class="card table">
      <div class="card-head">
        <h2>Recent Orders</h2>
        <span class="sub">Latest activity</span>
      </div>

      <div class="thead">
        <div>Order ID</div>
        <div>Customer</div>
        <div class="right">Amount</div>
        <div>Status</div>
        <div>Date</div>
      </div>

      <div v-if="recentOrders.length === 0" class="empty">No recent orders.</div>

      <div v-for="o in recentOrders" :key="o.orderId" class="trow">
        <div class="mono">#{{ o.orderId }}</div>
        <div>{{ o.address?.fullName || o.userEmail || '—' }}</div>
        <div class="right">₹{{ (o.amount + (o.shipping ?? 0)).toLocaleString() }}</div>
        <div><span class="badge" :class="(o.status || '').toLowerCase()">{{ o.status }}</span></div>
        <div>{{ new Date(o.createdAt).toLocaleDateString() }}</div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* -------------- Dark theme that MATCHES your sidebar/home -------------- */
:root {
  color-scheme: dark;
}
.dashboard {
  width: 100%;
  min-height: calc(100vh - 60px);
  padding: 18px 22px 28px;

  /* Match your home/sidebar gradient look */
  background:
    radial-gradient(950px 420px at 20% -10%, rgba(35,134,54,0.10), transparent 60%),
    radial-gradient(700px 380px at 110% 90%, rgba(99,102,241,0.10), transparent 60%),
    #0b0f14; /* base */
  color: #e6edf3;
}

/* Header */
.topbar {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 14px;
}
.topbar h1 { font-weight: 800; font-size: 1.6rem; opacity: .95; }
.toolbar { display:flex; align-items:center; gap: 10px; }
.tag {
  background: rgba(255,255,255,0.04);
  border: 1px solid #30363d; border-radius: 8px;
  padding: 6px 10px; font-size: .85rem; opacity: .9;
}
.chips { display:flex; gap: 6px; }
.chip {
  background: transparent; border: 1px solid #30363d; color: #e6edf3;
  padding: 6px 10px; border-radius: 8px; cursor: pointer;
}
.chip.active { background: #238636; border-color: #238636; }

/* KPI strip (single row, responsive) */
.kpi-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}
.kpi, .kpi.link {
  display: flex; align-items: center; gap: 12px;
  background: #0d1117; border: 1px solid #30363d; border-radius: 14px;
  padding: 14px; text-decoration: none; color: #e6edf3;
  box-shadow: 0 8px 24px rgba(0,0,0,0.25);
  transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease;
}
.kpi:hover { transform: translateY(-2px); border-color: #3b4450; box-shadow: 0 10px 28px rgba(0,0,0,0.35); }
.ico {
  width: 44px; height: 44px; display:grid; place-items:center; border-radius: 12px;
  font-weight: 800; color: #fff; font-size: 20px;
}
.blue { background:#3b82f6; }
.purple { background:#8b5cf6; }
.green { background:#10b981; }
.amber { background:#f59e0b; }
.red { background:#ef4444; }
.meta .label { font-size:.78rem; text-transform: uppercase; letter-spacing: .5px; opacity: .75; }
.meta .val { font-weight: 800; font-size: 1.4rem; }

/* Content row (charts) */
.row {
  display: grid; gap: 16px; grid-template-columns: 1fr 1fr;
  margin-bottom: 18px;
}
.card {
  background: #0d1117; border: 1px solid #30363d; border-radius: 14px;
  padding: 14px; box-shadow: 0 8px 24px rgba(0,0,0,0.25);
}
.card-head { display:flex; align-items:center; justify-content:space-between; margin-bottom: 10px; }
.card-head h2 { font-size: 1.05rem; font-weight: 800; }
.card-head .sub { opacity: .7; font-size: .85rem; }

/* Table */
.card.table { padding: 14px; }
.thead, .trow {
  display:grid; grid-template-columns: 1.2fr 1fr .8fr .9fr 1fr; gap: 10px; align-items:center;
}
.thead { opacity:.75; border-bottom: 1px dashed #2c3340; padding: 6px 0; }
.trow { padding: 10px 0; border-bottom: 1px dashed #2c3340; }
.right { text-align: right; }
.mono { font-family: ui-monospace, Menlo, Consolas, monospace; }
.badge {
  padding: 3px 8px; border-radius: 999px; font-weight: 700; font-size: .78rem; border: 1px solid #3a4450;
}
.badge.placed,.badge.shipped { background:#3b82f633; color:#60a5fa; border-color:#3b82f655; }
.badge.delivered { background:#22c55e33; color:#4ade80; border-color:#22c55e55; }
.badge.cancelled { background:#ef444433; color:#ef4444; border-color:#ef444455; }

/* Skeletons */
.skeleton {
  display:grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}
.sk { background:#0f141a; border:1px solid #1f2630; border-radius:14px; height: 92px; position:relative; overflow:hidden; }
.sk.panel { grid-column: span 1; height: 300px; }
.sk.table { grid-column: 1/-1; height: 300px; }
.sk::after { content:""; position:absolute; inset:0; transform:translateX(-100%); background:linear-gradient(90deg,transparent,rgba(255,255,255,.05),transparent); animation: shimmer 1.2s infinite; }
@keyframes shimmer { to{ transform: translateX(100%);} }

/* Responsive tweaks */
@media (max-width: 980px) {
  .row { grid-template-columns: 1fr; }
  .thead, .trow { grid-template-columns: 1.4fr .9fr .8fr .9fr 1fr; }
}
</style>