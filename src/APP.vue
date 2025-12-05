<script setup lang="ts">
import SolarPlanner from './components/SolarPlanner.vue'
</script>

<template>
  <div class="page-shell">
    <!-- Top Bar / Header -->
    <header class="bg-unicef-dark text-white shadow">
      <div class="mx-auto max-w-6xl flex items-center gap-4 px-4 py-3">
        <!-- UNICEF logo: use official asset from the UNICEF brand toolkit -->
        <img
          src="./assets/unicef-logo.png"
          alt="UNICEF"
          class="h-8 w-auto"
        />

        <div class="flex flex-col">
          <span class="card-kicker text-white/75">
            UNICEF Regional Office for South Asia
          </span>
          <span class="text-sm font-semibold">
            SunPlanner: A Solarization Planning Tool
          </span>
        </div>

        <span class="ml-auto text-[14px] text-white/75 text-right">
            Turning sunlight into reliable services for every community.
        </span>
      </div>
    </header>

    <!-- Main content -->
    <main class="page-main">
      <SolarPlanner />
    </main>

    <!-- Footer -->
    <footer class="mt-6 border-t border-slate-200 bg-white/90">
      <div class="mx-auto max-w-6xl px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <!-- Left side: UN/UNICEF sustainability message -->
        <div class="flex items-center gap-2 text-[11px] text-slate-600">
          <!-- <span class="inline-block h-1 w-8 rounded-full bg-unicef"></span> -->
          <span>
            Aligned with UN and UNICEF system commitments to sustainable operations.
          </span>
        </div>

        <!-- Right side: copyright line -->
        <div class="text-[11px] text-slate-500 text-right">
          © 2025 All rights reserved.
        </div>
      </div>
    </footer>

  </div>
</template>




