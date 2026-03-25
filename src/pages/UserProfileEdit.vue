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
  <section class="profile-edit-wrap">
    <h1>Edit Profile</h1>

    <div v-if="loading">Loading…</div>

    <div v-else class="edit-card glass">

      <div class="field">
        <label>Full Name</label>
        <input v-model="name" />
      </div>

      <div class="field">
        <label>Email (read-only)</label>
        <input v-model="email" disabled />
      </div>

      <div class="field">
        <label>Phone Number</label>
        <input v-model="phone" placeholder="Optional" />
      </div>

      <button class="btn primary" @click="saveProfile">
        Save Changes
      </button>
    </div>
  </section>
</template>

<style scoped>
.profile-edit-wrap {
  max-width: 600px;
  margin: 80px auto;
  padding: 20px;
}
.edit-card {
  padding: 30px;
  border-radius: 12px;
}
.field {
  margin-bottom: 20px;
}
.field label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
}
.field input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
}
.btn {
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
.btn.primary {
  background-color: #4caf50;
  color: white;
}
</style>