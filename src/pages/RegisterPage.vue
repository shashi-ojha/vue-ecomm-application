<script setup lang="ts">
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const toast = useToastStore();

const name = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");

const loading = ref(false);
const errors = ref<{ [k: string]: string }>({});

function validate() {
  errors.value = {};

  if (!name.value.trim()) errors.value.name = "Full name is required";

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.value.trim() || !emailRegex.test(email.value))
    errors.value.email = "Enter a valid email";

  if (password.value.length < 6)
    errors.value.password = "Password must be at least 6 characters";

  if (password.value !== confirmPassword.value)
    errors.value.confirmPassword = "Passwords do not match";

  return Object.keys(errors.value).length === 0;
}

async function register() {
  if (!validate()) {
    toast.show("Please fix the errors", "error");
    return;
  }

  try {
    loading.value = true;

    await auth.register({
      email: email.value,
      password: password.value,
      name: name.value,
    });

    toast.show("Registration successful!", "success");

    // Redirect where user was trying to go before
    const redirect = (route.query.redirect as string) || "/";

    router.replace(redirect);

  } catch (err: any) {
    const msg = err?.response?.data?.message || "Registration failed";
    toast.show(msg, "error");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <section class="auth-page">
    <div class="card glass">

      <h1>Create Account</h1>

      <div class="field">
        <label>Full Name</label>
        <input v-model="name" type="text" />
        <small v-if="errors.name">{{ errors.name }}</small>
      </div>

      <div class="field">
        <label>Email Address</label>
        <input v-model="email" type="email" />
        <small v-if="errors.email">{{ errors.email }}</small>
      </div>

      <div class="field">
        <label>Password</label>
        <input v-model="password" type="password" />
        <small v-if="errors.password">{{ errors.password }}</small>
      </div>

      <div class="field">
        <label>Confirm Password</label>
        <input v-model="confirmPassword" type="password" />
        <small v-if="errors.confirmPassword">{{ errors.confirmPassword }}</small>
      </div>

      <button class="btn" :disabled="loading" @click="register">
        {{ loading ? "Creating account..." : "Register" }}
      </button>

      <p class="switch">
        Already have an account?
        <RouterLink to="/login">Login</RouterLink>
      </p>
    </div>
  </section>
</template>

<style scoped>
.auth-page {
  min-height: calc(100vh - 80px);
  display: grid;
  place-items: center;
  padding: 30px;
}

.card {
  width: min(420px, 94vw);
  background: rgba(13,17,23,0.75);
  border: 1px solid #30363d;
  padding: 32px;
  border-radius: 16px;
  backdrop-filter: blur(12px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.45);
  color: var(--text, #e6edf3);
  animation: fadeUp .45s ease-out;
}

h1 {
  margin-bottom: 20px;
  font-size: 1.6rem;
  text-align: center;
}

.field {
  display: flex;
  flex-direction: column;
  margin-bottom: 14px;
}

.field label {
  margin-bottom: 6px;
  font-weight: 600;
}

input {
  padding: 10px 12px;
  background: #0b0f14;
  border: 1px solid #30363d;
  border-radius: 10px;
  color: var(--text);
  outline: none;
  transition: border-color .15s;
}

input:focus {
  border-color: #238636;
}

small {
  margin-top: 4px;
  color: #ef4444;
  font-size: 0.82rem;
}

.btn {
  margin-top: 10px;
  width: 100%;
  padding: 12px;
  background: #238636;
  color: white;
  border-radius: 10px;
  font-size: 1rem;
  cursor: pointer;
  border: none;
  transition: opacity .2s, transform .1s;
}

.btn:hover { opacity: .92; transform: translateY(-2px); }

.switch {
  margin-top: 18px;
  text-align: center;
  font-size: .9rem;
  color: #9da7b1;
}
.switch a {
  color: #58a6ff;
  text-decoration: none;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>