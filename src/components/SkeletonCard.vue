<script setup lang="ts">
defineProps<{ rows?: number }>()
</script>

<template>
  <div class="skeleton s-card">
    <div class="s-img shimmer"></div>
    <div class="s-line shimmer"></div>
    <div class="s-line short shimmer"></div>
    <div class="s-line tiny shimmer"></div>
  </div>
</template>

<style scoped>
.s-card {
  background: #0d1117; border: 1px solid #30363d; border-radius: 12px; padding: 14px;
  position: relative;
  overflow: hidden

}
.s-img { height: 180px; border-radius: 8px; margin-bottom: 12px; background: #11151b; }
.s-line { height: 14px; border-radius: 6px; background: #11151b; margin: 8px 0; }
.s-line.short { width: 70%; }
.s-line.tiny { width: 40%; }
.shimmer {
  position: relative; overflow: hidden;
}
.shimmer::after {
  content: "";
  position: absolute; top: 0; left: -150px; height: 100%; width: 150px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent);
  animation: shimmer 1.2s infinite;
}
.skeleton {
  background: linear-gradient(110deg, #1a1f25 8%, #2d343c 18%, #1a1f25 33%);
  background-size: 200% 100%;
  animation: shimmer 1.5s linear infinite;
  border-radius: 12px;
  height: 260px;
}

@keyframes shimmer {
  from { background-position: 200% 0; }
  to   { background-position: -200% 0; }
}
@keyframes shimmer { 0% { left: -150px } 100% { left: 100% } }
</style>