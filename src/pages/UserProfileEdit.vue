<script setup lang="ts">
import { ref, onMounted } from "vue";
import { http } from "@/api/http";
import { useToastStore } from "@/stores/toast";
import { useRouter } from "vue-router";

const toast = useToastStore();
const router = useRouter();

const name = ref("");
const email = ref("");
const phone = ref("");
const loading = ref(true);

async function loadProfile() {
  try {
    const { data } = await http.get("/api/auth/me");
    name.value = data.user.name || "";
    email.value = data.user.email;
    phone.value = data.user.phone || "";
  } catch {
    toast.show("Failed to load profile", "error");
  } finally {
    loading.value = false;
  }
}

async function saveProfile() {
  try {
    const { data } = await http.patch("/api/auth/update-profile", {
      name: name.value,
      phone: phone.value,
    });

    toast.show("Profile updated successfully!", "success");
    router.push("/profile");
  } catch (err: any) {
    toast.show(err?.response?.data?.message || "Update failed", "error");
  }
}

onMounted(loadProfile);
</script>

<template>
  <section class="profile-edit-page">

    <!-- Page Title -->
    <h1 class="page-title">Edit Profile</h1>

    <div v-if="loading" class="loading-container">
      <div class="loader"></div>
      <p>Loading your profile…</p>
    </div>

    <div v-else class="edit-card glass">

      <!-- Avatar + Email Display -->
      <div class="header-block">
        <div class="avatar">{{ name?.charAt(0)?.toUpperCase() }}</div>
        <div class="email-preview">{{ email }}</div>
      </div>

      <!-- Form -->
      <div class="form-grid">

        <div class="field full">
          <label>Full Name</label>
          <input v-model="name" placeholder="Enter full name" />
        </div>

        <div class="field full">
          <label>Email</label>
          <input v-model="email" disabled class="disabled" />
        </div>

        <div class="field full">
          <label>Phone Number</label>
          <input v-model="phone" placeholder="Add phone number" />
        </div>

      </div>

      <!-- Save Button -->
      <button class="btn primary" @click="saveProfile">
        Save Changes
      </button>

    </div>

  </section>
</template>

<style scoped>
.profile-edit-page {
  padding: 40px 22px;
  min-height: 100vh;
  background:
    radial-gradient(900px 420px at 20% -10%, rgba(35,134,54,0.12), transparent 60%),
    radial-gradient(700px 380px at 100% 90%, rgba(99,102,241,0.12), transparent 60%),
    #0b0f14;
  color: #e6edf3;
  font-family: "Inter", sans-serif;
}

/* Page Title */
.page-title {
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 24px;
  text-align: center;
}

/* Glass Card */
.edit-card {
  width: min(550px, 95vw);
  margin: 0 auto;
  padding: 28px;
  border-radius: 18px;
  background: rgba(13,17,23,0.65);
  border: 1px solid #2e3540;
  box-shadow: 0 15px 40px rgba(0,0,0,0.45);
  backdrop-filter: blur(12px);
  animation: fadeIn 0.4s ease;
}

/* Avatar + Email block */
.header-block {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #238636;
  color: white;
  display: grid;
  place-items: center;
  font-size: 1.7rem;
  font-weight: 800;
}

.email-preview {
  font-size: 1rem;
  opacity: 0.85;
}

/* Form Grid */
.form-grid {
  display: grid;
  gap: 18px;
  margin-top: 10px;
}

.field label {
  display: block;
  margin-bottom: 6px;
  opacity: 0.75;
  font-size: 0.9rem;
}

.field input {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid #30363d;
  background: #0b0f14;
  color: #e6edf3;
  font-size: 0.95rem;
  transition: 0.2s ease;
}

.field input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59,130,246,0.25);
}

.field input.disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Save Button */
.btn.primary {
  width: 100%;
  margin-top: 25px;
  padding: 12px;
  background: #238636;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  color: white;
  cursor: pointer;
  transition: 0.25s;
}

.btn.primary:hover {
  background: #2ea043;
  transform: translateY(-2px);
}

/* Loading State */
.loading-container {
  text-align: center;
  margin-top: 80px;
}

.loader {
  width: 34px;
  height: 34px;
  border: 3px solid #fff;
  border-right-color: transparent;
  border-radius: 50%;
  margin: 0 auto 10px;
  animation: spin 0.8s linear infinite;
}

/* Animations */
@keyframes spin {
  to { transform: rotate(360deg); }
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>