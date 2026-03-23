<script setup lang="ts">
import { RouterLink, useRouter } from "vue-router";
import { useCartStore } from "@/stores/cart";
import { useAuthStore } from "@/stores/auth";
import { useThemeStore } from "@/stores/theme";
import { computed, ref } from "vue";

const cart = useCartStore();
const auth = useAuthStore();
const theme = useThemeStore();
const router = useRouter();

const menuOpen = ref(false);

function toggleMenu() {
  menuOpen.value = !menuOpen.value;
}

async function handleLogout() {
  await auth.logout();
  router.push("/login"); // or "/"
}

// Computed avatar text (first letter)
const avatarText = computed(() => {
  if (!auth.user?.email) return "?";
  return auth.user.email.charAt(0).toUpperCase();
});
</script>

<template>
  <header class="header">
    <div class="container">

      <!-- Brand -->
      <RouterLink to="/" class="brand">
        <span class="logo">🛒</span> E‑Shop
      </RouterLink>

      <!-- Navigation -->
      <nav class="nav">

        <RouterLink class="nav-link" to="/">Home</RouterLink>
        <RouterLink class="nav-link" to="/products">Products</RouterLink>
        <RouterLink class="nav-link" to="/about">About</RouterLink>
        
        <RouterLink
          v-if="auth.isLoggedIn && auth.user?.role === 'admin'"
          class="nav-link"
          to="/admin"
        >
          Admin
        </RouterLink>


        <!-- Not logged in -->
        <RouterLink v-if="!auth.isLoggedIn" to="/login" class="login-btn">
          Login
        </RouterLink>

        <!-- Logged in -->
        <!-- USER MENU (when logged in) -->
        <div v-if="auth.isLoggedIn" class="user-wrapper">
          
          <!-- Cart -->
          <RouterLink class="cart" to="/cart">
            🛒
            <span v-if="cart.count" class="badge">{{ cart.count }}</span>
          </RouterLink>

          <!-- Avatar -->
          <button class="avatar-btn" @click="menuOpen = !menuOpen">
            {{ avatarText }}
          </button>

          <!-- Dropdown -->
          <transition name="fade-scale">
            <div v-if="menuOpen" class="menu-panel">
              
              <div class="user-row">
                <div class="big-avatar">{{ avatarText }}</div>
                <div class="email">{{ auth.user?.email }}</div>
              </div>

              <RouterLink class="menu-item" @click="menuOpen=false" to="/profile">
                Profile
              </RouterLink>

              <RouterLink v-if="auth.isLoggedIn" to="/orders" class="menu-item">
                My Orders
              </RouterLink>

              <button class="menu-item logout" @click="handleLogout">
                Logout
              </button>

            </div>
          </transition>
        </div>

        <!-- Theme toggle -->
        <button class="theme-btn" @click="theme.toggle()">
          {{ theme.theme === 'dark' ? '🌞' : '🌙' }}
        </button>

      </nav>
    </div>
  </header>
</template>

<style scoped>
/* HEADER BASE */
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--card, #0d1117);
  border-bottom: 1px solid #30363d;
  padding: 14px 0;
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  display: flex; align-items: center;
  gap: 8px;
  color: var(--text);
  text-decoration: none;
  font-size: 1.25rem;
  font-weight: 700;
}

/* NAVIGATION */
.nav {
  display: flex;
  align-items: center;
  gap: 20px;
}

.nav-link {
  color: var(--text);
  text-decoration: none;
  opacity: .9;
}
.nav-link:hover { opacity: 1; }

/* LOGIN BUTTON */
.login-btn {
  padding: 8px 14px;
  border: 1px solid #238636;
  color: #238636;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
}

/* CART ICON */
.cart {
  position: relative;
  color: var(--text);
  text-decoration: none;
}
.badge {
  background: #ef4444;
  color: white;
  padding: 2px 6px;
  border-radius: 50%;
  font-size: .75rem;
  position: absolute;
  top: -6px; right: -10px;
}

/* AVATAR BUTTON */
.avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  background: #238636;
  color: white;
  font-weight: 700;
  cursor: pointer;
  font-size: 1rem;
}

/* DROPDOWN */
.dropdown-menu {
  position: absolute;
  right: 0;
  margin-top: 10px;
  background: var(--card);
  border: 1px solid #30363d;
  border-radius: 12px;
  padding: 12px;
  width: 200px;
  box-shadow: 0 4px 22px rgba(0,0,0,0.2);
}

.user-section {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #30363d;
  margin-bottom: 10px;
}

/* THEME BTN */
.theme-btn {
  border: 1px solid #444;
  background: none;
  padding: 6px 10px;
  border-radius: 8px;
  color: var(--text);
  cursor: pointer;
}

/* ANIMATIONS */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.18s ease;
}

.fade-scale-enter-from {
  transform: scale(0.95);
  opacity: 0;
}
.fade-scale-leave-to {
  transform: scale(0.95);
  opacity: 0;
}

.user-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
}

/* Avatar Button */
.avatar-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  background: #238636;
  color: white;
  font-weight: 700;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform .15s ease;
}
.avatar-btn:hover {
  transform: scale(1.05);
}

/* Dropdown menu */
.menu-panel {
  position: absolute;
  top: 48px; /* directly below avatar */
  right: 0;
  width: 220px;

  background: var(--card, #0d1117);
  border: 1px solid #30363d;
  padding: 12px;
  border-radius: 12px;

  box-shadow: 0 6px 20px rgba(0,0,0,0.35);
  backdrop-filter: blur(6px);

  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 999;
}

/* Fade animation */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.15s ease;
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}

/* Top user row inside dropdown */
.user-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #30363d;
  margin-bottom: 8px;
}

.big-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #238636;
  color: white;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}

.email {
  font-size: 0.85rem;
  opacity: .85;
}

/* Menu items */
.menu-item {
  padding: 8px 10px;
  border-radius: 8px;
  text-decoration: none;
  color: var(--text);
  text-align: left;
}
.menu-item:hover {
  background: rgba(255,255,255,0.05);
}

.logout {
  color: #ef4444;
}
.logout:hover {
  background: rgba(239,68,68,0.15);
}
</style>