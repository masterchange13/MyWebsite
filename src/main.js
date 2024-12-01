import { createApp } from 'vue'
import App from './App.vue'
import { RouterView } from 'vue-router'
import router from '@/route/index'
import elementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const app = createApp(App)
app.use(RouterView)
app.use(router)
app.use(elementPlus)
// icons
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
  }

app.mount('#app');