import { createApp } from 'vue';
import App from './App.vue';
import router from '@/route/index';
import elementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import { createPinia } from 'pinia';
import piniaPersist from 'pinia-plugin-persistedstate'
import request from '@/utils/request'

const app = createApp(App);

const pinia = createPinia();
pinia.use(piniaPersist);
app.use(pinia);

app.use(router);
app.use(elementPlus);

app.mount('#app');

// 预取 CSRF cookie（不影响渲染）
request.get('/csrf/', { showLoading: false, silentError: true }).catch(() => {});
