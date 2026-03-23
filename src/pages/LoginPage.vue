<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import { http } from "@/api/http";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const toast = useToastStore();

// ---------------------------
// FORM STATES
// ---------------------------
const tab = ref<"password" | "magic" | "otp">("password");

const email = ref(localStorage.getItem("rememberEmail") || "");
const password = ref("");
const otp = ref("");
const rememberDevice = ref(false);
const remember = ref(!!localStorage.getItem("rememberEmail"));
const showPassword = ref(false);
const loading = ref(false);

// ---------------------------
// VALIDATION
// ---------------------------
const emailError = computed(() => {
  if (!email.value) return "Email is required";
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.value) ? "" : "Enter a valid email";
});

const passwordError = computed(() => {
  if (!password.value) return "Password is required";
  if (password.value.length < 6) return "Minimum 6 characters";
  return "";
});

const otpError = computed(() => {
  if (!otp.value) return "Enter OTP";
  if (otp.value.length !== 6) return "OTP must be 6 digits";
  return "";
});

const formValidPassword = computed(() => !emailError.value && !passwordError.value);
const formValidMagic = computed(() => !emailError.value);
const formValidOtp = computed(() => !emailError.value && !otpError.value);



async function submitPassword() {
  if (!formValidPassword.value) return;
  try {
    loading.value = true;
    await auth.login({
      email: email.value,
      password: password.value,
      rememberDevice: rememberDevice.value,     // NEW
    });
    toast.show("Logged in!", "success");

    router.replace((route.query.redirect as string) || "/");
  } catch (e: any) {
    toast.show(e?.response?.data?.message || "Login failed", "error");
  } finally {
    loading.value = false;
  }
}


// ---------------------------
// MAGIC LINK
// ---------------------------
async function sendMagic() {
  if (!formValidMagic.value) return;

  try {
    loading.value = true;

    const { data } = await http.post("/api/auth/magic/send", { email: email.value, rememberDevice: rememberDevice.value });

    if (data?.devLink) {
      await navigator.clipboard.writeText(data.devLink);
      toast.show("Dev Magic Link copied to clipboard", "info");
    } else {
      toast.show("Magic link sent! Check your email.", "success");
    }
  } catch (e: any) {
    toast.show(e?.response?.data?.message || "Failed to send magic link", "error");
  } finally {
    loading.value = false;
  }
}

// ---------------------------
// OTP LOGIN
// ---------------------------
async function sendOtp() {
  if (!formValidMagic.value) return;

  try {
    loading.value = true;

    const { data } = await http.post("/api/auth/otp/send", { email: email.value, rememberDevice: rememberDevice.value });

    if (data?.devOtp) {
      await navigator.clipboard.writeText(data.devOtp);
      toast.show("Dev OTP copied to clipboard", "info");
    } else {
      toast.show("OTP sent! Check your email.", "success");
    }
  } catch (e: any) {
    toast.show(e?.response?.data?.message || "Failed to send OTP", "error");
  } finally {
    loading.value = false;
  }
}

async function verifyOtpCode() {
  if (!formValidOtp.value) return;

  try {
    loading.value = true;

    const { data } = await http.post("/api/auth/otp/verify", {
      email: email.value,
      otp: otp.value,
      rememberDevice: rememberDevice.value,     // NEW
    });

    auth.setAccessToken(data.accessToken);
    auth.user = data.user;

    toast.show("Logged in!", "success");
    router.replace((route.query.redirect as string) || "/");
  } catch (e: any) {
    toast.show(e?.response?.data?.message || "Invalid OTP", "error");
  } finally {
    loading.value = false;
  }
}

// Demo autofill
function fillDemo() {
  email.value = "test@example.com";
  password.value = "123456";
  toast.show("Filled demo credentials", "info");
}

// Redirect if logged in
onMounted(() => {
  if (auth.isLoggedIn) {
    router.replace((route.query.redirect as string) || "/");
  }
});
</script>

<template>
  <section class="login-wrap">
    <div class="bg-accent"></div>

    <div class="card">

      <h1 class="title">Welcome</h1>
      <p class="subtitle">Choose a login method</p>

      <!-- TABS -->
      <div class="tabs">
        <button :class="{ active: tab === 'password' }" @click="tab = 'password'">Password</button>
        <button :class="{ active: tab === 'magic' }" @click="tab = 'magic'">Magic Link</button>
        <button :class="{ active: tab === 'otp' }" @click="tab = 'otp'">OTP</button>
      </div>

      <!-- EMAIL FIELD (shared) -->
      <div class="field">
        <label>Email</label>
        <div class="input-wrap" :class="{ invalid: !!emailError }">
          <span class="icon">📧</span>
          <input type="email" v-model.trim="email" placeholder="you@example.com" />
        </div>
        <p class="err" v-if="emailError">{{ emailError }}</p>
      </div>

      <!-- PASSWORD LOGIN -->
      <template v-if="tab === 'password'">
        <div class="field">
          <label>Password</label>
          <div class="input-wrap" :class="{ invalid: !!passwordError }">
            <span class="icon">🔒</span>
            <input :type="showPassword ? 'text' : 'password'" v-model="password" placeholder="••••••" />
            <button type="button" class="ghost-btn" @click="showPassword = !showPassword">
              {{ showPassword ? "🙈" : "👁️" }}
            </button>
          </div>
          <p class="err" v-if="passwordError">{{ passwordError }}</p>
        </div>

        <button class="primary" :disabled="!formValidPassword || loading" @click="submitPassword">
          <span v-if="!loading">Login</span>
          <span v-else class="spinner"></span>
        </button>

        <button class="secondary" @click="fillDemo">Use demo credentials</button>
      </template>

      <!-- MAGIC LINK -->
      <template v-if="tab === 'magic'">
        <p class="subtext">We'll send a link to sign in. No password needed.</p>
        <button class="primary" :disabled="!formValidMagic || loading" @click="sendMagic">
          <span v-if="!loading">Send Magic Link</span>
          <span v-else class="spinner"></span>
        </button>
      </template>

      <!-- OTP LOGIN -->
      <template v-if="tab === 'otp'">
        <button class="secondary mb-sm" :disabled="!formValidMagic || loading" @click="sendOtp">
          <span v-if="!loading">Send OTP</span>
          <span v-else class="spinner"></span>
        </button>

        <div class="field">
          <label>Enter OTP</label>
          <div class="input-wrap" :class="{ invalid: !!otpError }">
            <span class="icon">🔢</span>
            <input maxlength="6" v-model="otp" placeholder="123456" />
          </div>
          <p class="err" v-if="otpError">{{ otpError }}</p>
        </div>

        <button class="primary" :disabled="!formValidOtp || loading" @click="verifyOtpCode">
          <span v-if="!loading">Verify OTP</span>
          <span v-else class="spinner"></span>
        </button>
      </template>
      
      <div class="remember-device">
        <label>
          <input type="checkbox" v-model="rememberDevice" />
          Remember this device for 30 days
        </label>
      </div>


      <!-- REGISTER -->
      <p class="muted">
        Don’t have an account?
        <button class="link" @click="$router.push('/register')">Create one</button>
      </p>

    </div>
  </section>
</template>

<style scoped>
/* Same styling + new tabs */
.login-wrap {
  min-height: calc(100vh - 80px);
  display: grid;
  place-items: center;
  padding: 32px;
  position: relative;
}
.bg-accent {
  position: absolute;
  inset: -20% -10% auto -10%;
  height: 60vh;
  background:
    radial-gradient(650px 220px at 50% -20%, rgba(35,134,54,0.25), transparent 70%),
    radial-gradient(450px 180px at 10% 90%, rgba(99,102,241,0.18), transparent 70%);
  filter: blur(20px);
  z-index: -1;
}
.card {
  width: min(520px, 94vw);
  background: rgba(13, 17, 23, 0.55);
  border: 1px solid rgba(48, 54, 61, 0.8);
  backdrop-filter: blur(14px);
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 10px 30px rgba(0,0,0,.35);
  color: var(--text);
}

.tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 18px;
}
.tabs button {
  flex: 1;
  padding: 10px;
  background: #0b0f14;
  border: 1px solid #30363d;
  border-radius: 8px;
  cursor: pointer;
  color: var(--text);
  font-weight: 600;
}
.tabs button.active {
  background: #238636;
  border-color: #238636;
  color: white;
}

.subtext {
  margin: 10px 0 16px;
  opacity: .7;
  font-size: 0.9rem;
}

/* Reuse previous input/button styles */
.input-wrap {
  display: grid;
  grid-template-columns: 28px 1fr auto;
  align-items: center;
  gap: 8px;
  background: #0b0f14;
  border: 1px solid #30363d;
  border-radius: 10px;
  padding: 8px;
}
.input-wrap.invalid {
  border-color: #ef4444;
}
.input-wrap input {
  background: transparent;
  border: none;
  color: white;
  outline: none;
  padding: 6px 2px;
}
.ghost-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #c9d1d9;
}

.err {
  color: #ef4444;
  font-size: 0.85rem;
  margin-top: 6px;
}

.primary {
  width: 100%;
  padding: 12px;
  background: #238636;
  border: none;
  border-radius: 10px;
  color: white;
  margin-top: 12px;
  font-weight: 600;
}
.secondary {
  width: 100%;
  padding: 10px;
  background: #0b0f14;
  border: 1px solid #30363d;
  border-radius: 10px;
  color: #c9d1d9;
  margin-top: 12px;
}
.spinner {
  width: 18px; height: 18px;
  border: 2px solid #fff;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin .8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.muted {
  text-align: center;
  margin-top: 18px;
}
.link {
  background: none;
  border: none;
  color: #60a5fa;
  cursor: pointer;
  padding: 0;
}

/* Light theme overrides */
:global(html.light) .card {
  background: rgba(255,255,255,0.72);
  color: #0b0f14;
}


/* ---- remember device ---- */
.remember-device {
  margin-top: 12px;
  text-align: left;
  font-size: 0.9rem;
  opacity: 0.9;
}

.remember-device input {
  margin-right: 8px;
}

</style>