// import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './assets/hub.css'

const app = createApp(App)

// Remove credentials left by the previous JWT-based client.
localStorage.removeItem('accessToken')
localStorage.removeItem('refreshToken')

app.use(createPinia())
app.use(router)

app.mount('#app')
