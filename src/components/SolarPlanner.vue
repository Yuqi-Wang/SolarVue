<template>
  <section class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
    <!-- Demand -->
    <div class="card">
      <h3 class="text-lg font-semibold mb-3">Demand</h3>
      <label class="label">Monthly bill (kWh)</label>
      <input type="number" class="input" v-model.number="E_bill_month_kwh" min="0" step="10"/>

      <div class="grid grid-cols-2 gap-3 mt-3">
        <div>
          <label class="label">Residents (day)</label>
          <input type="number" class="input" v-model.number="N_day" min="0"/>
        </div>
        <div>
          <label class="label">Residents (night)</label>
          <input type="number" class="input" v-model.number="N_night" min="0"/>
        </div>
      </div>

      <div class="mt-3">
        <label class="label">Growth % (cap 100)</label>
        <input type="number" class="input" v-model.number="growth_pct" min="0" max="100"/>
      </div>
    </div>

    <!-- Water & Pump -->
    <div class="card">
      <h3 class="text-lg font-semibold mb-3">Water & Pump</h3>
      <label class="label">Water volume (L/month)</label>
      <input type="number" class="input" v-model.number="W_month_liters" min="0" step="1000"/>

      <div class="grid grid-cols-3 gap-3 mt-3">
        <div>
          <label class="label">Head (m) (0 = proxy)</label>
          <input type="number" class="input" v-model.number="headInput" min="0"/>
        </div>
        <div>
          <label class="label">Pump eff. (0–1)</label>
          <input type="number" class="input" v-model.number="pump_eff" min="0.1" max="0.9" step="0.05"/>
        </div>
        <div>
          <label class="label">Pump power (kW)</label>
          <input type="number" class="input" v-model.number="P_pump_kw" min="0.1" step="0.1"/>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 mt-3">
        <div>
          <label class="label">Water priority (1–10)</label>
          <input type="number" class="input" v-model.number="S_water" min="1" max="10"/>
        </div>
        <div>
          <label class="label">Water beta (0–0.5)</label>
          <input type="number" class="input" v-model.number="beta_water" min="0" max="0.5" step="0.05"/>
        </div>
      </div>
    </div>

    <!-- Outages & Critical -->
    <div class="card">
      <h3 class="text-lg font-semibold mb-3">Outages & Critical</h3>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="label">Outage duration</label>
          <select class="select" v-model="outage_duration">
            <option>&lt;30m</option><option>30-60m</option>
            <option>1-2h</option><option>&gt;2h</option>
          </select>
        </div>
        <div>
          <label class="label">Outage time</label>
          <select class="select" v-model="outage_time">
            <option>Morning</option><option>Afternoon</option><option>Evening</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 mt-3">
        <div>
          <label class="label">Water autonomy bump max (h)</label>
          <input type="number" class="input" v-model.number="T_water_extra_h_max" min="0" max="2" step="0.5"/>
        </div>
        <label class="label mt-7 flex items-center gap-2">
          <input type="checkbox" v-model="essentials_listed" class="h-4 w-4"/>
          Essentials listed for outage time
        </label>
      </div>
    </div>

    <!-- PV & Site -->
    <div class="card xl:col-span-2">
      <h3 class="text-lg font-semibold mb-3">PV & Site</h3>
      <div class="grid md:grid-cols-3 gap-3">
        <div>
          <label class="label">PSH (sun hours)</label>
          <input type="number" class="input" v-model.number="PSH" min="2" max="7" step="0.1"/>
        </div>
        <div>
          <label class="label">Base PR</label>
          <input type="number" class="input" v-model.number="PR_base" min="0.6" max="0.9" step="0.01"/>
        </div>
        <div>
          <label class="label">Shading (%)</label>
          <input type="number" class="input" v-model.number="shading_pct" min="0" max="100"/>
        </div>
      </div>

      <div class="grid md:grid-cols-3 gap-3 mt-3">
        <div>
          <label class="label">Dust level</label>
          <select class="select" v-model="dust_level">
            <option>Low</option><option>Medium</option><option>Heavy</option>
          </select>
        </div>
        <div>
          <label class="label">Severe event</label>
          <select class="select" v-model="severe_event">
            <option>None</option><option>Storm</option><option>DustStorm</option><option>HeavyRain</option>
          </select>
        </div>
        <div>
          <label class="label">Event frequency</label>
          <select class="select" v-model="severe_freq">
            <option>Rare</option><option>Seasonal</option><option>Often</option>
          </select>
        </div>
      </div>

      <div class="grid md:grid-cols-3 gap-3 mt-3">
        <div>
          <label class="label">Electricity priority (1–10)</label>
          <input type="number" class="input" v-model.number="S_elec" min="1" max="10"/>
        </div>
        <div>
          <label class="label">DC/AC ratio</label>
          <input type="number" class="input" v-model.number="DC_AC" min="1.0" max="1.6" step="0.05"/>
        </div>
        <div>
          <label class="label">System efficiency</label>
          <input type="number" class="input" v-model.number="eta_sys" min="0.7" max="1.0" step="0.02"/>
        </div>
      </div>

      <div class="grid md:grid-cols-3 gap-3 mt-3">
        <div>
          <label class="label">Roof area (m²)</label>
          <input type="number" class="input" v-model.number="A_roof_m2" min="0" step="10"/>
        </div>
        <div>
          <label class="label">Ground area (m²)</label>
          <input type="number" class="input" v-model.number="A_ground_m2" min="0" step="10"/>
        </div>
        <div>
          <label class="label">Power density (kWp/m²)</label>
          <input type="number" class="input" v-model.number="PD_kwp_per_m2" min="0.1" max="0.25" step="0.01"/>
        </div>
      </div>

      <div class="grid md:grid-cols-2 gap-3 mt-3">
        <div>
          <label class="label">Battery DoD</label>
          <input type="number" class="input" v-model.number="DoD" min="0.5" max="0.95" step="0.05"/>
        </div>
        <div>
          <label class="label">Pump power (kW) (for ref)</label>
          <input type="number" class="input" v-model.number="P_pump_kw" min="0.1" step="0.1"/>
        </div>
      </div>
    </div>

    <!-- Carbon -->
    <div class="card">
      <h3 class="text-lg font-semibold mb-3">Carbon</h3>
      <label class="label">Baseline</label>
      <select class="select" v-model="baseline">
        <option>Grid</option><option>Diesel</option>
      </select>

      <div class="grid grid-cols-3 gap-3 mt-3">
        <div>
          <label class="label">EF grid (kgCO₂/kWh)</label>
          <input type="number" class="input" v-model.number="EF_grid" min="0" step="0.05"/>
        </div>
        <div>
          <label class="label">EF diesel (kgCO₂/kWh)</label>
          <input type="number" class="input" v-model.number="EF_diesel" min="0" step="0.05"/>
        </div>
        <div>
          <label class="label">Carbon price ($/tCO₂e)</label>
          <input type="number" class="input" v-model.number="p_CO2" min="0" step="1"/>
        </div>
      </div>
    </div>

    <!-- Results -->
    <div class="card xl:col-span-3">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">Results</h3>
        <button class="btn" @click="calc">Run sizing</button>
      </div>

      <div v-if="r" class="mt-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
        <table class="w-full text-sm">
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr class="bg-slate-50/60 dark:bg-slate-800/50"><th class="text-left px-4 py-3">Daily energy (kWh/d)</th><td class="px-4 py-3 text-right">{{ r.E_daily.toFixed(2) }}</td></tr>
            <tr><th class="text-left px-4 py-3">Critical fraction</th><td class="px-4 py-3 text-right">{{ r.fcrit.toFixed(2) }}</td></tr>
            <tr><th class="text-left px-4 py-3">Autonomy (h)</th><td class="px-4 py-3 text-right">{{ r.T_aut.toFixed(2) }}</td></tr>
            <tr><th class="text-left px-4 py-3">Battery energy (kWh)</th><td class="px-4 py-3 text-right">{{ r.E_bat.toFixed(2) }}</td></tr>
            <tr><th class="text-left px-4 py-3">PV raw (kWp)</th><td class="px-4 py-3 text-right">{{ r.kWp_raw.toFixed(2) }}</td></tr>
            <tr><th class="text-left px-4 py-3">PV cap (kWp)</th><td class="px-4 py-3 text-right">{{ r.kWp_cap.toFixed(2) }}</td></tr>
            <tr class="bg-slate-50/60 dark:bg-slate-800/50"><th class="text-left px-4 py-3">PV final (kWp)</th><td class="px-4 py-3 text-right font-semibold">{{ r.kWp.toFixed(2) }}</td></tr>
            <tr><th class="text-left px-4 py-3">Inverter (kW)</th><td class="px-4 py-3 text-right">{{ r.P_inv.toFixed(2) }}</td></tr>
            <tr><th class="text-left px-4 py-3">PV energy (kWh/yr)</th><td class="px-4 py-3 text-right">{{ Math.round(r.E_pv_yr) }}</td></tr>
            <tr><th class="text-left px-4 py-3">Avoided CO₂ (t/yr)</th><td class="px-4 py-3 text-right">{{ r.tCO2_yr.toFixed(2) }}</td></tr>
            <tr><th class="text-left px-4 py-3">Carbon value ($/yr)</th><td class="px-4 py-3 text-right">{{ r.value_carbon_yr.toFixed(2) }}</td></tr>
          </tbody>
        </table>
      </div>
      <p v-else class="mt-4 text-slate-500 dark:text-slate-400">Click <b>Run sizing</b> to compute results.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'

/* Inputs */
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
const essentials_listed = ref<boolean>(false)
const PSH = ref<number>(4.5)
const PR_base = ref<number>(0.78)
const shading_pct = ref<number>(0)
const dust_level = ref<string>('Low')
const severe_event = ref<string>('None')
const severe_freq = ref<string>('Seasonal')
const S_elec = ref<number>(7)
const A_roof_m2 = ref<number>(120)
const A_ground_m2 = ref<number>(0)
const PD_kwp_per_m2 = ref<number>(0.19)
const DC_AC = ref<number>(1.2)
const DoD = ref<number>(0.8)
const eta_sys = ref<number>(0.9)
const baseline = ref<string>('Grid')
const EF_grid = ref<number>(0.6)
const EF_diesel = ref<number>(0.8)
const p_CO2 = ref<number>(6.0)
const growth_cap = 2.0

/* Helpers */
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
const fcrit = () => clamp(0.30 + (essentials_listed.value ? 0.05 : 0), 0.20, 0.40)
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
const M_dust = () => ({Low:0, Medium:0.05, Heavy:0.10}[dust_level.value] ?? 0)
const M_sev  = () => severe_event.value === 'None' ? 0 :
  0.03 * ({Rare:0.5, Seasonal:1.0, Often:1.5}[severe_freq.value] ?? 1)
const M_pri  = () => (S_elec.value >= 8 ? 0.02 : 0) + (S_water.value >= 8 ? 0.02 : 0)
const M_tot  = () => Math.min(M_dust() + M_sev() + M_pri(), 0.20)

/* Result type */
type Result = {
  E_daily: number; fcrit: number; T_aut: number; E_aut: number; E_crit: number; E_bat: number;
  PR_eff: number; kWp_raw: number; kWp_cap: number; kWp: number; P_inv: number;
  E_pv_yr: number; E_load_yr: number; E_matched: number; tCO2_yr: number; value_carbon_yr: number;
}
const r = ref<Result | null>(null)

/* Main calc */
function calc(): void {
  const E_site = dailySite()
  const E_pump = pumpEnergy() * waterFactor()
  const G = growth()
  const E_daily = (E_site + E_pump) * G

  const fc = fcrit()
  const Taut = autonomyHours()
  const E_aut = E_daily * (Taut / 24)
  const E_crit = fc * E_daily
  const E_need = Math.max(E_crit, E_aut)
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

  r.value = { E_daily, fcrit: fc, T_aut: Taut, E_aut, E_crit, E_bat, PR_eff: PR,
              kWp_raw, kWp_cap, kWp, P_inv, E_pv_yr, E_load_yr, E_matched, tCO2_yr, value_carbon_yr }
}
</script>
