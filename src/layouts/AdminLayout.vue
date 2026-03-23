<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, RouterView, useRoute } from "vue-router";
import { useAdminUiStore } from "@/stores/adminUi";
import { useAuthStore } from "@/stores/auth";

const ui = useAdminUiStore();
const auth = useAuthStore();
const route = useRoute();

const isAdmin = computed(() => auth.user?.role === "admin");

// simple items list; you can add icons (emoji here; swap with SVG if you have them)
const items = [
  { to: "/admin", label: "Dashboard", icon: "📊", exact: true },
  { to: "/admin/orders", label: "Orders", icon: "📦" },
  { to: "/admin/users", label: "Users", icon: "🧑‍💼" },
  // { to: "/admin/products", label: "Products", icon: "🛍️" },
  // { to: "/admin/settings", label: "Settings", icon: "⚙️" },
];

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + "/");
}
</script>

<template>
  <div class="admin-shell">
    <!-- Sidebar -->
    <aside
      class="sidebar"
      :class="{ collapsed: ui.collapsed, open: ui.mobileOpen }"
      aria-label="Admin sidebar"
    >
      <div class="side-inner">
        <div class="brand" :title="ui.collapsed ? 'Admin' : ''">
          <span class="logo">🛠️</span>
          <strong v-if="!ui.collapsed">Admin</strong>
        </div>

        <nav class="menu">
          <RouterLink
            v-if="auth.user?.role === 'admin'"
            v-for="it in items"
            :key="it.to"
            :to="it.to"
            class="menu-item"
            :class="{ active: isActive(it.to) }"
            :title="ui.collapsed ? it.label : ''"
          >
            <span class="icon" aria-hidden="true">{{ it.icon }}</span>
            <span v-if="!ui.collapsed" class="label">{{ it.label }}</span>
          </RouterLink>
        </nav>

        <div class="grow"></div>

        <!-- Footer block: user/role -->
        <div class="foot">
          <div class="user-chip" :title="auth.user?.email">
            <div class="avatar">{{ auth.user?.email?.charAt(0).toUpperCase() || "?" }}</div>
            <div v-if="!ui.collapsed" class="meta">
              <div class="email">{{ auth.user?.email }}</div>
              <div class="role">{{ auth.user?.role }}</div>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- Overlay for mobile -->
    <div v-if="ui.mobileOpen" class="overlay" @click="ui.closeMobile()" aria-hidden="true"></div>

    <!-- Main content -->
    <div class="main">
      <header class="topbar">
        <button class="hamburger" @click="ui.openMobile()" aria-label="Open menu">
          ☰
        </button>
        <button class="collapse-btn" @click="ui.toggle()" aria-label="Toggle sidebar">
          <span v-if="ui.collapsed">⟩</span><span v-else>⟨</span>
        </button>

        <div class="crumbs">
          <span class="trail">Admin</span>
          <span class="sep">/</span>
          <span class="trail">{{ route.meta?.title || 'Dashboard' }}</span>
        </div>
      </header>

      <main class="content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-shell {
  display: grid;
  grid-template-columns: 260px 1fr;
  min-height: calc(100vh - 0px); /* header already sticky in app; layout starts below if needed */
}

/* Sidebar */
.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  background: rgba(13,17,23,.82);
  border-right: 1px solid #2b3139;
  box-shadow: 0 8px 24px rgba(0,0,0,.35);
  transition: width .2s ease;
  width: 260px;
  z-index: 50;
}
.sidebar.collapsed { width: 84px; }

/* mobile: hide off-canvas */
@media (max-width: 1024px) {
  .admin-shell { grid-template-columns: 1fr; }
  .sidebar {
    position: fixed;
    left: -280px;
    width: 260px;
    height: 100vh;
    transition: left .2s ease;
  }
  .sidebar.open { left: 0; }
}

/* inner */
.side-inner {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 12px;
}
.brand {
  display:flex; align-items:center; gap:10px;
  padding: 10px; border-radius: 10px; margin-bottom: 10px;
  background: rgba(255,255,255,0.02); border: 1px solid #2b3139;
}
.logo { font-size: 1.2rem; }

.menu { display: flex; flex-direction: column; gap: 4px; margin-top: 6px; }
.menu-item {
  display:flex; align-items:center; gap: 10px;
  padding: 10px 12px; border-radius: 10px;
  color: var(--text, #e6edf3); text-decoration: none;
  border: 1px solid transparent;
}
.menu-item:hover { background: rgba(255,255,255,0.05); border-color: #2b3139; }
.menu-item.active { background: rgba(35,134,54,0.15); border-color: #23863644; }
.icon { width: 22px; display:inline-grid; place-items:center; opacity:.95; }
.label { white-space: nowrap; }

.grow { flex:1; }

.foot { padding: 8px 6px; }
.user-chip {
  display:flex; align-items:center; gap:10px;
  padding: 10px; border-radius: 10px;
  background: rgba(255,255,255,0.02); border: 1px solid #2b3139;
}
.avatar {
  width: 34px; height: 34px; border-radius: 50%;
  background:#238636; color:white; display:grid; place-items:center; font-weight: 800;
}
.meta .email { font-size: .9rem; }
.meta .role { font-size: .78rem; opacity: .75; }

/* Mobile overlay */
.overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.45);
  z-index: 40;
}

/* Main */
.main { min-width: 0; background:#0b0f14; }
.topbar {
  position: sticky; top: 0; z-index: 10;
  display:flex; align-items:center; gap: 10px;
  height: 54px; padding: 0 16px;
  background: rgba(13,17,23,.72);
  border-bottom: 1px solid #2b3139;
  backdrop-filter: blur(8px);
}
.hamburger {
  display:none;
  border:1px solid #2b3139; background:transparent; color:var(--text); border-radius:8px;
  padding: 6px 10px; cursor:pointer;
}
@media (max-width: 1024px) {
  .hamburger { display:inline-block; }
}
.collapse-btn {
  border:1px solid #2b3139; background:transparent; color:var(--text); border-radius:8px;
  padding: 6px 10px; cursor:pointer;
}
.crumbs { margin-left: auto; opacity:.9; font-size: .95rem; }
.sep { opacity: .6; margin: 0 6px; }

.content {
  /* wide, breathable container */
  width: 100%;
  max-width: 1680px;
  margin: 0 auto;
  padding: 16px 24px 28px;
}
</style>
