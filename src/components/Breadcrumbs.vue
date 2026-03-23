<script setup lang="ts">
import { computed } from "vue";
import { useRoute, RouterLink } from "vue-router";

const route = useRoute();

const segments = computed(() => {
  const parts = route.path.split("/").filter(Boolean);
  let full = "";

  return parts.map((p) => {
    full += "/" + p;
    return { label: p.replace(/-/g, " "), path: full };
  });
});
</script>

<template>
  <nav class="breadcrumbs">
    <RouterLink to="/">Home</RouterLink>
    <span v-for="(s, i) in segments" :key="i">
      › <RouterLink :to="s.path">{{ s.label }}</RouterLink>
    </span>
  </nav>
</template>

<style scoped>
.breadcrumbs {
  margin-bottom: 16px;
  opacity: 0.85;
  font-size: 0.9rem;
}
.breadcrumbs a {
  color: #60a5fa;
  text-decoration: none;
}
</style>