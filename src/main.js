import { createApp } from 'vue';
import App from './App.vue';
import { createRouter, createWebHistory } from 'vue-router'; // 引入 vue-router
import router from '@/route/index'; // 确保这是你的路由配置文件
import elementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import { createPinia } from 'pinia'; // 导入 createPinia
import piniaPersist from 'pinia-plugin-persistedstate'
import request from '@/utils/request'


const app = createApp(App);

// 使用 pinia
const pinia = createPinia();
pinia.use(piniaPersist);
app.use(pinia);

// 使用 router
app.use(router);

// 使用 element-plus
app.use(elementPlus);

// 注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
}

request.get('/csrf/')   // 🔥 这一步就是“领 CSRF 身份证”

// 挂载应用
app.mount('#app');
