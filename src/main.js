import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { applyThemeColors } from './utils/theme.js'
 


// Import style dirty badge global
import './assets/styles/dirtyBadge.css'
// Jalankan penataan warna CSS Variables dari colors.js
applyThemeColors()// Jalankan penataan warna CSS Variables dari colors.js
 
createApp(App).mount('#app')
