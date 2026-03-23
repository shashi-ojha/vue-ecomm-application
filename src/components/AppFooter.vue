<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<template>
  <footer class="footer">
    <div class="container">
      <p>© {{ year }} My Vue Site. All rights reserved.</p>
      <div class="links">
        <a href="#privacy">Privacy</a>
        <a href="#terms">Terms</a>
        <a href="#support">Support</a>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  margin-top: 40px;
  background: #0d1117;
  color: #8b949e;
  border-top: 1px solid #30363d;
}
.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.links {
  display: flex;
  gap: 16px;
}
.links a {
  color: #8b949e;
  text-decoration: none;
}
.links a:hover {
  color: #c9d1d9;
  text-decoration: underline;
}
</style>