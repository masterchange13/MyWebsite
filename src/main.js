import { createApp } from 'vue';
import App from './App.vue';
import router from '@/route/index'; // 确保这是你的路由配置文件
import elementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import { createPinia } from 'pinia'; // 导入 createPinia
import piniaPersist from 'pinia-plugin-persistedstate'
import request from '@/utils/request'
import { useWebsiteSettingsStore } from '@/stores/websiteSettingsStore'


const app = createApp(App);

// 使用 pinia
const pinia = createPinia();
pinia.use(piniaPersist);
app.use(pinia);

// 使用 router
app.use(router);

// 使用 element-plus
app.use(elementPlus);

app.mount('#app')

(async () => {
  try {
    await request.get('/csrf/', { showLoading: false, silentError: true })
  } catch {}
  const websiteSettingsStore = useWebsiteSettingsStore(pinia)
  await websiteSettingsStore.loadSettings()
})()
