import { createApp } from 'vue'
import App from './App.vue'

// ICONS
import AppIcon from './components/AppIcon.vue'


// Styles lokal
import './assets/styles/main.css'
import './assets/styles/dirtyBadge.css'

// Import Tabulator CSS v6.3.1 (atau theme yang disukai)
import 'tabulator-tables/dist/css/tabulator.min.css'

// Theme Utils
import { applyThemeColors } from './utils/theme.js'

// Jalankan penataan warna CSS Variables
applyThemeColors()

// Inisialisasi App
const app = createApp(App)

// Mount Aplikasi
app.mount('#app')
app.component('AppIcon', AppIcon)