<script setup lang="ts">
import { onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { http } from "@/api/http";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const toast = useToastStore();

onMounted(async () => {
  const token = route.query.token as string;
  if (!token) return router.replace("/login");
  try {
    const { data } = await http.post("/api/auth/magic/verify", { token });
    auth.setAccessToken(data.accessToken);
    auth.user = data.user;
    toast.show("Logged in!", "success");
    router.replace("/");
  } catch (e: any) {
    toast.show(e?.response?.data?.message || "Magic link failed", "error");
    router.replace("/login");
  }
});
</script>

<template>
  <div style="padding:24px;text-align:center">Signing you in…</div>
</template>