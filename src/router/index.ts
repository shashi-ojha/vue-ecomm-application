import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { useAuthStore } from "@/stores/auth";

// Lazy-loaded pages
const HomePage = () => import("../pages/HomePage.vue");
const AboutPage = () => import("../pages/AboutPage.vue");
const ProductPage = () => import("../pages/ProductPage.vue");
const ProductDetailPage = () => import("@/pages/ProductDetailPage.vue");
const CartPage = () => import("@/pages/CartPage.vue");
const CheckoutPage = () => import("@/pages/CheckoutPage.vue");
const LoginPage = () => import("@/pages/LoginPage.vue");
const RegisterPage = () => import("@/pages/RegisterPage.vue");
const OrderSuccessPage = () => import("@/pages/OrderSuccessPage.vue");
const PaymentPage = () => import("@/pages/PaymentPage.vue");
const OrderHistoryPage = () => import("@/pages/OrderHistoryPage.vue");
const OrderDetailPage = () => import("@/pages/OrderDetailPage.vue");
const UserProfilePage = () => import("@/pages/UserProfilePage.vue");
const UserProfileEditPage = () => import("@/pages/UserProfileEdit.vue");

const AdminDashboard = () => import("@/pages/admin/AdminDashboard.vue");
// const AdminOrders = () => import("@/pages/admin/AdminOrders.vue");


const routes: RouteRecordRaw[] = [
  { path: "/", name: "home", component: HomePage, meta: { title: "Home" } },
  { path: "/products", name: "products", component: ProductPage },
  { path: "/products/:id", name: "product-detail", component: ProductDetailPage },
  { path: "/product/:id", redirect: (to) => `/products/${to.params.id}` },

  { path: "/about", name: "about", component: AboutPage },

  { path: "/cart", name: "cart", component: CartPage },

  // AUTH
  { path: "/login", name: "login", component: LoginPage },
  { path: "/register", name: "register", component: RegisterPage },

  // PROTECTED ROUTES
  {
    path: "/checkout",
    name: "checkout",
    component: CheckoutPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/payment",
    name: "payment",
    component: PaymentPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/order-success",
    name: "order-success",
    component: OrderSuccessPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/orders",
    name: "orders",
    component: OrderHistoryPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/profile",
    name: "profile",
    component: UserProfilePage,
    meta: { requiresAuth: true },
  },
  {
    path: "/profile/edit",
    name: "profile-edit",
    component: UserProfileEditPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/order/:id",
    name: "order-detail",
    component: OrderDetailPage,
    meta: { requiresAuth: true },
  },
  { 
    path: "/auth/magic", 
    name: "magic-verify", 
    component: () => import("@/pages/MagicVerifyPage.vue") 
  },
  
{
  path: "/admin",
  component: () => import("@/layouts/AdminLayout.vue"),
  meta: { requiresAuth: true, requiresRole: "admin" },
  children: [
    {
      path: "",
      name: "admin-dashboard",
      component: () => import("@/pages/admin/AdminDashboard.vue"),
      meta: { title: "Dashboard" }
    },
    {
      path: "orders",
      name: "admin-orders",
      component: () => import("@/pages/admin/AdminOrdersPage.vue"),
      meta: { title: "Orders" }
    },
    {
      path: "users",
      name: "admin-users",
      component: () => import("@/pages/admin/AdminUsersPage.vue"),
      meta: { title: "Users" }
    },
    // Add more admin children here...
  ]
},
  {
    path: "/auth/forgot-password",
    name: "forgot-password",
    component: () => import("@/pages/auth/ForgotPassword.vue"),
  },

  {
    path: "/auth/reset-password",
    name: "reset-password",
    component: () => import("@/pages/auth/ResetPassword.vue"),
  },
  { path: "/forbidden", name: "forbidden", component: () => import("@/pages/ForbiddenPage.vue") },


  // 404
  { path: "/:pathMatch(.*)*", redirect: "/" },
];

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

// Set document title
router.afterEach((to) => {
  const base = "My Vue Site";
  document.title = to.meta?.title ? `${to.meta.title} • ${base}` : base;
});

// Auth guard
router.beforeEach(async (to) => {
  const auth = useAuthStore();

  if (!auth.initialized) {
    await new Promise<void>((resolve) => {
      const i = setInterval(() => {
        if (auth.initialized) {
          clearInterval(i);
          resolve();
        }
      }, 10);
    });
  }

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { path: "/login", query: { redirect: to.fullPath } };
  }

  if (to.path === "/login" && auth.isLoggedIn) {
    return "/";
  }

  // Role gates
  const requiredRole = to.meta.requiresRole as string | undefined;
  if (requiredRole && auth.user?.role !== requiredRole) {
    return { path: "/forbidden", replace: true };
  }

  return true;
});

export default router;