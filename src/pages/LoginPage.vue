<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import { http } from "@/api/http";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const toast = useToastStore();

const tab = ref<"password" | "magic" | "otp">("password");

const email = ref(localStorage.getItem("rememberEmail") || "");
const password = ref("");
const otp = ref("");
const rememberDevice = ref(false);
const remember = ref(!!localStorage.getItem("rememberEmail"));
const showPassword = ref(false);
const loading = ref(false);

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
  if (!otp.value) return "OTP is required";
  if (otp.value.length !== 6) return "OTP must be 6 digits";
  return "";
});
const validPasswordForm = computed(() => !emailError.value && !passwordError.value);
const validMagicForm = computed(() => !emailError.value);
const validOtpForm = computed(() => !emailError.value && !otpError.value);

// ==== OTP Countdown State ====
const otpSeconds = ref(0);
const otpTimer = ref<number | null>(null);
const sendingOtp = ref(false);
const verifyingOtp = ref(false);

const OTP_WINDOW_SECONDS = 180; // adjust to 300 if backend is 5m

function startOtpCountdown(seconds = OTP_WINDOW_SECONDS) {
  stopOtpCountdown();
  otpSeconds.value = seconds;
  otpTimer.value = window.setInterval(() => {
    if (otpSeconds.value > 0) {
      otpSeconds.value -= 1;
    } else {
      stopOtpCountdown();
    }
  }, 1000);
}
function stopOtpCountdown() {
  if (otpTimer.value) {
    clearInterval(otpTimer.value);
    otpTimer.value = null;
  }
}
function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
onUnmounted(() => stopOtpCountdown());

// ----- Password login -----
async function submitPassword() {
  if (!validPasswordForm.value) return;
  try {
    loading.value = true;
    await auth.login({
      email: email.value,
      password: password.value,
      rememberDevice: rememberDevice.value,
    });
    toast.show("Logged in!", "success");
    router.replace((route.query.redirect as string) || "/");
  } catch (e: any) {
    toast.show(e?.response?.data?.message || "Login failed", "error");
  } finally {
    loading.value = false;
  }
}

// ----- Magic link -----
async function sendMagicLink() {
  if (!validMagicForm.value) return;
  try {
    loading.value = true;
    const { data } = await http.post("/api/auth/magic/send", {
      email: email.value,
      rememberDevice: rememberDevice.value,
    });

    if (data?.accessToken) {
      auth.setAccessToken(data.accessToken);
      auth.user = data.user;
      toast.show("Logged in (trusted device)", "success");
      router.replace("/");
      return;
    }

    toast.show("Magic link sent! Check your email.", "success");
  } catch (e: any) {
    toast.show(e?.response?.data?.message || "Failed to send magic link", "error");
  } finally {
    loading.value = false;
  }
}

// ----- OTP login -----
async function sendOtp() {
  if (!validMagicForm.value) return;
  try {
    sendingOtp.value = true;
    loading.value = true;

    const { data } = await http.post("/api/auth/otp/send", {
      email: email.value,
      rememberDevice: rememberDevice.value,
    });

    if (data?.accessToken) {
      auth.setAccessToken(data.accessToken);
      auth.user = data.user;
      toast.show("Logged in (trusted device)", "success");
      router.replace("/");
      return;
    }

    // switch to OTP tab and start countdown
    tab.value = "otp";
    startOtpCountdown(OTP_WINDOW_SECONDS);
    toast.show("OTP sent! Check your email.", "success");
  } catch (e: any) {
    toast.show(e?.response?.data?.message || "Failed to send OTP", "error");
  } finally {
    sendingOtp.value = false;
    loading.value = false;
  }
}

async function verifyOtpCode() {
  if (!validOtpForm.value) return;
  try {
    verifyingOtp.value = true;
    loading.value = true;

    const { data } = await http.post("/api/auth/otp/verify", {
      email: email.value,
      otp: otp.value,
      rememberDevice: rememberDevice.value,
    });

    auth.setAccessToken(data.accessToken);
    auth.user = data.user;
    stopOtpCountdown();
    toast.show("Logged in!", "success");
    router.replace((route.query.redirect as string) || "/");
  } catch (e: any) {
    const msg = e?.response?.data?.message || "Invalid OTP";
    toast.show(msg, "error");
    if (/expired/i.test(msg)) stopOtpCountdown();
  } finally {
    verifyingOtp.value = false;
    loading.value = false;
  }
}

function fillDemo() {
  email.value = "test@example.com";
  password.value = "123456";
  toast.show("Filled demo credentials", "info");
}

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

      <!-- EMAIL FIELD -->
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

        <button class="link small" @click="$router.push('/auth/forgot-password')">
          Forgot password?
        </button>

        <button class="primary" :disabled="loading || !validPasswordForm" @click="submitPassword">
          <span v-if="!loading">Login</span>
          <span v-else class="spinner"></span>
        </button>

        <button class="demo-credentials secondary" @click="fillDemo">Use demo credentials</button>
      </template>

      <!-- MAGIC LINK -->
      <template v-if="tab === 'magic'">
        <p class="subtext">We'll send a link to sign in. No password needed.</p>
        <button class="primary" :disabled="loading || !validMagicForm" @click="sendMagicLink">
          <span v-if="!loading">Send Magic Link</span>
          <span v-else class="spinner"></span>
        </button>
      </template>

      <!-- OTP TAB (with timer) -->
      <template v-if="tab === 'otp'">
        <div class="otp-row">
          <button
            class="secondary"
            :disabled="sendingOtp || loading || !validMagicForm || otpSeconds > 0"
            @click="sendOtp"
          >
            <span v-if="!sendingOtp">Send OTP</span>
            <span v-else class="spinner"></span>
          </button>

          <span v-if="otpSeconds > 0" class="pill">
            Resend in {{ formatTime(otpSeconds) }}
          </span>

          <button v-else class="link small" type="button" @click="sendOtp">
            Resend OTP
          </button>
        </div>

        <div class="field">
          <label>Enter OTP</label>
          <div class="input-wrap" :class="{ invalid: !!otpError }">
            <span class="icon">🔢</span>
            <input maxlength="6" v-model="otp" placeholder="123456" inputmode="numeric" autocomplete="one-time-code" />
          </div>
          <p class="err" v-if="otpError">{{ otpError }}</p>
        </div>

        <button
          class="primary"
          :disabled="verifyingOtp || loading || !validOtpForm"
          @click="verifyOtpCode"
        >
          <span v-if="!verifyingOtp">Verify OTP</span>
          <span v-else class="spinner"></span>
        </button>
      </template>

      <!-- REMEMBER DEVICE -->
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
/* layout + background same as your dark theme */
.login-wrap {
  min-height: calc(100vh - 80px);
  display: grid;
  place-items: center;
  padding: 32px;
  position: relative;
  background:
    radial-gradient(950px 420px at 20% -10%, rgba(35,134,54,0.10), transparent 60%),
    radial-gradient(700px 380px at 110% 90%, rgba(99,102,241,0.10), transparent 60%),
    #0b0f14;
  color: #e6edf3;
}
.bg-accent { display:none; } /* redundant now */

.card {
  width: min(520px, 94vw);
  background: rgba(13,17,23,.55);
  border: 1px solid #30363d;
  border-radius: 16px;
  backdrop-filter: blur(10px);
  padding: 28px;
  box-shadow: 0 10px 30px rgba(0,0,0,.35);
  color: var(--text, #e6edf3);
}

.title { margin-bottom: 6px; font-size: 1.6rem; font-weight: 800; }
.subtitle { margin-bottom: 20px; color: #9da7b1; }

.tabs { display:flex; gap:6px; margin-bottom:18px; }
.tabs button {
  flex:1; background:#0b0f14; border:1px solid #30363d; border-radius:8px; padding:10px;
  color:#e6edf3; font-weight:600; cursor:pointer;
}
.tabs button.active { background:#238636; border-color:#238636; }

.field { margin-bottom: 14px; }
.input-wrap {
  display:grid; grid-template-columns: 28px 1fr auto; align-items:center; gap:8px;
  background:#0b0f14; border:1px solid #30363d; border-radius:12px; padding:8px 10px;
}
.input-wrap.invalid { border-color:#ef4444; }
.input-wrap input { background:transparent; border:0; color:inherit; outline:0; }
.icon { opacity:.8; }
.ghost-btn { border:0; background:transparent; cursor:pointer; color:#c9d1d9; }

.err { color:#ef4444; font-size:0.85rem; margin-top:6px; }

.primary {
  width:100%; background:#238636; border:0; border-radius:10px; padding:12px;
  color:white; font-weight:600; margin-top:12px;
}
.secondary {
  background:#0b0f14; border:1px solid #30363d; border-radius:10px;
  color:#c9d1d9; padding:10px 14px;
}

.demo-credentials { margin-top:8px; }

.spinner {
  width:18px; height:18px; border:2px solid #fff; border-right-color:transparent;
  border-radius:50%; animation: spin .8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* OTP row and pills */
.otp-row { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
.pill {
  display:inline-flex; align-items:center; gap:6px; padding:6px 10px; border-radius:999px;
  border:1px solid #30363d; background:rgba(255,255,255,0.04); color:#c9d1d9; font-size:.9rem;
}
.link.small { background:none; border:none; color:#60a5fa; cursor:pointer; padding:0; font-size:.9rem; }

.remember-device { margin-top:12px; text-align:left; font-size:0.9rem; opacity:0.9; }
.remember-device input { margin-right:8px; }

.muted { margin-top:12px; text-align:center; color:#9da7b1; }
.link { background:none; border:none; color:#60a5fa; cursor:pointer; }
</style>