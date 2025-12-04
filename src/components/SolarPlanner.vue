<template>
  <section class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
    <!-- =========================
         PRESETS
         ========================= -->
    <div class="card">
      <h3 class="text-lg font-semibold mb-1">Presets</h3>
      <p class="text-xs text-slate-500 mb-3">
        Choose a scenario and click <b>Apply preset</b> to prefill typical values, specs, and costs.
      </p>

      <label class="label">Scenario</label>
      <select class="select" v-model="presetKey">
        <option value="home">Home</option>
        <option value="clinic">Clinic</option>
        <option value="school">School</option>
      </select>

      <div class="flex gap-3 mt-3">
        <button class="btn" @click="applyPreset">Apply preset</button>
        <span class="text-xs text-slate-500 self-center">You can edit anything after applying.</span>
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
         OUTAGES, ESSENTIALS
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
         PV & SITE
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
          <input type="number" class="input" v-model.number="PD_kwp_per_m2" min="0.1" max="0.30" step="0.01"/>
          <p class="text-[11px] text-slate-500 mt-1">Includes spacing/BOS; caps PV based on area.</p>
        </div>
      </div>

      <div class="grid md:grid-cols-2 gap-3 mt-3">
        <div>
          <label class="label">Battery depth of discharge (DoD, 0–1)</label>
          <input type="number" class="input" v-model.number="DoD" min="0.5" max="0.95" step="0.05"/>
        </div>
        <div>
          <label class="label">—</label>
          <p class="text-[11px] text-slate-500 mt-1">Severe events & dust in previous version remain available if needed.</p>
        </div>
      </div>
    </div>

    <!-- =========================
         MODULE & BATTERY SPECS (NEW)
         ========================= -->
    <div class="card">
      <h3 class="text-lg font-semibold mb-1">Module & Battery Specs</h3>
      <p class="text-xs text-slate-500 mb-3">
        Used to estimate module count, area and battery space.
      </p>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="label">Module nameplate (W)</label>
          <input type="number" class="input" v-model.number="module_Wp" min="300" max="700" step="10"/>
          <p class="text-[11px] text-slate-500 mt-1">e.g., 550 W for utility/rooftop mono-PERC.</p>
        </div>
        <div>
          <label class="label">Module surface area (m²)</label>
          <input type="number" class="input" v-model.number="module_area_m2" min="1.6" max="2.6" step="0.01"/>
          <p class="text-[11px] text-slate-500 mt-1">Panel glass area (excludes spacing).</p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 mt-3">
        <div>
          <label class="label">Battery packing density (kWh/m³)</label>
          <input type="number" class="input" v-model.number="battery_kWh_per_m3" min="50" max="200" step="5"/>
          <p class="text-[11px] text-slate-500 mt-1">Cabinet-level density (incl. BMS, racks).</p>
        </div>
        <div>
          <label class="label">Battery cabinet height (m)</label>
          <input type="number" class="input" v-model.number="battery_cabinet_h_m" min="1.5" max="2.2" step="0.1"/>
          <p class="text-[11px] text-slate-500 mt-1">Used to estimate floor footprint.</p>
        </div>
      </div>
    </div>

    <!-- =========================
         COSTS (NEW)
         ========================= -->
    <div class="card">
      <h3 class="text-lg font-semibold mb-1">Costs</h3>
      <p class="text-xs text-slate-500 mb-3">
        Edit unit costs. Totals update in Results.
      </p>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="label">Module cost ($/Wp)</label>
          <input type="number" class="input" v-model.number="cost_module_per_Wp" min="0.15" max="0.6" step="0.01"/>
        </div>
        <div>
          <label class="label">BOS cost ($/Wp)</label>
          <input type="number" class="input" v-model.number="cost_bos_per_Wp" min="0.10" max="0.6" step="0.01"/>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 mt-3">
        <div>
          <label class="label">Inverter cost ($/kW)</label>
          <input type="number" class="input" v-model.number="cost_inverter_per_kW" min="60" max="220" step="5"/>
        </div>
        <div>
          <label class="label">Battery cost ($/kWh)</label>
          <input type="number" class="input" v-model.number="cost_battery_per_kWh" min="120" max="400" step="5"/>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 mt-3">
        <div>
          <label class="label">Labor & installation (%)</label>
          <input type="number" class="input" v-model.number="cost_labor_install_pct" min="0" max="40" step="1"/>
        </div>
        <div>
          <label class="label">Miscellaneous / contingency (%)</label>
          <input type="number" class="input" v-model.number="cost_misc_pct" min="0" max="20" step="1"/>
        </div>
      </div>
    </div>

    <!-- =========================
         CARBON
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
     FINANCIAL ASSUMPTIONS (NEW)
     ========================= -->
    <div class="card">
      <h3 class="text-lg font-semibold mb-1">Financial assumptions</h3>
      <p class="text-xs text-slate-500 mb-3">
        These parameters are used to estimate annual savings, cash flow, and payback period.
      </p>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="label">Baseline energy price (US$ per kWh)</label>
          <input
            type="number"
            class="input"
            v-model.number="tariff_usd_per_kWh"
            min="0"
            step="0.01"
          />
          <p class="text-[11px] text-slate-500 mt-1">
            Typical grid or diesel cost. Edit for your context.
          </p>
        </div>
        <div>
          <label class="label">Project lifetime (years)</label>
          <input
            type="number"
            class="input"
            v-model.number="project_life_years"
            min="5"
            max="30"
            step="1"
          />
          <p class="text-[11px] text-slate-500 mt-1">
            Used for cash-flow and cumulative payback chart.
          </p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 mt-3">
        <div>
          <label class="label">Discount rate (real, % per year)</label>
          <input
            type="number"
            class="input"
            v-model.number="discount_rate_pct"
            min="0"
            max="25"
            step="0.5"
          />
          <p class="text-[11px] text-slate-500 mt-1">
            Used for discounted cash-flow (NPV).
          </p>
        </div>
        <div>
          <label class="label">Annual O&amp;M cost (% of total CAPEX)</label>
          <input
            type="number"
            class="input"
            v-model.number="om_pct_of_capex"
            min="0"
            max="10"
            step="0.5"
          />
          <p class="text-[11px] text-slate-500 mt-1">
            Covers operations and maintenance expenses.
          </p>
        </div>
      </div>
    </div>


    <!-- =========================
         RESULTS
         ========================= -->
    <div class="card">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">Results</h3>
        <button class="btn-primary">Run sizing</button>
      </div>

      <div v-if="r" class="mt-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
        <table class="w-full text-sm results-table">
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr><th class="text-left px-4 py-3">Daily energy (kWh/day)</th><td class="px-4 py-3 text-right">{{ r.E_daily.toFixed(2) }}</td></tr>
            <tr><th class="text-left px-4 py-3">Autonomy (hours)</th><td class="px-4 py-3 text-right">{{ r.T_aut.toFixed(2) }}</td></tr>
            <tr><th class="text-left px-4 py-3">Essential energy (kWh/day)</th><td class="px-4 py-3 text-right">{{ r.E_ess.toFixed(2) }}</td></tr>
            <tr><th class="text-left px-4 py-3">Battery energy (kWh, nameplate)</th><td class="px-4 py-3 text-right">{{ r.E_bat.toFixed(2) }}</td></tr>
            <tr><th class="text-left px-4 py-3">PV raw (kWp)</th><td class="px-4 py-3 text-right">{{ r.kWp_raw.toFixed(2) }}</td></tr>
            <tr><th class="text-left px-4 py-3">PV cap (kWp)</th><td class="px-4 py-3 text-right">{{ r.kWp_cap.toFixed(2) }}</td></tr>
            <tr><th class="text-left px-4 py-3">PV final (kWp)</th><td class="px-4 py-3 text-right font-semibold">{{ r.kWp.toFixed(2) }}</td></tr>
            <tr><th class="text-left px-4 py-3">Inverter (kW)</th><td class="px-4 py-3 text-right">{{ r.P_inv.toFixed(2) }}</td></tr>
            <tr><th class="text-left px-4 py-3">PV energy (kWh/year)</th><td class="px-4 py-3 text-right">{{ Math.round(r.E_pv_yr) }}</td></tr>
            <tr><th class="text-left px-4 py-3">Avoided CO₂ (t/year)</th><td class="px-4 py-3 text-right">{{ r.tCO2_yr.toFixed(2) }}</td></tr>
            <tr><th class="text-left px-4 py-3">Carbon value (US$/year)</th><td class="px-4 py-3 text-right">{{ r.value_carbon_yr.toFixed(2) }}</td></tr>

            <!-- NEW: Modules & Areas -->
            <tr><th class="text-left px-4 py-3">Modules needed (pcs)</th><td class="px-4 py-3 text-right">{{ r.modules_count }}</td></tr>
            <tr><th class="text-left px-4 py-3">Module surface area (m²)</th><td class="px-4 py-3 text-right">{{ r.module_surface_area_m2.toFixed(1) }}</td></tr>
            <tr><th class="text-left px-4 py-3">Site area needed (m², incl. spacing)</th><td class="px-4 py-3 text-right">{{ r.site_area_needed_m2.toFixed(1) }}</td></tr>
            <tr><th class="text-left px-4 py-3">Allocated on roof (m²)</th><td class="px-4 py-3 text-right">{{ r.roof_area_used_m2.toFixed(1) }}</td></tr>
            <tr><th class="text-left px-4 py-3">Allocated on ground (m²)</th><td class="px-4 py-3 text-right">{{ r.ground_area_used_m2.toFixed(1) }}</td></tr>
            <tr><th class="text-left px-4 py-3">Area deficit (m²)</th><td class="px-4 py-3 text-right">{{ r.area_deficit_m2.toFixed(1) }}</td></tr>

            <!-- NEW: Battery space -->
            <tr><th class="text-left px-4 py-3">Battery volume (m³)</th><td class="px-4 py-3 text-right">{{ r.battery_volume_m3.toFixed(2) }}</td></tr>
            <tr><th class="text-left px-4 py-3">Battery footprint (m²)</th><td class="px-4 py-3 text-right">{{ r.battery_floor_m2.toFixed(2) }}</td></tr>

            <!-- NEW: Costs -->
            <tr><th class="text-left px-4 py-3">Cost — PV modules</th><td class="px-4 py-3 text-right">{{ fmtUSD(r.cost_modules) }}</td></tr>
            <tr><th class="text-left px-4 py-3">Cost — BOS</th><td class="px-4 py-3 text-right">{{ fmtUSD(r.cost_bos) }}</td></tr>
            <tr><th class="text-left px-4 py-3">Cost — Inverter</th><td class="px-4 py-3 text-right">{{ fmtUSD(r.cost_inverter) }}</td></tr>
            <tr><th class="text-left px-4 py-3">Cost — Battery</th><td class="px-4 py-3 text-right">{{ fmtUSD(r.cost_battery) }}</td></tr>
            <tr><th class="text-left px-4 py-3">Labor & installation</th><td class="px-4 py-3 text-right">{{ fmtUSD(r.cost_labor_install) }}</td></tr>
            <tr><th class="text-left px-4 py-3">Misc / contingency</th><td class="px-4 py-3 text-right">{{ fmtUSD(r.cost_misc) }}</td></tr>
            <tr><th class="text-left px-4 py-3">Total system cost</th><td class="px-4 py-3 text-right font-semibold">{{ fmtUSD(r.cost_total) }}</td></tr>
          </tbody>
        </table>

        <!-- PSH Sensitivity -->
        <div class="p-4">
          <h4 class="font-medium mb-2">PSH Sensitivity (based on selected city)</h4>
          <table class="w-full text-sm results-table">
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

      <!-- Financial summary -->
      <tr v-if="r" class="bg-slate-50/60 dark:bg-slate-800/50">
        <th class="text-left px-4 py-3">Simple payback (years)</th>
        <td class="px-4 py-3 text-right">
          <span v-if="isFinite(r.simple_payback_years)">
            {{ r.simple_payback_years.toFixed(1) }}
          </span>
          <span v-else>—</span>
        </td>
      </tr>
      <tr v-if="r">
        <th class="text-left px-4 py-3">Annual energy savings</th>
        <td class="px-4 py-3 text-right">{{ fmtUSD(r.annual_savings_energy_usd) }}</td>
      </tr>
      <tr v-if="r">
        <th class="text-left px-4 py-3">Annual carbon value</th>
        <td class="px-4 py-3 text-right">{{ fmtUSD(r.annual_savings_carbon_usd) }}</td>
      </tr>
      <tr v-if="r">
        <th class="text-left px-4 py-3">Annual O&amp;M cost</th>
        <td class="px-4 py-3 text-right">{{ fmtUSD(r.annual_om_usd) }}</td>
      </tr>
      <tr v-if="r">
        <th class="text-left px-4 py-3">Net present value (NPV)</th>
        <td class="px-4 py-3 text-right">{{ fmtUSD(r.npv_usd) }}</td>
      </tr>

      <!-- ✅ Cash flow & payback chart (ApexCharts) -->
      <div
        v-if="r && r.cashflow_years.length > 1"
        class="card mt-4"
      >
        <h4 class="text-base font-semibold mb-1">
          Cash flow and project payback
        </h4>
        <p class="text-[11px] text-slate-500 mb-3">
          Columns show annual net cash flow (savings minus O&amp;M); the line shows cumulative cash flow from year 0.
        </p>

        <apexchart
          type="line"
          height="320"
          :options="cashflowChartOptions"
          :series="cashflowChartSeries"
        />
      </div>


      <p v-else class="mt-4 text-slate-500 dark:text-slate-400">Click <b>Run sizing</b> to compute results.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

/* =========================
   TYPES
   ========================= */
type PshBand = { low: number; mid: number; high: number }
type CityPSH = { name: string; psh: PshBand }
type RegionPSH = { name: string; cities: CityPSH[] }
type CountryPSH = { name: string; regions: RegionPSH[] }

/* =========================
   WORLD PSH DATA (trimmed sample; expand as needed)
   ========================= */
const WORLD_PSH: CountryPSH[] = [
  { name: 'India', regions: [
    { name: 'Delhi NCR', cities: [ { name: 'New Delhi', psh: { low: 4.2, mid: 4.7, high: 5.1 } } ] },
    { name: 'Maharashtra', cities: [
      { name: 'Mumbai', psh: { low: 4.5, mid: 5.0, high: 5.5 } },
      { name: 'Pune',   psh: { low: 4.7, mid: 5.2, high: 5.7 } }
    ] },
    { name: 'Rajasthan', cities: [ { name: 'Jaipur', psh: { low: 5.0, mid: 5.5, high: 6.0 } } ] }
  ]},
  { name: 'Nepal', regions: [
    { name: 'Bagmati', cities: [ { name: 'Kathmandu', psh: { low: 4.2, mid: 4.8, high: 5.3 } } ] }
  ]},
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

/* Sensitivity helpers */
const pshLow  = computed(() => WORLD_PSH[countryIdx.value].regions[regionIdx.value].cities[cityIdx.value].psh.low)
const pshMid  = computed(() => WORLD_PSH[countryIdx.value].regions[regionIdx.value].cities[cityIdx.value].psh.mid)
const pshHigh = computed(() => WORLD_PSH[countryIdx.value].regions[regionIdx.value].cities[cityIdx.value].psh.high)

/* =========================
   PRESETS
   ========================= */
type Preset = {
  // demand
  E_bill_month_kwh: number; N_day: number; N_night: number; growth_pct: number;
  // water
  W_month_liters: number; headInput: number; pump_eff: number; P_pump_kw: number; H_pump_hpd: number;
  S_water: number; beta_water: number;
  // outages
  outage_duration: string; outage_time: string; T_water_extra_h_max: number;
  // pv/site
  PSH: number; PR_base: number; shading_pct: number; S_elec: number;
  A_roof_m2: number; A_ground_m2: number; PD_kwp_per_m2: number; DC_AC: number; DoD: number; eta_sys: number;
  // module & battery specs
  module_Wp: number; module_area_m2: number; battery_kWh_per_m3: number; battery_cabinet_h_m: number;
  // carbon
  baseline: string; EF_grid: number; EF_diesel: number; p_CO2: number;
  // appliances (selection + hours)
  selectedApplianceIds: string[]; applianceHours?: Record<string, number>;
  // costs
  cost_module_per_Wp: number; cost_bos_per_Wp: number; cost_inverter_per_kW: number;
  cost_battery_per_kWh: number; cost_labor_install_pct: number; cost_misc_pct: number;
}

const presets: Record<string, Preset> = {
  home: {
    // demand
    E_bill_month_kwh: 0, N_day: 4, N_night: 4, growth_pct: 10,
    // water
    W_month_liters: 12000, headInput: 8, pump_eff: 0.55, P_pump_kw: 0.75, H_pump_hpd: 0.8,
    S_water: 7, beta_water: 0.25,
    // outages
    outage_duration: '30-60m', outage_time: 'Evening', T_water_extra_h_max: 0.5,
    // pv/site
    PSH: 4.8, PR_base: 0.78, shading_pct: 5, S_elec: 7,
    A_roof_m2: 100, A_ground_m2: 0, PD_kwp_per_m2: 0.19, DC_AC: 1.2, DoD: 0.8, eta_sys: 0.9,
    // module & battery
    module_Wp: 550, module_area_m2: 2.1, battery_kWh_per_m3: 100, battery_cabinet_h_m: 2.0,
    // carbon
    baseline: 'Grid', EF_grid: 0.6, EF_diesel: 0.8, p_CO2: 6,
    // appliances
    selectedApplianceIds: ['light','fan','router','phone','tv','fridge'],
    applianceHours: { light: 5, fan: 6, router: 12, phone: 2, tv: 3, fridge: 8 },
    // costs (editable defaults)
    cost_module_per_Wp: 0.25, cost_bos_per_Wp: 0.25, cost_inverter_per_kW: 120,
    cost_battery_per_kWh: 180, cost_labor_install_pct: 12, cost_misc_pct: 5
  },
  clinic: {
    E_bill_month_kwh: 0, N_day: 8, N_night: 1, growth_pct: 20,
    W_month_liters: 20000, headInput: 12, pump_eff: 0.6, P_pump_kw: 1.1, H_pump_hpd: 1.5,
    S_water: 9, beta_water: 0.3,
    outage_duration: '1-2h', outage_time: 'Afternoon', T_water_extra_h_max: 1.0,
    PSH: 4.5, PR_base: 0.78, shading_pct: 3, S_elec: 9,
    A_roof_m2: 180, A_ground_m2: 60, PD_kwp_per_m2: 0.19, DC_AC: 1.2, DoD: 0.85, eta_sys: 0.9,
    module_Wp: 550, module_area_m2: 2.1, battery_kWh_per_m3: 100, battery_cabinet_h_m: 2.0,
    baseline: 'Diesel', EF_grid: 0.6, EF_diesel: 0.8, p_CO2: 10,
    selectedApplianceIds: ['light','router','laptop','clinic','fridge'],
    applianceHours: { light: 8, router: 12, laptop: 4, clinic: 2, fridge: 8 },
    cost_module_per_Wp: 0.27, cost_bos_per_Wp: 0.30, cost_inverter_per_kW: 140,
    cost_battery_per_kWh: 220, cost_labor_install_pct: 15, cost_misc_pct: 7
  },
  school: {
    E_bill_month_kwh: 0, N_day: 30, N_night: 0, growth_pct: 15,
    W_month_liters: 30000, headInput: 6, pump_eff: 0.55, P_pump_kw: 1.5, H_pump_hpd: 1.2,
    S_water: 8, beta_water: 0.25,
    outage_duration: '30-60m', outage_time: 'Afternoon', T_water_extra_h_max: 0.5,
    PSH: 5.0, PR_base: 0.80, shading_pct: 2, S_elec: 8,
    A_roof_m2: 350, A_ground_m2: 100, PD_kwp_per_m2: 0.19, DC_AC: 1.2, DoD: 0.8, eta_sys: 0.9,
    module_Wp: 560, module_area_m2: 2.2, battery_kWh_per_m3: 110, battery_cabinet_h_m: 2.0,
    baseline: 'Grid', EF_grid: 0.6, EF_diesel: 0.8, p_CO2: 6,
    selectedApplianceIds: ['light','router','laptop','fan'],
    applianceHours: { light: 6, router: 10, laptop: 4, fan: 6 },
    cost_module_per_Wp: 0.24, cost_bos_per_Wp: 0.22, cost_inverter_per_kW: 110,
    cost_battery_per_kWh: 170, cost_labor_install_pct: 10, cost_misc_pct: 5
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
  S_elec.value = p.S_elec
  A_roof_m2.value = p.A_roof_m2; A_ground_m2.value = p.A_ground_m2
  PD_kwp_per_m2.value = p.PD_kwp_per_m2
  DC_AC.value = p.DC_AC; DoD.value = p.DoD; eta_sys.value = p.eta_sys
  // module & battery
  module_Wp.value = p.module_Wp; module_area_m2.value = p.module_area_m2
  battery_kWh_per_m3.value = p.battery_kWh_per_m3; battery_cabinet_h_m.value = p.battery_cabinet_h_m
  // carbon
  baseline.value = p.baseline; EF_grid.value = p.EF_grid
  EF_diesel.value = p.EF_diesel; p_CO2.value = p.p_CO2
  // appliances
  appliancesSelected.value = applianceCatalog.map(it => p.selectedApplianceIds.includes(it.id))
  applianceHours.value = applianceCatalog.map(it => p.applianceHours?.[it.id] ?? it.hoursPerDay)
  // costs
  cost_module_per_Wp.value = p.cost_module_per_Wp
  cost_bos_per_Wp.value = p.cost_bos_per_Wp
  cost_inverter_per_kW.value = p.cost_inverter_per_kW
  cost_battery_per_kWh.value = p.cost_battery_per_kWh
  cost_labor_install_pct.value = p.cost_labor_install_pct
  cost_misc_pct.value = p.cost_misc_pct
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
const H_pump_hpd = ref<number>(0)
const S_water = ref<number>(7)
const beta_water = ref<number>(0.3)
// Outages
const outage_duration = ref<string>('30-60m')
const outage_time = ref<string>('Afternoon')
const T_water_extra_h_max = ref<number>(1.0)
// PV/Site
const PSH = ref<number>(4.5)
const PR_base = ref<number>(0.78)
const shading_pct = ref<number>(0)
const S_elec = ref<number>(7)
const A_roof_m2 = ref<number>(120)
const A_ground_m2 = ref<number>(0)
const PD_kwp_per_m2 = ref<number>(0.19)
const DC_AC = ref<number>(1.2)
const DoD = ref<number>(0.8)
const eta_sys = ref<number>(0.9)
// Module & Battery specs
const module_Wp = ref<number>(550)
const module_area_m2 = ref<number>(2.1)
const battery_kWh_per_m3 = ref<number>(100)   // cabinet/system-level packing density
const battery_cabinet_h_m = ref<number>(2.0)  // rack/cabinet height to infer floor area
// Carbon
const baseline = ref<string>('Grid')
const EF_grid = ref<number>(0.6)
const EF_diesel = ref<number>(0.8)
const p_CO2 = ref<number>(6.0)
// Costs
const cost_module_per_Wp = ref<number>(0.25)
const cost_bos_per_Wp = ref<number>(0.25)
const cost_inverter_per_kW = ref<number>(120)
const cost_battery_per_kWh = ref<number>(180)
const cost_labor_install_pct = ref<number>(12)
const cost_misc_pct = ref<number>(5)

// Financial assumptions
const tariff_usd_per_kWh = ref<number>(0.20)      // baseline energy price
const project_life_years = ref<number>(20)        // analysis horizon
const discount_rate_pct = ref<number>(6)          // real discount rate
const om_pct_of_capex = ref<number>(1.5)          // yearly O&M as % of CAPEX


// growth cap
const growth_cap = 2.0

/* =========================
   APPLIANCE CATALOG (editable hours/day)
   ========================= */
const applianceCatalog = [
  { id: 'light',     name: 'LED lighting (2 rooms, 2×10 W)', powerW: 20,   hoursPerDay: 5 },
  { id: 'fan',       name: 'Ceiling fan (conventional)',     powerW: 60,   hoursPerDay: 6 },
  { id: 'router',    name: 'Wi-Fi router',                   powerW: 10,   hoursPerDay: 12 },
  { id: 'phone',     name: 'Phone charging (2×, avg)',       powerW: 10,   hoursPerDay: 2 },
  { id: 'laptop',    name: 'Laptop (typical)',               powerW: 60,   hoursPerDay: 4 },
  { id: 'tv',        name: 'Television (LED)',               powerW: 80,   hoursPerDay: 3 },
  { id: 'fridge',    name: 'Refrigerator (small, 24h avg)',  powerW: 120,  hoursPerDay: 8 },
  { id: 'clinic',    name: 'Clinic essentials (mix)',        powerW: 250,  hoursPerDay: 2 },
]
const appliancesSelected = ref<boolean[]>(applianceCatalog.map(() => false))
const applianceHours = ref<number[]>(applianceCatalog.map(ap => ap.hoursPerDay))

/* =========================
   HELPERS & SUB-FUNCTIONS
   ========================= */
const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b)

function dailySite(): number {
  if (E_bill_month_kwh.value && E_bill_month_kwh.value > 0) return E_bill_month_kwh.value / 30
  return 2.8 * N_day.value + 1.4 * N_night.value
}

function pumpEnergy(): number {
  const m3_day = (W_month_liters.value / 30) / 1000 // liters->m3 per day
  const head = headInput.value && headInput.value > 0 ? headInput.value : 0

  // Physics-based if head provided
  if (head > 0 && pump_eff.value > 0) {
    const rho = 1000, g = 9.81
    const J = rho * g * head * m3_day
    return Math.max(J / (pump_eff.value * 3.6e6), 0) // J -> kWh
  }
  // Runtime method if rated power & hours provided
  if ((P_pump_kw.value ?? 0) > 0 && (H_pump_hpd.value ?? 0) > 0) {
    return P_pump_kw.value * H_pump_hpd.value
  }
  // Volume proxy fallback
  const e_spec = 0.45 // kWh per m3
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

/* =========================
   RESULTS STRUCTURE
   ========================= */
type Result = {
  E_daily: number; T_aut: number; E_ess: number; E_bat: number;
  PR_eff: number; kWp_raw: number; kWp_cap: number; kWp: number; P_inv: number;
  E_pv_yr: number; E_load_yr: number; E_matched: number; tCO2_yr: number; value_carbon_yr: number;
  // new
  modules_count: number; module_surface_area_m2: number;
  site_area_needed_m2: number; roof_area_used_m2: number; ground_area_used_m2: number; area_deficit_m2: number;
  battery_volume_m3: number; battery_floor_m2: number;
  cost_modules: number; cost_bos: number; cost_inverter: number; cost_battery: number;
  cost_labor_install: number; cost_misc: number; cost_total: number;
  // financial / cash-flow
  simple_payback_years: number;
  npv_usd: number;
  annual_savings_energy_usd: number;
  annual_savings_carbon_usd: number;
  annual_om_usd: number;
  cashflow_years: number[];
  cashflow_net: number[];           // net cashflow each year (incl. year 0)
  cashflow_cumulative: number[];    // cumulative cashflow

}
const r = ref<Result | null>(null)

// ✅ NEW: chart series for ApexCharts
const cashflowChartSeries = computed(() => {
  if (!r.value || r.value.cashflow_years.length === 0) return []

  return [
    {
      name: 'Net cashflow (US$ / year)',
      type: 'column' as const,
      data: r.value.cashflow_net
    },
    {
      name: 'Cumulative cashflow (US$)',
      type: 'line' as const,
      data: r.value.cashflow_cumulative
    }
  ]
})

// ✅ NEW: chart options for ApexCharts
const cashflowChartOptions = computed(() => {
  if (!r.value) {
    return {
      chart: { toolbar: { show: false } },
      xaxis: { categories: [] as number[] }
    }
  }

  return {
    chart: {
      id: 'cashflow-chart',
      stacked: false,
      toolbar: { show: false }
    },
    stroke: {
      width: [0, 3],
      curve: 'smooth'
    },
    dataLabels: {
      enabled: true,
      enabledOnSeries: [1], // labels only on cumulative line
      formatter: (val: number) => formatCompact(val) // ✅ brief labels on the line
    },
    xaxis: {
      categories: r.value.cashflow_years,
      title: { text: 'Year' },
      labels: {
        formatter: (value: string) => value // year numbers are already short
      }
    },
    yaxis: [
      {
        title: { text: 'Net cashflow (US$ / year)' },
        labels: {
          formatter: (value: number) => formatCompact(value) // ✅ compact axis
        }
      },
      {
        opposite: true,
        title: { text: 'Cumulative cashflow (US$)' },
        labels: {
          formatter: (value: number) => formatCompact(value) // ✅ compact axis
        }
      }
    ],
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (value: number) => {
          // show a short number but still indicate it's US$
          return 'US$ ' + formatCompact(value)
        }
      }
    },
    legend: {
      position: 'top'
    }
  }
})


/* kWp at a given PSH (for sensitivity table) */
function kWpAt(psh: number) {
  const PR = PR_eff()
  const E_daily_now = (dailySite() + pumpEnergy() * waterFactor()) * growth()
  const kWp_raw = (E_daily_now / (psh * PR))
  const kWp_cap = (A_roof_m2.value + A_ground_m2.value) * PD_kwp_per_m2.value
  return Math.min(kWp_raw, kWp_cap)
}

/* CURRENCY */
function fmtUSD(n: number) {
  return Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
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

  // 3) PV sizing (no extra event margins to keep UX compact here)
  const PR = PR_eff()
  const kWp_raw = (E_daily / (PSH.value * PR))
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

  // 5) Modules and area
  const modules_count = Math.max(1, Math.ceil(kWp * 1000 / module_Wp.value))
  const module_surface_area_m2 = modules_count * module_area_m2.value

  // Site area (includes BOS spacing via PD)
  const site_area_needed_m2 = (kWp / PD_kwp_per_m2.value) || 0
  // Allocate roof first, then ground
  const roof_use = Math.min(site_area_needed_m2, A_roof_m2.value)
  const ground_use = Math.min(Math.max(site_area_needed_m2 - roof_use, 0), A_ground_m2.value)
  const area_deficit = Math.max(site_area_needed_m2 - (roof_use + ground_use), 0)

  // 6) Battery space
  const battery_volume_m3 = (E_bat / battery_kWh_per_m3.value) || 0
  const battery_floor_m2 = battery_volume_m3 / Math.max(1e-6, battery_cabinet_h_m.value)

  // 7) Costs
  const cost_modules = kWp * 1000 * cost_module_per_Wp.value
  const cost_bos = kWp * 1000 * cost_bos_per_Wp.value
  const cost_inverter = P_inv * cost_inverter_per_kW.value
  const cost_battery = E_bat * cost_battery_per_kWh.value
  const subtotal = cost_modules + cost_bos + cost_inverter + cost_battery
  const cost_labor_install = subtotal * (cost_labor_install_pct.value / 100)
  const cost_misc = (subtotal + cost_labor_install) * (cost_misc_pct.value / 100)
  const cost_total = subtotal + cost_labor_install + cost_misc

  // 8) Financials and cash-flow

  // Annual savings from energy (baseline price) and carbon credit
  const annual_savings_energy_usd = E_matched * tariff_usd_per_kWh.value
  const annual_savings_carbon_usd = value_carbon_yr
  const annual_om_usd = cost_total * (om_pct_of_capex.value / 100)

  const annual_net_benefit = annual_savings_energy_usd + annual_savings_carbon_usd - annual_om_usd

  // Simple payback (years) – ignore discounting
  const simple_payback_years =
    annual_net_benefit > 0 ? cost_total / annual_net_benefit : Infinity

  // Build cash-flow arrays (year 0 .. project_life_years)
  const years: number[] = []
  const cf_net: number[] = []
  const cf_cum: number[] = []

  const n = Math.max(1, Math.round(project_life_years.value))
  const r_disc = discount_rate_pct.value / 100
  let npv_usd = -cost_total    // year 0 cashflow discounted

  let cumulative = -cost_total

  for (let y = 0; y <= n; y++) {
    years.push(y)

    if (y === 0) {
      cf_net.push(-cost_total)
      cf_cum.push(cumulative)
      // year 0 already in NPV above
      continue
    }

    const cf_y = annual_net_benefit
    cumulative += cf_y
    cf_net.push(cf_y)
    cf_cum.push(cumulative)

    const disc_factor = 1 / Math.pow(1 + r_disc, y)
    npv_usd += cf_y * disc_factor
  }

  r.value = {
    E_daily, T_aut: Taut, E_ess, E_bat, PR_eff: PR,
    kWp_raw, kWp_cap, kWp, P_inv,
    E_pv_yr, E_load_yr, E_matched, tCO2_yr, value_carbon_yr,
    modules_count, module_surface_area_m2,
    site_area_needed_m2, roof_area_used_m2: roof_use, ground_area_used_m2: ground_use, area_deficit_m2: area_deficit,
    battery_volume_m3, battery_floor_m2,
    cost_modules, cost_bos, cost_inverter, cost_battery, cost_labor_install, cost_misc, cost_total,
    
    // financial
    simple_payback_years,
    npv_usd,
    annual_savings_energy_usd,
    annual_savings_carbon_usd,
    annual_om_usd,
    cashflow_years: years,
    cashflow_net: cf_net,
    cashflow_cumulative: cf_cum,
  }
}

function formatCompact(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1_000_000) {
    return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  } else if (abs >= 1_000) {
    return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k'
  } else {
    return n.toFixed(0)
  }
}



</script>

<style scoped>
.card { @apply rounded-2xl border border-slate-200 p-4 bg-white shadow-sm; }
.label { @apply block text-sm font-medium mb-1; }
.input { @apply w-full border rounded-lg px-3 py-2 outline-none focus:ring; }
.select { @apply w-full border rounded-lg px-3 py-2 outline-none focus:ring bg-white; }
.btn { @apply inline-flex items-center justify-center rounded-lg px-3 py-2 border bg-slate-900 text-white hover:opacity-90; }
</style>
