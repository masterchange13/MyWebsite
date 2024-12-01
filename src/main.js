import { createApp } from 'vue'
import App from './App.vue'
import { RouterView } from 'vue-router'
import router from '@/route/index'
import elementPlus from 'element-plus'
import 'element-plus/dist/index.css'

const app = createApp(App)
app.use(RouterView)
app.use(router)
app.use(elementPlus)

app.mount('#app');