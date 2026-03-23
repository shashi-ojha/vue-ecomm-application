<template>
  <section class="forbidden">
    <div class="card">
      <h1>403 — Forbidden</h1>
      <p>You don’t have permission to access this page.</p>
      <RouterLink class="btn" to="/">Go Home</RouterLink>
    </div>
  </section>
</template>

<style scoped>
.forbidden { min-height: calc(100vh - 80px); display: grid; place-items: center; padding: 24px; }
.card { background: rgba(13,17,23,.7); border:1px solid #30363d; border-radius:16px; padding:24px; text-align:center; }
.btn { display:inline-block; margin-top:12px; background:#238636; color:#fff; padding:10px 14px; border-radius:10px; text-decoration:none; }
</style>