<script setup lang="ts">
import { ref } from 'vue'

const heroTitle = 'Welcome to My Vue Home Page'
const heroSubtitle = 'A clean layout with header & footer components.'
const ctas = ref([
  { label: 'Get Started', href: '#get-started', variant: 'primary' },
  { label: 'Learn More', href: '#about', variant: 'ghost' },
])
</script>

<template>
  <main class="home">
    <section class="hero">
      <div class="inner">
        <h1>{{ heroTitle }}</h1>
        <p class="subtitle">{{ heroSubtitle }}</p>

        <div class="actions">
          <a
            v-for="cta in ctas"
            :key="cta.label"
            :href="cta.href"
            class="btn"
            :class="cta.variant"
          >
            {{ cta.label }}
          </a>
        </div>
      </div>
    </section>

    <section id="features" class="features">
      <div class="grid">
        <article class="card">
          <h3>Fast</h3>
          <p>Vite + Vue 3 gives instant dev server and lightning HMR.</p>
        </article>
        <article class="card">
          <h3>Modular</h3>
          <p>Header, Home, and Footer are cleanly separated for reuse.</p>
        </article>
        <article class="card">
          <h3>Scalable</h3>
          <p>Easy to add routing, state, and API layers later.</p>
        </article>
      </div>
    </section>
  </main>
</template>

<style scoped>
.home {
  min-height: 70vh;
}
.hero {
  padding: 64px 20px 40px;
  background: radial-gradient(1200px 400px at 50% -40%, #1f6feb22, transparent 70%),
              linear-gradient(#161b22, #0d1117);
  color: #c9d1d9;
}
.inner {
  max-width: 900px;
  margin: 0 auto;
  text-align: center;
}
h1 {
  font-size: 2.2rem;
  margin-bottom: 10px;
}
.subtitle {
  font-size: 1.05rem;
  color: #9da7b1;
}
.actions {
  margin-top: 20px;
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}
.btn {
  padding: 10px 16px;
  border-radius: 8px;
  text-decoration: none;
  border: 1px solid #30363d;
}
.btn.primary {
  background: #238636;
  color: #fff;
  border-color: #238636;
}
.btn.ghost {
  background: transparent;
  color: #c9d1d9;
}
.features {
  max-width: 1100px;
  margin: 32px auto;
  padding: 0 20px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}
.card {
  background: #0d1117;
  border: 1px solid #30363d;
  color: #c9d1d9;
  border-radius: 12px;
  padding: 16px;
}
.card h3 {
  margin: 0 0 6px;
}
</style>