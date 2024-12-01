import  { createRouter, createWebHashHistory} from 'vue-router'

import LoginVue from '@/Components/loginVue.vue'
import Dashboard from '@/Components/dashboardVue.vue'

const routes = [
    {
        path: '/',
        name: 'login',
        component: LoginVue
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: Dashboard,
        children:[
            {
                path: "/video",
                name: 'video',
                component: () => import('@/Components/videoVue.vue')
            },
            {
                path: '/document',
                name: 'document',
                component: () => import('@/Components/documentVue.vue')
            },
            {
                path: '/navigator',
                name: 'navigator',
                component: () => import('@/Components/navigatorVue.vue')
            }
        ]
    },
]

const router = createRouter({
    history: createWebHashHistory(),
    routes
})

export default router;