<script setup lang="ts">
import { ref } from "vue";
import { http } from "@/api/http";
import { useToastStore } from "@/stores/toast";

const email = ref("");
const loading = ref(false);
const toast = useToastStore();

async function submit() {
  try {
    loading.value = true;
    await http.post("/api/auth/forgot-password", { email: email.value });
    toast.show("If the email exists, a reset link was sent.", "success");
  } catch {
    toast.show("Failed to send reset instructions", "error");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <section class="auth-wrap">

    <div class="auth-card">
      <h1 class="title">Forgot Password</h1>
      <p class="subtitle">Enter your email to receive password reset instructions.</p>

      <div class="field">
        <label>Email Address</label>
        <div class="input-wrap">
          <span class="icon">📧</span>
          <input type="email" v-model="email" placeholder="you@example.com" />
        </div>
      </div>

      <button class="btn primary" :disabled="loading || !email" @click="submit">
        <span v-if="!loading">Send Reset Link</span>
        <span v-else class="spinner"></span>
      </button>

      <p class="muted">
        Remember your password?
        <button class="link" @click="$router.push('/login')">Back to Login</button>
      </p>
    </div>

  </section>
</template>

<style scoped>
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

.title {
  font-size: 1.8rem;
  font-weight: 800;
  margin-bottom: 8px;
}

.subtitle {
  opacity: 0.8;
  margin-bottom: 24px;
}

.field {
  margin-bottom: 16px;
}
.field label {
  font-size: 0.9rem;
  opacity: 0.85;
}

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

.input-wrap input {
  background: transparent;
  border: none;
  color: #e6edf3;
  width: 100%;
  outline: none;
}

.icon {
  opacity: 0.7;
}

/* Buttons */
.btn.primary {
  width: 100%;
  background: #238636;
  border: none;
  padding: 12px 0;
  border-radius: 12px;
  font-weight: 600;
  color: white;
  margin-top: 10px;
  transition: 0.2s ease;
}
.btn.primary:hover {
  background: #2ea043;
  transform: translateY(-2px);
}

.spinner {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid white;
  border-right-color: transparent;
  animation: spin .8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.muted {
  margin-top: 18px;
  text-align: center;
  opacity: 0.8;
}

.link {
  background: none;
  border: none;
  color: #58a6ff;
  cursor: pointer;
  padding: 0;
}
</style>