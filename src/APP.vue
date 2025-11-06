<template>
  <div>
    <!-- Header -->
    <header class="bg-gradient-to-r from-blue-600 via-indigo-600 to-fuchsia-600 text-white">
      <div class="max-w-6xl mx-auto px-4 py-6">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-semibold tracking-tight">Solarization Planner</h1>
          <div class="hidden sm:flex items-center gap-3">
            <span class="badge">Vue 3 + Vite</span>
            <span class="badge">Single-file Ready</span>
          </div>
        </div>
        <p class="mt-2 text-white/90">
          Estimate PV, battery, and carbon impacts with a clean, responsive UI.
        </p>
      </div>
    </header>

    <!-- Main -->
    <main class="max-w-6xl mx-auto px-4 py-8">
      <SolarPlanner />
      <footer class="mt-10 text-sm text-slate-500 dark:text-slate-400">
        Tip: Use <span class="font-semibold">Tab</span> to move between fields. Results update on click.
      </footer>
    </main>
  </div>
</template>

<script setup lang="ts">
import SolarPlanner from './components/SolarPlanner.vue'
</script>
