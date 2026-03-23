<script setup lang="ts">
</script>

<template>
    <main class="about">
      <section class="hero">
        <div class="inner">
          <h1>About Page</h1>
          <p class="subtitle">This is the about route.</p>

          <div class="actions">
            <RouterLink to="/" class="btn">Back Home</RouterLink>
          </div>
        </div>
      </section>

      <section id="features" class="features">
        <div class="grid">
          <article class="card">
            <h3>Our Mission</h3>
            <p>To build a clean and modular Vue 3 starter template.</p>
          </article>
          <article class="card">
            <h3>Our Team</h3>
            <p>A group of passionate Vue developers and designers.</p>
          </article>
          <article class="card">
            <h3>Contact Us</h3>
            <p>Email us at info@myvueapp.com</p>
          </article>
        </div>
      </section>

    </main>
</template>

<style scoped>
.about {
  min-height: 70vh;
}
.hero {
  padding: 64px 85px 40px;
  background: radial-gradient(1200px 400px at 50% -40%, #1f6feb22, transparent 70%),
              linear-gradient(#161b22, #0d1117);
  color: #c9d1d9;
}
.subtitle {
  margin-top: 12px;
  font-size: 1.25rem;
  color: #8b949e;
}
.actions {
  margin-top: 20px;
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
  gap: 20px;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}
.card {
  background: #161b22;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #30363d;
}
.card h3 {
  margin-top: 0;
  margin-bottom: 12px;
}
.card p {
  margin: 0;
  color: #8b949e;
}


</style>