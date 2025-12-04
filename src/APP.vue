<template>
  <div class="page-shell">
    <!-- Top Bar / Header -->
    <header class="bg-unicef-dark text-white shadow">
      <div class="mx-auto max-w-6xl flex items-center gap-4 px-4 py-3">
        <!-- UNICEF logo: use official asset from the UNICEF brand toolkit -->
        <img
          src="/assets/unicef-logo.png"
          alt="UNICEF"
          class="h-8 w-auto"
        />

        <div class="flex flex-col">
          <span class="card-kicker text-white/75">
            UNICEF Regional Office for South Asia
          </span>
          <span class="text-sm font-semibold">
            Solarization Planning Tool
          </span>
        </div>

        <span class="ml-auto text-[11px] text-white/75 text-right">
          Internal prototype – for UNICEF staff and partners only
        </span>
      </div>
    </header>

    <!-- Main content -->
    <main class="page-main">
      <SolarPlanner />
    </main>

    <!-- Footer -->
    <footer class="mt-6 border-t border-slate-200 bg-white/80">
      <div class="mx-auto max-w-6xl px-4 py-3 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div class="flex items-center gap-2 text-[11px] text-slate-500">
          <span class="inline-block h-1 w-8 rounded-full bg-unicef"></span>
          <span>
            Aligned with UNICEF and UN system commitments to sustainable operations
          </span>
        </div>
        <div class="text-[11px] text-slate-400 text-right">
          This tool is indicative and does not replace detailed engineering design.
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import SolarPlanner from './components/SolarPlanner.vue'
</script>
