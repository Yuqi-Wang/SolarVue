<template>
  <section class="grid">
    <!-- Demand -->
    <div class="card">
      <h3>Demand</h3>
      <label>Monthly bill (kWh)
        <input type="number" v-model.number="E_bill_month_kwh" min="0" step="10" />
      </label>
      <div class="row">
        <label>Residents (day)
          <input type="number" v-model.number="N_day" min="0" step="1" />
        </label>
        <label>Residents (night)
          <input type="number" v-model.number="N_night" min="0" step="1" />
        </label>
      </div>
      <label>Growth % (cap 100)
        <input type="number" v-model.number="growth_pct" min="0" max="100" step="1" />
      </label>
    </div>

    <!-- Water & Pump -->
    <div class="card">
      <h3>Water & Pump</h3>
      <label>Water volume (L/month)
        <input type="number" v-model.number="W_month_liters" min="0" step="1000" />
      </label>
      <label>Head (m) (0 = use proxy)
        <input type="number" v-model.number="headInput" min="0" step="1" />
      </label>
      <div class="row">
        <label>Pump efficiency (0–1)
          <input type="number" v-model.number="pump_eff" min="0.1" max="0.9" step="0.05" />
        </label>
        <label>Pump rated power (kW)
          <input type="number" v-model.number="P_pump_kw" min="0.1" step="0.1" />
        </label>
      </div>
      <div class="row">
        <label>Water priority (1–10)
          <input type="number" v-model.number="S_water" min="1" max="10" step="1" />
        </label>
        <label>Water beta (0–0.5)
          <input type="number" v-model.number="beta_water" min="0" max="0.5" step="0.05" />
        </label>
      </div>
    </div>

    <!-- Outages & Critical -->
    <div class="card">
      <h3>Outages & Critical</h3>
      <label>Outage duration
        <select v-model="outage_duration">
          <option>&lt;30m</option><option>30-60m</option>
          <option>1-2h</option><option>&gt;2h</option>
        </select>
      </label>
      <label>Outage time
        <select v-model="outage_time">
          <option>Morning</option><option>Afternoon</option><option>Evening</option>
        </select>
      </label>
      <label>Water autonomy bump max (h)
        <input type="number" v-model.number="T_water_extra_h_max" min="0" max="2" step="0.5" />
      </label>
      <label class="row">
        <input type="checkbox" v-model="essentials_listed" />
        <span>Essentials listed for outage time</span>
      </label>
    </div>

    <!-- PV & Site -->
    <div class="card">
      <h3>PV & Site</h3>
      <div class="row">
        <label>PSH (sun hours)
          <input type="number" v-model.number="PSH" min="2" max="7" step="0.1" />
        </label>
        <label>Base PR
          <input type="number" v-model.number="PR_base" min="0.6" max="0.9" step="0.01" />
        </label>
        <label>Shading (%)
          <input type="number" v-model.number="shading_pct" min="0" max="100" step="1" />
        </label>
      </div>
      <div class="row">
        <label>Dust level
          <select v-model="dust_level">
            <option>Low</option><option>Medium</option><option>Heavy</option>
          </select>
        </label>
        <label>Severe event
          <select v-model="severe_event">
            <option>None</option><option>Storm</option><option>DustStorm</option><option>HeavyRain</option>
          </select>
        </label>
        <label>Event frequency
          <select v-model="severe_freq">
            <option>Rare</option><option>Seasonal</option><option>Often</option>
          </select>
        </label>
      </div>
      <label>Electricity priority (1–10)
        <input type="number" v-model.number="S_elec" min="1" max="10" step="1" />
      </label>
      <div class="row">
        <label>Roof area (m²)
          <input type="number" v-model.number="A_roof_m2" min="0" step="10" />
        </label>
        <label>Ground area (m²)
          <input type="number" v-model.number="A_ground_m2" min="0" step="10" />
        </label>
        <label>Power density (kWp/m²)
          <input type="number" v-model.number="PD_kwp_per_m2" min="0.1" max="0.25" step="0.01" />
        </label>
      </div>
      <div class="row">
        <label>DC/AC ratio
          <input type="number" v-model.number="DC_AC" min="1.0" max="1.6" step="0.05" />
        </label>
        <label>Battery DoD
          <input type="number" v-model.number="DoD" min="0.5" max="0.95" step="0.05" />
        </label>
        <label>System efficiency
          <input type="number" v-model.number="eta_sys" min="0.7" max="1.0" step="0.02" />
        </label>
      </div>
    </div>

    <!-- Carbon -->
    <div class="card">
      <h3>Carbon</h3>
      <label>Baseline
        <select v-model="baseline">
          <option>Grid</option><option>Diesel</option>
        </select>
      </label>
      <div class="row">
        <label>EF grid (kgCO₂/kWh)
          <input type="number" v-model.number="EF_grid" min="0" step="0.05" />
        </label>
        <label>EF diesel (kgCO₂/kWh)
          <input type="number" v-model.number="EF_diesel" min="0" step="0.05" />
        </label>
        <label>Carbon price ($/tCO₂e)
          <input type="number" v-model.number="p_CO2" min="0" step="1" />
        </label>
      </div>
    </div>

    <!-- Results -->
    <div class="card">
      <h3>Results</h3>
      <button class="btn" @click="calc">Run sizing</button>
      <table v-if="r">
        <tr><th>Daily energy (kWh/d)</th><td>{{ r.E_daily.toFixed(2) }}</td></tr>
        <tr><th>Critical fraction</th><td>{{ r.fcrit.toFixed(2) }}</td></tr>
        <tr><th>Autonomy (h)</th><td>{{ r.T_aut.toFixed(2) }}</td></tr>
        <tr><th>Battery energy (kWh)</th><td>{{ r.E_bat.toFixed(2) }}</td></tr>
        <tr><th>PV raw (kWp)</th><td>{{ r.kWp_raw.toFixed(2) }}</td></tr>
        <tr><th>PV cap (kWp)</th><td>{{ r.kWp_cap.toFixed(2) }}</td></tr>
        <tr><th>PV final (kWp)</th><td><b>{{ r.kWp.toFixed(2) }}</b></td></tr>
        <tr><th>Inverter (kW)</th><td>{{ r.P_inv.toFixed(2) }}</td></tr>
        <tr><th>PV energy (kWh/yr)</th><td>{{ Math.round(r.E_pv_yr) }}</td></tr>
        <tr><th>Avoided CO₂ (t/yr)</th><td>{{ r.tCO2_yr.toFixed(2) }}</td></tr>
        <tr><th>Carbon value ($/yr)</th><td>{{ r.value_carbon_yr.toFixed(2) }}</td></tr>
      </table>
      <p v-else class="muted">Click “Run sizing” to see results.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'

/* ------- Inputs (typed) ------- */
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

const outage_duration = ref<string>('30-60m') // "<30m","30-60m","1-2h",">2h"
const outage_time = ref<string>('Afternoon')  // Morning/Afternoon/Evening
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

/* ------- Helpers ------- */
const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b)

function dailySite(): number {
  if (E_bill_month_kwh.value && E_bill_month_kwh.value > 0) return E_bill_month_kwh.value / 30
  return 2.8 * N_day.value + 1.4 * N_night.value
}

function pumpEnergy(): number {
  const head = headInput.value && headInput.value > 0 ? headInput.value : null
  if (head !== null) {
    const rho = 1000.0, g = 9.81
    const m3_day = (W_month_liters.value / 30.0) / 1000.0
    const J = rho * g * head * m3_day
    return Math.max(J / (pump_eff.value * 3.6e6), 0.0)
  }
  const e_spec = 0.45 // kWh/m3 proxy
  return (W_month_liters.value / 30000.0) * e_spec
}

const waterFactor = () => 1 + beta_water.value * Math.max(0, (S_water.value - 7) / 3)
const growth = () => Math.min(1 + growth_pct.value / 100, growth_cap)

const fcrit = () => clamp(0.30 + (essentials_listed.value ? 0.05 : 0), 0.20, 0.40)

function autonomyHours(): number {
  const baseMap: Record<string, number> = {"<30m":0.5,"30-60m":1.0,"1-2h":2.0,">2h":3.0}
  const tMult: Record<string, number> = {"Morning":1.0,"Afternoon":1.2,"Evening":1.5}
  const Tbase = baseMap[outage_duration.value] ?? 1.0
  const kappa = tMult[outage_time.value] ?? 1.0
  const T = Math.max(2.0, Tbase * kappa)
  const bump = T_water_extra_h_max.value * Math.max(0, (S_water.value - 7) / 2.0)
  return T + bump
}

const PR_eff = () => PR_base.value * (1 - shading_pct.value / 100)

const M_dust = () => ({Low:0, Medium:0.05, Heavy:0.10}[dust_level.value] ?? 0)
const M_sev  = () => severe_event.value === 'None' ? 0 :
  0.03 * ({Rare:0.5, Seasonal:1.0, Often:1.5}[severe_freq.value] ?? 1.0)
const M_pri  = () => (S_elec.value >= 8 ? 0.02 : 0) + (S_water.value >= 8 ? 0.02 : 0)
const M_tot  = () => Math.min(M_dust() + M_sev() + M_pri(), 0.20)

/* ------- Result type ------- */
type Result = {
  E_daily: number; fcrit: number; T_aut: number; E_aut: number; E_crit: number; E_bat: number;
  PR_eff: number; kWp_raw: number; kWp_cap: number; kWp: number; P_inv: number;
  E_pv_yr: number; E_load_yr: number; E_matched: number; tCO2_yr: number; value_carbon_yr: number;
}
const r = ref<Result | null>(null)

/* ------- Main calc ------- */
function calc(): void {
  const E_site = dailySite()
  const E_pump = pumpEnergy() * waterFactor()
  const G = growth()
  const E_daily = (E_site + E_pump) * G

  const fc = fcrit()
  const Taut = autonomyHours()
  const E_aut = E_daily * (Taut / 24.0)
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
  const tCO2_yr = E_matched * EF / 1000.0
  const value_carbon_yr = tCO2_yr * p_CO2.value

  r.value = { E_daily, fcrit: fc, T_aut: Taut, E_aut, E_crit, E_bat,
              PR_eff: PR, kWp_raw, kWp_cap, kWp, P_inv,
              E_pv_yr, E_load_yr, E_matched, tCO2_yr, value_carbon_yr }
}
</script>

<style scoped>
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px}
.card{border:1px solid #ddd;border-radius:12px;padding:14px}
.row{display:flex;gap:8px;flex-wrap:wrap}
label{display:block;font-size:12px;color:#555;margin-top:8px}
input,select{width:100%;padding:8px;border:1px solid #ccc;border-radius:8px}
table{width:100%;border-collapse:collapse;margin-top:10px}
th,td{border-bottom:1px solid #eee;padding:6px 4px;text-align:right}
th:first-child,td:first-child{text-align:left}
.btn{margin-top:10px;padding:8px 12px;border:none;border-radius:8px;background:#2563eb;color:#fff;cursor:pointer}
.muted{color:#666;font-size:12px}
</style>
