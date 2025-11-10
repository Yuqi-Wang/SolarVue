<template>
  <section class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
    <!-- =========================
         PRESETS
         ========================= -->
    <div class="card">
      <h3 class="text-lg font-semibold mb-1">Presets</h3>
      <p class="text-xs text-slate-500 mb-3">
        Choose a scenario and click <b>Apply preset</b> to prefill typical values and essentials.
      </p>

      <label class="label">Scenario</label>
      <select class="select" v-model="presetKey">
        <option value="home">Home</option>
        <option value="clinic">Clinic</option>
        <option value="school">School</option>
      </select>

      <div class="flex gap-3 mt-3">
        <button class="btn" @click="applyPreset">Apply preset</button>
        <span class="text-xs text-slate-500 self-center">You can still edit any field after applying.</span>
      </div>
    </div>

    <!-- =========================
         LOCATION & SOLAR RESOURCE
         ========================= -->
    <div class="card xl:col-span-2">
      <h3 class="text-lg font-semibold mb-1">Location & Solar Resource</h3>
      <p class="text-xs text-slate-500 mb-3">
        Pick a country / region / city to auto-fill <b>Peak Sun Hours (PSH)</b>. You can override PSH manually below.
      </p>

      <div class="grid md:grid-cols-3 gap-3">
        <div>
          <label class="label">Country</label>
          <select class="select" v-model.number="countryIdx" @change="onCountryChange">
            <option v-for="(c, i) in WORLD_PSH" :key="c.name" :value="i">{{ c.name }}</option>
          </select>
        </div>
        <div>
          <label class="label">Region / State</label>
          <select class="select" v-model.number="regionIdx" @change="onRegionChange">
            <option v-for="(r, i) in WORLD_PSH[countryIdx].regions" :key="r.name" :value="i">{{ r.name }}</option>
          </select>
        </div>
        <div>
          <label class="label">City / Area</label>
          <select class="select" v-model.number="cityIdx">
            <option v-for="(ct, i) in WORLD_PSH[countryIdx].regions[regionIdx].cities" :key="ct.name" :value="i">
              {{ ct.name }}
            </option>
          </select>
        </div>
      </div>

      <div class="grid md:grid-cols-4 gap-3 mt-3">
        <div>
          <label class="label">PSH band</label>
          <select class="select" v-model="pshBand">
            <option value="low">Low (conservative)</option>
            <option value="mid">Mid (typical)</option>
            <option value="high">High (optimistic)</option>
          </select>
          <p class="text-[11px] text-slate-500 mt-1">Use sensitivity to bracket PV size.</p>
        </div>
        <div class="md:col-span-2">
          <label class="label">Apply preset PSH to tool</label>
          <button class="btn w-full" @click="applyPSHFromPreset">Use selected PSH</button>
          <p class="text-[11px] text-slate-500 mt-1">Sets the Peak Sun Hours field below.</p>
        </div>
      </div>
    </div>

    <!-- =========================
         DEMAND (SITE LOAD)
         ========================= -->
    <div class="card">
      <h3 class="text-lg font-semibold mb-1">Demand</h3>
      <p class="text-xs text-slate-500 mb-3">
        Provide either your monthly electricity bill in kilowatt-hours (kWh) or the number of residents.
      </p>

      <label class="label">Monthly electricity bill (kWh)</label>
      <input type="number" class="input" v-model.number="E_bill_month_kwh" min="0" step="10"/>
      <p class="text-[11px] text-slate-500 mt-1">If set &gt; 0, daily energy = bill ÷ 30.</p>

      <div class="grid grid-cols-2 gap-3 mt-3">
        <div>
          <label class="label">Daytime residents (people)</label>
          <input type="number" class="input" v-model.number="N_day" min="0"/>
          <p class="text-[11px] text-slate-500 mt-1">Used when bill is not provided.</p>
        </div>
        <div>
          <label class="label">Nighttime residents (people)</label>
          <input type="number" class="input" v-model.number="N_night" min="0"/>
          <p class="text-[11px] text-slate-500 mt-1">Used when bill is not provided.</p>
        </div>
      </div>

      <div class="mt-3">
        <label class="label">Expected load growth (%)</label>
        <input type="number" class="input" v-model.number="growth_pct" min="0" max="100"/>
        <p class="text-[11px] text-slate-500 mt-1">Future growth multiplier (capped at +100%).</p>
      </div>
    </div>

    <!-- =========================
         WATER & PUMP ENERGY
         ========================= -->
    <div class="card">
      <h3 class="text-lg font-semibold mb-1">Water & Pump</h3>
      <p class="text-xs text-slate-500 mb-3">
        Enter monthly water volume and, if available, pumping head (meters). If head is unknown,
        use <b>Pump rated power</b> and <b>Pump run-time (hours/day)</b>.
      </p>

      <label class="label">Water volume (liters per month)</label>
      <input type="number" class="input" v-model.number="W_month_liters" min="0" step="1000"/>
      <p class="text-[11px] text-slate-500 mt-1">Used to estimate daily pump energy.</p>

      <div class="grid grid-cols-4 gap-3 mt-3">
        <div>
          <label class="label">Static head (meters)</label>
          <input type="number" class="input" v-model.number="headInput" min="0"/>
          <p class="text-[11px] text-slate-500 mt-1">If 0, we’ll try other methods.</p>
        </div>
        <div>
          <label class="label">Pump efficiency (0–1)</label>
          <input type="number" class="input" v-model.number="pump_eff" min="0.1" max="0.95" step="0.05"/>
          <p class="text-[11px] text-slate-500 mt-1">Used in physics method.</p>
        </div>
        <div>
          <label class="label">Pump rated power (kW)</label>
          <input type="number" class="input" v-model.number="P_pump_kw" min="0.1" step="0.1"/>
          <p class="text-[11px] text-slate-500 mt-1">Used for runtime method.</p>
        </div>
        <div>
          <label class="label">Pump run-time (hours/day)</label>
          <input type="number" class="input" v-model.number="H_pump_hpd" min="0" step="0.25"/>
          <p class="text-[11px] text-slate-500 mt-1">Used for runtime method.</p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 mt-3">
        <div>
          <label class="label">Water service priority (1–10)</label>
          <input type="number" class="input" v-model.number="S_water" min="1" max="10"/>
          <p class="text-[11px] text-slate-500 mt-1">Higher can increase autonomy needs.</p>
        </div>
        <div>
          <label class="label">Water priority sensitivity (β)</label>
          <input type="number" class="input" v-model.number="beta_water" min="0" max="0.5" step="0.05"/>
          <p class="text-[11px] text-slate-500 mt-1">Inflates pump energy with priority.</p>
        </div>
      </div>
    </div>

    <!-- =========================
         OUTAGES, ESSENTIALS, CRITICAL
         ========================= -->
    <div class="card">
      <h3 class="text-lg font-semibold mb-1">Outages & Essentials</h3>
      <p class="text-xs text-slate-500 mb-3">
        Pick outage characteristics and mark essential appliances. For each selected appliance, set your desired hours/day.
      </p>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="label">Outage duration (typical)</label>
          <select class="select" v-model="outage_duration">
            <option>&lt;30m</option><option>30-60m</option><option>1-2h</option><option>&gt;2h</option>
          </select>
          <p class="text-[11px] text-slate-500 mt-1">Maps to autonomy hours.</p>
        </div>
        <div>
          <label class="label">Outage time (most likely)</label>
          <select class="select" v-model="outage_time">
            <option>Morning</option><option>Afternoon</option><option>Evening</option>
          </select>
          <p class="text-[11px] text-slate-500 mt-1">Evening implies higher need.</p>
        </div>
      </div>

      <div class="mt-3">
        <label class="label">Water autonomy extra (hours, max)</label>
        <input type="number" class="input" v-model.number="T_water_extra_h_max" min="0" max="2" step="0.5"/>
        <p class="text-[11px] text-slate-500 mt-1">Extra hours added when water priority is high.</p>
      </div>

      <div class="mt-4">
        <h4 class="font-medium text-sm mb-2">Essential electrical appliances</h4>
        <div class="grid grid-cols-1 gap-2">
          <div v-for="(ap, idx) in applianceCatalog" :key="ap.id" class="flex flex-col gap-1 border rounded-lg p-2">
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="appliancesSelected[idx]"/>
              <span class="font-medium">{{ ap.name }}</span>
              <span class="text-xs text-slate-500">— Rated {{ ap.powerW }} W</span>
            </label>
            <div v-if="appliancesSelected[idx]" class="grid grid-cols-2 gap-2 pl-7">
              <div>
                <label class="label !text-[11px]">Desired hours/day</label>
                <input type="number" class="input" v-model.number="applianceHours[idx]" min="0" step="0.25"/>
              </div>
              <div class="self-end text-[11px] text-slate-500">
                Energy ≈ {{ ((ap.powerW * (applianceHours[idx] ?? ap.hoursPerDay))/1000).toFixed(2) }} kWh/day
              </div>
            </div>
          </div>
        </div>
        <p class="text-[11px] text-slate-500 mt-2">
          Essential energy = Σ(power × user hours) / 1000 (kWh/day).
        </p>
      </div>
    </div>

    <!-- =========================
         PV & SITE PARAMETERS
         ========================= -->
    <div class="card xl:col-span-2">
      <h3 class="text-lg font-semibold mb-1">Photovoltaic (PV) & Site</h3>
      <p class="text-xs text-slate-500 mb-3">
        Enter irradiance and performance details. Full terms precede abbreviations.
      </p>

      <div class="grid md:grid-cols-3 gap-3">
        <div>
          <label class="label">Peak Sun Hours (PSH)</label>
          <input type="number" class="input" v-model.number="PSH" min="2" max="7" step="0.1"/>
          <p class="text-[11px] text-slate-500 mt-1">Average equivalent full-sun hours per day.</p>
        </div>
        <div>
          <label class="label">Performance Ratio (PR, base)</label>
          <input type="number" class="input" v-model.number="PR_base" min="0.6" max="0.9" step="0.01"/>
          <p class="text-[11px] text-slate-500 mt-1">System losses before shading and events.</p>
        </div>
        <div>
          <label class="label">Shading (percent)</label>
          <input type="number" class="input" v-model.number="shading_pct" min="0" max="100"/>
          <p class="text-[11px] text-slate-500 mt-1">Reduces PR linearly.</p>
        </div>
      </div>

      <!-- Severe events: MULTI-SELECT with per-event frequency -->
      <div class="mt-4">
        <h4 class="font-medium text-sm mb-2">Severe weather events (select multiple)</h4>
        <div class="grid grid-cols-1 gap-2">
          <div v-for="(ev, i) in eventCatalog" :key="ev.id" class="flex flex-col gap-1 border rounded-lg p-2">
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="eventsSelected[i]" />
              <span class="font-medium">{{ ev.name }}</span>
              <span class="text-xs text-slate-500">— base margin {{ (ev.base*100).toFixed(1) }}%</span>
            </label>
            <div v-if="eventsSelected[i]" class="grid grid-cols-2 md:grid-cols-3 gap-2 pl-7">
              <div>
                <label class="label !text-[11px]">Frequency</label>
                <select class="select" v-model="eventFrequency[i]">
                  <option>Rare</option><option>Seasonal</option><option>Often</option>
                </select>
              </div>
              <div class="self-end text-[11px] text-slate-500">
                Applied = base × freq = {{ (ev.base * freqMult(eventFrequency[i]) * 100).toFixed(1) }}%
              </div>
            </div>
          </div>
        </div>
        <p class="text-[11px] text-slate-500 mt-2">
          Total severe-event margin is the sum of all selected events (capped in overall margin).
        </p>
      </div>

      <div class="grid md:grid-cols-3 gap-3 mt-3">
        <div>
          <label class="label">Electricity service priority (1–10)</label>
          <input type="number" class="input" v-model.number="S_elec" min="1" max="10"/>
          <p class="text-[11px] text-slate-500 mt-1">High values add a small margin.</p>
        </div>
        <div>
          <label class="label">Direct-Current / Alternating-Current ratio (DC/AC)</label>
          <input type="number" class="input" v-model.number="DC_AC" min="1.0" max="1.6" step="0.05"/>
          <p class="text-[11px] text-slate-500 mt-1">Used for inverter sizing.</p>
        </div>
        <div>
          <label class="label">System efficiency (η, 0–1)</label>
          <input type="number" class="input" v-model.number="eta_sys" min="0.7" max="1.0" step="0.02"/>
          <p class="text-[11px] text-slate-500 mt-1">Applied in battery nameplate sizing.</p>
        </div>
      </div>

      <div class="grid md:grid-cols-3 gap-3 mt-3">
        <div>
          <label class="label">Available roof area (m²)</label>
          <input type="number" class="input" v-model.number="A_roof_m2" min="0" step="10"/>
        </div>
        <div>
          <label class="label">Available ground area (m²)</label>
          <input type="number" class="input" v-model.number="A_ground_m2" min="0" step="10"/>
        </div>
        <div>
          <label class="label">Module power density (kWp per m²)</label>
          <input type="number" class="input" v-model.number="PD_kwp_per_m2" min="0.1" max="0.25" step="0.01"/>
          <p class="text-[11px] text-slate-500 mt-1">Caps PV based on area × density.</p>
        </div>
      </div>

      <div class="grid md:grid-cols-2 gap-3 mt-3">
        <div>
          <label class="label">Battery depth of discharge (DoD, 0–1)</label>
          <input type="number" class="input" v-model.number="DoD" min="0.5" max="0.95" step="0.05"/>
          <p class="text-[11px] text-slate-500 mt-1">Fraction of capacity you can use.</p>
        </div>
        <div>
          <label class="label">—</label>
          <p class="text-[11px] text-slate-500 mt-1">Pump fields are in Water & Pump.</p>
        </div>
      </div>
    </div>

    <!-- =========================
         CARBON ACCOUNTING
         ========================= -->
    <div class="card">
      <h3 class="text-lg font-semibold mb-1">Carbon</h3>
      <p class="text-xs text-slate-500 mb-3">
        Choose a baseline and enter emission factors to value avoided emissions.
      </p>

      <label class="label">Baseline source</label>
      <select class="select" v-model="baseline">
        <option>Grid</option><option>Diesel</option>
      </select>

      <div class="grid grid-cols-3 gap-3 mt-3">
        <div>
          <label class="label">Grid emission factor (kgCO₂ per kWh)</label>
          <input type="number" class="input" v-model.number="EF_grid" min="0" step="0.05"/>
        </div>
        <div>
          <label class="label">Diesel emission factor (kgCO₂ per kWh)</label>
          <input type="number" class="input" v-model.number="EF_diesel" min="0" step="0.05"/>
        </div>
        <div>
          <label class="label">Carbon price (US$ per tCO₂e)</label>
          <input type="number" class="input" v-model.number="p_CO2" min="0" step="1"/>
        </div>
      </div>
    </div>

    <!-- =========================
         RESULTS (DERIVED)
         ========================= -->
    <div class="card xl:col-span-3">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">Results</h3>
        <button class="btn" @click="calc">Run sizing</button>
      </div>

      <div v-if="r" class="mt-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
        <table class="w-full text-sm">
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr class="bg-slate-50/60 dark:bg-slate-800/50"><th class="text-left px-4 py-3">Daily energy (kWh/day)</th><td class="px-4 py-3 text-right">{{ r.E_daily.toFixed(2) }}</td></tr>
            <tr><th class="text-left px-4 py-3">Autonomy (hours)</th><td class="px-4 py-3 text-right">{{ r.T_aut.toFixed(2) }}</td></tr>
            <tr><th class="text-left px-4 py-3">Essential energy (kWh/day)</th><td class="px-4 py-3 text-right">{{ r.E_ess.toFixed(2) }}</td></tr>
            <tr><th class="text-left px-4 py-3">Battery energy (kWh, nameplate)</th><td class="px-4 py-3 text-right">{{ r.E_bat.toFixed(2) }}</td></tr>
            <tr><th class="text-left px-4 py-3">PV raw (kWp)</th><td class="px-4 py-3 text-right">{{ r.kWp_raw.toFixed(2) }}</td></tr>
            <tr><th class="text-left px-4 py-3">PV cap (kWp)</th><td class="px-4 py-3 text-right">{{ r.kWp_cap.toFixed(2) }}</td></tr>
            <tr class="bg-slate-50/60 dark:bg-slate-800/50"><th class="text-left px-4 py-3">PV final (kWp)</th><td class="px-4 py-3 text-right font-semibold">{{ r.kWp.toFixed(2) }}</td></tr>
            <tr><th class="text-left px-4 py-3">Inverter (kW)</th><td class="px-4 py-3 text-right">{{ r.P_inv.toFixed(2) }}</td></tr>
            <tr><th class="text-left px-4 py-3">PV energy (kWh/year)</th><td class="px-4 py-3 text-right">{{ Math.round(r.E_pv_yr) }}</td></tr>
            <tr><th class="text-left px-4 py-3">Avoided CO₂ (t/year)</th><td class="px-4 py-3 text-right">{{ r.tCO2_yr.toFixed(2) }}</td></tr>
            <tr><th class="text-left px-4 py-3">Carbon value (US$/year)</th><td class="px-4 py-3 text-right">{{ r.value_carbon_yr.toFixed(2) }}</td></tr>
          </tbody>
        </table>

        <!-- PSH Sensitivity -->
        <div class="p-4">
          <h4 class="font-medium mb-2">PSH Sensitivity (based on selected city)</h4>
          <table class="w-full text-sm">
            <tbody>
              <tr><th class="text-left px-4 py-2">Low band (h/day)</th><td class="px-4 py-2 text-right">{{ pshLow.toFixed(2) }} → {{ kWpAt(pshLow).toFixed(2) }} kWp</td></tr>
              <tr><th class="text-left px-4 py-2">Mid band (h/day)</th><td class="px-4 py-2 text-right">{{ pshMid.toFixed(2) }} → {{ kWpAt(pshMid).toFixed(2) }} kWp</td></tr>
              <tr><th class="text-left px-4 py-2">High band (h/day)</th><td class="px-4 py-2 text-right">{{ pshHigh.toFixed(2) }} → {{ kWpAt(pshHigh).toFixed(2) }} kWp</td></tr>
            </tbody>
          </table>
          <p class="text-[11px] text-slate-500 mt-2">
            Sensitivity uses current inputs with PSH swapped for the Low/Mid/High bands of the selected city.
          </p>
        </div>
      </div>
      <p v-else class="mt-4 text-slate-500 dark:text-slate-400">Click <b>Run sizing</b> to compute results.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

/* =========================
   WORLD PSH DATA (expand anytime)
   ========================= */
type PshBand = { low: number; mid: number; high: number }
type CityPSH = { name: string; psh: PshBand }
type RegionPSH = { name: string; cities: CityPSH[] }
type CountryPSH = { name: string; regions: RegionPSH[] }

const WORLD_PSH: CountryPSH[] = [
  // --- SOUTH ASIA ---
  { name: 'India', regions: [
    { name: 'Delhi NCR', cities: [ { name: 'New Delhi', psh: { low: 4.2, mid: 4.7, high: 5.1 } } ] },
    { name: 'Maharashtra', cities: [
      { name: 'Mumbai', psh: { low: 4.5, mid: 5.0, high: 5.5 } },
      { name: 'Pune',   psh: { low: 4.7, mid: 5.2, high: 5.7 } }
    ] },
    { name: 'Rajasthan', cities: [ { name: 'Jaipur', psh: { low: 5.0, mid: 5.5, high: 6.0 } } ] }
  ]},
  { name: 'Pakistan', regions: [
    { name: 'Punjab', cities: [ { name: 'Lahore', psh: { low: 4.5, mid: 5.0, high: 5.4 } } ] },
    { name: 'Sindh',  cities: [ { name: 'Karachi', psh: { low: 4.7, mid: 5.2, high: 5.6 } } ] }
  ]},
  { name: 'Bangladesh', regions: [
    { name: 'Dhaka Division', cities: [ { name: 'Dhaka', psh: { low: 4.0, mid: 4.5, high: 5.0 } } ] }
  ]},
  { name: 'Nepal', regions: [
    { name: 'Bagmati', cities: [ { name: 'Kathmandu', psh: { low: 4.2, mid: 4.8, high: 5.3 } } ] }
  ]},
  { name: 'Sri Lanka', regions: [
    { name: 'Western Province', cities: [ { name: 'Colombo', psh: { low: 4.6, mid: 5.1, high: 5.6 } } ] }
  ]},
  { name: 'Maldives', regions: [
    { name: 'North Malé Atoll', cities: [ { name: 'Malé', psh: { low: 5.0, mid: 5.5, high: 5.9 } } ] }
  ]},
  { name: 'Bhutan', regions: [
    { name: 'Thimphu', cities: [ { name: 'Thimphu', psh: { low: 4.2, mid: 4.7, high: 5.1 } } ] }
  ]},
  { name: 'Afghanistan', regions: [
    { name: 'Kabul', cities: [ { name: 'Kabul', psh: { low: 4.5, mid: 5.0, high: 5.6 } } ] }
  ]},

  // --- OTHER REGIONS (samples you can expand) ---
  { name: 'United States', regions: [
    { name: 'California', cities: [
      { name: 'Los Angeles', psh: { low: 4.8, mid: 5.6, high: 6.2 } },
      { name: 'San Francisco', psh: { low: 4.5, mid: 5.2, high: 5.8 } }
    ]},
    { name: 'Arizona', cities: [ { name: 'Phoenix', psh: { low: 5.5, mid: 6.0, high: 6.6 } } ] }
  ]},
  { name: 'Europe', regions: [
    { name: 'Germany', cities: [ { name: 'Berlin', psh: { low: 2.8, mid: 3.3, high: 3.8 } } ] },
    { name: 'Spain',   cities: [ { name: 'Madrid', psh: { low: 4.2, mid: 4.8, high: 5.4 } } ] }
  ]},
  { name: 'East Asia', regions: [
    { name: 'China', cities: [
      { name: 'Beijing', psh: { low: 3.8, mid: 4.4, high: 5.0 } },
      { name: 'Urumqi',  psh: { low: 4.6, mid: 5.4, high: 6.2 } }
    ]},
    { name: 'Japan', cities: [ { name: 'Tokyo', psh: { low: 3.5, mid: 4.0, high: 4.6 } } ] }
  ]},
  { name: 'Africa', regions: [
    { name: 'North Africa', cities: [ { name: 'Cairo', psh: { low: 5.2, mid: 5.8, high: 6.4 } } ] },
    { name: 'Southern Africa', cities: [ { name: 'Johannesburg', psh: { low: 4.6, mid: 5.2, high: 5.8 } } ] }
  ]},
  { name: 'South America', regions: [
    { name: 'Brazil', cities: [ { name: 'São Paulo', psh: { low: 4.2, mid: 4.7, high: 5.3 } } ] },
    { name: 'Chile',  cities: [ { name: 'Santiago', psh: { low: 4.6, mid: 5.1, high: 5.7 } } ] }
  ]}
]

/* =========================
   COUNTRY/REGION/CITY PICKERS
   ========================= */
const countryIdx = ref<number>(0)
const regionIdx = ref<number>(0)
const cityIdx = ref<number>(0)
const pshBand = ref<'low'|'mid'|'high'>('mid')

function onCountryChange() { regionIdx.value = 0; cityIdx.value = 0 }
function onRegionChange()  { cityIdx.value = 0 }

function applyPSHFromPreset() {
  const c = WORLD_PSH[countryIdx.value]
  const r = c.regions[regionIdx.value]
  const city = r.cities[cityIdx.value]
  PSH.value = city.psh[pshBand.value]
}

/* Convenience getters for sensitivity table */
const pshLow  = computed(() => WORLD_PSH[countryIdx.value].regions[regionIdx.value].cities[cityIdx.value].psh.low)
const pshMid  = computed(() => WORLD_PSH[countryIdx.value].regions[regionIdx.value].cities[cityIdx.value].psh.mid)
const pshHigh = computed(() => WORLD_PSH[countryIdx.value].regions[regionIdx.value].cities[cityIdx.value].psh.high)

/* =========================
   PRESETS (scenarios)
   ========================= */
type Preset = {
  E_bill_month_kwh: number; N_day: number; N_night: number; growth_pct: number;
  W_month_liters: number; headInput: number; pump_eff: number; P_pump_kw: number; H_pump_hpd: number;
  S_water: number; beta_water: number;
  outage_duration: string; outage_time: string; T_water_extra_h_max: number;
  PSH: number; PR_base: number; shading_pct: number;
  dust_level: string; selectedEventIds: string[]; eventFreqs: Record<string,'Rare'|'Seasonal'|'Often'>; S_elec: number;
  A_roof_m2: number; A_ground_m2: number; PD_kwp_per_m2: number;
  DC_AC: number; DoD: number; eta_sys: number;
  baseline: string; EF_grid: number; EF_diesel: number; p_CO2: number;
  selectedApplianceIds: string[]; applianceHours?: Record<string, number>;
}

const presets: Record<string, Preset> = {
  home: {
    E_bill_month_kwh: 0, N_day: 4, N_night: 4, growth_pct: 10,
    W_month_liters: 12000, headInput: 8, pump_eff: 0.55, P_pump_kw: 0.75, H_pump_hpd: 0.8,
    S_water: 7, beta_water: 0.25,
    outage_duration: '30-60m', outage_time: 'Evening', T_water_extra_h_max: 0.5,
    PSH: 4.8, PR_base: 0.78, shading_pct: 5,
    dust_level: 'Medium',
    selectedEventIds: ['Thunderstorm'],
    eventFreqs: { Thunderstorm: 'Seasonal' },
    S_elec: 7,
    A_roof_m2: 100, A_ground_m2: 0, PD_kwp_per_m2: 0.19,
    DC_AC: 1.2, DoD: 0.8, eta_sys: 0.9,
    baseline: 'Grid', EF_grid: 0.6, EF_diesel: 0.8, p_CO2: 6,
    selectedApplianceIds: ['light','fan','router','phone','tv','fridge'],
    applianceHours: { light: 5, fan: 6, router: 12, phone: 2, tv: 3, fridge: 8 }
  },
  clinic: {
    E_bill_month_kwh: 0, N_day: 8, N_night: 1, growth_pct: 20,
    W_month_liters: 20000, headInput: 12, pump_eff: 0.6, P_pump_kw: 1.1, H_pump_hpd: 1.5,
    S_water: 9, beta_water: 0.3,
    outage_duration: '1-2h', outage_time: 'Afternoon', T_water_extra_h_max: 1.0,
    PSH: 4.5, PR_base: 0.78, shading_pct: 3,
    dust_level: 'Medium',
    selectedEventIds: ['Cyclone','HeavyRain'],
    eventFreqs: { Cyclone: 'Rare', HeavyRain: 'Seasonal' },
    S_elec: 9,
    A_roof_m2: 180, A_ground_m2: 60, PD_kwp_per_m2: 0.19,
    DC_AC: 1.2, DoD: 0.85, eta_sys: 0.9,
    baseline: 'Diesel', EF_grid: 0.6, EF_diesel: 0.8, p_CO2: 10,
    selectedApplianceIds: ['light','router','laptop','clinic','fridge'],
    applianceHours: { light: 8, router: 12, laptop: 4, clinic: 2, fridge: 8 }
  },
  school: {
    E_bill_month_kwh: 0, N_day: 30, N_night: 0, growth_pct: 15,
    W_month_liters: 30000, headInput: 6, pump_eff: 0.55, P_pump_kw: 1.5, H_pump_hpd: 1.2,
    S_water: 8, beta_water: 0.25,
    outage_duration: '30-60m', outage_time: 'Afternoon', T_water_extra_h_max: 0.5,
    PSH: 5.0, PR_base: 0.8, shading_pct: 2,
    dust_level: 'Low',
    selectedEventIds: ['Heatwave','Thunderstorm'],
    eventFreqs: { Heatwave: 'Seasonal', Thunderstorm: 'Seasonal' },
    S_elec: 8,
    A_roof_m2: 350, A_ground_m2: 100, PD_kwp_per_m2: 0.19,
    DC_AC: 1.2, DoD: 0.8, eta_sys: 0.9,
    baseline: 'Grid', EF_grid: 0.6, EF_diesel: 0.8, p_CO2: 6,
    selectedApplianceIds: ['light','router','laptop','fan'],
    applianceHours: { light: 6, router: 10, laptop: 4, fan: 6 }
  }
}

const presetKey = ref<'home'|'clinic'|'school'>('home')
function applyPreset() {
  const p = presets[presetKey.value]
  // demand
  E_bill_month_kwh.value = p.E_bill_month_kwh
  N_day.value = p.N_day; N_night.value = p.N_night; growth_pct.value = p.growth_pct
  // water
  W_month_liters.value = p.W_month_liters; headInput.value = p.headInput
  pump_eff.value = p.pump_eff; P_pump_kw.value = p.P_pump_kw; H_pump_hpd.value = p.H_pump_hpd
  S_water.value = p.S_water; beta_water.value = p.beta_water
  // outages
  outage_duration.value = p.outage_duration; outage_time.value = p.outage_time
  T_water_extra_h_max.value = p.T_water_extra_h_max
  // pv/site
  PSH.value = p.PSH; PR_base.value = p.PR_base; shading_pct.value = p.shading_pct
  dust_level.value = p.dust_level; S_elec.value = p.S_elec
  A_roof_m2.value = p.A_roof_m2; A_ground_m2.value = p.A_ground_m2
  PD_kwp_per_m2.value = p.PD_kwp_per_m2
  DC_AC.value = p.DC_AC; DoD.value = p.DoD; eta_sys.value = p.eta_sys
  // carbon
  baseline.value = p.baseline; EF_grid.value = p.EF_grid
  EF_diesel.value = p.EF_diesel; p_CO2.value = p.p_CO2
  // appliances (selection + hours)
  appliancesSelected.value = applianceCatalog.map(it => p.selectedApplianceIds.includes(it.id))
  applianceHours.value = applianceCatalog.map(it => p.applianceHours?.[it.id] ?? it.hoursPerDay)
  // severe events (multi)
  eventsSelected.value = eventCatalog.map(ev => p.selectedEventIds.includes(ev.id))
  eventFrequency.value = eventCatalog.map(ev => p.eventFreqs[ev.id] ?? 'Seasonal')
}

/* =========================
   INPUT STATE
   ========================= */
// Demand
const E_bill_month_kwh = ref<number>(0)
const N_day = ref<number>(0)
const N_night = ref<number>(0)
const growth_pct = ref<number>(0)
// Water & Pump
const W_month_liters = ref<number>(0)
const headInput = ref<number>(0)
const pump_eff = ref<number>(0.55)
const P_pump_kw = ref<number>(0.75)
const H_pump_hpd = ref<number>(0)            // runtime method
const S_water = ref<number>(7)
const beta_water = ref<number>(0.3)
// Outages
const outage_duration = ref<string>('30-60m')
const outage_time = ref<string>('Afternoon')
const T_water_extra_h_max = ref<number>(1.0)
// PV/Site
const PSH = ref<number>(4.5)                 // Peak Sun Hours
const PR_base = ref<number>(0.78)            // Performance Ratio (base)
const shading_pct = ref<number>(0)
const dust_level = ref<string>('Low')
const S_elec = ref<number>(7)
const A_roof_m2 = ref<number>(120)
const A_ground_m2 = ref<number>(0)
const PD_kwp_per_m2 = ref<number>(0.19)
const DC_AC = ref<number>(1.2)               // DC/AC ratio
const DoD = ref<number>(0.8)                 // Depth of Discharge
const eta_sys = ref<number>(0.9)             // System efficiency
// Carbon
const baseline = ref<string>('Grid')
const EF_grid = ref<number>(0.6)             // kgCO2/kWh
const EF_diesel = ref<number>(0.8)           // kgCO2/kWh
const p_CO2 = ref<number>(6.0)               // $/tCO2e

const growth_cap = 2.0

/* =========================
   APPLIANCE CATALOG (editable hours/day)
   ========================= */
const applianceCatalog = [
  { id: 'light',     name: 'LED lighting (2 rooms)', powerW: 20*2,   hoursPerDay: 5 },
  { id: 'fan',       name: 'Ceiling fan',            powerW: 60,     hoursPerDay: 6 },
  { id: 'router',    name: 'Wi-Fi router',           powerW: 12,     hoursPerDay: 12 },
  { id: 'phone',     name: 'Phone charging (2×)',    powerW: 10,     hoursPerDay: 2 },
  { id: 'laptop',    name: 'Laptop',                 powerW: 60,     hoursPerDay: 4 },
  { id: 'tv',        name: 'Television',             powerW: 80,     hoursPerDay: 3 },
  { id: 'fridge',    name: 'Refrigerator (small)',   powerW: 120,    hoursPerDay: 8 },
  { id: 'clinic',    name: 'Clinic essentials (mix)',powerW: 250,    hoursPerDay: 2 },
]
const appliancesSelected = ref<boolean[]>(applianceCatalog.map(() => false))
const applianceHours = ref<number[]>(applianceCatalog.map(ap => ap.hoursPerDay))

/* =========================
   SEVERE EVENT CATALOG (multi-select)
   ========================= */
type EventItem = { id: string; name: string; base: number } // base = base margin (unitless)
const eventCatalog: EventItem[] = [
  { id: 'Thunderstorm', name: 'Thunderstorm',    base: 0.02 },
  { id: 'SandDust',     name: 'Sand/Dust Storm', base: 0.05 },
  { id: 'HeavyRain',    name: 'Heavy Rain',      base: 0.03 },
  { id: 'Hail',         name: 'Hail',            base: 0.04 },
  { id: 'Heatwave',     name: 'Heatwave',        base: 0.02 },
  { id: 'ColdSnap',     name: 'Cold Snap',       base: 0.02 },
  { id: 'Cyclone',      name: 'Cyclone/Typhoon', base: 0.08 },
]
const eventsSelected = ref<boolean[]>(eventCatalog.map(() => false))
const eventFrequency = ref<Array<'Rare'|'Seasonal'|'Often'>>(eventCatalog.map(() => 'Seasonal'))
function freqMult(freq: 'Rare'|'Seasonal'|'Often'): number {
  return freq === 'Rare' ? 0.6 : (freq === 'Often' ? 1.4 : 1.0)
}

/* =========================
   HELPERS & SUB-FUNCTIONS
   ========================= */
const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b)

function dailySite(): number {
  if (E_bill_month_kwh.value && E_bill_month_kwh.value > 0) return E_bill_month_kwh.value / 30
  // fallback proxy (kWh/day): day person ~2.8; night person ~1.4
  return 2.8 * N_day.value + 1.4 * N_night.value
}

function pumpEnergy(): number {
  const m3_day = (W_month_liters.value / 30) / 1000 // liters->m3 per day
  const head = headInput.value && headInput.value > 0 ? headInput.value : 0

  // 1) Physics-based if head provided
  if (head > 0 && pump_eff.value > 0) {
    const rho = 1000, g = 9.81
    const J = rho * g * head * m3_day
    return Math.max(J / (pump_eff.value * 3.6e6), 0) // J -> kWh
  }
  // 2) Runtime method if rated power & hours provided
  if ((P_pump_kw.value ?? 0) > 0 && (H_pump_hpd.value ?? 0) > 0) {
    return P_pump_kw.value * H_pump_hpd.value
  }
  // 3) Volume proxy fallback
  const e_spec = 0.45 // kWh per m3 proxy
  return m3_day * e_spec
}

const waterFactor = () => 1 + beta_water.value * Math.max(0, (S_water.value - 7) / 3)
const growth = () => Math.min(1 + growth_pct.value / 100, growth_cap)

const E_essential_daily = computed(() => {
  let wh = 0
  appliancesSelected.value.forEach((on, i) => {
    if (on) {
      const hours = (applianceHours.value[i] ?? applianceCatalog[i].hoursPerDay)
      wh += applianceCatalog[i].powerW * hours
    }
  })
  return wh / 1000 // kWh/day
})

function autonomyHours(): number {
  const baseMap: Record<string, number> = {"<30m":0.5,"30-60m":1,"1-2h":2,">2h":3}
  const tMult: Record<string, number> = {"Morning":1,"Afternoon":1.2,"Evening":1.5}
  const Tbase = baseMap[outage_duration.value] ?? 1
  const kappa = tMult[outage_time.value] ?? 1
  const T = Math.max(2, Tbase * kappa)
  const bump = T_water_extra_h_max.value * Math.max(0, (S_water.value - 7) / 2)
  return T + bump
}

const PR_eff = () => PR_base.value * (1 - shading_pct.value / 100)

const M_dust = () => ({Low:0.00, Medium:0.05, Heavy:0.10}[dust_level.value] ?? 0)

function M_severe(): number {
  let sum = 0
  eventsSelected.value.forEach((on, i) => {
    if (on) sum += eventCatalog[i].base * freqMult(eventFrequency.value[i])
  })
  return sum
}

const M_priority = () => (S_elec.value >= 8 ? 0.02 : 0) + (S_water.value >= 8 ? 0.02 : 0)
const M_tot = () => Math.min(M_dust() + M_severe() + M_priority(), 0.20)

/* =========================
   RESULTS
   ========================= */
type Result = {
  E_daily: number; T_aut: number; E_ess: number; E_bat: number;
  PR_eff: number; kWp_raw: number; kWp_cap: number; kWp: number; P_inv: number;
  E_pv_yr: number; E_load_yr: number; E_matched: number; tCO2_yr: number; value_carbon_yr: number;
}
const r = ref<Result | null>(null)

/* kWp at a given PSH (for sensitivity table) */
function kWpAt(psh: number) {
  const PR = PR_eff()
  const E_daily_now = (dailySite() + pumpEnergy() * waterFactor()) * growth()
  const kWp_raw = (E_daily_now / (psh * PR)) * (1 + M_tot())
  const kWp_cap = (A_roof_m2.value + A_ground_m2.value) * PD_kwp_per_m2.value
  return Math.min(kWp_raw, kWp_cap)
}

/* MAIN CALC */
function calc(): void {
  // 1) Daily energy
  const E_site = dailySite()
  const E_pump = pumpEnergy() * waterFactor()
  const G = growth()
  const E_daily = (E_site + E_pump) * G

  // 2) Battery sizing (max of autonomy share or essential appliances)
  const Taut = autonomyHours()
  const E_aut = E_daily * (Taut / 24)
  const E_ess = Math.min(E_essential_daily.value, E_daily)
  const E_need = Math.max(E_aut, E_ess)
  const E_bat = E_need / (DoD.value * eta_sys.value)

  // 3) PV sizing
  const PR = PR_eff()
  const kWp_raw = (E_daily / (PSH.value * PR)) * (1 + M_tot())
  const kWp_cap = (A_roof_m2.value + A_ground_m2.value) * PD_kwp_per_m2.value
  const kWp = Math.min(kWp_raw, kWp_cap)
  const P_inv = kWp / DC_AC.value

  // 4) Annual energy & carbon
  const E_pv_yr = kWp * PSH.value * PR * 365
  const E_load_yr = E_daily * 365
  const E_matched = Math.min(E_pv_yr, E_load_yr)
  const EF = baseline.value === 'Grid' ? EF_grid.value : EF_diesel.value
  const tCO2_yr = E_matched * EF / 1000
  const value_carbon_yr = tCO2_yr * p_CO2.value

  r.value = { E_daily, T_aut: Taut, E_ess, E_bat, PR_eff: PR,
              kWp_raw, kWp_cap, kWp, P_inv,
              E_pv_yr, E_load_yr, E_matched, tCO2_yr, value_carbon_yr }
}
</script>

<style scoped>
.card { @apply rounded-2xl border border-slate-200 p-4 bg-white shadow-sm; }
.label { @apply block text-sm font-medium mb-1; }
.input { @apply w-full border rounded-lg px-3 py-2 outline-none focus:ring; }
.select { @apply w-full border rounded-lg px-3 py-2 outline-none focus:ring bg-white; }
.btn { @apply inline-flex items-center justify-center rounded-lg px-3 py-2 border bg-blue-900 text-white hover:opacity-90; }
</style>
