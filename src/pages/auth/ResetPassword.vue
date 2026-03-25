<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToastStore } from "@/stores/toast";
import { http } from "@/api/http";

const route = useRoute();
const router = useRouter();
const toast = useToastStore();

const token = route.query.token as string;
const password = ref("");
const confirm = ref("");
const loading = ref(false);

async function submit() {
  if (!password.value || !confirm.value) {
    toast.show("All fields are required", "error");
    return;
  }
  if (password.value !== confirm.value) {
    toast.show("Passwords do not match", "error");
    return;
  }

  try {
    loading.value = true;
    await http.post("/api/auth/reset-password", {
      token,
      password: password.value,
    });

    toast.show("Password reset successful!", "success");
    router.push("/login");
  } catch (e: any) {
    toast.show(e?.response?.data?.message || "Reset failed", "error");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <section class="auth-wrap">

    <div class="auth-card">
      <h1 class="title">Reset Password</h1>
      <p class="subtitle">Enter your new password below.</p>

      <div class="field">
        <label>New Password</label>
        <div class="input-wrap">
          <span class="icon">🔒</span>
          <input type="password" v-model="password" placeholder="********" />
        </div>
      </div>

      <div class="field">
        <label>Confirm Password</label>
        <div class="input-wrap">
          <span class="icon">✅</span>
          <input type="password" v-model="confirm" placeholder="********" />
        </div>
      </div>

      <button class="btn primary" :disabled="loading" @click="submit">
        <span v-if="!loading">Reset Password</span>
        <span v-else class="spinner"></span>
      </button>

      <p class="muted">
        Return to
        <button class="link" @click="$router.push('/login')">Login</button>
      </p>
    </div>

  </section>
</template>

<style scoped>
/* same premium styling as ForgotPassword.vue */
.auth-wrap {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 40px;
  background:
    radial-gradient(900px 420px at 20% -10%, rgba(35,134,54,0.12), transparent 60%),
    radial-gradient(700px 380px at 110% 90%, rgba(99,102,241,0.12), transparent 60%),
    #0b0f14;
  color: #e6edf3;
}

.auth-card {
  width: min(480px, 94vw);
  background: rgba(13,17,23,0.55);
  border: 1px solid #30363d;
  padding: 32px;
  border-radius: 20px;
  backdrop-filter: blur(12px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.45);
}

.title { font-size: 1.8rem; font-weight: 800; margin-bottom: 8px; }
.subtitle { opacity: 0.8; margin-bottom: 20px; }

.field { margin-bottom: 16px; }
.field label { font-size: 0.9rem; opacity: 0.85; }
.input-wrap {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: #0b0f14;
  border: 1px solid #30363d;
  border-radius: 14px;
  padding: 10px 14px;
}
.input-wrap input { background: transparent; border: none; color: #e6edf3; width: 100%; outline: none; }
.icon { opacity: .7; }

.btn.primary {
  width: 100%;
  background: #238636;
  border: none;
  padding: 12px 0;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  margin-top: 10px;
  transition: 0.2s ease;
}
.btn.primary:hover { background: #2ea043; transform: translateY(-2px); }

.spinner {
  width: 18px; height: 18px; border: 2px solid white;
  border-right-color: transparent; border-radius: 50%;
  animation: spin .8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.muted { margin-top: 18px; text-align: center; opacity: 0.8; }
.link { background: none; border: none; color: #58a6ff; cursor: pointer; padding: 0; }
</style>