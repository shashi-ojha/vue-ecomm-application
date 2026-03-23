<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { http } from "@/api/http";
import { useToastStore } from "@/stores/toast";

const toast = useToastStore();

type UserRow = {
  _id: string;
  email: string;
  name?: string;
  role: "user" | "admin";
  active?: boolean;
  createdAt?: string;
  failedAttempts?: number;       
  lockoutUntil?: string | null;  
};

const q = ref("");
const role = ref<"" | "user" | "admin">("");
const status = ref<"" | "active" | "disabled">("");
const page = ref(1);
const limit = ref(10);

const total = ref(0);
const rows = ref<UserRow[]>([]);
const loading = ref(true);
let debounce: number | undefined;

function fetchUsers() {
  loading.value = true;
  http
    .get("/api/admin/users", {
      params: {
        search: q.value || undefined,
        role: role.value || undefined,
        status: status.value || undefined,
        page: page.value,
        limit: limit.value,
      },
    })
    .then(({ data }) => {
      rows.value = data.items || data || [];
      total.value = data.total ?? rows.value.length;
    })
    .catch((e) => {
      toast.show(e?.response?.data?.message || "Failed to load users", "error");
    })
    .finally(() => (loading.value = false));
}

function onSearch() {
  if (debounce) window.clearTimeout(debounce);
  debounce = window.setTimeout(() => {
    page.value = 1;
    fetchUsers();
  }, 300);
}

async function changeRole(u: UserRow, next: "admin" | "user") {
  try {
    await http.patch(`/api/admin/users/${u._id}/role`, { role: next });
    toast.show("Role updated", "success");
    fetchUsers();
  } catch (e: any) {
    toast.show(e?.response?.data?.message || "Could not update role", "error");
  }
}

async function toggleActive(u: UserRow) {
  try {
    const next = !(u.active ?? true);
    await http.patch(`/api/admin/users/${u._id}/status`, { active: next });
    toast.show(next ? "User enabled" : "User disabled", "success");
    fetchUsers();
  } catch (e: any) {
    toast.show(e?.response?.data?.message || "Could not update status", "error");
  }
}

async function unlock(u: UserRow) {
  try {
    await http.patch(`/api/admin/users/${u._id}/unlock`, {});
    toast.show("Account unlocked!", "success");
    fetchUsers(); // refresh table
  } catch (e: any) {
    toast.show(e?.response?.data?.message || "Could not unlock user", "error");
  }
}

/** Minutes remaining until unlock, or null if not locked */
function minutesToUnlock(lockoutUntil?: string | null): number | null {
  if (!lockoutUntil) return null;
  const until = new Date(lockoutUntil).getTime();
  const now = Date.now();
  if (Number.isNaN(until) || until <= now) return 0;
  return Math.ceil((until - now) / 60000);
}

function nextPage() {
  if (page.value * limit.value < total.value) {
    page.value += 1;
    fetchUsers();
  }
}
function prevPage() {
  if (page.value > 1) {
    page.value -= 1;
    fetchUsers();
  }
}

watch([role, status, limit], () => {
  page.value = 1;
  fetchUsers();
});

onMounted(fetchUsers);
</script>

<template>
  <section class="admin-page">
    <div class="header">
      <h1>Users</h1>
      <div class="actions">
        <input placeholder="Search by email or name…" v-model="q" @input="onSearch" />
        <select v-model="role">
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <select v-model="status">
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
          <option value="locked">Locked</option>
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
        <div>Email</div>
        <div>Name</div>
        <div>Role</div>
        <div>Status</div>
        <div>Created</div>
        <div class="right">Actions</div>
      </div>

      <div v-if="rows.length === 0" class="empty">No users found.</div>

      <div v-for="u in rows" :key="u._id" class="trow">
        <div class="mono">{{ u.email }}</div>
        <div>{{ u.name || "—" }}</div>

        <div>
          <span class="badge" :class="u.role">{{ u.role }}</span>
        </div>

        <div class="status-cell">
          <span class="badge" :class="(u.active ?? true) ? 'active' : 'disabled'">
            {{ (u.active ?? true) ? 'Active' : 'Disabled' }}
          </span>

          <!-- Locked badge, with minutes remaining -->
          <template v-if="u.lockoutUntil">
            <span
              class="badge locked"
              :title="minutesToUnlock(u.lockoutUntil) === 0
                ? 'Unlocks momentarily'
                : `Unlocks in ${minutesToUnlock(u.lockoutUntil)} min`"
            >
              Locked
            </span>
          </template>

          <!-- (Optional) show failed attempts count -->
          <span v-if="(u.failedAttempts ?? 0) > 0" class="faint">
            • Failed: {{ u.failedAttempts }}
          </span>
        </div>

        <div>
          {{ u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—' }}
        </div>

        <div class="right">
          <!-- Role toggle -->
          <button class="ghost" v-if="u.role === 'user'" @click="changeRole(u, 'admin')">
            Make Admin
          </button>
          <button class="ghost" v-else @click="changeRole(u, 'user')">
            Make User
          </button>

          <!-- Enable / Disable -->
          <button class="danger" @click="toggleActive(u)">
            {{ (u.active ?? true) ? 'Disable' : 'Enable' }}
          </button>

          <!-- Unlock Account Button (only if locked) -->
          <button class="warn" v-if="u.lockoutUntil" @click="unlock(u)">
            Unlock
          </button>
        </div>
      </div>

      <div class="pager">
        <button @click="prevPage" :disabled="page === 1">Prev</button>
        <span>Page {{ page }}</span>
        <button @click="nextPage" :disabled="page * limit >= total">Next</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.admin-page { max-width: 1200px; margin: 88px auto 28px; padding: 0 20px; color: var(--text); }
.header { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:12px; }
.actions { display:flex; gap:8px; flex-wrap:wrap; }
.actions input, .actions select {
  background:#0b0f14; border:1px solid #30363d; color:#e6edf3; border-radius:8px; padding:8px 10px;
}
.card.table { background: rgba(13,17,23,.75); border:1px solid #30363d; border-radius:14px; padding:10px; box-shadow: 0 8px 20px rgba(0,0,0,.35);}
.thead, .trow { display:grid; grid-template-columns: 1.3fr 1fr .6fr 1.2fr .8fr .9fr; gap:10px; align-items:center; }
.thead { opacity:.75; padding:8px 0; border-bottom:1px dashed #2c3340; }
.trow { padding:10px 0; border-bottom:1px dashed #2c3340; }
.right { text-align:right; }
.mono { font-family: ui-monospace, Menlo, Consolas, monospace; }

.status-cell { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

.badge { padding:4px 8px; border-radius:999px; font-weight:700; font-size:.78rem; border:1px solid #3a4450; }
.badge.admin { background:#3b82f633; color:#60a5fa; border-color:#3b82f655; }
.badge.user { background:#37415166; color:#cbd5e1; border-color:#475569; }
.badge.active { background:#22c55e33; color:#4ade80; border-color:#22c55e55; }
.badge.disabled { background:#ef444433; color:#ef4444; border-color:#ef444455; }
.badge.locked { background:#ef444433; color:#ef4444; border-color:#ef444455; }

.faint { opacity: .65; font-size: .78rem; }

button.ghost { background:transparent; border:1px solid #30363d; color:#e6edf3; padding:6px 10px; border-radius:8px; margin-left:6px; }
button.danger { background:#ef4444; color:#fff; border:none; padding:6px 10px; border-radius:8px; margin-left:6px; }
button:disabled { opacity:.5; cursor:not-allowed; }
button.warn {
  background: #d97706;
  color: white;
  border: none;
  padding: 6px 10px;
  border-radius: 8px;
  margin-left: 6px;
  cursor: pointer;
}
button.warn:hover { opacity: 0.9; }

.empty { text-align:center; opacity:.8; padding:14px; }
.pager { display:flex; justify-content:flex-end; align-items:center; gap:10px; padding-top:10px; }

.sk.table { height: 260px; background:#0f141a; border:1px solid #1f2630; border-radius:14px; position:relative; overflow:hidden; }
.sk.table::after { content:""; position:absolute; inset:0; transform:translateX(-100%); background:linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent); animation: shimmer 1.2s infinite; }
@keyframes shimmer { to{ transform:translateX(100%); } }

@media (max-width: 1000px){ .thead,.trow{ grid-template-columns: 1.6fr 1fr .7fr 1.2fr 1fr .9fr; } }
@media (max-width: 860px){ .thead,.trow{ grid-template-columns: 1.6fr .8fr .7fr 1.2fr .9fr .9fr; } }
</style>
