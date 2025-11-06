<template>
  <section class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
    <!-- =========================
         PRESETS
         ========================= -->
    <div class="card">
      <h3 class="text-lg font-semibold mb-1">Presets</h3>
      <p class="text-xs text-slate-500 mb-3">
        Choose a scenario and click <b>Apply preset</b> to prefill typical values and essential appliances.
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
        Enter monthly water volume and (optionally) pumping head to estimate pumping energy.
      </p>

      <label class="label">Water volume (liters per month)</label>
      <input type="number" class="input" v-model.number="W_month_liters" min="0" step="1000"/>
      <p class="text-[11px] text-slate-500 mt-1">Used to estimate daily pump energy.</p>

      <div class="grid grid-cols-3 gap-3 mt-3">
        <div>
          <label class="label">Static head (meters)</label>
          <input type="number" class="input" v-model.number="headInput" min="0"/>
          <p class="text-[11px] text-slate-500 mt-1">If 0, a kWh/m³ proxy is used.</p>
        </div>
        <div>
          <label class="label">Pump efficiency (0–1)</label>
          <input type="number" class="input" v-model.number="pump_eff" min="0.1" max="0.95" step="0.05"/>
          <p class="text-[11px] text-slate-500 mt-1">Higher means less energy needed.</p>
        </div>
        <div>
          <label class="label">Pump rated power (kilowatts)</label>
          <input type="number" class="input" v-model.number="P_pump_kw" min="0.1" step="0.1"/>
          <p class="text-[11px] text-slate-500 mt-1">Reference (not used directly).</p>
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
          <p class="text-[11px] text-slate-500 mt-1">How strongly priority inflates pump energy.</p>
        </div>
      </div>
    </div>

    <!-- =========================
         OUTAGES, ESSENTIAL APPLIANCES, CRITICAL
         ========================= -->
    <div class="card">
      <h3 class="text-lg font-semibold mb-1">Outages & Essentials</h3>
      <p class="text-xs text-slate-500 mb-3">
        Pick outage characteristics and mark essential electrical appliances to cover.
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
        <h4 class="font-medium text-sm mb-2">Essential electrical appliances (select)</h4>
        <div class="grid grid-cols-2 gap-2">
          <label v-for="(ap, idx) in applianceCatalog" :key="ap.id"
                 class="flex items-center gap-2 text-sm">
            <input type="checkbox" v-model="appliancesSelected[idx]"/>
            <span>
              {{ ap.name }}
              <span class="text-xs text-slate-500">
                — {{ ap.powerW }} W × {{ ap.hoursPerDay }} h/day
              </span>
            </span>
          </label>
        </div>
        <p class="text-[11px] text-slate-500 mt-2">
          Essential energy = Σ(power × hours) / 1000 (kWh/day). Battery must at least cover this during outages.
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

      <div class="grid md:grid-cols-3 gap-3 mt-3">
        <div>
          <label class="label">Dust level</label>
          <select class="select" v-model="dust_level">
            <option>Low</option><option>Medium</option><option>Heavy</option>
          </select>
          <p class="text-[11px] text-slate-500 mt-1">Higher dust increases margin.</p>
        </div>
        <div>
          <label class="label">Severe weather event (most impactful)</label>
          <select class="select" v-model="severe_event">
            <option>None</option>
            <option>Thunderstorm</option>
            <option>Sand/Dust Storm</option>
            <option>Heavy Rain</option>
            <option>Hail</option>
            <option>Heatwave</option>
            <option>Cold Snap</option>
            <option>Cyclone/Typhoon</option>
          </select>
          <p class="text-[11px] text-slate-500 mt-1">Used to compute an event derate.</p>
        </div>
        <div>
          <label class="label">Event frequency</label>
          <select class="select" v-model="severe_freq">
            <option>Rare</option><option>Seasonal</option><option>Often</option>
          </select>
          <p class="text-[11px] text-slate-500 mt-1">Scales the derate magnitude.</p>
        </div>
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
          <label class="label">Pump power (kilowatts, reference)</label>
          <input type="number" class="input" v-model.number="P_pump_kw" min="0.1" step="0.1"/>
          <p class="text-[11px] text-slate-500 mt-1">For documentation only.</p>
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
      </div>
      <p v-else class="mt-4 text-slate-500 dark:text-slate-400">Click <b>Run sizing</b> to compute results.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

/* =========================
   PRESETS
   ========================= */
type Preset = {
  // demand
  E_bill_month_kwh: number; N_day: number; N_night: number; growth_pct: number;
  // water
  W_month_liters: number; headInput: number; pump_eff: number; P_pump_kw: number;
  S_water: number; beta_water: number;
  // outages
  outage_duration: string; outage_time: string; T_water_extra_h_max: number;
  // pv/site
  PSH: number; PR_base: number; shading_pct: number;
  dust_level: string; severe_event: string; severe_freq: string; S_elec: number;
  A_roof_m2: number; A_ground_m2: number; PD_kwp_per_m2: number;
  DC_AC: number; DoD: number; eta_sys: number;
  // carbon
  baseline: string; EF_grid: number; EF_diesel: number; p_CO2: number;
  // appliances
  selectedApplianceIds: string[];
}

const presets: Record<string, Preset> = {
  home: {
    E_bill_month_kwh: 0, N_day: 4, N_night: 4, growth_pct: 10,
    W_month_liters: 12000, headInput: 8, pump_eff: 0.55, P_pump_kw: 0.75,
    S_water: 7, beta_water: 0.25,
    outage_duration: '30-60m', outage_time: 'Evening', T_water_extra_h_max: 0.5,
    PSH: 4.8, PR_base: 0.78, shading_pct: 5,
    dust_level: 'Medium', severe_event: 'Thunderstorm', severe_freq: 'Seasonal', S_elec: 7,
    A_roof_m2: 100, A_ground_m2: 0, PD_kwp_per_m2: 0.19,
    DC_AC: 1.2, DoD: 0.8, eta_sys: 0.9,
    baseline: 'Grid', EF_grid: 0.6, EF_diesel: 0.8, p_CO2: 6,
    selectedApplianceIds: ['light','fan','router','phone','tv','fridge']
  },
  clinic: {
    E_bill_month_kwh: 0, N_day: 8, N_night: 1, growth_pct: 20,
    W_month_liters: 20000, headInput: 12, pump_eff: 0.6, P_pump_kw: 1.1,
    S_water: 9, beta_water: 0.3,
    outage_duration: '1-2h', outage_time: 'Afternoon', T_water_extra_h_max: 1.0,
    PSH: 4.5, PR_base: 0.78, shading_pct: 3,
    dust_level: 'Medium', severe_event: 'Cyclone/Typhoon', severe_freq: 'Rare', S_elec: 9,
    A_roof_m2: 180, A_ground_m2: 60, PD_kwp_per_m2: 0.19,
    DC_AC: 1.2, DoD: 0.85, eta_sys: 0.9,
    baseline: 'Diesel', EF_grid: 0.6, EF_diesel: 0.8, p_CO2: 10,
    selectedApplianceIds: ['light','router','laptop','clinic','fridge']
  },
  school: {
    E_bill_month_kwh: 0, N_day: 30, N_night: 0, growth_pct: 15,
    W_month_liters: 30000, headInput: 6, pump_eff: 0.55, P_pump_kw: 1.5,
    S_water: 8, beta_water: 0.25,
    outage_duration: '30-60m', outage_time: 'Afternoon', T_water_extra_h_max: 0.5,
    PSH: 5.0, PR_base: 0.8, shading_pct: 2,
    dust_level: 'Low', severe_event: 'Heatwave', severe_freq: 'Seasonal', S_elec: 8,
    A_roof_m2: 350, A_ground_m2: 100, PD_kwp_per_m2: 0.19,
    DC_AC: 1.2, DoD: 0.8, eta_sys: 0.9,
    baseline: 'Grid', EF_grid: 0.6, EF_diesel: 0.8, p_CO2: 6,
    selectedApplianceIds: ['light','router','laptop','fan']
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
  pump_eff.value = p.pump_eff; P_pump_kw.value = p.P_pump_kw
  S_water.value = p.S_water; beta_water.value = p.beta_water
  // outages
  outage_duration.value = p.outage_duration; outage_time.value = p.outage_time
  T_water_extra_h_max.value = p.T_water_extra_h_max
  // pv/site
  PSH.value = p.PSH; PR_base.value = p.PR_base; shading_pct.value = p.shading_pct
  dust_level.value = p.dust_level; severe_event.value = p.severe_event
  severe_freq.value = p.severe_freq; S_elec.value = p.S_elec
  A_roof_m2.value = p.A_roof_m2; A_ground_m2.value = p.A_ground_m2
  PD_kwp_per_m2.value = p.PD_kwp_per_m2
  DC_AC.value = p.DC_AC; DoD.value = p.DoD; eta_sys.value = p.eta_sys
  // carbon
  baseline.value = p.baseline; EF_grid.value = p.EF_grid
  EF_diesel.value = p.EF_diesel; p_CO2.value = p.p_CO2
  // appliances
  appliancesSelected.value = applianceCatalog.map(it =>
    p.selectedApplianceIds.includes(it.id)
  )
}

/* =========================
   INPUT STATE
   ========================= */
const E_bill_month_kwh = ref<number>(0)
const N_day = ref<number>(0)
const N_night = ref<number>(0)
const growth_pct = ref<number>(0)

const W_month_liters = ref<number>(0)
const headInput = ref<number>(0)
const pump_eff = ref<number>(0.55)
const P_pump_kw = ref<number>(0.75)
const S_water = ref<number>(7)
const beta_water = ref<number>(0.3)

const outage_duration = ref<string>('30-60m')
const outage_time = ref<string>('Afternoon')
const T_water_extra_h_max = ref<number>(1.0)

const PSH = ref<number>(4.5)               // Peak Sun Hours
const PR_base = ref<number>(0.78)          // Performance Ratio
const shading_pct = ref<number>(0)

const dust_level = ref<string>('Low')
const severe_event = ref<string>('None')
const severe_freq = ref<string>('Seasonal')
const S_elec = ref<number>(7)

const A_roof_m2 = ref<number>(120)
const A_ground_m2 = ref<number>(0)
const PD_kwp_per_m2 = ref<number>(0.19)

const DC_AC = ref<number>(1.2)             // DC/AC ratio
const DoD = ref<number>(0.8)               // Depth of Discharge
const eta_sys = ref<number>(0.9)           // System efficiency

const baseline = ref<string>('Grid')
const EF_grid = ref<number>(0.6)           // kgCO2/kWh
const EF_diesel = ref<number>(0.8)         // kgCO2/kWh
const p_CO2 = ref<number>(6.0)             // $/tCO2e

const growth_cap = 2.0

/* =========================
   APPLIANCE CATALOG
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

/* =========================
   HELPERS & CALC
   ========================= */
const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b)

function dailySite(): number {
  if (E_bill_month_kwh.value && E_bill_month_kwh.value > 0) return E_bill_month_kwh.value / 30
  return 2.8 * N_day.value + 1.4 * N_night.value
}

function pumpEnergy(): number {
  const head = headInput.value && headInput.value > 0 ? headInput.value : null
  if (head !== null) {
    const rho = 1000, g = 9.81
    const m3_day = (W_month_liters.value / 30) / 1000
    const J = rho * g * head * m3_day
    return Math.max(J / (pump_eff.value * 3.6e6), 0)
  }
  const e_spec = 0.45
  return (W_month_liters.value / 30000) * e_spec
}

const waterFactor = () => 1 + beta_water.value * Math.max(0, (S_water.value - 7) / 3)
const growth = () => Math.min(1 + growth_pct.value / 100, growth_cap)

const E_essential_daily = computed(() => {
  let wh = 0
  appliancesSelected.value.forEach((on, i) => {
    if (on) wh += applianceCatalog[i].powerW * applianceCatalog[i].hoursPerDay
  })
  return wh / 1000
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
  const baseEvent: Record<string, number> = {
    None: 0.00,
    'Thunderstorm':     0.02,
    'Sand/Dust Storm':  0.05,
    'Heavy Rain':       0.03,
    'Hail':             0.04,
    'Heatwave':         0.02,
    'Cold Snap':        0.02,
    'Cyclone/Typhoon':  0.08,
  }
  const freqMult: Record<string, number> = { Rare:0.6, Seasonal:1.0, Often:1.4 }
  return (baseEvent[severe_event.value] ?? 0) * (freqMult[severe_freq.value] ?? 1)
}
const M_priority = () => (S_elec.value >= 8 ? 0.02 : 0) + (S_water.value >= 8 ? 0.02 : 0)
const M_tot = () => Math.min(M_dust() + M_severe() + M_priority(), 0.20)

type Result = {
  E_daily: number; T_aut: number; E_ess: number; E_bat: number;
  PR_eff: number; kWp_raw: number; kWp_cap: number; kWp: number; P_inv: number;
  E_pv_yr: number; E_load_yr: number; E_matched: number; tCO2_yr: number; value_carbon_yr: number;
}
const r = ref<Result | null>(null)

function calc(): void {
  const E_site = dailySite()
  const E_pump = pumpEnergy() * waterFactor()
  const G = growth()
  const E_daily = (E_site + E_pump) * G

  const Taut = autonomyHours()
  const E_aut = E_daily * (Taut / 24)
  const E_ess = Math.min(E_essential_daily.value, E_daily)
  const E_need = Math.max(E_aut, E_ess)
  const E_bat = E_need / (DoD.value * eta_sys.value)

  const PR = PR_eff()
  const kWp_raw = (E_daily / (PSH.value * PR)) * (1 + M_tot())
  const kWp_cap = (A_roof_m2.value + A_ground_m2.value) * PD_kwp_per_m2.value
  const kWp = Math.min(kWp_raw, kWp_cap)
  const P_inv = kWp / DC_AC.value

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
