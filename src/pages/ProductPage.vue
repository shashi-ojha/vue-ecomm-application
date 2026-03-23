<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Product } from '@/services/productService'
import { fetchProducts, fetchCategories } from '@/services/productService'
import ProductCard from '@/components/ProductCard.vue'
import SkeletonCard from '@/components/SkeletonCard.vue'
import SidebarFilters from '@/components/SidebarFilters.vue'
import Breadcrumbs from '@/components/Breadcrumbs.vue'

const route = useRoute()
const router = useRouter()

const products = ref<Product[]>([])
const categories = ref<string[]>([])

const loading = ref(true)
const error = ref<string | null>(null)

const selectedCategory = ref<string>('all')
const searchTerm = ref<string>('')
type SortKey = 'relevance' | 'price-asc' | 'price-desc' | 'title-asc' | 'title-desc'
const sortBy = ref<SortKey>('relevance')

// pagination
const currentPage = ref<number>(1)
const pageSize = 8

// 🔎 Read initial state from URL (so shareable links restore UI)
selectedCategory.value = (route.query.category as string) || 'all'
searchTerm.value = (route.query.search as string) || ''
sortBy.value = ((route.query.sort as SortKey) || 'relevance')
currentPage.value = Number(route.query.page) || 1

onMounted(async () => {
  try {
    const [prod, cats] = await Promise.all([fetchProducts(), fetchCategories()])
    products.value = prod
    categories.value = cats
  } catch (e: any) {
    error.value = e?.message ?? 'Failed to load'
  } finally {
    loading.value = false
  }
})

function normalize(s: string) {
  return s.toLowerCase().trim()
}

function syncUrl() {
  router.replace({
    query: {
      category: selectedCategory.value !== 'all' ? selectedCategory.value : undefined,
      search: searchTerm.value || undefined,
      sort: sortBy.value !== 'relevance' ? sortBy.value : undefined,
      page: currentPage.value > 1 ? String(currentPage.value) : undefined
    }
  })
}

// If user hits back/forward, keep UI in sync
watch(() => route.query, (q) => {
  selectedCategory.value = (q.category as string) || 'all'
  searchTerm.value = (q.search as string) || ''
  sortBy.value = ((q.sort as SortKey) || 'relevance')
  currentPage.value = Number(q.page) || 1
})

const filtered = computed(() => {
  let arr = products.value
  if (selectedCategory.value !== 'all') {
    arr = arr.filter(p => p.category === selectedCategory.value)
  }
  const q = normalize(searchTerm.value)
  if (q) arr = arr.filter(p => normalize(p.title + ' ' + p.description).includes(q))
  return arr
})

const sorted = computed(() => {
  const arr = [...filtered.value]
  switch (sortBy.value) {
    case 'price-asc':  return arr.sort((a,b) => a.price - b.price)
    case 'price-desc': return arr.sort((a,b) => b.price - a.price)
    case 'title-asc':  return arr.sort((a,b) => a.title.localeCompare(b.title))
    case 'title-desc': return arr.sort((a,b) => b.title.localeCompare(a.title))
    default:           return arr // relevance = original order
  }
})

const totalPages = computed(() => Math.max(1, Math.ceil(sorted.value.length / pageSize)))
const paginated = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return sorted.value.slice(start, start + pageSize)
})

// updates + URL sync
function onCategoryChange(v: string) { selectedCategory.value = v; currentPage.value = 1; syncUrl() }
function onSearchChange(v: string)   { searchTerm.value = v; currentPage.value = 1; syncUrl() }
function onSortChange(v: SortKey)    { sortBy.value = v; currentPage.value = 1; syncUrl() }
function nextPage() { if (currentPage.value < totalPages.value) { currentPage.value++; syncUrl() } }
function prevPage() { if (currentPage.value > 1) { currentPage.value--; syncUrl() } }

// 📱 Mobile: filter drawer toggle
const showFilters = ref(false)
function toggleFilters() { showFilters.value = !showFilters.value }
function closeFilters() { showFilters.value = false }
</script>

<template>
  <section class="page">
    <div class="page-head">
      <h1>Products</h1>
      <Breadcrumbs />

      <!-- Mobile filter toggle -->
      <button class="filter-toggle" @click="toggleFilters">
        {{ showFilters ? 'Close Filters' : 'Filters' }}
      </button>
    </div>

    <div class="product-layout">
      <!-- Sidebar (desktop & tablet) -->
      <aside class="sidebar-container">
        <SidebarFilters
          :categories="categories"
          :selected-category="selectedCategory"
          :search-term="searchTerm"
          :sort-by="sortBy"
          @update:category="onCategoryChange"
          @update:search="onSearchChange"
          @update:sort="onSortChange"
        />
      </aside>

      <!-- Product Grid -->
      <section class="product-section">
        <div v-if="error" class="error">{{ error }}</div>

        <div class="product-grid">
          <SkeletonCard v-if="loading" v-for="i in 9" :key="i" />
          <ProductCard v-else v-for="p in paginated" :key="p.id" :product="p" />
        </div>

        <p v-if="!loading && !paginated.length" class="empty">No products found.</p>

        <div class="pagination" v-if="!loading && totalPages > 1">
          <button @click="prevPage" :disabled="currentPage === 1">Prev</button>
          <span>Page {{ currentPage }} of {{ totalPages }}</span>
          <button @click="nextPage" :disabled="currentPage === totalPages">Next</button>
        </div>
      </section>
    </div>

    <!-- 📱 Mobile filter drawer -->
    <transition name="slide">
      <div v-if="showFilters" class="filter-drawer" @click.self="closeFilters">
        <div class="drawer-panel">
          <SidebarFilters
            :categories="categories"
            :selected-category="selectedCategory"
            :search-term="searchTerm"
            :sort-by="sortBy"
            @update:category="(v) => { onCategoryChange(v); closeFilters() }"
            @update:search="onSearchChange"
            @update:sort="onSortChange"
          />
        </div>
      </div>
    </transition>
  </section>
</template>

<style scoped>
/* Container */
.page { max-width: 1400px; margin: 20px 45px; padding: 0 16px; color: var(--text, #c9d1d9); }
.page-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
h1 { margin: 0; }

/* Mobile filter toggle button (hidden on desktop) */
.filter-toggle {
  display: none;
  padding: 8px 12px; border-radius: 8px; border: 1px solid #30363d;
  background: var(--card, #0d1117); color: var(--text, #c9d1d9); cursor: pointer;
}

/* Layout */
.product-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 24px;
  margin-top: 18px;
}

/* Sticky Sidebar */
.sidebar-container {
  position: sticky;
  top: 84px; /* match your header height */
  height: fit-content;
}

/* Grid area */
.product-section { display: flex; flex-direction: column; gap: 18px; min-width: 0; }
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 18px;
}

/* States */
.error { color: #ff6b6b; margin: 8px 0 16px; }
.empty { margin: 12px 0; color: #9da7b1; text-align: center; }

/* Pagination */
.pagination { margin: 18px 0; display: flex; gap: 12px; align-items: center; justify-content: center; }
.pagination button { background: #238636; border: 0; color: #fff; padding: 8px 12px; border-radius: 8px; cursor: pointer; }
.pagination button:disabled { background: #555; cursor: not-allowed; }

/* Tablet */
@media (max-width: 1100px) {
  .product-layout { grid-template-columns: 220px 1fr; }
}

/* Mobile */
@media (max-width: 900px) {
  .filter-toggle { display: inline-flex; }
  .product-layout { grid-template-columns: 1fr; }
  .sidebar-container { display: none; } /* use drawer on mobile */
  .product-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 14px; }
}

/* Drawer */
.filter-drawer {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: grid; place-items: stretch; z-index: 60;
}
.drawer-panel {
  width: min(90vw, 360px); height: 100vh; background: var(--card, #0d1117);
  border-right: 1px solid #30363d; padding: 16px; overflow-y: auto;
}
.slide-enter-active, .slide-leave-active { transition: transform .25s ease, opacity .2s ease; }
.slide-enter-from, .slide-leave-to { transform: translateX(-8px); opacity: 0; }
</style>