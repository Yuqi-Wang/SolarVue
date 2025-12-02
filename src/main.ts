import './style.css'
import { createApp } from 'vue'
import App from './APP.vue'


// ✅ NEW: import VueApexCharts
import VueApexCharts from 'vue3-apexcharts'

const app = createApp(App)

// ✅ register the component/plugin so <apexchart> is available
app.use(VueApexCharts)
app.component('apexchart', VueApexCharts)

app.mount('#app')
