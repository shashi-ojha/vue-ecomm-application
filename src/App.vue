<script setup lang="ts">
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import ToastContainer from '@/components/ToastContainer.vue'
import "./assets/main.css"
</script>

<template>
  <div class="app-shell">
    <AppHeader />

    <router-view v-slot="{ Component }">
      <transition name="route-fade" mode="out-in" appear>
        <component :is="Component" />
      </transition>
    </router-view>

    <ToastContainer />
    <AppFooter />
  </div>
</template>


<style>
:root {
  color-scheme: dark;
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
}
body {
  margin: 0;
  background: #0b0f14;
}
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>