<script setup lang="ts">
const props = defineProps<{
  categories: { _id: string; name: string }[]
  selectedCategory: string
  searchTerm: string
  sortBy: 'relevance' | 'price-asc' | 'price-desc' | 'title-asc' | 'title-desc'
}>()

const emits = defineEmits<{
  (e: 'update:category', val: string): void
  (e: 'update:search', val: string): void
  (e: 'update:sort', val: 'relevance' | 'price-asc' | 'price-desc' | 'title-asc' | 'title-desc'): void
}>()

function onCategoryClick(cat: string) {
  emits('update:category', cat)
}
</script>

<template>
  <aside class="sidebar">
    <div class="filter-block">
      <label class="label">Search</label>
      <input
        type="text"
        class="input"
        :value="searchTerm"
        placeholder="Search products..."
        @input="emits('update:search', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="filter-block">
      <label class="label">Sort by</label>
      <select class="select" :value="sortBy" @change="emits('update:sort', ($event.target as HTMLSelectElement).value as any)">
        <option value="relevance">Relevance</option>
        <option value="price-asc">Price: Low → High</option>
        <option value="price-desc">Price: High → Low</option>
        <option value="title-asc">Title: A → Z</option>
        <option value="title-desc">Title: Z → A</option>
      </select>
    </div>

    <div class="filter-block">
      <label class="label">Categories</label>
      <ul class="cats">
        <li
          :class="['cat', { active: selectedCategory === 'all' }]"
          @click="onCategoryClick('all')"
        >
          All
        </li>
        <li
        v-for="cat in categories"
        :key="cat._id"
        :class="['cat', { active: selectedCategory === cat._id }]"
        @click="onCategoryClick(cat._id)"
      >
        {{ cat.name }}
      </li>

      </ul>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  backdrop-filter: blur(14px);
  background: rgba(13,17,23,.55);
  border: 1px solid #30363d;
  border-radius: 16px;
  padding: 18px 16px;
  box-shadow: 0 10px 25px rgba(0,0,0,.30);
}
.filter-block { margin-bottom: 16px; }
.label { display: block; color: #9da7b1; margin-bottom: 6px; font-size: 0.9rem; }
.input, .select { width: 100%; background: #0b0f14; border: 1px solid #30363d; color: #c9d1d9; border-radius: 8px; padding: 8px 10px; }
.cats { list-style: none; padding: 0; margin: 8px 0 0; display: flex; flex-direction: column; gap: 6px; }
.cat { padding: 8px 10px; border-radius: 8px; cursor: pointer; border: 1px solid transparent; }
.cat:hover { background: #0b0f14; border-color: #30363d; }
.cat.active { background: #1b2838; border-color: #3a4450; color: #fff; }
</style>